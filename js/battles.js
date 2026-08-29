                    // ===== FUNCIONES DE BATALLAS =====
                    // ============================================================

                    const CHAMPS = [
                        { id: 'flaw_sedentarismo', name: 'Sedentarismo', icon: '🛋️', counterAttr: 'fuerza', levelRequired: 1, hp: 40, attack: 6, defense: 2, expReward: 8, goldReward: 5 },
                        { id: 'flaw_procrastinacion', name: 'Procrastinación', icon: '⏳', counterAttr: 'disciplina', levelRequired: 3, hp: 60, attack: 9, defense: 4, expReward: 14, goldReward: 9 },
                        { id: 'flaw_inseguridad', name: 'Inseguridad', icon: '🌀', counterAttr: 'mente', levelRequired: 5, hp: 85, attack: 13, defense: 6, expReward: 22, goldReward: 14 },
                        { id: 'flaw_bloqueo', name: 'Bloqueo Creativo', icon: '🧊', counterAttr: 'creatividad', levelRequired: 8, hp: 130, attack: 15, defense: 12, expReward: 32, goldReward: 20 },
                        { id: 'flaw_estancamiento', name: 'Estancamiento', icon: '🕳️', counterAttr: 'carrera', levelRequired: 11, hp: 150, attack: 20, defense: 10, expReward: 45, goldReward: 28 },
                        { id: 'flaw_descontrol', name: 'Descontrol Financiero', icon: '💸', counterAttr: 'finanzas', levelRequired: 14, hp: 170, attack: 24, defense: 12, expReward: 60, goldReward: 38 },
                        { id: 'flaw_timidez', name: 'Timidez', icon: '🙈', counterAttr: 'social', levelRequired: 18, hp: 220, attack: 28, defense: 18, expReward: 80, goldReward: 50 },
                        { id: 'flaw_apatia', name: 'Apatía', icon: '🌫️', counterAttr: 'relaciones', levelRequired: 22, hp: 280, attack: 34, defense: 22, expReward: 110, goldReward: 70 }
                    ];

                    const ATTR_LABELS_SHORT = {
                        fuerza: 'Fuerza', disciplina: 'Disciplina', mente: 'Mente', creatividad: 'Creatividad',
                        carrera: 'Carrera', finanzas: 'Finanzas', social: 'Social', relaciones: 'Relaciones'
                    };

                    var arenaMode = { active: false, streak: 0, championIndex: 0, currentHp: 0, currentMaxHp: 0, totalExp: 0, totalGold: 0 };

                    function getPlayerCombatStatsVsChamp(champ) {
                        var counterValue = player.attributes[champ.counterAttr] || 1;
                        var disciplina = player.attributes.disciplina || 1;

                        return {
                            hp: 60 + player.level * 4,
                            attack: 5 + counterValue * 2 + Math.floor(player.level * 0.5),
                            defense: 2 + Math.floor(counterValue * 0.5) + Math.floor(disciplina * 0.5)
                        };
                    }

                    function resolveCombatRound(atkName, atkStats, defName, defStats, log) {
                        var isCrit = Math.random() < 0.12;
                        var variance = 0.85 + Math.random() * 0.3;
                        var rawDamage = Math.max(1, atkStats.attack - defStats.defense * 0.5);
                        var damage = Math.round(rawDamage * variance * (isCrit ? 1.8 : 1));

                        defStats.hp -= damage;

                        if (isCrit) {
                            log.push('💥 ' + atkName + ' conecta un golpe crítico a ' + defName + ' por ' + damage + ' de daño.');
                        } else {
                            log.push('⚔️ ' + atkName + ' golpea a ' + defName + ' por ' + damage + ' de daño.');
                        }

                        return damage;
                    }

                    function runAutoBattle(playerStats, champ, startingHp) {
                        var log = [];
                        var pHp = { hp: startingHp !== undefined ? startingHp : playerStats.hp };
                        var pDef = { attack: playerStats.attack, defense: playerStats.defense, hp: pHp.hp };
                        var cDef = { attack: champ.attack, defense: champ.defense, hp: champ.hp };

                        log.push('🥊 Comienza el combate contra ' + champ.name + '.');

                        var turn = 0;
                        var maxTurns = 30;
                        var playerFirst = playerStats.attack >= champ.attack;

                        while (pDef.hp > 0 && cDef.hp > 0 && turn < maxTurns) {
                            if (playerFirst) {
                                resolveCombatRound('Vos', pDef, champ.name, cDef, log);
                                if (cDef.hp <= 0) break;
                                resolveCombatRound(champ.name, cDef, 'Vos', pDef, log);
                            } else {
                                resolveCombatRound(champ.name, cDef, 'Vos', pDef, log);
                                if (pDef.hp <= 0) break;
                                resolveCombatRound('Vos', pDef, champ.name, cDef, log);
                            }
                            turn++;
                        }

                        var won = cDef.hp <= 0 && pDef.hp > 0;

                        if (cDef.hp <= 0) {
                            log.push('🏆 ¡' + champ.name + ' ha sido derrotado!');
                        } else if (pDef.hp <= 0) {
                            log.push('💀 Perdiste el combate contra ' + champ.name + '.');
                        } else {
                            log.push('⏱️ El combate se extendió demasiado y terminó en empate.');
                        }

                        return {
                            won: won,
                            log: log,
                            remainingPlayerHp: Math.max(0, pDef.hp),
                            maxPlayerHp: playerStats.hp
                        };
                    }

                    function fightChamp(champId) {
                        if (player.gameOver) {
                            showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                            return;
                        }

                        var champ = CHAMPS.find(function (c) { return c.id === champId; });
                        if (!champ) return;

                        if (player.level < champ.levelRequired) {
                            showToast('Necesitás nivel ' + champ.levelRequired + ' para desafiar a ' + champ.name + '.', 'warning', 'Batallas');
                            return;
                        }

                        var playerStats = getPlayerCombatStatsVsChamp(champ);
                        var champCopy = { name: champ.name, attack: champ.attack, defense: champ.defense, hp: champ.hp };
                        var result = runAutoBattle(playerStats, champCopy);

                        renderBattleLog(result.log, result.won, champ);

                        var damageTaken = Math.max(0, playerStats.hp - result.remainingPlayerHp);
                        if (damageTaken > 0) {
                            applyDamage(damageTaken, 'Combate contra ' + champ.name, Math.ceil(damageTaken / 4));
                        }

                        if (player.gameOver) return;

                        if (result.won) {
                            gainRewards(champ.expReward, champ.goldReward, null, 'battle', '⚔️ Venciste a ' + champ.name, 'Combate en Batallas');
                            showToast('🏆 ¡Venciste a ' + champ.name + '! +' + champ.expReward + ' EXP, +' + champ.goldReward + ' ORO' + (damageTaken > 0 ? ' (-' + damageTaken + ' HP real)' : ''), 'success', 'Batallas');
                        } else {
                            addLogEntry('battle', '💀 Perdiste contra ' + champ.name, 'Sin recompensa, -' + damageTaken + ' HP real', 0, 0, null);
                            showToast('💀 Perdiste contra ' + champ.name + '. -' + damageTaken + ' HP real. Necesitás más ' + ATTR_LABELS_SHORT[champ.counterAttr] + '.', 'error', 'Batallas');
                        }

                        renderBattlesTab();
                    }

                    function startArenaMode() {
                        if (player.gameOver) {
                            showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                            return;
                        }

                        var eligibleChamps = CHAMPS.filter(function (c) { return player.level >= c.levelRequired; });
                        if (eligibleChamps.length === 0) {
                            showToast('Todavía no tenés nivel suficiente para ningún champ.', 'warning', 'Arena');
                            return;
                        }

                        var firstStats = getPlayerCombatStatsVsChamp(eligibleChamps[0]);
                        arenaMode = {
                            active: true,
                            streak: 0,
                            championIndex: 0,
                            currentHp: firstStats.hp,
                            currentMaxHp: firstStats.hp,
                            totalExp: 0,
                            totalGold: 0,
                            eligibleChamps: eligibleChamps
                        };

                        renderBattlesTab();
                        arenaFightNext();
                    }

                    function arenaFightNext() {
                        if (!arenaMode.active) return;

                        var champ = arenaMode.eligibleChamps[arenaMode.championIndex % arenaMode.eligibleChamps.length];
                        var tierBonus = Math.floor(arenaMode.championIndex / arenaMode.eligibleChamps.length);
                        var champCopy = {
                            name: champ.name + (tierBonus > 0 ? ' +' + tierBonus : ''),
                            attack: champ.attack + tierBonus * 4,
                            defense: champ.defense + tierBonus * 2,
                            hp: champ.hp + tierBonus * 20
                        };

                        var playerStats = getPlayerCombatStatsVsChamp(champ);
                        var startingHp = arenaMode.currentHp;
                        var result = runAutoBattle(playerStats, champCopy, startingHp);

                        renderBattleLog(result.log, result.won, { name: champCopy.name, icon: champ.icon });

                        var damageTaken = Math.max(0, startingHp - result.remainingPlayerHp);
                        if (damageTaken > 0) {
                            applyDamage(damageTaken, 'Arena: combate contra ' + champCopy.name, Math.ceil(damageTaken / 4));
                        }

                        if (player.gameOver) {
                            arenaMode = { active: false, streak: 0, championIndex: 0, currentHp: 0, currentMaxHp: 0, totalExp: 0, totalGold: 0 };
                            return;
                        }

                        if (result.won) {
                            arenaMode.streak++;
                            arenaMode.championIndex++;
                            arenaMode.currentHp = result.remainingPlayerHp;

                            var expWin = champ.expReward + tierBonus * 4;
                            var goldWin = champ.goldReward + tierBonus * 3;
                            arenaMode.totalExp += expWin;
                            arenaMode.totalGold += goldWin;

                            gainRewards(expWin, goldWin, null, 'battle', '🔥 Arena: venciste a ' + champCopy.name, 'Racha: ' + arenaMode.streak);
                            showToast('🔥 ¡Racha de ' + arenaMode.streak + '! +' + expWin + ' EXP, +' + goldWin + ' ORO' + (damageTaken > 0 ? ' (-' + damageTaken + ' HP real)' : ''), 'success', 'Arena');
                            renderBattlesTab();
                        } else {
                            var finalStreak = arenaMode.streak;
                            var finalExp = arenaMode.totalExp;
                            var finalGold = arenaMode.totalGold;
                            arenaMode = { active: false, streak: 0, championIndex: 0, currentHp: 0, currentMaxHp: 0, totalExp: 0, totalGold: 0 };

                            addLogEntry('battle', '🔥 Racha de Arena terminada', finalStreak + ' victorias — +' + finalExp + ' EXP y +' + finalGold + ' ORO en total, -' + damageTaken + ' HP real', 0, 0, null);
                            showToast('🏁 Tu racha terminó en ' + finalStreak + ' victorias (-' + damageTaken + ' HP real). En total ganaste +' + finalExp + ' EXP y +' + finalGold + ' ORO — todo eso ya está guardado.', 'info', 'Arena');
                            renderBattlesTab();
                        }
                    }

                    function stopArenaMode() {
                        if (!arenaMode.active) return;

                        var finalStreak = arenaMode.streak;
                        var finalExp = arenaMode.totalExp;
                        var finalGold = arenaMode.totalGold;
                        arenaMode = { active: false, streak: 0, championIndex: 0, currentHp: 0, currentMaxHp: 0, totalExp: 0, totalGold: 0 };

                        showToast('🏁 Te retiraste con ' + finalStreak + ' victorias. Ganancias ya guardadas: +' + finalExp + ' EXP, +' + finalGold + ' ORO.', 'info', 'Arena');
                        renderBattlesTab();
                    }

                    function renderBattleLog(log, won, champ) {
                        var container = document.getElementById('battle-log-container');
                        if (!container) return;

                        var html = '<div class="battle-log-header ' + (won ? 'won' : 'lost') + '">' +
                            renderIconHTML(champ.icon, '⚔️') + ' ' + (won ? '¡Victoria!' : 'Derrota') +
                            '</div><div class="battle-log-lines">';

                        log.forEach(function (line) {
                            html += '<div class="battle-log-line">' + line + '</div>';
                        });

                        html += '</div>';
                        container.innerHTML = html;
                        container.scrollTop = 0;
                    }

                    function renderBattlesTab() {
                        var container = document.getElementById('battles-champ-container');
                        var statsContainer = document.getElementById('battle-player-stats');
                        var arenaControls = document.getElementById('arena-controls');
                        if (!container) return;

                        var baseHp = 60 + player.level * 4;
                        if (statsContainer) {
                            statsContainer.innerHTML =
                                '<div class="battle-stat-item">❤️ HP combate: <strong>' + (arenaMode.active ? arenaMode.currentHp : baseHp) + ' / ' + (arenaMode.active ? arenaMode.currentMaxHp : baseHp) + '</strong></div>' +
                                '<div class="battle-stat-item" style="opacity:0.7;">⚠️ El daño de cada combate también afecta tu HP real de la partida.</div>';
                        }

                        if (arenaControls) {
                            if (arenaMode.active) {
                                arenaControls.innerHTML =
                                    '<div class="arena-streak">🔥 Racha actual: ' + arenaMode.streak + ' — Acumulado: +' + arenaMode.totalExp + ' EXP, +' + arenaMode.totalGold + ' ORO</div>' +
                                    '<div style="display:flex; gap:10px;">' +
                                    '<button class="action-btn" onclick="arenaFightNext()">⚔️ Siguiente Combate</button>' +
                                    '<button class="action-btn small" onclick="stopArenaMode()">🏁 Retirarse (guardar ganancias)</button>' +
                                    '</div>';
                            } else {
                                arenaControls.innerHTML = '<button class="action-btn" onclick="startArenaMode()">🔥 Iniciar Modo Arena</button>';
                            }
                        }

                        if (arenaMode.active) {
                            container.style.opacity = '0.4';
                            container.style.pointerEvents = 'none';
                        } else {
                            container.style.opacity = '1';
                            container.style.pointerEvents = 'auto';
                        }

                        var html = '';
                        CHAMPS.forEach(function (champ) {
                            var locked = player.level < champ.levelRequired;
                            var myStats = getPlayerCombatStatsVsChamp(champ);
                            var attrLabel = ATTR_LABELS_SHORT[champ.counterAttr];
                            var attrValue = player.attributes[champ.counterAttr] || 1;

                            html += '<div class="champ-card ' + (locked ? 'locked' : '') + '">' +
                                '<div class="champ-header">' +
                                '<span class="champ-icon">' + renderIconHTML(champ.icon, '⚔️') + '</span>' +
                                '<span class="champ-name">' + champ.name + '</span>' +
                                '</div>' +
                                '<div class="champ-counter-label">🎯 Se enfrenta con ' + attrLabel + ' (' + attrValue + ')</div>' +
                                '<div class="champ-stats">' +
                                '<span>Él: ❤️' + champ.hp + ' ⚔️' + champ.attack + ' 🛡️' + champ.defense + '</span>' +
                                '</div>' +
                                '<div class="champ-stats">' +
                                '<span>Vos: ⚔️' + myStats.attack + ' 🛡️' + myStats.defense + '</span>' +
                                '</div>' +
                                (locked ? '<div class="champ-locked-label">🔒 Nivel ' + champ.levelRequired + ' requerido</div>' :
                                    '<button class="action-btn small" onclick="fightChamp(\'' + champ.id + '\')" ' + (arenaMode.active ? 'disabled' : '') + '>🥊 Pelear (+' + champ.expReward + ' EXP, +' + champ.goldReward + ' ORO)</button>') +
                                '</div>';
                        });

                        container.innerHTML = html;
                    }

                    // ============================================================
