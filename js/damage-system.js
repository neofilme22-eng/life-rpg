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
                                        var mascotaItem = player.equipment.mascota;
                                        var isPhoenix = mascotaItem.species === 'fenix' && !mascotaItem.phoenixUsed;

                                        if (isPhoenix) {
                                            mascotaItem.phoenixUsed = true;
                                            player.petHealth = Math.ceil(player.petMaxHealth * 0.5);
                                            addLogEntry('damage', '🔥 ¡' + mascotaItem.name + ' renació de sus cenizas!', 'Recuperó la mitad de su HP (una sola vez)', 0, 0, null);
                                            showToast('🔥 ¡' + mascotaItem.name + ' estaba por morir, pero renació solo! (esto no vuelve a pasar con esta mascota)', 'success', 'Mascota');
                                        } else {
                                            var petName = mascotaItem.name || 'Mascota';
                                            player.equipment.mascota = null;
                                            var petIndex = player.inventory.findIndex(function (i) { return i.equipped === true && i.slot === 'mascota'; });
                                            if (petIndex !== -1) {
                                                player.inventory[petIndex].equipped = false;
                                                player.inventory[petIndex].dead = true;
                                            }
                                            addLogEntry('damage', '💔 ¡' + petName + ' ha muerto!', 'Necesitas una Pluma de Fénix para revivirla.', 0, 0, null);
                                            showToast('💔 ¡' + petName + ' ha muerto! Necesitas una "Pluma de Fénix" de la tienda para revivirla.', 'error', 'Mascota');
                                        }

                                        updatePet();
                                        renderInventory();
                                        saveGame();
                                    }

                                    if (player.hp <= 0) {
                                        var reliquia = player.equipment ? player.equipment.reliquia : null;
                                        var hasSecondChance = reliquia && reliquia.effect && reliquia.effect.type === 'second_chance';

                                        if (hasSecondChance) {
                                            player.hp = 1;
                                            player.equipment.reliquia = null;
                                            var reliquiaIndex = player.inventory.findIndex(function (i) { return i.equipped === true && i.slot === 'reliquia'; });
                                            if (reliquiaIndex !== -1) {
                                                player.inventory.splice(reliquiaIndex, 1);
                                            }
                                            addLogEntry('damage', '🕊️ ¡Segunda Oportunidad activada!', 'Sobreviviste con 1 HP. La reliquia se rompió.', 0, 0, null);
                                            showToast('🕊️ Tu Segunda Oportunidad se rompió, pero te salvó: seguís con 1 HP.', 'success', 'Segunda Oportunidad');
                                        } else {
                                            player.hp = 0;
                                            player.gameOver = true;
                                            addLogEntry('damage', '💀 GAME OVER', 'El héroe ha caído...', 0, 0, null);
                                            showGameOverScreen();
                                        }
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
