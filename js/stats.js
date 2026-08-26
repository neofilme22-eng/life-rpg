                                // ===== FUNCIONES DE ESTADÍSTICAS =====
                                // ============================================================

                                function renderStats() {
                                    var container = document.getElementById('stats-container');
                                    if (!container) return;

                                    var totalDlcs = player.dlcs.length;
                                    var completedDlcs = player.dlcs.filter(function (dlc) {
                                        var missions = player.rawMissions.filter(function (m) { return m.dlcName === dlc.name; });
                                        return missions.length > 0 && missions.every(function (m) { return m.completed; });
                                    }).length;

                                    var totalMisiones = player.rawMissions.length;
                                    var misionesCompletadas = player.rawMissions.filter(function (m) { return m.completed; }).length;
                                    var misionesPrincipales = player.rawMissions.filter(function (m) { return m.type === 'main'; }).length;
                                    var misionesPrincipalesCompletadas = player.rawMissions.filter(function (m) { return m.type === 'main' && m.completed; }).length;
                                    var misionesSecundarias = player.rawMissions.filter(function (m) { return m.type === 'secondary'; }).length;
                                    var misionesSecundariasCompletadas = player.rawMissions.filter(function (m) { return m.type === 'secondary' && m.completed; }).length;

                                    var dailyMissions = loadDailyMissions();
                                    var dailyTotal = dailyMissions.length;
                                    var dailyCompletadas = dailyMissions.filter(function (m) { return m.completed; }).length;
                                    var dailyPendientes = dailyTotal - dailyCompletadas;
                                    var dailyVencidas = dailyMissions.filter(function (m) { return !m.completed && isMissionOverdue(m); }).length;

                                    var totalTrofeos = getTrophyDefinitions().length;
                                    var trofeosDesbloqueados = player.trophies.length;
                                    var trofeosBloqueados = totalTrofeos - trofeosDesbloqueados;

                                    var totalBosses = player.bosses.length;
                                    var bossesDerrotados = player.bosses.filter(function (b) { return b.defeated; }).length;
                                    var bossesVencidos = player.bosses.filter(function (b) { return b.vencido; }).length;
                                    var bossesActivos = player.bosses.filter(function (b) { return !b.defeated && !b.vencido; }).length;

                                    var events = player.events || [];
                                    var mazmorrasTotales = events.filter(function (e) { return e.type === 'dungeon'; }).length;
                                    var mazmorrasCompletadas = events.filter(function (e) { return e.type === 'dungeon' && e.status === 'finished' || e.status === 'completed'; }).length;
                                    var mazmorrasActivas = events.filter(function (e) { return e.type === 'dungeon' && e.status === 'active'; }).length;

                                    var eventosTotales = events.filter(function (e) { return e.type === 'event'; }).length;
                                    var eventosCompletados = events.filter(function (e) { return e.type === 'event' && e.status === 'finished'; }).length;
                                    var eventosActivos = events.filter(function (e) { return e.type === 'event' && e.status === 'active'; }).length;
                                    var eventosPendientes = events.filter(function (e) { return e.type === 'event' && e.status === 'pending'; }).length;

                                    var totalRunas = player.rawRunes.length;
                                    var runasCompletadasHoy = player.rawRunes.filter(function (r) { return r.completed; }).length;
                                    var runasStreakTotal = player.rawRunes.reduce(function (sum, r) { return sum + (r.streak || 0); }, 0);
                                    var runaMaxStreak = player.rawRunes.reduce(function (max, r) { return Math.max(max, r.streak || 0); }, 0);
                                    var runaNivelPromedio = totalRunas > 0 ? Math.round(player.rawRunes.reduce(function (sum, r) {
                                        var prog = calculateRuneLevelAndProgress(r.totalExp);
                                        return sum + prog.level;
                                    }, 0) / totalRunas) : 0;

                                    var totalPersonas = player.flock.length;
                                    var afinidadPromedio = totalPersonas > 0 ? Math.round(player.flock.reduce(function (sum, f) { return sum + f.affinity; }, 0) / totalPersonas) : 0;
                                    var personasConfianza5 = player.flock.filter(function (f) { return f.confidence >= 5; }).length;
                                    var personasRomance = player.flock.filter(function (f) { return f.status === 'romance' || f.status === 'partner'; }).length;
                                    var personasAmigas = player.flock.filter(function (f) { return f.status === 'friend'; }).length;
                                    var interaccionesTotales = player.flock.reduce(function (sum, f) { return sum + (f.streak || 0); }, 0);

                                    var itemsComprados = player.purchasedItems.length;
                                    var oroGastado = player.totalSpent || 0;

                                    var sesionesEnfoque = player.pomodoroSessions || 0;
                                    var tiempoEnfoqueMinutos = player.pomodoroFocusTime || 0;
                                    var horasEnfoque = Math.floor(tiempoEnfoqueMinutos / 60);
                                    var minutosEnfoque = tiempoEnfoqueMinutos % 60;

                                    var tiempoJuegoHoras = 0;
                                    if (player.logbook.length > 0) {
                                        var primerosRegistros = player.logbook.map(function (d) { return d.entries ? d.entries[0] ? d.entries[0].timestamp : null : null; }).filter(function (t) { return t; });
                                        if (primerosRegistros.length > 0) {
                                            var firstEntry = Math.min.apply(null, primerosRegistros);
                                            var ultimosRegistros = player.logbook.map(function (d) {
                                                var entries = d.entries || [];
                                                return entries.length > 0 ? entries[entries.length - 1].timestamp : null;
                                            }).filter(function (t) { return t; });
                                            var lastEntry = Math.max.apply(null, ultimosRegistros);
                                            var diffMs = lastEntry - firstEntry;
                                            tiempoJuegoHoras = Math.round(diffMs / (1000 * 60 * 60));
                                        }
                                    }

                                    var totalItems = player.inventory ? player.inventory.length : 0;
                                    var equipados = 0;
                                    if (player.equipment) {
                                        if (player.equipment.arma) equipados++;
                                        if (player.equipment.armadura) equipados++;
                                        if (player.equipment.reliquia) equipados++;
                                        if (player.equipment.mascota) equipados++;
                                    }

                                    var totalDias = player.logbook.length;
                                    var totalAcciones = player.logbook.reduce(function (sum, d) {
                                        var entries = d.entries || [];
                                        return sum + entries.length;
                                    }, 0);
                                    var totalExpGanada = player.logbook.reduce(function (sum, d) { return sum + (d.totalExp || 0); }, 0);
                                    var totalOroGanado = player.logbook.reduce(function (sum, d) { return sum + (d.totalGold || 0); }, 0);

                                    var tieneMascota = player.equipment && player.equipment.mascota !== null;
                                    var petHealthPercent = tieneMascota ? Math.round((player.petHealth / player.petMaxHealth) * 100) : 0;

                                    var expPercent = Math.round((player.exp / player.expToNextLevel) * 100);
                                    var misionesProgress = totalMisiones > 0 ? Math.round((misionesCompletadas / totalMisiones) * 100) : 0;
                                    var dailyProgress = dailyTotal > 0 ? Math.round((dailyCompletadas / dailyTotal) * 100) : 0;
                                    var trofeosProgress = totalTrofeos > 0 ? Math.round((trofeosDesbloqueados / totalTrofeos) * 100) : 0;

                                    var html = `
                <div class="stats-grid">
                    <div class="stats-card stats-card-full">
                        <div class="stats-title">Resumen General</div>
                        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-top:8px;">
                            <div style="text-align:center; padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                                <div style="font-size:1.4rem; font-weight:bold; color:var(--text);">${totalDias}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); opacity:0.5; font-family:'Georgia','Times New Roman',serif;">Días activos</div>
                            </div>
                            <div style="text-align:center; padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                                <div style="font-size:1.4rem; font-weight:bold; color:var(--text);">${totalAcciones}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); opacity:0.5; font-family:'Georgia','Times New Roman',serif;">Acciones</div>
                            </div>
                            <div style="text-align:center; padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                                <div style="font-size:1.4rem; font-weight:bold; color:var(--text);">${totalExpGanada}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); opacity:0.5; font-family:'Georgia','Times New Roman',serif;">EXP total</div>
                            </div>
                            <div style="text-align:center; padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                                <div style="font-size:1.4rem; font-weight:bold; color:var(--text);">${totalOroGanado}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); opacity:0.5; font-family:'Georgia','Times New Roman',serif;">ORO total</div>
                            </div>
                            <div style="text-align:center; padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                                <div style="font-size:1.4rem; font-weight:bold; color:var(--text);">${totalItems}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); opacity:0.5; font-family:'Georgia','Times New Roman',serif;">Objetos</div>
                            </div>
                            <div style="text-align:center; padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                                <div style="font-size:1.4rem; font-weight:bold; color:var(--text);">${trofeosDesbloqueados}/${totalTrofeos}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); opacity:0.5; font-family:'Georgia','Times New Roman',serif;">Trofeos</div>
                            </div>
                            <div style="text-align:center; padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                                <div style="font-size:1.4rem; font-weight:bold; color:var(--text);">${misionesCompletadas}/${totalMisiones}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); opacity:0.5; font-family:'Georgia','Times New Roman',serif;">Misiones</div>
                            </div>
                            <div style="text-align:center; padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                                <div style="font-size:1.4rem; font-weight:bold; color:var(--text);">${bossesDerrotados}/${totalBosses}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); opacity:0.5; font-family:'Georgia','Times New Roman',serif;">Bosses</div>
                            </div>
                        </div>
                        <div style="margin-top:8px; font-size:0.85rem; color:var(--text-muted); opacity:0.3; font-family:'Georgia','Times New Roman',serif; text-align:center;">
                            ${totalDias} días de aventura · Nivel ${player.level} · ${totalAcciones} acciones realizadas
                            ${player.gameOver ? ' GAME OVER' : ''}
                            ${tieneMascota ? ' · Mascota: ' + petHealthPercent + '% HP' : ''}
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Nivel y Progreso</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number" style="font-size:2.8rem;">${player.level}</span>
                            <div style="flex:1;">
                                <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">
                                    <span>EXP</span>
                                    <span>${player.exp} / ${player.expToNextLevel}</span>
                                </div>
                                <div class="stats-bar">
                                    <div class="stats-bar-fill" style="width:${expPercent}%; background:linear-gradient(90deg, #7c3aed, #a855f7);"></div>
                                </div>
                                <div style="font-size:0.6rem; color:var(--text-muted); opacity:0.4; margin-top:2px;">${expPercent}% para nivel ${player.level + 1}</div>
                            </div>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">EXP: ${player.exp}</span>
                            <span class="stats-tag">ORO: ${player.gold}</span>
                            <span class="stats-tag">HP: ${player.hp}/${player.maxHp}</span>
                            ${player.gameOver ? '<span class="stats-tag fail">💀 GAME OVER</span>' : ''}
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Misiones</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${misionesCompletadas}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">/ ${totalMisiones}</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">${misionesProgress}%</span>
                        </div>
                        <div class="stats-bar">
                            <div class="stats-bar-fill" style="width:${misionesProgress}%; background:linear-gradient(90deg, #22c55e, #16a34a);"></div>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">Principales: ${misionesPrincipalesCompletadas}/${misionesPrincipales}</span>
                            <span class="stats-tag">Secundarias: ${misionesSecundariasCompletadas}/${misionesSecundarias}</span>
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Misiones Diarias</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${dailyCompletadas}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">/ ${dailyTotal}</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">${dailyProgress}%</span>
                        </div>
                        <div class="stats-bar">
                            <div class="stats-bar-fill" style="width:${dailyProgress}%; background:linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">Pendientes: ${dailyPendientes}</span>
                            ${dailyVencidas > 0 ? '<span class="stats-tag">⛔ Vencidas: ' + dailyVencidas + '</span>' : ''}
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">DLCs</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${completedDlcs}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">/ ${totalDlcs}</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">${totalDlcs > 0 ? Math.round((completedDlcs / totalDlcs) * 100) : 0}%</span>
                        </div>
                        <div class="stats-bar">
                            <div class="stats-bar-fill" style="width:${totalDlcs > 0 ? (completedDlcs / totalDlcs) * 100 : 0}%; background:linear-gradient(90deg, #a855f7, #7c3aed);"></div>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">Instalados: ${totalDlcs}</span>
                            <span class="stats-tag">Completados: ${completedDlcs}</span>
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Bosses</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${bossesDerrotados}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">/ ${totalBosses}</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">${totalBosses > 0 ? Math.round((bossesDerrotados / totalBosses) * 100) : 0}%</span>
                        </div>
                        <div class="stats-bar">
                            <div class="stats-bar-fill" style="width:${totalBosses > 0 ? (bossesDerrotados / totalBosses) * 100 : 0}%; background:linear-gradient(90deg, #dc2626, #ef4444);"></div>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">Activos: ${bossesActivos}</span>
                            ${bossesDerrotados > 0 ? '<span class="stats-tag">Derrotados: ' + bossesDerrotados + '</span>' : ''}
                            ${bossesVencidos > 0 ? '<span class="stats-tag">Fallados: ' + bossesVencidos + '</span>' : ''}
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Campañas</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${mazmorrasCompletadas}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">/ ${mazmorrasTotales}</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">${mazmorrasTotales > 0 ? Math.round((mazmorrasCompletadas / mazmorrasTotales) * 100) : 0}%</span>
                        </div>
                        <div class="stats-bar">
                            <div class="stats-bar-fill" style="width:${mazmorrasTotales > 0 ? (mazmorrasCompletadas / mazmorrasTotales) * 100 : 0}%; background:linear-gradient(90deg, #8b5cf6, #a855f7);"></div>
                        </div>
                        <div class="stats-row">
                            ${mazmorrasActivas > 0 ? '<span class="stats-tag">Activas: ' + mazmorrasActivas + '</span>' : ''}
                            <span class="stats-tag">Completadas: ${mazmorrasCompletadas}</span>
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Eventos</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${eventosCompletados}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">/ ${eventosTotales}</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">${eventosTotales > 0 ? Math.round((eventosCompletados / eventosTotales) * 100) : 0}%</span>
                        </div>
                        <div class="stats-bar">
                            <div class="stats-bar-fill" style="width:${eventosTotales > 0 ? (eventosCompletados / eventosTotales) * 100 : 0}%; background:linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                        </div>
                        <div class="stats-row">
                            ${eventosActivos > 0 ? '<span class="stats-tag">Activos: ' + eventosActivos + '</span>' : ''}
                            ${eventosPendientes > 0 ? '<span class="stats-tag">Pendientes: ' + eventosPendientes + '</span>' : ''}
                            <span class="stats-tag">Completados: ${eventosCompletados}</span>
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Runas</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${runasCompletadasHoy}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">/ ${totalRunas} hoy</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">Nv.${runaNivelPromedio} avg</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag ">Racha máx: ${runaMaxStreak} días</span>
                            <span class="stats-tag">Total rachas: ${runasStreakTotal}</span>
                            <span class="stats-tag">Runas: ${totalRunas}</span>
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Círculo Social</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${totalPersonas}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">personas</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;"> ${afinidadPromedio}% avg</span>
                        </div>
                        <div class="stats-row">
                            ${personasRomance > 0 ? '<span class="stats-tag romance-tag">Romance: ' + personasRomance + '</span>' : ''}
                            ${personasAmigas > 0 ? '<span class="stats-tag">Amigos: ' + personasAmigas + '</span>' : ''}
                            <span class="stats-tag">Confianza 5: ${personasConfianza5}</span>
                        </div>
                        <div class="stats-sub">Interacciones totales: ${interaccionesTotales}</div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Trofeos</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${trofeosDesbloqueados}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">/ ${totalTrofeos}</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">${trofeosProgress}%</span>
                        </div>
                        <div class="stats-bar">
                            <div class="stats-bar-fill" style="width:${trofeosProgress}%; background:linear-gradient(90deg, #d97706, #fbbf24);"></div>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">Desbloqueados: ${trofeosDesbloqueados}</span>
                            <span class="stats-tag">Bloqueados: ${trofeosBloqueados}</span>
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Tienda</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${itemsComprados}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">items</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">${oroGastado} ORO</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">Items comprados: ${itemsComprados}</span>
                            <span class="stats-tag">ORO gastado: ${oroGastado}</span>
                        </div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Tiempo y Sesiones</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${horasEnfoque}h</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">${minutosEnfoque}m</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">🕯️ ${sesionesEnfoque} sesiones</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">Enfoque: ${sesionesEnfoque} sesiones</span>
                            <span class="stats-tag"> ${horasEnfoque} H ${minutosEnfoque} M total</span>
                        </div>
                        <div class="stats-sub">Tiempo de juego estimado: ${tiempoJuegoHoras > 0 ? tiempoJuegoHoras + ' horas' : 'Aún no disponible'}</div>
                    </div>

                    <div class="stats-card">
                        <div class="stats-title">Inventario</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="stats-number">${totalItems}</span>
                            <span style="color:var(--text-muted); opacity:0.4; font-size:0.9rem;">objetos</span>
                            <span style="margin-left:auto; font-size:0.7rem; color:var(--text-muted); opacity:0.5;">⚔️ ${equipados} equipados</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-tag">${totalItems} objetos</span>
                            <span class="stats-tag">${equipados} equipados</span>
                        </div>
                    </div>
                </div>
            `;

                                    container.innerHTML = html;
                                }

                                // ============================================================
