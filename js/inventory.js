// ===== FUNCIONES DE INVENTARIO =====
// ============================================================

function renderInventory() {
    var container = document.getElementById('inventory-grid');
    if (!container) return;

    updateEquipmentSlots();

    var items = player.inventory || [];

    if (items.length === 0) {
        container.innerHTML = '<div class="inventory-empty">No tienes objetos en tu inventario.</div>';
        return;
    }

    // ============================================================
    // AGRUPAR OBJETOS POR ID
    // ============================================================
    var groupedItems = {};
    items.forEach(function (item, originalIndex) {
        // Generar un ID único para el objeto (basado en nombre + efectos)
        var itemId = item.id;
        if (!itemId) {
            // Si no tiene ID, generarlo a partir de sus propiedades
            itemId = item.name + '_' + (item.category || '') + '_' + (item.effect ? item.effect.type + '_' + (item.effect.value || 0) : '');
            item.id = itemId;
        }
        
        if (!groupedItems[itemId]) {
            // Crear una copia del objeto con cantidad
            groupedItems[itemId] = {
                item: JSON.parse(JSON.stringify(item)),
                count: 0,
                indices: [] // Guardar índices originales para poder eliminar
            };
        }
        groupedItems[itemId].count++;
        groupedItems[itemId].indices.push(originalIndex);
    });

    var groupedArray = Object.values(groupedItems);

    var html = '';
    groupedArray.forEach(function (group) {
        var item = group.item;
        var count = group.count;
        var indices = group.indices;

        // Verificar si el objeto está equipado (en alguno de los slots)
        var isEquipped = false;
        if (player.equipment) {
            Object.keys(player.equipment).forEach(function (slot) {
                if (player.equipment[slot] && player.equipment[slot].id === item.id) {
                    isEquipped = true;
                }
            });
        }

        // Determinar si es consumible
        var isConsumable = item.category === 'consumable' && item.effect &&
            (item.effect.type === 'heal' ||
             item.effect.type === 'heal_full' ||
             item.effect.type === 'attr_point' ||
             item.effect.type === 'revive_pet' ||
             item.effect.type === 'pet_heal' ||
             item.effect.type === 'restore_attention');

        var isReal = item.category === 'real';
        var isPet = item.category === 'pet';

        var icon = renderIconHTML(item.icon, '📦');
        var name = item.name || 'Objeto';
        var type = item.type || 'otro';

        // Categoría en texto legible
        var categoryMap = {
            'arma': '⚔️ Arma',
            'armadura': '🛡️ Armadura',
            'reliquia': '💫 Reliquia',
            'mascota': '🐾 Mascota',
            'pet': '🐾 Mascota',
            'consumable': '🧪 Consumible',
            'real': '🎁 Recompensa'
        };
        var categoryText = categoryMap[item.category] || '📦 Objeto';

        // Efecto descriptivo
        var extraInfo = '';
        if (item.category === 'real' && item.effect) {
            extraInfo = '<div style="font-size:0.6rem; color:var(--gold);">🎁 ' + (item.effect.value || 'Recompensa real') + '</div>';
        } else if (item.category === 'consumable' && item.effect) {
            var effectDesc = '';
            if (item.effect.type === 'heal') effectDesc = '❤️ +' + item.effect.value + ' HP';
            else if (item.effect.type === 'heal_full') effectDesc = '💖 HP al máximo';
            else if (item.effect.type === 'attr_point') effectDesc = '⭐ +1 Atributo';
            else if (item.effect.type === 'revive_pet') effectDesc = '🪶 Revive mascota';
            else if (item.effect.type === 'pet_heal') effectDesc = '🍖 +' + item.effect.value + ' HP mascota';
            else if (item.effect.type === 'restore_attention') effectDesc = '🔋 Recarga Batería Social';
            extraInfo = '<div style="font-size:0.6rem; color:var(--text-muted); opacity:0.5;">' + effectDesc + '</div>';
        } else if (item.category === 'arma' && item.effect) {
            extraInfo = '<div style="font-size:0.6rem; color:var(--text-muted); opacity:0.5;">💪 +' + item.effect.value + ' Fuerza</div>';
        } else if (item.category === 'armadura' && item.effect) {
            extraInfo = '<div style="font-size:0.6rem; color:var(--text-muted); opacity:0.5;">🛡️ +' + item.effect.value + ' Disciplina</div>';
        } else if (item.category === 'reliquia' && item.effect) {
            var effectDesc = '';
            if (item.effect.type === 'mission_exp_pct') effectDesc = '⭐ +' + item.effect.value + '% EXP en misiones';
            else if (item.effect.type === 'boss_exp_pct') effectDesc = '👹 +' + item.effect.value + '% EXP en bosses';
            else if (item.effect.type === 'mission_gold_pct') effectDesc = '🟡 +' + item.effect.value + '% ORO en misiones';
            else if (item.effect.type === 'rune_exp_pct') effectDesc = '💠 +' + item.effect.value + '% EXP en runas';
            else if (item.effect.type === 'hp_boost') effectDesc = '❤️ +' + item.effect.value + ' HP máximo';
            else if (item.effect.type === 'second_chance') effectDesc = '🕊️ Sobrevive un Game Over';
            else if (item.effect.type === 'exp_boost') effectDesc = '⭐ +' + item.effect.value + ' EXP';
            else if (item.effect.type === 'gold_boost') effectDesc = '🟡 +' + item.effect.value + ' ORO';
            else if (item.effect.type === 'rune_bonus') effectDesc = '💠 +' + item.effect.value + ' runa EXP';
            extraInfo = '<div style="font-size:0.6rem; color:var(--text-muted); opacity:0.5;">' + effectDesc + '</div>';
        } else if (isPet && item.species && window.PET_PERSONALITIES && PET_PERSONALITIES[item.species]) {
            extraInfo = '<div style="font-size:0.6rem; color:var(--text-muted); opacity:0.5;">🐾 ' + PET_PERSONALITIES[item.species].trait + '</div>';
        }

        // Salud de la mascota (si está equipada)
        var healthInfo = '';
        if (isPet && isEquipped) {
            var healthPercent = Math.round((player.petHealth / player.petMaxHealth) * 100);
            var healthColor = healthPercent < 30 ? 'var(--danger)' : healthPercent < 60 ? 'var(--warning)' : 'var(--success)';
            healthInfo = '<div style="font-size:0.6rem; color:' + healthColor + ';">❤️ ' + healthPercent + '% HP</div>';
        }

        // Acciones
        var actions = '';

        if (isConsumable) {
            if (item.effect.type === 'attr_point') {
                var attrOptions = '';
                Object.keys(player.attributes).forEach(function (attrKey) {
                    var attrName = attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
                    attrOptions += '<option value="' + attrKey + '">' + attrName + '</option>';
                });
                // Usamos el primer índice para el select
                var firstIndex = indices[0];
                actions = '<select id="attr-choice-' + firstIndex + '" class="attr-point-select">' + attrOptions + '</select>' +
                    '<button class="inv-use-btn" onclick="useConsumableGroup(\'' + item.id + '\')">⭐ Usar</button>';
            } else {
                var label = '💊 Usar';
                if (item.effect.type === 'revive_pet') {
                    label = '🪶 Revivir Mascota';
                } else if (item.effect.type === 'heal') {
                    label = '❤️ Usar';
                } else if (item.effect.type === 'heal_full') {
                    label = '💖 Usar';
                } else if (item.effect.type === 'pet_heal') {
                    label = '🍖 Usar';
                } else if (item.effect.type === 'restore_attention') {
                    label = '🔋 Usar';
                }
                actions = '<button class="inv-use-btn" onclick="useConsumableGroup(\'' + item.id + '\')">' + label + '</button>';
            }
        } else if (isPet && item.dead) {
            actions = '<div style="font-size:0.65rem; color:var(--danger, #ef4444);">💀 Falleció — usá una Pluma de Fénix</div>';
        } else if (item.equipable && !isReal) {
            actions = '<button class="inv-use-btn" onclick="equipItemGroup(\'' + item.id + '\')" ' + (isEquipped ? 'disabled' : '') + '>' +
                (isEquipped ? '✅ Equipado' : '⚔️ Equipar') +
                '</button>';
        } else if (isReal) {
            actions = '<div style="font-size:0.6rem; color:var(--gold); opacity:0.5;">🎁 Recompensa</div>';
        }

        // Mostrar cantidad si hay más de 1
        var countBadge = count > 1 ? '<span class="item-count">x' + count + '</span>' : '';

        html += `
            <div class="inv-item">
                <span class="inv-icon">${icon}</span>
                <div class="inv-name">${name} ${isEquipped ? '✅' : ''} ${countBadge}</div>
                <div class="inv-type">${categoryText}</div>
                ${healthInfo}
                ${extraInfo}
                ${actions}
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================================
// ===== USAR CONSUMIBLE AGRUPADO =====
// ============================================================

function useConsumableGroup(itemId) {
    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }

    // Encontrar el primer objeto con ese ID
    var index = player.inventory.findIndex(function (i) { return i.id === itemId; });
    if (index === -1) {
        showToast('No se encontró el objeto.', 'error', 'Error');
        return;
    }

    var item = player.inventory[index];
    if (!item.effect || item.category !== 'consumable') {
        showToast('Este objeto no es un consumible.', 'warning', 'Inventario');
        return;
    }

    var effect = item.effect;
    var used = false;

    switch (effect.type) {
        case 'heal':
            var healAmount = effect.value || 50;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            addLogEntry('inventory', '❤️ Usaste ' + item.name, '+' + healAmount + ' HP', 0, 0, null);
            showToast('❤️ +' + healAmount + ' HP restaurados.', 'success', 'Consumible');
            used = true;
            break;
        case 'heal_full':
            var healedAmount = player.maxHp - player.hp;
            player.hp = player.maxHp;
            addLogEntry('inventory', '💖 Usaste ' + item.name, 'HP restaurado al máximo', 0, 0, null);
            showToast('💖 HP restaurado por completo (+' + healedAmount + ' HP).', 'success', 'Consumible');
            used = true;
            break;
        case 'attr_point':
            var attrSelect = document.getElementById('attr-choice-' + index);
            var chosenAttr = attrSelect ? attrSelect.value : null;
            if (!chosenAttr || player.attributes[chosenAttr] === undefined) {
                showToast('Elegí un atributo antes de usar esto.', 'warning', 'Consumible');
                return;
            }
            player.attributes[chosenAttr]++;
            addLogEntry('inventory', '⭐ Usaste ' + item.name, '+1 ' + (attrNames[chosenAttr] || chosenAttr), 0, 0, null);
            showToast('⭐ +1 en ' + (attrNames[chosenAttr] || chosenAttr) + '.', 'success', 'Consumible');
            used = true;
            break;
        case 'pet_heal':
            if (!player.equipment.mascota) {
                showToast('No tenés una mascota equipada.', 'warning', 'Mascota');
                return;
            }
            var petHealAmount = effect.value || 30;
            player.petHealth = Math.min(player.petMaxHealth, player.petHealth + petHealAmount);
            addLogEntry('inventory', '🍖 Usaste ' + item.name, '+' + petHealAmount + ' HP mascota', 0, 0, null);
            showToast('🍖 Tu mascota recuperó +' + petHealAmount + ' HP.', 'success', 'Mascota');
            used = true;
            updatePet();
            break;
        case 'restore_attention':
            if (typeof checkDailyAttentionReset === 'function') {
                checkDailyAttentionReset();
            }
            player.dailyAttentionUsed = 0;
            addLogEntry('inventory', '🔋 Usaste ' + item.name, 'Batería Social recargada', 0, 0, null);
            showToast('🔋 Tu Batería Social se recargó por completo.', 'success', 'Consumible');
            used = true;
            break;
        case 'revive_pet':
            if (player.equipment.mascota) {
                showToast('Tu mascota ya está viva.', 'info', 'Mascota');
                return;
            }
            var petItem = player.inventory.find(function (i) { return i.category === 'pet' && i.dead; });
            if (!petItem) {
                showToast('No tenés una mascota en tu inventario para revivir.', 'error', 'Mascota');
                return;
            }
            petItem.dead = false;
            petItem.phoenixUsed = false;
            player.equipment.mascota = petItem;
            petItem.equipped = true;
            player.petHealth = player.petMaxHealth;
            if (petItem.species && window.PET_PERSONALITIES && PET_PERSONALITIES[petItem.species] && PET_PERSONALITIES[petItem.species].buff) {
                if (typeof applyPetBuff === 'function') {
                    applyPetBuff(PET_PERSONALITIES[petItem.species].buff);
                }
            }
            addLogEntry('inventory', '🪶 ¡Mascota revivida!', petItem.name + ' ha vuelto a la vida', 0, 0, null);
            showToast('🪶 ¡' + petItem.name + ' ha sido revivida con ' + player.petHealth + ' HP!', 'success', 'Mascota');
            used = true;
            updatePet();
            renderInventory();
            break;
        default:
            showToast('Este consumible no tiene un efecto aplicable.', 'warning', 'Consumible');
            return;
    }

    if (used) {
        // Eliminar SOLO UNO del grupo
        var removeIndex = player.inventory.findIndex(function (i) { return i.id === itemId; });
        if (removeIndex !== -1) {
            player.inventory.splice(removeIndex, 1);
        }
        saveGame();
        renderInventory();
        updateHUD();
        if (typeof checkAndUnlockTrophies === 'function') {
            checkAndUnlockTrophies();
        }
    }
}

// ============================================================
// ===== EQUIPAR ITEM AGRUPADO =====
// ============================================================

function equipItemGroup(itemId) {
    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }

    // Encontrar el primer objeto con ese ID
    var index = player.inventory.findIndex(function (i) { return i.id === itemId; });
    if (index === -1) {
        showToast('No se encontró el objeto.', 'error', 'Error');
        return;
    }

    var item = player.inventory[index];
    if (!item.equipable) {
        showToast('Este objeto no se puede equipar.', 'warning', 'Inventario');
        return;
    }

    if (item.category === 'pet' && item.dead) {
        showToast('Esta mascota falleció. Usá una Pluma de Fénix para revivirla.', 'warning', 'Inventario');
        return;
    }

    var slot = null;
    if (item.category === 'arma') {
        slot = 'arma';
    } else if (item.category === 'armadura') {
        slot = 'armadura';
    } else if (item.category === 'reliquia') {
        slot = 'reliquia';
    } else if (item.category === 'pet' || item.category === 'mascota') {
        slot = 'mascota';
    } else {
        slot = item.slot || 'reliquia';
    }

    if (!player.equipment.hasOwnProperty(slot)) {
        showToast('Slot "' + slot + '" no válido.', 'error', 'Inventario');
        return;
    }

    // Si hay algo equipado, desequiparlo
    if (player.equipment[slot]) {
        var oldItem = player.equipment[slot];
        if (typeof removeItemEffect === 'function') {
            removeItemEffect(oldItem);
        }
        oldItem.equipped = false;
        // Buscar el item en el inventario y marcarlo como no equipado
        var oldInvItem = player.inventory.find(function (i) { return i.id === oldItem.id; });
        if (oldInvItem) oldInvItem.equipped = false;
    }

    player.equipment[slot] = item;
    item.equipped = true;
    item.slot = slot;

    if (typeof applyItemEffect === 'function') {
        applyItemEffect(item);
    }

    if (slot === 'mascota') {
        player.petHealth = player.petMaxHealth;
        if (typeof updatePet === 'function') {
            updatePet();
        }
        setTimeout(function () {
            if (typeof checkAndUnlockTrophies === 'function') {
                checkAndUnlockTrophies();
            }
        }, 300);
    }

    saveGame();
    renderInventory();
    if (typeof addLogEntry === 'function') {
        addLogEntry('inventory', '🎒 Equipado: ' + item.name, 'Slot: ' + slot, 0, 0, null);
    }

    var effectMsg = '';
    if (item.effect) {
        if (item.effect.type === 'exp_boost') effectMsg = ' +' + item.effect.value + ' EXP por misión';
        else if (item.effect.type === 'gold_boost') effectMsg = ' +' + item.effect.value + ' ORO por misión';
        else if (item.effect.type === 'rune_bonus') effectMsg = ' +' + item.effect.value + ' EXP por runa';
        else if (item.effect.type === 'hp_boost') effectMsg = ' +' + item.effect.value + ' HP máximo';
        else if (item.effect.type === 'weapon') effectMsg = ' +' + item.effect.value + ' Fuerza';
        else if (item.effect.type === 'armor') effectMsg = ' +' + item.effect.value + ' Disciplina';
        else if (item.effect.type === 'mission_exp_pct') effectMsg = ' +' + item.effect.value + '% EXP en misiones';
        else if (item.effect.type === 'boss_exp_pct') effectMsg = ' +' + item.effect.value + '% EXP en bosses';
        else if (item.effect.type === 'mission_gold_pct') effectMsg = ' +' + item.effect.value + '% ORO en misiones';
        else if (item.effect.type === 'rune_exp_pct') effectMsg = ' +' + item.effect.value + '% EXP en runas';
        else if (item.effect.type === 'second_chance') effectMsg = ' sobrevivís un Game Over con 1 HP (uso único)';
        else if (item.effect.type === 'pet_item' && item.species && window.PET_PERSONALITIES && PET_PERSONALITIES[item.species]) {
            effectMsg = ' ' + PET_PERSONALITIES[item.species].trait;
        }
    }
    showToast('✅ ¡' + item.name + ' equipado en ' + slot + '!' + (effectMsg ? '\nEfecto: ' + effectMsg : ''), 'success', 'Inventario');
}

// ============================================================
// ===== FUNCIONES ORIGINALES (sin cambios) =====
// ============================================================

function updateEquipmentSlots() {
    var slots = ['arma', 'armadura', 'reliquia', 'mascota'];
    slots.forEach(function (slot) {
        var contentEl = document.getElementById('slot-' + slot + '-content');
        if (!contentEl) return;

        var item = player.equipment[slot];
        if (item) {
            var icon = item.icon || '📦';
            var name = item.name || 'Objeto';
            contentEl.innerHTML = '<span class="slot-icon">' + renderIconHTML(icon, '📦') + '</span><span>' + name + '</span>';
        } else {
            contentEl.innerHTML = '<span class="slot-empty">Vacío</span>';
        }
    });
}

function unequipItem(slot) {
    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }

    if (!player.equipment[slot]) {
        showToast('No hay nada equipado en ese slot.', 'info', 'Inventario');
        return;
    }

    var item = player.equipment[slot];

    if (slot === 'mascota' && player.petHealth <= 0) {
        showToast('Tu mascota ha muerto. Necesitas una "Pluma de Fénix" para revivirla.', 'error', 'Mascota');
        return;
    }

    if (typeof removeItemEffect === 'function') {
        removeItemEffect(item);
    }

    item.equipped = false;
    player.equipment[slot] = null;

    if (slot === 'mascota') {
        player.petHealth = player.petMaxHealth;
        if (typeof updatePet === 'function') {
            updatePet();
        }
    }

    saveGame();
    renderInventory();
    if (typeof addLogEntry === 'function') {
        addLogEntry('inventory', '🎒 Desequipado: ' + item.name, 'Slot: ' + slot, 0, 0, null);
    }
    showToast('↩️ ' + item.name + ' desequipado.', 'info', 'Inventario');
}

function removeItemEffect(item) {
    if (!item || !item.effect) return;

    var effect = item.effect;

    switch (effect.type) {
        case 'exp_boost':
            player.expBoost = Math.max(0, (player.expBoost || 0) - effect.value);
            break;
        case 'gold_boost':
            player.goldBoost = Math.max(0, (player.goldBoost || 0) - effect.value);
            break;
        case 'rune_bonus':
            player.runeBonus = Math.max(0, (player.runeBonus || 0) - effect.value);
            break;
        case 'hp_boost':
            player.maxHp = Math.max(100, player.maxHp - effect.value);
            if (player.hp > player.maxHp) player.hp = player.maxHp;
            break;
        case 'weapon':
            player.attributes.fuerza = Math.max(1, (player.attributes.fuerza || 1) - effect.value);
            break;
        case 'armor':
            player.attributes.disciplina = Math.max(1, (player.attributes.disciplina || 1) - effect.value);
            break;
        case 'mission_exp_pct':
            player.missionExpPct = Math.max(0, (player.missionExpPct || 0) - effect.value);
            break;
        case 'boss_exp_pct':
            player.bossExpPct = Math.max(0, (player.bossExpPct || 0) - effect.value);
            break;
        case 'mission_gold_pct':
            player.missionGoldPct = Math.max(0, (player.missionGoldPct || 0) - effect.value);
            break;
        case 'rune_exp_pct':
            player.runeExpPct = Math.max(0, (player.runeExpPct || 0) - effect.value);
            break;
        case 'second_chance':
            break;
        case 'pet_item':
            if (item.species && window.PET_PERSONALITIES && PET_PERSONALITIES[item.species] && PET_PERSONALITIES[item.species].buff) {
                if (typeof removePetBuff === 'function') {
                    removePetBuff(PET_PERSONALITIES[item.species].buff);
                }
            }
            break;
        default:
            break;
    }

    if (typeof updateHUD === 'function') {
        updateHUD();
    }
    saveGame();
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
            player.maxHp = (player.maxHp || 100) + effect.value;
            player.hp = Math.min(player.hp, player.maxHp);
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
        case 'pet_item':
            if (item.species && window.PET_PERSONALITIES && PET_PERSONALITIES[item.species] && PET_PERSONALITIES[item.species].buff) {
                if (typeof applyPetBuff === 'function') {
                    applyPetBuff(PET_PERSONALITIES[item.species].buff);
                }
            }
            break;
        default:
            break;
    }

    if (typeof updateHUD === 'function') {
        updateHUD();
    }
    saveGame();
}