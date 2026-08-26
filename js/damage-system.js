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

                                // ============================================================
