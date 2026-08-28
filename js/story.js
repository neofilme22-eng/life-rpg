                    // ===== MODO HISTORIA =====
                    // ============================================================

                    const STORY_CHAPTERS = [
                        {
                            id: 'ch_01_niebla',
                            icon: '🌧️',
                            title: 'La Ciudad Gris',
                            check: function (p) { return true; },
                            text: 'La ciudad no duerme: simplemente deja de fingir que está despierta. Lloviznaba otra vez — siempre llovizna, eso ya no sorprende a nadie. Caminaste la misma cuadra de siempre, con el mismo paso cansado, cuando algo cambió: no el cielo, no la calle. Vos. Encendiste un cigarrillo que no ibas a terminar y te preguntaste, por primera vez en mucho tiempo, si mañana iba a ser distinto. No tenías la respuesta. Caminaste igual.'
                        },
                        {
                            id: 'ch_02_grieta',
                            icon: '🚬',
                            title: 'Grietas en el Asfalto',
                            check: function (p) { return p.level >= 2; },
                            text: 'Nadie te dijo que las cosas iban a cambiar de golpe. No fue así. Fue una grieta en el asfalto que ya estaba ahí, que quizás siempre estuvo ahí, y que por primera vez decidiste mirar en vez de esquivar. El barman de siempre te sirvió el trago de siempre, sin preguntar nada, como cada noche. Pero esta vez, en su silencio, algo se sintió distinto — como si hasta él supiera que algo se estaba moviendo, muy despacio, debajo de la rutina.'
                        },
                        {
                            id: 'ch_03_primer_trofeo',
                            icon: '🥃',
                            title: 'Ganar sin Testigos',
                            check: function (p) { return (p.trophies || []).length >= 1; },
                            text: 'Nadie te aplaudió. No hubo flashes ni nadie esperando en la puerta. Ganaste solo, en silencio, como se gana casi todo lo que de verdad importa. Te sentaste en la barra y no dijiste nada, porque no había nada que decir. Pero por dentro algo pesaba distinto. El mundo no cambió. Cambiaste vos, un poco. Y esta noche, con eso alcanza.'
                        },
                        {
                            id: 'ch_04_boss',
                            icon: '🔫',
                            title: 'El Enemigo Tenía Tu Cara',
                            check: function (p) { return (p.bosses || []).filter(function (b) { return b.defeated; }).length >= 1; },
                            text: 'El que acabás de vencer no llevaba máscara ni cuchillo. Llevaba tu propia excusa de siempre: "mañana", "después", "hoy no". Y aun así cayó. En esta ciudad los enemigos de verdad no dan la cara — se disfrazan de cansancio, de rutina, de un techo bajo que nunca termina de aplastarte. Hoy ganaste una ronda. La ciudad no lo va a anunciar. Vos ya lo sabés, y con eso alcanza.'
                        },
                        {
                            id: 'ch_05_runa',
                            icon: '✒️',
                            title: 'El Mismo Gesto, Otra Vez',
                            check: function (p) { return (p.rawRunes || []).length >= 1; },
                            text: 'No hiciste nada extraordinario. Hiciste lo mismo que ayer, y probablemente lo vas a repetir mañana. Eso es lo que nadie cuenta del sentido: no aparece en el golpe de suerte ni en el gesto heroico, aparece en la repetición elegida — volver a hacer lo mismo, no por inercia, sino por decisión propia. En esta ciudad gris, un hábito sostenido pesa más que cualquier golpe de efecto.'
                        },
                        {
                            id: 'ch_06_nivel5',
                            icon: '🕰️',
                            title: 'Ya no Sos el que Entró',
                            check: function (p) { return p.level >= 5; },
                            text: 'El barman te mira distinto ahora. No dice nada — nunca dice nada — pero deja de servirte sin preguntar, porque algo en tu forma de sentarte cambió. Vos tampoco sos el mismo que entró la primera vez a este bar sin nombre. Nadie escribe crónicas de gente como vos. Pero si alguien lo hiciera, este sería el capítulo en el que dejás de esperar que las cosas cambien, y empezás, despacio, a cambiarlas vos mismo.'
                        },
                        {
                            id: 'ch_07_vinculo',
                            icon: '🚋',
                            title: 'Nadie Cruza Solo esta Ciudad',
                            check: function (p) {
                                return (p.flock || []).some(function (f) {
                                    return f.status === 'friend' || f.status === 'romance' || f.status === 'partner';
                                });
                            },
                            text: 'Alguien empezó a caminar cerca. No de golpe — en esta ciudad nada pasa de golpe — sino de a poco, entre silencios compartidos y algún café que se enfrió sin que nadie lo notara. Siempre creíste que atravesar esto era cosa de un solo hombre, solo, con el cuello del abrigo levantado. Es mentira, o al menos no es la única verdad. A veces se cruza más fácil cuando alguien camina un paso atrás, sin apurarte, pero ahí.'
                        },
                        {
                            id: 'ch_08_nivel10',
                            icon: '🖤',
                            title: 'Lo que Sabe Quien Llegó Hasta Acá',
                            check: function (p) { return p.level >= 10; },
                            text: 'Diez rondas no son un número. Son diez veces que elegiste seguir caminando en vez de sentarte a esperar que la lluvia pare. Esta ciudad no tiene final feliz garantizado — quizás ninguna ciudad lo tiene — pero eso ya no te asusta como antes. Aprendiste algo que no se aprende leyendo: el sentido no te lo da la ciudad, no te lo da nadie. Te lo das vos, cada vez que elegís seguir. — Continúa, ronda a ronda, mientras sigas caminando.'
                        }
                    ];

                    function checkStoryUnlocks() {
                        var unlockedAny = false;

                        STORY_CHAPTERS.forEach(function (chapter) {
                            if (player.storyChapters.indexOf(chapter.id) !== -1) return;

                            if (chapter.check(player)) {
                                player.storyChapters.push(chapter.id);
                                unlockedAny = true;

                                setTimeout(function () {
                                    addLogEntry('story', '📖 Nuevo capítulo: "' + chapter.title + '"', 'Modo Historia', 0, 0, null);
                                    showToast('📖 Nuevo capítulo desbloqueado: "' + chapter.title + '"', 'success', 'Historia');
                                }, 500);
                            }
                        });

                        if (unlockedAny) {
                            saveGame();
                            renderStory();
                        }
                    }

                    function toggleStoryChapter(id) {
                        var body = document.getElementById('story-body-' + id);
                        var card = document.getElementById('story-card-' + id);
                        if (!body || !card) return;

                        var isOpen = card.classList.contains('open');

                        if (isOpen) {
                            card.classList.remove('open');
                        } else {
                            card.classList.add('open');
                            if (player.storyRead.indexOf(id) === -1) {
                                player.storyRead.push(id);
                                saveGame();
                                var badge = document.getElementById('story-new-' + id);
                                if (badge) badge.remove();
                            }
                        }
                    }

                    function renderStory() {
                        var container = document.getElementById('story-container');
                        var progressEl = document.getElementById('story-progress');
                        if (!container) return;

                        var unlockedCount = player.storyChapters.length;
                        var totalCount = STORY_CHAPTERS.length;
                        if (progressEl) progressEl.textContent = unlockedCount + ' / ' + totalCount + ' capítulos';

                        var html = '';
                        STORY_CHAPTERS.forEach(function (chapter, index) {
                            var isUnlocked = player.storyChapters.indexOf(chapter.id) !== -1;
                            var isRead = player.storyRead.indexOf(chapter.id) !== -1;

                            if (!isUnlocked) {
                                html += '<div class="story-card locked">' +
                                    '<div class="story-header">' +
                                    '<span class="story-chapter-num">' + (index + 1) + '</span>' +
                                    '<span class="story-icon">🔒</span>' +
                                    '<span class="story-title">???</span>' +
                                    '</div>' +
                                    '</div>';
                                return;
                            }

                            html += '<div class="story-card" id="story-card-' + chapter.id + '">' +
                                '<div class="story-header" onclick="toggleStoryChapter(\'' + chapter.id + '\')">' +
                                '<span class="story-chapter-num">' + (index + 1) + '</span>' +
                                '<span class="story-icon">' + renderIconHTML(chapter.icon, '📖') + '</span>' +
                                '<span class="story-title">' + chapter.title + '</span>' +
                                (!isRead ? '<span class="story-new-badge" id="story-new-' + chapter.id + '">nuevo</span>' : '') +
                                '<span class="story-chevron">▾</span>' +
                                '</div>' +
                                '<div class="story-body" id="story-body-' + chapter.id + '">' + chapter.text + '</div>' +
                                '</div>';
                        });

                        container.innerHTML = html;
                    }

                    // ============================================================
