            // ===== FUNCIONES DE DIARIO =====
            // ============================================================

            function addLogEntry(type, title, details, expGain, goldGain, attrGain, extraData) {
                var now = new Date();
                var dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                var timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                var icon = LOG_ICONS[type] || '📌';

                var entry = {
                    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    date: dateStr,
                    time: timeStr,
                    timestamp: now.getTime(),
                    type: type,
                    icon: icon,
                    title: title,
                    details: details || '',
                    expGain: expGain || 0,
                    goldGain: goldGain || 0,
                    attrGain: attrGain || null,
                    extraData: extraData || null
                };

                var todayEntry = player.logbook.find(function (e) { return e.date === dateStr; });

                if (!todayEntry) {
                    player.logbook.push({
                        id: 'day_' + Date.now(),
                        date: dateStr,
                        entries: [entry],
                        totalExp: expGain || 0,
                        totalGold: goldGain || 0,
                        expanded: false,
                        counts: { missions: 0, runes: 0, dungeons: 0, events: 0, trophies: 0, actions: 1, inventory: 0, damage: 0 }
                    });
                    var day = player.logbook[player.logbook.length - 1];
                    updateCounts(day, type);
                } else {
                    todayEntry.entries.push(entry);
                    todayEntry.totalExp = (todayEntry.totalExp || 0) + (expGain || 0);
                    todayEntry.totalGold = (todayEntry.totalGold || 0) + (goldGain || 0);
                    todayEntry.counts.actions = (todayEntry.counts.actions || 0) + 1;
                    updateCounts(todayEntry, type);
                }

                saveGame();
                renderLogbook();
            }

            function updateCounts(day, type) {
                if (!day.counts) {
                    day.counts = { missions: 0, runes: 0, dungeons: 0, events: 0, trophies: 0, actions: 0, inventory: 0, damage: 0 };
                }
                var countMap = {
                    'mission': 'missions',
                    'daily': 'missions',
                    'rune': 'runes',
                    'dungeon': 'dungeons',
                    'event': 'events',
                    'trophy': 'trophies',
                    'inventory': 'inventory',
                    'damage': 'damage'
                };
                var key = countMap[type];
                if (key) {
                    day.counts[key] = (day.counts[key] || 0) + 1;
                }
            }

            function toggleLogEntry(dayId) {
                var dayEntry = player.logbook.find(function (e) { return e.id === dayId; });
                if (dayEntry) {
                    dayEntry.expanded = !dayEntry.expanded;
                    saveGame();
                    renderLogbook();
                }
            }

            function renderLogbook() {
                var container = document.getElementById('logbook-container');
                if (!container) return;

                if (!player.logbook || player.logbook.length === 0) {
                    container.innerHTML = '<div class="logbook-empty"> Aún no hay actividad registrada. ¡Comienza a jugar y el diario se llenará solo!</div>';
                    return;
                }

                var sorted = player.logbook.slice().sort(function (a, b) {
                    var dateA = new Date(a.date.split(' ')[0].split('/').reverse().join('-'));
                    var dateB = new Date(b.date.split(' ')[0].split('/').reverse().join('-'));
                    return dateB - dateA;
                });

                var html = '';
                sorted.forEach(function (day) {
                    var isOpen = day.expanded || false;
                    var counts = day.counts || { missions: 0, runes: 0, dungeons: 0, events: 0, trophies: 0, actions: 0, inventory: 0, damage: 0 };

                    var summaryParts = [];
                    if (day.totalExp > 0) summaryParts.push('⭐ ' + day.totalExp + ' EXP');
                    if (day.totalGold > 0) summaryParts.push('🟡 ' + day.totalGold + ' GOLD');
                    summaryParts.push('⚔️ ' + (counts.actions || 0) + ' ACCIONES');
                    if (counts.damage > 0) summaryParts.push('💔 ' + counts.damage + ' DAÑO');
                    if (counts.missions > 0) summaryParts.push('📜 ' + counts.missions + ' MISIONES');
                    if (counts.runes > 0) summaryParts.push('💠 ' + counts.runes + ' RUNA' + (counts.runes > 1 ? 'S' : ''));
                    if (counts.dungeons > 0) summaryParts.push('🏰 ' + counts.dungeons + ' MAZMORRA' + (counts.dungeons > 1 ? 'S' : ''));
                    if (counts.events > 0) summaryParts.push('🎉 ' + counts.events + ' EVENTO' + (counts.events > 1 ? 'S' : ''));
                    if (counts.trophies > 0) summaryParts.push('🏆 ' + counts.trophies + ' LOGRO' + (counts.trophies > 1 ? 'S' : ''));
                    if (counts.inventory > 0) summaryParts.push('🎒 ' + counts.inventory + ' OBJETO' + (counts.inventory > 1 ? 'S' : ''));

                    var summary = summaryParts.join(' — ');

                    html += `
            <div class="logbook-entry">
                <div class="logbook-entry-header" onclick="toggleLogEntry('${day.id}')">
                    <div class="entry-left">
                        <span class="entry-icon">📅</span>
                        <span class="entry-title">${day.date}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0; flex-wrap:wrap;">
                        <span class="entry-summary">${summary}</span>
                        <span class="entry-toggle ${isOpen ? 'open' : ''}">▼</span>
                    </div>
                </div>
                <div class="logbook-entry-body ${isOpen ? 'open' : ''}">
                    ${day.entries ? day.entries.map(function (e) {
                        var rewardText = '';
                        if (e.expGain > 0) rewardText += '<span class="exp">+' + e.expGain + ' EXP</span>';
                        if (e.goldGain > 0) rewardText += ' <span class="gold">+' + e.goldGain + ' 🟡</span>';
                        if (e.attrGain) rewardText += ' <span class="attr">+1 ' + (attrNames[e.attrGain] || e.attrGain) + '</span>';
                        return `
                                    <div class="log-detail">
                                        <span class="log-time">${e.time}</span>
                                        <span class="log-text">${e.title}${e.details ? ' — ' + e.details : ''}</span>
                                        ${rewardText ? '<span class="log-rewards">' + rewardText + '</span>' : ''}
                                    </div>
                                `;
                    }).join('') : ''}
                            <div class="log-summary" style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(251,191,36,0.08); color:var(--gold); font-weight:bold; font-size:0.8rem;">
                                📊 Resumen del día: ${summaryParts.join(' · ')}
                            </div>
                        </div>
                    </div>
                `;
                });

                container.innerHTML = html;
            }

            // ============================================================
