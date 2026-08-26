                                // ===== FUNCIONES DE PAGINACIÓN =====
                                // ============================================================

                                function renderPagination(container, currentPage, totalPages, onPageChange) {
                                    if (totalPages <= 1) {
                                        container.innerHTML = '';
                                        return;
                                    }

                                    var html = '';
                                    html += '<button onclick="onPageChange(' + (currentPage - 1) + ')" ' + (currentPage <= 1 ? 'disabled' : '') + '>◀</button>';

                                    var maxVisible = 5;
                                    var startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                    var endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                    if (endPage - startPage < maxVisible - 1) {
                                        startPage = Math.max(1, endPage - maxVisible + 1);
                                    }

                                    if (startPage > 1) {
                                        html += '<button onclick="onPageChange(1)">1</button>';
                                        if (startPage > 2) html += '<span style="color:var(--text-muted);opacity:0.3;">…</span>';
                                    }

                                    for (var i = startPage; i <= endPage; i++) {
                                        html += '<button class="' + (i === currentPage ? 'active' : '') + '" onclick="onPageChange(' + i + ')">' + i + '</button>';
                                    }

                                    if (endPage < totalPages) {
                                        if (endPage < totalPages - 1) html += '<span style="color:var(--text-muted);opacity:0.3;">…</span>';
                                        html += '<button onclick="onPageChange(' + totalPages + ')">' + totalPages + '</button>';
                                    }

                                    html += '<button onclick="onPageChange(' + (currentPage + 1) + ')" ' + (currentPage >= totalPages ? 'disabled' : '') + '>▶</button>';
                                    html += '<span class="page-info">' + currentPage + '/' + totalPages + '</span>';

                                    container.innerHTML = html;
                                    container.querySelectorAll('button').forEach(function (btn) {
                                        var onclickAttr = btn.getAttribute('onclick');
                                        if (onclickAttr) {
                                            var match = onclickAttr.match(/onPageChange\((\d+)\)/);
                                            if (match) {
                                                var page = parseInt(match[1]);
                                                btn.onclick = function () { onPageChange(page); };
                                            }
                                        }
                                    });
                                }

                                // ============================================================
