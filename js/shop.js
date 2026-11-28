// ============================================================
// ===== FUNCIONES DE TIENDA =====
// ============================================================

// ============================================================
// ===== FUNCIONES PRINCIPALES =====
// ============================================================

function getShopItemCount(itemId) {
    if (!player.purchasedItems) player.purchasedItems = [];
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

function filterShop(category) {
    currentShopFilter = category;
    var select = document.getElementById('shop-category-filter');
    if (select) select.value = category;
    shopCurrentPage = 1;
    renderShop();
}

function renderShop() {
    var container = document.getElementById('shop-container');
    var pagination = document.getElementById('shop-pagination');
    if (!container) return;

    document.querySelectorAll('.gold-display').forEach(function(el) {
        el.textContent = player.gold;
    });

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

        // Efecto descriptivo
        var effectDesc = '';
        if (item.effect) {
            switch (item.effect.type) {
                case 'heal': effectDesc = '❤️ +' + item.effect.value + ' HP'; break;
                case 'heal_full': effectDesc = '💖 HP al máximo'; break;
                case 'attr_point': effectDesc = '⭐ +1 Atributo'; break;
                case 'revive_pet': effectDesc = '💗 Revive mascota'; break;
                case 'pet_heal': effectDesc = '🍖 +' + item.effect.value + ' HP mascota'; break;
                case 'restore_attention': effectDesc = '🔋 Recarga Batería Social'; break;
                case 'exp_boost': effectDesc = '⚡ +' + item.effect.value + '% EXP'; break;
                case 'gold_boost': effectDesc = '🟡 +' + item.effect.value + '% ORO'; break;
                case 'rune_bonus': effectDesc = '💠 +' + item.effect.value + ' EXP en runas'; break;
                case 'hp_boost': effectDesc = '❤️ +' + item.effect.value + ' HP máximo'; break;
                case 'weapon': effectDesc = '⚔️ +' + item.effect.value + ' Fuerza'; break;
                case 'armor': effectDesc = '🛡️ +' + item.effect.value + ' Disciplina'; break;
                case 'mission_exp_pct': effectDesc = '⭐ +' + item.effect.value + '% EXP en misiones'; break;
                case 'boss_exp_pct': effectDesc = '👹 +' + item.effect.value + '% EXP en bosses'; break;
                case 'mission_gold_pct': effectDesc = '🟡 +' + item.effect.value + '% ORO en misiones'; break;
                case 'rune_exp_pct': effectDesc = '💠 +' + item.effect.value + '% EXP en runas'; break;
                case 'second_chance': effectDesc = '🕊️ Sobrevive un Game Over'; break;
                case 'real_reward': effectDesc = ''; break;
                case 'pet_item': 
                    // Mostrar el buff de la mascota
                    if (item.species && window.PET_PERSONALITIES && window.PET_PERSONALITIES[item.species] && window.PET_PERSONALITIES[item.species].buff) {
                        var buff = window.PET_PERSONALITIES[item.species].buff;
                        switch (buff.type) {
                            case 'exp_boost': effectDesc = '⭐ +' + buff.value + '% EXP'; break;
                            case 'gold_boost': effectDesc = '🟡 +' + buff.value + '% ORO'; break;
                            case 'rune_bonus': effectDesc = '💠 +' + buff.value + ' EXP en runas'; break;
                            case 'hp_boost': effectDesc = '❤️ +' + buff.value + ' HP máximo'; break;
                            case 'attr_boost': 
                                var attrNamesMap = {
                                    'disciplina': 'Disciplina',
                                    'fuerza': 'Fuerza',
                                    'mente': 'Mente',
                                    'creatividad': 'Creatividad',
                                    'carrera': 'Carrera',
                                    'finanzas': 'Finanzas',
                                    'social': 'Social',
                                    'relaciones': 'Relaciones'
                                };
                                var attrName = attrNamesMap[buff.attr] || buff.attr;
                                effectDesc = '✨ +' + buff.value + ' ' + attrName;
                                break;
                            case 'phoenix_revive': effectDesc = '🔄 Revive automáticamente'; break;
                            default: effectDesc = '🐾 Mascota especial'; break;
                        }
                    } else {
                        effectDesc = '🐾 Mascota especial';
                    }
                    break;
                default: effectDesc = ''; break;
            }
        }

        var effectHTML = effectDesc ? '<div class="shop-item-effect">' + effectDesc + '</div>' : '';

        card.innerHTML = `
            <div class="shop-item-header">
                <span class="shop-item-name">${renderIconHTML(item.icon, '📦')} ${item.name}</span>
                <span class="shop-item-price">🟡 ${item.price}</span>
            </div>                    
            <div class="shop-item-category">${categoryLabel}</div>
            <div class="shop-item-desc">${item.desc}</div>
            ${effectHTML}
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
        if (typeof renderPagination === 'function') {
            renderPagination(pagination, shopCurrentPage, totalPages, function (page) {
                shopCurrentPage = page;
                renderShop();
            });
        }
    }
}

// ============================================================
// ===== COMPRAR ITEM =====
// ============================================================

function purchaseItem(itemId) {
    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }

    var item = SHOP_ITEMS.find(function (i) { return i.id === itemId; });
    if (!item) {
        showToast('Item no encontrado.', 'error', 'Error');
        return;
    }

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
    if (!player.purchasedItems) player.purchasedItems = [];
    player.purchasedItems.push(itemId);
    player.totalSpent = (player.totalSpent || 0) + item.price;

    addToInventory(item);

    saveGame();
    renderShop();
    updateHUD();
    if (typeof checkAndUnlockTrophies === 'function') {
        checkAndUnlockTrophies();
    }
    if (typeof addLogEntry === 'function') {
        addLogEntry('shop', '🛒 Compra: ' + item.name, '-' + item.price + ' ORO', 0, 0, null);
    }
    showToast('🛒 ¡' + item.name + ' comprado!', 'success', 'Tienda');
}

// ============================================================
// ===== AÑADIR AL INVENTARIO =====
// ============================================================

function addToInventory(item) {
    var type = 'otro';
    var equipable = false;
    var slot = null;

    if (item.category === 'arma') {
        type = 'arma';
        equipable = true;
        slot = 'arma';
    } else if (item.category === 'armadura') {
        type = 'armadura';
        equipable = true;
        slot = 'armadura';
    } else if (item.category === 'reliquia') {
        type = 'reliquia';
        equipable = true;
        slot = 'reliquia';
    } else if (item.category === 'pet') {
        type = 'mascota';
        equipable = true;
        slot = 'mascota';
    } else if (item.category === 'consumable') {
        type = 'consumable';
        equipable = false;
        slot = null;
    } else if (item.category === 'real') {
        type = 'recompensa';
        equipable = false;
        slot = null;
    }

    var invItem = {
        id: item.id,
        name: item.name,
        icon: item.icon || '📦',
        category: item.category,
        effect: item.effect ? JSON.parse(JSON.stringify(item.effect)) : null,
        equipable: equipable,
        type: type,
        slot: slot,
        species: item.species || null,
        equipped: false,
        effectType: item.effect ? item.effect.type : null,
        effectValue: item.effect ? item.effect.value : null,
        effectAttr: item.effect ? item.effect.attr : null,
        used: false,
        dead: false
    };

    if (item.category === 'pet' && !player.equipment.mascota) {
        player.equipment.mascota = invItem;
        invItem.equipped = true;
        player.petHealth = player.petMaxHealth;
        if (typeof updatePet === 'function') updatePet();
        // Aplicar buff de la mascota al equiparla automáticamente
        if (item.species && window.PET_PERSONALITIES && window.PET_PERSONALITIES[item.species] && window.PET_PERSONALITIES[item.species].buff) {
            applyPetBuff(window.PET_PERSONALITIES[item.species].buff);
        }
        showToast('🐾 ¡Mascota "' + item.name + '" equipada automáticamente!', 'success', 'Mascota');
    } else if (item.category === 'pet' && player.equipment.mascota) {
        showToast('🐾 ¡Mascota "' + item.name + '" agregada al inventario!', 'info', 'Mascota');
    }

    if (item.category === 'real') {
        showToast('🎁 ¡Recompensa Real "' + item.name + '" agregada al inventario!', 'success', 'Recompensa');
    }

    if (!player.inventory) player.inventory = [];
    player.inventory.push(invItem);

    if (equipable && item.effect && invItem.equipped) {
        applyItemEffect(invItem);
    }

    saveGame();
    if (typeof renderInventory === 'function') renderInventory();
}

// ============================================================
// ===== APLICAR EFECTO DE ITEM =====
// ============================================================

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
            player.maxHp = (player.maxHp || 100) + effect.value;
            player.hp = Math.min(player.hp + effect.value, player.maxHp);
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
            player.hasSecondChance = true;
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
            if (item.species && window.PET_PERSONALITIES && window.PET_PERSONALITIES[item.species] && window.PET_PERSONALITIES[item.species].buff) {
                applyPetBuff(window.PET_PERSONALITIES[item.species].buff);
            }
            break;
        default:
            break;
    }

    if (typeof updateHUD === 'function') updateHUD();
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
            player.maxHp = (player.maxHp || 100) + buff.value;
            player.hp = Math.min(player.hp + buff.value, player.maxHp);
            break;
        case 'attr_boost':
            if (player.attributes[buff.attr] !== undefined) {
                player.attributes[buff.attr] += buff.value;
            }
            break;
        case 'phoenix_revive':
            player.hasPhoenixRevive = true;
            break;
        default:
            break;
    }

    if (typeof updateHUD === 'function') updateHUD();
    saveGame();
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
            player.maxHp = Math.max(100, (player.maxHp || 100) - buff.value);
            if (player.hp > player.maxHp) player.hp = player.maxHp;
            break;
        case 'attr_boost':
            if (player.attributes[buff.attr] !== undefined) {
                player.attributes[buff.attr] = Math.max(1, player.attributes[buff.attr] - buff.value);
            }
            break;
        case 'phoenix_revive':
            player.hasPhoenixRevive = false;
            break;
        default:
            break;
    }

    if (typeof updateHUD === 'function') updateHUD();
    saveGame();
}