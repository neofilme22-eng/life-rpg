                // ===== MISIONES DIARIAS =====
                // ============================================================

                function loadDailyMissions() {
                    var data = localStorage.getItem('life_rpg_daily_missions');
                    if (data) {
                        try {
                            return JSON.parse(data);
                        } catch (e) {
                            return [];
                        }
                    }
                    return [];
                }

                function saveDailyMissions(missions) {
                    localStorage.setItem('life_rpg_daily_missions', JSON.stringify(missions));
                }

                function cleanOldDailyMissions() {
                    var missions = loadDailyMissions();
                    if (!missions || missions.length === 0) return;

                    var today = new Date();
                    var todayStr = today.toISOString().split('T')[0];

                    var filtered = missions.filter(function (m) {
                        if (!m.date) return false;
                        if (m.date >= todayStr) return true;
                        if (m.completed) return false;
                        return false;
                    });

                    if (filtered.length !== missions.length) {
                        saveDailyMissions(filtered);
                        renderDailyMissions();
                    }
                }

                function addDailyMission() {
                    if (player.gameOver) {
                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                        return;
                    }

                    var titleInput = document.getElementById('daily-title');
                    var timeInput = document.getElementById('daily-time');

                    var title = titleInput ? titleInput.value.trim() : '';
                    var time = timeInput ? timeInput.value : '';

                    if (!title) {
                        showToast('Ingresa un título para la misión.', 'warning', 'Error');
                        return;
                    }

                    var missions = loadDailyMissions();

                    var today = new Date();
                    var dateStr = today.toISOString().split('T')[0];

                    var newMission = {
                        id: 'daily_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                        title: title,
                        date: dateStr,
                        time: time || null,
                        completed: false,
                        createdAt: Date.now(),
                        completedAt: null,
                        penaltyApplied: false
                    };

                    missions.push(newMission);
                    saveDailyMissions(missions);
                    renderDailyMissions();

                    if (titleInput) titleInput.value = '';
                    if (timeInput) timeInput.value = '';
                    if (titleInput) titleInput.focus();

                    var dateFormatted = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    var msg = '📋 Misión "' + title + '" creada para hoy (' + dateFormatted + ')';
                    if (time) msg += ' a las ' + time;
                    showToast(msg, 'success', 'Misión Diaria');
                }

                function completeDailyMission(id) {
                    if (player.gameOver) {
                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                        return;
                    }

                    var missions = loadDailyMissions();
                    var mission = missions.find(function (m) { return m.id === id; });

                    if (!mission) return;
                    if (mission.completed) {
                        showToast('Esta misión ya está completada.', 'warning', 'Misión');
                        return;
                    }

                    if (isMissionOverdue(mission)) {
                        showToast('Esta misión ya está vencida. No se puede completar.', 'error', 'Misión');
                        renderDailyMissions();
                        return;
                    }

                    mission.completed = true;
                    mission.completedAt = Date.now();

                    saveDailyMissions(missions);
                    renderDailyMissions();

                    gainRewards(8, 3, 'disciplina', 'daily', '📋 Misión diaria "' + mission.title + '"', 'Tarea completada');
                    showToast('Misión "' + mission.title + '" completada! +8 EXP, +3 ORO', 'success', 'Misión');
                    checkAndUnlockTrophies();
                }

                function isMissionOverdue(mission) {
                    if (mission.completed) return false;

                    var now = new Date();
                    var todayStr = now.toISOString().split('T')[0];
                    var missionDateStr = mission.date;

                    if (missionDateStr < todayStr) return true;

                    if (mission.time) {
                        var timeParts = mission.time.split(':').map(Number);
                        var missionDateTime = new Date(now);
                        missionDateTime.setHours(timeParts[0], timeParts[1], 0, 0);
                        return now > missionDateTime;
                    }

                    var endOfDay = new Date(now);
                    endOfDay.setHours(23, 59, 59, 999);
                    return now > endOfDay;
                }

                function checkOverdueDailyMissions() {
                    if (player.gameOver) return;

                    var missions = loadDailyMissions();
                    var changed = false;
                    var damageCount = 0;

                    missions.forEach(function (m) {
                        if (!m.completed && isMissionOverdue(m) && !m.penaltyApplied) {
                            m.penaltyApplied = true;
                            damageCount++;
                            changed = true;
                            applyDamage(15, 'Misión diaria vencida: "' + m.title + '"', 8);
                        }
                    });

                    var todayStr = new Date().toISOString().split('T')[0];
                    var todaysMissions = missions.filter(function (m) { return m.date === todayStr; });
                    var zeroMissionDay = todaysMissions.length > 0 && todaysMissions.every(function (m) {
                        return !m.completed && m.penaltyApplied;
                    });

                    if (zeroMissionDay && player.lastZeroMissionDayPenalty !== todayStr) {
                        player.lastZeroMissionDayPenalty = todayStr;
                        applyDamage(15, 'Día completo sin ninguna misión diaria completada', 8);
                        addLogEntry('daily', '💀 Día perdido: ninguna misión diaria completada', '', 0, 0, null);
                        showToast('💀 No completaste ninguna misión diaria hoy. Daño extra.', 'error', 'Misiones');
                        saveGame();
                    }

                    if (changed) {
                        saveDailyMissions(missions);
                        renderDailyMissions();
                        if (damageCount > 0) {
                            var msg = 'Tienes ' + damageCount + ' misión(es) diaria(s) vencida(s). Has recibido daño.';
                            showToast(msg, 'warning', 'Misiones');
                        }
                    }
                }

                function renderDailyMissions() {
                    cleanOldDailyMissions();
                    checkOverdueDailyMissions();

                    var container = document.getElementById('daily-mission-container');
                    if (!container) return;

                    var missions = loadDailyMissions();

                    missions.sort(function (a, b) {
                        var getPriority = function (m) {
                            if (m.completed) return 2;
                            if (isMissionOverdue(m)) return 3;
                            return 1;
                        };
                        return getPriority(a) - getPriority(b);
                    });

                    if (missions.length === 0) {
                        container.innerHTML = `
                    <div style="color:var(--text-muted); opacity:0.5; text-align:center; font-style:italic; font-family:'Georgia','Times New Roman',serif; padding:20px 0;">
                        No hay misiones para hoy. ¡Crea una para empezar!
                    </div>
                `;
                        return;
                    }

                    var html = '';
                    missions.forEach(function (m) {
                        var overdue = !m.completed && isMissionOverdue(m);
                        var isCompleted = m.completed;

                        var cardClass = 'daily-mission-card';
                        if (isCompleted) {
                            cardClass += ' completed';
                        } else if (overdue) {
                            cardClass += ' overdue';
                        } else {
                            cardClass += ' pending';
                        }

                        var dateParts = m.date.split('-');
                        var dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                        var dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        var timeStr = m.time || 'Sin hora';

                        var statusText = '⏳ Pendiente';
                        var statusClass = 'pending-status';
                        if (isCompleted) {
                            statusText = '✅ Completada';
                            statusClass = 'completed-status';
                        } else if (overdue) {
                            statusText = '⛔ Vencida';
                            statusClass = 'overdue-status';
                        }

                        var safeId = m.id.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

                        var expReward = 8;
                        var goldReward = 3;
                        var mult = getDifficultyMultipliers();
                        var expBoost = player.expBoost || 0;
                        var goldBoost = player.goldBoost || 0;
                        var totalExp = Math.floor((expReward + expBoost) * mult.exp);
                        var totalGold = Math.floor((goldReward + goldBoost) * mult.gold);

                        html += `
                    <div class="${cardClass}">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%;">
                            <span class="mission-dlc-name" style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:600; opacity:0.6; font-family:'Georgia','Times New Roman',serif;">Misión Diaria</span>
                            <span class="daily-deadline" style="font-size:0.7rem; color:var(--text-muted); opacity:0.7; font-family:'Georgia','Times New Roman',serif; white-space:nowrap; padding:2px 10px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.04);">📅 ${dateStr} ${m.time ? '🕐 ' + escapeHtml(timeStr) : ''}</span>
                        </div>
                        <div class="daily-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-top:4px;">                    
                            <span class="daily-title" style="font-weight:bold; font-size:1rem; color:var(--text); font-family:'Georgia','Times New Roman',serif; flex:1;">${escapeHtml(m.title)}</span>
                        </div>
                        <br>
                        <span class="daily-status ${statusClass}" style="font-size:0.65rem; font-weight:bold; padding:2px 12px; border-radius:12px; display:inline-block; margin-top:4px; font-family:'Georgia','Times New Roman',serif; align-self:flex-start;">${statusText}</span>
                        <div class="mission-footer" style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; margin-top:8px; border-top:1px solid rgba(255,255,255,0.04);">
                            <span class="mission-reward" style="font-size:0.85rem; color:var(--success); font-weight:bold; font-family:'Georgia','Times New Roman',serif;">+${totalExp} EXP ${expBoost > 0 ? '(bono +' + expBoost + ')' : ''}</span>
                            ${!isCompleted && !overdue ? `<button class="complete-btn" onclick="completeDailyMission('${safeId}')" style="padding:6px 16px; border-radius:6px; cursor:pointer; font-size:0.8rem; transition:all 0.2s; font-family:'Georgia','Times New Roman',serif; font-weight:bold; background:linear-gradient(145deg, #d97706, #fbbf24); color:#0f172a; border:1px solid rgba(251,191,36,0.3);">Completar</button>` : ''}
                        </div>
                    </div>
                `;
                    });

                    container.innerHTML = html;
                }

                function startDailyCheckInterval() {
                    if (dailyCheckInterval) {
                        clearInterval(dailyCheckInterval);
                    }
                    dailyCheckInterval = setInterval(function () {
                        checkOverdueDailyMissions();
                        if (player.rawRunes && player.rawRunes.length > 0) {
                            checkAndResetRunes();
                        }
                    }, 30000);
                }

                // ============================================================
