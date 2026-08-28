                // ===== FUNCIONES DE RUNAS =====
                // ============================================================

                function calculateRuneLevelAndProgress(totalExp) {
                    var level = 1;
                    var currentLevelBase = 0;
                    var nextLevelTarget = 100;

                    if (totalExp >= 1000) {
                        level = 5 + Math.floor((totalExp - 1000) / 600);
                        currentLevelBase = 1000 + (level - 5) * 600;
                        nextLevelTarget = currentLevelBase + 600;
                    } else if (totalExp >= 500) {
                        level = 4;
                        currentLevelBase = 500;
                        nextLevelTarget = 1000;
                    } else if (totalExp >= 250) {
                        level = 3;
                        currentLevelBase = 250;
                        nextLevelTarget = 500;
                    } else if (totalExp >= 100) {
                        level = 2;
                        currentLevelBase = 100;
                        nextLevelTarget = 250;
                    } else {
                        level = 1;
                        currentLevelBase = 0;
                        nextLevelTarget = 100;
                    }

                    return {
                        level: level,
                        currentExpInLevel: totalExp - currentLevelBase,
                        expNeededForLevel: nextLevelTarget - currentLevelBase,
                        totalExp: totalExp
                    };
                }

                function completeRune(id) {
                    if (player.gameOver) {
                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                        return;
                    }

                    var rune = player.rawRunes.find(function (r) { return r.id === id; });
                    if (!rune) {
                        showToast('Error: No se encontró la runa.', 'error', 'Error');
                        return;
                    }

                    if (rune.completed) {
                        showToast('Esta runa ya fue canalizada hoy. ¡Vuelve mañana!', 'warning', 'Runa');
                        return;
                    }

                    rune.completed = true;
                    rune.streak = (rune.streak || 0) + 1;

                    var bonus = player.runeBonus || 0;
                    var mult = getDifficultyMultipliers();
                    var totalExpReward = Math.floor((rune.expReward + bonus) * mult.runeExp);

                    rune.totalExp = (rune.totalExp || 0) + totalExpReward;

                    gainRewards(totalExpReward, rune.goldReward, rune.attr, 'rune', '💠 Runa "' + rune.title + '"', 'Racha: ' + rune.streak + ' días');

                    saveGame();
                    renderRunes();
                    checkAndUnlockTrophies();

                    showToast('✨ Runa "' + rune.title + '" canalizada con éxito! +' + totalExpReward + ' EXP, +' + rune.goldReward + ' ORO', 'success', 'Runa');
                }

                function checkAndResetRunes() {
                    if (player.gameOver) return;
                    if (!player.rawRunes || player.rawRunes.length === 0) return;

                    var today = new Date();
                    var todayStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

                    var lastReset = player.lastRuneReset;

                    if (lastReset !== todayStr) {
                        var lostRunes = [];
                        var keptRunes = [];

                        player.rawRunes.forEach(function (r) {
                            if (r.completed === undefined) r.completed = false;
                            if (r.streak === undefined) r.streak = 0;

                            if (r.completed) {
                                r.completed = false;
                                keptRunes.push(r.title);
                            } else if (r.streak > 0) {
                                var oldStreak = r.streak;
                                r.streak = 0;
                                lostRunes.push({ name: r.title, streak: oldStreak });
                            }
                        });

                        player.lastRuneReset = todayStr;

                        if (lostRunes.length > 0) {
                            var damageAmount = lostRunes.length * 3;
                            applyDamage(damageAmount, 'Pérdida automática de rachas de runas', lostRunes.length * 2);

                            var msg = '📅 Nuevo día: ' + todayStr + '\n\n';
                            msg += '💔 ' + lostRunes.length + ' runa(s) perdieron su racha:\n';
                            lostRunes.forEach(function (r) {
                                msg += '• ' + r.name + ' (perdió ' + r.streak + ' días)\n';
                            });
                            msg += '\n💔 Daño recibido: ' + damageAmount + ' HP';

                            showToast(msg, 'warning', 'Runas - Nuevo Día');
                            addLogEntry('damage', '📅 Pérdida automática de rachas de runas', lostRunes.map(function (r) { return r.name + ' (' + r.streak + 'd)'; }).join(', '), 0, 0, null);
                        } else {
                            showToast('📅 ¡Nuevo día! Runas recargadas. ¡A canalizar!', 'success', 'Runas');
                        }

                        saveGame();
                        renderRunes();
                        updateHUD();
                    }
                }

                function resetDailyRunes() {
                    if (player.gameOver) {
                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                        return;
                    }

                    var today = new Date();
                    var todayStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    var lastReset = player.lastRuneReset;

                    if (lastReset === todayStr) {
                        showToast('Ya se reseteó automáticamente hoy. ¡A canalizar runas!', 'info', 'Runas');
                        return;
                    }

                    showModal(
                        '🔄',
                        'Reiniciar Runas Manualmente',
                        '¿Estás seguro de reiniciar las runas manualmente?\n\n' +
                        '📌 Las runas que NO completaste hoy perderán su racha.\n' +
                        '📌 Las runas que YA completaste hoy mantendrán su racha.\n' +
                        '📌 Esto aplica daño por las rachas perdidas.\n\n' +
                        '💡 Normalmente esto ocurre automáticamente cada día.',
                        'Reiniciar',
                        function () {
                            executeManualResetRunes(todayStr);
                        },
                        true
                    );
                }

                function executeManualResetRunes(todayStr) {
                    var lostRunes = [];
                    var keptRunes = [];

                    player.rawRunes.forEach(function (r) {
                        if (r.completed === undefined) r.completed = false;
                        if (r.streak === undefined) r.streak = 0;

                        if (r.completed) {
                            r.completed = false;
                            keptRunes.push(r.title);
                        } else if (r.streak > 0) {
                            var oldStreak = r.streak;
                            r.streak = 0;
                            lostRunes.push({ name: r.title, streak: oldStreak });
                        }
                    });

                    player.lastRuneReset = todayStr;

                    if (lostRunes.length > 0) {
                        var damageAmount = lostRunes.length * 3;
                        applyDamage(damageAmount, 'Pérdida manual de rachas de runas', lostRunes.length * 2);

                        var msg = '💔 ' + lostRunes.length + ' runa(s) perdieron su racha:\n';
                        lostRunes.forEach(function (r) {
                            msg += '• ' + r.name + ' (perdió ' + r.streak + ' días)\n';
                        });
                        msg += '\n💔 Daño recibido: ' + damageAmount + ' HP';

                        showToast(msg, 'warning', 'Runas Reiniciadas');
                        addLogEntry('damage', '🔄 Pérdida manual de rachas de runas', lostRunes.map(function (r) { return r.name + ' (' + r.streak + 'd)'; }).join(', '), 0, 0, null);
                    } else {
                        showToast('☀️ ¡Runas recargadas! Todas las rachas se mantuvieron. ¡A canalizar!', 'success', 'Runas');
                    }

                    saveGame();
                    renderRunes();
                    updateHUD();
                }

                function renderRunes() {
                    var container = document.getElementById('rune-container');
                    if (!container) return;

                    if (!player.rawRunes || player.rawRunes.length === 0) {
                        container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; font-family:\'Georgia\',\'Times New Roman\',serif; text-align:center; padding:10px 0;">No hay runas instaladas. Ve a Configuración para instalar o crear runas.</p>';
                        return;
                    }

                    player.rawRunes.forEach(function (r) {
                        if (r.completed === undefined) r.completed = false;
                        if (r.streak === undefined) r.streak = 0;
                        if (r.totalExp === undefined) r.totalExp = 0;
                    });

                    var html = '';

                    player.rawRunes.forEach(function (runa) {
                        var prog = calculateRuneLevelAndProgress(runa.totalExp || 0);
                        var percent = Math.min(100, (prog.currentExpInLevel / prog.expNeededForLevel) * 100);
                        var icon = runa.icon || "💠";
                        var bonus = player.runeBonus || 0;
                        var mult = getDifficultyMultipliers();

                        var isCompleted = runa.completed === true;
                        var isDisabled = isCompleted || player.gameOver;
                        var buttonText = isCompleted ? 'Canalizada hoy' : 'Canalizar';

                        html += `
                    <div class="rune-card ${isCompleted ? 'completed' : ''}">
                        <div class="rune-icon">${renderIconHTML(icon, '💠')}</div>
                        <div class="rune-card-header">
                            <h4 class="rune-title">${runa.title}</h4>
                            <span class="rune-level-badge">✦ Nv.${prog.level}</span>
                        </div>
                        <div class="rune-info-row">
                            <span class="rune-streak">🔥 ${runa.streak || 0}d</span>
                            <span class="rune-exp"> +${Math.floor((runa.expReward + bonus) * mult.runeExp)} EXP</span>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${percent}%;"></div>
                        </div>
                        <button class="${isCompleted ? 'rune-channel-btn completed-btn' : 'rune-channel-btn'}" 
                                onclick="completeRune('${runa.id}')"
                                ${isDisabled ? 'disabled' : ''}>
                            ${buttonText}
                        </button>
                    </div>
                `;
                    });

                    container.innerHTML = html;
                }

                // ============================================================
