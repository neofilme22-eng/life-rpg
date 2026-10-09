// ============================================================
// RECORDATORIOS ALEATORIOS - Life RPG
// Valores fijos: 3 avisos por día, en horarios al azar entre las 10:00 y las 21:30.
// El plan del día vive en Cache Storage, así lo comparten la página y el service
// worker (que lo dispara en segundo plano cuando el navegador lo permite).
// ============================================================

var R_CACHE = 'life-rpg-reminder-state';
var R_URL = './__reminder_state.json';
var R_PER_DAY = 3;
var R_START = '10:00';
var R_END = '21:30';

var R_GENERIC_MESSAGES = [
    ['⚔️ Tu aventura te espera', 'Entrá un minuto y completá aunque sea una misión chica.'],
    ['🔥 No cortes la racha', 'Un pequeño avance hoy vale más que un gran plan para mañana.'],
    // DESHABILITADO (Mascotas apagadas): ['🐾 Tu mascota te extraña', 'Pasá a saludarla y ver qué quedó pendiente.'],
    ['🎯 ¿Qué es lo próximo?', 'Elegí una cosa, la más importante, y hacela ahora.'],
    // DESHABILITADO (Pomodoro apagado): ['🕯️ ¿Un pomodoro?', '25 minutos de enfoque y después descansás.'],
    ['🌫️ La niebla no espera', 'Revisá tus misiones del día antes de que se venzan.']
];

var reminderInterval = null;

function reminderSupported() { return 'Notification' in window; }
function rDateStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function rTimeToMs(str, baseMs) {
    var p = String(str || '00:00').split(':').map(Number);
    var d = new Date(baseMs);
    d.setHours(p[0] || 0, p[1] || 0, 0, 0);
    return d.getTime();
}

// ---------- Estado (Cache Storage) ----------
function rGetState() {
    var base = { enabled: false, perDay: R_PER_DAY, startTime: R_START, endTime: R_END, plan: null };
    if (!('caches' in window)) return Promise.resolve(base);
    return caches.open(R_CACHE)
        .then(function (c) { return c.match(R_URL); })
        .then(function (res) { return res ? res.json() : null; })
        .then(function (saved) {
            var s = Object.assign(base, saved || {});
            // Los valores son fijos: si quedó una configuración vieja, se descarta y se re-sortea el día.
            if (s.perDay !== R_PER_DAY || s.startTime !== R_START || s.endTime !== R_END) {
                s.perDay = R_PER_DAY; s.startTime = R_START; s.endTime = R_END; s.plan = null;
            }
            return s;
        })
        .catch(function () { return base; });
}

function rSetState(state) {
    if (!('caches' in window)) return Promise.resolve();
    return caches.open(R_CACHE).then(function (c) {
        return c.put(R_URL, new Response(JSON.stringify(state), { headers: { 'Content-Type': 'application/json' } }));
    }).catch(function () { });
}

// ---------- Plan del día ----------
function rGeneratePlan(now) {
    var start = rTimeToMs(R_START, now);
    var end = rTimeToMs(R_END, now);
    var from = Math.max(start, now + 5 * 60000);
    var gap = 45 * 60000;
    var times = [], tries = 0;
    while (times.length < R_PER_DAY && tries < 400 && end > from) {
        tries++;
        var t = from + Math.random() * (end - from);
        if (times.every(function (x) { return Math.abs(x - t) >= gap; })) times.push(Math.round(t));
    }
    times.sort(function (a, b) { return a - b; });
    return { date: rDateStr(new Date(now)), times: times, sent: times.map(function () { return false; }) };
}

// ---------- Mensaje (usa el estado del juego si lo hay) ----------
function rBuildMessage() {
    try {
        var today = rDateStr();
        var hour = new Date().getHours();
        var ctxMsgs = [];

        if (typeof loadDailyMissions === 'function') {
            var pending = loadDailyMissions().filter(function (m) { return m.date === today && !m.completed; }).length;
            if (pending > 0) ctxMsgs.push(['⏳ Te quedan ' + pending + ' misión(es) hoy', 'Entrá y sacate alguna de encima.']);
        }
        if (typeof player !== 'undefined') {
            var checked = (player.moodLog || []).some(function (e) { return e.date === today; });
            if (!checked) ctxMsgs.push(['📊 ¿Cómo estás hoy?', 'Hacé tu check-in de ánimo, tarda 5 segundos.']);
            var reflected = (player.reflections || []).some(function (e) { return e.date === today; });
            if (hour >= 19 && !reflected) ctxMsgs.push(['🌙 Cerrá el día', 'Escribí tu reflexión en Historia y ganá EXP.']);
        }
        if (ctxMsgs.length && Math.random() < 0.6) return ctxMsgs[Math.floor(Math.random() * ctxMsgs.length)];
    } catch (e) { }
    return R_GENERIC_MESSAGES[Math.floor(Math.random() * R_GENERIC_MESSAGES.length)];
}

// ---------- Enviar ----------
function sendReminderNotification(title, body, tag) {
    if (!reminderSupported() || Notification.permission !== 'granted') return;
    var opts = { body: body, tag: tag || 'life-rpg-random', icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png' };
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker.getRegistration().then(function (reg) {
            if (reg) reg.showNotification(title, opts);
            else new Notification(title, opts);
        }).catch(function () { try { new Notification(title, opts); } catch (e) { } });
    } else {
        try { new Notification(title, opts); } catch (e) { }
    }
}

// ---------- Chequeo (app abierta o en segundo plano) ----------
function checkReminders() {
    if (!reminderSupported() || Notification.permission !== 'granted') return;
    rGetState().then(function (state) {
        var now = Date.now();
        state.enabled = true; // con el permiso otorgado, los recordatorios quedan activos
        if (!state.plan || state.plan.date !== rDateStr(new Date(now))) {
            state.plan = rGeneratePlan(now);
        }
        var endLimit = rTimeToMs(R_END, now) + 30 * 60000;
        var due = false;
        state.plan.times.forEach(function (t, i) {
            if (state.plan.sent[i] || t > now) return;
            state.plan.sent[i] = true;
            if (now - t <= 3 * 3600000 && now <= endLimit) due = true;
        });
        return rSetState(state).then(function () {
            if (!due) return;
            // si ya estás usando la app, no hace falta recordarte
            if (document.visibilityState === 'visible' && document.hasFocus()) return;
            var m = rBuildMessage();
            sendReminderNotification(m[0], m[1], 'life-rpg-random');
        });
    });
}

function registerPeriodicSync() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
        if (!reg.periodicSync || !reg.periodicSync.register) return;
        return reg.periodicSync.register('life-rpg-reminder', { minInterval: 2 * 60 * 60 * 1000 });
    }).catch(function (e) { console.log('Periodic sync no disponible:', e && e.message); });
}

// ---------- Aviso para activar (solo hasta que decidas) ----------
function renderReminderBanner() {
    var box = document.getElementById('reminder-banner');
    if (!box) return;
    var dismissed = false;
    try { dismissed = !!sessionStorage.getItem('life_rpg_rem_dismiss'); } catch (e) { }
    if (!reminderSupported() || Notification.permission !== 'default' || dismissed) {
        box.innerHTML = '';
        return;
    }
    box.innerHTML = '<div class="wb-banner"><span>🔔 Activá los recordatorios para que te avise 3 veces al día.</span>' +
        '<button class="action-btn wb-small" onclick="requestReminderPermission()">Activar</button>' +
        '<button class="wb-banner-x" onclick="dismissReminderBanner()" aria-label="Ahora no">✕</button></div>';
}

function dismissReminderBanner() {
    try { sessionStorage.setItem('life_rpg_rem_dismiss', '1'); } catch (e) { }
    renderReminderBanner();
}

function requestReminderPermission() {
    if (!reminderSupported()) return;
    Notification.requestPermission().then(function (perm) {
        if (perm === 'granted') {
            rGetState().then(function (s) {
                s.enabled = true;
                s.plan = rGeneratePlan(Date.now());
                return rSetState(s);
            }).then(function () {
                registerPeriodicSync();
                showToast('Recordatorios activados ✅', 'success', 'Recordatorios');
                sendReminderNotification('🔔 Recordatorios activados', 'Te voy a avisar 3 veces al día, en momentos al azar.', 'life-rpg-test');
            });
        }
        renderReminderBanner();
    });
}

function initReminders() {
    if (reminderInterval) clearInterval(reminderInterval);
    reminderInterval = setInterval(checkReminders, 60000);
    if (reminderSupported() && Notification.permission === 'granted') registerPeriodicSync();
    setTimeout(checkReminders, 3000);
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) checkReminders();
    });
    setTimeout(renderReminderBanner, 300);
}

window.addEventListener('load', initReminders);
