                            // ===== FUNCIONES DE TROFEOS =====
                            // ============================================================

                            function checkAndUnlockTrophies() {
                                var unlockedAny = false;
                                var allTrophies = getTrophyDefinitions();

                                allTrophies.forEach(function (trophy) {
                                    if (player.trophies.indexOf(trophy.id) !== -1) return;

                                    if (trophy.check(player)) {
                                        player.trophies.push(trophy.id);
                                        unlockedAny = true;
                                        console.log('🏆 ¡Trofeo desbloqueado! ' + trophy.icon + ' ' + trophy.name);

                                        setTimeout(function () {
                                            addLogEntry('trophy', 'Trofeo "' + trophy.name + '" desbloqueado', trophy.desc, 0, 0, null);
                                            showToast('¡Trofeo "' + trophy.name + '" desbloqueado!', 'success', 'Trofeo');
                                        }, 300);
                                    }
                                });

                                if (unlockedAny) {
                                    saveGame();
                                    renderTrophies();
                                }
                            }

                            function getFilteredTrophies() {
                                var searchInput = document.getElementById('trophy-search');
                                var filterSelect = document.getElementById('trophy-filter');

                                var searchTerm = (searchInput ? searchInput.value : '').toLowerCase() || '';
                                var filterType = (filterSelect ? filterSelect.value : 'all') || 'all';

                                var trophies = getTrophyDefinitions();

                                if (filterType === 'unlocked') {
                                    trophies = trophies.filter(function (t) { return player.trophies.indexOf(t.id) !== -1; });
                                } else if (filterType === 'locked') {
                                    trophies = trophies.filter(function (t) { return player.trophies.indexOf(t.id) === -1; });
                                }

                                if (searchTerm) {
                                    trophies = trophies.filter(function (t) {
                                        if (t.secret && player.trophies.indexOf(t.id) === -1) return false;   // los secretos no se filtran por nombre
                                        return t.name.toLowerCase().indexOf(searchTerm) !== -1 ||
                                            t.desc.toLowerCase().indexOf(searchTerm) !== -1;
                                    });
                                }

                                return trophies;
                            }

                            // Categorías: el color de cada una es el de su sistema en la app
                            var TROPHY_CATS = {
                                nivel:    { label: 'Nivel',       color: 'var(--brass)' },
                                exp:      { label: 'Experiencia', color: 'var(--c-secondary)' },
                                misiones: { label: 'Misiones',    color: 'var(--c-main)' },
                                tareas:   { label: 'Tareas',      color: 'var(--c-daily)' },
                                runas:    { label: 'Runas',       color: 'var(--celeste)' },
                                eventos:  { label: 'Eventos',     color: 'var(--dusk)' },
                                metas:    { label: 'Metas',       color: 'var(--silver)' },
                                animo:    { label: 'Ánimo',       color: 'var(--lichen-light)' },
                                dlc:      { label: 'DLC',         color: 'var(--rose)' }
                            };

                            function renderTrophies() {
                                var container = document.getElementById('trophy-container');
                                var pagination = document.getElementById('trophy-pagination');
                                if (!container) return;

                                var trophies = getFilteredTrophies();
                                var totalItems = trophies.length;
                                var totalPages = Math.ceil(totalItems / trophyItemsPerPage);

                                if (trophyCurrentPage > totalPages) trophyCurrentPage = Math.max(1, totalPages);
                                if (trophyCurrentPage < 1) trophyCurrentPage = 1;

                                var startIndex = (trophyCurrentPage - 1) * trophyItemsPerPage;
                                var endIndex = Math.min(startIndex + trophyItemsPerPage, totalItems);
                                var pageTrophies = trophies.slice(startIndex, endIndex);

                                var total = getTrophyDefinitions().length;
                                var unlocked = player.trophies.length;

                                var countEl = document.getElementById('trophy-count');
                                var totalEl = document.getElementById('trophy-total');
                                if (countEl) countEl.textContent = unlocked;
                                if (totalEl) totalEl.textContent = total;

                                if (totalItems === 0) {
                                    container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; font-family:var(--font-body); text-align:center; padding:20px 0;">No hay trofeos que coincidan con tu búsqueda.</p>';
                                    if (pagination) pagination.innerHTML = '';
                                    return;
                                }

                                container.innerHTML = '';
                                var allDefs = getTrophyDefinitions();
                                pageTrophies.forEach(function (trophy) {
                                    var isUnlocked = player.trophies.indexOf(trophy.id) !== -1;

                                    var card = document.createElement('div');
                                    card.className = 'trophy-card ' + (isUnlocked ? 'unlocked' : 'locked');

                                    var cat = TROPHY_CATS[trophy.cat] || TROPHY_CATS.dlc;
                                    var isSecret = trophy.secret && !isUnlocked;
                                    var shownName = isSecret ? '???' : trophy.name;
                                    var shownDesc = isSecret ? 'Trofeo secreto' : trophy.desc;
                                    var shownIcon = isSecret ? '❔' : trophy.icon;
                                    var number = allDefs.findIndex(function (d) { return d.id === trophy.id; }) + 1;
                                    card.style.setProperty('--tc', cat.color);

                                    card.innerHTML = `
                    <div class="trophy-top"><span class="trophy-no">N.º ${number < 10 ? '0' + number : number}</span><span class="trophy-cat">${trophy.catLabel || cat.label}</span></div>
                    <div class="trophy-ribbon"></div>
                    <div class="trophy-icon">${renderIconHTML(shownIcon, '🏆')}</div>
                    <div class="trophy-name">${escapeHtml(shownName)}</div>
                    <div class="trophy-desc">${escapeHtml(shownDesc)}</div>
                    <div class="trophy-status">${isUnlocked ? 'Desbloqueado' : 'Bloqueado'}</div>
                `;

                                    container.appendChild(card);
                                });

                                if (pagination) {
                                    renderPagination(pagination, trophyCurrentPage, totalPages, function (page) {
                                        trophyCurrentPage = page;
                                        renderTrophies();
                                    });
                                }
                            }

                            // ============================================================
