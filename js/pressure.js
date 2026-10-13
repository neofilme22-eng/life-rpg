// ============================================================
// ===== PRESIÓN: daño extra por descuido y evento sorpresa =====
// Todo el daño va en HP fijos y se multiplica por la dificultad y por la Tensión (ver damage-system.js).
// Metas, eventos y runas pueden traer `damage` en su JSON para fijar su propio daño (no se muestra en las tarjetas).
// ============================================================

var PRESSURE_DAY_MS = 86400000;

function daysBetweenStr(a, b) {
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / PRESSURE_DAY_MS);
}

// Última fecha en que completaste una tarea diaria, según el diario
function lastDailyDoneFromLog() {
    var last = null;
    (player.logbook || []).forEach(function (day) {
        (day.entries || []).forEach(function (e) {
            if (e.type === 'daily' && (e.title || '').indexOf('Día perdido') === -1 && day.date) {
                if (!last || day.date > last) last = day.date;
            }
        });
    });
    return last;
}

// Silencio Radial: 3 días seguidos sin completar ninguna tarea diaria -> 10 HP (se repite cada 3 días)
function checkSilencioRadial() {
    var today = localDateStr();
    if (!player.lastDailyDoneDate) {
        player.lastDailyDoneDate = lastDailyDoneFromLog() || today;
        saveGame();
        return;
    }
    var silent = daysBetweenStr(player.lastDailyDoneDate, today) - 1; // días completos sin tareas (sin contar hoy)
    if (silent < 3) return;
    if (player.silenceLastHit && daysBetweenStr(player.silenceLastHit, today) < 3) return;
    player.silenceLastHit = today;
    applyDamage(10, 'Silencio radial: ' + silent + ' días sin completar tareas diarias', 0);
    showToast('Llevás ' + silent + ' días sin completar ninguna tarea diaria. Silencio radial: -10 HP.', 'warning', 'Silencio Radial');
    saveGame();
}

// Caso Frío: ninguna meta tuvo una tarea cumplida en 30 días -> 10 HP (se repite cada 30 días)
function checkColdCase() {
    var active = (player.bosses || []).filter(function (b) { return !b.defeated && !b.vencido; });
    if (!active.length) return;
    var now = Date.now();
    if (!player.goalLastTaskAt) { player.goalLastTaskAt = now; saveGame(); return; }
    var ref = Math.max(player.goalLastTaskAt, player.coldCaseLastHit || 0);
    if (now - ref < 30 * PRESSURE_DAY_MS) return;
    player.coldCaseLastHit = now;
    applyDamage(10, 'Caso frío: ninguna meta tuvo avances en 30 días', 0);
    showToast('Ninguna de tus metas avanzó en 30 días. Caso frío: -10 HP.', 'warning', 'Caso Frío');
    saveGame();
}

// Reloj en Contra: pasó la mitad del plazo de una meta y no completaste ni una tarea -> 20 HP, o 2/3 del daño de la meta (una vez por meta)
function checkGoalClock() {
    var now = Date.now(), dirty = false;
    (player.bosses || []).forEach(function (b) {
        if (b.defeated || b.vencido || !b.deadline || b.clockPenalty) return;
        var end = new Date(b.deadline).getTime();
        if (isNaN(end)) return;
        if (!b.createdAt) { b.createdAt = now; dirty = true; return; }
        var half = b.createdAt + (end - b.createdAt) / 2;
        var done = (b.taskStatus || []).filter(Boolean).length;
        if (now >= half && now < end && done === 0) {
            b.clockPenalty = true;
            dirty = true;
            var clockDmg = Math.ceil(contentDamage(b, 30) * 2 / 3);
            applyDamage(clockDmg, 'Reloj en contra: la meta "' + b.name + '" va por la mitad del plazo sin avances', 0);
            showToast('La meta "' + b.name + '" pasó la mitad del plazo sin ningún avance. Reloj en contra: -' + clockDmg + ' HP.', 'error', 'Reloj en Contra');
        }
    });
    if (dirty) saveGame();
}

// Pista que se Enfría: evento iniciado, pasó la mitad de su tiempo y no marcaste ninguna tarea -> 8 HP, o ~1/3 del daño del evento (una vez por evento)
function checkEventCooling() {
    if (typeof cargarEventos !== 'function') return;
    var evs = cargarEventos(), now = Date.now(), changed = false;
    evs.forEach(function (e) {
        if (e.type !== 'dungeon' || e.status !== 'active' || !e.startedAt || !e.endTime || e.coolPenalty) return;
        var end = new Date(e.endTime).getTime();
        if (isNaN(end)) return;
        var half = e.startedAt + (end - e.startedAt) / 2;
        var done = (e.taskStatus || []).filter(Boolean).length;
        if (now >= half && now < end && done === 0) {
            e.coolPenalty = true;
            changed = true;
            var coolDmg = Math.ceil(contentDamage(e, 25) * 0.32);
            applyDamage(coolDmg, 'Pista que se enfría: el evento "' + e.title + '" va por la mitad del tiempo sin avances', 0);
            showToast('El evento "' + e.title + '" va por la mitad del tiempo sin avances. Pista que se enfría: -' + coolDmg + ' HP.', 'warning', 'Pista que se Enfría');
        }
    });
    if (changed) guardarEventos();
}

// ============================================================
// ===== EVENTO SORPRESA =====
// Aparece al azar (cada ~1 semana). Tenés 24 h para resolverlo: si no, -40 HP.
// ============================================================

var SURPRISE_DAMAGE = 40;
var SURPRISE_WINDOW_H = 24;
var SURPRISE_MIN_GAP_DAYS = 4;
var SURPRISE_DAILY_CHANCE = 0.35;

var SURPRISE_POOL = [
    { id: 'sombra', title: 'Sombra en el Pasillo', exp: 90, gold: 30, tasks: [
        'Salir de casa y caminar 15 minutos sin un destino fijo',
        'Cruzar unas palabras con alguien que no sea de tu entorno cercano'
    ] },
    { id: 'llamada', title: 'La Llamada de Medianoche', exp: 100, gold: 35, tasks: [
        'Llamar por teléfono (no escribir) a alguien con quien no hablás hace tiempo',
        'Sostener la conversación al menos 5 minutos'
    ] },
    { id: 'sobre', title: 'El Sobre sin Remitente', exp: 100, gold: 35, tasks: [
        'Elegir un asunto que venís evitando (un trámite, un mail, un pago)',
        'Resolver el primer paso hoy mismo'
    ] },
    { id: 'ruta', title: 'Cambio de Ruta', exp: 80, gold: 25, tasks: [
        'Volver de tu actividad principal por un camino distinto al habitual',
        'Entrar a un lugar en el que nunca hayas entrado'
    ] },
    { id: 'fotos', title: 'La Foto Faltante', exp: 80, gold: 25, tasks: [
        'Salir a sacar tres fotos de cosas que normalmente pasarías por alto',
        'Revisar las fotos al volver y elegir la mejor'
    ] },
    { id: 'silencio', title: 'Silencio Obligado', exp: 90, gold: 30, tasks: [
        'Pasar 2 horas seguidas sin pantallas ni redes',
        'Anotar en papel qué pensaste durante ese tiempo'
    ] },
    { id: 'archivo', title: 'El Archivo Olvidado', exp: 100, gold: 35, tasks: [
        'Ordenar un cajón, una carpeta o un rincón que venís postergando',
        'Tirar o donar al menos 5 cosas'
    ] },
    { id: 'testigo', title: 'Testigo Inesperado', exp: 110, gold: 40, tasks: [
        'Proponerle un plan concreto a alguien para hoy o mañana',
        'Concretarlo, aunque sea un café de 20 minutos'
    ] }
];

function surpriseEnsure() {
    if (!player.surprise) player.surprise = { lastSpawnAt: null, lastRollDay: null, active: null, lastId: null };
    return player.surprise;
}

function surpriseDamageEstimate() {
    var mult = getDifficultyMultipliers();
    return Math.floor(SURPRISE_DAMAGE * mult.damageMod * tensionMultiplier());
}

function checkSurprise() {
    if (player.gameOver) return;
    var s = surpriseEnsure(), now = Date.now(), today = localDateStr();

    if (s.active) {
        if (now > s.active.expiresAt) {
            var failed = s.active;
            s.active = null;
            applyDamage(SURPRISE_DAMAGE, 'Evento sorpresa "' + failed.title + '" sin resolver', 0);
            showToast('No resolviste "' + failed.title + '" a tiempo. -' + SURPRISE_DAMAGE + ' HP.', 'error', 'Evento Sorpresa');
            saveGame();
            updateSurpriseAlert();
            renderSurprise();
        }
        return;
    }

    if (!s.lastSpawnAt) { s.lastSpawnAt = now; saveGame(); return; } // primera vez: arranca el contador
    if (now - s.lastSpawnAt < SURPRISE_MIN_GAP_DAYS * PRESSURE_DAY_MS) return;
    if (s.lastRollDay === today) return;

    s.lastRollDay = today;
    if (Math.random() >= SURPRISE_DAILY_CHANCE) { saveGame(); return; }

    var choices = SURPRISE_POOL.filter(function (p) { return p.id !== s.lastId; });
    var pick = choices[Math.floor(Math.random() * choices.length)];
    s.lastId = pick.id;
    s.lastSpawnAt = now;
    s.active = {
        id: pick.id, title: pick.title, tasks: pick.tasks.slice(),
        taskStatus: pick.tasks.map(function () { return false; }),
        exp: pick.exp, gold: pick.gold,
        appearedAt: now, expiresAt: now + SURPRISE_WINDOW_H * 3600 * 1000
    };
    saveGame();
    showToast('Algo se mueve en las sombras. Revisá la pestaña Eventos: tenés ' + SURPRISE_WINDOW_H + ' horas.', 'warning', 'Evento Sorpresa');
    updateSurpriseAlert();
    renderSurprise();
}

function toggleSurpriseTask(i) {
    var s = surpriseEnsure();
    if (!s.active || player.gameOver) return;
    if (Date.now() > s.active.expiresAt) { checkSurprise(); return; }
    s.active.taskStatus[i] = !s.active.taskStatus[i];
    if (s.active.taskStatus.every(function (v) { return v; })) {
        var done = s.active;
        s.active = null;
        gainRewards(done.exp, done.gold, 'social', 'dungeon', 'Evento sorpresa "' + done.title + '" completado', 'Lo enfrentaste a tiempo');
        showToast('Resolviste "' + done.title + '". +' + done.exp + ' EXP', 'success', 'Evento Sorpresa');
        saveGame();
        updateSurpriseAlert();
    } else {
        saveGame();
    }
    renderSurprise();
}

function surpriseFmt(ms) {
    var min = Math.max(0, Math.ceil(ms / 60000));
    var h = Math.floor(min / 60), m = min % 60;
    return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
}

function updateSurpriseAlert() {
    var on = !!(player.surprise && player.surprise.active);
    var nodes = document.querySelectorAll('[onclick*="tab-events"]');
    for (var i = 0; i < nodes.length; i++) {
        if (on) nodes[i].classList.add('has-alert'); else nodes[i].classList.remove('has-alert');
    }
}

function renderSurprise() {
    var el = document.getElementById('surprise-section');
    if (!el || typeof player === 'undefined') return;
    var s = surpriseEnsure();
    if (!s.active) { el.innerHTML = ''; return; }
    var a = s.active, left = a.expiresAt - Date.now();
    var done = a.taskStatus.filter(function (v) { return v; }).length;
    var tasks = '';
    a.tasks.forEach(function (txt, i) {
        tasks += '<label class="surprise-task' + (a.taskStatus[i] ? ' done' : '') + '"><input type="checkbox" ' + (a.taskStatus[i] ? 'checked ' : '') +
            'onchange="toggleSurpriseTask(' + i + ')"><span>' + txt + '</span></label>';
    });
    el.innerHTML =
        '<div class="section-box surprise-box">' +
        '<div class="section-header"><span class="section-title">Evento Sorpresa</span><span class="section-ornament"></span>' +
        '<span class="section-counter surprise-timer">' + surpriseFmt(left) + '</span></div>' +
        '<div class="surprise-card">' +
        '<h3 class="surprise-name">' + a.title + '</h3>' +
        '<div class="surprise-warn">Si no lo resolvés antes de que se acabe el tiempo, perdés ' + surpriseDamageEstimate() + ' HP.</div>' +
        '<div class="surprise-progress">' + done + ' / ' + a.tasks.length + ' tareas</div>' +
        '<div class="surprise-tasks">' + tasks + '</div>' +
        '<div class="card-reward"><span class="reward-chip">Recompensa: +' + a.exp + ' EXP</span></div>' +
        '</div></div>';
}

setInterval(function () {
    if (typeof player === 'undefined') return;
    checkSurprise();
    var tab = document.getElementById('tab-events');
    if (tab && tab.classList.contains('active')) renderSurprise();
}, 30000);

// Se llama al cargar y cada 30 s
function runPressureChecks() {
    if (typeof player === 'undefined' || player.gameOver) return;
    checkSilencioRadial();
    checkColdCase();
    checkGoalClock();
    checkEventCooling();
    checkSurprise();
    updateSurpriseAlert();
}
