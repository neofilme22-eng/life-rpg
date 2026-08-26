            // ============================================================
            // ===== UTILIDADES DE ÍCONOS PERSONALIZADOS (EMOJI o URL) =====
            // ============================================================

            function isIconUrl(icon) {
                if (!icon || typeof icon !== 'string') return false;
                var trimmed = icon.trim();
                return /^(https?:\/\/|data:image\/)/i.test(trimmed);
            }

            function renderIconHTML(icon, fallback) {
                var value = (icon && String(icon).trim()) || fallback || '';
                if (isIconUrl(value)) {
                    var safeUrl = value.replace(/"/g, '&quot;');
                    return '<img src="' + safeUrl + '" class="custom-icon-img" alt="ícono" onerror="this.outerHTML=\'' + (fallback || '❔') + '\';">';
                }
                return value;
            }
