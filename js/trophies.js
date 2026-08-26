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
                                            addLogEntry('trophy', '🏆 Trofeo "' + trophy.name + '" desbloqueado', trophy.desc, 0, 0, null);
                                            showToast('🏆 ¡Trofeo "' + trophy.name + '" desbloqueado!', 'success', 'Trofeo');
                                        }, 300);
                                    }
                                });

                                if (unlockedAny) {
                                    saveGame();
                                    renderTrophies();
                                }
                            }

                            function checkDLCCompletion(dlcName) {
                                var trophyId = 'dlc_' + dlcName.replace(/\s+/g, '_');
                                if (player.dlcTrophies.indexOf(dlcName) !== -1) return;

                                var dlcMissions = player.rawMissions.filter(function (m) { return m.dlcName === dlcName; });
                                if (dlcMissions.length === 0) return;

                                var allCompleted = dlcMissions.every(function (m) { return m.completed; });

                                if (allCompleted) {
                                    player.dlcTrophies.push(dlcName);
                                    var trophyDef = dynamicTrophyDefinitions.find(function (t) { return t.id === trophyId; });
                                    if (trophyDef && player.trophies.indexOf(trophyId) === -1) {
                                        player.trophies.push(trophyId);
                                        console.log('🏆 ¡Trofeo de DLC desbloqueado! ' + trophyDef.icon + ' ' + trophyDef.name);
                                        setTimeout(function () {
                                            addLogEntry('trophy', '🏆 Trofeo "' + trophyDef.name + '" desbloqueado', 'DLC: ' + dlcName, 0, 0, null);
                                            showToast('🏆 ¡Trofeo "' + trophyDef.name + '" desbloqueado por DLC "' + dlcName + '"!', 'success', 'Trofeo');
                                        }, 400);
                                        saveGame();
                                        renderTrophies();
                                    }
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
                                        return t.name.toLowerCase().indexOf(searchTerm) !== -1 ||
                                            t.desc.toLowerCase().indexOf(searchTerm) !== -1;
                                    });
                                }

                                return trophies;
                            }

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
                                    container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; font-family:\'Georgia\',\'Times New Roman\',serif; text-align:center; padding:20px 0;">No hay trofeos que coincidan con tu búsqueda.</p>';
                                    if (pagination) pagination.innerHTML = '';
                                    return;
                                }

                                container.innerHTML = '';
                                pageTrophies.forEach(function (trophy) {
                                    var isUnlocked = player.trophies.indexOf(trophy.id) !== -1;

                                    var card = document.createElement('div');
                                    card.className = 'trophy-card ' + (isUnlocked ? 'unlocked' : 'locked');

                                    card.innerHTML = `
                    <div class="trophy-icon">${renderIconHTML(trophy.icon, '🏆')}</div>
                    <div class="trophy-name">${trophy.name}</div>
                    <div class="trophy-desc">${trophy.desc}</div>
                    <div class="trophy-status">${isUnlocked ? ' Desbloqueado' : ' Bloqueado'}</div>
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
