                                // ===== GAME OVER =====
                                // ============================================================

                                function showGameOverScreen() {
                                    var existing = document.querySelector('.game-over-overlay');
                                    if (existing) existing.remove();

                                    var overlay = document.createElement('div');
                                    overlay.className = 'game-over-overlay';
                                    overlay.id = 'game-over-overlay';

                                    var mult = getDifficultyMultipliers();
                                    var expPenalty = Math.floor(player.exp * 0.2 * mult.exp);
                                    var goldPenalty = Math.floor(player.gold * 0.15 * mult.gold);

                                    overlay.innerHTML = `
                <div class="game-over-box">
                    <h1>💀 GAME OVER</h1>
                    <div class="subtitle">El héroe ha caído en batalla...</div>
                    <div class="penalty-info">
                        <strong>Penalizaciones:</strong><br>
                        ⭐ Perderás ${expPenalty} EXP<br>
                        🟡 Perderás ${goldPenalty} ORO<br>
                        📉 Todos los atributos bajan 1 punto<br>
                        ${player.equipment.mascota ? '🐾 Tu mascota ha muerto' : ''}
                        <br><br>
                        <em style="font-size:0.7rem;">La dificultad afecta las penalizaciones.</em>
                    </div>
                    <button class="game-over-btn" onclick="respawnPlayer()">🔥 ¡Reiniciar!</button>
                    <button class="game-over-btn secondary" onclick="resetFullGame()">🗑️ Borrar Partida</button>
                </div>
            `;

                                    document.body.appendChild(overlay);
                                    overlay.style.display = 'flex';
                                }

                                function respawnPlayer() {
                                    var mult = getDifficultyMultipliers();
                                    var expPenalty = Math.floor(player.exp * 0.2 * mult.exp);
                                    var goldPenalty = Math.floor(player.gold * 0.15 * mult.gold);

                                    player.exp = Math.max(0, player.exp - expPenalty);
                                    player.gold = Math.max(0, player.gold - goldPenalty);

                                    for (var key in player.attributes) {
                                        player.attributes[key] = Math.max(1, player.attributes[key] - 1);
                                    }

                                    player.hp = Math.floor(player.maxHp * 0.5);
                                    player.gameOver = false;

                                    if (player.equipment.mascota) {
                                        player.petHealth = Math.floor(player.petMaxHealth * 0.5);
                                    }

                                    var overlay = document.getElementById('game-over-overlay');
                                    if (overlay) overlay.remove();

                                    updateHUD();
                                    saveGame();
                                    renderInventory();
                                    updatePet();

                                    addLogEntry('level', '🔥 ¡El héroe ha renacido!', 'Penalizaciones aplicadas', 0, 0, null);
                                    showToast('🔥 ¡Has renacido! Penalizaciones aplicadas.', 'success', 'Renacer');
                                    checkAndUnlockTrophies();
                                }

                                // ============================================================
