                        // ===== FUNCIONES DE TIENDA =====
                        // ============================================================

                        function getShopItemCount(itemId) {
                            return player.purchasedItems.filter(function (id) { return id === itemId; }).length;
                        }

                        function getSortedShopItems() {
                            var searchInput = document.getElementById('shop-search');
                            var sortSelect = document.getElementById('shop-sort');

                            var searchTerm = (searchInput ? searchInput.value : '').toLowerCase() || '';
                            var sortBy = (sortSelect ? sortSelect.value : 'name') || 'name';

                            var items = SHOP_ITEMS.slice();

                            if (currentShopFilter !== 'all') {
                                items = items.filter(function (i) { return i.category === currentShopFilter; });
                            }

                            if (searchTerm) {
                                items = items.filter(function (i) {
                                    return i.name.toLowerCase().indexOf(searchTerm) !== -1 ||
                                        i.desc.toLowerCase().indexOf(searchTerm) !== -1;
                                });
                            }

                            switch (sortBy) {
                                case 'price-asc':
                                    items.sort(function (a, b) { return a.price - b.price; });
                                    break;
                                case 'price-desc':
                                    items.sort(function (a, b) { return b.price - a.price; });
                                    break;
                                default:
                                    items.sort(function (a, b) { return a.name.localeCompare(b.name); });
                                    break;
                            }

                            return items;
                        }

                        function filterShop(category, btn) {
                            currentShopFilter = category;
                            document.querySelectorAll('.shop-cat-btn').forEach(function (b) { b.classList.remove('active'); });
                            if (btn) btn.classList.add('active');
                            shopCurrentPage = 1;
                            renderShop();
                        }

                        function renderShop() {
                            var container = document.getElementById('shop-container');
                            var pagination = document.getElementById('shop-pagination');
                            if (!container) return;

                            var goldEl = document.getElementById('shop-gold');
                            if (goldEl) goldEl.textContent = player.gold;

                            var items = getSortedShopItems();
                            var totalItems = items.length;
                            var totalPages = Math.ceil(totalItems / shopItemsPerPage);

                            if (shopCurrentPage > totalPages) shopCurrentPage = Math.max(1, totalPages);
                            if (shopCurrentPage < 1) shopCurrentPage = 1;

                            var startIndex = (shopCurrentPage - 1) * shopItemsPerPage;
                            var endIndex = Math.min(startIndex + shopItemsPerPage, totalItems);
                            var pageItems = items.slice(startIndex, endIndex);

                            if (totalItems === 0) {
                                container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; font-family:\'Georgia\',\'Times New Roman\',serif; text-align:center; padding:20px 0;">No hay items que coincidan con tu búsqueda.</p>';
                                if (pagination) pagination.innerHTML = '';
                                return;
                            }

                            container.innerHTML = '';
                            pageItems.forEach(function (item) {
                                var count = getShopItemCount(item.id);
                                var maxed = count >= item.maxPurchases;
                                var canAfford = player.gold >= item.price;
                                var canBuy = canAfford && !maxed;

                                var card = document.createElement('div');
                                var categoryClass = 'category-' + (item.category || 'upgrade');
                                card.className = 'shop-item ' + categoryClass + (maxed ? ' purchased' : '');

                                var categoryLabels = {
                                    arma: 'Arma',
                                    armadura: 'Armadura',
                                    reliquia: 'Reliquia',
                                    consumable: 'Consumible',
                                    real: 'Recompensa Real',
                                    pet: 'Mascota'
                                };
                                var categoryLabel = categoryLabels[item.category] || '📦 Item';

                                card.innerHTML = `
                    <div class="shop-item-header">
                        <span class="shop-item-name">${item.icon ? renderIconHTML(item.icon, '') + ' ' : ''}${item.name}</span>
                        <span class="shop-item-price">🟡 ${item.price}</span>
                    </div>                    
                    <div class="shop-item-category">${categoryLabel}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                    ${item.maxPurchases > 1 ? '<div class="purchase-count">Compras: ' + count + '/' + item.maxPurchases + '</div>' : ''}
                    <button class="shop-buy-btn ${maxed ? 'purchased-btn' : ''}" 
                            onclick="purchaseItem('${item.id}')" 
                            ${!canBuy || player.gameOver ? 'disabled' : ''}>
                        ${maxed ? '✅ Comprado' : (canAfford ? '🛒 Comprar' : '🔒 Oro insuficiente')}
                    </button>
                `;

                                container.appendChild(card);
                            });

                            if (pagination) {
                                renderPagination(pagination, shopCurrentPage, totalPages, function (page) {
                                    shopCurrentPage = page;
                                    renderShop();
                                });
                            }
                        }

                        function purchaseItem(itemId) {
                            if (player.gameOver) {
                                showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                return;
                            }

                            var item = SHOP_ITEMS.find(function (i) { return i.id === itemId; });
                            if (!item) return;

                            var count = getShopItemCount(itemId);
                            if (count >= item.maxPurchases) {
                                showToast('Ya has comprado el máximo de este item.', 'warning', 'Tienda');
                                return;
                            }

                            if (player.gold < item.price) {
                                showToast('No tienes suficiente ORO. Necesitas ' + item.price + ' ORO.', 'error', 'Tienda');
                                return;
                            }

                            player.gold -= item.price;
                            player.purchasedItems.push(itemId);
                            player.totalSpent = (player.totalSpent || 0) + item.price;

                            addToInventory(item);

                            if (item.category === 'real' && item.effect && item.effect.type === 'real_reward') {
                                showToast('🎉 ¡Disfruta tu recompensa: ' + item.effect.value + '!', 'success', 'Recompensa Real');
                            }

                            saveGame();
                            renderShop();
                            updateHUD();
                            checkAndUnlockTrophies();

                            addLogEntry('shop', '🛒 Compra: ' + item.name, '-' + item.price + ' ORO', 0, 0, null);
                            showToast('🛒 ¡' + item.name + ' comprado!', 'success', 'Tienda');
                        }

                        function addToInventory(item) {
                            var type = 'otro';
                            var equipable = false;
                            var slot = null;
                            var icon = item.name.split(' ')[0] || '📦';

                            if (item.category === 'arma') {
                                type = 'arma';
                                equipable = true;
                                slot = 'arma';
                                icon = '⚔️';
                            } else if (item.category === 'armadura') {
                                type = 'armadura';
                                equipable = true;
                                slot = 'armadura';
                                icon = '🛡️';
                            } else if (item.category === 'reliquia') {
                                type = 'reliquia';
                                equipable = true;
                                slot = 'reliquia';
                                icon = '💫';
                            } else if (item.category === 'pet') {
                                type = 'mascota';
                                equipable = true;
                                slot = 'mascota';
                                icon = item.effect.value || '🐾';
                            } else if (item.category === 'consumable') {
                                type = 'consumable';
                                equipable = false;
                                slot = null;
                                icon = '🧪';
                            } else if (item.category === 'real') {
                                type = 'recompensa';
                                equipable = false;
                                slot = null;
                                icon = '🎁';
                            }

                            if (item.icon) {
                                icon = item.icon;
                            }

                            var invItem = {
                                id: item.id,
                                name: item.name,
                                icon: icon,
                                category: item.category,
                                effect: item.effect,
                                equipable: equipable,
                                type: type,
                                slot: slot,
                                species: item.species || null,
                                equipped: false,
                                effectType: item.effect ? item.effect.type : null,
                                effectValue: item.effect ? item.effect.value : null,
                                effectAttr: item.effect ? item.effect.attr : null,
                                used: false
                            };

                            if (item.category === 'pet' && !player.equipment.mascota) {
                                player.equipment.mascota = invItem;
                                invItem.equipped = true;
                                player.petHealth = player.petMaxHealth;
                                updatePet();
                                showToast('🐾 ¡Mascota "' + item.name + '" equipada automáticamente!', 'success', 'Mascota');
                            } else if (item.category === 'pet' && player.equipment.mascota) {
                                showToast('🐾 ¡Mascota "' + item.name + '" agregada al inventario!', 'info', 'Mascota');
                            }

                            if (item.category === 'real') {
                                showToast('🎁 ¡Recompensa Real "' + item.name + '" agregada al inventario como registro!', 'success', 'Recompensa');
                            } else if (item.category === 'consumable') {
                                showToast('🧪 ¡' + item.name + ' agregado al inventario!', 'info', 'Consumible');
                            } else if (item.category === 'arma') {
                                showToast('⚔️ ¡Arma "' + item.name + '" agregada al inventario!', 'info', 'Arma');
                            } else if (item.category === 'armadura') {
                                showToast('🛡️ ¡Armadura "' + item.name + '" agregada al inventario!', 'info', 'Armadura');
                            } else if (item.category === 'reliquia') {
                                showToast('💫 ¡Reliquia "' + item.name + '" agregada al inventario!', 'info', 'Reliquia');
                            }

                            player.inventory.push(invItem);
                            saveGame();
                            renderInventory();
                        }

                        function applyItemEffect(item) {
                            if (!item || !item.effect) return;

                            var effect = item.effect;

                            switch (effect.type) {
                                case 'exp_boost':
                                    player.expBoost = (player.expBoost || 0) + effect.value;
                                    break;
                                case 'gold_boost':
                                    player.goldBoost = (player.goldBoost || 0) + effect.value;
                                    break;
                                case 'rune_bonus':
                                    player.runeBonus = (player.runeBonus || 0) + effect.value;
                                    break;
                                case 'hp_boost':
                                    player.maxHp = player.maxHp + effect.value;
                                    player.hp = player.hp + effect.value;
                                    break;
                                case 'weapon':
                                    player.attributes.fuerza = (player.attributes.fuerza || 1) + effect.value;
                                    break;
                                case 'armor':
                                    player.attributes.disciplina = (player.attributes.disciplina || 1) + effect.value;
                                    break;
                                case 'mission_exp_pct':
                                    player.missionExpPct = (player.missionExpPct || 0) + effect.value;
                                    break;
                                case 'boss_exp_pct':
                                    player.bossExpPct = (player.bossExpPct || 0) + effect.value;
                                    break;
                                case 'mission_gold_pct':
                                    player.missionGoldPct = (player.missionGoldPct || 0) + effect.value;
                                    break;
                                case 'rune_exp_pct':
                                    player.runeExpPct = (player.runeExpPct || 0) + effect.value;
                                    break;
                                case 'second_chance':
                                    break;
                                case 'heal':
                                    player.hp = Math.min(player.maxHp, player.hp + effect.value);
                                    break;
                                case 'attr_point':
                                    break;
                                case 'revive_pet':
                                    break;
                                case 'real_reward':
                                    break;
                                case 'pet_item':
                                    if (item.species && PET_PERSONALITIES[item.species] && PET_PERSONALITIES[item.species].buff) {
                                        applyPetBuff(PET_PERSONALITIES[item.species].buff);
                                    }
                                    break;
                                default:
                                    break;
                            }

                            updateHUD();
                            saveGame();
                        }

                        function applyPetBuff(buff) {
                            if (!buff) return;

                            switch (buff.type) {
                                case 'exp_boost':
                                    player.expBoost = (player.expBoost || 0) + buff.value;
                                    break;
                                case 'gold_boost':
                                    player.goldBoost = (player.goldBoost || 0) + buff.value;
                                    break;
                                case 'rune_bonus':
                                    player.runeBonus = (player.runeBonus || 0) + buff.value;
                                    break;
                                case 'hp_boost':
                                    player.maxHp = player.maxHp + buff.value;
                                    player.hp = player.hp + buff.value;
                                    break;
                                case 'attr_boost':
                                    if (player.attributes[buff.attr] !== undefined) {
                                        player.attributes[buff.attr] += buff.value;
                                    }
                                    break;
                                case 'phoenix_revive':
                                    break;
                                default:
                                    break;
                            }
                        }

                        function removePetBuff(buff) {
                            if (!buff) return;

                            switch (buff.type) {
                                case 'exp_boost':
                                    player.expBoost = Math.max(0, (player.expBoost || 0) - buff.value);
                                    break;
                                case 'gold_boost':
                                    player.goldBoost = Math.max(0, (player.goldBoost || 0) - buff.value);
                                    break;
                                case 'rune_bonus':
                                    player.runeBonus = Math.max(0, (player.runeBonus || 0) - buff.value);
                                    break;
                                case 'hp_boost':
                                    player.maxHp = Math.max(100, player.maxHp - buff.value);
                                    if (player.hp > player.maxHp) player.hp = player.maxHp;
                                    break;
                                case 'attr_boost':
                                    if (player.attributes[buff.attr] !== undefined) {
                                        player.attributes[buff.attr] = Math.max(1, player.attributes[buff.attr] - buff.value);
                                    }
                                    break;
                                case 'phoenix_revive':
                                    break;
                                default:
                                    break;
                            }
                        }

                        // ============================================================
