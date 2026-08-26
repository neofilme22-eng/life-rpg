                            // ===== FUNCIONES DE CÍRCULO SOCIAL =====
                            // ============================================================

                            function checkAffinityDecay() {
                                if (player.gameOver) return;

                                var now = Date.now();
                                var decayDays = 7;
                                var decayAmount = 2;

                                player.flock.forEach(function (member) {
                                    if (!member.lastInteraction) return;

                                    var daysSince = Math.floor((now - member.lastInteraction) / (24 * 60 * 60 * 1000));
                                    if (daysSince >= decayDays) {
                                        var decayCycles = Math.floor(daysSince / decayDays);
                                        var totalDecay = decayCycles * decayAmount;
                                        var oldAffinity = member.affinity;
                                        member.affinity = Math.max(0, member.affinity - totalDecay);
                                        member.updatedAt = now;

                                        if (member.affinity < oldAffinity - 10) {
                                            applyDamage(5, 'Pérdida de afinidad con ' + member.name, 3);
                                            addLogEntry('damage', '💔 Pérdida de afinidad con ' + member.name, '-' + totalDecay + '%', 0, 0, null);
                                        }
                                    }
                                });
                            }

                            function getCompatibilityBonus(member) {
                                var playerSocial = player.attributes.social || 1;
                                var playerRelaciones = player.attributes.relaciones || 1;
                                var playerDisciplina = player.attributes.disciplina || 1;
                                var bonusBase = 10;

                                var bonus = Math.floor(
                                    (playerSocial * 0.4) +
                                    (playerRelaciones * 0.4) +
                                    (playerDisciplina * 0.2) +
                                    (bonusBase / 10)
                                );

                                return Math.max(1, Math.min(15, bonus));
                            }

                            function getInteractionType(id) {
                                return INTERACTION_TYPES.find(function (i) { return i.id === id; });
                            }

                            function addFlockMember() {
                                if (player.gameOver) {
                                    showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                    return;
                                }

                                var nameInput = document.getElementById('flock-name');

                                var name = nameInput ? nameInput.value.trim() : '';

                                if (!name) {
                                    showToast('Ingresa un nombre para la persona.', 'warning', 'Círculo Social');
                                    return;
                                }

                                var member = {
                                    id: 'flock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                    name: name,
                                    status: 'unknown',
                                    affinity: 20 + Math.floor(Math.random() * 30),
                                    confidence: 1,
                                    streak: 0,
                                    lastInteraction: Date.now(),
                                    createdAt: Date.now(),
                                    updatedAt: Date.now(),
                                    eventHistory: []
                                };

                                player.flock.push(member);
                                saveGame();
                                renderFlock();

                                if (nameInput) nameInput.value = '';
                                checkAndUnlockTrophies();

                                addLogEntry('flock', '👤 ' + name + ' se unió al círculo social', '', 0, 0, null);

                                showToast('👤 ¡' + name + ' se ha unido a tu círculo social! Afinidad: ' + member.affinity + '%', 'success', 'Círculo Social');
                            }

                            function updateFlockStatus(id, newStatus) {
                                if (player.gameOver) {
                                    showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                    return;
                                }

                                var member = player.flock.find(function (f) { return f.id === id; });
                                if (!member) return;

                                var oldStatus = member.status;
                                member.status = newStatus;
                                member.updatedAt = Date.now();

                                var oldIndex = FLOCK_STATUSES.findIndex(function (s) { return s.id === oldStatus; });
                                var newIndex = FLOCK_STATUSES.findIndex(function (s) { return s.id === newStatus; });

                                if (newIndex > oldIndex && newIndex >= 0) {
                                    var rewardExp = 5 + newIndex * 3;
                                    var rewardGold = 3 + newIndex * 2;
                                    gainRewards(rewardExp, rewardGold, 'social', 'flock', '👤 ' + member.name + ' avanzó a ' + FLOCK_STATUSES[newIndex].label, '');
                                    showToast('🌟 ¡' + member.name + ' ha avanzado a ' + FLOCK_STATUSES[newIndex].label + '! +' + rewardExp + ' EXP, +' + rewardGold + ' ORO', 'success', 'Círculo Social');
                                }

                                saveGame();
                                renderFlock();
                                checkAndUnlockTrophies();
                            }

                            function interactWithFlock(id) {
                                if (player.gameOver) {
                                    showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                    return;
                                }

                                var member = player.flock.find(function (f) { return f.id === id; });
                                if (!member) return;

                                var select = document.getElementById('interaction-' + id);
                                if (!select) {
                                    showToast('Error: No se encontró el selector de interacción.', 'error', 'Error');
                                    return;
                                }

                                var interactionId = select.value;
                                var interaction = getInteractionType(interactionId);
                                if (!interaction) {
                                    showToast('Error: Tipo de interacción inválido.', 'error', 'Error');
                                    return;
                                }

                                var baseAffinityGain = interaction.affinityMin + Math.floor(Math.random() * (interaction.affinityMax - interaction.affinityMin + 1));
                                var compatBonus = getCompatibilityBonus(member);
                                var affinityGain = baseAffinityGain + compatBonus;
                                var streakBonus = Math.max(0, (member.streak || 0) * 0.5);
                                var totalAffinityGain = affinityGain + streakBonus;
                                member.affinity = Math.min(member.affinity + totalAffinityGain, 100);

                                var confidenceGain = 0;
                                if (interactionId === 'sexo') {
                                    confidenceGain = Math.random() > 0.3 ? 1 : 0;
                                } else if (interactionId === 'beso') {
                                    confidenceGain = Math.random() > 0.4 ? 1 : 0;
                                } else if (interactionId === 'profunda') {
                                    confidenceGain = Math.random() > 0.35 ? 1 : 0;
                                } else {
                                    confidenceGain = Math.random() > 0.6 ? 1 : 0;
                                }

                                if (confidenceGain > 0) {
                                    member.confidence = Math.min(member.confidence + confidenceGain, 5);
                                }

                                var now = Date.now();
                                var daysSinceLast = member.lastInteraction ? Math.floor((now - member.lastInteraction) / (24 * 60 * 60 * 1000)) : 999;

                                if (daysSinceLast === 1 || daysSinceLast === 0) {
                                    member.streak = (member.streak || 0) + 1;
                                } else if (daysSinceLast > 1) {
                                    if (member.streak > 0) {
                                        applyDamage(3, 'Pérdida de racha con ' + member.name, 2);
                                        addLogEntry('damage', '💔 Racha perdida con ' + member.name, member.streak + ' días de racha perdidos', 0, 0, null);
                                    }
                                    member.streak = 1;
                                } else {
                                    member.streak = 1;
                                }

                                member.lastInteraction = now;
                                member.updatedAt = now;

                                var totalExpGain = interaction.exp + Math.floor((member.streak || 0) / 2);
                                var totalGoldGain = interaction.gold;
                                gainRewards(totalExpGain, totalGoldGain, 'social', 'flock', '👤 Interacción con ' + member.name, interaction.label);

                                var msg = '🤝 Interacción con ' + member.name + '\n\n';
                                msg += '📌 Tipo: ' + interaction.label + '\n';
                                msg += '❤️ Afinidad: +' + totalAffinityGain + '% (' + baseAffinityGain + '% base + ' + compatBonus + '% compatibilidad';
                                if (streakBonus > 0) msg += ' + ' + Math.round(streakBonus) + '% racha';
                                msg += ')\n';

                                if (confidenceGain > 0) msg += '🛡️ Confianza: +' + confidenceGain + ' nivel\n';
                                msg += '⚡ EXP: +' + totalExpGain + '\n';
                                msg += '🟡 ORO: +' + totalGoldGain;

                                if ((member.streak || 0) >= 3) {
                                    msg += '\n\n🔥 Racha de ' + member.streak + ' días consecutivos!';
                                }

                                var oldStatus = member.status;
                                var statusChanged = false;
                                var newStatus = null;

                                if (member.affinity >= 80 && oldStatus !== 'partner' && oldStatus !== 'romance') {
                                    var existingPartner = player.flock.find(function (f) { return f.status === 'partner' && f.id !== id; });
                                    if (!existingPartner) {
                                        newStatus = 'romance';
                                    }
                                } else if (member.affinity >= 60 && (oldStatus === 'known' || oldStatus === 'encounter' || oldStatus === 'unknown')) {
                                    newStatus = 'friend';
                                } else if (member.affinity >= 40 && (oldStatus === 'unknown' || oldStatus === 'encounter')) {
                                    newStatus = 'known';
                                }

                                if (newStatus && newStatus !== oldStatus) {
                                    member.status = newStatus;
                                    statusChanged = true;
                                    var statusLabel = FLOCK_STATUSES.find(function (s) { return s.id === newStatus; }).label;
                                    msg += '\n\n🌟 ¡' + member.name + ' ha evolucionado a ' + statusLabel + '!';
                                }

                                showToast(msg, 'success', 'Interacción');

                                saveGame();
                                renderFlock();
                                checkAndUnlockTrophies();
                            }

                            function deleteFlockMember(id) {
                                if (player.gameOver) {
                                    showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                    return;
                                }

                                var member = player.flock.find(function (f) { return f.id === id; });
                                if (!member) return;

                                showModal(
                                    '🗑️',
                                    'Eliminar del Círculo Social',
                                    '¿Eliminar a "' + member.name + '" del círculo social?',
                                    'Eliminar',
                                    function () {
                                        addLogEntry('flock', '👤 ' + member.name + ' eliminado del círculo social', '', 0, 0, null);
                                        if (member.affinity > 50) {
                                            applyDamage(5, 'Pérdida de ' + member.name + ' del círculo social', 3);
                                        }
                                        player.flock = player.flock.filter(function (f) { return f.id !== id; });
                                        saveGame();
                                        renderFlock();
                                        checkAndUnlockTrophies();
                                        showToast('🗑️ ' + member.name + ' eliminado del círculo social.', 'info', 'Círculo Social');
                                    },
                                    true
                                );
                            }

                            function renderFlock() {
                                var container = document.getElementById('flock-container');
                                if (!container) return;

                                var count = player.flock.length;
                                var countEl = document.getElementById('flock-count');
                                if (countEl) countEl.textContent = count;

                                checkAffinityDecay();

                                if (count === 0) {
                                    container.innerHTML = '<div class="logbook-empty" style="grid-column: 1 / -1; text-align: center;">Esta muy vacío por aquí. ¡Comienza a agregar a tu círculo social!</div>';
                                    return;
                                }

                                var sorted = player.flock.slice().sort(function (a, b) { return b.affinity - a.affinity; });

                                var html = '';
                                sorted.forEach(function (member) {
                                    var statusObj = FLOCK_STATUSES.find(function (s) { return s.id === member.status; });
                                    var statusLabel = statusObj ? statusObj.label : '❓ Desconocida';

                                    var lastInteraction = member.lastInteraction ? new Date(member.lastInteraction) : null;
                                    var daysSince = lastInteraction ? Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                    var lastInteractionText = 'Nunca';
                                    var decayWarning = '';
                                    if (daysSince !== null) {
                                        if (daysSince === 0) lastInteractionText = 'Hoy';
                                        else if (daysSince === 1) lastInteractionText = 'Ayer';
                                        else if (daysSince < 7) lastInteractionText = 'Hace ' + daysSince + ' días';
                                        else lastInteractionText = 'Hace ' + Math.floor(daysSince / 7) + ' semanas';

                                        if (daysSince >= 7) {
                                            decayWarning = ' ⚠️ (decayendo -' + Math.floor(daysSince / 7) * 2 + '%)';
                                        }
                                    }

                                    var streak = member.streak || 0;
                                    var hasStreak = streak >= 3;

                                    var statusOptions = '';
                                    FLOCK_STATUSES.forEach(function (s) {
                                        statusOptions += '<option value="' + s.id + '" ' + (s.id === member.status ? 'selected' : '') + '>' + s.label + '</option>';
                                    });

                                    var interactionOptions = '';
                                    INTERACTION_TYPES.forEach(function (i) {
                                        interactionOptions += '<option value="' + i.id + '">' + i.label + '</option>';
                                    });

                                    html += `
                    <div class="flock-card">
                        <div class="flock-header">
                            <div>
                                <span class="flock-id">#${member.id.slice(-6)}</span>
                                <div class="flock-name">${member.name}</div>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                                ${hasStreak ? '<span class="flock-streak-badge">🔥 x' + streak + '</span>' : ''}
                            </div>
                        </div>

                        <div class="flock-info">
                            <div class="flock-info-item">❤️ Afinidad: <strong style="color:' + (member.affinity >= 70 ? 'var(--success)' : member.affinity >= 40 ? 'var(--warning)' : 'var(--text-muted)') + ';">${member.affinity}%</strong></div>
                            <div class="flock-info-item">🛡️ Confianza: <strong>Nivel ${member.confidence}</strong></div>
                            <div class="flock-info-item">📅 Último: <strong>${lastInteractionText}</strong>${decayWarning}</div>
                            ${hasStreak ? '<div class="flock-info-item">🔥 Racha: <strong>' + streak + ' días</strong></div>' : ''}
                        </div>

                        <select class="flock-status-select" onchange="updateFlockStatus(\'' + member.id + '\', this.value)" ${player.gameOver ? 'disabled' : ''}>
                            ${statusOptions}
                        </select>

                        <select class="flock-interaction-select" id="interaction-${member.id}" ${player.gameOver ? 'disabled' : ''}>
                            ${interactionOptions}
                        </select>

                        <div class="flock-actions">
                            <button class="interact-btn" onclick="interactWithFlock('${member.id}')" ${player.gameOver ? 'disabled' : ''}>
                                🤝 Interactuar
                            </button>
                            <button class="delete-btn" onclick="deleteFlockMember('${member.id}')" ${player.gameOver ? 'disabled' : ''}>
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                `;
                                });

                                container.innerHTML = html;
                            }

                            // ============================================================
