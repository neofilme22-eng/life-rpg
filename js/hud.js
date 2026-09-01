            // ===== FUNCIONES DE HUD =====
            // ============================================================

            function updateHUD() {
                var levelEl = document.getElementById('hud-level');
                var goldEl = document.getElementById('hud-gold');
                var expEl = document.getElementById('hud-exp');
                var expMaxEl = document.getElementById('hud-exp-max');
                var expBarEl = document.getElementById('hud-exp-bar');
                var expPercentEl = document.getElementById('hud-exp-percent');
                var hpEl = document.getElementById('hud-hp');
                var hpMaxEl = document.getElementById('hud-hp-max');
                var hpBarEl = document.getElementById('hud-hp-bar');
                var hpPercentEl = document.getElementById('hud-hp-percent');

                if (levelEl) levelEl.innerText = player.level;
                if (goldEl) goldEl.innerText = player.gold;
                if (expEl) expEl.innerText = player.exp;
                if (expMaxEl) expMaxEl.innerText = player.expToNextLevel;
                var expPercent = (player.exp / player.expToNextLevel) * 100;
                if (expBarEl) expBarEl.style.width = Math.min(100, expPercent) + '%';
                if (expPercentEl) expPercentEl.innerText = Math.round(Math.min(100, expPercent)) + '%';

                if (hpEl) hpEl.innerText = player.hp;
                if (hpMaxEl) hpMaxEl.innerText = player.maxHp;
                var hpPercent = (player.hp / player.maxHp) * 100;
                if (hpBarEl) hpBarEl.style.width = Math.min(100, hpPercent) + '%';
                if (hpPercentEl) hpPercentEl.innerText = Math.round(Math.min(100, hpPercent)) + '%';

                renderAttributeRadar();
            }

            var RADAR_ATTRS = [
                { key: 'fuerza', icon: '⚔️' },
                { key: 'disciplina', icon: '🛡️' },
                { key: 'mente', icon: '🧠' },
                { key: 'creatividad', icon: '🎨' },
                { key: 'carrera', icon: '💼' },
                { key: 'finanzas', icon: '💰' },
                { key: 'social', icon: '👥' },
                { key: 'relaciones', icon: '💞' }
            ];

            function renderAttributeRadar() {
                var container = document.getElementById('attribute-radar-container');
                if (!container) return;

                var values = RADAR_ATTRS.map(function (a) { return player.attributes[a.key] || 1; });
                var maxRaw = Math.max.apply(null, values);
                var maxValue = Math.max(10, Math.ceil((maxRaw * 1.25) / 5) * 5);

                var size = 340;
                var center = size / 2;
                var maxRadius = 110;
                var labelRadius = 138;

                function pointAt(index, radius) {
                    var angle = (Math.PI / 4) * index - Math.PI / 2;
                    return {
                        x: center + radius * Math.cos(angle),
                        y: center + radius * Math.sin(angle)
                    };
                }

                var ringsSVG = '';
                [0.25, 0.5, 0.75, 1].forEach(function (pct) {
                    var pts = [];
                    for (var i = 0; i < 8; i++) {
                        var p = pointAt(i, maxRadius * pct);
                        pts.push(p.x.toFixed(1) + ',' + p.y.toFixed(1));
                    }
                    ringsSVG += '<polygon points="' + pts.join(' ') + '" class="radar-grid-ring" />';
                });

                var axesSVG = '';
                for (var i = 0; i < 8; i++) {
                    var p = pointAt(i, maxRadius);
                    axesSVG += '<line x1="' + center + '" y1="' + center + '" x2="' + p.x.toFixed(1) + '" y2="' + p.y.toFixed(1) + '" class="radar-axis-line" />';
                }

                var dataPts = [];
                var dotsSVG = '';
                for (var i = 0; i < 8; i++) {
                    var r = (values[i] / maxValue) * maxRadius;
                    var p = pointAt(i, r);
                    dataPts.push(p.x.toFixed(1) + ',' + p.y.toFixed(1));
                    dotsSVG += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.5" class="radar-data-dot" />';
                }
                var dataSVG = '<polygon points="' + dataPts.join(' ') + '" class="radar-data-polygon" />';

                // Dentro de renderAttributeRadar() - Reemplaza el bloque de labelsSVG
                    var labelsSVG = '';
                    for (var i = 0; i < 8; i++) {
                        var p = pointAt(i, labelRadius);
                        var anchor = 'middle';
                        if (p.x < center - 8) anchor = 'end';
                        else if (p.x > center + 8) anchor = 'start';

                        // ICONO (más grande)
                        labelsSVG += '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 10).toFixed(1) + '" class="radar-label-icon" text-anchor="' + anchor + '">' + RADAR_ATTRS[i].icon + '</text>';
                        // NOMBRE DEL ATRIBUTO (más grande)
                        var attrName = RADAR_ATTRS[i].key.charAt(0).toUpperCase() + RADAR_ATTRS[i].key.slice(1);
                        labelsSVG += '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 6).toFixed(1) + '" class="radar-label-name" text-anchor="' + anchor + '">' + attrName + '</text>';
                        // VALOR NUMÉRICO (más grande)
                        labelsSVG += '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 19).toFixed(1) + '" class="radar-label-value" text-anchor="' + anchor + '">' + values[i] + '</text>';
                    }

                container.innerHTML = '<svg viewBox="0 0 ' + size + ' ' + size + '" class="attribute-radar-svg">' +
                    ringsSVG + axesSVG + dataSVG + dotsSVG + labelsSVG +
                    '</svg>';
            }

            function gainRewards(expGain, goldGain, attrKey, logType, logTitle, logDetails) {
                if (player.gameOver) {
                    addLogEntry('damage', '⚠️ Intento de ganar EXP en Game Over', 'Ignorado', 0, 0, null);
                    return;
                }

                var mult = getDifficultyMultipliers();
                var totalExp = Math.floor((expGain + (player.expBoost || 0)) * mult.exp);
                var totalGold = Math.floor((goldGain + (player.goldBoost || 0)) * mult.gold);

                if (logType === 'daily' || logType === 'mission') {
                    if (player.missionExpPct) totalExp += Math.round(totalExp * (player.missionExpPct / 100));
                    if (player.missionGoldPct) totalGold += Math.round(totalGold * (player.missionGoldPct / 100));
                } else if (logType === 'boss') {
                    if (player.bossExpPct) totalExp += Math.round(totalExp * (player.bossExpPct / 100));
                } else if (logType === 'rune') {
                    if (player.runeExpPct) totalExp += Math.round(totalExp * (player.runeExpPct / 100));
                }

                player.exp += totalExp;
                player.gold += totalGold;

                var attrGain = null;
                if (attrKey && player.attributes[attrKey] !== undefined) {
                    player.attributes[attrKey]++;
                    attrGain = attrKey;
                }

                if (logType && logTitle) {
                    addLogEntry(logType, logTitle, logDetails || '', totalExp, totalGold, attrGain);
                }

                if (player.exp >= player.expToNextLevel) {
                    player.exp -= player.expToNextLevel;
                    player.level++;
                    player.expToNextLevel = Math.floor(player.expToNextLevel * (1.1 + (mult.levelCurve - 0.8) * 0.3));
                    player.maxHp = Math.floor(player.maxHp * 1.05);
                    player.hp = player.maxHp;
                    addLogEntry('level', '🎉 ¡Nivel ' + player.level + '!', 'Subida de nivel', 0, 0, null);
                    showToast('🎉 ¡Subiste a Nivel ' + player.level + '! HP restaurados.', 'success', 'Nivel');
                    checkAndUnlockTrophies();
                }
                updateHUD();
                saveGame();
                setTimeout(checkAndUnlockTrophies, 100);
                setTimeout(checkStoryUnlocks, 150);
                updatePet();
            }

            // ============================================================
