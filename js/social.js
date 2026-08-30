                            // ===== FUNCIONES DE CÍRCULO SOCIAL =====
                            // ============================================================

                            var flockViewMode = 'cards';

                            function ensureFlockMemberDefaults(member) {
                                if (member.awaitingResponse === undefined) member.awaitingResponse = false;
                                if (member.awaitingSince === undefined) member.awaitingSince = null;
                                if (member.noResponseFlag === undefined) member.noResponseFlag = false;
                                if (!member.flags) member.flags = [];
                                if (member.image === undefined) member.image = null;
                            }

                            function getCurrentDayStr() {
                                return new Date().toISOString().split('T')[0];
                            }

                            function checkDailyAttentionReset() {
                                var todayStr = getCurrentDayStr();
                                if (player.dailyAttentionDay !== todayStr) {
                                    player.dailyAttentionDay = todayStr;
                                    player.dailyAttentionUsed = 0;
                                }
                            }

                            function renderAttentionBudget() {
                                checkDailyAttentionReset();

                                var textEl = document.getElementById('flock-attention-text');
                                var fillEl = document.getElementById('flock-attention-bar-fill');
                                if (!textEl || !fillEl) return;

                                var used = player.dailyAttentionUsed || 0;
                                var pct = Math.min(100, Math.round((used / DAILY_ATTENTION_BUDGET) * 100));

                                textEl.textContent = used + ' / ' + DAILY_ATTENTION_BUDGET + ' usados hoy';
                                fillEl.style.width = pct + '%';
                                fillEl.style.background = used >= DAILY_ATTENTION_BUDGET ? 'var(--danger)' : 'var(--success)';
                            }

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
                                            applyDamage(8, 'Pérdida de afinidad con ' + member.name, 5);
                                            addLogEntry('damage', '💔 Pérdida de afinidad con ' + member.name, '-' + totalDecay + '%', 0, 0, null);
                                        }
                                    }
                                });
                            }

                            function checkNoResponseFlags() {
                                if (player.gameOver) return;

                                var now = Date.now();
                                var noResponseThresholdDays = 4;
                                var changed = false;

                                player.flock.forEach(function (member) {
                                    ensureFlockMemberDefaults(member);

                                    if (member.awaitingResponse && !member.noResponseFlag && member.awaitingSince) {
                                        var daysSince = Math.floor((now - member.awaitingSince) / (24 * 60 * 60 * 1000));
                                        if (daysSince >= noResponseThresholdDays) {
                                            member.noResponseFlag = true;
                                            changed = true;
                                            addLogEntry('flock', '🔇 ' + member.name + ' no respondió en ' + daysSince + ' días', '', 0, 0, null);
                                        }
                                    }
                                });

                                if (changed) saveGame();
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
                                var imageInput = document.getElementById('flock-image');

                                var name = nameInput ? nameInput.value.trim() : '';
                                var image = (imageInput ? imageInput.value.trim() : '') || null;

                                if (!name) {
                                    showToast('Ingresa un nombre para la persona.', 'warning', 'Círculo Social');
                                    return;
                                }

                                var member = {
                                    id: 'flock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                    name: name,
                                    image: image,
                                    status: 'match',
                                    affinity: 20 + Math.floor(Math.random() * 30),
                                    confidence: 1,
                                    streak: 0,
                                    lastInteraction: Date.now(),
                                    createdAt: Date.now(),
                                    updatedAt: Date.now(),
                                    eventHistory: [],
                                    awaitingResponse: false,
                                    awaitingSince: null,
                                    noResponseFlag: false,
                                    flags: []
                                };

                                player.flock.push(member);
                                saveGame();
                                renderFlock();

                                if (nameInput) nameInput.value = '';
                                if (imageInput) imageInput.value = '';
                                checkAndUnlockTrophies();

                                addLogEntry('flock', '💘 ' + name + ' hizo match', '', 0, 0, null);

                                showToast('💘 ¡Match con ' + name + '! Afinidad inicial: ' + member.affinity + '%', 'success', 'Círculo Social');
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

                            function toggleAwaitingResponse(id) {
                                if (player.gameOver) return;

                                var member = player.flock.find(function (f) { return f.id === id; });
                                if (!member) return;
                                ensureFlockMemberDefaults(member);

                                if (member.awaitingResponse) {
                                    member.awaitingResponse = false;
                                    member.awaitingSince = null;
                                    member.noResponseFlag = false;
                                    showToast('✅ Marcado: ' + member.name + ' respondió (o retomaste el contacto).', 'info', 'Círculo Social');
                                } else {
                                    member.awaitingResponse = true;
                                    member.awaitingSince = Date.now();
                                    member.noResponseFlag = false;
                                    showToast('📤 Marcado: esperando respuesta de ' + member.name + '.', 'info', 'Círculo Social');
                                }

                                member.updatedAt = Date.now();
                                saveGame();
                                renderFlock();
                            }

                            function addFlockFlag(id, type) {
                                if (player.gameOver) return;

                                var member = player.flock.find(function (f) { return f.id === id; });
                                if (!member) return;
                                ensureFlockMemberDefaults(member);

                                var input = document.getElementById('flock-flag-input-' + id);
                                var text = input ? input.value.trim() : '';

                                if (!text) {
                                    showToast('Escribí una nota antes de agregar la bandera.', 'warning', 'Círculo Social');
                                    return;
                                }

                                member.flags.push({
                                    id: 'flag_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                    type: type,
                                    text: text,
                                    createdAt: Date.now()
                                });

                                if (input) input.value = '';
                                member.updatedAt = Date.now();
                                saveGame();
                                renderFlock();
                            }

                            function removeFlockFlag(id, flagId) {
                                var member = player.flock.find(function (f) { return f.id === id; });
                                if (!member || !member.flags) return;

                                member.flags = member.flags.filter(function (f) { return f.id !== flagId; });
                                member.updatedAt = Date.now();
                                saveGame();
                                renderFlock();
                            }

                            function toggleFlockFlagsPanel(id) {
                                var panel = document.getElementById('flock-flags-panel-' + id);
                                if (panel) panel.classList.toggle('open');
                            }

                            function getUpcomingDateForMember(id) {
                                if (typeof cargarEventos === 'function') cargarEventos();
                                if (typeof eventosCache === 'undefined') return null;

                                var upcoming = eventosCache.filter(function (e) {
                                    return e.flockMemberId === id && (e.status === 'pending' || e.status === 'active') && e.start;
                                }).sort(function (a, b) { return new Date(a.start) - new Date(b.start); });

                                return upcoming.length > 0 ? upcoming[0] : null;
                            }

                            function scheduleDateWithFlock(id) {
                                if (player.gameOver) {
                                    showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                    return;
                                }

                                var member = player.flock.find(function (f) { return f.id === id; });
                                if (!member) return;

                                var dateInput = document.getElementById('flock-date-input-' + id);
                                var startVal = dateInput ? dateInput.value : '';

                                if (!startVal) {
                                    showToast('Elegí una fecha y hora para la cita.', 'warning', 'Círculo Social');
                                    return;
                                }

                                if (typeof cargarEventos === 'function') cargarEventos();
                                if (typeof eventosCache === 'undefined') {
                                    showToast('No se pudo acceder al calendario de eventos.', 'error', 'Error');
                                    return;
                                }

                                var newEvent = {
                                    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                    title: 'Cita con ' + member.name,
                                    type: 'event',
                                    icon: '💘',
                                    flockMemberId: member.id,
                                    start: startVal,
                                    duration: 3,
                                    levelRequired: 1,
                                    tasks: [],
                                    taskStatus: [],
                                    expReward: 15,
                                    goldReward: 8,
                                    period: 'once',
                                    status: 'pending',
                                    startedAt: null,
                                    finishedAt: null,
                                    endTime: null
                                };

                                eventosCache.push(newEvent);
                                guardarEventos();

                                if (dateInput) dateInput.value = '';
                                addLogEntry('flock', '📅 Cita programada con ' + member.name, '', 0, 0, null);
                                showToast('📅 ¡Cita con ' + member.name + ' programada! La vas a ver también en Aventuras.', 'success', 'Círculo Social');
                                renderFlock();
                            }

                            function interactWithFlock(id) {
                                if (player.gameOver) {
                                    showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                    return;
                                }

                                var member = player.flock.find(function (f) { return f.id === id; });
                                if (!member) return;
                                ensureFlockMemberDefaults(member);

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

                                checkDailyAttentionReset();
                                var overBudget = player.dailyAttentionUsed >= DAILY_ATTENTION_BUDGET;
                                if (overBudget) {
                                    totalAffinityGain = Math.round(totalAffinityGain * 0.5);
                                }
                                player.dailyAttentionUsed = (player.dailyAttentionUsed || 0) + 1;

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
                                        applyDamage(5, 'Pérdida de racha con ' + member.name, 3);
                                        addLogEntry('damage', '💔 Racha perdida con ' + member.name, member.streak + ' días de racha perdidos', 0, 0, null);
                                    }
                                    member.streak = 1;
                                } else {
                                    member.streak = 1;
                                }

                                member.lastInteraction = now;
                                member.updatedAt = now;
                                member.awaitingResponse = false;
                                member.awaitingSince = null;
                                member.noResponseFlag = false;

                                var totalExpGain = interaction.exp + Math.floor((member.streak || 0) / 2);
                                var totalGoldGain = interaction.gold;
                                gainRewards(totalExpGain, totalGoldGain, 'social', 'flock', '👤 Interacción con ' + member.name, interaction.label);

                                var msg = '🤝 Interacción con ' + member.name + '\n\n';
                                msg += '📌 Tipo: ' + interaction.label + '\n';
                                msg += '❤️ Afinidad: +' + totalAffinityGain + '% (' + baseAffinityGain + '% base + ' + compatBonus + '% compatibilidad';
                                if (streakBonus > 0) msg += ' + ' + Math.round(streakBonus) + '% racha';
                                msg += ')\n';

                                if (overBudget) msg += '\n⚠️ Se agotó tu Batería Social de hoy: esta interacción rindió la mitad.\n';

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
                                } else if (member.affinity >= 60 && (oldStatus === 'known' || oldStatus === 'encounter' || oldStatus === 'unknown' || oldStatus === 'match')) {
                                    newStatus = 'friend';
                                } else if (member.affinity >= 40 && (oldStatus === 'unknown' || oldStatus === 'encounter' || oldStatus === 'match')) {
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
                                            applyDamage(8, 'Pérdida de ' + member.name + ' del círculo social', 5);
                                        }

                                        if (!player.flockArchive) player.flockArchive = [];
                                        var statusObj = FLOCK_STATUSES.find(function (s) { return s.id === member.status; });
                                        player.flockArchive.push({
                                            id: member.id,
                                            name: member.name,
                                            statusLabel: statusObj ? statusObj.label : member.status,
                                            affinity: member.affinity,
                                            confidence: member.confidence,
                                            flags: member.flags || [],
                                            createdAt: member.createdAt,
                                            deletedAt: Date.now()
                                        });

                                        player.flock = player.flock.filter(function (f) { return f.id !== id; });
                                        saveGame();
                                        renderFlock();
                                        checkAndUnlockTrophies();
                                        showToast('🗑️ ' + member.name + ' eliminado del círculo social.', 'info', 'Círculo Social');
                                    },
                                    true
                                );
                            }

                            function setFlockView(mode) {
                                flockViewMode = (flockViewMode === mode) ? 'cards' : mode;
                                renderFlock();
                            }

                            function renderFlock() {
                                var cardsContainer = document.getElementById('flock-container');
                                var compareContainer = document.getElementById('flock-compare-container');
                                var archiveContainer = document.getElementById('flock-archive-container');
                                var toggleBtn = document.getElementById('flock-view-toggle-btn');
                                var archiveBtn = document.getElementById('flock-archive-toggle-btn');
                                if (!cardsContainer) return;

                                player.flock.forEach(ensureFlockMemberDefaults);
                                if (!player.flockArchive) player.flockArchive = [];

                                var count = player.flock.length;
                                var countEl = document.getElementById('flock-count');
                                if (countEl) countEl.textContent = count;

                                checkAffinityDecay();
                                checkNoResponseFlags();
                                renderAttentionBudget();

                                if (toggleBtn) {
                                    toggleBtn.textContent = (flockViewMode === 'compare') ? '🃏 Tarjetas' : '📊 Comparar';
                                }
                                if (archiveBtn) {
                                    archiveBtn.textContent = (flockViewMode === 'archive') ? '🃏 Tarjetas' : '🗄️ Eliminados (' + player.flockArchive.length + ')';
                                }

                                if (flockViewMode === 'archive') {
                                    cardsContainer.style.display = 'none';
                                    if (compareContainer) compareContainer.style.display = 'none';
                                    if (archiveContainer) {
                                        archiveContainer.style.display = '';
                                        renderFlockArchiveList(archiveContainer);
                                    }
                                    return;
                                }

                                if (count === 0) {
                                    cardsContainer.style.display = '';
                                    if (compareContainer) compareContainer.style.display = 'none';
                                    if (archiveContainer) archiveContainer.style.display = 'none';
                                    cardsContainer.innerHTML = '<div class="logbook-empty" style="grid-column: 1 / -1; text-align: center;">Esta muy vacío por aquí. ¡Comienza a agregar a tu círculo social!</div>';
                                    return;
                                }

                                var sorted = player.flock.slice().sort(function (a, b) { return b.affinity - a.affinity; });

                                if (flockViewMode === 'compare') {
                                    cardsContainer.style.display = 'none';
                                    if (archiveContainer) archiveContainer.style.display = 'none';
                                    if (compareContainer) {
                                        compareContainer.style.display = '';
                                        renderFlockCompareTable(compareContainer, sorted);
                                    }
                                    return;
                                }

                                cardsContainer.style.display = '';
                                if (compareContainer) compareContainer.style.display = 'none';
                                if (archiveContainer) archiveContainer.style.display = 'none';
                                renderFlockCards(cardsContainer, sorted);
                            }

                            function renderFlockCards(container, sorted) {
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

                                    var awaitingBadge = '';
                                    if (member.noResponseFlag) {
                                        awaitingBadge = '<span class="flock-flag-badge no-response">🔇 Sin respuesta</span>';
                                    } else if (member.awaitingResponse) {
                                        awaitingBadge = '<span class="flock-flag-badge awaiting">📤 Esperando respuesta</span>';
                                    }

                                    var redFlags = member.flags.filter(function (f) { return f.type === 'red'; }).length;
                                    var greenFlags = member.flags.filter(function (f) { return f.type === 'green'; }).length;

                                    var flagsListHTML = '';
                                    member.flags.forEach(function (f) {
                                        var icon = f.type === 'red' ? '🚩' : '🟢';
                                        flagsListHTML += '<div class="flock-flag-item">' +
                                            '<span>' + icon + ' ' + f.text + '</span>' +
                                            '<span class="flock-flag-remove" onclick="removeFlockFlag(\'' + member.id + '\', \'' + f.id + '\')">✕</span>' +
                                            '</div>';
                                    });

                                    var upcomingDate = getUpcomingDateForMember(member.id);
                                    var upcomingDateHTML = '';
                                    if (upcomingDate) {
                                        var d = new Date(upcomingDate.start);
                                        var dStr = d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                                        upcomingDateHTML = '<div class="flock-info-item">📅 Próxima cita: <strong>' + dStr + '</strong></div>';
                                    }

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

                        ${renderEntityImageBlock(member.image, '👤', member.name)}

                        ${awaitingBadge}

                        <div class="flock-info">
                            <div class="flock-info-item">❤️ Afinidad: <strong style="color:${member.affinity >= 70 ? 'var(--success)' : member.affinity >= 40 ? 'var(--warning)' : 'var(--text-muted)'};">${member.affinity}%</strong></div>
                            <div class="flock-info-item">🛡️ Confianza: <strong>Nivel ${member.confidence}</strong></div>
                            <div class="flock-info-item">📅 Último: <strong>${lastInteractionText}</strong>${decayWarning}</div>
                            ${hasStreak ? '<div class="flock-info-item">🔥 Racha: <strong>' + streak + ' días</strong></div>' : ''}
                            ${upcomingDateHTML}
                        </div>

                        <select class="flock-status-select" onchange="updateFlockStatus('${member.id}', this.value)" ${player.gameOver ? 'disabled' : ''}>
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

                        <button class="flock-secondary-btn" onclick="toggleAwaitingResponse('${member.id}')" ${player.gameOver ? 'disabled' : ''}>
                            ${member.awaitingResponse ? '✅ Marcar que respondió' : '📤 Marcar: esperando respuesta'}
                        </button>

                        <div class="flock-date-form">
                            <input type="datetime-local" id="flock-date-input-${member.id}" ${player.gameOver ? 'disabled' : ''}>
                            <button class="flock-secondary-btn" onclick="scheduleDateWithFlock('${member.id}')" ${player.gameOver ? 'disabled' : ''}>📅 Agendar cita</button>
                        </div>

                        <div class="flock-flags-toggle" onclick="toggleFlockFlagsPanel('${member.id}')">
                            🚩 ${redFlags} &nbsp; 🟢 ${greenFlags} &nbsp; <span style="opacity:0.6;">(ver banderas)</span>
                        </div>
                        <div class="flock-flags-panel" id="flock-flags-panel-${member.id}">
                            ${flagsListHTML || '<div style="opacity:0.5; font-size:0.75rem; padding:4px 0;">Sin banderas todavía.</div>'}
                            <div class="flock-flag-add">
                                <input type="text" id="flock-flag-input-${member.id}" placeholder="Nota de la bandera..." maxlength="60">
                                <button class="flock-flag-btn red" onclick="addFlockFlag('${member.id}', 'red')" ${player.gameOver ? 'disabled' : ''}>🚩 Roja</button>
                                <button class="flock-flag-btn green" onclick="addFlockFlag('${member.id}', 'green')" ${player.gameOver ? 'disabled' : ''}>🟢 Verde</button>
                            </div>
                        </div>
                    </div>
                `;
                                });

                                container.innerHTML = html;
                            }

                            function renderFlockCompareTable(container, sorted) {
                                var html = '<table class="flock-compare-table"><thead><tr>' +
                                    '<th>Nombre</th><th>Estado</th><th>Afinidad</th><th>Confianza</th>' +
                                    '<th>Último contacto</th><th>Próxima cita</th><th>Banderas</th>' +
                                    '</tr></thead><tbody>';

                                sorted.forEach(function (member) {
                                    var statusObj = FLOCK_STATUSES.find(function (s) { return s.id === member.status; });
                                    var statusLabel = statusObj ? statusObj.label : '❓';

                                    var lastInteraction = member.lastInteraction ? new Date(member.lastInteraction) : null;
                                    var daysSince = lastInteraction ? Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                    var lastText = daysSince === null ? 'Nunca' : (daysSince === 0 ? 'Hoy' : daysSince + 'd');

                                    var upcoming = getUpcomingDateForMember(member.id);
                                    var upcomingText = '—';
                                    if (upcoming) {
                                        var d = new Date(upcoming.start);
                                        upcomingText = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                                    }

                                    var redFlags = member.flags.filter(function (f) { return f.type === 'red'; }).length;
                                    var greenFlags = member.flags.filter(function (f) { return f.type === 'green'; }).length;

                                    var statusFlags = '';
                                    if (member.noResponseFlag) statusFlags = ' 🔇';
                                    else if (member.awaitingResponse) statusFlags = ' 📤';

                                    html += '<tr>' +
                                        '<td>' + member.name + statusFlags + '</td>' +
                                        '<td>' + statusLabel + '</td>' +
                                        '<td>' + member.affinity + '%</td>' +
                                        '<td>Nv. ' + member.confidence + '</td>' +
                                        '<td>' + lastText + '</td>' +
                                        '<td>' + upcomingText + '</td>' +
                                        '<td>🚩' + redFlags + ' 🟢' + greenFlags + '</td>' +
                                        '</tr>';
                                });

                                html += '</tbody></table>';
                                container.innerHTML = html;
                            }

                            function renderFlockArchiveList(container) {
                                var archive = (player.flockArchive || []).slice().sort(function (a, b) { return b.deletedAt - a.deletedAt; });

                                if (archive.length === 0) {
                                    container.innerHTML = '<div class="logbook-empty" style="text-align:center;">Todavía no eliminaste a nadie del círculo social.</div>';
                                    return;
                                }

                                var html = '<table class="flock-compare-table"><thead><tr>' +
                                    '<th>Nombre</th><th>Último estado</th><th>Afinidad al eliminar</th>' +
                                    '<th>Banderas</th><th>Eliminada</th>' +
                                    '</tr></thead><tbody>';

                                archive.forEach(function (entry) {
                                    var d = new Date(entry.deletedAt);
                                    var dStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                    var flags = entry.flags || [];
                                    var redFlags = flags.filter(function (f) { return f.type === 'red'; }).length;
                                    var greenFlags = flags.filter(function (f) { return f.type === 'green'; }).length;

                                    html += '<tr>' +
                                        '<td>' + entry.name + '</td>' +
                                        '<td>' + (entry.statusLabel || '—') + '</td>' +
                                        '<td>' + entry.affinity + '%</td>' +
                                        '<td>🚩' + redFlags + ' 🟢' + greenFlags + '</td>' +
                                        '<td>' + dStr + '</td>' +
                                        '</tr>';
                                });

                                html += '</tbody></table>';
                                container.innerHTML = html;
                            }

                            // ============================================================
