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
                                            renderDLCImportList();

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
                                                    var runePackId = 'rpack_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                                    runesArray.forEach(function (r) {
                                                        player.rawRunes.push({
                                                            id: 'rune_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                                                            packId: runePackId,
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
                                                    renderRuneImportList();
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

                                // Agrupa las runas por paquete importado (packId), con compatibilidad
                                // hacia atrás para runas antiguas sin packId (agrupadas por setName).
                                function renderRuneImportList() {
                                    var packs = {};
                                    (player.rawRunes || []).forEach(function (r) {
                                        var pid = r.packId || ('legacy_' + (r.setName || 'runas'));
                                        if (!packs[pid]) packs[pid] = { id: pid, name: r.setName || 'Runas', count: 0 };
                                        packs[pid].count++;
                                    });
                                    renderImportPackList('rune-import-list', Object.keys(packs).map(function (k) { return packs[k]; }), deleteRunePack);
                                }

                                function deleteRunePack(packId) {
                                    player.rawRunes = (player.rawRunes || []).filter(function (r) {
                                        var pid = r.packId || ('legacy_' + (r.setName || 'runas'));
                                        return pid !== packId;
                                    });
                                    renderRunes();
                                    renderRuneImportList();
                                    saveGame();
                                    showToast('💠 Paquete de runas eliminado.', 'info', 'Runas');
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
                                            renderRuneImportList();
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

                                    var bossFile = event.target.files[0];
                                    if (!bossFile) return;

                                    var fileReader = new FileReader();
                                    fileReader.readAsText(bossFile, "UTF-8");
                                    fileReader.onload = function (e) {
                                        try {
                                            var content = e.target.result.trim();
                                            if (content.charCodeAt(0) === 0xFEFF) {
                                                content = content.substring(1);
                                            }

                                            var bossData = JSON.parse(content);
                                            var bossesArray = Array.isArray(bossData) ? bossData : bossData.bosses;
                                            var packName = (!Array.isArray(bossData) && bossData.packName) || bossFile.name.replace(/\.json$/i, '');

                                            if (bossesArray && Array.isArray(bossesArray)) {
                                                var count = 0;
                                                var bossPackId = 'bpack_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                                bossesArray.forEach(function (b) {
                                                    var bossId = 'boss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                                    player.bosses.push({
                                                        id: bossId,
                                                        packId: bossPackId,
                                                        packName: packName,
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
                                                renderBossImportList();
                                                showToast('👹 ¡' + count + ' boss(es) instalado(s) con éxito!', 'success', 'Bosses');
                                                checkAndUnlockTrophies();
                                            } else {
                                                showToast('Formato de JSON de bosses inválido.', 'error', 'Error');
                                            }
                                        } catch (error) {
                                            showToast('Error al leer el archivo JSON de bosses: ' + error.message, 'error', 'Error');
                                        }
                                    };
                                    event.target.value = '';
                                }

                                // Agrupa los bosses por paquete importado (packId), con compatibilidad
                                // hacia atrás para bosses antiguos sin packId.
                                function renderBossImportList() {
                                    var packs = {};
                                    (player.bosses || []).forEach(function (b) {
                                        var pid = b.packId || 'legacy_bosses';
                                        if (!packs[pid]) packs[pid] = { id: pid, name: b.packName || 'Bosses', count: 0 };
                                        packs[pid].count++;
                                    });
                                    renderImportPackList('boss-import-list', Object.keys(packs).map(function (k) { return packs[k]; }), deleteBossPack);
                                }

                                function deleteBossPack(packId) {
                                    player.bosses = (player.bosses || []).filter(function (b) {
                                        var pid = b.packId || 'legacy_bosses';
                                        return pid !== packId;
                                    });
                                    saveGame();
                                    renderBosses();
                                    renderBestiary();
                                    renderBossImportList();
                                    showToast('👹 Paquete de bosses eliminado.', 'info', 'Bosses');
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
                                            renderDLCImportList();
                                            showToast('📦 Todos los DLCs y sus misiones eliminados.', 'info', 'DLCs');
                                        },
                                        true
                                    );
                                }

                                // player.dlcs ya funciona como el registro de paquetes importados
                                // (un elemento por cada DLC instalado), así que solo listamos y
                                // permitimos eliminar cada uno individualmente.
                                function renderDLCImportList() {
                                    var packs = (player.dlcs || []).map(function (d) {
                                        return { id: d.name, name: d.name, count: d.total };
                                    });
                                    renderImportPackList('dlc-import-list', packs, deleteDLCPack);
                                }

                                function deleteDLCPack(dlcName) {
                                    player.rawMissions = player.rawMissions.filter(function (m) { return m.dlcName !== dlcName; });
                                    player.dlcs = player.dlcs.filter(function (d) { return d.name !== dlcName; });
                                    var trophyId = 'dlc_' + dlcName.replace(/\s+/g, '_');
                                    dynamicTrophyDefinitions = dynamicTrophyDefinitions.filter(function (t) { return t.id !== trophyId; });

                                    refreshMissions();
                                    renderMissions();
                                    saveGame();
                                    renderTrophies();
                                    renderDLCImportList();
                                    showToast('📦 DLC "' + dlcName + '" eliminado.', 'info', 'DLCs');
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
