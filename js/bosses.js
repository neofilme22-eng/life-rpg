                        // ===== FUNCIONES DE BOSSES =====
                        // ============================================================

                        function toggleBossTask(bossId, taskIndex) {
                            if (player.gameOver) {
                                showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                return;
                            }

                            var boss = player.bosses.find(function (b) { return b.id === bossId; });
                            if (!boss || boss.defeated) return;

                            boss.taskStatus[taskIndex] = !boss.taskStatus[taskIndex];
                            renderBosses();
                            saveGame();

                            if (boss.taskStatus.every(function (status) { return status === true; })) {
                                defeatBoss(bossId);
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

                            gainRewards(expGain, goldGain, boss.attrReward, 'boss', '👹 Boss "' + boss.name + '" derrotado', '¡Victoria!');

                            renderBosses();
                            renderBestiary();
                            saveGame();
                            checkAndUnlockTrophies();

                            showToast('👹 ¡BOSS DERROTADO! ' + boss.icon + ' ' + boss.name + ' +' + expGain + ' EXP, +' + goldGain + ' ORO', 'success', 'Boss');
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
                                    addLogEntry('boss', '⏰ Boss "' + boss.name + '" vencido', 'El tiempo se agotó', 0, 0, null);
                                    applyDamage(20, 'Boss vencido', 10);
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

                            if (totalActivos === 0) {
                                if (totalDerrotados > 0 || totalVencidos > 0) {
                                    container.innerHTML = `
                        <div class="boss-empty">
                            ¡Has derrotado a todos los bosses! (${totalDerrotados} derrotados${totalVencidos > 0 ? ', ' + totalVencidos + ' vencidos' : ''})
                        </div>
                    `;
                                } else {
                                    container.innerHTML = `
                        <div class="boss-empty">
                            No hay bosses activos. Invoca bosses desde Configuración o instala un JSON.
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
                                        daysText = '(Vencido hace ' + Math.abs(daysLeft) + ' días)';
                                    }
                                    deadlineHTML = `
                        <div class="boss-deadline">
                            📅 <strong>Fecha límite:</strong> ${formatted} ${daysText}
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

                                var statusText = isOverdue ? 'VENCIDO' : 'Activo';

                                card.innerHTML = `
                    <div class="boss-header">
                        <div>
                            <h3 class="boss-name">${boss.icon} ${boss.name}</h3>
                        </div>
                        <span class="boss-status">${statusText}</span>
                    </div>
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
                        <span>🏆 Recompensa: +${Math.floor(boss.expReward * getDifficultyMultipliers().exp)} EXP, +${Math.floor(boss.goldReward * getDifficultyMultipliers().gold)} ORO</span>
                    </div>
                `;

                                container.appendChild(card);
                            });
                        }

                        function resetBosses() {
                            if (player.gameOver) {
                                showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                return;
                            }

                            if (player.bosses.length === 0) {
                                showToast('No hay bosses para eliminar.', 'info', 'Bosses');
                                return;
                            }

                            showModal(
                                '👹',
                                'Resetear Bosses',
                                '¿Estás seguro de resetear todos los bosses? Los perderás todos.',
                                'Resetear',
                                function () {
                                    player.bosses = [];
                                    saveGame();
                                    renderBosses();
                                    renderBestiary();
                                    showToast('👹 Todos los bosses han sido eliminados.', 'info', 'Bosses');
                                },
                                true
                            );
                        }

                        function renderBestiary() {
                            var container = document.getElementById('bestiary-container');
                            if (!container) return;

                            var defeatedBosses = player.bosses.filter(function (b) { return b.defeated; });

                            if (defeatedBosses.length === 0) {
                                container.innerHTML = '<div class="bestiary-empty">Aún no has derrotado ningún boss. ¡La cacería comienza!</div>';
                                return;
                            }

                            var sorted = defeatedBosses.slice().sort(function (a, b) {
                                var dateA = a.defeatedDate || a.updatedAt || 0;
                                var dateB = b.defeatedDate || b.updatedAt || 0;
                                return dateB - dateA;
                            });

                            var html = '';
                            sorted.forEach(function (boss) {
                                var date = boss.defeatedDate ? new Date(boss.defeatedDate) : null;
                                var dateStr = date ? date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Fecha desconocida';

                                html += `
                    <div class="bestiary-card">
                        <span class="bestiary-icon">${boss.icon || '👹'}</span>
                        <div class="bestiary-name">${boss.name}</div>
                        <br>
                        <div class="bestiary-date">Derrotado el ${dateStr}</div>
                    </div>
                `;
                            });

                            container.innerHTML = html;
                        }

                        // ============================================================
