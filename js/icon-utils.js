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

            // ============================================================
            // ===== IMAGEN DE ENTIDAD (bosses, eventos, mazmorras, party) =====
            // ============================================================

            function renderEntityImageBlock(imageUrl, fallbackIcon, altText, sizeClass) {
                if (!imageUrl) return '';
                var safeUrl = String(imageUrl).replace(/"/g, '&quot;');
                var safeAlt = String(altText || '').replace(/"/g, '&quot;');
                var safeIcon = String(fallbackIcon || '⚔️').replace(/"/g, '&quot;');
                var wrapClass = 'entity-image-wrap' + (sizeClass ? ' ' + sizeClass : '');
                return '<div class="' + wrapClass + '"><img src="' + safeUrl + '" class="entity-image" data-fallback-icon="' + safeIcon + '" onerror="handleImageError(this)" alt="' + safeAlt + '"></div>';
            }

            function handleImageError(imgEl) {
                imgEl.style.display = 'none';
                var wrap = imgEl.parentElement;
                if (wrap && !wrap.querySelector('.entity-image-fallback')) {
                    var fallback = document.createElement('div');
                    fallback.className = 'entity-image-fallback';
                    fallback.innerHTML = imgEl.getAttribute('data-fallback-icon') || '⚔️';
                    wrap.appendChild(fallback);
                }
            }
