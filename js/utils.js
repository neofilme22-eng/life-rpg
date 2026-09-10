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

// Dispara un pulso + partículas + texto flotante sobre cualquier tarjeta.
// options: { big: bool, particles: number }
function triggerFxBurst(cardEl, label, colorHex, options) {
    if (!cardEl) return;
    options = options || {};
    var big = !!options.big;
    var particleCount = options.particles || (big ? 14 : 8);

    cardEl.style.setProperty('--fx-rgb', hexToRgbString(colorHex));
    cardEl.classList.add('fx-burst');
    if (big) cardEl.classList.add('fx-burst-big');

    var floatEl = null;
    if (label) {
        floatEl = document.createElement('div');
        floatEl.className = 'fx-float-reward';
        floatEl.textContent = label;
        cardEl.appendChild(floatEl);
    }

    for (var i = 0; i < particleCount; i++) {
        var particle = document.createElement('div');
        particle.className = 'fx-particle';
        particle.style.left = (20 + Math.random() * 60) + '%';
        particle.style.top = (25 + Math.random() * 40) + '%';
        var angle = Math.random() * Math.PI * 2;
        var distance = (big ? 45 : 30) + Math.random() * (big ? 75 : 50);
        particle.style.setProperty('--px', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--py', (Math.sin(angle) * distance - 30) + 'px');
        cardEl.appendChild(particle);
        (function (p) {
            setTimeout(function () { if (p.parentNode) p.remove(); }, 950);
        })(particle);
    }

    setTimeout(function () {
        cardEl.classList.remove('fx-burst', 'fx-burst-big');
        if (floatEl && floatEl.parentNode) floatEl.remove();
    }, big ? 1450 : 1200);
}
