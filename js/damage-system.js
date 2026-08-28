                                // ===== FUNCIONES DE SISTEMA DE DAÑO =====
                                // ============================================================

                                function applyDamage(amount, source, petDamage) {
                                    petDamage = petDamage || 0;
                                    if (player.gameOver) return;

                                    var mult = getDifficultyMultipliers();
                                    var adjustedDamage = Math.floor(amount * mult.damageMod);
                                    var adjustedPetDamage = Math.floor(petDamage * mult.damageMod);

                                    player.hp = Math.max(0, player.hp - adjustedDamage);

                                    if (player.equipment && player.equipment.mascota) {
                                        player.petHealth = Math.max(0, player.petHealth - adjustedPetDamage);
                                    }

                                    shakeScreen();

                                    var logMsg = '💔 Recibiste ' + adjustedDamage + ' de daño';
                                    if (player.equipment && player.equipment.mascota && petDamage > 0) {
                                        logMsg += ' (mascota: -' + adjustedPetDamage + ' HP)';
                                    }
                                    addLogEntry('damage', logMsg, 'Fuente: ' + source, 0, 0, null);

                                    if (player.equipment && player.equipment.mascota && player.petHealth <= 0) {
                                        var petName = player.equipment.mascota.name || 'Mascota';
                                        player.equipment.mascota = null;
                                        var petIndex = player.inventory.findIndex(function (i) { return i.equipped === true && i.slot === 'mascota'; });
                                        if (petIndex !== -1) {
                                            player.inventory.splice(petIndex, 1);
                                        }
                                        addLogEntry('damage', '💔 ¡' + petName + ' ha muerto!', 'Necesitas un Polvo de Estrellas para revivirla.', 0, 0, null);
                                        showToast('💔 ¡' + petName + ' ha muerto! Necesitas un "Polvo de Estrellas" de la tienda para revivirla.', 'error', 'Mascota');
                                        updatePet();
                                        renderInventory();
                                        saveGame();
                                    }

                                    if (player.hp <= 0) {
                                        player.hp = 0;
                                        player.gameOver = true;
                                        addLogEntry('damage', '💀 GAME OVER', 'El héroe ha caído...', 0, 0, null);
                                        showGameOverScreen();
                                    }

                                    updateHUD();
                                    saveGame();
                                }

                                function checkInactivityDamage() {
                                    if (player.gameOver) return;

                                    var todayStr = new Date().toISOString().split('T')[0];

                                    if (!player.lastActiveDate) {
                                        player.lastActiveDate = todayStr;
                                        saveGame();
                                        return;
                                    }

                                    if (player.lastActiveDate === todayStr) return;

                                    var lastDate = new Date(player.lastActiveDate + 'T00:00:00');
                                    var today = new Date(todayStr + 'T00:00:00');
                                    var diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

                                    var graceDays = 1;
                                    if (diffDays > graceDays) {
                                        var inactiveDays = diffDays - graceDays;
                                        var damageAmount = Math.min(60, inactiveDays * 10);
                                        var petDamage = Math.min(30, inactiveDays * 5);

                                        applyDamage(damageAmount, diffDays + ' días sin abrir el juego', petDamage);
                                        addLogEntry('damage', '🌧️ La ciudad no te esperó: ' + diffDays + ' días sin aparecer', '-' + damageAmount + ' HP', 0, 0, null);
                                        showToast('🌧️ Estuviste ' + diffDays + ' días sin jugar. La rutina te pasó factura: -' + damageAmount + ' HP', 'error', 'Inactividad');
                                    }

                                    player.lastActiveDate = todayStr;
                                    saveGame();
                                }

                                // ============================================================
