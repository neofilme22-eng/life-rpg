                                // ===== FUNCIONES DEL SANTUARIO =====
                                // ============================================================

                                function selectVariant(variantId) {
                                    currentVariant = variantId;

                                    document.querySelectorAll('.variant-btn').forEach(function (btn) {
                                        btn.classList.toggle('active', btn.dataset.variant === variantId);
                                    });

                                    var customSettings = document.getElementById('custom-settings');
                                    if (customSettings) {
                                        customSettings.style.display = variantId === 'custom' ? 'flex' : 'none';
                                    }

                                    var variant = VARIANTES[variantId];
                                    if (variantId !== 'custom') {
                                        timer = variant.focus * 60;
                                        isBreak = false;
                                        updatePomodoroDisplay();
                                        updateSanctuaryStatus();
                                    }

                                    if (interval) {
                                        clearInterval(interval);
                                        interval = null;
                                        var btn = document.getElementById('pomo-start-btn');
                                        if (btn) {
                                            btn.textContent = '🕯️ Iniciar Sesión';
                                            btn.classList.remove('running');
                                        }
                                    }
                                }

                                function applyCustomVariant() {
                                    var focusInput = document.getElementById('custom-focus');
                                    var breakInput = document.getElementById('custom-break');

                                    var focusMin = parseInt(focusInput ? focusInput.value : 25) || 25;
                                    var breakMin = parseInt(breakInput ? breakInput.value : 5) || 5;

                                    VARIANTES.custom.focus = Math.max(1, Math.min(180, focusMin));
                                    VARIANTES.custom.break = Math.max(1, Math.min(60, breakMin));

                                    timer = VARIANTES.custom.focus * 60;
                                    isBreak = false;
                                    updatePomodoroDisplay();
                                    updateSanctuaryStatus();

                                    if (interval) {
                                        clearInterval(interval);
                                        interval = null;
                                        var btn = document.getElementById('pomo-start-btn');
                                        if (btn) {
                                            btn.textContent = '🕯️ Iniciar Sesión';
                                            btn.classList.remove('running');
                                        }
                                    }
                                    showToast('⚙️ Configuración personalizada aplicada: ' + VARIANTES.custom.focus + ' min enfoque, ' + VARIANTES.custom.break + ' min descanso.', 'info', 'Santuario');
                                }

                                function getCurrentVariant() {
                                    return VARIANTES[currentVariant];
                                }

                                function startPomodoro() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    if (interval) {
                                        clearInterval(interval);
                                        interval = null;
                                        var btn = document.getElementById('pomo-start-btn');
                                        if (btn) {
                                            btn.textContent = '▶️ Continuar';
                                            btn.classList.remove('running');
                                        }
                                        return;
                                    }

                                    var btn = document.getElementById('pomo-start-btn');
                                    if (btn) {
                                        btn.textContent = '⏸️ Pausar';
                                        btn.classList.add('running');
                                    }

                                    interval = setInterval(function () {
                                        if (timer > 0) {
                                            timer--;
                                            updatePomodoroDisplay();
                                        } else {
                                            clearInterval(interval);
                                            interval = null;
                                            completePomodoroCycle();
                                        }
                                    }, 1000);
                                }

                                function completePomodoroCycle() {
                                    var variant = getCurrentVariant();

                                    if (!isBreak) {
                                        player.pomodoroSessions = (player.pomodoroSessions || 0) + 1;
                                        var focusTime = currentVariant === 'custom' ? VARIANTES.custom.focus : variant.focus;
                                        player.pomodoroFocusTime = (player.pomodoroFocusTime || 0) + focusTime;

                                        var expGain = Math.floor(focusTime / 2) + 5;
                                        gainRewards(expGain, 3, 'mente', 'pomodoro', '🕯️ Sesión de enfoque completada', focusTime + ' minutos');

                                        showToast('🕯️ ¡Sesión de enfoque completada! ' + focusTime + ' min, +' + expGain + ' EXP en Mente', 'success', 'Santuario');

                                        isBreak = true;
                                        timer = variant.break * 60;
                                        updatePomodoroDisplay();
                                        updateSanctuaryStatus();
                                        currentCycle++;

                                        var btn = document.getElementById('pomo-start-btn');
                                        if (btn) {
                                            btn.textContent = '☕ Iniciar Descanso';
                                            btn.classList.remove('running');
                                        }

                                        checkAndUnlockTrophies();
                                        saveGame();
                                    } else {
                                        isBreak = false;
                                        timer = variant.focus * 60;
                                        updatePomodoroDisplay();
                                        updateSanctuaryStatus();

                                        var btn = document.getElementById('pomo-start-btn');
                                        if (btn) {
                                            btn.textContent = '🕯️ Iniciar Sesión';
                                            btn.classList.remove('running');
                                        }

                                        showToast('☕ ¡Descanso completado! Ciclo ' + currentCycle + ' finalizado.', 'info', 'Santuario');
                                    }
                                }

                                function skipPomodoro() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    if (interval) {
                                        clearInterval(interval);
                                        interval = null;
                                        var btn = document.getElementById('pomo-start-btn');
                                        if (btn) {
                                            btn.textContent = '🕯️ Iniciar Sesión';
                                            btn.classList.remove('running');
                                        }
                                    }

                                    var variant = getCurrentVariant();
                                    if (isBreak) {
                                        isBreak = false;
                                        timer = variant.focus * 60;
                                        currentCycle++;
                                    } else {
                                        var focusTime = currentVariant === 'custom' ? VARIANTES.custom.focus : variant.focus;
                                        var elapsed = Math.round((variant.focus * 60 - timer) / 60);
                                        if (elapsed > 0) {
                                            var expGain = Math.floor(elapsed / 2) + 2;
                                            gainRewards(expGain, 1, 'mente', 'pomodoro', '⏭️ Sesión interrumpida', elapsed + ' minutos');
                                            showToast('⏭️ Sesión interrumpida después de ' + elapsed + ' min. +' + expGain + ' EXP', 'warning', 'Santuario');
                                            applyDamage(8, 'Sesión de enfoque incompleta', 5);
                                        }
                                        isBreak = true;
                                        timer = variant.break * 60;
                                        currentCycle++;
                                    }

                                    updatePomodoroDisplay();
                                    updateSanctuaryStatus();
                                    saveGame();
                                }

                                function resetPomodoro() {
                                    if (interval) {
                                        clearInterval(interval);
                                        interval = null;
                                    }

                                    var variant = getCurrentVariant();
                                    timer = variant.focus * 60;
                                    isBreak = false;
                                    currentCycle = 1;
                                    updatePomodoroDisplay();
                                    updateSanctuaryStatus();

                                    var btn = document.getElementById('pomo-start-btn');
                                    if (btn) {
                                        btn.textContent = '🕯️ Iniciar Sesión';
                                        btn.classList.remove('running');
                                    }
                                    showToast('⟲ Santuario reiniciado.', 'info', 'Santuario');
                                }

                                function updatePomodoroDisplay() {
                                    var minutes = Math.floor(timer / 60);
                                    var seconds = timer % 60;
                                    var display = document.getElementById('pomo-time');
                                    if (display) {
                                        display.innerText = (minutes.toString().padStart(2, '0')) + ':' + (seconds.toString().padStart(2, '0'));
                                    }
                                }

                                function updateSanctuaryStatus() {
                                    var statusEl = document.getElementById('sanctuary-status');
                                    if (!statusEl) return;

                                    var variant = getCurrentVariant();
                                    var phase = isBreak ? 'Descanso' : 'Enfoque';
                                    var icon = isBreak ? '☕' : '⚔️';
                                    var colorClass = isBreak ? 'status-break' : 'status-focus';

                                    statusEl.innerHTML = `
                <span class="${colorClass}">${icon} ${phase}</span> — 
                <span id="cycle-info">Ciclo ${currentCycle}</span>
                <span style="opacity:0.3; margin-left:8px;">|</span>
                <span style="opacity:0.4; font-size:0.65rem;">${variant.label}</span>
            `;
                                }

                                // ============================================================
