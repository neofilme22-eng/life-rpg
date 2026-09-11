            // ===== FUNCIONES DE CONFIGURACIÓN =====
            // ============================================================

            function applyDifficulty(difficulty) {
                currentDifficulty = difficulty;
                var descs = {
                    easy: 'Fácil: +60% EXP y ORO, subes de nivel mucho más rápido. Recibes la mitad del daño normal.',
                    normal: 'Normal: Experiencia balanceada, estándar.',
                    hard: 'Difícil: -35% EXP y ORO, subir de nivel cuesta bastante más. Recibes 60% más daño.',
                    expert: 'Experto: -60% EXP y ORO, subir de nivel es muy costoso. Recibes más del doble de daño.'
                };
                var descEl = document.getElementById('difficulty-desc');
                if (descEl) descEl.textContent = descs[difficulty] || descs.normal;
                localStorage.setItem('life_rpg_difficulty', difficulty);
                saveGame();
            }

            function getDifficultyMultipliers() {
                // Valores reconfigurados para que cada nivel se sienta claramente
                // distinto: easy avanza rápido y protege HP, expert exige mucho más
                // por cada recompensa y castiga el daño recibido.
                var multipliers = {
                    easy: { exp: 1.6, gold: 1.6, levelCurve: 0.65, damageMod: 0.5 },
                    normal: { exp: 1.0, gold: 1.0, levelCurve: 1.0, damageMod: 1.0 },
                    hard: { exp: 0.65, gold: 0.65, levelCurve: 1.45, damageMod: 1.6 },
                    expert: { exp: 0.4, gold: 0.4, levelCurve: 2.0, damageMod: 2.2 }
                };
                return multipliers[currentDifficulty] || multipliers.normal;
            }

            function loadDifficulty() {
                var saved = localStorage.getItem('life_rpg_difficulty');
                if (saved) {
                    currentDifficulty = saved;
                    var select = document.getElementById('config-difficulty');
                    if (select) select.value = saved;
                    applyDifficulty(saved);
                }
            }

            // ============================================================
