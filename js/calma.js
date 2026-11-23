// ============================================================
// ===== ROMPER LA CALMA =====
// Para cuando no sabés por dónde empezar: el juego elige entre tus pendientes
// una de las más fáciles y te pide solo 2 minutos. Si completás los 2 minutos
// ganás un bonus chico (hasta 3 por día). Después decidís si seguís o parás.
// ============================================================

var CALMA_SECONDS = 120;
var CALMA_BONUS = 5;
var CALMA_DAILY_MAX = 3;

var calmaState = null;   // { item, status: 'proposed' | 'running' | 'done', endsAt, bonus }
var calmaTimer = null;

// Pendientes de hoy, con el esfuerzo estimado por la EXP que dan
function calmaCandidates() {
    var list = [];
    if (typeof loadDailyMissions === 'function') {
        loadDailyMissions().forEach(function (m) {
            if (!m.completed && !isMissionOverdue(m)) list.push({ key: 'd:' + (m.id || m.title), kind: 'Tarea diaria', title: m.title, exp: 8 });
        });
    }
    (player.rawRunes || []).forEach(function (r) {
        if (!r.completed) list.push({ key: 'r:' + (r.id || r.title), kind: 'Ritual', title: r.title, exp: r.expReward || 10 });
    });
    (player.rawMissions || []).forEach(function (m) {
        if (m.type === 'secondary' && !m.completed && typeof activeSecondaryIds !== 'undefined' && activeSecondaryIds.indexOf(m.id) !== -1) {
            list.push({ key: 'm:' + m.id, kind: 'Misión secundaria', title: m.title, exp: m.expReward || 40 });
        }
    });
    return list;
}

// Una de las 3 más fáciles al azar (si pedís "otra", no repite la misma)
function calmaPick(excludeKey) {
    var c = calmaCandidates().filter(function (x) { return x.key !== excludeKey; });
    if (!c.length) c = calmaCandidates();
    if (!c.length) return null;
    c.sort(function (a, b) { return a.exp - b.exp; });
    var pool = c.slice(0, 3);
    return pool[Math.floor(Math.random() * pool.length)];
}

function calmaBonusesToday() {
    var today = localDateStr();
    if (!player.calma || player.calma.date !== today) player.calma = { date: today, count: 0 };
    return player.calma.count;
}

function breakCalma() {
    if (calmaState && calmaState.status === 'running') return;
    var item = calmaPick(null);
    calmaState = item ? { item: item, status: 'proposed' } : { item: null, status: 'empty' };
    renderCalma();
}

function calmaAnother() {
    var item = calmaPick(calmaState && calmaState.item ? calmaState.item.key : null);
    calmaState = item ? { item: item, status: 'proposed' } : { item: null, status: 'empty' };
    renderCalma();
}

function calmaStart() {
    if (!calmaState || !calmaState.item) return;
    calmaState.status = 'running';
    calmaState.endsAt = Date.now() + CALMA_SECONDS * 1000;
    if (calmaTimer) clearInterval(calmaTimer);
    calmaTimer = setInterval(calmaTick, 1000);
    renderCalma();
}

function calmaCancel() {
    if (calmaTimer) { clearInterval(calmaTimer); calmaTimer = null; }
    calmaState = null;
    renderCalma();
}

function calmaFmt(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function calmaTick() {
    if (!calmaState || calmaState.status !== 'running') {
        if (calmaTimer) { clearInterval(calmaTimer); calmaTimer = null; }
        return;
    }
    var left = Math.max(0, Math.ceil((calmaState.endsAt - Date.now()) / 1000));
    var el = document.getElementById('calma-time');
    if (el) el.innerText = calmaFmt(left);
    if (left > 0) return;

    clearInterval(calmaTimer);
    calmaTimer = null;
    var count = calmaBonusesToday();
    var bonus = 0;
    if (count < CALMA_DAILY_MAX && !player.gameOver) {
        bonus = CALMA_BONUS;
        player.calma.count++;
        gainRewards(bonus, 0, 'disciplina', 'calma', 'Romper la Calma', 'Arrancaste "' + calmaState.item.title + '" (2 minutos)');
        showToast('Rompiste la Calma. +' + bonus + ' EXP', 'success', 'Romper la Calma');
    } else {
        showToast('Rompiste la Calma. Ya llegaste al tope de bonus de hoy.', 'info', 'Romper la Calma');
    }
    saveGame();
    calmaState.status = 'done';
    calmaState.bonus = bonus;
    renderCalma();
}

function renderCalma() {
    var el = document.getElementById('calma-box');
    if (!el || typeof player === 'undefined') return;
    var left = CALMA_DAILY_MAX - calmaBonusesToday();
    var s = calmaState;
    var html = '';

    if (!s) {
        html = '<p class="calma-hint">¿No sabés por dónde empezar? Te elijo una de las tareas más fáciles que tengas pendientes y te pido solo 2 minutos. Después decidís vos.</p>' +
            '<button class="action-btn" onclick="breakCalma()">Romper la Calma</button>' +
            '<span class="calma-left">' + (left > 0 ? 'Bonus disponibles hoy: ' + left : 'Ya usaste los bonus de hoy') + '</span>';
    } else if (s.status === 'empty') {
        html = '<div class="calma-card"><div class="calma-line">No tenés nada pendiente para hoy. La Calma ya está rota.</div></div>' +
            '<button class="calma-sub-btn" onclick="calmaCancel()">Cerrar</button>';
    } else if (s.status === 'proposed') {
        html = '<div class="calma-card">' +
            '<div class="calma-kind">' + s.item.kind + '</div>' +
            '<div class="calma-task">' + escapeHtml(s.item.title) + '</div>' +
            '<div class="calma-line">Solo 2 minutos. No tenés que terminarla.</div>' +
            '</div>' +
            '<div class="calma-actions">' +
            '<button class="action-btn" onclick="calmaStart()">Empezar 2 minutos</button>' +
            '<button class="calma-sub-btn" onclick="calmaAnother()">Otra</button>' +
            '<button class="calma-sub-btn" onclick="calmaCancel()">Cancelar</button>' +
            '</div>';
    } else if (s.status === 'running') {
        var secs = Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000));
        html = '<div class="calma-card running">' +
            '<div class="calma-kind">' + s.item.kind + '</div>' +
            '<div class="calma-task">' + escapeHtml(s.item.title) + '</div>' +
            '<div class="calma-time" id="calma-time">' + calmaFmt(secs) + '</div>' +
            '<div class="calma-line">Solo esto. Después decidís.</div>' +
            '</div>' +
            '<button class="calma-sub-btn" onclick="calmaCancel()">Cancelar</button>';
    } else {
        html = '<div class="calma-card done">' +
            '<div class="calma-kind">Calma rota</div>' +
            '<div class="calma-task">' + (s.bonus > 0 ? '+' + s.bonus + ' EXP' : 'Sin bonus (tope de hoy)') + '</div>' +
            '<div class="calma-line">Ya estás en movimiento. ¿Seguís con «' + escapeHtml(s.item.title) + '» o parás acá? Si seguís, marcala como hecha en su lista.</div>' +
            '</div>' +
            '<button class="action-btn" onclick="calmaCancel()">Listo</button>';
    }
    el.innerHTML = html;
}
