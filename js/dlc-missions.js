                // ===== FUNCIONES DE MISIONES DLC =====
                // ============================================================

                function refreshMissions() {
                    var availableMain = player.rawMissions.filter(function (m) { return m.type === 'main' && !m.completed; });
                    if (availableMain.length > 0) {
                        var mainToShow = Math.min(MAX_MAIN_MISSIONS, availableMain.length);
                        var shuffledMain = availableMain.slice().sort(function () { return 0.5 - Math.random(); });
                        var selectedMain = shuffledMain.slice(0, mainToShow);
                        activeMainIds = selectedMain.map(function (m) { return m.id; });
                    } else {
                        activeMainIds = [];
                    }

                    var availableSec = player.rawMissions.filter(function (m) { return m.type === 'secondary' && !m.completed; });
                    if (availableSec.length > 0) {
                        var secToShow = Math.min(MAX_SECONDARY_MISSIONS, availableSec.length);
                        var shuffledSec = availableSec.slice().sort(function () { return 0.5 - Math.random(); });
                        var selectedSec = shuffledSec.slice(0, secToShow);
                        activeSecondaryIds = selectedSec.map(function (m) { return m.id; });
                    } else {
                        activeSecondaryIds = [];
                    }
                }

                function rerollMissions() {
                    if (player.gameOver) {
                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                        return;
                    }

                    var availableMain = player.rawMissions.filter(function (m) { return m.type === 'main' && !m.completed; });
                    var availableSec = player.rawMissions.filter(function (m) { return m.type === 'secondary' && !m.completed; });

                    if (availableMain.length === 0 && availableSec.length === 0) {
                        showToast('No hay misiones disponibles. Instala DLCs desde Configuración.', 'warning', 'Misiones');
                        return;
                    }

                    var mainSelected = [];
                    var secSelected = [];

                    if (availableMain.length > 0) {
                        var mainToShow = Math.min(MAX_MAIN_MISSIONS, availableMain.length);
                        var shuffledMain = availableMain.slice().sort(function () { return 0.5 - Math.random(); });
                        mainSelected = shuffledMain.slice(0, mainToShow);
                    }

                    if (availableSec.length > 0) {
                        var secToShow = Math.min(MAX_SECONDARY_MISSIONS, availableSec.length);
                        var shuffledSec = availableSec.slice().sort(function () { return 0.5 - Math.random(); });
                        secSelected = shuffledSec.slice(0, secToShow);
                    }

                    activeMainIds = mainSelected.map(function (m) { return m.id; });
                    activeSecondaryIds = secSelected.map(function (m) { return m.id; });

                    saveGame();
                    renderMissions();

                    showToast('🎲 Misiones actualizadas!', 'info', 'Re-roll');
                }

                function completeMission(id) {
                    if (player.gameOver) {
                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                        return;
                    }

                    var mission = player.rawMissions.find(function (m) { return m.id === id; });
                    if (mission && !mission.completed) {
                        var dlcName = mission.dlcName;

                        mission.completed = true;

                        var expBoost = player.expBoost || 0;
                        var goldBoost = player.goldBoost || 0;
                        gainRewards(mission.expReward + expBoost, mission.goldReward + goldBoost, mission.attr, 'mission', '📜 Misión "' + mission.title + '"', 'DLC: ' + dlcName);
                        checkCampaignCompletion();
                        checkDLCCompletion(dlcName);

                        if (mission.type === 'main') {
                            activeMainIds = activeMainIds.filter(function (mid) { return mid !== id; });
                            var availableMain = player.rawMissions.filter(function (m) {
                                return m.type === 'main' && !m.completed && activeMainIds.indexOf(m.id) === -1;
                            });
                            if (availableMain.length > 0) {
                                var shuffled = availableMain.slice().sort(function () { return 0.5 - Math.random(); });
                                var newMain = shuffled[0];
                                activeMainIds.push(newMain.id);
                            }
                        } else if (mission.type === 'secondary') {
                            activeSecondaryIds = activeSecondaryIds.filter(function (mid) { return mid !== id; });
                            var availableSec = player.rawMissions.filter(function (m) {
                                return m.type === 'secondary' && !m.completed && activeSecondaryIds.indexOf(m.id) === -1;
                            });
                            if (availableSec.length > 0) {
                                var shuffled = availableSec.slice().sort(function () { return 0.5 - Math.random(); });
                                var newSec = shuffled[0];
                                activeSecondaryIds.push(newSec.id);
                            }
                        }

                        saveGame();
                        renderMissions();
                        updateHUD();
                        checkAndUnlockTrophies();

                        showToast('✅ Misión "' + mission.title + '" completada!', 'success', 'Misión');
                    }
                }

                function checkCampaignCompletion() {
                    var allMissions = player.rawMissions;
                    if (allMissions.length > 0 && allMissions.every(function (m) { return m.completed; })) {
                        showToast('🏆 ¡FELICIDADES! Has completado todas las misiones de tus DLCs activos.', 'success', '¡Logro!');
                        checkAndUnlockTrophies();
                    }
                }

                function renderMissions() {
                    var container = document.getElementById('mission-container');
                    if (!container) return;
                    container.innerHTML = '';

                    var displayMissions = player.rawMissions.filter(function (m) {
                        if (m.completed) return false;
                        if (m.type === 'main') return activeMainIds.indexOf(m.id) !== -1;
                        if (m.type === 'secondary') return activeSecondaryIds.indexOf(m.id) !== -1;
                        return false;
                    });

                    if (displayMissions.length === 0) {
                        var availableMain = player.rawMissions.filter(function (m) { return m.type === 'main' && !m.completed; });
                        var availableSec = player.rawMissions.filter(function (m) { return m.type === 'secondary' && !m.completed; });

                        if (availableMain.length > 0 || availableSec.length > 0) {
                            refreshMissions();
                            renderMissions();
                            return;
                        }

                        container.innerHTML = `
                    <p style="color: var(--text-muted); grid-column: 1 / -1; font-family:'Georgia','Times New Roman',serif; text-align:center; padding:20px 0;">
                        No hay misiones activas. 
                        ${(availableMain.length === 0 && availableSec.length === 0) ?
                                'Instala DLCs desde Configuración para obtener misiones.' :
                                '💡 Usa el botón "Re-roll" para ver nuevas misiones.'}
                    </p>`;
                        return;
                    }

                    var sortedMissions = displayMissions.slice().sort(function (a, b) {
                        if (a.type === 'main' && b.type === 'secondary') return -1;
                        if (a.type === 'secondary' && b.type === 'main') return 1;
                        return 0;
                    });

                    sortedMissions.forEach(function (m) {
                        var expBoost = player.expBoost || 0;
                        var goldBoost = player.goldBoost || 0;
                        var mult = getDifficultyMultipliers();

                        var card = document.createElement('div');
                        card.className = 'mission-card ' + m.type;

                        card.innerHTML = `
                    <div class="mission-card-content">
                        <div class="mission-dlc-name">📦 ${m.dlcName}</div>
                        <div class="mission-title">${m.title}</div>
                        <div class="mission-card-spacer"></div>
                        <div class="mission-attr-display">${attrNames[m.attr] || m.attr}</div>
                        <div class="mission-footer">
                            <span class="mission-reward">+${Math.floor((m.expReward + expBoost) * mult.exp)} EXP ${expBoost > 0 ? '(bono +' + expBoost + ')' : ''}</span>
                            <button class="mission-complete-btn" onclick="completeMission('${m.id}')" ${player.gameOver ? 'disabled' : ''}>Completar</button>
                        </div>
                    </div>
                `;

                        container.appendChild(card);
                    });
                }

                // ============================================================
