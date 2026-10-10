                        // ===== FUNCIONES DE METAS (internamente siguen llamándose "bosses") =====
                        // ============================================================

                        function toggleBossTask(bossId, taskIndex) {
                            if (player.gameOver) {
                                showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                return;
                            }

                            var boss = player.bosses.find(function (b) { return b.id === bossId; });
                            if (!boss || boss.defeated) return;

                            boss.taskStatus[taskIndex] = !boss.taskStatus[taskIndex];
                            var willDefeat = boss.taskStatus.every(function (status) { return status === true; });

                            renderBosses();
                            saveGame();

                            if (willDefeat) {
                                var card = document.querySelector('.boss-card[data-boss-id="' + bossId + '"]');
                                if (card && typeof triggerFxBurst === 'function') {
                                    var mult = getDifficultyMultipliers();
                                    var expPreview = Math.floor(boss.expReward * mult.exp);
                                    triggerFxBurst(card, '+' + expPreview + ' EXP', '#a1443d', { big: true });
                                    setTimeout(function () { defeatBoss(bossId); }, 650);
                                } else {
                                    defeatBoss(bossId);
                                }
                            }
                        }

                        function defeatBoss(bossId) {
                            if (player.gameOver) {
                                showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                return;
                            }

                            var boss = player.bosses.find(function (b) { return b.id === bossId; });
                            if (!boss || boss.defeated) return;

                            boss.defeated = true;
                            boss.defeatedDate = Date.now();

                            var mult = getDifficultyMultipliers();
                            var expGain = Math.floor(boss.expReward * mult.exp);
                            var goldGain = Math.floor(boss.goldReward * mult.gold);

                            gainRewards(expGain, goldGain, boss.attrReward, 'boss', 'Meta "' + boss.name + '" cumplida', '¡Cumplida!');

                            renderBosses();
                            renderBestiary();
                            saveGame();
                            checkAndUnlockTrophies();

                            showToast('🎯 ¡Meta cumplida! ' + renderIconHTML(boss.icon, '🎯') + ' ' + boss.name + ' +' + expGain + ' EXP' + goldText(goldGain), 'success', 'Meta');
                        }

                        function renderBosses() {
                            var container = document.getElementById('boss-container');
                            if (!container) return;
                            container.innerHTML = '';

                            var now = new Date();
                            var updated = false;

                            player.bosses.forEach(function (boss) {
                                if (boss.deadline && new Date(boss.deadline) < now && !boss.defeated && !boss.vencido) {
                                    boss.vencido = true;
                                    updated = true;
                                    addLogEntry('boss', 'Meta "' + boss.name + '" vencida', 'Se acabó el plazo', 0, 0, null);
                                    applyDamage(30, 'Meta vencida', 15);
                                }
                            });

                            if (updated) {
                                saveGame();
                            }

                            var bossesActivos = player.bosses.filter(function (b) { return !b.defeated && !b.vencido; });

                            var totalDerrotados = player.bosses.filter(function (b) { return b.defeated; }).length;
                            var totalVencidos = player.bosses.filter(function (b) { return b.vencido; }).length;
                            var totalActivos = bossesActivos.length;

                            var countEl = document.getElementById('boss-count');
                            var totalEl = document.getElementById('boss-total');
                            if (countEl) countEl.textContent = totalDerrotados;
                            if (totalEl) totalEl.textContent = player.bosses.length;


                            renderBossRecord();

                            if (totalActivos === 0) {
                                if (totalDerrotados > 0 || totalVencidos > 0) {
                                    container.innerHTML = `
                        <div class="boss-empty">
                            ¡Cumpliste todas tus metas! (${totalDerrotados} cumplidas${totalVencidos > 0 ? ', ' + totalVencidos + ' vencidas' : ''})
                        </div>
                    `;
                                } else {
                                    container.innerHTML = `
                        <div class="boss-empty">
                            No hay metas activas. Instalá un JSON de metas desde Configuración.
                        </div>
                    `;
                                }
                                return;
                            }

                            var sortedBosses = bossesActivos.slice().sort(function (a, b) {
                                if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
                                if (a.deadline) return -1;
                                if (b.deadline) return 1;
                                return 0;
                            });

                            sortedBosses.forEach(function (boss) {
                                var totalTasks = boss.tasks.length;
                                var completedTasks = boss.taskStatus.filter(function (s) { return s === true; }).length;
                                var progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                                var isOverdue = boss.deadline && new Date(boss.deadline) < new Date();

                                var card = document.createElement('div');
                                card.className = 'boss-card' + (isOverdue ? ' overdue' : '');
                                card.dataset.bossId = boss.id;

                                var deadlineHTML = '';
                                if (boss.deadline) {
                                    var date = new Date(boss.deadline);
                                    var formatted = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                    var daysLeft = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
                                    var daysText = '';
                                    if (daysLeft > 0) {
                                        daysText = '(' + daysLeft + ' días restantes)';
                                    } else if (daysLeft === 0) {
                                        daysText = '(¡Hoy es el último día!)';
                                    } else {
                                        daysText = '(Vencida hace ' + Math.abs(daysLeft) + ' días)';
                                    }
                                    deadlineHTML = `
                        <div class="boss-deadline">
                            <strong>Fecha límite:</strong> ${formatted} ${daysText}
                        </div>
                    `;
                                }

                                var tasksHTML = '';
                                if (boss.tasks.length > 0) {
                                    tasksHTML = '<div class="boss-tasks">';
                                    boss.tasks.forEach(function (task, index) {
                                        var isCompleted = boss.taskStatus[index] || false;
                                        tasksHTML += `
                            <div class="boss-task-item ${isCompleted ? 'completed' : ''}">
                                <input type="checkbox" 
                                    ${isCompleted ? 'checked' : ''} 
                                    ${player.gameOver ? 'disabled' : ''}
                                    onchange="toggleBossTask('${boss.id}', ${index})">
                                <span class="task-label">${task}</span>
                            </div>
                        `;
                                    });
                                    tasksHTML += '</div>';
                                }

                                var statusText = isOverdue ? 'VENCIDA' : 'En curso';

                                card.innerHTML = `
                    <div class="boss-header">
                        <div>
                            <h3 class="boss-name"> ${boss.name}</h3>
                        </div>
                        <span class="boss-status">${statusText}</span>
                    </div>
                    ${renderEntityImageBlock(boss.image, boss.icon, boss.name)}
                    ${deadlineHTML}
                    <div class="boss-progress">
                        <div class="boss-progress-info">
                            <span>Progreso</span>
                            <span>${completedTasks} / ${totalTasks} tareas</span>
                        </div>
                        <div class="boss-progress-bar">
                            <div class="progress-fill" style="width: ${progress}%;"></div>
                        </div>
                    </div>
                    ${tasksHTML}
                    <div class="boss-reward">
                        <span>Recompensa: +${Math.floor(boss.expReward * getDifficultyMultipliers().exp)} EXP${goldText(Math.floor(boss.goldReward * getDifficultyMultipliers().gold))}</span>
                    </div>
                `;

                                container.appendChild(card);
                            });
                        }


                        // ============================================================
                        // ===== HISTORIAL DE METAS =====
                        // Muestra las metas cumplidas (con fecha) y las que se
                        // vencieron por plazo (en gris, como fallidas).
                        // ============================================================

                        function renderBossRecord() {
                            var container = document.getElementById('boss-record-container');
                            if (!container) return;

                            var esc = (typeof escapeHtml === 'function') ? escapeHtml : function (t) { return String(t); };
                            var fmt = function (ms) {
                                return ms ? new Date(ms).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'fecha desconocida';
                            };

                            var entries = [];
                            (player.bosses || []).forEach(function (b) {
                                if (b.defeated) {
                                    entries.push({ boss: b, failed: false, date: b.defeatedDate || 0 });
                                } else if (b.vencido) {
                                    entries.push({ boss: b, failed: true, date: b.deadline ? new Date(b.deadline).getTime() : 0 });
                                }
                            });
                            entries.sort(function (a, b) { return b.date - a.date; });

                            var countEl = document.getElementById('boss-record-count');
                            if (countEl) {
                                var ok = entries.filter(function (e) { return !e.failed; }).length;
                                countEl.textContent = ok + ' cumplidas · ' + (entries.length - ok) + ' fallidas';
                            }

                            if (entries.length === 0) {
                                container.innerHTML = '<div class="boss-record-empty event-empty">Todavía no hay metas cumplidas ni fallidas.</div>';
                                return;
                            }

                            var html = '';
                            entries.forEach(function (e) {
                                var b = e.boss;
                                html += '<div class="boss-record-item ' + (e.failed ? 'failed' : 'defeated') + '">' +
                                    '<span class="boss-record-icon">' + renderIconHTML(b.icon, '🎯') + '</span>' +
                                    '<div class="boss-record-info">' +
                                    '<span class="boss-record-name">' + esc(b.name) + '</span>' +
                                    '<span class="boss-record-date">' + (e.failed
                                        ? '✖ Fallida · venció el ' + fmt(e.date)
                                        : '✔ Cumplida el ' + fmt(e.date)) + '</span>' +
                                    '</div>' +
                                    '</div>';
                            });
                            container.innerHTML = html;
                        }

                        function resetBosses() {
                            if (player.gameOver) {
                                showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                return;
                            }

                            if (player.bosses.length === 0) {
                                showToast('No hay metas para eliminar.', 'info', 'Metas');
                                return;
                            }

                            showModal(
                                '',
                                'Resetear Metas',
                                '¿Estás seguro de resetear todas las metas? Las perderás todas.',
                                'Resetear',
                                function () {
                                    player.bosses = [];
                                    saveGame();
                                    renderBosses();
                                    renderBestiary();
                                    if (typeof renderBossImportList === 'function') renderBossImportList();
                                    showToast('Todas las metas han sido eliminadas.', 'info', 'Metas');
                                },
                                true
                            );
                        }

                        // ============================================================
