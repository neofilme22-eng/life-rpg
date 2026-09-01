// ============================================================
// ===== FUNCIONES DE EVENTOS Y MAZMORRAS =====
// ============================================================

// Usar window para evitar conflictos de declaración
window.currentEventFilter = window.currentEventFilter || 'all';
window.eventosCache = window.eventosCache || [];
window.ultimaFechaRenovacion = window.ultimaFechaRenovacion || '';
window.eventosRenovadosHoy = window.eventosRenovadosHoy || false;

// ============================================================
// ===== CARGA Y GUARDADO =====
// ============================================================

function cargarEventos() {
    var data = localStorage.getItem('life_rpg_events');
    if (data) {
        try {
            window.eventosCache = JSON.parse(data);
            if (player) player.events = window.eventosCache;
        } catch (e) {
            window.eventosCache = [];
            if (player) player.events = [];
        }
    } else {
        window.eventosCache = [];
        if (player) player.events = [];
    }
    return window.eventosCache;
}

function guardarEventos() {
    localStorage.setItem('life_rpg_events', JSON.stringify(window.eventosCache));
    if (player) player.events = window.eventosCache;
}

// ============================================================
// ===== RENDER PRINCIPAL =====
// ============================================================

function renderEvents() {
    var eventContainer = document.getElementById('event-container');
    var dungeonContainer = document.getElementById('dungeon-container');

    if (!eventContainer || !dungeonContainer) return;

    cargarEventos();

    // Renovar eventos periódicos
    renovarEventosPeriodicos();

    // Actualizar estados automáticos
    var now = new Date();
    window.eventosCache.forEach(function (evt) {
        if (evt.status === 'finished' || evt.status === 'completed') return;

        if (evt.type === 'event' && evt.start) {
            var startDate = new Date(evt.start);
            var endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + (evt.duration || 3));

            if (now < startDate) {
                evt.status = 'pending';
            } else if (now >= startDate && now <= endDate) {
                if (evt.status !== 'active') {
                    evt.status = 'active';
                    evt.startedAt = Date.now();
                    if (typeof showToast === 'function') {
                        showToast('🎉 Evento "' + evt.title + '" ha comenzado', 'info', 'Evento');
                    }
                }
            } else if (now > endDate) {
                evt.status = 'finished';
                evt.finishedAt = Date.now();
                var completadas = evt.taskStatus.filter(function (s) { return s; }).length;
                var total = evt.tasks.length;
                var porcentaje = total > 0 ? completadas / total : 1;
                var expGain = Math.floor((evt.expReward || 20) * (0.3 + 0.4 * porcentaje));
                var goldGain = Math.floor((evt.goldReward || 10) * (0.3 + 0.4 * porcentaje));
                if (typeof gainRewards === 'function') {
                    gainRewards(expGain, goldGain, 'social', 'event', '⏰ Evento "' + evt.title + '" finalizado', completadas + '/' + total + ' tareas');
                }
                if (typeof showToast === 'function') {
                    showToast('⏰ Evento "' + evt.title + '" finalizado. +' + expGain + ' EXP, +' + goldGain + ' ORO', 'info', 'Evento');
                }
            }
        }

        if (evt.type === 'dungeon' && evt.status === 'active' && evt.endTime) {
            var endDate = new Date(evt.endTime);
            if (now > endDate) {
                var completadas = evt.taskStatus.filter(function (s) { return s; }).length;
                var total = evt.tasks.length;
                var porcentaje = total > 0 ? completadas / total : 0;

                evt.status = 'finished';
                evt.finishedAt = Date.now();

                var damageAmount = Math.max(8, Math.ceil(25 * (1 - porcentaje)));
                var petDamage = Math.ceil(damageAmount / 2);

                if (typeof applyDamage === 'function') {
                    applyDamage(damageAmount, 'Mazmorra "' + evt.title + '" expiró sin completar', petDamage);
                }
                if (typeof addLogEntry === 'function') {
                    addLogEntry('dungeon', '⏰ Mazmorra "' + evt.title + '" expiró', completadas + '/' + total + ' tareas', 0, 0, null);
                }
                if (typeof showToast === 'function') {
                    showToast('⏰ Mazmorra "' + evt.title + '" expiró sin completar. -' + damageAmount + ' HP', 'error', 'Mazmorra');
                }
            }
        }
    });

    guardarEventos();

    // Separar eventos y mazmorras
    var eventos = window.eventosCache.filter(function (e) { return e.type === 'event'; });
    var mazmorras = window.eventosCache.filter(function (e) { return e.type === 'dungeon'; });

    // FILTRADO DE EVENTOS
    if (window.currentEventFilter !== 'all') {
        eventos = eventos.filter(function (e) {
            if (!e.start) return false;

            var fechaEvento = new Date(e.start);
            var ahora = new Date();

            var diffTime = fechaEvento.getTime() - ahora.getTime();
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0 && e.status !== 'active') return false;

            switch (window.currentEventFilter) {
                case 'daily':
                    return diffDays <= 1 && diffDays >= -1;
                case 'weekly':
                    return diffDays >= 2 && diffDays <= 7;
                case 'monthly':
                    return diffDays >= 8 && diffDays <= 30;
                default:
                    return true;
            }
        });
    }

    // ORDEN: EVENTOS (activos primero)
    eventos.sort(function (a, b) {
        var order = { active: 0, pending: 1, finished: 2 };
        var statusDiff = (order[a.status] || 3) - (order[b.status] || 3);
        if (statusDiff !== 0) return statusDiff;

        if (a.status === 'active' && b.status === 'active') {
            return (b.startedAt || 0) - (a.startedAt || 0);
        }

        if (a.status === 'pending' && b.status === 'pending') {
            var aTime = a.start ? new Date(a.start).getTime() : Infinity;
            var bTime = b.start ? new Date(b.start).getTime() : Infinity;
            return aTime - bTime;
        }

        return 0;
    });

    // ============================================================
    // ORDEN CORREGIDO PARA MAZMORRAS - ACTIVAS SIEMPRE PRIMERO
    // ============================================================
    mazmorras.sort(function (a, b) {
        // DEFINIR PRIORIDAD EXPLÍCITA: active = 0 (más alta)
        var order = { active: 0, pending: 1, completed: 2, finished: 3 };
        var aOrder = order[a.status] !== undefined ? order[a.status] : 4;
        var bOrder = order[b.status] !== undefined ? order[b.status] : 4;
        
        // Primero ordenar por estado (activas primero)
        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }
        
        // Si ambas están activas, la que se inició más RECIENTE primero
        if (a.status === 'active' && b.status === 'active') {
            return (b.startedAt || 0) - (a.startedAt || 0);
        }
        
        // Si ambas están pendientes, la más RECIENTE primero
        if (a.status === 'pending' && b.status === 'pending') {
            return (b.createdAt || 0) - (a.createdAt || 0);
        }
        
        // Si ambas están completadas o finished, ordenar por fecha de finalización
        if ((a.status === 'completed' || a.status === 'finished') && 
            (b.status === 'completed' || b.status === 'finished')) {
            return (b.finishedAt || 0) - (a.finishedAt || 0);
        }
        
        return 0;
    });

    renderEventCards(eventContainer, eventos, 'event');
    renderDungeonCards(dungeonContainer, mazmorras);
}

// ============================================================
// ===== RENDER DE TARJETAS =====
// ============================================================

function renderEventCards(container, events, type) {
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = '<div class="event-empty">No hay eventos.</div>';
        return;
    }

    var html = '';
    events.forEach(function (evt) {
        var icon = renderIconHTML(evt.icon, '⚡');
        var startStr = 'Sin fecha';
        if (evt.start) {
            var d = new Date(evt.start);
            startStr = d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }

        var statusMap = {
            'pending': { text: '⏳ Pendiente', cls: 'pending' },
            'active': { text: '🟢 Activo', cls: 'active' },
            'finished': { text: '✅ Finalizado', cls: 'finished' }
        };
        var status = statusMap[evt.status] || statusMap['pending'];

        var timerHTML = '';
        if (evt.status === 'active') {
            var endDate;
            if (evt.start) {
                var start = new Date(evt.start);
                endDate = new Date(start);
                endDate.setHours(endDate.getHours() + (evt.duration || 3));
            }
            if (endDate) {
                var diff = endDate - new Date();
                if (diff > 0) {
                    var horas = Math.floor(diff / (1000 * 60 * 60));
                    var minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    timerHTML = '<div class="event-timer">⏱️ ' + horas + 'h ' + minutos + 'm restantes</div>';
                } else {
                    timerHTML = '<div class="event-timer urgent">⏱️ ¡Finalizando!</div>';
                }
            }
        }

        var periodText = '';
        var periodMap = {
            'once': '📌 Una vez',
            'daily': '🔄 Diario',
            'weekly': '🔄 Semanal',
            'monthly': '🔄 Mensual'
        };
        if (evt.period && evt.period !== 'once') {
            periodText = '<span style="font-size:0.6rem; color:var(--primary); opacity:0.7;">' + (periodMap[evt.period] || '') + '</span>';
        }

        var completadas = evt.taskStatus.filter(function (s) { return s; }).length;
        var total = evt.tasks.length;

        var tasksToggleHTML = '';
        var tasksHTML = '';
        if (evt.tasks.length > 0) {
            tasksToggleHTML = '<div class="event-tasks-toggle" onclick="toggleEventTasksPanel(\'' + evt.id + '\')">🎯 Tareas (' + completadas + '/' + total + ') <span class="event-tasks-chevron" id="event-tasks-chevron-' + evt.id + '">▾</span></div>';
            tasksHTML = '<div class="event-tasks-panel" id="event-tasks-panel-' + evt.id + '"><div class="event-tasks">';
            evt.tasks.forEach(function (task, index) {
                var isCompleted = evt.taskStatus[index] || false;
                var disabled = false;

                if (evt.status === 'finished') {
                    disabled = true;
                } else if (evt.status === 'pending' && evt.start) {
                    var ahora = new Date();
                    var fechaInicio = new Date(evt.start);
                    if (ahora < fechaInicio) {
                        disabled = true;
                    }
                }
                if (player && player.gameOver) {
                    disabled = true;
                }

                tasksHTML += `
                    <div class="event-task-item ${isCompleted ? 'completed' : ''}">
                        <input type="checkbox" 
                            ${isCompleted ? 'checked' : ''} 
                            ${disabled ? 'disabled' : ''}
                            onchange="toggleEventTask('${evt.id}', ${index})">
                        <span>${task}</span>
                    </div>
                `;
            });
            tasksHTML += '</div></div>';
        }

        html += `
            <div class="event-card ${evt.status === 'active' ? 'active' : ''} ${evt.status === 'finished' ? 'finished' : ''}">
                <div class="event-header">
                    <span class="event-title">${icon} ${evt.title}</span>
                    <span class="event-status-badge ${status.cls}">${status.text}</span>
                </div>
                ${renderEntityImageBlock(evt.image, evt.icon, evt.title)}
                <div class="event-meta">
                    <span>📅 ${startStr}</span>
                    <span>⏱️ ${evt.duration || 3}h</span>
                    <span>📋 Evento</span>
                    ${periodText}
                </div>
                ${timerHTML}
                ${tasksToggleHTML}
                ${tasksHTML}
                <div class="event-reward">
                    <span>🏆 +${evt.expReward || 20} EXP, +${evt.goldReward || 10} ORO</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderDungeonCards(container, mazmorras) {
    if (!container) return;

    if (mazmorras.length === 0) {
        container.innerHTML = '<div class="event-empty">No hay mazmorras.</div>';
        return;
    }

    var html = '';
    var hayMazmorraActiva = mazmorras.some(function (e) { return e.status === 'active'; });
    mazmorras.forEach(function (evt) {
        var icon = renderIconHTML(evt.icon, '🏰');

        var statusMap = {
            'pending': { text: '⏳ Pendiente', cls: 'pending' },
            'active': { text: '🟢 En progreso', cls: 'active' },
            'finished': { text: '⏰ Expirada', cls: 'finished' },
            'completed': { text: '✅ Completada', cls: 'finished' }
        };
        var status = statusMap[evt.status] || statusMap['pending'];

        var timerHTML = '';
        if (evt.status === 'active' && evt.endTime) {
            var endDate = new Date(evt.endTime);
            var diff = endDate - new Date();
            if (diff > 0) {
                var horas = Math.floor(diff / (1000 * 60 * 60));
                var minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                timerHTML = '<div class="event-timer">⏱️ ' + horas + 'h ' + minutos + 'm restantes</div>';
            } else {
                timerHTML = '<div class="event-timer urgent">⏱️ ¡Finalizando!</div>';
            }
        }

        var completadas = evt.taskStatus.filter(function (s) { return s; }).length;
        var total = evt.tasks.length;

        var tasksToggleHTML = '';
        var tasksHTML = '';
        if (evt.tasks.length > 0) {
            tasksToggleHTML = '<div class="event-tasks-toggle" onclick="toggleEventTasksPanel(\'' + evt.id + '\')">🎯 Tareas (' + completadas + '/' + total + ') <span class="event-tasks-chevron" id="event-tasks-chevron-' + evt.id + '">▾</span></div>';
            tasksHTML = '<div class="event-tasks-panel" id="event-tasks-panel-' + evt.id + '"><div class="event-tasks">';
            evt.tasks.forEach(function (task, index) {
                var isCompleted = evt.taskStatus[index] || false;
                var disabled = evt.status !== 'active' || (player && player.gameOver);
                tasksHTML += `
                    <div class="event-task-item ${isCompleted ? 'completed' : ''}">
                        <input type="checkbox" 
                            ${isCompleted ? 'checked' : ''} 
                            ${disabled ? 'disabled' : ''}
                            onchange="toggleDungeonTask('${evt.id}', ${index})">
                        <span>${task}</span>
                    </div>
                `;
            });
            tasksHTML += '</div></div>';
        }

        var actionsHTML = '';

        if (evt.status === 'pending') {
            var puedeIniciar = (player ? player.level >= (evt.levelRequired || 1) : false) && !(player && player.gameOver) && !hayMazmorraActiva;
            var textoBoton = (player && player.level < (evt.levelRequired || 1)) ? '🔒 Nivel ' + (evt.levelRequired || 1) + ' req.' :
                (hayMazmorraActiva ? '⏳ Otra mazmorra en curso' : '🏰 Iniciar Mazmorra');
            actionsHTML = `
                <button class="start-btn" onclick="iniciarMazmorra('${evt.id}')" ${!puedeIniciar ? 'disabled' : ''}>
                    ${textoBoton}
                </button>
            `;
        } else if (evt.status === 'active') {
            var puedeFinalizar = !(player && player.gameOver);
            actionsHTML = `
                <button class="finish-btn" onclick="finalizarMazmorra('${evt.id}')" ${!puedeFinalizar ? 'disabled' : ''}>
                    ✅ Finalizar
                </button>
            `;
        } else if (evt.status === 'completed') {
            actionsHTML = '<span style="color:var(--success); font-size:0.8rem; font-weight:bold;">✅ Completada - Vuelve mañana</span>';
        } else if (evt.status === 'finished') {
            actionsHTML = '<span style="color:var(--danger); font-size:0.8rem; font-weight:bold;">⏰ Expirada</span>';
        }

        html += `
            <div class="event-card ${evt.status === 'active' ? 'active' : ''} ${evt.status === 'finished' || evt.status === 'completed' ? 'finished' : ''}">
                <div class="event-header">
                    <span class="event-title">${icon} ${evt.title}</span>
                    <span class="event-status-badge ${status.cls}">${status.text}</span>
                </div>
                ${renderEntityImageBlock(evt.image, evt.icon, evt.title)}
                <div class="event-meta">
                    <span>📋 Mazmorra</span>
                    <span>⏱️ ${evt.duration || 3}h</span>
                    ${evt.levelRequired ? '<span>🏷️ Nivel ' + evt.levelRequired + ' req.</span>' : ''}
                </div>
                ${timerHTML}
                ${tasksToggleHTML}
                ${tasksHTML}
                <div class="event-reward">
                    <span>🏆 +${evt.expReward || 20} EXP, +${evt.goldReward || 10} ORO</span>
                </div>
                <div class="event-actions">
                    ${actionsHTML}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================================
// ===== FILTROS =====
// ============================================================

function filterEvents(filter) {
    window.currentEventFilter = filter;
    document.querySelectorAll('.event-filter-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderEvents();
}

// ============================================================
// ===== TOGGLE TAREAS =====
// ============================================================

function toggleEventTasksPanel(eventId) {
    var panel = document.getElementById('event-tasks-panel-' + eventId);
    var chevron = document.getElementById('event-tasks-chevron-' + eventId);
    if (!panel) return;

    var isOpen = panel.classList.toggle('open');
    if (chevron) chevron.textContent = isOpen ? '▴' : '▾';
}

// ============================================================
// ===== TOGGLE TAREAS DE EVENTOS =====
// ============================================================

function toggleEventTask(eventId, taskIndex) {
    if (player && player.gameOver) {
        if (typeof showToast === 'function') showToast('Estás en Game Over.', 'error', 'Error');
        return;
    }

    var evt = window.eventosCache.find(function (e) { return e.id === eventId; });
    if (!evt) {
        if (typeof showToast === 'function') showToast('No se encontró el evento.', 'error', 'Error');
        return;
    }

    if (evt.status === 'finished' || evt.status === 'completed') {
        if (typeof showToast === 'function') showToast('Este evento ya finalizó.', 'warning', 'Evento');
        return;
    }

    if (evt.start) {
        var ahora = new Date();
        var fechaInicio = new Date(evt.start);

        if (ahora < fechaInicio) {
            var tiempoRestante = Math.ceil((fechaInicio - ahora) / (1000 * 60 * 60));
            if (typeof showToast === 'function') {
                showToast('Este evento comienza en ' + tiempoRestante + ' horas. No puedes completar tareas aún.', 'warning', 'Evento');
            }
            return;
        }

        var fechaFin = new Date(fechaInicio);
        fechaFin.setHours(fechaFin.getHours() + (evt.duration || 3));

        if (ahora >= fechaInicio && ahora <= fechaFin && evt.status === 'pending') {
            evt.status = 'active';
            evt.startedAt = Date.now();
            if (typeof showToast === 'function') {
                showToast('🎉 Evento "' + evt.title + '" activado automáticamente', 'info', 'Evento');
            }
        }
    }

    if (evt.status !== 'active' && evt.status !== 'pending') {
        if (typeof showToast === 'function') showToast('Este evento no está activo.', 'warning', 'Evento');
        return;
    }

    evt.taskStatus[taskIndex] = !evt.taskStatus[taskIndex];

    var allDone = evt.taskStatus.every(function (s) { return s === true; });

    guardarEventos();

    if (allDone && evt.tasks.length > 0 && evt.status !== 'finished') {
        var bonusExp = Math.floor((evt.expReward || 20) * 0.5);
        var bonusGold = Math.floor((evt.goldReward || 10) * 0.5);
        if (typeof gainRewards === 'function') {
            gainRewards(evt.expReward + bonusExp, evt.goldReward + bonusGold, 'disciplina', 'event', '🎉 Evento "' + evt.title + '" completado', 'Todas las tareas completadas');
        }
        evt.status = 'finished';
        evt.finishedAt = Date.now();
        guardarEventos();
        if (typeof showToast === 'function') {
            showToast('🎉 ¡Todas las tareas completadas en "' + evt.title + '"!', 'success', 'Evento');
        }
        if (typeof checkAndUnlockTrophies === 'function') {
            checkAndUnlockTrophies();
        }
    }

    renderEvents();
}

// ============================================================
// ===== TOGGLE TAREAS DE MAZMORRAS =====
// ============================================================

function toggleDungeonTask(eventId, taskIndex) {
    if (player && player.gameOver) {
        if (typeof showToast === 'function') showToast('Estás en Game Over.', 'error', 'Error');
        return;
    }

    var evt = window.eventosCache.find(function (e) { return e.id === eventId; });
    if (!evt) {
        if (typeof showToast === 'function') showToast('No se encontró la mazmorra.', 'error', 'Error');
        return;
    }
    if (evt.status === 'finished' || evt.status === 'completed') return;

    if (evt.status !== 'active') {
        if (typeof showToast === 'function') {
            showToast('Primero tenés que iniciar la mazmorra con el botón "🏰 Iniciar Mazmorra".', 'warning', 'Mazmorra');
        }
        renderEvents();
        return;
    }

    evt.taskStatus[taskIndex] = !evt.taskStatus[taskIndex];
    guardarEventos();

    var allDone = evt.taskStatus.every(function (s) { return s === true; });
    if (allDone && evt.tasks.length > 0 && evt.status === 'active') {
        if (typeof showToast === 'function') {
            showToast('✅ ¡Todas las tareas completadas! Finaliza la mazmorra.', 'success', 'Mazmorra');
        }
    }

    renderEvents();
}

// ============================================================
// ===== FUNCIONES DE MAZMORRAS =====
// ============================================================

function iniciarMazmorra(id) {
    if (player && player.gameOver) {
        if (typeof showToast === 'function') showToast('Estás en Game Over.', 'error', 'Error');
        return;
    }

    var evt = window.eventosCache.find(function (e) { return e.id === id; });
    if (!evt) {
        if (typeof showToast === 'function') showToast('No se encontró la mazmorra.', 'error', 'Error');
        return;
    }

    if (evt.status === 'completed') {
        if (typeof showToast === 'function') showToast('Esta mazmorra ya fue completada hoy. Vuelve mañana.', 'warning', 'Mazmorra');
        return;
    }

    if (evt.status === 'active') {
        if (typeof showToast === 'function') showToast('Esta mazmorra ya está en progreso.', 'warning', 'Mazmorra');
        return;
    }

    if (evt.status === 'finished') {
        if (typeof showToast === 'function') showToast('Esta mazmorra expiró.', 'warning', 'Mazmorra');
        return;
    }

    if (player && player.level < (evt.levelRequired || 1)) {
        if (typeof showToast === 'function') {
            showToast('Necesitas nivel ' + evt.levelRequired + ' para esta mazmorra.', 'error', 'Mazmorra');
        }
        return;
    }

    var otraActiva = window.eventosCache.find(function (e) { return e.type === 'dungeon' && e.status === 'active' && e.id !== id; });
    if (otraActiva) {
        if (typeof showToast === 'function') {
            showToast('Ya tenés "' + otraActiva.title + '" en progreso. Finalizala antes de iniciar otra mazmorra.', 'warning', 'Mazmorra');
        }
        return;
    }

    evt.status = 'active';
    evt.startedAt = Date.now();

    var endDate = new Date();
    endDate.setHours(endDate.getHours() + (evt.duration || 3));
    evt.endTime = endDate.toISOString();

    guardarEventos();
    renderEvents();

    if (typeof showToast === 'function') {
        showToast('🏰 Mazmorra "' + evt.title + '" iniciada! Duración: ' + (evt.duration || 3) + ' horas', 'success', 'Mazmorra');
    }
    if (typeof addLogEntry === 'function') {
        addLogEntry('dungeon', '🏰 Mazmorra "' + evt.title + '" iniciada', 'Duración: ' + (evt.duration || 3) + 'h', 0, 0, null);
    }
}

function finalizarMazmorra(id) {
    if (player && player.gameOver) {
        if (typeof showToast === 'function') showToast('Estás en Game Over.', 'error', 'Error');
        return;
    }

    var evt = window.eventosCache.find(function (e) { return e.id === id; });
    if (!evt) {
        if (typeof showToast === 'function') showToast('No se encontró la mazmorra.', 'error', 'Error');
        return;
    }

    if (evt.status !== 'active') {
        if (typeof showToast === 'function') showToast('Esta mazmorra no está en progreso.', 'warning', 'Mazmorra');
        return;
    }

    var completadas = evt.taskStatus.filter(function (s) { return s; }).length;
    var total = evt.tasks.length;
    var porcentaje = total > 0 ? completadas / total : 1;

    var expGain = Math.floor((evt.expReward || 20) * (0.5 + 0.5 * porcentaje));
    var goldGain = Math.floor((evt.goldReward || 10) * (0.5 + 0.5 * porcentaje));

    if (typeof gainRewards === 'function') {
        gainRewards(expGain, goldGain, 'social', 'dungeon', '🏰 Mazmorra "' + evt.title + '" completada', completadas + '/' + total + ' tareas');
    }

    evt.status = 'completed';
    evt.finishedAt = Date.now();
    evt.completedDate = new Date().toDateString();

    guardarEventos();
    renderEvents();

    if (typeof showToast === 'function') {
        showToast('🏰 ¡Mazmorra "' + evt.title + '" completada! +' + expGain + ' EXP, +' + goldGain + ' ORO', 'success', 'Mazmorra');
    }
    if (typeof checkAndUnlockTrophies === 'function') {
        checkAndUnlockTrophies();
    }
}

// ============================================================
// ===== FUNCIONES PARA EVENTOS PERIÓDICOS =====
// ============================================================

function calcularProximaFecha(period, fechaBase) {
    var fecha = new Date(fechaBase);
    var ahora = new Date();

    switch (period) {
        case 'daily':
            while (fecha <= ahora) {
                fecha.setDate(fecha.getDate() + 1);
            }
            break;
        case 'weekly':
            while (fecha <= ahora) {
                fecha.setDate(fecha.getDate() + 7);
            }
            break;
        case 'monthly':
            while (fecha <= ahora) {
                fecha.setMonth(fecha.getMonth() + 1);
            }
            break;
        case 'once':
        default:
            break;
    }
    return fecha;
}

function renovarEventosPeriodicos() {
    var hoy = new Date().toDateString();

    if (window.ultimaFechaRenovacion === hoy && window.eventosRenovadosHoy) {
        return;
    }

    var ahora = new Date();
    var eventosModificados = false;

    window.eventosCache.forEach(function (evt) {
        if (evt.type !== 'event' || evt.status !== 'finished') return;
        if (!evt.period || evt.period === 'once') return;

        var fechaInicio = new Date(evt.start);
        var proximaFecha = calcularProximaFecha(evt.period, fechaInicio);

        if (proximaFecha > ahora) {
            evt.status = 'pending';
            evt.start = proximaFecha.toISOString().slice(0, 16);
            evt.taskStatus = (evt.tasks || []).map(function () { return false; });
            evt.startedAt = null;
            evt.finishedAt = null;
            evt.completedDate = null;
            evt.endTime = null;
            evt.createdAt = Date.now();

            eventosModificados = true;
        }
    });

    if (eventosModificados) {
        guardarEventos();
        window.ultimaFechaRenovacion = hoy;
        window.eventosRenovadosHoy = true;
        console.log('🔄 Eventos periódicos reiniciados');
    }
}

// ============================================================
// ===== CREAR EVENTO DESDE CONFIGURACIÓN =====
// ============================================================

function createEventFromConfig() {
    if (player && player.gameOver) {
        if (typeof showToast === 'function') showToast('Estás en Game Over.', 'error', 'Error');
        return;
    }

    var titleInput = document.getElementById('config-event-title');
    var typeSelect = document.getElementById('config-event-type');
    var periodSelect = document.getElementById('config-event-period');
    var startInput = document.getElementById('config-event-start');
    var durationInput = document.getElementById('config-event-duration');
    var levelInput = document.getElementById('config-event-level');
    var tasksInput = document.getElementById('config-event-tasks');
    var iconInput = document.getElementById('config-event-icon');
    var imageInput = document.getElementById('config-event-image');

    var title = titleInput ? titleInput.value.trim() : '';
    var type = typeSelect ? typeSelect.value : 'event';
    var period = periodSelect ? periodSelect.value : 'once';
    var start = startInput ? startInput.value : null;
    var duration = parseInt(durationInput ? durationInput.value : 3) || 3;
    var levelRequired = parseInt(levelInput ? levelInput.value : 1) || 1;
    var tasksRaw = tasksInput ? tasksInput.value.trim() : '';
    var customIcon = (iconInput ? iconInput.value.trim() : '') || '';
    var customImage = (imageInput ? imageInput.value.trim() : '') || null;

    if (!title) {
        if (typeof showToast === 'function') showToast('Ingresa un nombre.', 'warning', 'Error');
        return;
    }

    if (type === 'event' && !start) {
        if (typeof showToast === 'function') showToast('Selecciona una fecha para el evento.', 'warning', 'Error');
        return;
    }

    var tasks = tasksRaw ? tasksRaw.split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t; }) : [];

    var newEvent = {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        title: title,
        type: type,
        icon: customIcon || null,
        image: customImage,
        start: start,
        duration: duration,
        levelRequired: levelRequired,
        tasks: tasks,
        taskStatus: tasks.map(function () { return false; }),
        status: 'pending',
        startedAt: null,
        finishedAt: null,
        completedDate: null,
        endTime: null,
        createdAt: Date.now(),
        expReward: Math.floor(duration * 2) + 5 + Math.floor(levelRequired / 2),
        goldReward: Math.floor(duration * 1.5) + 3 + Math.floor(levelRequired / 3),
        period: period
    };

    window.eventosCache.push(newEvent);
    guardarEventos();
    renderEvents();

    if (titleInput) titleInput.value = '';
    if (startInput) startInput.value = '';
    if (durationInput) durationInput.value = '3';
    if (levelInput) levelInput.value = '1';
    if (tasksInput) tasksInput.value = '';
    if (iconInput) iconInput.value = '';
    if (imageInput) imageInput.value = '';

    var periodoTexto = {
        'once': 'Una vez',
        'daily': 'Diario',
        'weekly': 'Semanal',
        'monthly': 'Mensual'
    };

    if (typeof showToast === 'function') {
        showToast('✅ ' + (type === 'event' ? 'Evento' : 'Mazmorra') + ' "' + title + '" creado. Periodicidad: ' + (periodoTexto[period] || 'Una vez'), 'success', 'Aventura');
    }
}

// ============================================================
// ===== AGREGAR EJEMPLOS Y ELIMINAR TODOS =====
// ============================================================

function addSampleEvents() {
    if (player && player.gameOver) {
        if (typeof showToast === 'function') showToast('Estás en Game Over.', 'error', 'Error');
        return;
    }

    var now = new Date();
    var tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    var samples = [{
        title: '⚡ Torneo de Habilidades',
        type: 'event',
        start: tomorrow.toISOString().slice(0, 16),
        duration: 2,
        levelRequired: 1,
        tasks: ['Completar una tarea difícil', 'Enseñar algo a alguien', 'Aprender algo nuevo'],
        expReward: 20,
        goldReward: 12,
        period: 'once'
    }, {
        title: '🎯 Maratón de Creatividad',
        type: 'event',
        start: nextWeek.toISOString().slice(0, 16),
        duration: 6,
        levelRequired: 2,
        tasks: ['Escribir un poema', 'Hacer un dibujo', 'Crear una playlist', 'Cocinar algo nuevo'],
        expReward: 60,
        goldReward: 40,
        period: 'once'
    }, {
        title: '🏰 Mazmorra del Bosque Oscuro',
        type: 'dungeon',
        start: null,
        duration: 2,
        levelRequired: 1,
        tasks: ['Caminar 30 minutos', 'Meditar 5 minutos', 'Hacer 20 flexiones'],
        expReward: 15,
        goldReward: 8,
        period: 'once'
    }, {
        title: '🐉 Cueva del Dragón',
        type: 'dungeon',
        start: null,
        duration: 4,
        levelRequired: 3,
        tasks: ['Leer 20 páginas', 'Escribir un diario', 'Practicar un idioma 15 min', 'Hacer 30 sentadillas'],
        expReward: 30,
        goldReward: 20,
        period: 'once'
    }];

    samples.forEach(function (s) {
        var newEvent = {
            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            title: s.title,
            type: s.type,
            start: s.start,
            duration: s.duration,
            levelRequired: s.levelRequired || 1,
            tasks: s.tasks || [],
            taskStatus: (s.tasks || []).map(function () { return false; }),
            status: 'pending',
            startedAt: null,
            finishedAt: null,
            completedDate: null,
            endTime: null,
            createdAt: Date.now(),
            expReward: s.expReward || Math.floor(s.duration * 2) + 5,
            goldReward: s.goldReward || Math.floor(s.duration * 1.5) + 3,
            period: s.period || 'once'
        };
        window.eventosCache.push(newEvent);
    });

    guardarEventos();
    renderEvents();
    if (typeof showToast === 'function') {
        showToast('📋 ¡' + samples.length + ' eventos y mazmorras de ejemplo agregados!', 'success', 'Aventuras');
    }
}

function clearAllEvents() {
    if (player && player.gameOver) {
        if (typeof showToast === 'function') showToast('Estás en Game Over.', 'error', 'Error');
        return;
    }

    if (window.eventosCache.length === 0) {
        if (typeof showToast === 'function') showToast('No hay eventos para borrar.', 'info', 'Eventos');
        return;
    }

    if (typeof showModal === 'function') {
        showModal(
            '⚠️',
            'Eliminar Todos los Eventos',
            '¿Eliminar TODOS los eventos y mazmorras (' + window.eventosCache.length + ')?',
            'Eliminar Todos',
            function () {
                window.eventosCache = [];
                guardarEventos();
                renderEvents();
                if (typeof showToast === 'function') showToast('🗑️ Todos los eventos eliminados.', 'info', 'Eventos');
            },
            true
        );
    }
}

function importEventsConfig(event) {
    if (player && player.gameOver) {
        if (typeof showToast === 'function') showToast('Estás en Game Over.', 'error', 'Error');
        return;
    }

    var file = event.target.files[0];
    if (!file) return;

    var fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = function (e) {
        try {
            var imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                if (typeof showToast === 'function') showToast('El archivo debe contener un array.', 'error', 'Error');
                return;
            }

            var count = 0;
            imported.forEach(function (s) {
                var tasks = s.tasks || [];
                var newEvent = {
                    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    title: s.title || 'Evento sin nombre',
                    type: s.type || 'event',
                    icon: s.icon || null,
                    image: s.image || null,
                    start: s.start || null,
                    duration: s.duration || 3,
                    levelRequired: s.levelRequired || 1,
                    tasks: tasks,
                    taskStatus: tasks.map(function () { return false; }),
                    status: 'pending',
                    startedAt: null,
                    finishedAt: null,
                    completedDate: null,
                    endTime: null,
                    createdAt: Date.now(),
                    expReward: s.expReward || Math.floor((s.duration || 3) * 2) + 5,
                    goldReward: s.goldReward || Math.floor((s.duration || 3) * 1.5) + 3,
                    period: s.period || 'once'
                };
                window.eventosCache.push(newEvent);
                count++;
            });

            guardarEventos();
            renderEvents();
            if (typeof showToast === 'function') {
                showToast('📂 ¡' + count + ' eventos importados!', 'success', 'Importar');
            }
        } catch (error) {
            if (typeof showToast === 'function') {
                showToast('Error al leer el archivo: ' + error.message, 'error', 'Error');
            }
        }
    };
    event.target.value = '';
}

// ============================================================
// ===== FUNCIÓN DE IMAGEN (helper) =====
// ============================================================

function renderEntityImageBlock(image, icon, title) {
    if (image) {
        return '<div class="entity-image-block"><img src="' + image + '" alt="' + title + '" loading="lazy" onerror="this.style.display=\'none\'"></div>';
    }
    return '';
}

// ============================================================
// ===== FUNCIÓN DE ICONO (helper) =====
// ============================================================

function renderIconHTML(icon, defaultIcon) {
    if (icon) {
        if (icon.startsWith('http') || icon.startsWith('data:')) {
            return '<img src="' + icon + '" style="width:20px;height:20px;object-fit:contain;display:inline-block;vertical-align:middle;border-radius:4px;">';
        }
        return icon;
    }
    return defaultIcon;
}