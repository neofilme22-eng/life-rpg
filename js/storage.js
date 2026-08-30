            // ===== FUNCIONES DE GUARDADO =====
            // ============================================================

            function saveGame() {
                localStorage.setItem('life_rpg_save', JSON.stringify(player));
                localStorage.setItem('life_rpg_main_ids', JSON.stringify(activeMainIds));
                localStorage.setItem('life_rpg_sec_ids', JSON.stringify(activeSecondaryIds));
                saveShopItems();
                saveEvents(player.events || []);
            }

            function loadGame() {
                var savedData = localStorage.getItem('life_rpg_save');
                if (savedData) {
                    try {
                        var parsed = JSON.parse(savedData);
                        player = JSON.parse(JSON.stringify(defaultPlayer));

                        for (var key in parsed) {
                            if (parsed.hasOwnProperty(key)) {
                                if (key === 'attributes' && parsed.attributes) {
                                    for (var attr in defaultPlayer.attributes) {
                                        if (parsed.attributes[attr] !== undefined) {
                                            player.attributes[attr] = parsed.attributes[attr];
                                        }
                                    }
                                } else if (key === 'equipment' && parsed.equipment) {
                                    player.equipment = parsed.equipment;
                                } else {
                                    player[key] = parsed[key];
                                }
                            }
                        }

                        if (parsed.rawRunes && parsed.rawRunes.length > 0) {
                            player.rawRunes = parsed.rawRunes;
                        }

                        if (parsed.lastRuneReset !== undefined) {
                            player.lastRuneReset = parsed.lastRuneReset;
                        }

                        if (!player.purchasedItems) player.purchasedItems = [];
                        if (!player.totalSpent) player.totalSpent = 0;
                        if (!player.expBoost) player.expBoost = 0;
                        if (!player.goldBoost) player.goldBoost = 0;
                        if (!player.runeBonus) player.runeBonus = 0;
                        if (!player.pomodoroSessions) player.pomodoroSessions = 0;
                        if (!player.pomodoroFocusTime) player.pomodoroFocusTime = 0;
                        if (!player.logbook) player.logbook = [];
                        if (!player.events) player.events = [];
                        if (!player.inventory) player.inventory = [];
                        if (!player.equipment) {
                            player.equipment = { arma: null, armadura: null, reliquia: null, mascota: null };
                        }
                        if (!player.equipment.arma) player.equipment.arma = null;
                        if (!player.equipment.armadura) player.equipment.armadura = null;
                        if (!player.equipment.reliquia) player.equipment.reliquia = null;
                        if (!player.equipment.mascota) player.equipment.mascota = null;
                        if (player.petHealth === undefined) player.petHealth = 100;
                        if (player.petMaxHealth === undefined) player.petMaxHealth = 100;
                        if (player.gameOver === undefined) player.gameOver = false;
                        if (player.lastRuneReset === undefined) player.lastRuneReset = null;
                        if (!player.storyChapters) player.storyChapters = [];
                        if (!player.storyRead) player.storyRead = [];
                        if (!player.storyChoices) player.storyChoices = {};
                        if (player.lastActiveDate === undefined) player.lastActiveDate = null;
                        if (player.lastZeroMissionDayPenalty === undefined) player.lastZeroMissionDayPenalty = null;
                        if (player.missionExpPct === undefined) player.missionExpPct = 0;
                        if (player.bossExpPct === undefined) player.bossExpPct = 0;
                        if (player.missionGoldPct === undefined) player.missionGoldPct = 0;
                        if (player.runeExpPct === undefined) player.runeExpPct = 0;

                        // Migración: completar 'species' en mascotas guardadas antes de que
                        // ese campo existiera, para que la personalidad funcione correctamente.
                        function backfillPetSpecies(petObj) {
                            if (!petObj || petObj.category !== 'pet' || petObj.species) return;
                            var def = (typeof SHOP_ITEMS !== 'undefined' ? SHOP_ITEMS : SHOP_ITEMS_DEFAULT).find(function (s) { return s.id === petObj.id; });
                            if (def && def.species) petObj.species = def.species;
                        }

                        if (player.inventory) {
                            player.inventory.forEach(backfillPetSpecies);
                        }
                        backfillPetSpecies(player.equipment.mascota);
                    } catch (e) {
                        console.error("Error al cargar la partida:", e);
                        player = JSON.parse(JSON.stringify(defaultPlayer));
                    }
                }

                var savedMain = localStorage.getItem('life_rpg_main_ids');
                if (savedMain) {
                    try {
                        activeMainIds = JSON.parse(savedMain);
                    } catch (e) {
                        activeMainIds = [];
                    }
                }

                var savedSec = localStorage.getItem('life_rpg_sec_ids');
                if (savedSec) {
                    try {
                        activeSecondaryIds = JSON.parse(savedSec);
                    } catch (e) {
                        activeSecondaryIds = [];
                    }
                }

                loadShopItems();
                loadStoredEvents();

                var savedDifficulty = localStorage.getItem('life_rpg_difficulty');
                if (savedDifficulty) {
                    currentDifficulty = savedDifficulty;
                    var select = document.getElementById('config-difficulty');
                    if (select) select.value = savedDifficulty;
                    applyDifficulty(savedDifficulty);
                }

                var savedTheme = localStorage.getItem('life_rpg_theme');
                if (savedTheme) {
                    var selectTheme = document.getElementById('config-theme');
                    if (selectTheme) selectTheme.value = savedTheme;
                    applyTheme(savedTheme);
                }

                if (player.gameOver) {
                    setTimeout(showGameOverScreen, 500);
                }
            }

            function saveShopItems() {
                localStorage.setItem('life_rpg_shop_items', JSON.stringify(SHOP_ITEMS));
            }

            function loadShopItems() {
                var saved = localStorage.getItem('life_rpg_shop_items');
                if (saved) {
                    try {
                        SHOP_ITEMS = JSON.parse(saved);
                    } catch (e) {
                        SHOP_ITEMS = JSON.parse(JSON.stringify(SHOP_ITEMS_DEFAULT));
                    }
                }
            }

            function saveEvents(events) {
                localStorage.setItem('life_rpg_events', JSON.stringify(events));
            }

            function loadStoredEvents() {
                var data = localStorage.getItem('life_rpg_events');
                if (data) {
                    try {
                        player.events = JSON.parse(data);
                        eventosCache = player.events;
                    } catch (e) {
                        player.events = [];
                        eventosCache = [];
                    }
                } else {
                    player.events = [];
                    eventosCache = [];
                }
            }

            // ============================================================
