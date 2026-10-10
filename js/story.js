// ============================================================
// ===== MODO HISTORIA — TEMPORADA 1: "BAHÍA CENIZA" =====
// Thriller neo-noir. Tu progreso real (niveles, rituales, metas,
// campañas) abre los capítulos. Algunos capítulos piden una decisión
// y esas decisiones abren capítulos alternos y finales distintos.
// ============================================================

// Si cambia este valor, el progreso de la historia se reinicia (los capítulos nuevos no encajan con los viejos).
const STORY_VERSION = 'noir-1';

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

function bossesDerrotadosCount(p) {
    return (p.bosses || []).filter(function (b) { return b.defeated; }).length;
}

function attr(p, key) {
    return (p.attributes && p.attributes[key]) || 1;
}

// Decisión tomada en un capítulo (o null si todavía no se tomó)
function storyChoice(p, chapterId) {
    return (p.storyChoices && p.storyChoices[chapterId]) || null;
}

// Cuántas decisiones "abiertas" tomaste (pedir ayuda, dejar la botella, decir la verdad en voz alta)
function openCount(p) {
    var n = 0;
    if (storyChoice(p, 'n03_botella') === 'dejar') n++;
    if (storyChoice(p, 'n06_lena') === 'aceptar') n++;
    if (storyChoice(p, 'n09_nora') === 'llamar') n++;
    return n;
}

// Texto según qué atributo es mayor (a vs b); si empatan, tie
function cmpAttr(p, a, b, textA, textB, tie) {
    var va = attr(p, a), vb = attr(p, b);
    if (va > vb) return textA;
    if (vb > va) return textB;
    return tie;
}

function topAttrLine(p) {
    var attrs = p.attributes || {};
    var keys = Object.keys(attrs);
    if (keys.length === 0) return '';
    var topKey = keys.reduce(function (best, key) {
        return attrs[key] > (attrs[best] || 0) ? key : best;
    }, keys[0]);
    var lines = {
        fuerza: 'Lo ganaste a fuerza de no aflojar, de ponerle el cuerpo a cada mañana.',
        disciplina: 'Lo ganaste con rutina, noche tras noche, sin excepciones heroicas.',
        mente: 'Lo ganaste pensando cada paso antes de darlo, y nombrando cada impulso antes de obedecerlo.',
        creatividad: 'Lo ganaste encontrando salidas que nadie más buscó.',
        carrera: 'Lo ganaste construyendo algo con tu nombre, de a un ladrillo por día.',
        finanzas: 'Lo ganaste con paciencia, cuidando lo que otros hubieran gastado sin mirar.',
        social: 'Lo ganaste sin caminar nunca del todo solo por esta ciudad.',
        relaciones: 'Lo ganaste gracias a los pocos vínculos en los que de verdad confiaste.'
    };
    return lines[topKey] || '';
}

const STORY_CHAPTERS = [
    // ───────────── ACTO I — LA NIEBLA ─────────────
    {
        id: 'n01_bahia',
        icon: '🌫️',
        title: '3:07 a.m.',
        check: function (p) { return true; },
        text: 'Bahía Ceniza queda donde termina el mapa y empieza la niebla. A las 3:07 de la madrugada, El Último Faro es el único lugar con luz en tres cuadras, y vos sos el único cliente. Ismael te sirve el tercer whisky sin preguntar; hace dos años que dejó de preguntar. Hace dos años que dejaste la placa en un cajón, después del caso Rojas, y desde entonces la ciudad te devuelve el favor: no te pide nada. En la radio, una voz de mujer lee cartas de gente que no puede dormir. Entonces lo notás: en el bolsillo del saco hay una hoja doblada, escrita a máquina. Describe tu noche con exactitud quirúrgica: el tercer whisky, la radio, el frío en la nuca. Termina con una sola línea: «Mañana empezás. Firmado: Mañana.»'
    },
    {
        id: 'n02_primera_linea',
        icon: '✏️',
        title: 'La Primera Línea Propia',
        check: function (p) { return (p.rawRunes || []).length >= 1; },
        text: 'Esa noche no dormiste, pero hiciste algo distinto: agarraste un lápiz y escribiste una palabra al margen de la hoja, con tu letra torcida. «Hoy.» Después, un gesto chico: un vaso de agua en lugar del cuarto whisky, la cama hecha, algo que no vale la pena contar. Ismael los llama rituales. Vos, por ahora, los llamás «lo que hice hoy». Al amanecer la hoja había cambiado. La máquina de escribir no puede borrar lo que está escrito a lápiz; solo puede escribir alrededor. En el margen, tu «Hoy» seguía ahí, y la niebla de la ventana, esa que lleva meses pegada al vidrio, retrocedió un centímetro. Un centímetro. En Bahía Ceniza, un centímetro es una confesión.'
    },
    {
        id: 'n03_botella',
        icon: '🥃',
        title: 'La Botella',
        check: function (p) { return p.level >= 2; },
        text: 'La segunda noche, Ismael te cobra y empuja la botella hacia vos: casi vacía de ganas, pero todavía con whisky. «Para el camino», dice sin mirarte, como quien ofrece un favor que sabe que es una trampa. Afuera la lluvia dibuja los mismos rieles de siempre. La hoja a máquina, plegada en tu bolsillo, pesa más que la botella. Tenés que decidir qué hacer con ella antes de cruzar la puerta.',
        choices: [
            { id: 'dejar', label: 'Dejarla en la barra: «Guardámela. Si la quiero, vengo a buscarla acá.»' },
            { id: 'llevar', label: 'Llevártela. Por si la noche se pone larga.' }
        ]
    },
    {
        id: 'n04a_ismael_guarda',
        icon: '🕯️',
        title: 'Lo que Guarda Ismael',
        visible: function (p) { return storyChoice(p, 'n03_botella') === 'dejar'; },
        check: function (p) { return p.level >= 3; },
        text: 'Ismael guardó la botella en el estante de abajo, detrás de las servilletas, y no hizo ningún comentario. En un hombre que lleva seis años sobrio, eso es un discurso entero. A la mañana siguiente pasaste por El Último Faro a las once, con luz de día, algo que no hacías desde el caso Rojas. La botella seguía donde la dejaste. Fue raro ver cómo un objeto puede esperar sin exigir nada. «Cuando quieras sacarla, sacala», dijo. «Pero va a seguir ahí mañana. Eso lo aprendí yo.» Por primera vez en meses, la palabra mañana no sonó como una amenaza.'
    },
    {
        id: 'n04b_mesa_de_luz',
        icon: '🛏️',
        title: 'Una Botella en la Mesa de Luz',
        visible: function (p) { return storyChoice(p, 'n03_botella') === 'llevar'; },
        check: function (p) { return p.level >= 3; },
        text: 'La botella pasó la noche sobre la mesa de luz, mirándote como un testigo que no necesita declarar. Dormiste mal, con ese sueño liviano en el que cada ruido es un paso. A las seis, la hoja a máquina tenía una línea nueva, escrita debajo de la tuya: «Siempre vuelve a la botella. Mañana, tal vez.» No era una acusación. Era una predicción, que es peor. Te quedaste mirando la letra hasta que el sol se animó a aparecer detrás de la niebla. Si la historia de Bahía Ceniza se escribe sola, alguien tiene que empezar a pelear por la tinta.'
    },
    {
        id: 'n05_cafe_buho',
        icon: '☕',
        title: 'Café Búho',
        check: function (p) { return p.level >= 5; },
        text: function (p) {
            var base = 'Café Búho abre a las seis y tiene la mejor tarta de ciruela del condado, según un cartel que nadie recuerda haber colgado. En el corcho del fondo hay tres avisos de personas desaparecidas en un solo mes: un pianista que dejó de tocar, una estudiante que dejó de ir a clases, un corredor que dejó de salir a correr. Ningún cuerpo, ninguna escena, ningún sospechoso. Los tres recibieron una hoja a máquina antes de desaparecer. ';
            var variante = cmpAttr(p, 'mente', 'creatividad',
                'Lo armaste como se arman estos casos: una hoja, tres columnas, descartando hasta que quedó el patrón. No los eligieron por lo que tenían, sino por lo que habían abandonado.',
                'No lo armaste en columnas. Lo viste: tres fotos y un hueco en el medio, la forma exacta de algo que falta. Una corazonada con forma de sombra. No desaparecieron: se vaciaron.',
                'El orden y el instinto coincidieron esta vez: el patrón no es lo que tenían, es lo que dejaron.');
            return base + variante + ' Había un cuarto aviso, sin foto y sin nombre. En blanco. Todavía.';
        }
    },
    {
        id: 'n06_lena',
        icon: '🕵️',
        title: 'Lena Varga',
        check: function (p) { return bossesDerrotadosCount(p) >= 1; },
        text: 'Cuando saliste del Café Búho había un auto sin patente en doble fila y una mujer apoyada en el capó, con el piloto mojado y esa manera de mirar que no pide permiso. Lena Varga, ex compañera de Homicidios, la única que no te dio vuelta la cara después del caso Rojas. «Me llegó una hoja a máquina», dijo. «Con mi nombre, mi horario, y una línea que dice que mañana dejo de buscar. Y vos sos el único que sabe leer estas cosas.» Su voz tenía un temblor mínimo. Era la primera vez que la veías necesitar algo.',
        choices: [
            { id: 'aceptar', label: 'Aceptar: investigar juntos, con ella adentro desde el principio' },
            { id: 'solo', label: 'Decirle que no: investigar solo, como siempre' }
        ]
    },
    {
        id: 'n07a_dos_paraguas',
        icon: '☔',
        title: 'Dos Paraguas',
        visible: function (p) { return storyChoice(p, 'n06_lena') === 'aceptar'; },
        check: function (p) { return p.level >= 8; },
        text: 'Trabajar con alguien después de dos años de hacerlo solo es como caminar sin el yeso recién sacado: los músculos no se acuerdan, pero el cuerpo sí. Lena llevaba el termo y los mapas; vos, las preguntas torcidas. Entre las dos libretas apareció algo que ninguno hubiera visto solo: las hojas llegan siempre el mismo día en que alguien por fin iba a empezar algo. El pianista tenía una audición. La estudiante, un examen. Lena, esa misma semana, pensaba pedir un traslado que venía postergando. «Es verdad», admitió. «Me da miedo.» Compartieron un paraguas hasta el auto y no dijeron nada. A veces lo que más falta es que alguien camine al lado.'
    },
    {
        id: 'n07b_cuaderno_propio',
        icon: '📓',
        title: 'Cuaderno Propio',
        visible: function (p) { return storyChoice(p, 'n06_lena') === 'solo'; },
        check: function (p) { return p.level >= 8; },
        text: 'Preferiste el cuaderno de tapa dura, la lámpara de escritorio y la lluvia en el vidrio: la vieja receta del que no le debe explicaciones a nadie. Y funcionó, hasta cierto punto. Armaste el patrón en tres noches: las hojas llegan justo cuando alguien está por empezar algo. Pero la cuarta noche notaste lo que ningún cuaderno anota: llevabas tres días sin hablar con nadie, y la voz que te contestaba al leer en voz alta se parecía cada vez más a la de la hoja a máquina. Lena te dejó un mensaje que no devolviste. Resolver solo es más rápido. Quedarse solo es más fácil. Son cosas distintas, y en Bahía Ceniza se confunden a propósito.'
    },

    // ───────────── ACTO II — LOS EXPEDIENTES ─────────────
    {
        id: 'n08_san_dimas',
        icon: '🏚️',
        title: 'San Dimas',
        check: function (p) { return dungeonsCompletadasCount(p) >= 1; },
        text: function (p) {
            var base = 'El Hospital San Dimas cerró hace veinte años, pero sus pasillos todavía huelen a desinfectante y a algo más viejo. Bajaste al subsuelo con una linterna y la certeza de que nadie te esperaba. En la sala B-7, entre camillas oxidadas, había una máquina de escribir de cinta seca, todavía tibia, sin nadie sentado. En el espejo roto de atrás, un hombre con tu abrigo bebía en silencio y te miraba sin parpadear: tu yo de mañana, el que no cambió. El pasillo de salida parecía más largo que el de entrada. ';
            var variante = cmpAttr(p, 'disciplina', 'fuerza',
                'Lo que te sacó de ahí no fue valentía, fue método: contar los pasos, anotar cada puerta, volver por donde viniste sin apurarte.',
                'Lo que te sacó de ahí fue terquedad pura: avanzaste contra la niebla como contra una pared, hasta que la pared cedió.',
                'Lo que te sacó de ahí fue una mezcla de orden y de testarudez, empujando parejo.');
            return base + variante + ' Sobre el rodillo de la máquina quedó una frase sin terminar: «Mañana, él».';
        }
    },
    {
        id: 'n09_nora',
        icon: '📻',
        title: 'Después de las Tres',
        check: function (p) { return p.level >= 10; },
        text: 'Todas las noches, a las tres, Radio Faro 88.1 emite «Después de las Tres», el programa de Nora Quiroga para quienes no pueden dormir. Nora lee cartas, pone discos viejos y de vez en cuando deja un silencio demasiado largo, como si escuchara algo detrás del micrófono. Esa noche dijo tu nombre de pila, con el tono de quien lee un guion. «Hay un hombre en Bahía Ceniza que se está por quedar sin mañanas. Si está escuchando, la línea está abierta.» Tenías el teléfono en la mano. En la mesa, la hoja a máquina ya tenía escrita la escena siguiente: «Cortás la radio. Como siempre.»',
        choices: [
            { id: 'llamar', label: 'Llamar al aire y decir en voz alta lo que venís evitando' },
            { id: 'cortar', label: 'Apagar la radio. Todavía no estás listo para decirlo' }
        ]
    },
    {
        id: 'n10a_al_aire',
        icon: '🎙️',
        title: 'En el Aire',
        visible: function (p) { return storyChoice(p, 'n09_nora') === 'llamar'; },
        check: function (p) { return p.level >= 10; },
        text: 'Dijiste tu nombre. Después, lo que venías esquivando: que dejaste de buscar a Elena Rojas porque te daba más miedo no encontrarla que no intentarlo; que desde entonces cada noche empieza y termina en un vaso. Hablaste cuatro minutos que se sintieron como cuatro años. Nora no te interrumpió. Cuando terminaste, dejó el silencio más largo de todo el programa, pero esta vez era un silencio abierto, como una puerta. Esa noche llamaron tres personas más. Una dijo: «Yo también tengo una hoja.» A la mañana siguiente, la niebla del puerto estaba más delgada. No había desaparecido. Pero tenía grietas, y por las grietas entraba la luz.'
    },
    {
        id: 'n10b_estatica',
        icon: '📡',
        title: 'Estática',
        visible: function (p) { return storyChoice(p, 'n09_nora') === 'cortar'; },
        check: function (p) { return p.level >= 10; },
        text: 'Apagaste la radio. El silencio que quedó tenía textura, como de tela mojada. La hoja se actualizó sola: «Cortó la radio. Tiene miedo.» Era injusto lo bien que te conocía. Pero algo se coló por la estática: la voz de Nora, apenas audible, diciendo despacio una frase que no estaba en ningún guion: «No tenés que decirlo hoy. Pero la línea sigue abierta.» No te estaba juzgando. No te estaba apurando. Estaba, simplemente, esperando. Y eso, para alguien que se pasó dos años siendo esperado nada más que por una botella, fue demasiado nuevo para ignorarlo del todo.'
    },
    {
        id: 'n11_patron',
        icon: '🧩',
        title: 'El Patrón',
        check: function (p) { return (p.trophies || []).length >= 3; },
        text: function (p) {
            var base = 'Lo viste cuando dejaste de mirar los casos y miraste el calendario. Cada hoja llegaba la víspera de un comienzo: una audición, un examen, una carrera, un llamado. Mañana no escribe el fracaso de la gente; escribe la excusa. Es la voz amable que dice «mejor la semana que viene», «hoy no estás en condiciones», «ya habrá tiempo». Y mientras la gente la escucha, la niebla se espesa un poco más. No es un asesino. Es un anestesista. ';
            var variante = cmpAttr(p, 'social', 'relaciones',
                'Conocés a media ciudad de vista y de nombre, y sin embargo fue a casi un extraño a quien se lo contaste primero. Hay vínculos que se miden por ancho y otros por hondura; los tuyos, hasta ahora, eran de los anchos.',
                'Hace tiempo que preferís pocas conversaciones de verdad a muchas de compromiso. Esta vez te sirvió: sabés exactamente a quién llamar cuando la voz amable empieza a sonar.',
                'Lo ancho y lo hondo tiraron parejo esta vez, y el patrón quedó a la vista.');
            return base + variante;
        }
    },
    {
        id: 'n12_seis_anios',
        icon: '🍵',
        title: 'Seis Años',
        check: function (p) { return p.level >= 12; },
        text: function (p) {
            var base = 'Esa noche Ismael cerró temprano y se sentó del lado de los clientes, algo que nunca había hecho. «Seis años», dijo, mirando su vaso de soda. «Pensé que lo difícil era no tomar. Lo difícil es el día después, y el siguiente: el mañana de verdad, el que nadie te escribe.» Le preguntaste por qué te servía, entonces. «Porque si alguien va a caer, prefiero que caiga acá, donde hay luz y alguien que le tire una frase.» Te contó que Mañana también lo visitó a él, años atrás, con otra letra y otra hoja. «El whisky no es el monstruo. Es la prórroga que el monstruo firma.» ';
            var choice = storyChoice(p, 'n03_botella');
            if (choice === 'dejar') {
                return base + 'Miró el estante de abajo, donde la botella seguía sin reclamar nada. «Esa botella me dice cómo venís. No por lo que tiene adentro: por cuánto tiempo lleva ahí.»';
            }
            if (choice === 'llevar') {
                return base + 'Miró tus manos, tu cara, la ojera nueva. «No hace falta que me cuentes qué hiciste con la botella. Pero cuando quieras traerla de vuelta, acá hay estante.»';
            }
            return base;
        }
    },
    {
        id: 'n13_manana',
        icon: '🧥',
        title: 'Mañana',
        check: function (p) { return bossesDerrotadosCount(p) >= 3; },
        text: 'Se sentó frente a vos en la barra de El Último Faro, un martes cualquiera, con el abrigo gris seco aunque llovía a baldazos. Sin sombra bajo la luz del techo. Sin edad: podía tener treinta o sesenta, según cómo lo miraras. «Me dicen Mañana», dijo, con una simpatía casi insoportable. «No quiero hacerte daño. Nunca quise. Solo quiero que descanses. Mirá todo lo que hiciste este mes: ¿no merecés una pausa? ¿Una copa, un fin de semana, un lunes de nuevo?» Cada frase sonaba razonable, y ese era el truco. Ismael, del otro lado de la barra, no se movió. Tenías ganas de decirle que sí, de aceptar el descanso. Notaste que lo que sentías no era cansancio. Era costumbre.'
    },
    {
        id: 'n14_caso_rojas',
        icon: '🗂️',
        title: 'El Caso Rojas',
        check: function (p) { return dlcsCompletadosCount(p) >= 1; },
        text: function (p) {
            var base = 'Elena Rojas desapareció hace dos años, en tu último caso. La versión oficial: fuga voluntaria. Tu versión: fracaso personal. Esa noche, releyendo el expediente con los ojos de ahora, encontraste lo que no habías querido ver: la primera hoja a máquina del caso estaba dirigida a vos, no a ella. «Mañana retomás la búsqueda.» Era la primera línea de Mañana, y no la escribió para Elena: te la escribió a vos, para que la dejaras pasar. Elena no desapareció porque vos fallaste. Desapareció porque dejó de intentar, como los demás. Y vos dejaste de buscarla por la misma razón. ';
            var variante = cmpAttr(p, 'relaciones', 'carrera',
                'Lo que más te pesaba no era el caso, era haberle fallado a una persona. Eso se repara con otras personas.',
                'Lo que más te pesaba era la placa, el nombre en el expediente, la derrota profesional. Eso se repara con trabajo, pero también con perdón.',
                'Te pesaba el trabajo y te pesaba la persona, y por primera vez pudiste mirar las dos cosas sin apartar la vista.');
            return base + variante;
        }
    },
    {
        id: 'n15_pagina_en_blanco',
        icon: '📄',
        title: 'La Página en Blanco',
        check: function (p) { return (p.rawRunes || []).length >= 6; },
        text: function (p) {
            var base = 'En el cajón del escritorio apareció una hoja distinta: sin tipografía, sin firma, sin una sola palabra. Blanca. No era de Mañana. Era para vos. Entendiste lo que significaba: hasta ahora habías peleado contra lo que otro escribía; ahora tocaba escribir lo tuyo. ';
            var variante = cmpAttr(p, 'creatividad', 'disciplina',
                'Te sentaste y las frases salieron a borbotones, torcidas, tachadas, pero vivas. Escribir sin plan también es una forma de coraje.',
                'Armaste un horario: veinte minutos por día, el mismo lugar, la misma lapicera. Lo escrito fue menos brillante de lo que soñabas y más real que cualquier cosa que Mañana haya firmado.',
                'Mezclaste el impulso y el horario: una hora fija para dejar que las frases salgan como quieran.');
            return base + variante + ' Al final de la primera línea, la tinta tenía tu letra.';
        }
    },
    {
        id: 'n16_el_costo',
        icon: '🩹',
        title: 'El Costo',
        check: function (p) { return p.level >= 15; },
        text: function (p) {
            var base = 'Nada de esto salió gratis. Hay noches de temblor y de silencio, noches en que el cuerpo reclama lo que antes le dabas sin pensar y la cabeza negocia: «Una sola, para dormir.» Lena te escribió, Nora te dejó un disco en el buzón, Ismael te sirvió té sin comentarios. El cambio duele en lugares donde antes ni siquiera sabías que había algo. ';
            var variante = cmpAttr(p, 'fuerza', 'mente',
                'Lo que te sostuvo fue el cuerpo: el trote a la mañana, el sudor, la fatiga limpia que reemplaza a la otra.',
                'Lo que te sostuvo fue entender el mecanismo: ponerle nombre a cada impulso antes de obedecerlo.',
                'Lo que te sostuvo fue el cuerpo y la cabeza a la vez, cada uno cubriendo al otro.');
            return base + variante + ' Mañana ya no te ganaba. Pero tampoco se iba.';
        }
    },
    {
        id: 'n17_rutina',
        icon: '🕰️',
        title: 'Rutina sin Miedo',
        check: function (p) { return (p.rawRunes || []).length >= 10; },
        text: 'Lo que antes era esfuerzo ahora es simplemente lo que hacés. Nadie te aplaude por cumplir un ritual más, y ya no lo necesitás: el aplauso es de quien todavía duda. Por primera vez en años, las mañanas tienen forma: la ventana, el café, el cuaderno, el paso. Lena dice que se nota en cómo caminás. Ismael dice que se nota en cómo no mirás el estante. Y Mañana, que antes aparecía cada vez que estabas a punto de empezar algo, hace días que no se muestra. Hay un detalle que te inquieta: el silencio de un enemigo siempre es más caro que su ruido.'
    },

    // ───────────── ACTO III — EL ÚLTIMO FARO ─────────────
    {
        id: 'n18_el_archivo',
        icon: '🗃️',
        title: 'El Archivo',
        check: function (p) { return p.level >= 18; },
        text: 'Te citó en el sótano de San Dimas, sala B-7, ya sin traje: gris de la cabeza a los pies, como si por fin se le cayera el disfraz. En la mesa había una carpeta con tu nombre. «Mirá», dijo. «Tu futuro, redactado con cariño. Sin sobresaltos. Sin pérdidas. Sin esfuerzo. Treinta años de tardes tibias.» Detrás de él, la máquina de escribir esperaba una sola cosa: tu firma. «Si la abrís, vas a saber cómo termina. Si la quemás, te quedás sin guion... y sin red.» En el piso, tu sombra y la suya se tocaban.',
        choices: [
            { id: 'mirar', label: 'Abrir la carpeta y leer el futuro que te escribió' },
            { id: 'quemar', label: 'Prenderle fuego al expediente sin abrirlo' }
        ]
    },
    {
        id: 'n19a_lo_que_decia',
        icon: '📖',
        title: 'Lo que Decía la Carpeta',
        visible: function (p) { return storyChoice(p, 'n18_el_archivo') === 'mirar'; },
        check: function (p) { return p.level >= 18; },
        text: 'Leíste tu futuro. Era cómodo, bien escrito, sin una sola falta de ortografía: tardes con el mismo disco, la misma barra, la misma voz amable que no pide nada. Te dio pánico lo bien que te quedaba. Cada capítulo estaba firmado con tu letra, en una fecha futura. Pero en la última página había una sola frase subrayada a lápiz, de una época que no recordabas: «Nunca fui yo quien lo escribió.» Entendiste que podés conocer el borrador y aun así no firmarlo. Saber no te condena. Solo te avisa. Cerraste la carpeta con las manos firmes, y fue la primera vez en años que no te temblaron.'
    },
    {
        id: 'n19b_ceniza',
        icon: '🔥',
        title: 'Ceniza',
        visible: function (p) { return storyChoice(p, 'n18_el_archivo') === 'quemar'; },
        check: function (p) { return p.level >= 18; },
        text: 'El expediente ardió sin humo, con olor a papel viejo y a tinta mojada. Mañana no gritó. Se rió bajito, casi con ternura. «Sin guion no vas a saber qué hacer», dijo. «Nadie sabe.» Era verdad, y dolió. Pero algo cambió en la sala: la luz de la llama te mostró las paredes por primera vez, sin niebla y sin ilusión. Había cientos de hojas pegadas, una por cada persona que se detuvo en Bahía Ceniza, cada una con una línea final sin firmar. No les faltaba el final: les faltaba la mano. Y vos, sin darte cuenta, ya tenías una lapicera en la tuya.'
    },
    {
        id: 'n20_la_tormenta',
        icon: '⛈️',
        title: 'La Noche de la Tormenta',
        check: function (p) { return p.level >= 20; },
        text: function (p) {
            var t = 'La tormenta llegó a Bahía Ceniza un jueves, sin avisar. Se cortó la luz en todo el puerto. En las calles, bajo las farolas apagadas, empezaron a aparecer figuras de niebla: el pianista, la estudiante, el corredor, todos los que dejaron. No amenazaban. Solo esperaban que alguien los llamara por su nombre. Al norte, el faro se encendió solo. ';
            t += 'Ismael apareció en la puerta con una linterna y el delantal puesto: «Cerré el bar. Primera vez en veintiséis años.» ';
            if (storyChoice(p, 'n06_lena') === 'aceptar') {
                t += 'Lena llegó en su auto sin patente, con el termo y la placa en el cinturón, como si nunca se hubiera ido: «Dijiste que ibas al faro. Voy.» ';
            } else {
                t += 'Lena no estaba. Había una luz en su ventana, pero no vino a buscarte. Todavía no. Iba a ser una noche larga. ';
            }
            if (storyChoice(p, 'n09_nora') === 'llamar') {
                t += 'En la radio, Nora transmitía sin parar: «A todos los que están despiertos: vayan hacia la luz del faro. Digan su nombre. Digan lo que dejaron.» Decenas de linternas empezaron a caminar hacia el norte. ';
            } else {
                t += 'La radio solo emitía estática, con un hilo de voz apenas audible. Era la tuya la voz que faltaba. ';
            }
            return t + 'Caminaste hacia el faro.';
        }
    },
    {
        id: 'n21_el_faro',
        icon: '🗼',
        title: 'El Último Faro',
        check: function (p) { return p.level >= 22; },
        text: 'El faro no era un faro: era una torre vieja con una linterna en la cima. Subiste los ciento doce escalones contando, uno por uno. Arriba, Mañana esperaba sentado frente a la máquina de escribir, con una sola hoja en el rodillo y un vaso de whisky servido hasta el borde. La última hoja tenía un renglón en blanco al final. «Es tuyo», dijo. «Escribí lo que quieras. O tomá el vaso y terminamos. O rompé la máquina, si eso te hace sentir mejor.» Afuera, la niebla se apretaba contra el vidrio. Abajo, las linternas seguían subiendo. El renglón seguía en blanco.',
        choices: [
            { id: 'escribir', label: 'Sentarte y escribir tu propia línea, con tu letra' },
            { id: 'destruir', label: 'Romper la máquina de escribir a golpes' },
            { id: 'beber', label: 'Tomar el vaso. Una última vez' }
        ]
    },

    // ───────────── FINALES ALTERNOS ─────────────
    {
        id: 'n22a_final_amanecer',
        icon: '🌅',
        title: 'Final: Amanecer en Bahía Ceniza',
        ending: true,
        visible: function (p) { return storyChoice(p, 'n21_el_faro') === 'escribir' && openCount(p) >= 2; },
        check: function (p) { return p.level >= 25; },
        text: function (p) {
            return 'Te sentaste frente a la máquina y escribiste: «Hoy.» Solo eso, con tu letra torcida, sin tachar. La máquina crujió, la cinta se cortó, y las hojas del sótano de San Dimas se llenaron de letras distintas, de todas las manos que habían subido esa noche. Mañana se quedó mirándote con algo parecido a la derrota y algo más parecido al alivio. «Qué raro», dijo. «Siempre pensé que ibas a preferir la comodidad.» «Yo también», dijiste. Salió el sol sobre el puerto, pálido, pero sol. Ismael abrió el bar con un cartel nuevo: «Café, té y agua». Lena se quedó dormida en el auto. Nora cerró el programa con un disco nuevo. Y vos supiste, sin ningún guion, que mañana es solo el día que viene después de hoy. ' + topAttrLine(p) + ' — Fin de la Temporada 1. Final: Amanecer.';
        }
    },
    {
        id: 'n22b_final_tinta',
        icon: '🖋️',
        title: 'Final: Tinta Propia',
        ending: true,
        visible: function (p) {
            var c = storyChoice(p, 'n21_el_faro');
            return (c === 'escribir' && openCount(p) < 2) || c === 'destruir';
        },
        check: function (p) { return p.level >= 25; },
        text: function (p) {
            var c = storyChoice(p, 'n21_el_faro');
            var cuerpo;
            if (c === 'destruir') {
                cuerpo = 'Rompiste la máquina a golpes. Hubo chispas, ruido de metal y, por un instante, tu propio grito. Cuando terminó, no quedaba nada que pudieras vencer: un renglón en blanco pegado a la pared y las manos en carne viva. Entendiste que destruir al enemigo no es lo mismo que escribir. Con el último pedazo de cinta, en la penumbra, escribiste un «Hoy» que temblaba. Alcanzó. No fue un final limpio: Mañana no murió, solo se quedó callado. ';
            } else {
                cuerpo = 'Escribiste tu línea sin ayuda: «Hoy.» Y funcionó, pero el faro quedó vacío: nadie había subido con vos. Habías peleado bien, solo. Se puede ganar así, pero la victoria se parece demasiado a una habitación vacía. Bajaste los ciento doce escalones con una promesa pequeña: la próxima vez, avisar. ';
            }
            return cuerpo + 'Salió el sol, igual que para todos. La niebla se quedó un rato más en el puerto, pero más fina. Había trabajo por hacer, y ahora era tuyo. ' + topAttrLine(p) + ' — Fin de la Temporada 1. Final: Tinta Propia.';
        }
    },
    {
        id: 'n22c_final_copa',
        icon: '🥃',
        title: 'Final: La Última Copa',
        ending: true,
        visible: function (p) { return storyChoice(p, 'n21_el_faro') === 'beber'; },
        check: function (p) { return p.level >= 25; },
        text: function (p) {
            return 'Tomaste el vaso. Estaba tibio y sabía exactamente igual que siempre. Mañana aplaudió despacio, sin burla, casi con tristeza. «Descansá», dijo. La hoja se llenó de líneas nuevas, prolijas, cómodas. La niebla se cerró sobre el puerto. Bajaste las escaleras sin sentir los escalones. Pero a mitad de camino, entre la gente que subía con linternas, alguien te agarró del brazo: Ismael. No te dijo nada. Te dio un vaso de agua. Y supiste que esa noche había terminado como terminan todas, con niebla, pero que mañana —el mañana de verdad, el que no escribe nadie— todavía estaba por empezar. Esta historia no termina acá. Terminó la temporada; vos seguís. ' + topAttrLine(p) + ' — Fin de la Temporada 1. Final: La Última Copa.';
        }
    }
];

// ============================================================
// ===== VISIBILIDAD, VERSIÓN Y DESBLOQUEO =====
// ============================================================

// Un capítulo alterno solo existe en el camino que elegiste.
function isChapterVisible(chapter) {
    return typeof chapter.visible !== 'function' || !!chapter.visible(player);
}

// Si la historia cambia por completo, el progreso viejo no encaja: se reinicia una sola vez.
function ensureStoryVersion() {
    if (player.storyVersion === STORY_VERSION) return;
    player.storyChapters = [];
    player.storyRead = [];
    player.storyChoices = {};
    player.storyVersion = STORY_VERSION;
}

function getChapterText(chapter) {
    if (typeof chapter.text === 'function') return chapter.text(player);
    return chapter.text;
}

function checkStoryUnlocks() {
    ensureStoryVersion();
    var unlockedAny = false;

    STORY_CHAPTERS.forEach(function (chapter) {
        if (!isChapterVisible(chapter)) return;
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

    showToast('Elegiste: "' + (choiceObj ? choiceObj.label : choiceId) + '"', 'info', 'Historia');
    addLogEntry('story', '🖤 Decisión tomada en "' + (chapter ? chapter.title : chapterId) + '"', choiceObj ? choiceObj.label : '', 0, 0, null);

    renderStory();
    checkStoryUnlocks();
}

function renderStory() {
    var container = document.getElementById('story-container');
    var progressEl = document.getElementById('story-progress');
    if (!container) return;

    ensureStoryVersion();

    var visibleChapters = STORY_CHAPTERS.filter(isChapterVisible);
    var unlockedCount = visibleChapters.filter(function (c) { return player.storyChapters.indexOf(c.id) !== -1; }).length;
    var totalCount = visibleChapters.length;
    if (progressEl) progressEl.textContent = unlockedCount + ' / ' + totalCount + ' capítulos';

    var html = '';
    visibleChapters.forEach(function (chapter, index) {
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
                choicesHTML = '<div class="story-choice-made">Elegiste: "' + (chosenLabel ? chosenLabel.label : madeChoice) + '"</div>';
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
