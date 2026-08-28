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

                for (var key in player.attributes) {
                    var el = document.getElementById('attr-' + key);
                    if (el) el.innerText = player.attributes[key];

                    var barEl = document.getElementById('attr-' + key + '-bar');
                    if (barEl) {
                        var progress = Math.min(100, (player.attributes[key] / 20) * 100);
                        barEl.style.width = progress + '%';
                    }
                }
            }

            function gainRewards(expGain, goldGain, attrKey, logType, logTitle, logDetails) {
                if (player.gameOver) {
                    addLogEntry('damage', '⚠️ Intento de ganar EXP en Game Over', 'Ignorado', 0, 0, null);
                    return;
                }

                var mult = getDifficultyMultipliers();
                var totalExp = Math.floor((expGain + (player.expBoost || 0)) * mult.exp);
                var totalGold = Math.floor((goldGain + (player.goldBoost || 0)) * mult.gold);

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
