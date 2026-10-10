// ============================================================
// SERVICE WORKER - Life RPG (PWA)
// Cachea todos los archivos de la app para que cargue instantáneo
// y funcione sin conexión. No hay backend ni llamadas a servidor,
// así que todo lo que necesita la app queda guardado localmente.
// ============================================================

const CACHE_VERSION = 'life-rpg-v6';
const CACHE_NAME = CACHE_VERSION;

const APP_SHELL = [
    './',
    "assets/Aventuras/01.jpg",
    "assets/Aventuras/02.jpg",
    "assets/Aventuras/03.jpg",
    "assets/Aventuras/04.jpg",
    "assets/Aventuras/05.jpg",
    "assets/Aventuras/06.jpg",
    "assets/Aventuras/07.jpg",
    "assets/Aventuras/08.jpg",
    "assets/Aventuras/09.jpg",
    "assets/Aventuras/10.jpg",
    "assets/Aventuras/11.jpg",
    "assets/Aventuras/12.jpg",
    "assets/Aventuras/13.jpg",
    "assets/Deidades/AM2.jpg",
    "assets/Deidades/DESARROLLO.jpg",
    "assets/Deidades/ECONOMIA.jpg",
    "assets/Deidades/F2.jpg",
    "assets/Deidades/MATEMATICA SUPERIOR.jpg",
    "assets/Deidades/SISTEMA OPERATIVO.jpg",
    "assets/champs/apatia.jpg",
    "assets/champs/bloqueo-creativo.jpg",
    "assets/champs/descontrol-financiero.jpg",
    "assets/champs/estancamiento.jpg",
    "assets/champs/inseguridad.jpg",
    "assets/champs/procrastinacion.jpg",
    "assets/champs/sedentarismo.jpg",
    "assets/champs/timidez.jpg",
    "assets/icons/apple-touch-icon.png",
    "assets/icons/icon-192.png",
    "assets/icons/icon-512.png",
    "css/base.css",
    "css/bosses.css",
    "css/effects.css",
    "css/events.css",
    "css/feedback.css",
    "css/gameover.css",
    "css/hud.css",
    "css/inventory.css",
    "css/logbook.css",
    "css/missions.css",
    "css/pet.css",
    "css/responsive.css",
    "css/runes.css",
    "css/sanctuary.css",
    "css/settings.css",
    "css/shop.css",
    "css/social.css",
    "css/stats.css",
    "css/trophies.css",
    "css/variables.css",
    "css/wellbeing.css",
    "index.html",
    "js/battles.js",
    "js/bosses.js",
    "js/config.js",
    "js/daily-missions.js",
    "js/damage-system.js",
    "js/dlc-missions.js",
    "js/events-dungeons.js",
    "js/gameover.js",
    "js/hud.js",
    "js/icon-utils.js",
    "js/import-export.js",
    "js/init.js",
    "js/inventory.js",
    "js/logbook.js",
    "js/pagination.js",
    "js/pet.js",
    "js/reminders.js",
    "js/runes.js",
    "js/sanctuary.js",
    "js/settings.js",
    "js/shop.js",
    "js/social.js",
    "js/stats.js",
    "js/storage.js",
    "js/story.js",
    "js/tabs.js",
    "js/trophies.js",
    "js/ui-feedback.js",
    "js/utils.js",
    "js/wellbeing.js",
    "manifest.json"
];

// ===== INSTALL: precachear todos los archivos =====
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_SHELL);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// ===== ACTIVATE: borrar caches de versiones viejas =====
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) { return key.indexOf('life-rpg-v') === 0 && key !== CACHE_NAME; })
                    .map(function (key) { return caches.delete(key); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// ===== FETCH: cache-first, con fallback a red y actualización en segundo plano =====
self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(function (cached) {
            var networkFetch = fetch(event.request).then(function (response) {
                if (response && response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(function () {
                // Sin conexión y sin nada en cache: si es una navegación,
                // devolver el index como último recurso.
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return cached;
            });

            return cached || networkFetch;
        })
    );
});


// ============================================================
// RECORDATORIOS ALEATORIOS EN SEGUNDO PLANO
// El plan del día (horarios al azar) lo comparte la página vía Cache Storage.
// ============================================================
var R_CACHE = 'life-rpg-reminder-state';
var R_URL = './__reminder_state.json';
var R_MESSAGES = [
    ['⚔️ Tu aventura te espera', 'Entrá un minuto y completá aunque sea una misión chica.'],
    ['🔥 No cortes la racha', 'Un pequeño avance hoy vale más que un gran plan para mañana.'],
    // DESHABILITADO (Mascotas apagadas): ['🐾 Tu mascota te extraña', 'Pasá a saludarla y ver qué quedó pendiente.'],
    ['🎯 ¿Qué es lo próximo?', 'Elegí una cosa, la más importante, y hacela ahora.'],
    // DESHABILITADO (Pomodoro apagado): ['🕯️ ¿Un pomodoro?', '25 minutos de enfoque y después descansás.'],
    ['🌫️ La niebla no espera', 'Revisá tus misiones del día antes de que se venzan.']
];

function swDateStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function swTimeToMs(str, baseMs) {
    var p = String(str || '00:00').split(':').map(Number);
    var d = new Date(baseMs);
    d.setHours(p[0] || 0, p[1] || 0, 0, 0);
    return d.getTime();
}
function swGeneratePlan(state, now) {
    var start = swTimeToMs(state.startTime || '10:00', now);
    var end = swTimeToMs(state.endTime || '21:30', now);
    var from = Math.max(start, now + 5 * 60000);
    var n = Math.max(1, Math.min(8, state.perDay || 3));
    var gap = 45 * 60000, times = [], tries = 0;
    while (times.length < n && tries < 400 && end > from) {
        tries++;
        var t = from + Math.random() * (end - from);
        if (times.every(function (x) { return Math.abs(x - t) >= gap; })) times.push(Math.round(t));
    }
    times.sort(function (a, b) { return a - b; });
    return { date: swDateStr(new Date(now)), times: times, sent: times.map(function () { return false; }) };
}

self.addEventListener('periodicsync', function (event) {
    if (event.tag === 'life-rpg-reminder') {
        event.waitUntil(checkRandomReminder());
    }
});

function checkRandomReminder() {
    return caches.open(R_CACHE).then(function (cache) {
        return cache.match(R_URL).then(function (res) {
            if (!res) return;
            return res.json().then(function (state) {
                if (!state.enabled) return;
                var now = Date.now();
                if (!state.plan || state.plan.date !== swDateStr(new Date(now))) {
                    state.plan = swGeneratePlan(state, now);
                }
                var endLimit = swTimeToMs(state.endTime || '21:30', now) + 30 * 60000;
                var due = false;
                state.plan.times.forEach(function (t, i) {
                    if (state.plan.sent[i] || t > now) return;
                    state.plan.sent[i] = true;
                    if (now - t <= 3 * 3600000 && now <= endLimit) due = true;
                });
                return cache.put(R_URL, new Response(JSON.stringify(state), {
                    headers: { 'Content-Type': 'application/json' }
                })).then(function () {
                    if (!due) return;
                    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
                        var visible = list.some(function (c) { return c.visibilityState === 'visible'; });
                        if (visible) return; // ya estás usando la app
                        var m = R_MESSAGES[Math.floor(Math.random() * R_MESSAGES.length)];
                        return self.registration.showNotification(m[0], {
                            body: m[1],
                            tag: 'life-rpg-random',
                            icon: 'assets/icons/icon-192.png',
                            badge: 'assets/icons/icon-192.png'
                        });
                    });
                });
            });
        });
    });
}

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
            for (var i = 0; i < list.length; i++) {
                if ('focus' in list[i]) return list[i].focus();
            }
            if (self.clients.openWindow) return self.clients.openWindow('./index.html');
        })
    );
});
