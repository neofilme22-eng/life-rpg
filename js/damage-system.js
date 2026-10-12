                                // ===== FUNCIONES DE SISTEMA DE DAÑO =====
                                // ============================================================

                                // ===== TENSIÓN: cada día seguido con daño suma +10% al daño del día siguiente (hasta +50%) =====
                                function dayBeforeStr(dateStr) {
                                    var d = new Date(dateStr + 'T00:00:00');
                                    d.setDate(d.getDate() - 1);
                                    return localDateStr(d);
                                }

                                function tensionLevel() {
                                    var t = player.tension;
                                    if (!t || !t.lastHitDay) return 0;
                                    var today = localDateStr();
                                    if (t.lastHitDay === today) return Math.max(0, (t.streak || 1) - 1);
                                    if (t.lastHitDay === dayBeforeStr(today)) return t.streak || 0;
                                    return 0;
                                }

                                function tensionMultiplier() {
                                    return 1 + 0.1 * Math.min(5, tensionLevel());
                                }

                                function registerTensionHit() {
                                    var today = localDateStr();
                                    if (!player.tension) player.tension = { streak: 0, lastHitDay: null };
                                    var t = player.tension;
                                    if (t.lastHitDay === today) return;
                                    t.streak = (t.lastHitDay === dayBeforeStr(today)) ? (t.streak || 0) + 1 : 1;
                                    t.lastHitDay = today;
                                }

                                // Daño como porcentaje del HP máximo (así sigue pesando al subir de nivel)
                                function applyDamagePct(pct, source, petDamage) {
                                    var amount = Math.max(1, Math.round(player.maxHp * pct / 100));
                                    applyDamage(amount, source, petDamage);
                                    return amount;
                                }

                                function applyDamage(amount, source, petDamage) {
                                    petDamage = petDamage || 0;
                                    if (player.gameOver) return;

                                    var mult = getDifficultyMultipliers();
                                    var tension = tensionMultiplier();
                                    var adjustedDamage = Math.floor(amount * mult.damageMod * tension);
                                    var adjustedPetDamage = Math.floor(petDamage * mult.damageMod);
                                    var petsOn = (typeof FEATURES === 'undefined') || FEATURES.pets;

                                    player.hp = Math.max(0, player.hp - adjustedDamage);

                                    if (petsOn && player.equipment && player.equipment.mascota) {
                                        player.petHealth = Math.max(0, player.petHealth - adjustedPetDamage);
                                    }

                                    shakeScreen();

                                    registerTensionHit();
                                    var logMsg = '💔 Recibiste ' + adjustedDamage + ' de daño';
                                    if (tension > 1) logMsg += ' (Tensión +' + Math.round((tension - 1) * 100) + '%)';
                                    if (petsOn && player.equipment && player.equipment.mascota && petDamage > 0) {
                                        logMsg += ' (mascota: -' + adjustedPetDamage + ' HP)';
                                    }
                                    addLogEntry('damage', logMsg, 'Fuente: ' + source, 0, 0, null);

                                    if (petsOn && player.equipment && player.equipment.mascota && player.petHealth <= 0) {
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

                                    var todayStr = localDateStr();

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

                                        applyDamagePct(damageAmount, diffDays + ' días sin abrir el juego', petDamage);
                                        addLogEntry('damage', '🌧️ La ciudad no te esperó: ' + diffDays + ' días sin aparecer', '-' + damageAmount + ' HP', 0, 0, null);
                                        showToast('🌧️ Estuviste ' + diffDays + ' días sin jugar. La rutina te pasó factura: -' + damageAmount + ' HP', 'error', 'Inactividad');
                                    }

                                    player.lastActiveDate = todayStr;
                                    saveGame();
                                }

                                // ============================================================
