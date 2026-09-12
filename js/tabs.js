            // ===== FUNCIONES DE TABS =====
            // ============================================================

            function switchTab(tabId) {
                document.querySelectorAll('.tab-content').forEach(function (el) {
                    el.classList.remove('active');
                });
                document.querySelectorAll('.tab-btn, .mobile-menu-item').forEach(function (el) {
                    el.classList.remove('active');
                });

                var tabEl = document.getElementById(tabId);
                if (tabEl) tabEl.classList.add('active');

                var buttons = document.querySelectorAll('.tab-btn, .mobile-menu-item');
                for (var i = 0; i < buttons.length; i++) {
                    var btn = buttons[i];
                    var onclickAttr = btn.getAttribute('onclick');
                    if (onclickAttr && onclickAttr.indexOf("'" + tabId + "'") !== -1) {
                        btn.classList.add('active');
                    }
                }

                closeMobileMenu();

                if (tabId === 'tab-stats') renderStats();
                if (tabId === 'tab-trophies') renderTrophies();
                if (tabId === 'tab-bosses') renderBosses();
                if (tabId === 'tab-bestiary') renderBestiary();
                if (tabId === 'tab-battles') renderBattlesTab();
                if (tabId === 'tab-shop') renderShop();
                if (tabId === 'tab-logbook') renderLogbook();
                if (tabId === 'tab-story') renderStory();
                if (tabId === 'tab-inventory') renderInventory();
                if (tabId === 'tab-runas') {
                    renderDailyMissions();
                    renderRunes();
                    renderMissions();
                }
                if (tabId === 'tab-events') renderEvents();
                if (tabId === 'tab-config') {
                    loadDifficulty();
                }

                updatePet();
            }

            // ============================================================
            // ===== MENÚ HAMBURGUESA (MÓVIL) =====
            // ============================================================

            function toggleMobileMenu() {
                var menu = document.getElementById('mobile-menu');
                var overlay = document.getElementById('mobile-menu-overlay');
                var btn = document.getElementById('hamburger-btn');
                if (!menu || !overlay || !btn) return;
                menu.classList.toggle('open');
                overlay.classList.toggle('open');
                btn.classList.toggle('open');
            }

            function closeMobileMenu() {
                var menu = document.getElementById('mobile-menu');
                var overlay = document.getElementById('mobile-menu-overlay');
                var btn = document.getElementById('hamburger-btn');
                if (!menu || !overlay || !btn) return;
                menu.classList.remove('open');
                overlay.classList.remove('open');
                btn.classList.remove('open');
            }

            // ============================================================
            // ===== TOGGLE ATRIBUTOS / RUNAS (MÓVIL) =====
            // ============================================================

            function toggleMobilePanel(target) {
                var grid = document.querySelector('.character-runes-grid');
                if (!grid) return;
                if (target === 'runes') {
                    grid.classList.add('show-runes');
                } else {
                    grid.classList.remove('show-runes');
                }
            }

            // ============================================================
