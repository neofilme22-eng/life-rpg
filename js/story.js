// ============================================================
// ===== MODO HISTORIA (cada DLC trae su propia historia) =====
// La historia de un DLC vive en su JSON (capítulos, decisiones, finales) y
// se desbloquea SOLO con misiones de ese DLC:
//  - Los capítulos de la trama van en orden (slot 1, 2, 3...). Se abren
//    cuando se cumple su condición "unlock", y si el anterior tenía una
//    decisión, hace falta haberla tomado.
//  - Los especiales los abren las secundarias y aparecen intercalados
//    (sin candado: son sorpresa).
//  - Al cerrarse el DLC (última principal cumplida) se abre el final.
//  - Pausar un DLC detiene sus capítulos y oculta sus misiones.
// ============================================================

// Texto del JSON -> HTML seguro (solo **negrita** y *cursiva*)
function storyFmt(t) {
    return escapeHtml(String(t))
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// Lista de párrafos: un párrafo puede ser texto o { if, p, else }
function storyParagraphs(dlc, list) {
    var out = [];
    (list || []).forEach(function (el) {
        if (typeof el === 'string') { out.push(el); return; }
        if (el && typeof el === 'object') {
            if (evalDlcCond(dlc, el.if)) { if (el.p) out.push(el.p); }
            else if (el.else) out.push(el.else);
        }
    });
    return out.map(storyFmt).join('<br><br>');
}

// ----- Orden de lectura de un DLC -----
// Devuelve entradas: { kind: 'main'|'lock'|'special'|'ending'|'endlock', ch, slot, ending }
function storyBuildList(dlc) {
    var list = [];
    var trama = dlc.chapters.filter(function (c) { return !c.special; });
    var slots = [];
    trama.forEach(function (c) { if (slots.indexOf(c.slot) === -1) slots.push(c.slot); });
    slots.sort(function (a, b) { return a - b; });

    slots.forEach(function (s) {
        var variants = trama.filter(function (c) { return c.slot === s; });
        // Si ya se abrió una variante, esa es la del slot; si no, la que cumpla su onlyIf
        var chosen = variants.find(function (c) { return dlc.opened.indexOf(c.id) !== -1; }) ||
            variants.find(function (c) { return !c.onlyIf || evalDlcCond(dlc, c.onlyIf); });
        if (chosen) list.push({ kind: 'main', ch: chosen, slot: s });
        else list.push({ kind: 'lock', slot: s });

        dlc.chapters.forEach(function (sp) {
            if (sp.special && sp.afterSlot === s && dlc.opened.indexOf(sp.id) !== -1) list.push({ kind: 'special', ch: sp, slot: s });
        });
    });

    var ending = dlc.endingId ? dlc.endings.find(function (e) { return e.id === dlc.endingId; }) : null;
    if (ending && dlc.opened.indexOf('__ending') !== -1) list.push({ kind: 'ending', ending: ending });
    else list.push({ kind: 'endlock' });
    return list;
}

function storyOpen(dlc, id) {
    if (dlc.opened.indexOf(id) !== -1) return false;
    dlc.opened.push(id);
    return true;
}

// Abre lo que corresponda en un DLC. Devuelve los capítulos recién abiertos.
function storyUnlockDlc(dlc) {
    var newly = [];
    var list = storyBuildList(dlc);
    var gate = true;      // el capítulo anterior está abierto y decidido

    list.forEach(function (e) {
        if (e.kind === 'main') {
            var ch = e.ch;
            var isOpen = dlc.opened.indexOf(ch.id) !== -1;
            if (!isOpen && gate && evalDlcCond(dlc, ch.unlock)) {
                storyOpen(dlc, ch.id); newly.push(ch.title); isOpen = true;
            }
            if (!isOpen || (ch.choices && ch.choices.length && !dlc.choices[ch.id])) gate = false;
        } else if (e.kind === 'lock') {
            gate = false;
        }
    });

    // Especiales: se abren con sus propias condiciones, una vez abierto el capítulo del que cuelgan
    dlc.chapters.forEach(function (sp) {
        if (!sp.special || dlc.opened.indexOf(sp.id) !== -1) return;
        var anchor = list.find(function (e) { return e.kind === 'main' && e.slot === sp.afterSlot; });
        if (!anchor || dlc.opened.indexOf(anchor.ch.id) === -1) return;
        if (evalDlcCond(dlc, sp.unlock)) { storyOpen(dlc, sp.id); newly.push(sp.title); }
    });

    // Final: DLC cerrado, toda la trama abierta y todas las decisiones tomadas
    if (dlc.closed && dlc.opened.indexOf('__ending') === -1) {
        var ready = storyBuildList(dlc).every(function (e) {
            if (e.kind === 'lock') return false;
            if (e.kind === 'main') return dlc.opened.indexOf(e.ch.id) !== -1 && !(e.ch.choices && e.ch.choices.length && !dlc.choices[e.ch.id]);
            return true;
        });
        if (ready) {
            var ending = dlc.endings.find(function (e) { return !e.default && e.if && evalDlcCond(dlc, e.if); }) ||
                dlc.endings.find(function (e) { return e.default; });
            if (ending) {
                dlc.endingId = ending.id;
                storyOpen(dlc, '__ending');
                newly.push(ending.title);
            }
        }
    }
    return newly;
}

function checkStoryUnlocks() {
    var changed = false;
    (player.dlcs || []).forEach(function (dlc) {
        if (!dlc.active) return;                 // un DLC pausado no abre capítulos
        var newly = storyUnlockDlc(dlc);
        if (newly.length) {
            changed = true;
            newly.forEach(function (title) {
                setTimeout(function () {
                    addLogEntry('story', 'Nuevo capítulo: "' + title + '"', 'Expediente ' + dlc.file, 0, 0, null);
                    showToast('Nuevo capítulo desbloqueado: "' + title + '"', 'success', 'Historia');
                }, 500);
            });
        }
    });
    if (changed) {
        saveGame();
        renderStory();
        if (typeof renderTrophies === 'function') renderTrophies();
    }
}

// ----- Acciones -----
function toggleStoryDlc(idx) {
    var dlc = player.dlcs[idx];
    if (!dlc || dlc.closed) return;
    dlc.active = !dlc.active;
    refreshSecondaries();
    showToast(dlc.active
        ? 'Expediente ' + dlc.file + ' activo: sus misiones vuelven al tablón.'
        : 'Expediente ' + dlc.file + ' en pausa. Tu progreso queda guardado.', dlc.active ? 'success' : 'info', 'Historia');
    saveGame();
    renderStory();
    renderMissions();
    if (dlc.active) checkStoryUnlocks();
}

function toggleStoryChapter(idx, chapterId) {
    var dlc = player.dlcs[idx];
    var body = document.getElementById('story-body-' + idx + '-' + chapterId);
    var card = document.getElementById('story-card-' + idx + '-' + chapterId);
    if (!dlc || !body || !card) return;

    if (card.classList.contains('open')) {
        card.classList.remove('open');
        return;
    }
    card.classList.add('open');
    if (dlc.read.indexOf(chapterId) === -1) {
        dlc.read.push(chapterId);
        saveGame();
        var badge = document.getElementById('story-new-' + idx + '-' + chapterId);
        if (badge) badge.remove();
    }
}

function makeStoryChoice(idx, chapterId, choiceId) {
    var dlc = player.dlcs[idx];
    if (!dlc || !dlc.active) {
        showToast('Este expediente está en pausa. Actívalo para decidir.', 'warning', 'Historia');
        return;
    }
    if (dlc.choices[chapterId]) return;
    var chapter = dlc.chapters.find(function (c) { return c.id === chapterId; });
    var choice = chapter && (chapter.choices || []).find(function (x) { return x.id === choiceId; });
    if (!choice) return;
    if (choice.if && !evalDlcCond(dlc, choice.if)) {
        showToast('Todavía no cumples el requisito de esa opción.', 'warning', 'Historia');
        return;
    }

    dlc.choices[chapterId] = choiceId;
    (choice.set || []).forEach(function (f) { dlc.flags[f] = true; });
    saveGame();
    addLogEntry('story', 'Decisión tomada en "' + chapter.title + '"', choice.label, 0, 0, null);
    showToast('Elegiste: "' + choice.label + '"', 'info', 'Historia');

    renderStory();
    checkStoryUnlocks();
    checkAndUnlockTrophies();
}

// ============================================================
// ===== RENDER =====
// ============================================================

var storyCampOpen = {};   // qué expedientes están desplegados (se conserva al redibujar)

function storyCardHTML(idx, dlc, entry, number, isNew) {
    var ch = entry.ch;
    var title = entry.kind === 'ending' ? entry.ending.title : ch.title;
    var text = entry.kind === 'ending' ? entry.ending.text : ch.text;
    var id = entry.kind === 'ending' ? '__ending' : ch.id;
    var tag = entry.kind === 'special' ? '<span class="story-tag">Especial</span>' : '';

    var choicesHTML = '';
    if (entry.kind === 'main' && ch.choices && ch.choices.length) {
        var made = dlc.choices[ch.id];
        if (made) {
            var chosen = ch.choices.find(function (x) { return x.id === made; });
            choicesHTML = '<div class="story-choice-made">Elegiste: "' + escapeHtml(chosen ? chosen.label : made) + '"</div>';
        } else {
            choicesHTML = '<div class="story-choices">';
            if (!dlc.active) choicesHTML += '<div class="story-paused-note">⏸ Expediente en pausa: actívalo para decidir.</div>';
            ch.choices.forEach(function (choice) {
                var reqFail = choice.if && !evalDlcCond(dlc, choice.if);
                var disabled = reqFail || !dlc.active;
                choicesHTML += '<button class="story-choice-btn' + (reqFail ? ' locked-req' : '') + '"' + (disabled ? ' disabled' : '') +
                    ' onclick="event.stopPropagation(); makeStoryChoice(' + idx + ', \'' + ch.id + '\', \'' + choice.id + '\')">' +
                    escapeHtml(choice.label) +
                    (reqFail && choice.lockedLabel ? '<span class="story-req">🔒 ' + escapeHtml(choice.lockedLabel) + '</span>' : '') +
                    '</button>';
            });
            choicesHTML += '</div>';
        }
    }

    return '<div class="story-card" id="story-card-' + idx + '-' + id + '">' +
        '<div class="story-header" onclick="toggleStoryChapter(' + idx + ', \'' + id + '\')">' +
        '<span class="story-chapter-num">' + number + '</span>' +
        '<span class="story-title">' + escapeHtml(title) + '</span>' + tag +
        (isNew ? '<span class="story-new-badge" id="story-new-' + idx + '-' + id + '">nuevo</span>' : '') +
        '<span class="story-chevron">▾</span>' +
        '</div>' +
        '<div class="story-body" id="story-body-' + idx + '-' + id + '">' + storyParagraphs(dlc, text) + choicesHTML + '</div>' +
        '</div>';
}

function storyLockHTML(number) {
    return '<div class="story-card locked"><div class="story-header">' +
        '<span class="story-chapter-num">' + number + '</span>' +
        '<span class="story-icon">🔒</span><span class="story-title">???</span></div></div>';
}

function renderStoryDlc(idx, dlc) {
    var list = storyBuildList(dlc);
    var mains = dlcMissions(dlc).filter(function (m) { return m.type === 'main'; });
    var secs = dlcMissions(dlc).filter(function (m) { return m.type === 'secondary'; });

    var html = '<div class="story-camp-controls">';
    if (dlc.closed) {
        html += '<span class="story-camp-hint">Historia terminada. Puedes releerla cuando quieras.</span>';
    } else {
        html += '<button class="action-btn story-toggle-btn' + (dlc.active ? ' danger' : '') + '" onclick="toggleStoryDlc(' + idx + ')">' +
            (dlc.active ? '⏸ Pausar este expediente' : '▶ Activar este expediente') + '</button>' +
            '<span class="story-camp-hint">' + (dlc.active
                ? 'Mientras esté activo, sus misiones aparecen en el tablón y la historia avanza.'
                : 'En pausa: sus misiones no aparecen y no se abren capítulos. Puedes releer lo que ya abriste.') + '</span>';
    }
    html += '</div>';
    html += '<div class="story-camp-stats">Principales: ' + mains.filter(function (m) { return m.completed; }).length + '/' + mains.length +
        ' · Secundarias: ' + secs.filter(function (m) { return m.completed; }).length + '/' + secs.length + '</div>';

    var count = 0, total = 0, specials = 0;
    list.forEach(function (e) {
        if (e.kind === 'main' || e.kind === 'lock') {
            total++;
            html += (e.kind === 'main')
                ? (function () {
                    var isOpen = dlc.opened.indexOf(e.ch.id) !== -1;
                    if (isOpen) { count++; return storyCardHTML(idx, dlc, e, e.slot, dlc.read.indexOf(e.ch.id) === -1); }
                    return storyLockHTML(e.slot);
                })()
                : storyLockHTML(e.slot);
        } else if (e.kind === 'special') {
            specials++;
            html += storyCardHTML(idx, dlc, e, '•', dlc.read.indexOf(e.ch.id) === -1);
        } else if (e.kind === 'ending') {
            html += storyCardHTML(idx, dlc, e, '•', dlc.read.indexOf('__ending') === -1);
        } else if (e.kind === 'endlock') {
            html += storyLockHTML('•');
        }
    });
    return { html: html, count: count, total: total, specials: specials };
}

function renderStory() {
    var root = document.getElementById('story-campaigns');
    if (!root) return;

    (player.dlcs || []).forEach(function (d) {
        var el = document.getElementById('story-camp-' + dlcSlug(d.file));
        if (el) storyCampOpen[d.file] = el.open;
    });

    if (!player.dlcs || player.dlcs.length === 0) {
        root.innerHTML = '<div class="event-empty">Todavía no hay historias. Instala un DLC desde Configuración.</div>';
        return;
    }

    var out = '';
    player.dlcs.forEach(function (dlc, idx) {
        var r = renderStoryDlc(idx, dlc);
        var state = dlc.closed ? 'done' : (dlc.active ? 'on' : 'off');
        var stateText = dlc.closed ? '✔ Terminado' : (dlc.active ? '● Activo' : '⏸ En pausa');
        var open = (typeof storyCampOpen[dlc.file] === 'boolean') ? storyCampOpen[dlc.file] : (idx === 0);
        out += '<details class="wb-dropdown story-campaign ' + (dlc.active || dlc.closed ? 'is-active' : 'is-paused') + '" id="story-camp-' + dlcSlug(dlc.file) + '"' + (open ? ' open' : '') + '>' +
            '<summary>Expediente ' + escapeHtml(dlc.file) + ' <span class="wb-sub">' + escapeHtml(dlc.storyTitle) + '</span> ' +
            '<span class="wb-sub">' + r.count + ' / ' + r.total + ' capítulos' + (r.specials ? ' · ' + r.specials + (r.specials === 1 ? ' especial' : ' especiales') : '') + '</span> ' +
            '<span class="story-state-badge ' + state + '">' + stateText + '</span></summary>' +
            '<div class="wb-dropdown-body"><div class="story-container">' + r.html + '</div></div></details>';
    });
    root.innerHTML = out;
}
