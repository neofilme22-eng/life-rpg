// ============================================================
// BIENESTAR - Life RPG
// 1) Check-in diario de ánimo (1 a 5) + gráfico en Estadísticas
// 2) Reflexión nocturna (3 preguntas fijas, da EXP una vez por día)
// 3) Anotador de notas
// Los datos viven dentro de `player` (moodLog, reflections, notes), así que
// se guardan y exportan junto con el resto de la partida.
// ============================================================

var MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😄'];
var REFLECTION_QUESTIONS = [
    '¿Qué salió bien hoy?',
    '¿Qué te costó, o qué podrías haber hecho mejor?',
    '¿Cuál es lo más importante para mañana?'
];
var REFLECTION_EXP = 20;
var REFLECTION_GOLD = 5;

function wbDate(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function wbEnsure() {
    if (!player.moodLog) player.moodLog = [];
    if (!player.reflections) player.reflections = [];
    if (!player.notes) player.notes = [];
}

function wbPrettyDate(str) {
    var p = str.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
}

// ============================================================
// 1) CHECK-IN DE ÁNIMO (1 a 5)
// ============================================================

var checkinEditing = false;

function getTodayCheckin() {
    wbEnsure();
    var t = wbDate();
    return player.moodLog.find(function (e) { return e.date === t; }) || null;
}

function renderCheckin() {
    var box = document.getElementById('checkin-card');
    if (!box) return;
    var today = getTodayCheckin();

    if (today && !checkinEditing) {
        box.innerHTML =
            '<div class="wb-card wb-checkin-done">' +
            '<span class="wb-title">📊 Check-in de hoy</span>' +
            '<span>' + MOOD_EMOJIS[today.mood - 1] + ' Ánimo ' + today.mood + '/5</span>' +
            '<button class="action-btn wb-small" onclick="editCheckin()">Cambiar</button>' +
            '</div>';
        return;
    }

    var h = '<div class="wb-card"><div class="wb-title">📊 Check-in diario <span class="wb-sub">¿cómo te sentís hoy?</span></div>' +
        '<div class="wb-scale">';
    for (var n = 1; n <= 5; n++) {
        h += '<button class="wb-scale-btn' + (today && today.mood === n ? ' active' : '') +
            '" onclick="pickMood(' + n + ')" aria-label="Ánimo ' + n + '">' +
            '<span class="wb-emoji">' + MOOD_EMOJIS[n - 1] + '</span><span class="wb-num">' + n + '</span></button>';
    }
    box.innerHTML = h + '</div></div>';
}

function editCheckin() {
    checkinEditing = true;
    renderCheckin();
}

function pickMood(n) {
    wbEnsure();
    var t = wbDate();
    var existing = player.moodLog.find(function (e) { return e.date === t; });
    if (existing) {
        existing.mood = n;
        existing.ts = Date.now();
    } else {
        player.moodLog.push({ date: t, mood: n, ts: Date.now() });
    }
    checkinEditing = false;
    saveGame();
    renderCheckin();
    showToast('Check-in guardado 📊', 'success', 'Bienestar');
}

// ============================================================
// 2) REFLEXIÓN NOCTURNA
// ============================================================

var reflectionEditing = false;

function getTodayReflection() {
    wbEnsure();
    var t = wbDate();
    return player.reflections.find(function (r) { return r.date === t; }) || null;
}

function reflectionAnswersHTML(r) {
    var h = '';
    REFLECTION_QUESTIONS.forEach(function (q, i) {
        h += '<div class="wb-q">' + escapeHtml(q) + '</div><div class="wb-a">' + escapeHtml(r.answers[i] || '') + '</div>';
    });
    return h;
}

function renderReflection() {
    var box = document.getElementById('reflection-card');
    if (!box) return;
    wbEnsure();
    var today = getTodayReflection();
    var html = '';

    if (today && !reflectionEditing) {
        html += '<div class="wb-card"><div class="wb-title">🌙 Reflexión de hoy <span class="wb-sub">✅ completada</span></div>' +
            reflectionAnswersHTML(today) +
            '<div style="margin-top:10px;"><button class="action-btn wb-small" onclick="editReflection()">Editar</button></div></div>';
    } else {
        html += '<div class="wb-card"><div class="wb-title">🌙 Reflexión nocturna <span class="wb-sub">' +
            (today ? 'editando' : '+' + REFLECTION_EXP + ' EXP · +' + REFLECTION_GOLD + ' ORO') + '</span></div>';
        REFLECTION_QUESTIONS.forEach(function (q, i) {
            html += '<label class="wb-q" for="refl-' + i + '">' + escapeHtml(q) + '</label>' +
                '<textarea id="refl-' + i + '" class="wb-textarea" rows="2" maxlength="500"></textarea>';
        });
        html += '<div style="margin-top:10px;display:flex;gap:8px;">' +
            '<button class="action-btn" onclick="saveReflection()">' + (today ? 'Guardar cambios' : 'Guardar reflexión') + '</button>' +
            (today ? '<button class="action-btn wb-small" onclick="cancelReflectionEdit()">Cancelar</button>' : '') +
            '</div></div>';
    }

    var past = player.reflections.filter(function (r) { return r.date !== wbDate(); })
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 14);
    if (past.length) {
        html += '<div class="wb-card wb-history"><div class="wb-title">📚 Anteriores</div>';
        past.forEach(function (r) {
            html += '<div class="wb-hist-day">' + escapeHtml(wbPrettyDate(r.date)) + '</div>' + reflectionAnswersHTML(r);
        });
        html += '</div>';
    }

    box.innerHTML = html;
    var rc = document.getElementById('refl-count');
    if (rc) rc.textContent = (today ? '✅ hoy · ' : '') + player.reflections.length + ' en total';

    // cargar texto actual en los textareas (evita problemas de escape)
    if (today && reflectionEditing) {
        REFLECTION_QUESTIONS.forEach(function (q, i) {
            var ta = document.getElementById('refl-' + i);
            if (ta) ta.value = today.answers[i] || '';
        });
    }
}

function editReflection() { reflectionEditing = true; renderReflection(); }
function cancelReflectionEdit() { reflectionEditing = false; renderReflection(); }

function saveReflection() {
    var answers = REFLECTION_QUESTIONS.map(function (q, i) {
        var ta = document.getElementById('refl-' + i);
        return ta ? ta.value.trim() : '';
    });
    if (answers.some(function (a) { return a.length < 3; })) {
        showToast('Respondé las 3 preguntas (aunque sea con una frase corta).', 'warning', 'Reflexión');
        return;
    }
    wbEnsure();
    var existing = getTodayReflection();

    if (existing) {
        existing.answers = answers;
        existing.ts = Date.now();
        reflectionEditing = false;
        saveGame();
        renderReflection();
        showToast('Reflexión actualizada.', 'success', 'Reflexión');
        return;
    }

    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }

    player.reflections.push({ date: wbDate(), answers: answers, ts: Date.now() });
    reflectionEditing = false;
    gainRewards(REFLECTION_EXP, REFLECTION_GOLD, 'mente', 'reflection', '🌙 Reflexión nocturna', 'Cierre del día');
    saveGame();
    updateHUD();
    renderReflection();
    showToast('🌙 Reflexión guardada: +' + REFLECTION_EXP + ' EXP, +' + REFLECTION_GOLD + ' ORO', 'success', 'Reflexión');
}

// ============================================================
// 3) ANOTADOR
// ============================================================

var currentNoteId = null;
var noteSaveTimer = null;

function sortedNotes() {
    wbEnsure();
    var q = (document.getElementById('notes-search') || {}).value || '';
    q = q.trim().toLowerCase();
    return player.notes.filter(function (n) {
        return !q || (n.title || '').toLowerCase().indexOf(q) !== -1 || (n.text || '').toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return (b.updated || 0) - (a.updated || 0);
    });
}

function noteDisplayTitle(n) {
    if (n.title && n.title.trim()) return n.title.trim();
    var first = (n.text || '').trim().split('\n')[0];
    return first ? first.slice(0, 40) : 'Nota sin título';
}

function renderNotes() {
    renderNotesList();
    renderNotesEditor();
}

function renderNotesList() {
    var list = document.getElementById('notes-list');
    if (!list) return;
    var nc = document.getElementById('notes-count');
    if (nc) nc.textContent = (player.notes ? player.notes.length : 0) + ' notas';
    var notes = sortedNotes();
    if (!notes.length) {
        list.innerHTML = '<div class="wb-empty">' + (player.notes && player.notes.length ? 'Sin resultados.' : 'Todavía no tenés notas. Creá la primera con “＋ Nueva”.') + '</div>';
        return;
    }
    list.innerHTML = notes.map(function (n) {
        var preview = (n.text || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        var date = new Date(n.updated || n.created || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        return '<div class="wb-note-item' + (n.id === currentNoteId ? ' active' : '') + '" onclick="openNote(\'' + n.id + '\')">' +
            '<div class="wb-note-title">' + (n.pinned ? '📌 ' : '') + escapeHtml(noteDisplayTitle(n)) + '</div>' +
            '<div class="wb-note-preview">' + escapeHtml(preview) + '</div>' +
            '<div class="wb-note-date">' + escapeHtml(date) + '</div></div>';
    }).join('');
}

function renderNotesEditor() {
    var box = document.getElementById('notes-editor');
    if (!box) return;
    var note = player.notes && player.notes.find(function (n) { return n.id === currentNoteId; });
    if (!note) {
        box.innerHTML = '<div class="wb-empty">Elegí una nota de la lista o creá una nueva.</div>';
        return;
    }
    box.innerHTML =
        '<input type="text" id="note-title" class="wb-input" placeholder="Título" maxlength="80" oninput="onNoteInput()">' +
        '<textarea id="note-text" class="wb-textarea wb-note-body" placeholder="Escribí acá..." oninput="onNoteInput()"></textarea>' +
        '<div class="wb-note-actions">' +
        '<span id="note-status" class="wb-sub"></span>' +
        '<button class="action-btn wb-small" onclick="toggleNotePin()">' + (note.pinned ? '📌 Desfijar' : '📌 Fijar') + '</button>' +
        '<button class="action-btn danger wb-small" onclick="deleteNote()">🗑️ Eliminar</button>' +
        '</div>';
    document.getElementById('note-title').value = note.title || '';
    document.getElementById('note-text').value = note.text || '';
}

function flushNoteSave() {
    if (noteSaveTimer) {
        clearTimeout(noteSaveTimer);
        noteSaveTimer = null;
        saveGame();
    }
}

function newNote() {
    flushNoteSave();
    wbEnsure();
    var now = Date.now();
    var note = { id: 'note_' + now + '_' + Math.random().toString(36).slice(2, 5), title: '', text: '', pinned: false, created: now, updated: now };
    player.notes.push(note);
    currentNoteId = note.id;
    saveGame();
    var s = document.getElementById('notes-search');
    if (s) s.value = '';
    renderNotes();
    var t = document.getElementById('note-title');
    if (t) t.focus();
}

function openNote(id) {
    flushNoteSave();
    currentNoteId = id;
    renderNotes();
    var ed = document.getElementById('notes-editor');
    if (ed && window.innerWidth < 800) ed.scrollIntoView({ behavior: 'auto', block: 'start' });
}

function onNoteInput() {
    var note = player.notes.find(function (n) { return n.id === currentNoteId; });
    if (!note) return;
    note.title = document.getElementById('note-title').value;
    note.text = document.getElementById('note-text').value;
    note.updated = Date.now();
    var st = document.getElementById('note-status');
    if (st) st.textContent = 'Guardando...';
    if (noteSaveTimer) clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(function () {
        noteSaveTimer = null;
        saveGame();
        renderNotesList();
        var s2 = document.getElementById('note-status');
        if (s2) s2.textContent = 'Guardado ✓';
    }, 500);
}

function toggleNotePin() {
    var note = player.notes.find(function (n) { return n.id === currentNoteId; });
    if (!note) return;
    flushNoteSave();
    note.pinned = !note.pinned;
    saveGame();
    renderNotes();
}

function deleteNote() {
    var note = player.notes.find(function (n) { return n.id === currentNoteId; });
    if (!note) return;
    showModal('🗑️', 'Eliminar nota', '¿Eliminar "' + noteDisplayTitle(note) + '"? No se puede deshacer.', 'Eliminar', function () {
        if (noteSaveTimer) { clearTimeout(noteSaveTimer); noteSaveTimer = null; }
        player.notes = player.notes.filter(function (n) { return n.id !== note.id; });
        currentNoteId = null;
        saveGame();
        renderNotes();
    });
}

// ============================================================
// 4) GRÁFICO ÁNIMO vs PRODUCTIVIDAD (Estadísticas)
// Productividad = EXP ganada ese día según el Diario (sin contar la reflexión ni subidas de nivel).
// ============================================================

function wbExpByDate() {
    var map = {};
    (player.logbook || []).forEach(function (day) {
        (day.entries || []).forEach(function (e) {
            if (!e.timestamp || e.type === 'reflection' || e.type === 'level') return;
            var k = wbDate(new Date(e.timestamp));
            map[k] = (map[k] || 0) + (e.expGain || 0);
        });
    });
    return map;
}

function wbAvg(arr) {
    return arr.length ? Math.round(arr.reduce(function (s, x) { return s + x; }, 0) / arr.length) : 0;
}

function moodInsightHTML(expByDate) {
    var today = wbDate();
    var rows = player.moodLog.filter(function (e) { return e.date !== today; });
    function group(key, label) {
        var high = rows.filter(function (r) { return r[key] >= 4; }).map(function (r) { return expByDate[r.date] || 0; });
        var low = rows.filter(function (r) { return r[key] <= 3; }).map(function (r) { return expByDate[r.date] || 0; });
        if (high.length < 2 || low.length < 2) return null;
        return '<div class="wb-insight-line"><b>' + label + '</b>: con 4–5 (' + high.length + ' días) ganás ~' + wbAvg(high) +
            ' EXP por día; con 1–3 (' + low.length + ' días), ~' + wbAvg(low) + ' EXP.</div>';
    }
    var a = group('mood', 'Ánimo');
    if (!a) {
        return '<div class="wb-insight-line wb-sub">Seguí haciendo el check-in: con unos 7–10 días ya se empiezan a ver patrones.</div>';
    }
    return a + '<div class="wb-insight-line wb-sub">Es una correlación, no prueba que una cosa cause la otra.</div>';
}

function renderMoodChart() {
    var grid = document.querySelector('#stats-container .stats-grid');
    if (!grid) return;
    wbEnsure();
    var old = document.getElementById('mood-chart-card');
    if (old) old.remove();

    var body;
    if (!player.moodLog.length) {
        body = '<div class="wb-empty">Todavía no hay check-ins. Hacé el primero en la pestaña Misiones y acá aparece el gráfico.</div>';
    } else {
        var expByDate = wbExpByDate();
        var days = [];
        for (var i = 13; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            days.push(wbDate(d));
        }
        var checks = {};
        player.moodLog.forEach(function (e) { checks[e.date] = e; });

        var W = 640, H = 230, padL = 30, padR = 10, padT = 12, padB = 28;
        var plotW = W - padL - padR, plotH = H - padT - padB, step = plotW / days.length;
        var maxExp = Math.max(1, Math.max.apply(null, days.map(function (k) { return expByDate[k] || 0; })));
        function xAt(idx) { return padL + step * (idx + 0.5); }
        function yRating(r) { return padT + plotH - ((r - 1) / 4) * plotH; }

        var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Ánimo frente a EXP diaria">';
        for (var g = 1; g <= 5; g++) {
            svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yRating(g) + '" y2="' + yRating(g) + '" stroke="rgba(255,255,255,0.06)"/>' +
                '<text x="' + (padL - 8) + '" y="' + (yRating(g) + 4) + '" text-anchor="end" font-size="11" style="fill:var(--text-muted)">' + g + '</text>';
        }
        days.forEach(function (k, idx) {
            var exp = expByDate[k] || 0;
            var bh = (exp / maxExp) * plotH;
            var bw = step * 0.55;
            if (exp > 0) {
                svg += '<rect x="' + (xAt(idx) - bw / 2) + '" y="' + (padT + plotH - bh) + '" width="' + bw + '" height="' + bh +
                    '" rx="3" fill="rgba(56,189,248,0.30)"><title>' + k + ': ' + exp + ' EXP</title></rect>';
            }
            svg += '<text x="' + xAt(idx) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" style="fill:var(--text-muted)">' + k.slice(8) + '</text>';
        });

        function line(key, color) {
            var out = '', seg = [];
            function flush() {
                if (seg.length > 1) out += '<polyline fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" points="' + seg.join(' ') + '"/>';
                seg = [];
            }
            days.forEach(function (k, idx) {
                var c = checks[k];
                if (!c) { flush(); return; }
                var x = xAt(idx), y = yRating(c[key]);
                seg.push(x.toFixed(1) + ',' + y.toFixed(1));
                out += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4" fill="' + color + '"><title>' + k + ' — ' + 'ánimo ' + c[key] + '/5</title></circle>';
            });
            flush();
            return out;
        }
        svg += line('mood', '#fbbf24') + '</svg>';

        body = svg +
            '<div class="wb-legend">' +
            '<span><i style="background:#fbbf24"></i>Ánimo (1–5)</span>' +
            '<span><i style="background:rgba(56,189,248,0.5)"></i>EXP del día (máx. ' + maxExp + ')</span></div>' +
            moodInsightHTML(expByDate);
    }

    grid.insertAdjacentHTML('afterbegin',
        '<div class="stats-card stats-card-full" id="mood-chart-card">' +
        '<div class="stats-title">Ánimo y productividad — últimos 14 días</div>' + body + '</div>');
}

// ============================================================
// INICIO
// ============================================================
window.addEventListener('load', function () {
    setTimeout(function () {
        wbEnsure();
        renderCheckin();
        renderReflection();
        renderNotes();
    }, 500);
});

window.addEventListener('pagehide', flushNoteSave);
document.addEventListener('visibilitychange', function () { if (document.hidden) flushNoteSave(); });
