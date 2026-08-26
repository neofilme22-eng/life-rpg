            // ===== FUNCIONES DE TOAST Y MODAL =====
            // ============================================================

            function showToast(message, type, title) {
                type = type || 'info';
                title = title || '';
                var container = document.getElementById('toast-container');
                if (!container) return;

                var toast = document.createElement('div');
                toast.className = 'toast ' + type;

                var icons = {
                    success: '✅',
                    error: '❌',
                    warning: '⚠️',
                    info: 'ℹ️'
                };

                var icon = icons[type] || 'ℹ️';

                toast.innerHTML = `
        <div class="toast-title">${icon} ${title || type.toUpperCase()}</div>
        <div class="toast-message">${message}</div>
    `;

                container.appendChild(toast);

                setTimeout(function () {
                    toast.classList.add('show');
                }, 50);

                setTimeout(function () {
                    toast.classList.remove('show');
                    setTimeout(function () {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 400);
                }, 3500);
            }

            function showModal(icon, title, message, confirmText, callback, isDanger) {
                document.getElementById('modal-icon').textContent = icon || '⚠️';
                document.getElementById('modal-title').textContent = title || 'Confirmar';
                document.getElementById('modal-message').textContent = message || '¿Estás seguro?';

                var confirmBtn = document.getElementById('modal-confirm-btn');
                confirmBtn.textContent = confirmText || 'Confirmar';
                confirmBtn.className = 'modal-btn-confirm' + (isDanger ? ' danger' : '');

                modalCallback = callback || null;

                document.getElementById('modal-overlay').classList.add('active');
            }

            function closeModal() {
                document.getElementById('modal-overlay').classList.remove('active');
                modalCallback = null;
            }

            function confirmModal() {
                if (modalCallback) {
                    modalCallback();
                }
                closeModal();
            }

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    closeModal();
                }
            });

            document.getElementById('modal-overlay').addEventListener('click', function (e) {
                if (e.target === this) {
                    closeModal();
                }
            });

            // ============================================================
            // ===== EFECTO DE SACUDIDA =====
            // ============================================================

            function shakeScreen() {
                document.body.classList.add('shake');
                setTimeout(function () {
                    document.body.classList.remove('shake');
                }, 500);
            }

            // ============================================================
