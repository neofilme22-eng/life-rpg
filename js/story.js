// ============================================================
// ===== MODO HISTORIA — TEMPORADA 1: "PUERTO CALMA" =====
// Thriller noir en primera persona. El progreso real (niveles, rituales,
// metas, eventos, la libreta de contactos, el Hospital, el ánimo) abre los
// capítulos. Algunos piden una decisión y esas decisiones cambian los capítulos
// siguientes. El final depende del atributo que más desarrollaste, y queda
// entreabierto para una próxima campaña.
// ============================================================

// Si cambia este valor, el progreso de la historia se reinicia (los capítulos nuevos no encajan con los viejos).
const STORY_VERSION = 'puerto-calma-1';

// ---------- Contadores que leen tu progreso real ----------
function dungeonsCompletadasCount(p) {
    if (!p.events) return 0;
    return p.events.filter(function (e) {
        return e.type === 'dungeon' && e.status === 'completed';
    }).length;
}

function bossesDerrotadosCount(p) {
    return (p.bosses || []).filter(function (b) { return b.defeated; }).length;
}

function contactsCount(p) { return (p.contacts || []).length; }

function contactsTalked(p) {
    return (p.contacts || []).reduce(function (s, c) { return s + (c.count || 0); }, 0);
}

function healCount(p) {
    return countLogEntries(p, function (e) { return e.type === 'heal'; });
}

function surpriseSolvedCount(p) {
    return countLogEntries(p, function (e) { return (e.title || '').indexOf('Evento sorpresa') === 0 && /completado/i.test(e.title); });
}

function maxRuneStreak(p) {
    return (p.rawRunes || []).reduce(function (m, r) { return Math.max(m, r.streak || 0); }, 0);
}

function everHurt(p) { return !!(p.tension && p.tension.lastHitDay); }

function attr(p, key) {
    return (p.attributes && p.attributes[key]) || 1;
}

// Decisión tomada en un capítulo (o null si todavía no se tomó)
function storyChoice(p, chapterId) {
    return (p.storyChoices && p.storyChoices[chapterId]) || null;
}

// El ánimo que anotaste por última vez, como palabra ("bien", "regular"...)
function lastMoodWord(p) {
    var log = p.moodLog || [];
    if (!log.length) return 'sin registrar';
    var last = log[log.length - 1];
    var labels = (typeof MOOD_LABELS !== 'undefined') ? MOOD_LABELS : ['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien'];
    return labels[(last.mood || 3) - 1].toLowerCase();
}

// La voz de tu libreta: la persona a la que hace más tiempo que no le hablás
function contactVoice(p) {
    var list = p.contacts || [];
    if (!list.length) return 'alguien a quien hace demasiado que no llamás';
    var best = list[0], bestDays = -1;
    list.forEach(function (c) {
        var d = (typeof contactElapsed === 'function') ? contactElapsed(c) : 0;
        if (d > bestDays) { bestDays = d; best = c; }
    });
    return escapeHtml(best.name);
}

// El atributo más desarrollado. Si empatan, gana el primero de este orden.
const STORY_ATTR_ORDER = ['mente', 'relaciones', 'social', 'creatividad', 'disciplina', 'fuerza', 'carrera', 'finanzas'];
function topAttrKey(p) {
    var best = STORY_ATTR_ORDER[0];
    STORY_ATTR_ORDER.forEach(function (k) { if (attr(p, k) > attr(p, best)) best = k; });
    return best;
}

// Texto según qué atributo es mayor (a vs b); si empatan, tie
function cmpAttr(p, a, b, textA, textB, tie) {
    var va = attr(p, a), vb = attr(p, b);
    if (va > vb) return textA;
    if (vb > va) return textB;
    return tie;
}

// Párrafos separados
function P() { return Array.prototype.slice.call(arguments).join('<br><br>'); }

const STORY_CHAPTERS = [
    // ───────────── ACTO I — LA LLEGADA ─────────────
    {
        id: 'c01_llegada',
        act: 'Acto I — La Llegada',
        icon: '🌧️',
        title: '4:44 a.m.',
        check: function (p) { return true; },
        text: P(
            `El colectivo me dejó en Puerto Calma a las 4:44 de la madrugada, con ese suspiro de frenos de los vehículos que ya no esperan pasajeros. Bajé yo solo. La lluvia no caía: se quedaba, como una opinión que nadie se anima a discutir.`,
            `Soy perito de siniestros de Mutual Horizonte. Mi trabajo es llegar cuando ya pasó todo y decidir cuánto vale lo que se perdió. No fumo —lo aclaro siempre primero, porque en estos pueblos fumar es una forma de saludar—, pero bebo: un whisky con una sola piedra de hielo, despacio, hasta que el vaso y yo dejamos de discutir. Me parece más honesto que el cigarrillo. El vaso, al menos, se vacía.`,
            `En el bolsillo interior del saco llevaba el expediente: <em>Siniestro 1208. Asegurado: Teodoro Ibarra, propietario de La Conservera Ibarra. Incendio parcial. El asegurado figura desaparecido desde hace once años.</em> Mutual Horizonte quería cerrarlo: pagar a quien apareciera o archivarlo para siempre. Lo que nadie me explicó es por qué mandaban a alguien por un caso de once años, ni por qué el cheque tenía fecha de mañana.`,
            `Sobre el puerto flotaba una niebla espesa que los vecinos llaman la Calma, con mayúscula y sin ironía. A las 4:44 sonó una sirena lejana, una sola, larga, que no avisaba de nada. Cuando terminó, el pueblo volvió a hacer ruido de pueblo, pero con un retardo, como una película mal doblada.`,
            `<em>Me pregunté, con esa fiebre fría de siempre, si había venido a averiguar algo sobre el siniestro de otro o a esconderme dentro del mío. Fue la primera de las mil preguntas que no iba a poder contestar. Ya me había acostumbrado: una pregunta sin respuesta pesa menos si la llevás en el bolsillo del saco.</em>`,
            `Al fondo de la calle mojada había un letrero que decía HOTEL ÁMBAR, en un neón que tartamudeaba. Caminé hacia la luz. Hay que caminar hacia algo.`
        )
    },
    {
        id: 'c02_bar',
        act: 'Acto I — La Llegada',
        icon: '🕰️',
        title: 'El Bar de las Once',
        check: function (p) { return p.level >= 2; },
        text: P(
            `El Bar de las Once tiene once relojes en la pared y ninguno marca la misma hora. Cosme, el que atiende, dice que es para que nadie pueda decir que llegó tarde. Tiene las manos grandes de quien alguna vez cargó cajones de pescado y la mirada de quien aprendió a no mirar la hora que le conviene.`,
            `Pregunté por Teodoro Ibarra. Cosme limpió un vaso que ya estaba limpio. «Teo se fue antes de que te dieran el expediente», dijo, y no supe si hablaba de once años o de esa misma tarde. En la rockola alguien había puesto un bolero lento; en el fondo, entre las mesas vacías, una mujer tarareaba bajito, sin micrófono, una melodía que ya había escuchado en otra vida.`,
            `<em>Hay una pregunta que todo hombre se hace frente a una barra, y no es qué va a tomar. Es qué va a hacer con el rato que le queda hasta el próximo vaso. Yo siempre contesté lo mismo, con cierto orgullo cansado: esperar. Esperar es mi talento. Podría dar clases.</em>`,
            `Cosme apoyó las dos manos en la madera y me miró, por fin, a los ojos. «¿Qué te sirvo, perito?»`
        ),
        choices: [
            { id: 'whisky', label: 'Lo de siempre: un whisky con una sola piedra.' },
            { id: 'cafe', label: 'Un café negro. Esta noche necesito la cabeza fría.' }
        ]
    },
    {
        id: 'c03a_hielo',
        act: 'Acto I — La Llegada',
        icon: '🥃',
        title: 'La Piedra de Hielo',
        visible: function (p) { return storyChoice(p, 'c02_bar') === 'whisky'; },
        check: function (p) { return p.level >= 3; },
        text: P(
            `El hielo se deshizo despacio, sin apuro, con el mismo desinterés con que se deshace todo. Bebí en tres tiempos, como me enseñaron a hacer las cosas que me hacen bien: sin prisa y sin testigos.`,
            `<em>Mi relación con el whisky es la de un matrimonio sin mala fe. No nos mentimos. Él sabe lo que prometo cada mañana y yo sé lo que me responde cada noche. Lo curioso es que nunca me prometió nada. Esa es la parte que no le perdono: me acompaña sin pedirme que sea otro.</em>`,
            `«Acá se bebe para que el tiempo se aguante a sí mismo», dijo Cosme, y rellenó el vaso con una sola gota más, como quien deja una propina. Los relojes de la pared siguieron discutiendo entre ellos. Ninguno me dio la razón.`
        )
    },
    {
        id: 'c03b_taza',
        act: 'Acto I — La Llegada',
        icon: '☕',
        title: 'La Taza Fría',
        visible: function (p) { return storyChoice(p, 'c02_bar') === 'cafe'; },
        check: function (p) { return p.level >= 3; },
        text: P(
            `El café llegó negro, humeante, con un platito de tarta de membrillo que no había pedido. «La mejor del condado», dijo Cosme, y señaló un cartel amarillento que nadie recuerda haber colgado. La probé por educación y me quedé por otra cosa: tenía el sabor exacto de una tarde de la infancia que nunca viví.`,
            `Pedir café en un bar es una declaración de guerra pequeña. El vaso de whisky lo sirve la costumbre; el café lo sirve una decisión. Me quedé mirando la taza hasta que dejó de humear, como se mira a un animal que se queda quieto para que no lo veas respirar.`,
            `<em>No bebí. Y me pregunté, con la lucidez incómoda de la cafeína, si me estaba cuidando o si solo estaba aplazando el vaso: postergar, esa vieja especialidad. Los dos hombres que llevo adentro discutieron un rato en voz baja. Ganó el que tenía sueño.</em>`
        )
    },
    {
        id: 'c04_libreta',
        act: 'Acto I — La Llegada',
        icon: '📖',
        title: 'La Libreta del Hotel',
        check: function (p) { return contactsCount(p) >= 1; },
        text: function (p) {
            var n = contactsCount(p);
            return P(
                `Ofelia Rinaldi atendía la recepción del Hotel Ámbar desde que el hotel era hotel. Pelo recogido, reloj de hombre, una paciencia de enfermera. Cuando bajé a pagar la primera noche me alcanzó un libro de tapas verdes, muy usado, y una lapicera atada con un hilo.`,
                `«No es el registro de huéspedes», aclaró. «Es la libreta. Acá nadie se va sin dejar el nombre de alguien a quien volver. Es el reglamento del hotel, no el del pueblo.» Después, más bajo: «Las puertas de Puerto Calma se abren desde adentro de la gente. Desde afuera solo se oxidan.»`,
                `Escribí un nombre. Después otro, si había otro. La libreta ya llevaba ` + n + (n === 1 ? ' nombre mío' : ' nombres míos') + `, y me sentí culpable de lo corta que era la lista, de lo fácil que había sido anotarla, de lo poco que me costaba escribir la palabra «extraño» sin llamar a nadie.`,
                `<em>Hay culpas que no tienen delito. Se parecen a las deudas de un banco al que nunca entraste: crecen sin que las veas, con una paciencia que ningún acreedor humano tendría. Quizás la primera deuda que contraje fue esa: con cada persona a la que dejé de hablarle por no saber cómo empezar.</em>`,
                `Ofelia guardó la libreta bajo el mostrador. «Volvé a hablarles», dijo, como quien comenta el clima. «Cuando los llames, la Calma se afloja. No mucho. Lo justo.»`
            );
        }
    },
    {
        id: 'c05_oficina',
        act: 'Acto I — La Llegada',
        icon: '🏛️',
        title: 'Oficina de Asuntos Pendientes',
        check: function (p) { return p.level >= 4; },
        text: P(
            `La Oficina de Asuntos Pendientes ocupa un bloque de hormigón en el centro de la plaza, sin ventanas, sin cartel y con una sola puerta, que está abierta. No hay fila. Yo era la fila. Un empleado de saco gris, con una placa que decía A. VIGIL, me esperaba detrás de un mostrador tan largo que no se le veía el final.`,
            `«Su expediente ya está iniciado», dijo, sin levantar la vista. «Solo falta su conformidad.» Pregunté de qué se me acusaba. «Acá no acusamos a nadie. Simplemente figuramos.» Y me deslizó un formulario: <em>77-B, Declaración de Pendientes</em>, catorce páginas en letra diminuta, con una línea en blanco al pie y el sello rojo todavía húmedo.`,
            `Había algo en esa oficina que me recordaba a un tribunal al que uno llega tarde, siempre tarde, sin haber sido citado. Una culpa sin acusación es la más cómoda de las culpas: no hay con quién discutir, así que uno discute consigo mismo, con ese rigor de abogado de oficio que siempre pierde.`,
            `<em>Pensé en firmar: era lo que hace la gente razonable, y yo siempre quise parecer razonable. Pensé en leer: era lo que hace la gente que desconfía, y yo, por oficio, desconfío hasta de lo que firmo con gusto.</em>`,
            `Vigil me alcanzó la lapicera. Su sonrisa tenía la paciencia de un reloj que nunca tuvo que apurarse.`
        ),
        choices: [
            { id: 'firmar', label: 'Firmar sin leer: «Total, es un trámite.»' },
            { id: 'leer', label: 'Leer las catorce páginas antes de firmar nada.' }
        ]
    },
    {
        id: 'c06a_conforme',
        act: 'Acto I — La Llegada',
        icon: '🖋️',
        title: 'Conforme',
        visible: function (p) { return storyChoice(p, 'c05_oficina') === 'firmar'; },
        check: function (p) { return p.level >= 4; },
        text: P(
            `Firmé. La tinta se me metió en la piel de la muñeca como si la lapicera hubiera tenido hambre. Vigil estampó el sello sobre el formulario y, por un instante, lo vi brillar también sobre mi piel, rojo y húmedo, antes de apagarse.`,
            `«De ahora en más, cada cosa que deje sin hacer tendrá su casillero», dijo, casi con ternura. «Es una comodidad, créame. Nadie se pierde nada.»`,
            `Salí a la plaza con la sensación de haber vendido algo que no sabía que tenía. <em>La libertad, supongo, se pierde igual que un paraguas: no el día en que te la roban sino el día en que dejás de notar que no la llevás en la mano.</em> Una gaviota que no existía en ninguna estación del año gritó sobre el hormigón. Después, silencio. El peor de los ruidos.`
        )
    },
    {
        id: 'c06b_letra_chica',
        act: 'Acto I — La Llegada',
        icon: '🔍',
        title: 'La Letra Chica',
        visible: function (p) { return storyChoice(p, 'c05_oficina') === 'leer'; },
        check: function (p) { return p.level >= 4; },
        text: P(
            `Leí las catorce páginas. Tardé cuarenta minutos y Vigil no se movió, no tosió, no miró el reloj: esperó con la paciencia de lo que no corre peligro. En la página nueve, entre dos cláusulas sobre la custodia de pendientes, encontré una frase en letra todavía más chica: <em>«El compareciente reconoce que la persona declarada desaparecida y el compareciente comparten...»</em> y el resto del renglón estaba tachado con una raya prolija, como si alguien se hubiera arrepentido a tiempo.`,
            `«Nadie llega a la página nueve», murmuró Vigil, por primera vez sin sonreír.`,
            `Firmé al final, con una condición escrita al margen, de mi puño, que él aceptó con un gesto de fastidio: <em>«Conforme con lo leído.»</em> Son tres palabras que pocos hombres escriben, y que sin embargo rinden más que una vida de firmas. Salí de la oficina con la sensación incómoda de haber ganado una discusión que todavía no entendía.`
        )
    },
    {
        id: 'c07_reglamento',
        act: 'Acto I — La Llegada',
        icon: '📋',
        title: 'Detrás de la Puerta',
        check: function (p) { return p.level >= 5; },
        text: P(
            `Mi habitación era la 18, cuarto piso, con una ventana que daba a la nada y una cortina bordó tan pesada que parecía tener opiniones. Detrás de la puerta, enmarcado con una prolijidad que me inquietó, colgaba un cartel amarillento: <em>REGLAMENTO DEL HUÉSPED.</em>`,
            `Lo leí de pie, con el saco puesto. Establecía cuánto costaba cada cosa en Puerto Calma: lo que se pierde cuando algo vence, lo que cuesta una noche sin ritual, lo que debe el que se calla demasiado tiempo, lo que cura una medicina y lo que cura un tratamiento. Estaba escrito con una claridad de manual de instrucciones, y eso era lo más inquietante: en este pueblo, las reglas eran lo único que no tenía niebla.`,
            `<em>Una ley injusta que se conoce es más soportable que una ley justa que se ignora. Kafka lo sabía; yo lo sospechaba. Quien conoce el precio de las cosas puede, al menos, elegir qué cosas pagar. Esa es toda la libertad que ofrecen los hoteles, los bancos y los pueblos pequeños.</em>`,
            `Antes de apagar la luz, volví a leerlo, en voz baja, como un conjuro. Si alguna vez dudo de cuánto cuesta algo, ahí está el reglamento. Pegado detrás de la puerta. A mano, como las cosas importantes.`
        )
    },
    {
        id: 'c08_telefono',
        act: 'Acto I — La Llegada',
        icon: '☎️',
        title: 'Teléfono, 4:44',
        check: function (p) { return contactsTalked(p) >= 1; },
        text: function (p) {
            return P(
                `A las 4:44, el teléfono de la habitación 18 sonó una sola vez, larga, igual que la sirena. Era un aparato negro, de disco, sin cable visible. Lo levanté pensando que se habían equivocado de cuarto, o de siglo.`,
                `No dijeron nada. Había una respiración, nada más, y debajo de la respiración, algo que reconocí antes que a la voz: el modo de callar. Era ` + contactVoice(p) + `. No lo supe por el nombre sino por el silencio, por esa manera de no decir que tienen las personas que nos quisieron y a las que dejamos de llamar.`,
                `<em>Murakami escribió alguna vez sobre un hombre que bajaba a un pozo seco para escuchar lo que pasaba afuera. Yo no tenía pozo: tenía un teléfono. Pero entendí lo mismo que él: hay llamadas que no se hacen para hablar, se hacen para comprobar que todavía existe alguien del otro lado.</em>`,
                `Del otro lado esperaban. No me apuraban. Esa es la forma más cruel de la paciencia: la que no reclama.`
            );
        },
        choices: [
            { id: 'hablar', label: 'Hablar. Decir su nombre y lo que no dije en todo este tiempo.' },
            { id: 'colgar', label: 'Colgar. Todavía no estoy listo.' }
        ]
    },
    {
        id: 'c09a_voz',
        act: 'Acto I — La Llegada',
        icon: '🎧',
        title: 'Lo que Dije en Voz Baja',
        visible: function (p) { return storyChoice(p, 'c08_telefono') === 'hablar'; },
        check: function (p) { return p.level >= 5; },
        text: function (p) {
            return P(
                `Hablé. Dije el nombre, primero, y fue como abrir una ventana en una habitación cerrada desde hace años: entró el aire y con el aire, el polvo. Después dije lo demás: que me había ido sin avisar, que había dejado pasar tanto tiempo que ya no sabía cómo se retomaba una conversación, que estaba en un pueblo que no figuraba en el mapa y que tenía miedo.`,
                `La respiración del otro lado cambió. Entonces habló ` + contactVoice(p) + `: una frase corta, de esas que sirven para todo. «Ya sé. Acá estoy.»`,
                `Colgué con las manos mojadas. En la ventana la niebla se había retirado unos metros, como un animal que ya no sabe si atacar. <em>No fue una victoria. Las victorias no tienen ese gusto a cansancio dulce. Fue algo más pequeño y más difícil: una puerta que quedó abierta, y yo parado en el marco, sin saber todavía si salir o seguir mirando.</em>`
            );
        }
    },
    {
        id: 'c09b_timbre',
        act: 'Acto I — La Llegada',
        icon: '📞',
        title: 'El Timbre que no Atendí',
        visible: function (p) { return storyChoice(p, 'c08_telefono') === 'colgar'; },
        check: function (p) { return p.level >= 5; },
        text: function (p) {
            return P(
                `Colgué. El auricular quedó caliente en mi mano, como un animal pequeño que ha dejado de temblar. Me quedé mirando el teléfono un buen rato, esperando que volviera a sonar, deseando secretamente que no lo hiciera.`,
                `Volvió a sonar a la noche siguiente, a las 4:44. Y a la otra. No lo atendí ninguna de las veces, pero aprendí a reconocer el timbre en la oscuridad, a esperarlo, a contar los segundos hasta que se detenía. Era ` + contactVoice(p) + `, estoy seguro: nadie más puede ser tan paciente.`,
                `<em>Hay silencios que son una forma de ladrar. Otros, una forma de pedir perdón. El mío, esa noche, era una tercera cosa: la de quien tiene la respuesta en la punta de la lengua y la cambia, por prudencia, por cualquier cosa. La cobardía, en los hombres pequeños, se parece sospechosamente a la delicadeza.</em>`,
                `Una cosa es no llamar. Otra, peor, es oír que te llaman y quedarte quieto.`
            );
        }
    },

    // ───────────── ACTO II — EL EXPEDIENTE ─────────────
    {
        id: 'c10_conservera',
        act: 'Acto II — El Expediente',
        icon: '🏭',
        title: 'La Conservera',
        check: function (p) { return p.level >= 6; },
        text: P(
            `La Conservera Ibarra se levantaba al final del muelle como una catedral que hubiera perdido la fe. Chapa acanalada, ventanas rotas con forma de bocas, un cartel desteñido que prometía <em>«Pescado de la Bahía, Hecho con Cariño»</em>. El óxido le había subido por las paredes hasta la mitad, y de ahí para arriba, en el punto exacto donde llegaba la luz de mi linterna, se detenía. Como si dudara.`,
            `Adentro, el aire olía a metal mojado y a algo dulce, descompuesto, que no pude nombrar. Las cintas transportadoras estaban quietas desde hace once años, cargadas todavía de latas sin etiquetar. Tomé una. Del lado de abajo, grabada con la precisión de las máquinas, figuraba una fecha de vencimiento. Tomé otra. La misma fecha. Y otra. <em>Todas vencían mañana.</em>`,
            `Una vez me contaron de un hombre que compraba latas de ananá con fecha de vencimiento y las comía el último día, sin falta, como quien cumple una cita con el tiempo. Yo tenía delante diez mil. <em>¿Qué se hace con diez mil promesas que expiran el mismo día? ¿Se las come uno? ¿Se las cobra? ¿O se las deja vencer, con la elegancia de quien sabe que no hay nada que perder?</em>`,
            `En el suelo de la oficina, bajo una pila de papeles húmedos, encontré una tapa de hierro con un asa oxidada. Una escotilla circular, sellada con candado nuevo, sin una sola gota de óxido. Alguien venía a cuidarla. Con la linterna entre los dientes, apoyé la oreja contra el metal y escuché, muy abajo, el eco de un goteo. O de un pozo.`
        )
    },
    {
        id: 'c11_brandan',
        act: 'Acto II — El Expediente',
        icon: '🕵️',
        title: 'El Inspector',
        check: function (p) { return dungeonsCompletadasCount(p) >= 1; },
        text: P(
            `El inspector Aurelio Brandán me esperaba en la barra del Bar de las Once con un impermeable que había visto mejores guerras y un tic en el hombro izquierdo, como si todavía cargara un fusil que nadie le había pedido que devolviera. Hablaba despacio, con la voz de quien ha repetido muchas veces la misma conversación con gente distinta.`,
            `«El tiempo no pasa, forastero», dijo, mientras revolvía el café. «Da vueltas. Uno gira la cuchara y cree que avanza.» Le dije que eso sonaba más a una frase de cantina que a una teoría. «Todas las teorías son frases de cantina», respondió. «Las buenas terminan con el que las dice en la cárcel o en la cama.»`,
            `Me estudió con un cuidado de entomólogo. Sabía quién era; sabía a qué venía. Pero había en su manera de mirar algo más: la curiosidad de quien ve entrar a un testigo que no sabe que lo es. <em>Una conversación entre hombres cansados tiene siempre dos niveles: lo que se dicen y lo que cada uno prefiere no saber.</em>`,
            `«Hace once años se perdieron tres personas en este pueblo», dijo al fin, sin levantar la voz. «Un dueño de fábrica, una enfermera y una maestra. Ninguno dejó una nota. Todos dejaron algo sin terminar.» Me clavó los ojos. «Decime, perito, ¿qué sabés vos del Siniestro 1208 que no figura en el expediente?»`
        ),
        choices: [
            { id: 'contar', label: 'Contarle todo: la oficina, las latas, la escotilla.' },
            { id: 'mentir', label: 'Mentirle: «Solo soy un perito. Vine a tasar daños.»' }
        ]
    },
    {
        id: 'c12a_aliado',
        act: 'Acto II — El Expediente',
        icon: '🚔',
        title: 'Dos en el Mismo Coche',
        visible: function (p) { return storyChoice(p, 'c11_brandan') === 'contar'; },
        check: function (p) { return p.level >= 7; },
        text: function (p) {
            var firma = storyChoice(p, 'c05_oficina') === 'firmar'
                ? '«Firmaste sin leer», dijo, y no fue una pregunta. «Todos firman sin leer. Yo no firmé nunca, y por eso sigo acá, aunque nunca me haya ido.»'
                : '«Leíste el formulario», dijo, y por primera vez lo vi sonreír de lado. «Nadie llega a la página nueve. Yo llegué. Por eso estoy acá, y por eso no puedo irme.»';
            return P(
                `Le conté todo. Hablar con alguien que no te interrumpe es una forma rara de higiene. Brandán fumaba sin parar, los cigarrillos terminándose como frases cortadas, y cada tanto asentía con una lentitud de juez.`,
                firma,
                `Subimos a su patrullero, un modelo viejo con olor a cuero y a lluvia. Manejó sin destino por las calles vacías, con la radio en una estación que solo emitía estática y a veces un murmullo, como si alguien rezara muy lejos. «Las tres personas que se perdieron firmaron el 77-B», dijo. «Los tres tenían algo pendiente. Y a los tres, la Calma les llegó antes que la fecha.»`,
                `<em>Me sentí, por primera vez en mucho tiempo, menos solo, y eso me asustó más que cualquier cosa que hubiera visto en la Conservera. Cuando uno deja de estar solo, deja también de tener excusas.</em>`
            );
        }
    },
    {
        id: 'c12b_mentira',
        act: 'Acto II — El Expediente',
        icon: '🤥',
        title: 'Lo que Callé',
        visible: function (p) { return storyChoice(p, 'c11_brandan') === 'mentir'; },
        check: function (p) { return p.level >= 7; },
        text: P(
            `Mentí. Dije que era solo un perito, que venía a tasar daños, que el seguro quería cerrar el expediente de una vez. Lo dije con la voz prolija de las mentiras de oficina, esas que no necesitan creerse: solo necesitan sonar a trabajo.`,
            `Brandán me escuchó con una paciencia que me pareció, de pronto, una forma de desprecio. «Mentís mal», dijo al fin, sin enojo. «Tenés cara de hombre que no miente seguido. Eso, en un pueblo como este, es peor que mentir bien.»`,
            `Pagó los cafés. Antes de irse, dejó sobre la barra una tarjeta con un número de teléfono y una sola palabra al dorso: <em>«Cuando quieras.»</em> Me quedé mirándola mucho tiempo, entendiendo que hay dos clases de soledad: la que nos toca y la que elegimos para no tener que explicarnos.`,
            `<em>Yo había elegido la segunda. Como siempre. Con la elegancia de un hombre que se cree prudente y que en realidad solo tiene miedo de que lo conozcan.</em>`
        )
    },
    {
        id: 'c13_clinica',
        act: 'Acto II — El Expediente',
        icon: '🏥',
        title: 'La Clínica del Ámbar',
        check: function (p) { return healCount(p) >= 1; },
        text: P(
            `La Clínica del Ámbar quedaba detrás del hotel, por un pasillo de baldosas blancas que olía a lavandina y a alcohol etílico. Una sirena —otra vez la sirena— sonó dos veces mientras caminaba. En las paredes, la pintura se caía en láminas, y debajo de la pintura había otra pintura, igual de blanca, igual de vieja.`,
            `Las enfermeras no tenían rostro: tenían una expresión puesta, como un uniforme. Me atendieron con una eficiencia que no preguntaba nada. Me trataron como a una pared que se descascara: con paciencia, con pomada, sin mirarme nunca a los ojos. Y sin embargo, cuando salí, algo en mi cuerpo había vuelto a un lugar que había olvidado.`,
            `<em>Nadie nos dice que cuidarse es lo único que se parece a la fe: no pide un dios, pide un martes. Un vaso de agua, una caminata, una comida a hora. Camus pidió imaginar a Sísifo feliz; yo me conformo con imaginarlo cuidándose los tobillos. La roca no cambia. Pero los tobillos sí aguantan, y todo lo que sigue depende de que aguanten.</em>`,
            `En el pasillo, una enfermera me alcanzó un papel doblado. Adentro, escrita con letra de médico, una sola recomendación: <em>«Después del daño, tratamiento. Después del tratamiento, descanso. Y después, volver a salir.»</em> Hay verdades que solo se dicen con membrete.`
        )
    },
    {
        id: 'c14_hoja',
        act: 'Acto II — El Expediente',
        icon: '📄',
        title: 'La Hoja que Escribe',
        check: function (p) { return maxRuneStreak(p) >= 3; },
        text: function (p) {
            return P(
                `Tres noches seguidas encendí la linterna, cumplí mis rituales y me acosté a la misma hora. A la cuarta, al volver a la habitación 18, encontré una hoja tipeada sobre la almohada. Una sola, con las marcas hundidas de una máquina de escribir vieja y la tinta todavía fresca.`,
                `Decía: <em>«Hoy el perito se sintió ` + lastMoodWord(p) + `. Bajó las escaleras sin saber por qué. Dudó antes de llamar a alguien. No lo hizo. Después de la medianoche pensó, por primera vez, que quizás no había venido a Puerto Calma por el expediente.»</em> Todo lo que decía había pasado. Casi. Lo último, todavía no.`,
                `Alguien escribía mi día antes de que yo lo viviera, o después, o a la vez; la diferencia, en una ciudad sin reloj, es solo una cuestión de estilo. En el borde inferior había una segunda hoja, doblada, sin leer. La próxima línea.`,
                `<em>Si la literatura sirve para algo es para descubrir que la vida ya fue escrita por otro y que a uno solo le queda corregirla. Yo, que firmé informes toda la vida, sabía mejor que nadie lo que cuesta tachar la prosa de otro.</em> La luz de la linterna temblaba sobre el papel como una vela frente a una corriente.`
            );
        },
        choices: [
            { id: 'leer', label: 'Leer la segunda hoja. Prefiero saber.' },
            { id: 'quemar', label: 'Quemarla sin abrirla. El futuro no se lee, se hace.' },
            { id: 'guardar', label: 'Guardarla doblada en la billetera. Por si algún día me animo.' }
        ]
    },
    {
        id: 'c15a_leida',
        act: 'Acto II — El Expediente',
        icon: '📖',
        title: 'Lo que Decía la Segunda Hoja',
        visible: function (p) { return storyChoice(p, 'c14_hoja') === 'leer'; },
        check: function (p) { return p.level >= 9; },
        text: P(
            `La abrí. Mi futuro estaba escrito con una prosa impecable, sin una sola falta de ortografía: tardes iguales, la misma barra, las mismas conversaciones con la misma gente, un hombre que envejece con una discreción admirable. Era razonable. <em>Eso era lo terrible.</em> No había tragedia, ni siquiera amenaza: solo una vida cómoda, bien redactada, que nadie iba a lamentar.`,
            `La leí dos veces, buscando el error. No había error. Quien escribió eso me conocía mejor que yo, y no me odiaba: me cuidaba, a su manera, con el afecto sin ambición de los que no esperan nada de nosotros.`,
            `<em>Dostoievski creía que el hombre prefiere el sufrimiento a la comodidad si esa comodidad es una jaula. Lo creía porque lo había vivido. Yo, que aún no lo había vivido, lo entendí en el instante exacto en que dejé de poder leer.</em> Doblé la hoja y la dejé donde estaba. Sentí, por primera vez, ganas de contradecirla. Eso, quizás, era el único error de redacción posible.`
        )
    },
    {
        id: 'c15b_ceniza',
        act: 'Acto II — El Expediente',
        icon: '🔥',
        title: 'Ceniza',
        visible: function (p) { return storyChoice(p, 'c14_hoja') === 'quemar'; },
        check: function (p) { return p.level >= 9; },
        text: P(
            `La quemé con el encendedor del hotel, sobre el lavabo, sin abrirla. Ardió sin humo, con olor a papel viejo y a tinta mojada, y por un instante creí oír, en el pasillo, el golpeteo desesperado de una máquina de escribir que no podía seguir el ritmo.`,
            `La ceniza no cayó. Flotó un momento sobre la pileta, ordenada en una línea de letras, y después se deshizo sola: <em>«Como quieras.»</em> No fue un reproche. Fue casi un permiso.`,
            `Dormí esa noche sin soñar, y al despertar tenía la sensación rara de haber quedado, por fin, en blanco. <em>Un hombre que quema su futuro sin leerlo no es valiente: es, a lo sumo, coherente con su miedo. Pero a veces la coherencia con el miedo es la única valentía disponible.</em> En la calle, la niebla parecía un poco menos segura de sí misma.`
        )
    },
    {
        id: 'c15c_guardada',
        act: 'Acto II — El Expediente',
        icon: '👛',
        title: 'Una Hoja en la Billetera',
        visible: function (p) { return storyChoice(p, 'c14_hoja') === 'guardar'; },
        check: function (p) { return p.level >= 9; },
        text: P(
            `La guardé doblada en la billetera, entre una foto vieja y un billete que no cambié nunca. No la abrí. A veces la sentía, un rectángulo apenas más grueso que el resto, como un amuleto que no se atreve a ser amuleto.`,
            `Todos los días la tocaba al pagar el café. Todos los días me decía que la próxima vez, sí, que cuando estuviera más fuerte, que quizás después de la próxima semana. <em>Las cosas que no abrimos se vuelven más grandes por el simple hecho de no haberlas abierto. Cualquier pendiente es más pesado que su contenido.</em>`,
            `Cosme, un día, vio el borde de la hoja. No dijo nada. Pero esa noche, al servirme, dejó el vaso un poco más cerca, con una amabilidad de cómplice. Cuando se vive con una puerta cerrada en el bolsillo, los demás tienden a hablar más bajito.`
        )
    },
    {
        id: 'c16_visita',
        act: 'Acto II — El Expediente',
        icon: '🚪',
        title: 'La Visita',
        check: function (p) { return surpriseSolvedCount(p) >= 1; },
        text: P(
            `Esa noche, algo estaba en el pasillo del hotel. No lo vi enseguida. Primero fue una corriente fría bajo la puerta, después un zumbido eléctrico en las paredes, ese ruido de fondo que hacen las cosas cuando están a punto de dejar de ser lo que eran. Las cortinas bordó de la 18 se movieron sin viento.`,
            `Salí. En el extremo del pasillo, de espaldas, había una figura de traje oscuro, quieta, mirando una pared vacía. Hablaba bajito, con las sílabas al revés, como un disco pasado hacia atrás. Reconocí una palabra: mi nombre. Entonces se dio vuelta y no supe si me miraba o si yo estaba mirándome.`,
            `No hice lo que hacen en las películas. No corrí, no grité. Caminé hacia ella, y a mitad de camino cumplí con lo que me pedía sin pedírmelo: terminé lo que tenía que terminar. La figura asintió, o eso creí, y la luz del pasillo parpadeó tres veces. Cuando volvió estable, estaba solo.`,
            `<em>Hay visitas que no se resisten: se atienden. Quien las ignora las agranda. Quien las enfrenta, las vuelve de su tamaño. Aprendí esa noche que casi todo lo que me daba miedo tenía mi talle, y que casi nunca me quedaba ancho.</em>`
        )
    },
    {
        id: 'c17_mara',
        act: 'Acto II — El Expediente',
        icon: '🎤',
        title: 'Mara',
        check: function (p) { return contactsTalked(p) >= 3; },
        text: function (p) {
            return P(
                `La mujer que tarareaba en el Bar de las Once se llamaba Mara Olmos, y cantaba solo cuando creía que nadie la escuchaba. Ese día me descubrió escuchándola. No se detuvo; se corrió un poco, como se le hace lugar a alguien en un banco.`,
                `Nos cruzamos de costado en el pasillo angosto que lleva a los baños, con esa torpeza de dos personas que se rozan sin quererlo y que después no pueden dejar de recordarlo. «Dicen que no hay que contar los días», dijo. «Yo los cuento igual. Llevo mil cuatrocientos noventa y uno. ¿Vos?» No supe qué contestar. Hay números que uno lleva sin saberlo.`,
                `<em>Las historias de amor que no empiezan son las más largas. Tienen todo el tiempo del mundo para convertirse en otra cosa: en una canción, en un lunes, en una forma de mirar por la ventana. Con Mara no hubo nada, y sin embargo, años después, lo recordaría como lo único que había pasado ese año.</em>`,
                `Me miró de frente. «¿A quién tenés que llamar?», preguntó. Era una pregunta absurda y exacta. Pensé en la libreta de Ofelia, en las voces que había recuperado, en las que no. «Vení», dijo. «Hay una azotea. Hay lluvia. Y hay un teléfono.»`
            );
        },
        choices: [
            { id: 'acompanar', label: 'Acompañarla a la azotea, bajo la lluvia.' },
            { id: 'dejar', label: 'Dejarla ir. Todavía no sé qué hacer con tanto cielo.' }
        ]
    },
    {
        id: 'c18a_azotea',
        act: 'Acto II — El Expediente',
        icon: '🌧️',
        title: 'La Azotea',
        visible: function (p) { return storyChoice(p, 'c17_mara') === 'acompanar'; },
        check: function (p) { return p.level >= 10; },
        text: P(
            `Subimos por una escalera de incendio que gemía con cada escalón. Arriba, la lluvia caía de costado y un teléfono público, absurdo, atornillado a una pared sin edificio, sonaba solo, una vez cada tanto. Mara se quedó a un metro de distancia, mirando la ciudad como se mira a un conocido al que ya no se le teme.`,
            `Atendí. No sé qué voz esperaba. Era una voz de hombre, serena: «Cuando quieras volver, el camino queda abierto.» Eso fue todo. Colgué. Mara me miró con esa sonrisa de los que han escuchado lo mismo y no les alcanzó. «No es el final», dijo. «Los finales vienen después. Esto es el primer día de cualquier cosa.»`,
            `<em>Fuimos dos personas bajo la lluvia, sin tocarnos, esperando que algo importante pasara y comprendiendo, con la sabiduría cansada de la noche, que ya había pasado: estábamos ahí, juntos, sin haberlo planeado. Eso, que parece poco, es lo único que no se puede fingir.</em>`
        )
    },
    {
        id: 'c18b_ausencia',
        act: 'Acto II — El Expediente',
        icon: '🌫️',
        title: 'Lo que no Subí a Decir',
        visible: function (p) { return storyChoice(p, 'c17_mara') === 'dejar'; },
        check: function (p) { return p.level >= 10; },
        text: P(
            `La dejé ir. Se alejó por el pasillo con ese paso de quien no insiste, y la melodía que tarareaba se fue apagando de a poco, como si la fuera guardando.`,
            `Volví a mi habitación y me senté frente a la ventana. Hay noches en las que uno se pasa horas imaginando conversaciones que no tuvo, y en las que cada una sale mejor que la verdadera. <em>Esa fue la peor de todas: ensayé la respuesta perfecta, la mirada exacta, el momento en que ella, al fin, sonreía. En ninguna de ellas, yo me quedaba callado.</em>`,
            `Me imaginé a Sísifo pidiendo un cuarto en un hotel y descubriendo que la roca ya estaba adentro, esperándolo, con la paciencia de lo que no se va. Los arrepentimientos son los pendientes que nadie firmó.`
        )
    },
    {
        id: 'c19_costo',
        act: 'Acto II — El Expediente',
        icon: '🩹',
        title: 'El Costo',
        check: function (p) { return everHurt(p); },
        text: P(
            `Nada de esto sale gratis. En Puerto Calma, todo se paga por adelantado y en cuotas, con un interés que no figura en ningún contrato. Hay días en que la Calma me golpea de a poco, un poquito más cada vez: uno aprende a reconocer el golpe antes de que llegue, a contar los días seguidos en que dolió, a sospechar que el dolor de mañana es el interés del de hoy.`,
            `Una noche, al volver, el espejo del hotel devolvió una cara que no reconocí: más delgada, con más pliegues, con una mirada de hombre al que ya le dijeron muchas veces que no. Tenía una herida chica en la mano. No recordaba cuándo me la había hecho. Eso, creo, es lo que más me asustó.`,
            `<em>Dostoievski escribió que el sufrimiento es la única causa de la conciencia. No lo creo del todo. Pero creo que el sufrimiento llega antes que la conciencia, que la anuncia, que le prepara la cama. Y que una conciencia que se despierta sin dolor es una conciencia que se duerme igual, sin avisar.</em>`,
            `Fui a la Clínica. Me curaron. Volví a salir. Y esa es, creo, toda la técnica: caerse, curarse, volver a salir. No hay otra. Los que la inventaron la escribieron en letra grande y nadie les hizo caso.`
        )
    },

    // ───────────── ACTO III — EL POZO ─────────────
    {
        id: 'c20_asegurado',
        act: 'Acto III — El Pozo',
        icon: '🗂️',
        title: 'El Asegurado',
        check: function (p) { return p.level >= 14; },
        text: function (p) {
            var cierre = cmpAttr(p, 'mente', 'relaciones',
                'Lo armé como se arman estos casos: una columna para lo que sabía, otra para lo que había visto, una tercera para lo que me negaba a ver. La tercera era la más larga.',
                'No lo armé con columnas. Lo supe como se saben las cosas importantes: por el modo en que me dolió el pecho antes de que la cabeza dijera nada.',
                'El orden y el pálpito coincidieron esta vez, y esa coincidencia, entre hombres cansados, es una forma de certeza.');
            return P(
                `Volví a la oficina de la Conservera con la linterna y con todo lo que había recogido en el pueblo. Esta vez no revisé los papeles: me senté en el escritorio de Teodoro Ibarra, en su silla, mirando lo que él habría mirado. Una lámpara verde. Un cajón sin llave. Una hoja en blanco, con el mismo tipo de máquina de escribir que había dejado mi futuro sobre la almohada.`,
                `En el cajón, la póliza. La leí con atención de perito, que es la atención de los que desconfían de todo. Fecha de nacimiento del asegurado: el mismo día que yo. Domicilio anterior: el mío. Y al pie, la firma de Ibarra, una firma que reconocí con el cuerpo antes que con la cabeza: era mi letra. <em>Tal cual. Con la misma curva torcida en la «T» que corrijo todos los años en los formularios del banco.</em>`,
                `Detrás de la póliza, la foto. Un hombre mayor que yo, más flaco, con la misma manera de sostener el vaso. Lo miré durante mucho tiempo, esperando que el parecido se disolviera. No se disolvió. <em>Teodoro Ibarra no se había perdido. Era lo que me iba a pasar si me quedaba. Era el hombre que se había quedado.</em>`,
                cierre,
                `«Ahora entiende por qué el cheque vence mañana», dijo Vigil desde la puerta, sin ruido, con el saco gris perfectamente seco. «El siniestro es usted. Lleva once años incendiándose despacio, y nadie lo ha reclamado.» Por primera vez, no sonreía.`
            );
        }
    },
    {
        id: 'c21_pozo',
        act: 'Acto III — El Pozo',
        icon: '🕳️',
        title: 'El Pozo',
        check: function (p) { return p.level >= 18; },
        text: function (p) {
            return P(
                `Volví a la Conservera al atardecer, con la linterna, la libreta de Ofelia y todo lo que había juntado en Puerto Calma. Los pasos me llevaron solos hasta la escotilla de hierro, el candado nuevo, el óxido que no se acercaba. Alguien había dejado las llaves colgando del asa, con la prolijidad de quien invita.`,
                `Vigil esperaba junto al pozo, con un libro mayor abierto sobre los brazos. Había una columna con mi nombre y otra, más larga, con todo lo que había postergado desde que era chico. No eran errores graves: eran pendientes, pequeñas deudas sin vencimiento. «Es el saldo», dijo. «Puede bajar a cancelarlo, o puede cerrar la tapa y seguir como estaba. Esta noche las dos opciones son válidas.»`,
                `<em>Las últimas decisiones de la vida no se toman de una vez. Se toman a lo largo de años, en voz baja, con pequeños gestos que parecen insignificantes. La única diferencia con las de hoy es que alguien, esta noche, estaba mirando. Hay un pozo, hay una tapa y hay un número escrito en una libreta. Eso es todo lo que ofrece el mundo, siempre: una escalera, una puerta y un teléfono.</em>`,
                `La niebla se había detenido a pocos metros, esperando. En ninguna parte sonó una sirena. Era mi turno.`
            );
        },
        choices: [
            { id: 'bajar', label: 'Bajar al pozo, sin cuerda.' },
            { id: 'cerrar', label: 'Cerrar la tapa y enfrentar lo que venga desde arriba.' },
            { id: 'llamar', label: 'Marcar el número de mi libreta y decir mi nombre.' }
        ],
        // Al decidir, la historia fija el atributo que más desarrollaste: ese define el final.
        onChoice: function (p, choiceId) {
            if (!p.storyMeta) p.storyMeta = {};
            p.storyMeta.attr = topAttrKey(p);
            p.storyMeta.final = choiceId;
        }
    },

    // ───────────── FINALES (según tu atributo más desarrollado) ─────────────
    {
        id: 'f1_fuerza', act: 'Finales', icon: '💪', title: 'Final: Las Manos', ending: true,
        visible: function (p) { return endingIs(p, 'fuerza'); },
        check: function (p) { return true; },
        text: function (p) {
            return P(
                umbral(p),
                `Lo que vino después no fue pensado: fue cuerpo. La Calma me pesó como agua en los pulmones, y lo único que supe hacer fue lo que mis manos sabían, aprendido en mil mañanas de trote y de sudor: aferrarme y subir. Cada barra de hierro fue una frase corta. Una más. Una más. Perdí la cuenta y seguí.`,
                `Cuando llegué al borde tenía las manos peladas y el cuerpo temblando. Vigil, con el libro mayor, me esperaba con el sello levantado. «Nadie puede estamparse a un hombre que se mueve», dije, y apenas reconocí mi propia voz. Él bajó el sello. Cerró el libro. Fue la primera vez que lo vi parecer lo que era: un empleado cansado.`,
                cameo(p),
                `Salí al muelle con el amanecer encima. Las latas, todas, vencieron en la madrugada con un chasquido de metal, como un aplauso lejano. Me senté en el suelo, con las manos abiertas sobre las rodillas. <em>Estaba cansado y vivo, que son dos formas de decir lo mismo cuando uno hizo, con el cuerpo, todo lo que pudo.</em>`
            );
        }
    },
    {
        id: 'f2_disciplina', act: 'Finales', icon: '🕰️', title: 'Final: El Horario', ending: true,
        visible: function (p) { return endingIs(p, 'disciplina'); },
        check: function (p) { return true; },
        text: function (p) {
            return P(
                umbral(p),
                `No hubo épica. Hubo método. Hice lo que hacía todas las noches: ordené lo que tenía a mano y lo hice una cosa por vez. La linterna a la izquierda. La libreta a la derecha. Un ritual, otro ritual, el siguiente. La Calma, que se alimenta del que posterga, no sabía qué hacer con un hombre que hace lo que dijo a la hora que dijo.`,
                `Vigil abrió el libro mayor y empezó a leer en voz alta mis pendientes. Los fui tachando de a uno, con el sello rojo que me había dejado en la muñeca, esa tinta que alguna vez creí una marca de propiedad. <em>Resultó ser, en las manos correctas, una simple lapicera.</em> Cuando terminé, el libro estaba lleno de líneas rectas y la oficina, vacía.`,
                cameo(p),
                `Al amanecer, el pueblo hizo ruido de pueblo, sin retardo, sin doblaje: la voz y la boca, por fin, coincidían. <em>La disciplina no salva a nadie. Pero cualquier salvación, vista de cerca, se parece mucho a un horario cumplido durante el tiempo suficiente.</em> Puse la alarma para las seis. Lo sentí como el mayor acto de fe que había hecho en años.`
            );
        }
    },
    {
        id: 'f3_mente', act: 'Finales', icon: '🧠', title: 'Final: La Respuesta', ending: true,
        visible: function (p) { return endingIs(p, 'mente'); },
        check: function (p) { return true; },
        text: function (p) {
            return P(
                umbral(p),
                `Lo entendí todo de golpe, con esa claridad fría de los últimos capítulos de una novela policial. Las tres personas desaparecidas, los formularios, las latas que vencían el mismo día, el pozo: era un mismo mecanismo visto desde tres ángulos. <em>La Calma no era un monstruo, ni un castigo, ni un fantasma. Era una función: tomaba lo que alguien dejaba sin terminar y lo conservaba. Como una conserva. Con fecha de vencimiento y todo.</em>`,
                `Le dije a Vigil el nombre del mecanismo. Se quedó inmóvil. «Nadie me lo había dicho en voz alta», murmuró. Yo tampoco había dicho nunca algo que me costara tanto. Saber una cosa duele; saberla en voz alta duele más; pero ninguna otra clase de saber sirve.`,
                cameo(p),
                `La niebla se retiró, no por miedo, sino por falta de trabajo. En el muelle, al amanecer, entendí el precio de la respuesta: nunca más iba a poder no saber. <em>La lucidez es una puerta que solo abre hacia adentro. Una vez que se cruza, se vive del lado de la verdad, que es un lugar luminoso y bastante solitario.</em>`
            );
        }
    },
    {
        id: 'f4_creatividad', act: 'Finales', icon: '🎨', title: 'Final: Lo que no Estaba en la Hoja', ending: true,
        visible: function (p) { return endingIs(p, 'creatividad'); },
        check: function (p) { return true; },
        text: function (p) {
            return P(
                umbral(p),
                `No había salida en el expediente. Tampoco en la póliza, ni en el reglamento, ni en el libro mayor de Vigil. Entonces hice lo que no estaba permitido: inventé una. Saqué la lapicera, abrí la hoja en blanco que había quedado en la máquina de Ibarra y escribí, con mi letra torcida, una puerta. Después, la ventana que daba a la puerta. Después, el pasillo.`,
                `Detrás de la escotilla, las cortinas bordó de la habitación 18 se abrieron como en un teatro, y la luz que entró no era de este mundo ni de ninguno que yo conociera. <em>Lynch decía que todo es un sueño dentro de otro sueño. Yo descubrí que, en un sueño, la persona que escribe es la única que no necesita permiso.</em> Vigil me miró con el desconcierto de un burócrata ante una forma inexistente. «Eso no figura», dijo. «Ahora sí», contesté.`,
                cameo(p),
                `Cuando el sol subió, la hoja se había vuelto una calle verdadera. Salí a caminar por ella. No sabía adónde llevaba. <em>Creo que esa es la definición de lo que escribe un hombre libre: una calle que todavía no sabe adónde va.</em>`
            );
        }
    },
    {
        id: 'f5_carrera', act: 'Finales', icon: '💼', title: 'Final: La Firma', ending: true,
        visible: function (p) { return endingIs(p, 'carrera'); },
        check: function (p) { return true; },
        text: function (p) {
            return P(
                umbral(p),
                `Hice lo único que sabía hacer con seriedad: cerré el expediente. Con el rigor de quien lleva años redactando informes que nadie lee, escribí el mío, hasta la última cláusula. <em>Siniestro 1208. Causa: pendientes acumulados durante once años. Responsable: el asegurado. Resolución: pago íntegro, a la persona correcta, hoy.</em> Y firmé con mi nombre, no con el de Ibarra, en una línea que no estaba en ningún formulario.`,
                `Vigil leyó el informe con una atención que nunca le había visto. «Es el primer expediente bien cerrado que veo en mucho tiempo», admitió, y estampó el sello en el margen. El óxido, que subía por las paredes de la Conservera, retrocedió un palmo, como un perro al que le dieran una orden clara.`,
                cameo(p),
                `Mutual Horizonte me ofreció, a la semana, un ascenso que parecía un castigo y un castigo que parecía un ascenso. Todavía no sé cuál elegí. <em>Un hombre que hace bien su trabajo se gana el derecho a que le propongan trabajos más difíciles. Una forma sutil de agradecimiento, y de amenaza.</em>`
            );
        }
    },
    {
        id: 'f6_finanzas', act: 'Finales', icon: '💰', title: 'Final: Saldo', ending: true,
        visible: function (p) { return endingIs(p, 'finanzas'); },
        check: function (p) { return true; },
        text: function (p) {
            return P(
                umbral(p),
                `Siempre fui un hombre que lleva las cuentas. Cuando Vigil abrió el libro mayor, no vi una condena: vi una planilla. Debe, Haber, columnas prolijas. Pagué lo que debía. A Ibarra, que no era otro que yo, una tarde de descanso sin culpa. A mi cuerpo, la deuda de todas las noches de sueño que le robé. A la gente de la libreta, las llamadas pendientes, con intereses.`,
                `Cuando saldé la última partida, el libro mayor emitió un sonido breve, como el de una caja registradora que se cierra. Vigil lo cerró. En el casillero final, en tinta roja, apareció una cifra que no entendí hasta que la leí dos veces: <em>«Saldo a favor.»</em> No era dinero. Era algo que no tiene nombre en ninguna contabilidad: tiempo sin deudas.`,
                cameo(p),
                `Camus escribió que lo único serio de la vida es la cuenta que uno le debe a sí mismo. Nunca me gustó el tono grave de esa frase. Pero salí al muelle con la sensación liviana de un hombre que, por primera vez, no debe nada a nadie, y menos que a nadie, a sí mismo.`
            );
        }
    },
    {
        id: 'f7_social', act: 'Finales', icon: '🍰', title: 'Final: La Mesa Larga', ending: true,
        visible: function (p) { return endingIs(p, 'social'); },
        check: function (p) { return true; },
        text: function (p) {
            return P(
                umbral(p),
                `No lo hice solo. Eso fue lo primero que entendí: la Calma no se enfrenta, se acompaña. Salí de la Conservera sin saber qué esperaba, y al volver al pueblo la plaza estaba llena. Cosme con una bandeja de tarta, Ofelia con su libreta, el inspector con el impermeable seco, Mara cantando bajito. Una mesa larga, de esas que se arman para los velorios y las bodas, y que son, bien miradas, la misma ceremonia.`,
                `Nadie dijo nada importante. Se habló del clima, de los precios, del mal servicio del colectivo. <em>Es increíble cuánta salvación cabe en las conversaciones que no tratan de nada.</em> En el Bar de las Once, a medianoche, los once relojes marcaron por primera vez la misma hora, aunque ninguno de nosotros pudo ponerse de acuerdo sobre cuál era.`,
                cameo(p),
                `Vigil apareció en la puerta, con el saco gris, a mirar. Cosme le ofreció un plato. Lo aceptó, con una cortesía de quien no sabía que existía el gesto. <em>Una mesa llena de gente es la única arma que no mata a nadie y que, sin embargo, deja sin trabajo a las sombras.</em> Me serví una porción. Sabía a tarde de infancia. A esa que, esta vez, sí viví.`
            );
        }
    },
    {
        id: 'f8_relaciones', act: 'Finales', icon: '☎️', title: 'Final: La Llamada', ending: true,
        visible: function (p) { return endingIs(p, 'relaciones'); },
        check: function (p) { return true; },
        text: function (p) {
            return P(
                umbral(p),
                `Marqué el número. Esperé. Una vez, dos, tres, con la paciencia de quien sabe que hay llamadas que tardan años en ser atendidas. Del otro lado, ` + contactVoice(p) + ` dijo mi nombre. Solo eso. No preguntó nada, no reclamó nada. <em>Me di cuenta de que había pasado toda la vida esperando que alguien dijera mi nombre así, y que ese alguien siempre había estado a un teléfono de distancia.</em>`,
                `No hablamos de lo importante. Hablamos de lo que se habla cuando se retoma un hilo: de cómo estaba, de qué hacía, de si el pueblo tenía buen café. Y en algún momento, sin avisar, la niebla se levantó. No de golpe: de a capas, como se levanta el telón al final de una función en la que nadie ha dicho todavía la última línea.`,
                cameo(p),
                `Colgué sin despedirme, sabiendo que no hacía falta. <em>El amor, en cualquiera de sus formas, es la decisión de volver a levantar el teléfono. Una y otra vez. Hasta que alguien, del otro lado, ya no necesite preguntar quién es.</em> Salí al muelle con el aire de la mañana, y por primera vez en muchos años no me sentí un hombre de paso.`
            );
        }
    },

    // ───────────── CODA — LO QUE QUEDÓ ABIERTO ─────────────
    {
        id: 'z_coda',
        act: 'Coda',
        icon: '✉️',
        title: 'Lo que Quedó Abierto',
        visible: function (p) { return !!storyChoice(p, 'c21_pozo'); },
        check: function (p) { return STORY_ENDING_IDS.some(function (id) { return p.storyChapters.indexOf(id) !== -1; }); },
        text: P(
            `A la mañana siguiente, el colectivo de las 4:44 salió sin mí. Lo vi partir desde la ventana de la 18, con esa mezcla de alivio y de duda que sienten los que se quedan. Sobre la almohada había un sobre sin remitente, con el sello de Mutual Horizonte, el mismo papel que había llegado en mi bolsillo once días antes, o once años.`,
            `Adentro, un expediente nuevo. <em>Siniestro 1209. Asegurado: no consta. Lugar: Las Ánimas, un pueblo que no figura en ningún mapa. Perito asignado: usted.</em> Y una fecha. Otra vez mañana. Al pie, una firma que reconocí demasiado tarde: la de Vigil, con una nota a mano, en letra más pequeña: <em>«El suyo estaba cerrado. Este no.»</em>`,
            `Cosme me contó, después, que los once relojes del bar habían empezado a marcar la misma hora, pero que nadie sabía cuál era. Ofelia guardó la libreta bajo llave. Brandán dejó de fumar, o lo intentó. La sirena de las 4:44 sonó esa madrugada, una vez, larga, y esta vez tuvo respuesta: desde lejos, tan lejos que parecía otro continente, otra sirena le contestó.`,
            `<em>Hay finales que cierran. Y hay finales que apenas giran la llave en una puerta, y se quedan del lado de adentro, escuchando lo que pasa afuera. El mío era de los segundos. Había respondido a la pregunta que me trajo a Puerto Calma, y la respuesta me había dejado con otra, más grande, y con un teléfono que, a las 4:44, volvía a sonar.</em>`,
            `<strong>Fin de la Temporada 1.</strong> El expediente 1209 sigue abierto.`
        )
    }
];

const STORY_ENDING_IDS = ['f1_fuerza', 'f2_disciplina', 'f3_mente', 'f4_creatividad', 'f5_carrera', 'f6_finanzas', 'f7_social', 'f8_relaciones'];

// ¿Es este el final que te corresponde? Solo existe después de la decisión del pozo.
function endingIs(p, key) {
    return !!(storyChoice(p, 'c21_pozo') && p.storyMeta && p.storyMeta.attr === key);
}

// Cómo cruzaste el umbral del pozo (depende de tu última decisión)
function umbral(p) {
    var c = storyChoice(p, 'c21_pozo');
    if (c === 'bajar') {
        return `Bajé al pozo sin cuerda, con la linterna entre los dientes. Los peldaños de hierro eran fríos y exactos, como los de una escalera que alguien mantiene todos los días. A mitad del descenso dejé de contar. Abajo no había agua: había un cuarto, y en el cuarto una mesa, y sobre la mesa un hombre de espaldas, escribiendo, que me dejó pasar sin darse vuelta.`;
    }
    if (c === 'cerrar') {
        return `Cerré la tapa. El candado nuevo cayó solo, con un clic limpio. Me senté encima del metal, esperando lo que fuera a subir. No subió ningún monstruo ni ninguna voz: subió una pregunta, la única que me faltaba. <em>¿Y si lo que hay abajo solo se puede enfrentar desde arriba?</em> La niebla se acercó hasta mis zapatos y se quedó ahí, con la mansedumbre de un animal que reconoce a su dueño.`;
    }
    return `Saqué la libreta de Ofelia y marqué el primer número de la lista en el teléfono negro de la oficina, el que no tenía cable. Mientras esperaba, la escotilla se abrió sola, despacio, como si alguien del otro lado hubiera decidido que ya era hora. No bajé. Dejé que lo que estaba abajo subiera a mi encuentro, con el auricular en la mano y el corazón en la boca.`;
}

// Quién te espera según tus decisiones (aliados, Mara, la hoja)
function cameo(p) {
    var t = [];
    if (storyChoice(p, 'c11_brandan') === 'contar') t.push('Brandán me esperaba sentado en el patrullero, con dos cafés y el impermeable seco, con el aire de quien nunca dudó de que iba a volver.');
    else if (storyChoice(p, 'c11_brandan') === 'mentir') t.push('Brandán no estaba. Había dejado en el capó de su coche una nota con una sola palabra: «Cuando quieras.» Alcanzaba.');
    if (storyChoice(p, 'c17_mara') === 'acompanar') t.push('Desde algún lugar del muelle llegaba un tarareo bajito, sin micrófono: Mara cantaba, y esta vez no se corrió.');
    else if (storyChoice(p, 'c17_mara') === 'dejar') t.push('En la barra del Bar de las Once había un vaso que no era mío, con una nota de Mara que decía «Mil cuatrocientos noventa y uno»: el número de días que llevaba contando. Dejé de contar los míos.');
    var h = storyChoice(p, 'c14_hoja');
    if (h === 'guardar') t.push('Saqué la hoja doblada de la billetera. Todavía no era el momento de leerla, pero ya no pesaba.');
    else if (h === 'quemar') t.push('No me quedaba ninguna hoja. Mi futuro, por una vez, estaba en blanco.');
    else if (h === 'leer') t.push('Recordé la prosa impecable de la segunda hoja. Esta mañana, sin una sola corrección, la contradije.');
    return t.length ? t.join(' ') : '';
}

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
    player.storyMeta = {};
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
                addLogEntry('story', 'Nuevo capítulo: "' + chapter.title + '"', 'Modo Historia', 0, 0, null);
                showToast('Nuevo capítulo desbloqueado: "' + chapter.title + '"', 'success', 'Historia');
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

    var chapter = STORY_CHAPTERS.find(function (c) { return c.id === chapterId; });
    var choiceObj = chapter ? chapter.choices.find(function (c) { return c.id === choiceId; }) : null;
    if (chapter && typeof chapter.onChoice === 'function') chapter.onChoice(player, choiceId);
    saveGame();

    showToast('Elegiste: "' + (choiceObj ? choiceObj.label : choiceId) + '"', 'info', 'Historia');
    addLogEntry('story', 'Decisión tomada en "' + (chapter ? chapter.title : chapterId) + '"', choiceObj ? choiceObj.label : '', 0, 0, null);

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
    var lastAct = null;
    visibleChapters.forEach(function (chapter, index) {
        var isUnlocked = player.storyChapters.indexOf(chapter.id) !== -1;
        var isRead = player.storyRead.indexOf(chapter.id) !== -1;

        if (chapter.act && chapter.act !== lastAct) {
            html += '<div class="story-act">' + chapter.act + '</div>';
            lastAct = chapter.act;
        }

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
                    choicesHTML += '<button class="story-choice-btn" onclick="event.stopPropagation(); makeStoryChoice(\'' + chapter.id + '\', \'' + choice.id + '\')">' +
                        choice.label + '</button>';
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
