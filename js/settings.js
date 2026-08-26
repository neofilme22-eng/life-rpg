            // ===== FUNCIONES DE CONFIGURACIÓN =====
            // ============================================================

            function applyDifficulty(difficulty) {
                currentDifficulty = difficulty;
                var descs = {
                    easy: 'Fácil: Más EXP y ORO, menos EXP para subir de nivel. Menos daño recibido.',
                    normal: 'Normal: Experiencia balanceada, estándar.',
                    hard: 'Difícil: Menos EXP y ORO, más EXP para subir de nivel. Más daño recibido.',
                    expert: 'Experto: Recompensas reducidas, subir de nivel es muy costoso. Daño significativo.'
                };
                var descEl = document.getElementById('difficulty-desc');
                if (descEl) descEl.textContent = descs[difficulty] || descs.normal;
                localStorage.setItem('life_rpg_difficulty', difficulty);
                saveGame();
            }

            function getDifficultyMultipliers() {
                var multipliers = {
                    easy: { exp: 1.5, gold: 1.5, levelCurve: 0.7, runeExp: 1.3, damageMod: 0.6 },
                    normal: { exp: 1.0, gold: 1.0, levelCurve: 1.0, runeExp: 1.0, damageMod: 1.0 },
                    hard: { exp: 0.7, gold: 0.7, levelCurve: 1.4, runeExp: 0.8, damageMod: 1.4 },
                    expert: { exp: 0.5, gold: 0.5, levelCurve: 1.8, runeExp: 0.6, damageMod: 1.8 }
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

            function applyTheme(theme) {
                var root = document.documentElement;
                var themes = {
                    dark: {
                        '--bg-color': '#0f172a',
                        '--card-bg': '#1e293b',
                        '--text': '#f8fafc',
                        '--text-muted': '#94a3b8',
                        '--hud-border': 'rgba(251,191,36,0.15)',
                        '--card-border': 'rgba(255,255,255,0.06)',
                        '--primary': '#38bdf8'
                    },
                    light: {
                        '--bg-color': '#f1f5f9',
                        '--card-bg': '#e2e8f0',
                        '--text': '#0f172a',
                        '--text-muted': '#475569',
                        '--hud-border': 'rgba(15,23,42,0.1)',
                        '--card-border': 'rgba(15,23,42,0.08)',
                        '--primary': '#0ea5e9'
                    },
                    golden: {
                        '--bg-color': '#1a1508',
                        '--card-bg': '#2a1f0a',
                        '--text': '#fbbf24',
                        '--text-muted': '#d97706',
                        '--hud-border': 'rgba(251,191,36,0.2)',
                        '--card-border': 'rgba(251,191,36,0.1)',
                        '--primary': '#fbbf24'
                    },
                    night: {
                        '--bg-color': '#0a0a1a',
                        '--card-bg': '#111128',
                        '--text': '#c4b5fd',
                        '--text-muted': '#7c6f9a',
                        '--hud-border': 'rgba(196,181,253,0.15)',
                        '--card-border': 'rgba(196,181,253,0.08)',
                        '--primary': '#a855f7'
                    },
                    emerald: {
                        '--bg-color': '#0a1a0a',
                        '--card-bg': '#0f2a0f',
                        '--text': '#4ade80',
                        '--text-muted': '#22c55e',
                        '--hud-border': 'rgba(74,222,128,0.15)',
                        '--card-border': 'rgba(74,222,128,0.08)',
                        '--primary': '#22c55e'
                    },
                    royal: {
                        '--bg-color': '#1a0a1a',
                        '--card-bg': '#2a0f2a',
                        '--text': '#f472b6',
                        '--text-muted': '#ec4899',
                        '--hud-border': 'rgba(244,114,182,0.15)',
                        '--card-border': 'rgba(244,114,182,0.08)',
                        '--primary': '#ec4899'
                    }
                };

                var t = themes[theme] || themes.dark;
                for (var key in t) {
                    if (t.hasOwnProperty(key)) {
                        root.style.setProperty(key, t[key]);
                    }
                }

                localStorage.setItem('life_rpg_theme', theme);
            }

            function loadTheme() {
                var saved = localStorage.getItem('life_rpg_theme');
                if (saved) {
                    var select = document.getElementById('config-theme');
                    if (select) select.value = saved;
                    applyTheme(saved);
                }
            }

            // ============================================================
