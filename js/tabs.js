            // ===== FUNCIONES DE TABS =====
            // ============================================================

            function switchTab(tabId) {
                document.querySelectorAll('.tab-content').forEach(function (el) {
                    el.classList.remove('active');
                });
                document.querySelectorAll('.tab-btn').forEach(function (el) {
                    el.classList.remove('active');
                });

                var tabEl = document.getElementById(tabId);
                if (tabEl) tabEl.classList.add('active');

                var buttons = document.querySelectorAll('.tab-btn');
                for (var i = 0; i < buttons.length; i++) {
                    var btn = buttons[i];
                    var onclickAttr = btn.getAttribute('onclick');
                    if (onclickAttr && onclickAttr.indexOf(tabId) !== -1) {
                        btn.classList.add('active');
                        break;
                    }
                }

                if (tabId === 'tab-stats') renderStats();
                if (tabId === 'tab-trophies') renderTrophies();
                if (tabId === 'tab-bosses') {
                    renderBosses();
                    renderBestiary();
                }
                if (tabId === 'tab-battles') renderBattlesTab();
                if (tabId === 'tab-shop') renderShop();
                if (tabId === 'tab-logbook') renderLogbook();
                if (tabId === 'tab-story') renderStory();
                if (tabId === 'tab-flock') renderFlock();
                if (tabId === 'tab-inventory') renderInventory();
                if (tabId === 'tab-runas') {
                    renderDailyMissions();
                    renderRunes();
                    renderMissions();
                }
                if (tabId === 'tab-events') renderEvents();
                if (tabId === 'tab-config') {
                    loadTheme();
                    loadDifficulty();
                }

                updatePet();
            }

            // ============================================================
