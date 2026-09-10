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

            function applyTheme(theme) {
                var root = document.documentElement;
                var themes = {
                    dark: {
                        '--bg-color': '#0f172a', '--card-bg': '#1e293b', '--text': '#f8fafc', '--text-muted': '#94a3b8',
                        '--primary': '#38bdf8', '--accent': '#a855f7', '--success': '#22c55e', '--danger': '#ef4444', '--warning': '#f59e0b',
                        '--rune-cyan': '#06b6d4', '--rune-border': '#2dd4bf',
                        '--gold': '#fbbf24', '--gold-dark': '#d97706', '--gold-glow': 'rgba(251,191,36,0.15)',
                        '--boss-red': '#dc2626',
                        '--sky-blue': '#7dd3fc', '--sky-dark': '#0ea5e9', '--sky-glow': 'rgba(56,189,248,0.15)',
                        '--sanctuary-gold': '#fbbf24', '--sanctuary-gold-dark': '#d97706', '--sanctuary-silver': '#e2e8f0', '--sanctuary-white': '#f8fafc', '--sanctuary-glow': 'rgba(251,191,36,0.15)',
                        '--hud-border': 'rgba(251,191,36,0.15)', '--hud-glow': 'rgba(251,191,36,0.05)',
                        '--card-border': 'rgba(255,255,255,0.06)', '--card-glow-start': 'rgba(251,191,36,0.02)', '--card-glow-end': 'rgba(56,189,248,0.02)',
                        '--romance': '#ec4899', '--social': '#8b5cf6', '--work': '#f59e0b', '--family': '#22c55e',
                        '--event-gold': '#fbbf24', '--event-purple': '#a855f7', '--event-blue': '#38bdf8',
                        '--dungeon-red': '#dc2626', '--dungeon-orange': '#f59e0b'
                    },
                    light: {
                        '--bg-color': '#f1f5f9', '--card-bg': '#e2e8f0', '--text': '#0f172a', '--text-muted': '#475569',
                        '--primary': '#0284c7', '--accent': '#7c3aed', '--success': '#16a34a', '--danger': '#dc2626', '--warning': '#d97706',
                        '--rune-cyan': '#0891b2', '--rune-border': '#0d9488',
                        '--gold': '#b45309', '--gold-dark': '#92400e', '--gold-glow': 'rgba(180,83,9,0.12)',
                        '--boss-red': '#b91c1c',
                        '--sky-blue': '#0284c7', '--sky-dark': '#075985', '--sky-glow': 'rgba(2,132,199,0.12)',
                        '--sanctuary-gold': '#b45309', '--sanctuary-gold-dark': '#92400e', '--sanctuary-silver': '#94a3b8', '--sanctuary-white': '#fffbeb', '--sanctuary-glow': 'rgba(180,83,9,0.10)',
                        '--hud-border': 'rgba(15,23,42,0.1)', '--hud-glow': 'rgba(15,23,42,0.04)',
                        '--card-border': 'rgba(15,23,42,0.08)', '--card-glow-start': 'rgba(180,83,9,0.03)', '--card-glow-end': 'rgba(2,132,199,0.03)',
                        '--romance': '#db2777', '--social': '#7c3aed', '--work': '#d97706', '--family': '#16a34a',
                        '--event-gold': '#b45309', '--event-purple': '#7c3aed', '--event-blue': '#0284c7',
                        '--dungeon-red': '#b91c1c', '--dungeon-orange': '#c2410c'
                    },
                    golden: {
                        '--bg-color': '#1a1508', '--card-bg': '#2a1f0a', '--text': '#fbbf24', '--text-muted': '#d97706',
                        '--primary': '#fbbf24', '--accent': '#f59e0b', '--success': '#84cc16', '--danger': '#f87171', '--warning': '#fb923c',
                        '--rune-cyan': '#eab308', '--rune-border': '#ca8a04',
                        '--gold': '#fde047', '--gold-dark': '#ca8a04', '--gold-glow': 'rgba(253,224,71,0.2)',
                        '--boss-red': '#dc2626',
                        '--sky-blue': '#fcd34d', '--sky-dark': '#d97706', '--sky-glow': 'rgba(252,211,77,0.2)',
                        '--sanctuary-gold': '#fde047', '--sanctuary-gold-dark': '#ca8a04', '--sanctuary-silver': '#e7c98a', '--sanctuary-white': '#fffbeb', '--sanctuary-glow': 'rgba(253,224,71,0.2)',
                        '--hud-border': 'rgba(251,191,36,0.25)', '--hud-glow': 'rgba(251,191,36,0.08)',
                        '--card-border': 'rgba(251,191,36,0.12)', '--card-glow-start': 'rgba(253,224,71,0.05)', '--card-glow-end': 'rgba(245,158,11,0.05)',
                        '--romance': '#f472b6', '--social': '#fbbf24', '--work': '#f59e0b', '--family': '#84cc16',
                        '--event-gold': '#fde047', '--event-purple': '#f59e0b', '--event-blue': '#fcd34d',
                        '--dungeon-red': '#dc2626', '--dungeon-orange': '#fb923c'
                    },
                    night: {
                        '--bg-color': '#0a0a1a', '--card-bg': '#111128', '--text': '#c4b5fd', '--text-muted': '#7c6f9a',
                        '--primary': '#a855f7', '--accent': '#c084fc', '--success': '#4ade80', '--danger': '#f87171', '--warning': '#fbbf24',
                        '--rune-cyan': '#818cf8', '--rune-border': '#6366f1',
                        '--gold': '#c4b5fd', '--gold-dark': '#7c6f9a', '--gold-glow': 'rgba(196,181,253,0.15)',
                        '--boss-red': '#dc2626',
                        '--sky-blue': '#a78bfa', '--sky-dark': '#7c3aed', '--sky-glow': 'rgba(167,139,250,0.15)',
                        '--sanctuary-gold': '#c4b5fd', '--sanctuary-gold-dark': '#7c6f9a', '--sanctuary-silver': '#ddd6fe', '--sanctuary-white': '#ede9fe', '--sanctuary-glow': 'rgba(196,181,253,0.15)',
                        '--hud-border': 'rgba(196,181,253,0.15)', '--hud-glow': 'rgba(196,181,253,0.06)',
                        '--card-border': 'rgba(196,181,253,0.08)', '--card-glow-start': 'rgba(196,181,253,0.03)', '--card-glow-end': 'rgba(129,140,248,0.03)',
                        '--romance': '#f472b6', '--social': '#a855f7', '--work': '#fbbf24', '--family': '#4ade80',
                        '--event-gold': '#c4b5fd', '--event-purple': '#a855f7', '--event-blue': '#818cf8',
                        '--dungeon-red': '#dc2626', '--dungeon-orange': '#fb923c'
                    },
                    emerald: {
                        '--bg-color': '#0a1a0a', '--card-bg': '#0f2a0f', '--text': '#4ade80', '--text-muted': '#22c55e',
                        '--primary': '#22c55e', '--accent': '#4ade80', '--success': '#4ade80', '--danger': '#f87171', '--warning': '#facc15',
                        '--rune-cyan': '#2dd4bf', '--rune-border': '#14b8a6',
                        '--gold': '#a3e635', '--gold-dark': '#65a30d', '--gold-glow': 'rgba(163,230,53,0.15)',
                        '--boss-red': '#dc2626',
                        '--sky-blue': '#6ee7b7', '--sky-dark': '#059669', '--sky-glow': 'rgba(110,231,183,0.15)',
                        '--sanctuary-gold': '#a3e635', '--sanctuary-gold-dark': '#65a30d', '--sanctuary-silver': '#bbf7d0', '--sanctuary-white': '#ecfdf5', '--sanctuary-glow': 'rgba(163,230,53,0.15)',
                        '--hud-border': 'rgba(74,222,128,0.15)', '--hud-glow': 'rgba(74,222,128,0.05)',
                        '--card-border': 'rgba(74,222,128,0.08)', '--card-glow-start': 'rgba(163,230,53,0.02)', '--card-glow-end': 'rgba(45,212,191,0.02)',
                        '--romance': '#f472b6', '--social': '#2dd4bf', '--work': '#facc15', '--family': '#4ade80',
                        '--event-gold': '#a3e635', '--event-purple': '#4ade80', '--event-blue': '#6ee7b7',
                        '--dungeon-red': '#dc2626', '--dungeon-orange': '#f59e0b'
                    },
                    royal: {
                        '--bg-color': '#1a0a1a', '--card-bg': '#2a0f2a', '--text': '#f472b6', '--text-muted': '#ec4899',
                        '--primary': '#ec4899', '--accent': '#f472b6', '--success': '#4ade80', '--danger': '#f87171', '--warning': '#fbbf24',
                        '--rune-cyan': '#e879f9', '--rune-border': '#d946ef',
                        '--gold': '#fbcfe8', '--gold-dark': '#db2777', '--gold-glow': 'rgba(251,207,232,0.15)',
                        '--boss-red': '#dc2626',
                        '--sky-blue': '#f0abfc', '--sky-dark': '#c026d3', '--sky-glow': 'rgba(240,171,252,0.15)',
                        '--sanctuary-gold': '#fbcfe8', '--sanctuary-gold-dark': '#db2777', '--sanctuary-silver': '#fce7f3', '--sanctuary-white': '#fdf2f8', '--sanctuary-glow': 'rgba(251,207,232,0.15)',
                        '--hud-border': 'rgba(244,114,182,0.15)', '--hud-glow': 'rgba(244,114,182,0.05)',
                        '--card-border': 'rgba(244,114,182,0.08)', '--card-glow-start': 'rgba(251,207,232,0.02)', '--card-glow-end': 'rgba(232,121,249,0.02)',
                        '--romance': '#f472b6', '--social': '#e879f9', '--work': '#fbbf24', '--family': '#4ade80',
                        '--event-gold': '#fbcfe8', '--event-purple': '#e879f9', '--event-blue': '#f0abfc',
                        '--dungeon-red': '#dc2626', '--dungeon-orange': '#fb923c'
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
