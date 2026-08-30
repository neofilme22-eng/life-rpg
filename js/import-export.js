                                // ===== FUNCIONES DE IMPORTACIÓN =====
                                // ============================================================

                                function importDLCConfig(event) {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    var file = event.target.files[0];
                                    if (!file) return;

                                    var fileReader = new FileReader();
                                    fileReader.readAsText(file, "UTF-8");
                                    fileReader.onload = function (e) {
                                        try {
                                            var content = e.target.result.trim();
                                            if (content.charCodeAt(0) === 0xFEFF) {
                                                content = content.substring(1);
                                            }

                                            var dlcData = JSON.parse(content);

                                            if (!dlcData.dlcName || !dlcData.missions || !Array.isArray(dlcData.missions)) {
                                                showToast('Formato de JSON inválido. Asegúrate de que tenga "dlcName" y "missions".', 'error', 'Error');
                                                return;
                                            }

                                            var dlcName = dlcData.dlcName || "DLC Sin Nombre";
                                            var missionsArray = dlcData.missions;
                                            var trophyIcon = dlcData.trophyIcon || "🏆";
                                            var trophyName = dlcData.trophyName || dlcName + " Completado";

                                            var countMain = 0;
                                            var countSec = 0;

                                            missionsArray.forEach(function (m) {
                                                var mId = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                                var type = m.type || 'secondary';
                                                if (type === 'main') countMain++;
                                                else countSec++;

                                                player.rawMissions.push({
                                                    id: mId,
                                                    dlcName: dlcName,
                                                    title: m.title || "Misión de DLC",
                                                    type: type,
                                                    attr: m.attr || "disciplina",
                                                    expReward: m.expReward || 10,
                                                    goldReward: m.goldReward || 5,
                                                    completed: false
                                                });
                                            });

                                            player.dlcs.push({
                                                name: dlcName,
                                                total: missionsArray.length,
                                                main: countMain,
                                                secondary: countSec,
                                                trophyIcon: trophyIcon,
                                                trophyName: trophyName
                                            });

                                            var trophyId = 'dlc_' + dlcName.replace(/\s+/g, '_');
                                            dynamicTrophyDefinitions = dynamicTrophyDefinitions.filter(function (t) { return t.id !== trophyId; });

                                            dynamicTrophyDefinitions.push({
                                                id: trophyId,
                                                icon: trophyIcon,
                                                name: trophyName,
                                                desc: 'Completa todas las misiones del DLC "' + dlcName + '"',
                                                check: function (p) {
                                                    var missions = p.rawMissions.filter(function (m) { return m.dlcName === dlcName; });
                                                    return missions.length > 0 && missions.every(function (m) { return m.completed; });
                                                }
                                            });

                                            refreshMissions();
                                            renderMissions();
                                            saveGame();
                                            renderTrophies();

                                            showToast('🚀 ¡DLC "' + dlcName + '" instalado con éxito! 🏆 Trofeo: ' + trophyIcon + ' ' + trophyName, 'success', 'DLC');

                                            setTimeout(function () {
                                                checkDLCCompletion(dlcName);
                                                checkAndUnlockTrophies();
                                            }, 200);

                                        } catch (error) {
                                            showToast('Error al leer el archivo JSON: ' + error.message, 'error', 'Error');
                                            console.error("Error detallado:", error);
                                        }
                                    };
                                    fileReader.onerror = function () {
                                        showToast('Error al leer el archivo.', 'error', 'Error');
                                    };

                                    event.target.value = '';
                                }

                                function importRunesConfig(event) {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    var fileReader = new FileReader();
                                    if (event.target.files[0]) {
                                        fileReader.readAsText(event.target.files[0], "UTF-8");
                                        fileReader.onload = function (e) {
                                            try {
                                                var content = e.target.result.trim();
                                                if (content.charCodeAt(0) === 0xFEFF) {
                                                    content = content.substring(1);
                                                }

                                                var runeData = JSON.parse(content);
                                                var runeSetName = runeData.runeSetName || "Runas Místicas";
                                                var runesArray = Array.isArray(runeData) ? runeData : runeData.runes;

                                                if (runesArray && Array.isArray(runesArray)) {
                                                    runesArray.forEach(function (r) {
                                                        player.rawRunes.push({
                                                            id: 'rune_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                                            setName: runeSetName,
                                                            title: r.title || "Runa Diaria",
                                                            icon: r.icon || "💠",
                                                            attr: r.attr || "disciplina",
                                                            expReward: r.expReward || 10,
                                                            goldReward: r.goldReward || 5,
                                                            totalExp: 0,
                                                            streak: 0,
                                                            completed: false
                                                        });
                                                    });

                                                    renderRunes();
                                                    saveGame();
                                                    showToast('💠 ¡Paquete de runas "' + runeSetName + '" instalado con éxito!', 'success', 'Runas');
                                                    checkAndUnlockTrophies();
                                                } else {
                                                    showToast('Formato de JSON de runas inválido.', 'error', 'Error');
                                                }
                                            } catch (error) {
                                                showToast('Error al leer el archivo JSON de runas: ' + error.message, 'error', 'Error');
                                            }
                                        };
                                    }
                                    event.target.value = '';
                                }

                                function createRune() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    var titleInput = document.getElementById('rune-create-title');
                                    var attrSelect = document.getElementById('rune-create-attr');
                                    var expInput = document.getElementById('rune-create-exp');
                                    var goldInput = document.getElementById('rune-create-gold');
                                    var iconInput = document.getElementById('rune-create-icon');

                                    var title = titleInput ? titleInput.value.trim() : '';
                                    var attr = attrSelect ? attrSelect.value : 'disciplina';
                                    var expReward = parseInt(expInput ? expInput.value : 10) || 10;
                                    var goldReward = parseInt(goldInput ? goldInput.value : 5) || 5;
                                    var icon = (iconInput ? iconInput.value.trim() : '') || '💠';

                                    if (!title) {
                                        showToast('Ingresa un título para la runa.', 'warning', 'Error');
                                        return;
                                    }

                                    player.rawRunes.push({
                                        id: 'rune_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                        setName: 'Runas Personalizadas',
                                        title: title,
                                        icon: icon,
                                        attr: attr,
                                        expReward: expReward,
                                        goldReward: goldReward,
                                        totalExp: 0,
                                        streak: 0,
                                        completed: false
                                    });

                                    renderRunes();
                                    saveGame();
                                    showToast('💠 ¡Runa "' + title + '" creada con éxito!', 'success', 'Runas');
                                    checkAndUnlockTrophies();

                                    if (titleInput) titleInput.value = '';
                                }

                                function clearAllRunes() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    if (player.rawRunes.length === 0) {
                                        showToast('No hay runas para eliminar.', 'info', 'Runas');
                                        return;
                                    }

                                    showModal(
                                        '💠',
                                        'Eliminar Todas las Runas',
                                        '¿Eliminar TODAS las runas (' + player.rawRunes.length + ')?',
                                        'Eliminar',
                                        function () {
                                            player.rawRunes = [];
                                            renderRunes();
                                            saveGame();
                                            showToast('💠 Todas las runas eliminadas.', 'info', 'Runas');
                                        },
                                        true
                                    );
                                }

                                // ============================================================
                                // ===== FUNCIONES DE IMPORTACIÓN DE BOSSES Y TIENDA =====
                                // ============================================================

                                function importBossesConfig(event) {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    var fileReader = new FileReader();
                                    if (event.target.files[0]) {
                                        fileReader.readAsText(event.target.files[0], "UTF-8");
                                        fileReader.onload = function (e) {
                                            try {
                                                var content = e.target.result.trim();
                                                if (content.charCodeAt(0) === 0xFEFF) {
                                                    content = content.substring(1);
                                                }

                                                var bossData = JSON.parse(content);
                                                var bossesArray = Array.isArray(bossData) ? bossData : bossData.bosses;

                                                if (bossesArray && Array.isArray(bossesArray)) {
                                                    var count = 0;
                                                    bossesArray.forEach(function (b) {
                                                        var bossId = 'boss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                                        player.bosses.push({
                                                            id: bossId,
                                                            name: b.name || "Boss Sin Nombre",
                                                            icon: b.icon || "👹",
                                                            image: b.image || null,
                                                            deadline: b.deadline || null,
                                                            tasks: b.tasks || [],
                                                            taskStatus: (b.tasks || []).map(function () { return false; }),
                                                            defeated: false,
                                                            defeatedDate: null,
                                                            expReward: b.expReward || 50,
                                                            goldReward: b.goldReward || 25,
                                                            attrReward: b.attrReward || null,
                                                            vencido: false
                                                        });
                                                        count++;
                                                    });

                                                    saveGame();
                                                    renderBosses();
                                                    renderBestiary();
                                                    showToast('👹 ¡' + count + ' boss(es) instalado(s) con éxito!', 'success', 'Bosses');
                                                    checkAndUnlockTrophies();
                                                } else {
                                                    showToast('Formato de JSON de bosses inválido.', 'error', 'Error');
                                                }
                                            } catch (error) {
                                                showToast('Error al leer el archivo JSON de bosses: ' + error.message, 'error', 'Error');
                                            }
                                        };
                                    }
                                    event.target.value = '';
                                }

                                function createBoss() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    var nameInput = document.getElementById('boss-create-name');
                                    var iconInput = document.getElementById('boss-create-icon');
                                    var expInput = document.getElementById('boss-create-exp');
                                    var goldInput = document.getElementById('boss-create-gold');
                                    var deadlineInput = document.getElementById('boss-create-deadline');
                                    var tasksInput = document.getElementById('boss-create-tasks');
                                    var imageInput = document.getElementById('boss-create-image');

                                    var name = nameInput ? nameInput.value.trim() : '';
                                    var icon = (iconInput ? iconInput.value.trim() : '') || '👹';
                                    var expReward = parseInt(expInput ? expInput.value : 50) || 50;
                                    var goldReward = parseInt(goldInput ? goldInput.value : 25) || 25;
                                    var deadline = deadlineInput ? deadlineInput.value : null;
                                    var tasksRaw = tasksInput ? tasksInput.value.trim() : '';
                                    var customImage = (imageInput ? imageInput.value.trim() : '') || null;

                                    if (!name) {
                                        showToast('Ingresa un nombre para el boss.', 'warning', 'Error');
                                        return;
                                    }

                                    var tasks = tasksRaw ? tasksRaw.split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t; }) : [];

                                    var bossId = 'boss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                    player.bosses.push({
                                        id: bossId,
                                        name: name,
                                        icon: icon,
                                        image: customImage,
                                        deadline: deadline,
                                        tasks: tasks,
                                        taskStatus: tasks.map(function () { return false; }),
                                        defeated: false,
                                        defeatedDate: null,
                                        expReward: expReward,
                                        goldReward: goldReward,
                                        attrReward: null,
                                        vencido: false
                                    });

                                    saveGame();
                                    renderBosses();
                                    renderBestiary();

                                    if (nameInput) nameInput.value = '';
                                    if (iconInput) iconInput.value = '👹';
                                    if (expInput) expInput.value = '50';
                                    if (goldInput) goldInput.value = '25';
                                    if (deadlineInput) deadlineInput.value = '';
                                    if (tasksInput) tasksInput.value = '';
                                    if (imageInput) imageInput.value = '';

                                    showToast('👹 ¡Boss "' + name + '" invocado con éxito!', 'success', 'Boss');
                                    checkAndUnlockTrophies();
                                }

                                function importShopConfig(event) {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    var fileReader = new FileReader();
                                    if (event.target.files[0]) {
                                        fileReader.readAsText(event.target.files[0], "UTF-8");
                                        fileReader.onload = function (e) {
                                            try {
                                                var content = e.target.result.trim();
                                                if (content.charCodeAt(0) === 0xFEFF) {
                                                    content = content.substring(1);
                                                }

                                                var shopData = JSON.parse(content);
                                                var itemsArray = Array.isArray(shopData) ? shopData : shopData.items;

                                                if (itemsArray && Array.isArray(itemsArray)) {
                                                    var count = 0;
                                                    itemsArray.forEach(function (item) {
                                                        var newItem = {
                                                            id: 'shop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                                            name: item.name || "Item",
                                                            desc: item.desc || "Item de tienda",
                                                            category: item.category || "upgrade",
                                                            price: item.price || 50,
                                                            icon: item.icon || null,
                                                            maxPurchases: item.maxPurchases || 999,
                                                            effect: item.effect || { type: 'exp_boost', value: 5 }
                                                        };
                                                        SHOP_ITEMS.push(newItem);
                                                        count++;
                                                    });
                                                    saveShopItems();
                                                    renderShop();
                                                    showToast('🏪 ¡' + count + ' item(s) instalado(s) en la tienda!', 'success', 'Tienda');
                                                } else {
                                                    showToast('Formato de JSON de tienda inválido.', 'error', 'Error');
                                                }
                                            } catch (error) {
                                                showToast('Error al leer el archivo JSON de tienda: ' + error.message, 'error', 'Error');
                                            }
                                        };
                                    }
                                    event.target.value = '';
                                }

                                function createShopItem() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    var nameInput = document.getElementById('shop-create-name');
                                    var priceInput = document.getElementById('shop-create-price');
                                    var categorySelect = document.getElementById('shop-create-category');
                                    var effectSelect = document.getElementById('shop-create-effect');
                                    var effectValueInput = document.getElementById('shop-create-effect-value');
                                    var descInput = document.getElementById('shop-create-desc');
                                    var iconInput = document.getElementById('shop-create-icon');

                                    var name = nameInput ? nameInput.value.trim() : '';
                                    var price = parseInt(priceInput ? priceInput.value : 50) || 50;
                                    var category = categorySelect ? categorySelect.value : 'upgrade';
                                    var effectType = effectSelect ? effectSelect.value : 'exp_boost';
                                    var effectValue = parseInt(effectValueInput ? effectValueInput.value : 5) || 5;
                                    var desc = (descInput ? descInput.value.trim() : '') || 'Item personalizado.';
                                    var customIcon = (iconInput ? iconInput.value.trim() : '') || '';

                                    if (!name) {
                                        showToast('Ingresa un nombre para el item.', 'warning', 'Error');
                                        return;
                                    }

                                    var effectMap = {
                                        'exp_boost': { type: 'exp_boost', value: effectValue },
                                        'gold_boost': { type: 'gold_boost', value: effectValue },
                                        'rune_bonus': { type: 'rune_bonus', value: effectValue },
                                        'heal': { type: 'heal', value: effectValue },
                                        'attr_point': { type: 'attr_point', value: 1 },
                                        'real_reward': { type: 'real_reward', value: name },
                                        'pet_item': { type: 'pet_item', value: name.split(' ')[0] || '🐾' },
                                        'revive_pet': { type: 'revive_pet', value: 1 }
                                    };

                                    var newItem = {
                                        id: 'shop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                        name: name,
                                        desc: desc,
                                        category: category,
                                        price: price,
                                        icon: customIcon || null,
                                        maxPurchases: category === 'pet' ? 1 : 999,
                                        effect: effectMap[effectType] || { type: 'exp_boost', value: 5 }
                                    };

                                    SHOP_ITEMS.push(newItem);
                                    saveShopItems();
                                    renderShop();

                                    if (nameInput) nameInput.value = '';
                                    if (priceInput) priceInput.value = '50';
                                    if (iconInput) iconInput.value = '';
                                    if (descInput) descInput.value = '';

                                    showToast('🛒 ¡Item "' + name + '" creado en la tienda!', 'success', 'Tienda');
                                }

                                function resetShopItems() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    showModal(
                                        '🏪',
                                        'Resetear Tienda',
                                        '¿Restablecer la tienda a los valores predeterminados? Se perderán los items personalizados.',
                                        'Resetear',
                                        function () {
                                            SHOP_ITEMS = JSON.parse(JSON.stringify(SHOP_ITEMS_DEFAULT));
                                            saveShopItems();
                                            renderShop();
                                            showToast('🏪 Tienda restablecida.', 'info', 'Tienda');
                                        },
                                        true
                                    );
                                }

                                // ============================================================
                                // ===== FUNCIONES DE RESET =====
                                // ============================================================

                                function resetFullGame() {
                                    showModal(
                                        '💀',
                                        'Borrar Partida',
                                        '⚠️⚠️⚠️ ¿Estás ABSOLUTAMENTE SEGURO? Esto borrará TODOS los datos de tu partida. No se puede deshacer.',
                                        'Borrar Todo',
                                        function () {
                                            localStorage.removeItem('life_rpg_save');
                                            localStorage.removeItem('life_rpg_main_ids');
                                            localStorage.removeItem('life_rpg_sec_ids');
                                            localStorage.removeItem('life_rpg_daily_missions');
                                            localStorage.removeItem('life_rpg_events');
                                            localStorage.removeItem('life_rpg_shop_items');
                                            localStorage.removeItem('life_rpg_difficulty');
                                            localStorage.removeItem('life_rpg_config');

                                            player = JSON.parse(JSON.stringify(defaultPlayer));
                                            dynamicTrophyDefinitions = [];
                                            activeMainIds = [];
                                            activeSecondaryIds = [];
                                            SHOP_ITEMS = JSON.parse(JSON.stringify(SHOP_ITEMS_DEFAULT));
                                            eventosCache = [];
                                            eventosRenovadosHoy = false;
                                            ultimaFechaRenovacion = null;

                                            resetPomodoro();
                                            updateHUD();
                                            renderRunes();
                                            renderMissions();
                                            renderDailyMissions();
                                            renderBosses();
                                            renderBestiary();
                                            renderShop();
                                            renderTrophies();
                                            renderLogbook();
                                            renderEvents();
                                            renderInventory();

                                            var overlay = document.getElementById('game-over-overlay');
                                            if (overlay) overlay.remove();

                                            showToast('🔥 Juego completamente resetado.', 'info', 'Reset');
                                        },
                                        true
                                    );
                                }

                                function clearAllDLCs() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    if (player.dlcs.length === 0) {
                                        showToast('No hay DLCs para eliminar.', 'info', 'DLCs');
                                        return;
                                    }

                                    showModal(
                                        '📦',
                                        'Eliminar Todos los DLCs',
                                        '¿Eliminar TODOS los DLCs (' + player.dlcs.length + ') y sus misiones?',
                                        'Eliminar',
                                        function () {
                                            var dlcNames = player.dlcs.map(function (d) { return d.name; });
                                            player.rawMissions = player.rawMissions.filter(function (m) { return dlcNames.indexOf(m.dlcName) === -1; });
                                            player.dlcs = [];
                                            dynamicTrophyDefinitions = dynamicTrophyDefinitions.filter(function (t) { return t.id.indexOf('dlc_') !== 0; });
                                            player.dlcTrophies = [];

                                            refreshMissions();
                                            renderMissions();
                                            saveGame();
                                            renderTrophies();
                                            showToast('📦 Todos los DLCs y sus misiones eliminados.', 'info', 'DLCs');
                                        },
                                        true
                                    );
                                }

                                function createDLC() {
                                    if (player.gameOver) {
                                        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                                        return;
                                    }

                                    var nameInput = document.getElementById('dlc-create-name');
                                    var missionsTextarea = document.getElementById('dlc-create-missions');
                                    var trophyIconInput = document.getElementById('dlc-create-trophy-icon');
                                    var trophyNameInput = document.getElementById('dlc-create-trophy-name');

                                    var name = nameInput ? nameInput.value.trim() : '';
                                    var missionsText = missionsTextarea ? missionsTextarea.value.trim() : '';
                                    var trophyIcon = (trophyIconInput ? trophyIconInput.value.trim() : '') || '🏆';
                                    var trophyName = (trophyNameInput ? trophyNameInput.value.trim() : '') || (name + ' Completado');

                                    if (!name) {
                                        showToast('Ingresa un nombre para el DLC.', 'warning', 'Error');
                                        return;
                                    }

                                    if (!missionsText) {
                                        showToast('Ingresa al menos una misión.', 'warning', 'Error');
                                        return;
                                    }

                                    var lines = missionsText.split('\n').filter(function (l) { return l.trim(); });
                                    var missions = [];

                                    lines.forEach(function (line) {
                                        var parts = line.split(',').map(function (p) { return p.trim(); });
                                        if (parts.length >= 1) {
                                            var title = parts[0] || "Misión";
                                            var type = parts[1] || "secondary";
                                            var attr = parts[2] || "disciplina";
                                            var expReward = parseInt(parts[3]) || 10;
                                            var goldReward = parseInt(parts[4]) || 5;
                                            missions.push({ title: title, type: type, attr: attr, expReward: expReward, goldReward: goldReward });
                                        }
                                    });

                                    if (missions.length === 0) {
                                        showToast('No se pudieron parsear las misiones. Usa el formato: Título, tipo, atributo, EXP, ORO', 'error', 'Error');
                                        return;
                                    }

                                    var countMain = 0;
                                    var countSec = 0;

                                    missions.forEach(function (m) {
                                        var mId = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                        var type = m.type || 'secondary';
                                        if (type === 'main') countMain++;
                                        else countSec++;

                                        player.rawMissions.push({
                                            id: mId,
                                            dlcName: name,
                                            title: m.title,
                                            type: type,
                                            attr: m.attr || "disciplina",
                                            expReward: m.expReward || 10,
                                            goldReward: m.goldReward || 5,
                                            completed: false
                                        });
                                    });

                                    player.dlcs.push({
                                        name: name,
                                        total: missions.length,
                                        main: countMain,
                                        secondary: countSec,
                                        trophyIcon: trophyIcon,
                                        trophyName: trophyName
                                    });

                                    var trophyId = 'dlc_' + name.replace(/\s+/g, '_');
                                    dynamicTrophyDefinitions = dynamicTrophyDefinitions.filter(function (t) { return t.id !== trophyId; });

                                    dynamicTrophyDefinitions.push({
                                        id: trophyId,
                                        icon: trophyIcon,
                                        name: trophyName,
                                        desc: 'Completa todas las misiones del DLC "' + name + '"',
                                        check: function (p) {
                                            var missions = p.rawMissions.filter(function (m) { return m.dlcName === name; });
                                            return missions.length > 0 && missions.every(function (m) { return m.completed; });
                                        }
                                    });

                                    refreshMissions();
                                    renderMissions();
                                    saveGame();
                                    renderTrophies();

                                    showToast('🚀 ¡DLC "' + name + '" creado con éxito! 📦 ' + missions.length + ' misiones (' + countMain + ' principales, ' + countSec + ' secundarias)', 'success', 'DLC');

                                    if (nameInput) nameInput.value = '';
                                    if (missionsTextarea) missionsTextarea.value = '';
                                    if (trophyIconInput) trophyIconInput.value = '🏆';
                                    if (trophyNameInput) trophyNameInput.value = '';
                                }

                                // ============================================================
                                // ===== FUNCIONES DE EXPORTACIÓN/IMPORTACIÓN DE PARTIDA =====
                                // ============================================================

                                function exportData() {
                                    var dataToExport = {
                                        player: player,
                                        activeMainIds: activeMainIds,
                                        activeSecondaryIds: activeSecondaryIds,
                                        dynamicTrophyDefinitions: dynamicTrophyDefinitions,
                                        SHOP_ITEMS: SHOP_ITEMS
                                    };

                                    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
                                    var downloadAnchor = document.createElement('a');
                                    downloadAnchor.setAttribute("href", dataStr);
                                    downloadAnchor.setAttribute("download", "life_rpg_backup_" + new Date().toISOString().slice(0, 10) + ".json");
                                    document.body.appendChild(downloadAnchor);
                                    downloadAnchor.click();
                                    downloadAnchor.remove();
                                    showToast('💾 Partida guardada como archivo JSON.', 'success', 'Guardado');
                                }

                                function importData(event) {
                                    var fileReader = new FileReader();
                                    if (event.target.files[0]) {
                                        fileReader.readAsText(event.target.files[0], "UTF-8");
                                        fileReader.onload = function (e) {
                                            try {
                                                var content = e.target.result.trim();
                                                if (content.charCodeAt(0) === 0xFEFF) {
                                                    content = content.substring(1);
                                                }

                                                var backup = JSON.parse(content);
                                                if (backup.player) {
                                                    player = backup.player;
                                                    activeMainIds = backup.activeMainIds || [];
                                                    activeSecondaryIds = backup.activeSecondaryIds || [];
                                                    if (backup.dynamicTrophyDefinitions) {
                                                        dynamicTrophyDefinitions = backup.dynamicTrophyDefinitions;
                                                    }
                                                    if (backup.SHOP_ITEMS) {
                                                        SHOP_ITEMS = backup.SHOP_ITEMS;
                                                    }
                                                } else {
                                                    player = backup;
                                                }

                                                if (!player.purchasedItems) player.purchasedItems = [];
                                                if (!player.totalSpent) player.totalSpent = 0;
                                                if (!player.expBoost) player.expBoost = 0;
                                                if (!player.goldBoost) player.goldBoost = 0;
                                                if (!player.runeBonus) player.runeBonus = 0;
                                                if (!player.pomodoroSessions) player.pomodoroSessions = 0;
                                                if (!player.pomodoroFocusTime) player.pomodoroFocusTime = 0;
                                                if (!player.logbook) player.logbook = [];
                                                if (!player.events) player.events = [];
                                                if (!player.inventory) player.inventory = [];
                                                if (!player.equipment) player.equipment = { arma: null, armadura: null, reliquia: null, mascota: null };
                                                if (player.petHealth === undefined) player.petHealth = 100;
                                                if (player.petMaxHealth === undefined) player.petMaxHealth = 100;
                                                if (player.gameOver === undefined) player.gameOver = false;
                                                if (player.lastRuneReset === undefined) player.lastRuneReset = null;

                                                eventosCache = player.events || [];

                                                resetPomodoro();
                                                saveShopItems();
                                                saveGame();
                                                updateHUD();
                                                renderMissions();
                                                renderDailyMissions();
                                                renderRunes();
                                                renderBosses();
                                                renderBestiary();
                                                renderShop();
                                                renderTrophies();
                                                renderLogbook();
                                                renderEvents();
                                                renderInventory();
                                                updatePet();

                                                if (player.gameOver) {
                                                    setTimeout(showGameOverScreen, 500);
                                                }

                                                showToast('📂 ¡Partida importada con éxito!', 'success', 'Importar');
                                            } catch (error) {
                                                showToast('Error al leer el archivo JSON de respaldo: ' + error.message, 'error', 'Error');
                                                console.error("Error detallado:", error);
                                            }
                                        };
                                    }
                                }

                                // ============================================================
