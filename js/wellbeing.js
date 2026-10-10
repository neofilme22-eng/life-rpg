// ============================================================
// BIENESTAR - Life RPG
// 1) Check-in diario de ánimo (1 a 5) + gráfico en Estadísticas
// 2) Reflexión nocturna (3 preguntas fijas, da EXP una vez por día)
// 3) Anotador de notas
// Los datos viven dentro de `player` (moodLog, reflections, notes), así que
// se guardan y exportan junto con el resto de la partida.
// ============================================================

var MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😄'];
var MOOD_LABELS = ['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien'];
var MOOD_DESCS = [
    'Tristeza, angustia o mucho estrés.',
    'Desanimado, con poca energía.',
    'Ni bien ni mal, un día normal.',
    'De buen ánimo, tranquilo y con energía.',
    'Feliz, motivado y con mucha energía.'
];
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
            '<span class="wb-mood-now"><span class="wb-emoji">' + MOOD_EMOJIS[today.mood - 1] + '</span>' +
            '<span class="wb-mood-text"><strong>' + MOOD_LABELS[today.mood - 1] + '</strong> — ' + MOOD_DESCS[today.mood - 1] + '</span></span>' +
            '<button class="action-btn wb-small" onclick="editCheckin()">Cambiar</button>' +
            '</div>';
        return;
    }

    var h = '<div class="wb-card">' +
        '<div class="wb-scale">';
    for (var n = 1; n <= 5; n++) {
        h += '<button class="wb-scale-btn' + (today && today.mood === n ? ' active' : '') +
            '" onclick="pickMood(' + n + ')" aria-label="' + MOOD_LABELS[n - 1] + '" title="' + MOOD_LABELS[n - 1] + '">' +
            '<span class="wb-emoji">' + MOOD_EMOJIS[n - 1] + '</span></button>';
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
    showToast('Ánimo guardado', 'success', 'Bienestar');
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
        html += '<div class="wb-card"><div class="wb-title">Reflexión de hoy </div>' +
            reflectionAnswersHTML(today) +
            '<div style="margin-top:10px;"><button class="action-btn wb-small" onclick="editReflection()">Editar</button></div></div>';
    } else {
        
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
        html += '<div class="wb-card wb-history"><div class="wb-title">Anteriores</div>';
        past.forEach(function (r) {
            html += '<div class="wb-hist-day">' + escapeHtml(wbPrettyDate(r.date)) + '</div>' + reflectionAnswersHTML(r);
        });
        html += '</div>';
    }

    box.innerHTML = html;
    var rc = document.getElementById('refl-count');
    if (rc) rc.textContent = (today ? 'hoy · ' : '') + player.reflections.length + ' en total';

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
    gainRewards(REFLECTION_EXP, REFLECTION_GOLD, 'mente', 'reflection', 'Reflexión nocturna', 'Cierre del día');
    saveGame();
    updateHUD();
    renderReflection();
    showToast('Reflexión guardada: +' + REFLECTION_EXP + ' EXP' + goldText(REFLECTION_GOLD), 'success', 'Reflexión');
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
            '<div class="wb-note-title">' + (n.pinned ? '' : '') + escapeHtml(noteDisplayTitle(n)) + '</div>' +
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
        '<button class="action-btn wb-small" onclick="toggleNotePin()">' + (note.pinned ? 'Desfijar' : 'Fijar') + '</button>' +
        '<button class="action-btn danger wb-small" onclick="deleteNote()">Eliminar</button>' +
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
    showModal('', 'Eliminar nota', '¿Eliminar "' + noteDisplayTitle(note) + '"? No se puede deshacer.', 'Eliminar', function () {
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
        return '';
    }
    return a + '<div class="wb-insight-line wb-sub">Es una correlación, no prueba que una cosa cause la otra.</div>';
}

// ------------------------------------------------------------
// Gráficos de línea de Estadísticas (últimos 14 días), con selector.
// Fuente de datos: Diario (player.logbook) para misiones, runas y metas;
// player.moodLog para el ánimo.
// ------------------------------------------------------------
var STATS_CHART_DAYS = 14;
var statsChartKey = 'mood';

var STATS_CHARTS = {
    mood:     { label: 'Ánimo',    title: 'Estado de ánimo por día',      color: '#86a96c', unit: 'ánimo', fem: false },     // verde
    missions: { label: 'Misiones', title: 'Misiones completadas por día', color: '#d9b968', unit: 'misiones', fem: true },   // amarillo
    runes:    { label: 'Runas',    title: 'Runas canalizadas por día',    color: '#7ea7bd', unit: 'runas', fem: true },      // celeste
    events:   { label: 'Eventos',  title: 'Eventos completados por día',  color: '#9c87ab', unit: 'eventos', fem: false },  // lila
    goals:    { label: 'Metas',    title: 'Metas cumplidas por día',      color: '#be524a', unit: 'metas', fem: true }       // rojo
};

function wbLastDays(n) {
    var days = [];
    for (var i = n - 1; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        days.push(wbDate(d));
    }
    return days;
}

// Cuenta entradas del Diario por día (clave YYYY-MM-DD) según un filtro.
function wbCountByDate(filterFn) {
    var map = {};
    (player.logbook || []).forEach(function (day) {
        (day.entries || []).forEach(function (e) {
            if (!e.timestamp || !filterFn(e)) return;
            var k = wbDate(new Date(e.timestamp));
            map[k] = (map[k] || 0) + 1;
        });
    });
    return map;
}

function wbStatsSeries(key) {
    var title = function (e) { return e.title || ''; };
    if (key === 'missions') {
        return wbCountByDate(function (e) {
            return (e.type === 'mission' || e.type === 'daily') && title(e).indexOf('Día perdido') === -1;
        });
    }
    if (key === 'runes') {
        return wbCountByDate(function (e) { return e.type === 'rune'; });
    }
    if (key === 'goals') {
        return wbCountByDate(function (e) { return e.type === 'boss' && title(e).indexOf('cumplida') !== -1; });
    }
    if (key === 'events') {
        return wbCountByDate(function (e) {
            return (e.type === 'dungeon' || e.type === 'event') && title(e).indexOf('completad') !== -1;
        });
    }
    return {};
}

function setStatsChart(key) {
    if (!STATS_CHARTS[key]) return;
    statsChartKey = key;
    renderStatsCharts();
}

function wbLineChartSVG(days, values, cfg) {
    // values: array alineado con days; null = sin dato (corta la línea)
    var W = 640, H = 230, padL = 34, padR = 12, padT = 14, padB = 28;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var step = plotW / (days.length - 1);
    var yMin = cfg.yMin, yMax = cfg.yMax;
    function xAt(i) { return padL + step * i; }
    function yAt(v) { return padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + cfg.title + '">';

    cfg.ticks.forEach(function (t) {
        svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yAt(t) + '" y2="' + yAt(t) + '" stroke="rgba(227,220,200,0.06)"/>' +
            '<text x="' + (padL - 8) + '" y="' + (yAt(t) + 4) + '" text-anchor="end" font-size="11" style="fill:var(--text-muted)">' + t + '</text>';
    });

    days.forEach(function (k, i) {
        svg += '<text x="' + xAt(i) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" style="fill:var(--text-muted)">' + k.slice(8) + '</text>';
    });

    var seg = [], lines = '', dots = '';
    function flush() {
        if (seg.length > 1) lines += '<polyline fill="none" stroke="' + cfg.color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="' + seg.join(' ') + '"/>';
        seg = [];
    }
    values.forEach(function (v, i) {
        if (v === null || v === undefined) { flush(); return; }
        var x = xAt(i).toFixed(1), y = yAt(v).toFixed(1);
        seg.push(x + ',' + y);
        dots += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + cfg.color + '"><title>' + wbPrettyDate(days[i]) + ': ' + cfg.tooltip(v) + '</title></circle>';
    });
    flush();
    return svg + lines + dots + '</svg>';
}

function renderStatsCharts() {
    var grid = document.querySelector('#stats-container .stats-grid');
    if (!grid) return;
    wbEnsure();
    var old = document.getElementById('stats-charts-card');
    if (old) old.remove();

    var key = STATS_CHARTS[statsChartKey] ? statsChartKey : 'mood';
    var meta = STATS_CHARTS[key];
    var days = wbLastDays(STATS_CHART_DAYS);

    var toggles = '<div class="stats-chart-toggle" role="tablist">';
    Object.keys(STATS_CHARTS).forEach(function (k) {
        toggles += '<button type="button" style="--c:' + STATS_CHARTS[k].color + '" class="stats-chart-btn' + (k === key ? ' active' : '') + '" onclick="setStatsChart(\'' + k + '\')">' + STATS_CHARTS[k].label + '</button>';
    });
    toggles += '</div>';

    var body, summary = '';
    if (key === 'mood') {
        var checks = {};
        player.moodLog.forEach(function (e) { checks[e.date] = e; });
        var values = days.map(function (k) { return checks[k] ? checks[k].mood : null; });
        var filled = values.filter(function (v) { return v !== null; });
        if (!filled.length) {
            body = '<div class="wb-empty event-empty">Todavía no hay registros de ánimo en los últimos ' + STATS_CHART_DAYS + ' días.</div>';
        } else {
            var avg = (filled.reduce(function (s, x) { return s + x; }, 0) / filled.length).toFixed(1);
            summary = '<div class="stats-chart-summary">Total: <b>' + filled.length + '</b> · Promedio: <b>' + avg + '/5</b> · Mejor día: <b>' + Math.max.apply(null, filled) + '/5</b></div>';
            body = wbLineChartSVG(days, values, {
                title: meta.title, color: meta.color, yMin: 1, yMax: 5, ticks: [1, 2, 3, 4, 5],
                tooltip: function (v) { return 'ánimo ' + v + '/5'; }
            }) + moodInsightHTML(wbExpByDate());
        }
    } else {
        var map = wbStatsSeries(key);
        var vals = days.map(function (k) { return map[k] || 0; });
        var total = vals.reduce(function (s, x) { return s + x; }, 0);
        if (!total) {
            body = '<div class="wb-empty event-empty">Todavía no hay ' + meta.unit + ' registradas en los últimos ' + STATS_CHART_DAYS + ' días.</div>';
        } else {
            var best = Math.max.apply(null, vals);
            var yMax = Math.max(4, best);
            var tickStep = Math.ceil(yMax / 4);
            yMax = tickStep * 4;
            var ticks = [0, tickStep, tickStep * 2, tickStep * 3, yMax];
            summary = '<div class="stats-chart-summary">Total: <b>' + total + '</b> · Promedio: <b>' + (total / STATS_CHART_DAYS).toFixed(1) + '</b>/día · Mejor día: <b>' + best + '</b></div>';
            body = wbLineChartSVG(days, vals, {
                title: meta.title, color: meta.color, yMin: 0, yMax: yMax, ticks: ticks,
                tooltip: function (v) { return v + ' ' + meta.unit; }
            });
        }
    }

    grid.insertAdjacentHTML('afterbegin',
        '<div class="stats-card stats-card-full" id="stats-charts-card">' +
        '<div class="stats-title">' + meta.title + ' — últimos ' + STATS_CHART_DAYS + ' días</div>' +
        toggles + summary + body + '</div>');
}

// ============================================================
// INICIO
// ============================================================
window.addEventListener('load', function () {
    setTimeout(function () {
        wbEnsure();
        renderCheckin();
    }, 500);
});

window.addEventListener('pagehide', flushNoteSave);
document.addEventListener('visibilitychange', function () { if (document.hidden) flushNoteSave(); });
