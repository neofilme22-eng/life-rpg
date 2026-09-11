                                // ===== FUNCIÓN DE ESCAPE HTML =====
                                // ============================================================

                                function escapeHtml(text) {
                                    if (!text) return '';
                                    return text
                                        .replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        .replace(/"/g, "&quot;")
                                        .replace(/'/g, "&#039;");
                                }

                                // ============================================================
                                // ===== LISTA GENÉRICA DE ARCHIVOS JSON IMPORTADOS =====
                                // ============================================================

                                // packs: [{ id, name, count }]. onDelete recibe el id del paquete.
                                function renderImportPackList(containerId, packs, onDelete) {
                                    var container = document.getElementById(containerId);
                                    if (!container) return;

                                    if (!packs || packs.length === 0) {
                                        container.innerHTML = '<div class="config-import-empty">Sin archivos importados.</div>';
                                        return;
                                    }

                                    container.innerHTML = '';
                                    packs.forEach(function (p) {
                                        var item = document.createElement('div');
                                        item.className = 'config-import-item';

                                        var nameSpan = document.createElement('span');
                                        nameSpan.className = 'config-import-name';
                                        nameSpan.textContent = p.name;

                                        var countSpan = document.createElement('span');
                                        countSpan.className = 'config-import-count';
                                        countSpan.textContent = ' (' + p.count + ')';
                                        nameSpan.appendChild(countSpan);

                                        var removeBtn = document.createElement('button');
                                        removeBtn.className = 'config-import-remove';
                                        removeBtn.title = 'Eliminar';
                                        removeBtn.textContent = '✕';
                                        removeBtn.onclick = function () { onDelete(p.id); };

                                        item.appendChild(nameSpan);
                                        item.appendChild(removeBtn);
                                        container.appendChild(item);
                                    });
                                }

                                // ============================================================

// ============================================================
// ===== MOTOR GENÉRICO DE EFECTOS (partículas / pulso) =====
// ============================================================

function hexToRgbString(hex) {
    if (!hex) return '251,191,36';
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(function (c) { return c + c; }).join('');
    }
    var num = parseInt(hex, 16);
    if (isNaN(num)) return '251,191,36';
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255].join(',');
}

// Animaciones y partículas desactivadas (consumían mucho RAM/CPU en móvil).
// Se deja la función como no-op para no romper a quienes la llaman.
function triggerFxBurst(cardEl, label, colorHex, options) {
    return;
}
