                    // ===== FUNCIONES DE BATALLAS =====
                    // ============================================================

                    const CHAMPS = [
                        { id: 'flaw_sedentarismo', name: 'Larva del Colchon', icon: '', image: 'assets/champs/sedentarismo.jpg', counterAttr: 'fuerza', levelRequired: 1, hp: 40, attack: 6, defense: 2, expReward: 8, goldReward: 5 },
                        { id: 'flaw_procrastinacion', name: 'Tejedora de Mañanas', icon: '', image: 'assets/champs/procrastinacion.jpg', counterAttr: 'disciplina', levelRequired: 3, hp: 60, attack: 9, defense: 4, expReward: 14, goldReward: 9 },
                        { id: 'flaw_inseguridad', name: 'Espectro del Espejo', icon: '', image: 'assets/champs/inseguridad.jpg', counterAttr: 'mente', levelRequired: 5, hp: 85, attack: 13, defense: 6, expReward: 22, goldReward: 14 },
                        { id: 'flaw_bloqueo', name: 'Monolito Gris', icon: '', image: 'assets/champs/bloqueo-creativo.jpg', counterAttr: 'creatividad', levelRequired: 8, hp: 130, attack: 15, defense: 12, expReward: 32, goldReward: 20 },
                        { id: 'flaw_estancamiento', name: 'Limo de Fango', icon: '', image: 'assets/champs/estancamiento.jpg', counterAttr: 'carrera', levelRequired: 11, hp: 150, attack: 20, defense: 10, expReward: 45, goldReward: 28 },
                        { id: 'flaw_descontrol', name: 'Usurero del Arca', icon: '', image: 'assets/champs/descontrol-financiero.jpg', counterAttr: 'finanzas', levelRequired: 14, hp: 170, attack: 24, defense: 12, expReward: 60, goldReward: 38 },
                        { id: 'flaw_timidez', name: 'Banshee Silenciosa', icon: '', image: 'assets/champs/timidez.jpg', counterAttr: 'social', levelRequired: 18, hp: 220, attack: 28, defense: 18, expReward: 80, goldReward: 50 },
                        { id: 'flaw_apatia', name: 'Apath, el Vacío', icon: '', image: 'assets/champs/apatia.jpg', counterAttr: 'relaciones', levelRequired: 22, hp: 280, attack: 34, defense: 22, expReward: 110, goldReward: 70 }
                    ];

                    const ATTR_LABELS_SHORT = {
                        fuerza: 'Fuerza', disciplina: 'Disciplina', mente: 'Mente', creatividad: 'Creatividad',
                        carrera: 'Carrera', finanzas: 'Finanzas', social: 'Social', relaciones: 'Relaciones'
                    };

                    // Tabla de eventos ofensivos (rol del atacante) — mutuamente excluyentes
                    const OFFENSE_TABLE = [
                        { key: 'fallo', weight: 12 },
                        { key: 'critico', weight: 12 },
                        { key: 'debil', weight: 15 },
                        { key: 'normal', weight: 61 }
                    ];

                    // Tabla de eventos defensivos (rol del defensor) — mutuamente excluyentes
                    const DEFENSE_TABLE = [
                        { key: 'esquiva', weight: 8 },
                        { key: 'bloqueo', weight: 8 },
                        { key: 'parry_perfecto', weight: 5 },
                        { key: 'parry_parcial', weight: 3 },
                        { key: 'parry_fallido', weight: 2 },
                        { key: 'normal', weight: 74 }
                    ];

                    const CONTRAATAQUE_CHANCE = 0.10;
                    const VULNERABLE_CHANCE = 0.06;
                    const DOBLE_GOLPE_CHANCE = 0.08;
                    const RECUPERACION_CHANCE = 0.05;
                    const BATTLE_LINE_DELAY_MS = 1400;

                    var arenaMode = { active: false, streak: 0, championIndex: 0, totalExp: 0, totalGold: 0, eligibleChamps: [] };
                    var battleLogToken = 0;
                    var battleAnimating = false;

                    function weightedPick(table) {
                        var roll = Math.random() * 100;
                        var cumulative = 0;
                        for (var i = 0; i < table.length; i++) {
                            cumulative += table[i].weight;
                            if (roll < cumulative) return table[i].key;
                        }
                        return table[table.length - 1].key;
                    }

                    function getPlayerCombatStatsVsChamp(champ) {
                        var counterValue = player.attributes[champ.counterAttr] || 1;
                        var disciplina = player.attributes.disciplina || 1;

                        return {
                            hp: player.hp,
                            maxHp: player.maxHp,
                            attack: 5 + counterValue * 2 + Math.floor(player.level * 0.5),
                            defense: 2 + Math.floor(counterValue * 0.5) + Math.floor(disciplina * 0.5)
                        };
                    }

                    function rollDamage(atk, def) {
                        var variance = 0.85 + Math.random() * 0.3;
                        var base = Math.max(1, atk.attack - def.defense * 0.5);
                        return base * variance;
                    }

                    function pushLog(log, text, target, delta) {
                        log.push({ text: text, target: target || null, delta: delta || 0 });
                    }

                    // Resuelve un solo golpe (usado tanto para el golpe principal del turno
                    // como para el segundo golpe de un Doble Golpe). "atkIsPlayer" indica si
                    // quien ataca en este golpe es el jugador, para poder etiquetar a quién
                    // le pertenece cada cambio de HP en el log. "chain" habilita que este
                    // golpe dispare Doble Golpe/Recuperación (se desactiva en el segundo
                    // golpe de un combo para no encadenar sin límite).
                    function resolveSingleHit(atk, def, atkName, defName, atkIsPlayer, log, chain) {
                        var defIsPlayer = !atkIsPlayer;
                        var offense = weightedPick(OFFENSE_TABLE);

                        if (offense === 'fallo') {
                            pushLog(log, '❌ ' + atkName + ' falló el ataque!', null, 0);
                            return;
                        }

                        var damage = rollDamage(atk, def);
                        var tag = '';

                        if (offense === 'critico') {
                            damage *= 1.8;
                            tag = ' 💥 ¡CRÍTICO!';
                        } else if (offense === 'debil') {
                            damage *= 0.5;
                            tag = ' (golpe débil)';
                        }

                        var wasVulnerable = def.vulnerable;
                        if (wasVulnerable) {
                            damage *= 1.3;
                            def.vulnerable = false;
                        }

                        var defense = weightedPick(DEFENSE_TABLE);
                        var counterFromParry = 0;

                        if (defense === 'esquiva') {
                            damage = 0;
                            pushLog(log, '💨 ' + defName + ' esquiva el ataque!', null, 0);
                        } else if (defense === 'bloqueo') {
                            damage = Math.round(damage * 0.5);
                            pushLog(log, '🛡️ ' + defName + ' bloquea parcialmente el golpe.', null, 0);
                        } else if (defense === 'parry_perfecto') {
                            damage = 0;
                            pushLog(log, '✨ ¡' + defName + ' hace un PARRY perfecto! ¡0 daño!', null, 0);
                            counterFromParry = Math.max(1, Math.round(rollDamage(def, atk)));
                        } else if (defense === 'parry_parcial') {
                            damage = Math.round(damage * 0.3);
                            pushLog(log, '🛡️ ' + defName + ' hace un PARRY parcial. Daño reducido.', null, 0);
                        } else if (defense === 'parry_fallido') {
                            damage = Math.round(damage * 1.5);
                            pushLog(log, '⚠️ ' + defName + ' intenta un parry y falla. ¡Recibe más daño!', null, 0);
                        }

                        damage = Math.round(damage);

                        if (damage > 0) {
                            var vulnTag = wasVulnerable ? ' [VULNERABLE!]' : '';
                            pushLog(log, '⚔️ ' + atkName + ' golpea a ' + defName + ' (' + damage + ' de daño)' + tag + vulnTag, defIsPlayer ? 'player' : 'champ', -damage);
                            def.hp -= damage;
                        }

                        if (def.hp <= 0) return;

                        if (counterFromParry > 0) {
                            pushLog(log, '🔄 ' + defName + ' contraataca tras el parry! (' + counterFromParry + ' de daño)', atkIsPlayer ? 'player' : 'champ', -counterFromParry);
                            atk.hp -= counterFromParry;
                        } else if (defense !== 'parry_perfecto' && Math.random() < CONTRAATAQUE_CHANCE) {
                            var counterDmg = Math.max(1, Math.round(rollDamage(def, atk)));
                            pushLog(log, '🔄 ¡' + defName + ' contraataca! (' + counterDmg + ' de daño)', atkIsPlayer ? 'player' : 'champ', -counterDmg);
                            atk.hp -= counterDmg;
                        }

                        if (atk.hp <= 0) return;

                        if (damage > 0 && def.hp > 0 && Math.random() < VULNERABLE_CHANCE) {
                            def.vulnerable = true;
                            pushLog(log, '😵 ' + defName + ' queda vulnerable!', null, 0);
                        }

                        if (chain && atk.hp > 0 && Math.random() < RECUPERACION_CHANCE) {
                            var healAmt = Math.max(1, Math.round(atk.maxHp * 0.08));
                            var before = atk.hp;
                            atk.hp = Math.min(atk.maxHp, atk.hp + healAmt);
                            if (atk.hp > before) {
                                pushLog(log, '💚 ' + atkName + ' se recupera un poco (+' + (atk.hp - before) + ' HP)', atkIsPlayer ? 'player' : 'champ', atk.hp - before);
                            }
                        }

                        if (chain && def.hp > 0 && Math.random() < DOBLE_GOLPE_CHANCE) {
                            pushLog(log, '💨 ¡' + atkName + ' ataca de nuevo!', null, 0);
                            var secondDamage = Math.round(rollDamage(atk, def));
                            def.hp -= secondDamage;
                            pushLog(log, '⚔️ Segundo golpe: ' + secondDamage + ' de daño', defIsPlayer ? 'player' : 'champ', -secondDamage);
                        }
                    }

                    function runAutoBattle(playerStats, champStats) {
                        var log = [];
                        var pWorking = { hp: playerStats.hp, maxHp: playerStats.maxHp, attack: playerStats.attack, defense: playerStats.defense, vulnerable: false };
                        var cWorking = { hp: champStats.hp, maxHp: champStats.hp, attack: champStats.attack, defense: champStats.defense, vulnerable: false };

                        pushLog(log, '🥊 Comienza el combate contra ' + champStats.name + '.', null, 0);

                        var turn = 0;
                        var maxTurns = 24;
                        var attackerIsPlayer = playerStats.attack >= champStats.attack;
                        var consecutiveCount = 0;
                        var KEEP_INITIATIVE_CHANCE = 0.25;
                        var MAX_CONSECUTIVE = 3;

                        while (pWorking.hp > 0 && cWorking.hp > 0 && turn < maxTurns) {
                            var atk = attackerIsPlayer ? pWorking : cWorking;
                            var def = attackerIsPlayer ? cWorking : pWorking;
                            var atkName = attackerIsPlayer ? 'Daniel' : champStats.name;
                            var defName = attackerIsPlayer ? champStats.name : 'Daniel';

                            resolveSingleHit(atk, def, atkName, defName, attackerIsPlayer, log, true);
                            turn++;

                            if (pWorking.hp <= 0 || cWorking.hp <= 0) break;

                            consecutiveCount++;
                            var keepsInitiative = consecutiveCount < MAX_CONSECUTIVE && Math.random() < KEEP_INITIATIVE_CHANCE;

                            if (keepsInitiative) {
                                pushLog(log, '🌀 ¡' + atkName + ' mantiene la iniciativa y ataca de nuevo!', null, 0);
                            } else {
                                attackerIsPlayer = !attackerIsPlayer;
                                consecutiveCount = 0;
                            }
                        }

                        var won = cWorking.hp <= 0 && pWorking.hp > 0;

                        if (cWorking.hp <= 0) {
                            pushLog(log, '💀 ¡' + champStats.name + ' cae!', null, 0);
                            pushLog(log, '🏆 ¡VICTORIA!', null, 0);
                        } else if (pWorking.hp <= 0) {
                            pushLog(log, '💀 Perdiste el combate contra ' + champStats.name + '.', null, 0);
                        } else {
                            pushLog(log, '⏱️ El combate se extendió demasiado y terminó en empate.', null, 0);
                        }

                        return {
                            won: won,
                            log: log,
                            finalPlayerHp: Math.max(0, Math.round(pWorking.hp))
                        };
                    }

                    function applyBattleHpChange(finalPlayerHp, source) {
                        var netChange = finalPlayerHp - player.hp;

                        if (netChange < 0) {
                            var dmg = -netChange;
                            applyDamage(dmg, source, Math.ceil(dmg / 4));
                            return dmg;
                        } else if (netChange > 0) {
                            player.hp = Math.min(player.maxHp, player.hp + netChange);
                            updateHUD();
                            saveGame();
                        }
                        return 0;
                    }

                    
                    function renderBattleLog(log, won, champ, champHpStart, onComplete) {
    var container = document.getElementById('battle-log-container');
    if (!container) return;

    // Scroll al contenedor padre (.section-box) que contiene el título
    var sectionBox = container.closest('.section-box');
    if (sectionBox) {
        sectionBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    battleLogToken++;
    var myToken = battleLogToken;
    battleAnimating = true;

    container.innerHTML = '<div class="battle-log-lines" id="battle-log-lines"></div>';
    var linesEl = document.getElementById('battle-log-lines');

    var champStatsEl = document.getElementById('battle-champ-stats');
    if (champStatsEl) {
        champStatsEl.classList.add('visible');
        champStatsEl.innerHTML =
            '<div class="battle-stat-item">' + renderIconHTML(champ.icon, '') + ' ' + champ.name + ': <strong><span id="battle-live-champ-hp">' + champHpStart + '</span> / ' + champHpStart + '</strong> 🖤</div>';
    }

    var liveHp = player.hp;
    var liveChampHp = champHpStart;
    var index = 0;

    function revealNext() {
        if (myToken !== battleLogToken) return;

        if (index >= log.length) {
            var header = document.createElement('div');
            header.className = 'battle-log-header ' + (won ? 'won' : 'lost');
            header.innerHTML = renderIconHTML(champ.icon, '⚔️') + ' ' + (won ? '¡Victoria!' : 'Derrota');
            container.insertBefore(header, linesEl);
            container.scrollTop = container.scrollHeight;
            battleAnimating = false;
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        var entry = log[index];

        var lineEl = document.createElement('div');
        lineEl.className = 'battle-log-line battle-log-line-in';
        lineEl.textContent = entry.text;
        linesEl.appendChild(lineEl);
        container.scrollTop = container.scrollHeight;

        if (entry.target === 'player' && entry.delta !== 0) {
            liveHp = Math.max(0, Math.min(player.maxHp, liveHp + entry.delta));
            var hpEl = document.getElementById('battle-live-hp');
            if (hpEl) hpEl.textContent = liveHp;

            if (entry.delta < 0 && typeof shakeScreen === 'function') {
                shakeScreen();
            }
        }

        if (entry.target === 'champ' && entry.delta !== 0) {
            liveChampHp = Math.max(0, Math.min(champHpStart, liveChampHp + entry.delta));
            var champHpEl = document.getElementById('battle-live-champ-hp');
            if (champHpEl) champHpEl.textContent = liveChampHp;
        }

        index++;
        setTimeout(revealNext, BATTLE_LINE_DELAY_MS);
    }

    revealNext();
}

                    function fightChamp(champId) {
                        if (battleAnimating) {
                            showToast('Esperá a que termine el combate anterior.', 'warning', 'Batallas');
                            return;
                        }

                        if (player.gameOver) {
                            showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                            return;
                        }

                        if (player.hp <= 5) {
                            showToast('Tenés muy poco HP real. Curate antes de pelear.', 'warning', 'Batallas');
                            return;
                        }

                        var champ = CHAMPS.find(function (c) { return c.id === champId; });
                        if (!champ) return;

                        if (player.level < champ.levelRequired) {
                            showToast('Necesitás nivel ' + champ.levelRequired + ' para desafiar a ' + champ.name + '.', 'warning', 'Batallas');
                            return;
                        }

                        var playerStats = getPlayerCombatStatsVsChamp(champ);
                        var champStats = { name: champ.name, hp: champ.hp, attack: champ.attack, defense: champ.defense };
                        var result = runAutoBattle(playerStats, champStats);

                        renderBattlesTab();

                        renderBattleLog(result.log, result.won, champ, champStats.hp, function () {
                            var damageTaken = applyBattleHpChange(result.finalPlayerHp, 'Combate contra ' + champ.name);

                            if (player.gameOver) {
                                renderBattlesTab();
                                return;
                            }

                            if (result.won) {
                                gainRewards(champ.expReward, champ.goldReward, null, 'battle', '⚔️ Venciste a ' + champ.name, 'Combate en Batallas');
                                showToast('🏆 ¡Venciste a ' + champ.name + '! +' + champ.expReward + ' EXP, +' + champ.goldReward + ' ORO' + (damageTaken > 0 ? ' (-' + damageTaken + ' HP real)' : ''), 'success', 'Batallas');
                            } else {
                                addLogEntry('battle', '💀 Perdiste contra ' + champ.name, 'Sin recompensa, -' + damageTaken + ' HP real', 0, 0, null);
                                showToast('💀 Perdiste contra ' + champ.name + '. -' + damageTaken + ' HP real. Necesitás más ' + ATTR_LABELS_SHORT[champ.counterAttr] + '.', 'error', 'Batallas');
                            }

                            renderBattlesTab();
                        });
                    }

                    function startArenaMode() {
                        if (battleAnimating) {
                            showToast('Esperá a que termine el combate anterior.', 'warning', 'Arena');
                            return;
                        }

                        if (player.gameOver) {
                            showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
                            return;
                        }

                        if (player.hp <= 5) {
                            showToast('Tenés muy poco HP real. Curate antes de entrar a la Arena.', 'warning', 'Arena');
                            return;
                        }

                        var eligibleChamps = CHAMPS.filter(function (c) { return player.level >= c.levelRequired; });
                        if (eligibleChamps.length === 0) {
                            showToast('Todavía no tenés nivel suficiente para ningún champ.', 'warning', 'Arena');
                            return;
                        }

                        arenaMode = { active: true, streak: 0, championIndex: 0, totalExp: 0, totalGold: 0, eligibleChamps: eligibleChamps };

                        renderBattlesTab();
                        arenaFightNext();
                    }

                    function arenaFightNext() {
                        if (!arenaMode.active) return;

                        if (battleAnimating) {
                            showToast('Esperá a que termine el combate anterior.', 'warning', 'Arena');
                            return;
                        }

                        if (player.gameOver || player.hp <= 5) {
                            var stalled = arenaMode.streak;
                            arenaMode = { active: false, streak: 0, championIndex: 0, totalExp: 0, totalGold: 0, eligibleChamps: [] };
                            showToast('🏁 Tu HP real quedó demasiado bajo para seguir. Racha final: ' + stalled + '.', 'warning', 'Arena');
                            renderBattlesTab();
                            return;
                        }

                        var champ = arenaMode.eligibleChamps[arenaMode.championIndex % arenaMode.eligibleChamps.length];
                        var tierBonus = Math.floor(arenaMode.championIndex / arenaMode.eligibleChamps.length);
                        var champStats = {
                            name: champ.name + (tierBonus > 0 ? ' +' + tierBonus : ''),
                            attack: champ.attack + tierBonus * 4,
                            defense: champ.defense + tierBonus * 2,
                            hp: champ.hp + tierBonus * 20
                        };

                        var playerStats = getPlayerCombatStatsVsChamp(champ);
                        var result = runAutoBattle(playerStats, champStats);

                        renderBattlesTab();

                        renderBattleLog(result.log, result.won, { name: champStats.name, icon: champ.icon }, champStats.hp, function () {
                            var damageTaken = applyBattleHpChange(result.finalPlayerHp, 'Arena: combate contra ' + champStats.name);

                            if (player.gameOver) {
                                arenaMode = { active: false, streak: 0, championIndex: 0, totalExp: 0, totalGold: 0, eligibleChamps: [] };
                                renderBattlesTab();
                                return;
                            }

                            if (result.won) {
                                arenaMode.streak++;
                                arenaMode.championIndex++;

                                var expWin = champ.expReward + tierBonus * 4;
                                var goldWin = champ.goldReward + tierBonus * 3;
                                arenaMode.totalExp += expWin;
                                arenaMode.totalGold += goldWin;

                                gainRewards(expWin, goldWin, null, 'battle', '🔥 Arena: venciste a ' + champStats.name, 'Racha: ' + arenaMode.streak);
                                showToast('🔥 ¡Racha de ' + arenaMode.streak + '! +' + expWin + ' EXP, +' + goldWin + ' ORO' + (damageTaken > 0 ? ' (-' + damageTaken + ' HP real)' : ''), 'success', 'Arena');
                                renderBattlesTab();
                            } else {
                                var finalStreak = arenaMode.streak;
                                var finalExp = arenaMode.totalExp;
                                var finalGold = arenaMode.totalGold;
                                arenaMode = { active: false, streak: 0, championIndex: 0, totalExp: 0, totalGold: 0, eligibleChamps: [] };

                                addLogEntry('battle', '🔥 Racha de Arena terminada', finalStreak + ' victorias — +' + finalExp + ' EXP y +' + finalGold + ' ORO en total, -' + damageTaken + ' HP real', 0, 0, null);
                                showToast('🏁 Tu racha terminó en ' + finalStreak + ' victorias (-' + damageTaken + ' HP real). En total ganaste +' + finalExp + ' EXP y +' + finalGold + ' ORO — todo eso ya está guardado.', 'info', 'Arena');
                                renderBattlesTab();
                            }
                        });
                    }

                    function stopArenaMode() {
                        if (!arenaMode.active) return;

                        if (battleAnimating) {
                            showToast('Esperá a que termine el combate actual antes de retirarte.', 'warning', 'Arena');
                            return;
                        }

                        var finalStreak = arenaMode.streak;
                        var finalExp = arenaMode.totalExp;
                        var finalGold = arenaMode.totalGold;
                        arenaMode = { active: false, streak: 0, championIndex: 0, totalExp: 0, totalGold: 0, eligibleChamps: [] };

                        showToast('🏁 Te retiraste con ' + finalStreak + ' victorias. Ganancias ya guardadas: +' + finalExp + ' EXP, +' + finalGold + ' ORO.', 'info', 'Arena');
                        renderBattlesTab();
                    }

                    function renderBattlesTab() {
                        var container = document.getElementById('battles-champ-container');
                        var statsContainer = document.getElementById('battle-player-stats');
                        var arenaControls = document.getElementById('arena-controls');
                        if (!container) return;

                        if (statsContainer) {
                            statsContainer.innerHTML =
                                '<div class="battle-stat-item">❤️ Daniel: <strong><span id="battle-live-hp">' + player.hp + '</span> / ' + player.maxHp + '</strong></div>';
                        }

                        if (arenaControls) {
                            if (arenaMode.active) {
                                arenaControls.innerHTML =
                                    '<div class="arena-streak">🔥 Racha actual: ' + arenaMode.streak + ' — Acumulado: +' + arenaMode.totalExp + ' EXP, +' + arenaMode.totalGold + ' ORO</div>' +
                                    '<div style="display:flex; gap:10px;">' +
                                    '<button class="action-btn" onclick="arenaFightNext()" ' + (battleAnimating ? 'disabled' : '') + '>⚔️ Siguiente Combate</button>' +
                                    '<button class="action-btn small" onclick="stopArenaMode()" ' + (battleAnimating ? 'disabled' : '') + '>🏁 Retirarse (guardar ganancias)</button>' +
                                    '</div>';
                            } else {
                                arenaControls.innerHTML = '<button class="action-btn" onclick="startArenaMode()" ' + (battleAnimating ? 'disabled' : '') + '>🔥 Iniciar Modo Arena</button>';
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

                            html += '<div class="champ-card ' + (locked ? 'locked' : '') + '">' +
                                '<div class="champ-header">' +                                
                                '<span class="champ-name">' + champ.name + '</span>' +
                                '</div>' +
                                '<div class="entity-image-wrap"><img src="' + champ.image + '" class="entity-image" data-fallback-icon="' + champ.icon + '" onerror="handleImageError(this)" alt="' + champ.name + '"></div>' +
                                '<div class="champ-counter-label">🎯 Débil contra ' + ATTR_LABELS_SHORT[champ.counterAttr] + '</div>' +
                                '<div class="champ-stats">' +
                                '<span>🖤 ' + champ.hp + '</span>' +
                                '<span>⚔️ ' + champ.attack + '</span>' +
                                '<span>🛡️ ' + champ.defense + '</span>' +
                                '</div>' +
                                '<div class="champ-reward-label">🏆 +' + champ.expReward + ' EXP, +' + champ.goldReward + ' ORO</div>' +
                                (locked ? '<div class="champ-locked-label">🔒 Nivel ' + champ.levelRequired + ' requerido</div>' :
                                    '<button class="action-btn small" onclick="fightChamp(\'' + champ.id + '\')" ' + (arenaMode.active || battleAnimating ? 'disabled' : '') + '>Pelear</button>') +
                                '</div>';
                        });

                        container.innerHTML = html;
                    }

                    // ============================================================
