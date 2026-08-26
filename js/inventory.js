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

                                var html = '';
                                items.forEach(function (item, index) {
                                    var isEquipped = item.equipped || false;
                                    var icon = item.icon || '📦';
                                    var name = item.name || 'Objeto';
                                    var type = item.type || 'otro';

                                    var isConsumable = item.category === 'consumable' && item.effect &&
                                        (item.effect.type === 'heal' ||
                                            item.effect.type === 'attr_point' ||
                                            item.effect.type === 'revive_pet');

                                    var isReal = item.category === 'real';

                                    var actions = '';
                                    if (isConsumable) {
                                        var label = '💊 Usar';
                                        if (item.effect.type === 'revive_pet') {
                                            label = '💫 Revivir Mascota';
                                        } else if (item.effect.type === 'attr_point') {
                                            label = '⭐ Usar';
                                        } else if (item.effect.type === 'heal') {
                                            label = '❤️ Usar';
                                        }
                                        actions = '<button class="inv-use-btn" onclick="useConsumable(' + index + ')">' + label + '</button>';
                                    } else if (item.equipable && !isReal) {
                                        actions = '<button class="inv-use-btn" onclick="equipItem(' + index + ')" ' + (isEquipped ? 'disabled' : '') + '>' +
                                            (isEquipped ? '✅ Equipado' : '⚔️ Equipar') +
                                            '</button>';
                                    } else if (isReal) {
                                        actions = '<div style="font-size:0.6rem; color:var(--gold); opacity:0.5;">🎁 Recompensa</div>';
                                    }

                                    var extraInfo = '';
                                    if (item.category === 'real' && item.effect) {
                                        extraInfo = '<div style="font-size:0.6rem; color:var(--gold);">🎁 ' + (item.effect.value || 'Recompensa real') + '</div>';
                                    } else if (item.category === 'consumable' && item.effect) {
                                        var effectDesc = '';
                                        if (item.effect.type === 'heal') effectDesc = '❤️ +' + item.effect.value + ' HP';
                                        else if (item.effect.type === 'attr_point') effectDesc = '⭐ +1 Atributo';
                                        else if (item.effect.type === 'revive_pet') effectDesc = '💫 Revive mascota';
                                        extraInfo = '<div style="font-size:0.6rem; color:var(--text-muted); opacity:0.5;">' + effectDesc + '</div>';
                                    } else if (item.category === 'reliquia' && item.effect) {
                                        var effectDesc = '';
                                        if (item.effect.type === 'weapon') effectDesc = '⚔️ +' + item.effect.value + ' daño';
                                        else if (item.effect.type === 'armor') effectDesc = '🛡️ +' + item.effect.value + ' defensa';
                                        else if (item.effect.type === 'exp_boost') effectDesc = '⭐ +' + item.effect.value + ' EXP';
                                        else if (item.effect.type === 'gold_boost') effectDesc = '🟡 +' + item.effect.value + ' ORO';
                                        else if (item.effect.type === 'rune_bonus') effectDesc = '💠 +' + item.effect.value + ' runa EXP';
                                        else if (item.effect.type === 'hp_boost') effectDesc = '❤️ +' + item.effect.value + ' HP máximo';
                                        extraInfo = '<div style="font-size:0.6rem; color:var(--text-muted); opacity:0.5;">' + effectDesc + '</div>';
                                    }

                                    var healthInfo = '';
                                    if (item.category === 'pet' && isEquipped) {
                                        var healthPercent = Math.round((player.petHealth / player.petMaxHealth) * 100);
                                        healthInfo = '<div style="font-size:0.6rem; color:' + (healthPercent < 30 ? 'var(--danger)' : 'var(--success)') + ';">❤️ ' + healthPercent + '% HP</div>';
                                    }

                                    html += `
                    <div class="inv-item">
                        <span class="inv-icon">${icon}</span>
                        <div class="inv-name">${name} ${isEquipped ? '✅' : ''}</div>
                        <div class="inv-type">${type}</div>
                        ${healthInfo}
                        ${extraInfo}
                        ${actions}
                    </div>
                `;
                                });

                                container.innerHTML = html;
                            }

                            function updateEquipmentSlots() {
                                var slots = ['arma', 'armadura', 'reliquia', 'mascota'];
                                slots.forEach(function (slot) {
                                    var contentEl = document.getElementById('slot-' + slot + '-content');
                                    if (!contentEl) return;

                                    var item = player.equipment[slot];
                                    if (item) {
                                        var icon = item.icon || '📦';
                                        var name = item.name || 'Objeto';
                                        contentEl.innerHTML = '<span class="slot-icon">' + icon + '</span><span>' + name + '</span>';
                                    } else {
                                        contentEl.innerHTML = '<span class="slot-empty">Vacío</span>';
                                    }
                                });
                            }

                            function equipItem(index) {
                                if (player.gameOver) {
                                    showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                    return;
                                }

                                var items = player.inventory || [];
                                if (index < 0 || index >= items.length) return;

                                var item = items[index];
                                if (!item.equipable) {
                                    showToast('Este objeto no se puede equipar.', 'warning', 'Inventario');
                                    return;
                                }

                                var slot = null;
                                if (item.category === 'arma') {
                                    slot = 'arma';
                                } else if (item.category === 'armadura') {
                                    slot = 'armadura';
                                } else if (item.category === 'reliquia') {
                                    slot = 'reliquia';
                                } else if (item.category === 'pet') {
                                    slot = 'mascota';
                                } else {
                                    slot = item.slot || 'reliquia';
                                }

                                if (!player.equipment.hasOwnProperty(slot)) {
                                    showToast('Slot "' + slot + '" no válido.', 'error', 'Inventario');
                                    return;
                                }

                                if (player.equipment[slot]) {
                                    var oldItem = player.equipment[slot];
                                    removeItemEffect(oldItem);
                                    oldItem.equipped = false;
                                    var oldInvItem = player.inventory.find(function (i) { return i.id === oldItem.id; });
                                    if (oldInvItem) oldInvItem.equipped = false;
                                }

                                player.equipment[slot] = item;
                                item.equipped = true;
                                item.slot = slot;

                                applyItemEffect(item);

                                if (slot === 'mascota') {
                                    player.petHealth = player.petMaxHealth;
                                    updatePet();
                                    setTimeout(checkAndUnlockTrophies, 300);
                                }

                                saveGame();
                                renderInventory();
                                addLogEntry('inventory', '🎒 Equipado: ' + item.name, 'Slot: ' + slot, 0, 0, null);

                                var effectMsg = '';
                                if (item.effect) {
                                    if (item.effect.type === 'exp_boost') effectMsg = ' +' + item.effect.value + ' EXP por misión';
                                    else if (item.effect.type === 'gold_boost') effectMsg = ' +' + item.effect.value + ' ORO por misión';
                                    else if (item.effect.type === 'rune_bonus') effectMsg = ' +' + item.effect.value + ' EXP por runa';
                                    else if (item.effect.type === 'hp_boost') effectMsg = ' +' + item.effect.value + ' HP máximo';
                                    else if (item.effect.type === 'weapon') effectMsg = ' +' + item.effect.value + ' de daño';
                                    else if (item.effect.type === 'armor') effectMsg = ' +' + item.effect.value + ' de defensa';
                                }
                                showToast('✅ ¡' + item.name + ' equipado en ' + slot + '!' + (effectMsg ? '\nEfecto: ' + effectMsg : ''), 'success', 'Inventario');
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
                                    showToast('Tu mascota ha muerto. Necesitas un "Polvo de Estrellas" para revivirla.', 'error', 'Mascota');
                                    return;
                                }

                                removeItemEffect(item);

                                item.equipped = false;
                                player.equipment[slot] = null;

                                if (slot === 'mascota') {
                                    player.petHealth = player.petMaxHealth;
                                    updatePet();
                                }

                                saveGame();
                                renderInventory();
                                addLogEntry('inventory', '🎒 Desequipado: ' + item.name, 'Slot: ' + slot, 0, 0, null);
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
                                        break;
                                    case 'armor':
                                        break;
                                    default:
                                        break;
                                }

                                updateHUD();
                                saveGame();
                            }

                            function useConsumable(index) {
                                if (player.gameOver) {
                                    showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                    return;
                                }

                                var items = player.inventory || [];
                                if (index < 0 || index >= items.length) return;

                                var item = items[index];
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
                                    case 'revive_pet':
                                        if (player.equipment.mascota) {
                                            showToast('Tu mascota ya está viva.', 'info', 'Mascota');
                                            return;
                                        }
                                        var petItem = player.inventory.find(function (i) { return i.category === 'pet'; });
                                        if (!petItem) {
                                            showToast('No tienes una mascota en tu inventario para revivir.', 'error', 'Mascota');
                                            return;
                                        }
                                        player.equipment.mascota = petItem;
                                        petItem.equipped = true;
                                        player.petHealth = player.petMaxHealth;
                                        addLogEntry('inventory', '💫 ¡Mascota revivida!', petItem.name + ' ha vuelto a la vida', 0, 0, null);
                                        showToast('💫 ¡' + petItem.name + ' ha sido revivida con ' + player.petHealth + ' HP!', 'success', 'Mascota');
                                        used = true;
                                        updatePet();
                                        renderInventory();
                                        break;
                                    default:
                                        showToast('Este consumible no tiene un efecto aplicable.', 'warning', 'Consumible');
                                        return;
                                }

                                if (used) {
                                    player.inventory.splice(index, 1);
                                    saveGame();
                                    renderInventory();
                                    updateHUD();
                                    checkAndUnlockTrophies();
                                }
                            }

                            // ============================================================
