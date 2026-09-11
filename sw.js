// ============================================================
// SERVICE WORKER - Life RPG (PWA)
// Cachea todos los archivos de la app para que cargue instantáneo
// y funcione sin conexión. No hay backend ni llamadas a servidor,
// así que todo lo que necesita la app queda guardado localmente.
// ============================================================

const CACHE_VERSION = 'life-rpg-v1';
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
    "css/heatmap.css",
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
    "index.html",
    "js/battles.js",
    "js/bosses.js",
    "js/config.js",
    "js/daily-heatmap.js",
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
                keys.filter(function (key) { return key !== CACHE_NAME; })
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
