// ============================================================
// ===== HEATMAP DE CONSTANCIA + ACTIVIDAD EN CURSO =====
// ===== VERSIÓN UNIFICADA - UNA SOLA SECCIÓN =====
// ============================================================

var HEATMAP_WEEKS = 13;

function hmPad2(n) {
    return n < 10 ? '0' + n : '' + n;
}

function hmStartOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function hmDateKey(d) {
    return d.getFullYear() + '-' + hmPad2(d.getMonth() + 1) + '-' + hmPad2(d.getDate());
}

function hmMondayOf(d) {
    var x = hmStartOfDay(d);
    var day = x.getDay();
    var diff = (day === 0 ? -6 : 1 - day);
    x.setDate(x.getDate() + diff);
    return x;
}

// ============================================================
// ===== DATOS DEL HEATMAP =====
// ============================================================

function getDailyCompletionMap() {
    var map = {};
    if (!player || !player.logbook) return map;

    player.logbook.forEach(function (day) {
        (day.entries || []).forEach(function (entry) {
            if (entry.type === 'daily' && entry.timestamp) {
                var key = hmDateKey(new Date(entry.timestamp));
                map[key] = (map[key] || 0) + 1;
            }
        });
    });

    return map;
}

function heatmapLevel(count) {
    if (!count) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
}

// ============================================================
// ===== RENDER HEATMAP =====
// ============================================================

function renderDailyHeatmap() {
    var container = document.getElementById('daily-heatmap-container');
    if (!container) return;

    var today = hmStartOfDay(new Date());
    var todayKey = hmDateKey(today);
    var counts = getDailyCompletionMap();
    var thisMonday = hmMondayOf(today);

    var cols = [];
    for (var c = 0; c < HEATMAP_WEEKS; c++) {
        var colMonday = new Date(thisMonday);
        colMonday.setDate(colMonday.getDate() - (HEATMAP_WEEKS - 1 - c) * 7);
        var days = [];
        for (var d = 0; d < 7; d++) {
            var date = new Date(colMonday);
            date.setDate(date.getDate() + d);
            days.push(date);
        }
        cols.push(days);
    }

    var monthsHtml = '';
    var lastMonth = null;
    cols.forEach(function (days) {
        var firstDay = days[0];
        var label = '';
        if (firstDay.getMonth() !== lastMonth) {
            label = firstDay.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
            lastMonth = firstDay.getMonth();
        }
        monthsHtml += '<span class="heatmap-month-label">' + label + '</span>';
    });

    var gridHtml = '';
    cols.forEach(function (days) {
        gridHtml += '<div class="heatmap-col">';
        days.forEach(function (date) {
            if (date > today) {
                gridHtml += '<div class="heatmap-cell level-empty"></div>';
                return;
            }
            var key = hmDateKey(date);
            var count = counts[key] || 0;
            var level = heatmapLevel(count);
            var dateFormatted = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            var label = count === 0
                ? 'Sin misiones completadas el ' + dateFormatted
                : (count + ' misión' + (count === 1 ? '' : 'es') + ' completada' + (count === 1 ? '' : 's') + ' el ' + dateFormatted);
            var todayClass = key === todayKey ? ' is-today' : '';
            gridHtml += '<div class="heatmap-cell level-' + level + todayClass + '" title="' + label + '"></div>';
        });
        gridHtml += '</div>';
    });

    container.innerHTML =
        '<div class="heatmap-months">' + monthsHtml + '</div>' +
        '<div class="heatmap-grid">' + gridHtml + '</div>' +
        '<div class="heatmap-legend">' +
        '<span>Menos</span>' +
        '<span class="heatmap-cell level-0"></span>' +
        '<span class="heatmap-cell level-1"></span>' +
        '<span class="heatmap-cell level-2"></span>' +
        '<span class="heatmap-cell level-3"></span>' +
        '<span class="heatmap-cell level-4"></span>' +
        '<span>Más</span>' +
        '</div>';
}

// ============================================================
// ===== ACTIVIDAD EN CURSO: FORMATOS =====
// ============================================================

function hmFormatRemaining(ms) {
    if (ms == null) return 'En curso';
    if (ms <= 0) return 'Finalizando...';

    var totalMinutes = Math.floor(ms / 60000);
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;

    if (hours >= 24) {
        var days = Math.floor(hours / 24);
        return days + 'd ' + (hours % 24) + 'h restantes';
    }
    if (hours > 0) return hours + 'h ' + minutes + 'm restantes';
    return minutes + 'm restantes';
}

function hmFormatDaysUntil(diffDays) {
    if (diffDays < 0) return '¡Vencido!';
    if (diffDays === 0) return '⚡ Hoy';
    if (diffDays === 1) return '📅 Mañana';
    return '📆 En ' + diffDays + ' días';
}

// ============================================================
// ===== OBTENER ACTIVIDADES =====
// ============================================================

function getActivityAlerts() {
    if (typeof cargarEventos === 'function') cargarEventos();

    var now = new Date();
    var items = [];
    var eventos = window.eventosCache || [];

    // Eventos activos (dungeons)
    eventos.forEach(function (e) {
        if (e.type === 'dungeon' && e.status === 'active') {
            var remaining = e.endTime ? (new Date(e.endTime) - now) : null;
            items.push({
                icon: e.icon || '🗝️',
                title: e.title,
                sub: hmFormatRemaining(remaining),
                cls: 'alert-dungeon',
                urgent: remaining != null && remaining < 3 * 3600000
            });
        }
        // Eventos activos (eventos normales)
        if (e.type === 'event' && e.status === 'active' && e.start) {
            var startDate = new Date(e.start);
            var endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + (e.duration || 3));
            var remaining2 = endDate - now;
            items.push({
                icon: e.icon || '🎉',
                title: e.title,
                sub: hmFormatRemaining(remaining2),
                cls: 'alert-event',
                urgent: remaining2 < 3 * 3600000
            });
        }
    });

    // Eventos próximos
    eventos
        .filter(function (e) { return e.type === 'event' && e.status === 'pending' && e.start; })
        .sort(function (a, b) { return new Date(a.start) - new Date(b.start); })
        .slice(0, 3)
        .forEach(function (e) {
            var diffDays = Math.ceil((new Date(e.start) - now) / 86400000);
            if (diffDays > 14) return;
            items.push({
                icon: e.icon || '📅',
                title: e.title,
                sub: hmFormatDaysUntil(diffDays),
                cls: 'alert-event-upcoming',
                urgent: diffDays <= 1
            });
        });

    // Bosses activos
    ((player && player.bosses) || [])
        .filter(function (b) { return !b.defeated && !b.vencido && b.deadline; })
        .sort(function (a, b) { return new Date(a.deadline) - new Date(b.deadline); })
        .slice(0, 3)
        .forEach(function (b) {
            var diffDays = Math.ceil((new Date(b.deadline) - now) / 86400000);
            items.push({
                icon: b.icon || '👹',
                title: b.name,
                sub: hmFormatDaysUntil(diffDays),
                cls: 'alert-boss',
                urgent: diffDays <= 2
            });
        });

    return items;
}

// ============================================================
// ===== RENDER ACTIVIDAD EN CURSO =====
// ============================================================

function renderActivityAlerts() {
    var container = document.getElementById('activity-alerts-container');
    if (!container) return;

    var items = getActivityAlerts();

    if (items.length === 0) {
        container.innerHTML = '<div class="activity-alerts-empty">Sin eventos, mazmorras o bosses próximos.</div>';
        return;
    }

    var html = '';
    items.forEach(function (item) {
        var iconHtml = (typeof renderIconHTML === 'function') ? renderIconHTML(item.icon, '⚔️') : item.icon;
        var safeTitle = (typeof escapeHtml === 'function') ? escapeHtml(item.title || '') : (item.title || '');
        html += '<div class="activity-alert-item ' + item.cls + (item.urgent ? ' urgent' : '') + '">' +
            '<span class="activity-alert-icon">' + iconHtml + '</span>' +
            '<span class="activity-alert-text">' +
            '<span class="activity-alert-title">' + safeTitle + '</span>' +
            '<span class="activity-alert-sub">' + item.sub + '</span>' +
            '</span>' +
            '</div>';
    });

    container.innerHTML = html;
}

// ============================================================
// ===== SIDEBAR UNIFICADA =====
// ============================================================

function renderDailySidebar() {
    renderDailyHeatmap();
    renderActivityAlerts();
}

// ============================================================
// ===== TOGGLE MÓVIL: MISIONES <-> CALENDARIO/ACTIVIDAD =====
// ============================================================

function toggleDailySidebarMobile(target) {
    var grid = document.querySelector('.daily-missions-grid');
    if (!grid) return;
    
    if (target === 'sidebar') {
        grid.classList.add('show-daily-sidebar');
        
        setTimeout(function() {
            var sidebar = document.querySelector('.daily-sidebar');
            if (sidebar) {
                // Scroll instantáneo (sin animación)
                sidebar.scrollIntoView({ block: 'start' });
            }
        }, 100);
        
    } else {
        grid.classList.remove('show-daily-sidebar');
        
        setTimeout(function() {
            var missionsSection = document.querySelector('.daily-missions-grid > .section-box:first-child');
            if (missionsSection) {
                missionsSection.scrollIntoView({ block: 'start' });
            }
        }, 100);
    }
}

// ============================================================
// ===== INICIALIZACIÓN =====
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(renderDailySidebar, 250);
});

// Actualización automática cada 60 segundos
if (!window.__dailySidebarInterval) {
    window.__dailySidebarInterval = setInterval(function () {
        renderDailySidebar();
    }, 60000);
}