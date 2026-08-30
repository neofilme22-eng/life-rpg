                                // ===== FUNCIÓN DE RENDERIZADO FORZADO =====
                                // ============================================================

                                function forceInitialRender() {
                                    console.log("🔄 Forzando renderizado inicial...");

                                    var runeContainer = document.getElementById('rune-container');
                                    var petEmoji = document.getElementById('pet-emoji');
                                    var petLevel = document.getElementById('pet-level');
                                    var petContainer = document.getElementById('pet-container');

                                    if (runeContainer) {
                                        if (player.rawRunes && player.rawRunes.length > 0) {
                                            renderRunes();
                                        } else {
                                            runeContainer.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; font-family:\'Georgia\',\'Times New Roman\',serif; text-align:center; padding:10px 0;">No hay runas instaladas. Ve a Configuración para instalar o crear runas.</p>';
                                        }
                                    }

                                    if (petEmoji && petLevel && petContainer) {
                                        var mascota = player.equipment.mascota;
                                        if (mascota) {
                                            var icon = mascota.icon || '🐾';
                                            petEmoji.innerHTML = renderIconHTML(icon, '🐾');
                                            petLevel.textContent = 'Nv. ' + player.level;
                                            var healthPercent = Math.round((player.petHealth / player.petMaxHealth) * 100);
                                            if (healthPercent < 30) {
                                                petLevel.textContent += ' ❤️' + healthPercent + '%';
                                                petContainer.style.borderColor = 'var(--danger)';
                                            } else {
                                                petContainer.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                                            }
                                            var scale = 1 + (player.level / 50);
                                            petContainer.style.transform = 'scale(' + Math.min(scale, 1.6) + ')';
                                        } else {
                                            petEmoji.textContent = '🐾';
                                            petLevel.textContent = 'Nv. 1';
                                            petContainer.style.transform = 'scale(1)';
                                            petContainer.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                                        }
                                    }

                                    updateHUD();
                                    console.log("✅ Renderizado inicial forzado completado");
                                }

                                // ============================================================
                                // ===== EVENTO DE CARGA =====
                                // ============================================================

                                window.onload = function () {
                                    console.log("🔄 Cargando juego...");

                                    loadGame();

                                    checkInactivityDamage();

                                    cleanOldDailyMissions();

                                    if (player.rawRunes && player.rawRunes.length > 0) {
                                        checkAndResetRunes();
                                    }

                                    // Renovar eventos periódicos al cargar
                                    renovarEventosPeriodicos();

                                    if ((activeMainIds.length === 0 || activeSecondaryIds.length === 0) && player.rawMissions.length > 0) {
                                        refreshMissions();
                                    }

                                    player.dlcs.forEach(function (dlc) {
                                        var trophyId = 'dlc_' + dlc.name.replace(/\s+/g, '_');
                                        if (!dynamicTrophyDefinitions.find(function (t) { return t.id === trophyId; })) {
                                            dynamicTrophyDefinitions.push({
                                                id: trophyId,
                                                icon: dlc.trophyIcon || "🏆",
                                                name: dlc.trophyName || (dlc.name + ' Completado'),
                                                desc: 'Completa todas las misiones del DLC "' + dlc.name + '"',
                                                check: function (p) {
                                                    var missions = p.rawMissions.filter(function (m) { return m.dlcName === dlc.name; });
                                                    return missions.length > 0 && missions.every(function (m) { return m.completed; });
                                                }
                                            });
                                        }
                                    });

                                    resetPomodoro();
                                    startDailyCheckInterval();

                                    setTimeout(function () {
                                        updateHUD();
                                        renderDailyMissions();
                                        renderMissions();
                                        renderBosses();
                                        renderBestiary();
                                        renderShop();
                                        renderTrophies();
                                        renderLogbook();
                                        renderEvents();
                                        renderInventory();
                                    }, 50);

                                    setTimeout(function () {
                                        renderRunes();
                                        updatePet();
                                    }, 200);

                                    setTimeout(function () {
                                        checkAndUnlockTrophies();
                                        checkStoryUnlocks();
                                    }, 500);

                                    setTimeout(function () {
                                        renderRunes();
                                        updatePet();
                                        updateHUD();
                                        console.log("✅ Carga completada");
                                    }, 400);

                                    console.log("✅ Juego cargado.");
                                };

                                setTimeout(forceInitialRender, 100);
                                document.addEventListener('DOMContentLoaded', function () {
                                    setTimeout(forceInitialRender, 200);
                                });

                                var originalSwitchTab = switchTab;
                                switchTab = function (tabId) {
                                    originalSwitchTab(tabId);
                                    if (tabId === 'tab-runas') {
                                        setTimeout(function () {
                                            renderRunes();
                                            updatePet();
                                        }, 50);
                                    }
                                    if (tabId === 'tab-events') {
                                        setTimeout(function () {
                                            renderEvents();
                                        }, 50);
                                    }
                                    if (tabId === 'tab-bosses') {
                                        setTimeout(function () {
                                            renderBosses();
                                            renderBestiary();
                                        }, 50);
                                    }
                                };
