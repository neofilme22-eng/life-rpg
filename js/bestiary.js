            // ===== FUNCIONES DE BESTIARIO =====
            // ============================================================
            // Une dos fuentes de datos:
            //   - player.bosses (defeated === true)      -> instancias del jugador
            //   - CHAMPS + player.defeatedChamps          -> catálogo fijo del juego
            // Solo se listan entidades ya derrotadas al menos una vez.
            // ============================================================

            var bestiaryFilter = 'all'; // 'all' | 'boss' | 'champ'
            var bestiarySelectedKey = null;

            function getBestiaryEntries() {
                var entries = [];

                (player.bosses || []).forEach(function (boss) {
                    if (!boss.defeated) return;
                    entries.push({
                        key: 'boss_' + boss.id,
                        kind: 'boss',
                        name: boss.name,
                        icon: boss.icon,
                        image: boss.image || null,
                        desc: boss.desc || 'No dejó registro de su naturaleza, solo cenizas.',
                        date: boss.defeatedDate || 0,
                        timesDefeated: 1,
                        extra: null
                    });
                });

                var defeatedChamps = player.defeatedChamps || {};
                Object.keys(defeatedChamps).forEach(function (champId) {
                    var champ = CHAMPS.find(function (c) { return c.id === champId; });
                    if (!champ) return;
                    var record = defeatedChamps[champId];
                    entries.push({
                        key: 'champ_' + champ.id,
                        kind: 'champ',
                        name: champ.name,
                        icon: champ.icon,
                        image: champ.image || null,
                        desc: champ.desc || '',
                        date: record.firstDefeatedDate || 0,
                        timesDefeated: record.timesDefeated || 1,
                        extra: '🎯 Debilidad: ' + (ATTR_LABELS_SHORT[champ.counterAttr] || champ.counterAttr)
                    });
                });

                entries.sort(function (a, b) { return b.date - a.date; });
                return entries;
            }

            function setBestiaryFilter(filter) {
                bestiaryFilter = filter;
                renderBestiary();
            }

            function selectBestiaryEntry(key) {
                bestiarySelectedKey = key;
                renderBestiary();
            }

            function renderBestiary() {
                var listEl = document.getElementById('bestiary-list');
                var detailEl = document.getElementById('bestiary-detail');
                if (!listEl || !detailEl) return;

                var allEntries = getBestiaryEntries();
                var countBoss = allEntries.filter(function (e) { return e.kind === 'boss'; }).length;
                var countChamp = allEntries.filter(function (e) { return e.kind === 'champ'; }).length;

                var countsEl = document.getElementById('bestiary-counts');
                if (countsEl) {
                    countsEl.textContent = allEntries.length + ' registradas (👹 ' + countBoss + ' · ⚔️ ' + countChamp + ')';
                }

                var entries = allEntries.filter(function (e) {
                    return bestiaryFilter === 'all' || e.kind === bestiaryFilter;
                });

                document.querySelectorAll('.bestiary-filter-btn').forEach(function (btn) {
                    btn.classList.toggle('active', btn.dataset.filter === bestiaryFilter);
                });

                if (entries.length === 0) {
                    listEl.innerHTML = '<div class="bestiary-empty">Todavía no hay nada registrado en esta categoría. Salí a cazar.</div>';
                    detailEl.innerHTML = '<div class="bestiary-detail-empty">Elegí una entrada de la lista para ver su ficha.</div>';
                    return;
                }

                if (!bestiarySelectedKey || !entries.some(function (e) { return e.key === bestiarySelectedKey; })) {
                    bestiarySelectedKey = entries[0].key;
                }

                var listHtml = '';
                entries.forEach(function (entry) {
                    var isActive = entry.key === bestiarySelectedKey;
                    listHtml += '<div class="bestiary-list-item ' + entry.kind + (isActive ? ' active' : '') + '" onclick="selectBestiaryEntry(\'' + entry.key + '\')">' +
                        '<span class="bestiary-list-icon">' + renderIconHTML(entry.icon, entry.kind === 'boss' ? '👹' : '⚔️') + '</span>' +
                        '<div class="bestiary-list-info">' +
                        '<div class="bestiary-list-name">' + entry.name + '</div>' +
                        '<span class="bestiary-type-tag ' + entry.kind + '">' + (entry.kind === 'boss' ? '👹 Deidad' : '⚔️ Campeón') + '</span>' +
                        '</div>' +
                        '</div>';
                });
                listEl.innerHTML = listHtml;

                var selected = entries.find(function (e) { return e.key === bestiarySelectedKey; });
                if (selected) {
                    var dateStr = selected.date ? new Date(selected.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Fecha desconocida';
                    var imageBlock = selected.image
                        ? renderEntityImageBlock(selected.image, selected.icon, selected.name, 'bestiary-detail-image')
                        : '<div class="entity-image-wrap bestiary-detail-image"><div class="entity-image-fallback">' + renderIconHTML(selected.icon, selected.kind === 'boss' ? '👹' : '⚔️') + '</div></div>';

                    detailEl.innerHTML =
                        imageBlock +
                        '<div class="bestiary-detail-header">' +
                        '<span class="bestiary-type-tag ' + selected.kind + '">' + (selected.kind === 'boss' ? '👹 Deidad' : '⚔️ Campeón') + '</span>' +
                        '<h3 class="bestiary-detail-name">' + selected.name + '</h3>' +
                        '</div>' +
                        '<p class="bestiary-detail-desc">' + (selected.desc || 'Sin descripción registrada.') + '</p>' +
                        '<div class="bestiary-detail-meta">' +
                        (selected.kind === 'boss'
                            ? '<span>🗓️ Derrotado el ' + dateStr + '</span>'
                            : '<span>🗓️ Primera vez: ' + dateStr + '</span><span>🔁 Veces derrotado: ' + selected.timesDefeated + '</span>' + (selected.extra ? '<span>' + selected.extra + '</span>' : '')) +
                        '</div>';
                }
            }

            // ============================================================
