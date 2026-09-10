// ===== MODO HISTORIA — TEMPORADA 1: "LA CIUDAD GRIS" =====
// ============================================================

function dungeonsCompletadasCount(p) {
    if (!p.events) return 0;
    return p.events.filter(function (e) {
        return e.type === 'dungeon' && e.status === 'completed';
    }).length;
}

function dlcsCompletadosCount(p) {
    if (!p.dlcs || !p.rawMissions) return 0;
    return p.dlcs.filter(function (d) {
        var missions = p.rawMissions.filter(function (m) { return m.dlcName === d.name; });
        return missions.length > 0 && missions.every(function (m) { return m.completed; });
    }).length;
}

function tieneEquipoOCompra(p) {
    var eq = p.equipment || {};
    var tieneEquipado = !!(eq.arma || eq.armadura || eq.reliquia);
    var tieneCompra = (p.purchasedItems || []).length >= 1;
    return tieneEquipado || tieneCompra;
}

function attr(p, key) {
    return (p.attributes && p.attributes[key]) || 1;
}

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
        id: 'ch_03_habito',
        icon: '✒️',
        title: 'El Mismo Gesto, Otra Vez',
        check: function (p) { return (p.rawRunes || []).length >= 1; },
        text: 'No hiciste nada extraordinario. Hiciste lo mismo que ayer, y probablemente lo vas a repetir mañana. Eso es lo que nadie cuenta del sentido: no aparece en el golpe de suerte ni en el gesto heroico, aparece en la repetición elegida — volver a hacer lo mismo, no por inercia, sino por decisión propia. En esta ciudad gris, un hábito sostenido pesa más que cualquier golpe de efecto.'
    },
    {
        id: 'ch_04_trofeo',
        icon: '🥃',
        title: 'Ganar sin Testigos',
        check: function (p) { return (p.trophies || []).length >= 1; },
        text: 'Nadie te aplaudió. No hubo flashes ni nadie esperando en la puerta. Ganaste solo, en silencio, como se gana casi todo lo que de verdad importa. Te sentaste en la barra y no dijiste nada, porque no había nada que decir. Pero por dentro algo pesaba distinto. El mundo no cambió. Cambiaste vos, un poco. Y esta noche, con eso alcanza.'
    },
    {
        id: 'ch_05_boss',
        icon: '🔫',
        title: 'El Enemigo Tenía Tu Cara',
        check: function (p) { return (p.bosses || []).filter(function (b) { return b.defeated; }).length >= 1; },
        text: 'El que acabás de vencer no llevaba máscara ni cuchillo. Llevaba tu propia excusa de siempre: "mañana", "después", "hoy no". Y aun así cayó. En esta ciudad los enemigos de verdad no dan la cara — se disfrazan de cansancio, de rutina, de un techo bajo que nunca termina de aplastarte. Hoy ganaste una ronda. La ciudad no lo va a anunciar. Vos ya lo sabés, y con eso alcanza.'
    },
    {
        id: 'ch_06_archivo',
        icon: '🗂️',
        title: 'El Archivo que Alguien Dejó',
        check: function (p) { return dlcsCompletadosCount(p) >= 1; },
        text: 'Cerraste la última carpeta de un caso que no elegiste vos, sino que apareció en tu escritorio una noche cualquiera, con un nombre y una pila de pendientes. Lo raro no es haberlo resuelto. Lo raro es que, mientras lo hacías, dejaste de pensarlo como trabajo ajeno. Cada expediente cerrado es una habitación menos a oscuras en esta ciudad. Nadie te va a dar una medalla. El archivo, eso sí, va a quedar prolijo, aunque sea la única persona que lo va a ver seas vos.'
    },
    {
        id: 'ch_07_nivel5',
        icon: '🕰️',
        title: 'Ya no Sos el que Entró',
        check: function (p) { return p.level >= 5; },
        text: function (p) {
            var mente = attr(p, 'mente');
            var creatividad = attr(p, 'creatividad');
            var base = 'El barman te mira distinto ahora. No dice nada — nunca dice nada — pero deja de servirte sin preguntar, porque algo en tu forma de sentarte cambió. Vos tampoco sos el mismo que entró la primera vez a este bar sin nombre. ';
            if (mente > creatividad) {
                return base + 'Se nota en cómo pensás los problemas ahora: menos a los golpes, más despacio, buscando el patrón antes que la reacción. En esta ciudad, la cabeza fría dura más que el impulso.';
            } else if (creatividad > mente) {
                return base + 'Se nota en cómo resolvés lo que se te cruza: no siempre por el camino obvio, casi nunca por el manual. Encontrás salidas donde otros solo ven una pared. Eso, en esta ciudad, también es una forma de sobrevivir.';
            }
            return base + 'Todavía no está claro si pensás más de lo que improvisás, o al revés. Puede que esa indecisión, justamente, sea tu manera particular de resolver las cosas.';
        }
    },
    {
        id: 'ch_08_vinculo',
        icon: '🚋',
        title: 'Nadie Cruza Solo esta Ciudad',
        check: function (p) { return dungeonsCompletadasCount(p) >= 1; },
        text: 'Alguien empezó a caminar cerca. No de golpe — en esta ciudad nada pasa de golpe — sino de a poco, entre silencios compartidos y algún café que se enfrió sin que nadie lo notara. Siempre creíste que atravesar esto era cosa de un solo hombre, solo, con el cuello del abrigo levantado. Es mentira, o al menos no es la única verdad. A veces se cruza más fácil cuando alguien camina un paso atrás, sin apurarte, pero ahí.'
    },
    {
        id: 'ch_09_santuario',
        icon: '🕯️',
        title: 'La Trastienda',
        check: function (p) { return (p.pomodoroSessions || 0) >= 5; },
        text: 'Hay una puerta al fondo del bar que casi nadie usa. Vos empezaste a usarla: veinticinco minutos de silencio, un reloj de arena, nada de teléfono. Al principio te costaba quedarte quieto tanto tiempo. Ahora es lo único del día que te pertenece completamente, sin que nadie más lo reclame. La ciudad sigue gritando afuera. Ahí adentro, por un rato, no.'
    },
    {
        id: 'ch_10_nivel10',
        icon: '🖤',
        title: 'Lo que Sabe Quien Llegó Hasta Acá',
        check: function (p) { return p.level >= 10; },
        text: function (p) {
            var disciplina = attr(p, 'disciplina');
            var fuerza = attr(p, 'fuerza');
            var base = 'Diez rondas no son un número. Son diez veces que elegiste seguir caminando en vez de sentarte a esperar que la lluvia pare. Esta ciudad no tiene final feliz garantizado — quizás ninguna ciudad lo tiene — pero eso ya no te asusta como antes. ';
            if (disciplina > fuerza) {
                return base + 'Lo que te sostuvo hasta acá no fue un golpe de fuerza. Fue la rutina, repetida incluso las noches en que no tenías ganas. Eso pesa más de lo que parece, y no se nota hasta que mirás para atrás.';
            } else if (fuerza > disciplina) {
                return base + 'Lo que te sostuvo hasta acá fue terquedad pura: volver a pararte, otra vez, aunque la rutina fallara. No fue prolijo. Pero funcionó, golpe tras golpe.';
            }
            return base + 'No sabrías decir si lo que te sostuvo fue el orden o la terquedad. Probablemente un poco de las dos cosas, empujando parejo.';
        }
    },
    {
        id: 'ch_11_vera',
        icon: '🕴️',
        title: 'Alguien Más Camina de Noche',
        check: function (p) { return (p.trophies || []).length >= 3; },
        text: 'Ya sabés su nombre: Vera. Apareció sin anunciarse, como aparece casi todo lo que vale la pena en esta ciudad, y se quedó. Esa noche, mientras hablaban en la barra, un hombre de traje gris se sentó al otro extremo sin pedir nada. No tomó nada, no habló con nadie. Solo miraba. Vera no pareció notarlo. Vos sí. Y por alguna razón que todavía no podías nombrar, sentiste que ya lo conocías de antes — de un antes que no lograbas ubicar.'
    },
    {
        id: 'ch_12_hombre_gris',
        icon: '🥶',
        title: 'El Hombre Gris Te Habla',
        check: function (p) { return (p.bosses || []).filter(function (b) { return b.defeated; }).length >= 3; },
        text: 'Te siguió hasta la puerta. "No hace falta que sigas así", dijo, con una voz que se parecía demasiado a la tuya cuando estás cansado. "Nadie te va a culpar por parar." No te ofreció nada a cambio — ni siquiera parecía querer algo. Solo esperaba, como esperan las costumbres viejas a que bajes la guardia.',
        choices: [
            { id: 'resist', label: 'Ignorarlo y seguir caminando' },
            { id: 'listen', label: 'Escuchar lo que tiene para decir' }
        ]
    },
    {
        id: 'ch_13_eleccion',
        icon: '🕯️',
        title: 'Lo que Elegiste Esa Noche',
        check: function (p) {
            return (p.rawRunes || []).length >= 5 && p.storyChoices && p.storyChoices['ch_12_hombre_gris'];
        },
        text: function (p) {
            var choice = p.storyChoices['ch_12_hombre_gris'];
            if (choice === 'resist') {
                return 'No le respondiste. Seguiste caminando bajo la lluvia, y al doblar la esquina ya no estaba. Pero algo de lo que dijo se quedó pegado, como se pega el humo a la ropa. Igual, cada gesto pequeño que repetiste desde esa noche — cada runa tallada, cada hábito sostenido — fue una forma silenciosa de responderle sin decir una palabra.';
            }
            return 'Lo escuchaste. No porque tuviera razón, sino porque una parte tuya necesitaba saber qué se sentía considerarlo. Esa noche no cambiaste de rumbo, pero tampoco fue gratis: quedó una duda que no tenías antes. Aun así, seguiste tallando tus rutinas al día siguiente. Quizás esa fue la verdadera respuesta.';
        }
    },
    {
        id: 'ch_14_vera_confiesa',
        icon: '🌆',
        title: 'Lo que Vera No Cuenta',
        check: function (p) { return p.level >= 15; },
        text: function (p) {
            var social = attr(p, 'social');
            var relaciones = attr(p, 'relaciones');
            var base = 'Una noche Vera no habló de vos. Habló de ella: de una época en la que también caminaba en piloto automático, sin nombre propio para los días. "Lo que tenés vos", te dijo, "yo lo tuve que aprender de otra forma, más despacio." No sonó a consejo. Sonó a alguien que reconoce una cicatriz parecida a la suya. ';
            if (social > relaciones) {
                return base + 'Te diste cuenta de que conocés a media ciudad de nombre y de apellido, y aun así fue Vera, casi una desconocida, la que te dijo esto. A veces el vínculo que importa no es el más ruidoso, es el más atento.';
            } else if (relaciones > social) {
                return base + 'No te sorprendió tanto: hace tiempo que preferís pocas conversaciones de verdad antes que muchas de compromiso. Con Vera, por una vez, no tuviste que explicar nada desde cero.';
            }
            return base + 'Por primera vez, la ciudad se sintió un poco menos tuya en soledad, y un poco más compartida.';
        }
    },
    {
        id: 'ch_15_dinero',
        icon: '💵',
        title: 'Lo que el Dinero no Compra',
        check: function (p) { return p.gold >= 1000; },
        text: function (p) {
            var carrera = attr(p, 'carrera');
            var finanzas = attr(p, 'finanzas');
            var base = 'Volvió a aparecer, esta vez con otra oferta. Señaló tu bolsillo más lleno que antes y sonrió, sin alegría: "Ya lo tenés todo. ¿Para qué seguir esforzándote?" No supiste qué responderle en el momento. ';
            if (carrera > finanzas) {
                return base + 'Esa noche, revisando lo que habías juntado, entendiste que nunca fue por el número: fue por construir algo con tu nombre puesto. El bolsillo lleno era apenas un efecto secundario.';
            } else if (finanzas > carrera) {
                return base + 'Esa noche, contando lo que habías juntado, entendiste algo que él no dijo: guardar con cabeza no es lo mismo que acumular por acumular. El número en el bolsillo nunca fue el punto. Nunca lo fue.';
            }
            return base + 'Pero esa noche, contando lo que habías juntado, entendiste algo que él no dijo: el número en el bolsillo nunca fue el punto. Nunca lo fue.';
        }
    },
    {
        id: 'ch_16_patron',
        icon: '🔎',
        title: 'El Patrón que Nadie Pidió Ver',
        check: function (p) { return dungeonsCompletadasCount(p) >= 3; },
        text: 'La mazmorra terminó, pero el caso que de verdad importaba se resolvió después, revisando notas viejas junto con Vera. "Fijate cuándo aparece", te dijo ella, señalando un patrón: el Hombre Gris nunca llega cuando estás mal. Llega cuando estás por mejorar. No es tu enemigo desde afuera — es la parte tuya que le teme al cambio, disfrazada de consejo razonable. Vera lo sabe. Ya peleó esa misma pelea.'
    },
    {
        id: 'ch_17_equipo',
        icon: '⚔️',
        title: 'Lo que Llevás Puesto',
        check: function (p) { return tieneEquipoOCompra(p); },
        text: function (p) {
            var fuerza = attr(p, 'fuerza');
            var mente = attr(p, 'mente');
            var base = 'Empezaste a llevar algo encima que antes no llevabas — algo elegido, no heredado ni encontrado por casualidad. No es magia. Es una forma de recordarte, cada vez que lo mirás, que estás tomando esto en serio. ';
            if (fuerza > mente) {
                return base + 'Elegiste algo con peso, algo que se siente en la mano. Tiene sentido: en esta ciudad, a veces lo que hace falta es simplemente no retroceder.';
            } else if (mente > fuerza) {
                return base + 'Elegiste algo más discreto, más parecido a una herramienta que a un arma. Tiene sentido: en esta ciudad, la mayoría de las peleas de verdad no se ganan a los golpes.';
            }
            return base + 'Todavía no sabés si lo elegiste por lo que hace o por lo que representa. Puede que sea exactamente por eso: por las dos cosas a la vez.';
        }
    },
    {
        id: 'ch_18_ultima_oferta',
        icon: '🎭',
        title: 'La Última Oferta',
        check: function (p) { return p.level >= 18; },
        text: 'Te esperó en la puerta de tu propio bar, algo que nunca había hecho. "Última oportunidad", dijo, sin traje esta vez, como si ya no necesitara la actuación. "Puedo desaparecer para siempre esta noche. Solo tenés que dejar de intentarlo, una vez, completamente. Nadie más que vos lo va a saber." Detrás de él, la lluvia seguía cayendo, igual que siempre. Nunca te había parecido tan fácil rendirse.',
        choices: [
            { id: 'confront', label: 'Enfrentarlo — decirle que ya no te representa' },
            { id: 'walkaway', label: 'Darle la espalda sin responder, y seguir caminando' }
        ]
    },
    {
        id: 'ch_19_climax',
        icon: '🌫️',
        title: 'Lo que Quedó de Él',
        check: function (p) {
            return (p.trophies || []).length >= 6 && p.storyChoices && p.storyChoices['ch_18_ultima_oferta'];
        },
        text: function (p) {
            var choice = p.storyChoices['ch_18_ultima_oferta'];
            if (choice === 'confront') {
                return 'Le dijiste que no. En voz alta, por primera vez, no en pensamiento. No desapareció con un rayo ni un efecto — simplemente se quedó más chico, más gris, hasta que ya no distinguías si seguía ahí o si nunca estuvo del todo. Vera te estaba esperando dos cuadras más allá, sin preguntar qué había pasado. No hacía falta explicarle.';
            }
            return 'No dijiste nada. Simplemente caminaste, con la lluvia cayendo igual que siempre, y por primera vez el silencio de tu propia respuesta pesó más que cualquier discurso. Cuando miraste atrás, la puerta estaba vacía. No supiste si ganaste algo o solo dejaste de perder. Quizás, en esta ciudad, sea lo mismo.';
        }
    },
    {
        id: 'ch_20_costo',
        icon: '🩹',
        title: 'El Costo',
        check: function (p) { return (p.bosses || []).filter(function (b) { return b.defeated; }).length >= 6; },
        text: 'Nada de esto salió gratis. Hay noches en las que todavía sentís el peso de la rutina tirando de vos hacia atrás, con o sin traje gris. La diferencia, ahora, es que sabés reconocer el tirón antes de que gane. Vera te lo dijo una vez, y recién ahora lo entendiste del todo: no se trata de vencerlo una sola vez. Se trata de seguir reconociéndolo, ronda tras ronda, cada vez que vuelve.'
    },
    {
        id: 'ch_21_costumbre',
        icon: '🗝️',
        title: 'Rutina, sin Miedo',
        check: function (p) { return (p.rawRunes || []).length >= 15; },
        text: 'Lo que antes era esfuerzo ahora es simplemente lo que hacés. Nadie te aplaude por tallar una runa más, y ya no lo necesitás. Vera dice que eso es lo que distingue a quien de verdad cambió de quien solo tuvo una buena racha: que la costumbre se vuelve invisible, parte del paisaje, en vez de una batalla diaria. El Hombre Gris, si todavía existe en algún lado, hace tiempo que no se sienta cerca tuyo.'
    },
    {
        id: 'ch_22_resolucion',
        icon: '🌃',
        title: 'La Ciudad, de Nuevo',
        check: function (p) { return p.level >= 20; },
        text: 'Caminaste la misma cuadra de siempre, la del primer capítulo, sin planearlo. Llovía, como llueve siempre acá. Pero por primera vez notaste algo que antes se te escapaba: un color, apenas, entre tanto gris — el toldo rojo de un bar, el reflejo amarillo de un semáforo en el asfalto mojado. La ciudad nunca cambió. Cambiaste vos, la manera en la que la mirás. Y esta vez, cuando encendiste el cigarrillo, lo terminaste entero.'
    },
    {
        id: 'ch_23_final',
        icon: '🎬',
        title: 'Fin de Temporada',
        check: function (p) { return p.level >= 25; },
        text: function (p) {
            var attrs = p.attributes || {};
            var topKey = Object.keys(attrs).reduce(function (best, key) {
                return attrs[key] > (attrs[best] || 0) ? key : best;
            }, Object.keys(attrs)[0]);
            var topLine = {
                fuerza: 'Ganaste esto a fuerza de no bajar los brazos, literalmente.',
                disciplina: 'Ganaste esto a base de rutina, noche tras noche, sin excepciones.',
                mente: 'Ganaste esto pensando dos veces cada paso antes de darlo.',
                creatividad: 'Ganaste esto encontrando salidas que nadie más buscó.',
                carrera: 'Ganaste esto construyendo algo con tu nombre, un paso a la vez.',
                finanzas: 'Ganaste esto con paciencia, guardando lo que otros hubieran gastado.',
                social: 'Ganaste esto sin caminar nunca del todo solo por esta ciudad.',
                relaciones: 'Ganaste esto gracias a los pocos vínculos en los que de verdad confiaste.'
            };
            var base = 'No hay una última escena perfecta para esto — la vida real nunca la tiene. Vera sigue caminando cerca, algunas noches más que otras. El bar sigue ahí, el barman sigue sin preguntar nada. Vos seguís, ronda a ronda, sabiendo que ningún nivel es el final de nada. ';
            var cierre = 'Pero esta noche, mirando la ciudad desde la ventana empañada, sentiste algo nuevo: la sensación de que lo que sigue todavía no está escrito, y que por primera vez, eso no da miedo. Se apagan las luces. En algún lugar de esta misma ciudad, empieza otra historia parecida a la tuya. — Fin de la Temporada 1.';
            return base + (topLine[topKey] || '') + ' ' + cierre;
        }
    }
];

function getChapterText(chapter) {
    if (typeof chapter.text === 'function') return chapter.text(player);
    return chapter.text;
}

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

function makeStoryChoice(chapterId, choiceId) {
    if (!player.storyChoices) player.storyChoices = {};
    if (player.storyChoices[chapterId]) return;

    player.storyChoices[chapterId] = choiceId;
    saveGame();

    var chapter = STORY_CHAPTERS.find(function (c) { return c.id === chapterId; });
    var choiceObj = chapter ? chapter.choices.find(function (c) { return c.id === choiceId; }) : null;

    showToast('🖤 Elegiste: "' + (choiceObj ? choiceObj.label : choiceId) + '"', 'info', 'Historia');
    addLogEntry('story', '🖤 Decisión tomada en "' + (chapter ? chapter.title : chapterId) + '"', choiceObj ? choiceObj.label : '', 0, 0, null);

    renderStory();
    checkStoryUnlocks();
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

        var choicesHTML = '';
        if (chapter.choices && chapter.choices.length > 0) {
            var madeChoice = player.storyChoices ? player.storyChoices[chapter.id] : null;
            if (madeChoice) {
                var chosenLabel = chapter.choices.find(function (c) { return c.id === madeChoice; });
                choicesHTML = '<div class="story-choice-made">🖤 Elegiste: "' + (chosenLabel ? chosenLabel.label : madeChoice) + '"</div>';
            } else {
                choicesHTML = '<div class="story-choices">';
                chapter.choices.forEach(function (choice) {
                    choicesHTML += '<button class="story-choice-btn" onclick="event.stopPropagation(); makeStoryChoice(\'' + chapter.id + '\', \'' + choice.id + '\')">' + choice.label + '</button>';
                });
                choicesHTML += '</div>';
            }
        }

        html += '<div class="story-card" id="story-card-' + chapter.id + '">' +
            '<div class="story-header" onclick="toggleStoryChapter(\'' + chapter.id + '\')">' +
            '<span class="story-chapter-num">' + (index + 1) + '</span>' +
            '<span class="story-icon">' + renderIconHTML(chapter.icon, '📖') + '</span>' +
            '<span class="story-title">' + chapter.title + '</span>' +
            (!isRead ? '<span class="story-new-badge" id="story-new-' + chapter.id + '">nuevo</span>' : '') +
            '<span class="story-chevron">▾</span>' +
            '</div>' +
            '<div class="story-body" id="story-body-' + chapter.id + '">' + getChapterText(chapter) + choicesHTML + '</div>' +
            '</div>';
    });

    container.innerHTML = html;
}

// ============================================================
