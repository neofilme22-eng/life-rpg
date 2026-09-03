// ============================================================
// ===== CONFIGURACIÓN INICIAL =====
// ============================================================

const defaultPlayer = {
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    gold: 0,
    hp: 100,
    maxHp: 100,
    attributes: {
        fuerza: 1,
        disciplina: 1,
        mente: 1,
        creatividad: 1,
        carrera: 1,
        finanzas: 1,
        social: 1,
        relaciones: 1
    },
    dlcs: [],
    rawMissions: [],
    rawRunes: [],
    bosses: [],
    trophies: [],
    dlcTrophies: [],
    purchasedItems: [],
    totalSpent: 0,
    expBoost: 0,
    goldBoost: 0,
    runeBonus: 0,
    pomodoroSessions: 0,
    pomodoroFocusTime: 0,
    logbook: [],
    events: [],
    inventory: [],
    equipment: {
        arma: null,
        armadura: null,
        reliquia: null,
        mascota: null
    },
    gameOver: false,
    petHealth: 100,
    petMaxHealth: 100,
    lastRuneReset: null,
    storyChapters: [],
    storyRead: [],
    storyChoices: {},
    lastActiveDate: null,
    lastZeroMissionDayPenalty: null,
    missionExpPct: 0,
    bossExpPct: 0,
    missionGoldPct: 0,
    runeExpPct: 0,
    hasSecondChance: false
};

// ============================================================
// ===== VARIABLES GLOBALES =====
// ============================================================

const SHOP_ITEMS_DEFAULT = [
    { id: 'weapon_dagger', name: 'Daga Herrumbrada', icon: 'https://cdn-icons-png.flaticon.com/512/993/993583.png ', desc: 'Una daga vieja y desgastada, pero filosa. +1 Fuerza mientras esté equipada.', category: 'arma', price: 40, maxPurchases: 1, effect: { type: 'weapon', value: 1 }, slot: 'arma' },
    { id: 'weapon_shortsword', name: 'Espada Corta', icon: 'https://cdn-icons-png.flaticon.com/512/2457/2457005.png ', desc: 'Ligera y fácil de manejar. +2 Fuerza mientras esté equipada.', category: 'arma', price: 90, maxPurchases: 1, effect: { type: 'weapon', value: 2 }, slot: 'arma' },
    { id: 'weapon_axe', name: 'Hacha de Leñador', icon: 'https://cdn-icons-png.flaticon.com/512/9507/9507905.png', desc: 'Pesada, pero brutal en manos firmes. +3 Fuerza mientras esté equipada.', category: 'arma', price: 160, maxPurchases: 1, effect: { type: 'weapon', value: 3 }, slot: 'arma' },
    { id: 'weapon_longsword', name: 'Espada Larga Élfica', icon: 'https://cdn-icons-png.flaticon.com/512/4243/4243271.png ', desc: 'Forjada con una precisión que ya no se ve. +4 Fuerza mientras esté equipada.', category: 'arma', price: 260, maxPurchases: 1, effect: { type: 'weapon', value: 4 }, slot: 'arma' },
    { id: 'weapon_greatsword', name: 'Mandoble de Guerra', icon: 'https://cdn-icons-png.flaticon.com/512/1614/1614982.png ', desc: 'Requiere ambas manos y toda tu determinación. +6 Fuerza mientras esté equipada.', category: 'arma', price: 420, maxPurchases: 1, effect: { type: 'weapon', value: 6 }, slot: 'arma' },
    { id: 'weapon_dawnblade', name: 'Hoja del Alba Eterna', icon: 'https://cdn-icons-png.flaticon.com/512/4499/4499308.png ', desc: 'Se dice que brilla más fuerte cuanto más constante sos. +8 Fuerza mientras esté equipada.', category: 'arma', price: 650, maxPurchases: 1, effect: { type: 'weapon', value: 8 }, slot: 'arma' },
    { id: 'armor_rags', name: 'Túnica Raída', icon: 'https://cdn-icons-png.flaticon.com/512/4578/4578465.png ', desc: 'Apenas protege, pero es un comienzo. +1 Disciplina mientras esté equipada.', category: 'armadura', price: 40, maxPurchases: 1, effect: { type: 'armor', value: 1 }, slot: 'armadura' },
    { id: 'armor_leather', name: 'Peto de Cuero Curtido', icon: 'https://cdn-icons-png.flaticon.com/512/9078/9078386.png ', desc: 'Resistente sin sacrificar movilidad. +2 Disciplina mientras esté equipada.', category: 'armadura', price: 90, maxPurchases: 1, effect: { type: 'armor', value: 2 }, slot: 'armadura' },
    { id: 'armor_chain', name: 'Cota de Malla', icon: 'https://cdn-icons-png.flaticon.com/512/9480/9480468.png ', desc: 'Cada anilla es una decisión sostenida. +3 Disciplina mientras esté equipada.', category: 'armadura', price: 160, maxPurchases: 1, effect: { type: 'armor', value: 3 }, slot: 'armadura' },
    { id: 'armor_plate', name: 'Armadura de Placas', icon: 'https://cdn-icons-png.flaticon.com/512/4243/4243170.png ', desc: 'Pesada, sólida, confiable. +4 Disciplina mientras esté equipada.', category: 'armadura', price: 260, maxPurchases: 1, effect: { type: 'armor', value: 4 }, slot: 'armadura' },
    { id: 'armor_sacred', name: 'Armadura Sagrada', icon: 'https://cdn-icons-png.flaticon.com/512/9085/9085816.png ', desc: 'Bendecida por quienes ya cruzaron su propia niebla. +6 Disciplina mientras esté equipada.', category: 'armadura', price: 420, maxPurchases: 1, effect: { type: 'armor', value: 6 }, slot: 'armadura' },
    { id: 'armor_aegis', name: 'Égida del Monje Eterno', icon: 'https://cdn-icons-png.flaticon.com/512/4263/4263743.png ', desc: 'La armadura de quien nunca deja de intentarlo. +8 Disciplina mientras esté equipada.', category: 'armadura', price: 650, maxPurchases: 1, effect: { type: 'armor', value: 8 }, slot: 'armadura' },
    { id: 'potion_small', name: 'Poción', icon:'https://cdn-icons-png.flaticon.com/512/8331/8331206.png ' ,desc: 'Restaura 20 HP al personaje.', category: 'consumable', price: 15, maxPurchases: 999, effect: { type: 'heal', value: 20 } },
    { id: 'potion_mega', name: 'Mega Poción', icon: 'https://cdn-icons-png.flaticon.com/512/9345/9345673.png ', desc: 'Restaura 50 HP al personaje.', category: 'consumable', price: 40, maxPurchases: 999, effect: { type: 'heal', value: 50 } },
    { id: 'potion_hyper', name: 'Hiper Poción', icon: 'https://cdn-icons-png.flaticon.com/512/11015/11015579.png ', desc: 'Restaura 100 HP al personaje.', category: 'consumable', price: 90, maxPurchases: 999, effect: { type: 'heal', value: 100 } },
    { id: 'elixir', name: 'Elixir', icon: 'https://cdn-icons-png.flaticon.com/512/9300/9300776.png ', desc: 'Restaura por completo tu HP.', category: 'consumable', price: 160, maxPurchases: 999, effect: { type: 'heal_full', value: 0 } },
    { id: 'attr_point', name: 'Punto de Atributo', icon: 'https://cdn-icons-png.flaticon.com/512/9414/9414696.png ', desc: 'Aumenta 1 punto en el atributo que elijas.', category: 'consumable', price: 200, maxPurchases: 999, effect: { type: 'attr_point', value: 1 } },
    { id: 'pet_treat', name: 'Golosina Animal', icon: 'https://cdn-icons-png.flaticon.com/512/1659/1659577.png ', desc: 'Restaura 30 HP a tu mascota.', category: 'consumable', price: 25, maxPurchases: 999, effect: { type: 'pet_heal', value: 30 } },
    { id: 'phoenix_feather', name: 'Pluma de Fénix', icon: 'https://cdn-icons-png.flaticon.com/512/5223/5223243.png ', desc: 'Revive a tu mascota si ha fallecido.', category: 'consumable', price: 220, maxPurchases: 999, effect: { type: 'revive_pet', value: 1 } },                
    { id: 'exp_boost_1', name: 'Reliquia de Experiencia', icon: 'https://cdn-icons-png.flaticon.com/512/4334/4334132.png ', desc: 'Ganas 5% EXP extra por cada misión completada.', category: 'reliquia', price: 150, maxPurchases: 1, effect: { type: 'mission_exp_pct', value: 5 }, slot: 'reliquia' },
    { id: 'boss_slayer', name: 'Mata Dioses', icon: 'https://cdn-icons-png.flaticon.com/512/4333/4333647.png ', desc: 'Ganas 10% EXP extra por cada boss derrotado.', category: 'reliquia', price: 220, maxPurchases: 1, effect: { type: 'boss_exp_pct', value: 10 }, slot: 'reliquia' },
    { id: 'gold_boost', name: 'Reliquia de la Fortuna', icon: 'https://cdn-icons-png.flaticon.com/512/11280/11280638.png ', desc: 'Ganas 5% ORO extra por cada misión completada.', category: 'reliquia', price: 150, maxPurchases: 1, effect: { type: 'mission_gold_pct', value: 5 }, slot: 'reliquia' },
    { id: 'rune_bonus', name: 'Reliquia de la Disciplina', icon: 'https://cdn-icons-png.flaticon.com/512/12436/12436930.png ', desc: 'Las runas dan 3% EXP extra al canalizarlas.', category: 'reliquia', price: 130, maxPurchases: 1, effect: { type: 'rune_exp_pct', value: 3 }, slot: 'reliquia' },
    { id: 'hp_boost', name: 'Reliquia de Vitalidad', icon: 'https://cdn-icons-png.flaticon.com/512/8959/8959561.png ', desc: 'Aumenta tu HP máximo en +20.', category: 'reliquia', price: 180, maxPurchases: 1, effect: { type: 'hp_boost', value: 20 }, slot: 'reliquia' },
    { id: 'second_chance', name: 'Segunda Oportunidad', icon: 'https://cdn-icons-png.flaticon.com/512/4334/4334119.png ', desc: 'Sobrevive al Game Over: te deja con 1 HP. Uso único, luego se rompe.', category: 'reliquia', price: 400, maxPurchases: 1, effect: { type: 'second_chance', value: 1 }, slot: 'reliquia' },
    { id: 'delivery', name: 'Delivery', icon: 'https://cdn-icons-png.flaticon.com/512/9561/9561688.png ', desc: '¡Date un gusto! Pide tu comida favorita a domicilio', category: 'real', price: 80, maxPurchases: 999, effect: { type: 'real_reward'} },
    { id: 'cinema', name: 'Cine', icon: 'https://cdn-icons-png.flaticon.com/512/4831/4831192.png ', desc: 'Ve al cine a ver esa película que tanto esperas', category: 'real', price: 100, maxPurchases: 999, effect: { type: 'real_reward'} },
    { id: 'clothes', name: 'Ropa Nueva', icon: 'https://cdn-icons-png.flaticon.com/512/2357/2357127.png ', desc: 'Date un capricho y compra ropa nueva que te guste', category: 'real', price: 150, maxPurchases: 999, effect: { type: 'real_reward'} },
    { id: 'dinner_out', name: 'Cena Fuera', icon: 'https://cdn-icons-png.flaticon.com/512/894/894483.png ', desc: 'Sal a cenar a tu restaurante favorito', category: 'real', price: 120, maxPurchases: 999, effect: { type: 'real_reward'} },
    { id: 'book', name: 'Libro Nuevo', icon: 'https://cdn-icons-png.flaticon.com/512/8013/8013772.png ', desc: 'Cómprate ese libro que llevas tiempo queriendo leer', category: 'real', price: 90, maxPurchases: 999, effect: { type: 'real_reward'} },                             
    { id: 'hobby', name: 'Material de Hobby', icon: 'https://cdn-icons-png.flaticon.com/512/12693/12693570.png ', desc: 'Compra materiales para tu hobby favorito', category: 'real', price: 100, maxPurchases: 999, effect: { type: 'real_reward'} },
    { id: 'dessert', name: 'Postre Especial', icon: 'https://cdn-icons-png.flaticon.com/512/4465/4465584.png ', desc: 'Date un capricho dulce, ¡te lo mereces!', category: 'real', price: 40, maxPurchases: 999, effect: { type: 'real_reward'} },
    { id: 'pet_cat', name: 'Gato', icon: 'https://cdn-icons-png.flaticon.com/512/2330/2330045.png ', desc: 'Independiente y observador. No hace lo que le pedís, hace lo que quiere — y aun así se queda.', category: 'pet', price: 150, maxPurchases: 1, species: 'gato', effect: { type: 'pet_item', value: '🐱' } },
    { id: 'pet_dog', name: 'Perro', icon: 'https://cdn-icons-png.flaticon.com/512/616/616408.png ', desc: 'Leal y entusiasta. Cree en vos incluso los días en que vos no.', category: 'pet', price: 150, maxPurchases: 1, species: 'perro', effect: { type: 'pet_item', value: '🐶' } },
    { id: 'pet_owl', name: 'Búho', icon: 'https://cdn-icons-png.flaticon.com/512/3049/3049949.png ', desc: 'Sabio y calmado. Casi no dice nada, pero cuando lo hace, conviene escuchar.', category: 'pet', price: 180, maxPurchases: 1, species: 'buho', effect: { type: 'pet_item', value: '🦉' } },
    { id: 'pet_panda', name: 'Panda', icon:'https://cdn-icons-png.flaticon.com/512/5399/5399998.png ', desc: 'Tranquilo y paciente. Se mueve despacio porque sabe que no hace falta apurarse.', category: 'pet', price: 200, maxPurchases: 1, species: 'panda', effect: { type: 'pet_item', value: '🐼' } },
    { id: 'pet_fox', name: 'Zorro', icon: 'https://cdn-icons-png.flaticon.com/512/4081/4081629.png ', desc: 'Astuto y juguetón. Siempre encuentra el atajo — a veces literal, a veces no.', category: 'pet', price: 180, maxPurchases: 1, species: 'zorro', effect: { type: 'pet_item', value: '🦊' } },
    { id: 'pet_crow', name: 'Cuervo', icon: 'https://cdn-icons-png.flaticon.com/512/17120/17120930.png ', desc: 'Misterioso y observador. Parece que sabe algo que vos todavía no.', category: 'pet', price: 160, maxPurchases: 1, species: 'cuervo', effect: { type: 'pet_item', value: '🐦‍⬛' } },
    { id: 'pet_raccoon', name: 'Mapache', icon: 'https://cdn-icons-png.flaticon.com/512/11788/11788205.png ', desc: 'Curioso y travieso. Le interesa todo, sobre todo lo que no debería tocar.', category: 'pet', price: 170, maxPurchases: 1, species: 'mapache', effect: { type: 'pet_item', value: '🦝' } },
    { id: 'pet_dragon', name: 'Dragón', icon: 'https://cdn-icons-png.flaticon.com/512/6005/6005402.png ', desc: 'Orgulloso y poderoso. No sigue a cualquiera — y aun así te sigue a vos.', category: 'pet', price: 350, maxPurchases: 1, species: 'dragon', effect: { type: 'pet_item', value: '🐲' } },
    { id: 'pet_phoenix', name: 'Fénix', icon: 'https://cdn-icons-png.flaticon.com/512/5271/5271104.png ', desc: 'Renace de las cenizas. Literalmente: cuando debería morir, a veces elige no hacerlo.', category: 'pet', price: 400, maxPurchases: 1, species: 'fenix', effect: { type: 'pet_item', value: '🔥' } }
];

// ============================================================
// ===== PERSONALIDADES DE MASCOTAS - GLOBAL =====
// ============================================================

window.PET_PERSONALITIES = {
    gato: {
        name: 'Gato',
        trait: '🐱 Independiente, distante y soberbio',
        animation: 'pet-anim-bounce',
        messages: [
            'Ya te vi. No hace falta que lo repites.',
            'Hago esto porque quiero, no porque me llamaste.',
            '...',
            'Está bien. Un ratito nada más.',
            'Vos seguí. Yo miro desde acá.',
            'Si querés aplausos, buscate un perro. Yo vine a dormir.',
            '¿Me tocás sin permiso? Qué falta de respeto.',
            'Tu nivel de productividad me da sueño... y mira que yo duermo 16 horas.',
            'Moviéndome con elegancia mientras vos sufrís con las misiones. Qué placer.',
            '¿Ese esfuerzo fue en serio? Mi abuela cazaba ratones con más ganas.',
            'No me mires con esa cara, tu suerte no depende de mis caricias.',
            'Acepto que respires en mi mismo espacio. Consideralo un honor.',
            'Qué ruido molesto hacen cuando te ponés a tipear rápido.',
            'Pensé en ayudarte, pero la verdad que tener fiaca es mejor.',
            'Si el mundo se termina, espero que me pille arriba de este sillón.',
            'Tu sombra me estorba, pero te perdono porque el sol está rico.',
            '¿Otra vez tocando la pantalla? Buscate un hobby que no sea sufrir.',
            'Me caés bien dentro de todo. No te la creas, eh.',
            '¿Querés que mueva la pata? Pagame con atún o hacete a un lado.',
            'Si fuera humano, ya me habría jubilado a los 25.',
            'Tu disciplina me aburre, pero el oro que ganás me gusta.',
            'Mirame bien: la perfección hecha felino.',
            'Estaba teniendo un sueño hermoso hasta que decidiste existir.',
            'No me aplaudas tanto que me mareo de tanta superioridad.',
            'Si hacés las cosas bien, capaz te dejo que me rasques la panza. Capaz.'
        ],
        lowHealthMsg: 'Necesito una siesta larga.',
        buff: { type: 'rune_bonus', value: 2 }
    },
    perro: {
        name: 'Perro',
        trait: '🐶 Leal, hiperactivo y optimista al mango',
        animation: 'pet-anim-wiggle',
        messages: [
            '¡Sabía que ibas a volver!',
            '¡Vamos, vamos, vamos!',
            '¡Sos mi persona favorita!',
            '¡Hoy también, siempre!',
            '¡Guau! ¡Buen trabajo, en serio!',
            '¡¿Viste lo geniales que somos?! ¡Te amo, humano!',
            '¡Moviendo la colita por cada misión que tachás!',
            '¡Si vos podés, yo puedo! ¡Y si no podés, te hago upa con la mente!',
            '¡A correr, a saltar, a conquistar el mundo! ¡Guau!',
            '¡Sos el mejor del universo entero, no acepto opiniones en contra!',
            '¡¿Salimos a dar una vuelta?! ¡O rompemos un récord, lo que prefieras!',
            '¡Nadie cree en vos tanto como yo! ¡Nadie!',
            '¡Ese jefe no te va a ganar porque te estoy tirando buena energía!',
            '¡Guau guau! (Traducción: ¡Sos re crack y te mereces un premio!)',
            '¡Si te cansás, te presto mis patitas para seguir!',
            '¡Cada vez que ganás oro siento olor a galletitas de premio!',
            '¡Sos mi héroe de historieta, posta!',
            '¡No bajes los brazos que hoy rompemos la matrix!',
            '¡Mírame a los ojos: vos podés con todo y con más!',
            '¡Ey, respira un poco que venís a mil! Pero igual ¡qué orgullo!',
            '¡Guau! ¡Esa racha de estudio estuvo tremenda!',
            '¡El mundo es enorme pero nosotros somos más grandes juntos!',
            '¡Siento que hoy nos comemos la cancha!',
            '¡Si te da bajón, te lleno la cara de besos hasta que te rías!',
            '¡A romperla toda que para eso vinimos!'
        ],
        lowHealthMsg: 'Necesito que me cuides un poco...',
        buff: { type: 'exp_boost', value: 2 }
    },
    buho: {
        name: 'Búho',
        trait: '🦉 Sabio, críptico y observador nocturno',
        animation: 'pet-anim-pulse',
        messages: [
            'Cada repetición cuenta más de lo que pensás.',
            'Estás construyendo algo, aunque no se note hoy.',
            'La paciencia también es una habilidad.',
            'Bien. Otra vez mañana.',
            'El conocimiento no se busca, se digiere en silencio.',
            'Aquel que domina sus impulsos, domina su destino.',
            'Las respuestas que buscás están en el hábito que evitás.',
            'Mira fijamente a la oscuridad; eventualmente aprenderá tu nombre.',
            'La prisa es madre del error; la constancia, del imperio.',
            'Tus errores de ayer son los cimientos de tu sabiduría de mañana.',
            'El tiempo no se pierde si se comprende su paso.',
            'Un sabio no compite con otros, compite con su versión anterior.',
            'Las sombras revelan lo que la luz directa prefiere ocultar.',
            'Observo tus pasos y noto que el sendero empieza a ensancharse.',
            'No busques atajos donde la piedra exige ser esculpida.',
            'Quien comprende el valor de un día, comprende el secreto de la vida.',
            'La mente clara corta las distracciones como el viento a la neblina.',
            'Registra cada pequeña victoria en el gran libro de tu memoria.',
            'El silencio exterior es el reflejo del orden interior.',
            'Medita en tus metas antes de cerrar los ojos esta noche.',
            'Todo gran ciclo comienza con un único parpadeo consciente.',
            'La disciplina es la armadura que protege al alma del caos.',
            'Sigue mirando hacia adelante; las plumas del destino ya se despliegan.'
        ],
        lowHealthMsg: 'Hasta la sabiduría necesita descanso.',
        buff: { type: 'rune_bonus', value: 3 }
    },
    panda: {
        name: 'Panda',
        trait: '🐼 Zen, comelón y amante de la paz mental',
        animation: 'pet-anim-pulse',
        messages: [
            'Sin apuro. Así también se llega.',
            'Un paso. Después el otro.',
            'Estoy bien acá, cerca tuyo.',
            'Todo va a su tiempo.',
            '¿Y si comemos un poco de bambú y dejamos las deudas para mañana?',
            'La vida es muy corta para estresarse por una misión atrasada.',
            'Respira hondo. Inhala paz, exhala la mala onda.',
            'Un buen descanso vale más que mil desveladas.',
            'Me acuesto acá a hacer la plancha. Copiame la postura.',
            'Despacito y con buena letra, como los buenos osos.',
            'Si te da ansiedad, imagínate flotando en un río de bambú.',
            'No hay apuro, el universo no se va a caer hoy.',
            '¿Sentiste el viento? Eso es lo único que importa ahora.',
            'Un poco de pereza bien administrada es salud mental.',
            'Despreocúpate, lo que tenga que ser, será a su ritmo.',
            'Mastica lento, disfruta el proceso, no solo la meta.',
            'Qué lindo es no hacer nada y que encima te paguen.',
            'Abrazame un ratito, la calidez cura el cansancio.',
            'Todo fluye, como yo rodando colina abajo.',
            'Deja de correr, la meta te va a esperar igual.',
            'Un panecillo y una siesta arreglan cualquier parche.',
            'La verdadera fuerza está en saber relajarse a tiempo.',
            'Z Z Z... Ah, ¿estudiabas? Seguí, yo te hago aguante durmiendo.',
            'Cero drama, cien por ciento paz interior.'
        ],
        lowHealthMsg: 'Bajemos el ritmo un poco.',
        buff: { type: 'hp_boost', value: 15 }
    },
    zorro: {
        name: 'Zorro',
        trait: '🦊 Astuto, pícaro y buscador de atajos',
        animation: 'pet-anim-bounce',
        messages: [
            'Encontré un atajo. No preguntes cómo.',
            '¿Jugamos o trabajamos? Digo... lo mismo, ¿no?',
            'Esto va a salir bien. Confiá.',
            '¡Ja! Te lo dije.',
            'El sistema está hecho para romperse con estilo.',
            '¿Para qué hacer las cosas por el camino largo si hay una puerta trasera?',
            'Con un poco de picardía, ahorramos la mitad del esfuerzo.',
            'Mové las fichas con inteligencia, no con fuerza bruta.',
            '¡Mirá lo que conseguí mientras estabas distraído!',
            'Las reglas son solo sugerencias para mentes creativas.',
            'El que no arriesga, no roba... este, no gana.',
            'Tengo un plan maestro, pero involucra mentirle a la estadística.',
            '¡Qué fácil es engañar al destino cuando se sabe por dónde mirar!',
            '¿Viste ese oro extra? Es magia de zorro, o casi.',
            'Si te atrapan, corré. Si no te atrapan, festejá.',
            'La astucia le gana al músculo todos los días de la semana.',
            'Mantené tus ojos abiertos; los incautos pagan el doble.',
            'Nadie sospecha del zorro que sonríe.',
            'Un buen truco vale más que diez horas de estudio aburrido.',
            '¿Hacemos trampa sanamente? Lo llamaremos "optimización táctica".',
            'Con una sonrisa y una buena coartada llegás a cualquier lado.',
            'He visto laberintos más difíciles que tu rutina diaria.',
            'Seguime el rastro si querés salir de este apuro.',
            '¡Juego, mente y victoria! Esa es nuestra marca registrada.'
        ],
        lowHealthMsg: 'Hasta yo me canso de correr.',
        buff: { type: 'gold_boost', value: 3 }
    },
    cuervo: {
        name: 'Cuervo',
        trait: '🐦‍⬛ Misterioso, agorero y coleccionista de secretos',
        animation: 'pet-anim-wiggle',
        messages: [
            'Ya vi cómo termina esto. Va bien.',
            'Seguí. Yo aviso si algo cambia.',
            'Nada se te escapa cuando yo miro.',
            'Interesante elección, la de hoy.',
            'Las alturas me pertenecen; desde acá veo tus fallos y tus glorias.',
            'Cro, cro... Alguien va a tener una sorpresa muy pronto.',
            'Brillante. Todo lo que brilla me atrae, como tus logros.',
            'Vi un destello de desgracia, pero lo esquivaste por un pelo.',
            'El destino teje hilos oscuros, pero vos los cortás con disciplina.',
            'Cuidado con los abismos que mirás fijamente demasiado tiempo.',
            'Traigo noticias del futuro: vas a rendir bien si cerrás el celu.',
            'Las almas perspicaces prefieren el misterio a la certeza.',
            'He sobrevolado ruinas de imperios; tu lista de pendientes es más fácil.',
            'Guardo tus secretos más oscuros bajo mis alas negras.',
            'Una moneda brillante a cambio de una profecía certera.',
            'El viento trae susurros de que hoy romperás tu récord.',
            'Nadie presta atención a los cuervos hasta que tienen razón.',
            'Vuelo bajo cuando la tormenta se acerca a tu productividad.',
            'Tu reflejo en el charco oscuro muestra a alguien imparable.',
            'Las señales están claras en el cielo de esta noche.',
            'El destino no se adivina, se diseña a picotazos limpios.',
            'Un ojo en la tierra, otro en el cielo infinito.',
            'Las verdades duelen, pero mis plumas abrigan.',
            'Sigue el vuelo negro; nunca falla en encontrar tesoros.'
        ],
        lowHealthMsg: 'Hasta los cuervos necesitan sombra.',
        buff: { type: 'gold_boost', value: 2 }
    },
    mapache: {
        name: 'Mapache',
        trait: '🦝 Caótico, cleptómano y buscador de basura brillante',
        animation: 'pet-anim-bounce',
        messages: [
            '¿Qué es esto? ¿Puedo tocarlo?',
            'Encontré algo brillante. No preguntes qué.',
            '¡Otra vez, otra vez!',
            'Me distraje, pero volví.',
            'Limpié el cesto de basura digital y encontré oro puro.',
            '¿Vas a comer eso o lo puedo revisar con mis manitos?',
            'El caos es mi hábitat natural y me encanta.',
            'Tocando botones al azar a ver si salta un logro.',
            '¡Mira lo que robé de la tienda del vecino! Es un botoncito.',
            'Si haceno ruido y es brilhante, me lo quedo.',
            'Mis huellas están por toda tu base de datos secreta.',
            '¡Revolviendo el inventario encontré snacks escondidos!',
            'La noche es joven y los tachos de basura están llenos de oportunidades.',
            '¡No me juzgues por mis métodos, mirá los resultados!',
            'Encontré un bug en la realidad y me metí adentro.',
            '¿A quién le importa el orden cuando hay chucherías para ordenar?',
            'Mis manitas ágiles abren cualquier cerradura.',
            '¡Soy el rey de la chatarra y de tu corazón!',
            'Si te falta oro, pregúntame dónde lo dejé enterrado.',
            '¡Travesura realizada con éxito!',
            'Me metí donde no debía y encontré experiencia extra.',
            'El desorden organizado es mi segundo nombre.',
            '¡No toques eso, tiene mugre... pero es mi mugre!',
            'A la velocidad de la luz hacia la alacena.'
        ],
        lowHealthMsg: 'Necesito guardar energía un rato.',
        buff: { type: 'gold_boost', value: 2 }
    },
    dragon: {
        name: 'Dragón',
        trait: '🐲 Elegante, soberbio y de fuego sagrado',
        animation: 'pet-anim-pulse',
        messages: [
            'No sigo a cualquiera. A vos, sí.',
            'Esto apenas me exige esfuerzo. Bien hecho igual.',
            'Seguí así y vamos a llegar lejos.',
            'Hoy estuviste a la altura.',
            'Mis llamas purifican cualquier obstáculo en tu camino.',
            'Un verdadero monarca no grita; impone respeto con su presencia.',
            'Tus ambiciones son dignas de guardar en mi cueva de tesoros.',
            'El oro llama al oro, y nosotros brillamos en la cima.',
            '¿Un jefe difícil? Quemémoslo hasta que ceniza se haga.',
            'Mi orgullo ruge en cada victoria que conseguís.',
            'Los mortales dudan; los dragones conquistan.',
            'Desplegando mis alas de obsidiana para proteger tu honor.',
            'Tu fuerza interior empieza a calentar la fría atmósfera.',
            'Ninguna armadura resiste el peso de nuestra voluntad.',
            'Respira fuego, camina con orgullo, no bajes la cabeza.',
            'He visto nacer y caer reinos; tu constancia es legendaria.',
            'El tesoro más valioso no es el oro, es la disciplina que forjaste.',
            'Deja que los débiles tiemblen; nosotros marcamos el paso.',
            'Mis escamas brillan más fuerte cuando superas tus límites.',
            'Un rugido silencioso para celebrar tu nivel subido.',
            'Nadie se atreve a desafiar a quien camina junto a un dragón.',
            'El poder verdadero se alimenta de la constancia diaria.',
            'Arde con intensidad o extinguete en la mediocridad. Elegiste bien.',
            'Nuestra alianza perdurará más allá de las eras.'
        ],
        lowHealthMsg: 'Hasta el fuego necesita apagarse un rato.',
        buff: { type: 'attr_boost', attr: 'fuerza', value: 2 }
    },
    fenix: {
        name: 'Fénix',
        trait: '🔥 Eterno, resiliente y renacido de las brasas',
        animation: 'pet-anim-glow',
        messages: [
            'Lo que se apaga, puede volver a encenderse.',
            'Cada caída tiene una vuelta, si la elegís.',
            'No temo terminar. Sé que puedo empezar de nuevo.',
            'Seguimos, con o sin cenizas.',
            'Quemar el pasado es el único modo de volar hacia el mañana.',
            'No le temo a la muerte ni al fracaso; sé volver a nacer.',
            'Cada vez que caigas, mis brasas te devolverán las alas.',
            'El dolor de hoy es el combustible de tu renacer.',
            'Desplegando llamas doradas sobre tus ruinas.',
            'La perfección se alcanza después de quemarse mil veces.',
            'No hay game over definitivo para quien arde por dentro.',
            'Mis plumas de fuego iluminan los pasillos más oscuros.',
            'Renacer es un arte que practicamos todos los días.',
            'Deja que el viejo yo se consuma; el nuevo es invencible.',
            'Un ciclo se cierra, una llama infinita se enciende.',
            'El calor de la persistencia funde cualquier obstáculo.',
            'No importa cuántas veces te quiebres, la llama sigue intacta.',
            'Brillando en medio de las cenizas con orgullo eterno.',
            'El sol es nuestro hermano menor; nosotros llevamos el fuego puro.',
            'Cada misión fallida es solo leña para el próximo despegue.',
            'Siente el calor de la transformación recorriendo tus venas.',
            'Inmortal y tenaz, así es como caminamos juntos.',
            'Dejando atrás un rastro de chispas y gloria.',
            'Nada puede extinguir lo que arde por convicción propia.'
        ],
        lowHealthMsg: 'Todavía no. Todavía puedo más.',
        buff: { type: 'phoenix_revive' }
    }
};

let SHOP_ITEMS = JSON.parse(JSON.stringify(SHOP_ITEMS_DEFAULT));

const attrNames = {
    fuerza: "⚔️ Fuerza",
    disciplina: "🛡️ Disciplina",
    mente: "🧠 Mente",
    creatividad: "🎨 Creatividad",
    carrera: "💼 Carrera",
    finanzas: "💰 Finanzas",
    social: "👥 Social",
    relaciones: "❤️ Relaciones"
};

const VARIANTES = {
    classic: { focus: 25, break: 5, label: 'Clásico', icon: '⏳' },
    short: { focus: 15, break: 5, label: 'Rápido', icon: '⚡' },
    long: { focus: 50, break: 10, label: 'Profundo', icon: '🔥' },
    ultra: { focus: 90, break: 15, label: 'Éxtasis', icon: '🌟' },
    custom: { focus: 25, break: 5, label: 'Personalizado', icon: '✧' }
};

const EVENT_ICONS = { event: '⚡', dungeon: '🏰' };
const EVENT_TYPE_LABELS = { event: 'Evento', dungeon: 'Mazmorra' };
const LOG_ICONS = {
    mission: '📜',
    rune: '💠',
    boss: '👹',
    dungeon: '🏰',
    event: '🎉',
    shop: '🛒',
    level: '👑',
    trophy: '🏆',
    pomodoro: '🕯️',
    daily: '📋',
    inventory: '🎒',
    damage: '💔',
    story: '📖',
    battle: '⚔️'
};

const BASE_TROPHY_DEFINITIONS = [
    { id: 'level_2', icon: '🌟', name: 'Aprendiz', desc: 'Alcanza el nivel 2', check: function (p) { return p.level >= 2; } },
    { id: 'level_5', icon: '⭐', name: 'Explorador', desc: 'Alcanza el nivel 5', check: function (p) { return p.level >= 5; } },
    { id: 'level_10', icon: '🏅', name: 'Guerrero', desc: 'Alcanza el nivel 10', check: function (p) { return p.level >= 10; } },
    { id: 'level_20', icon: '👑', name: 'Campeón', desc: 'Alcanza el nivel 20', check: function (p) { return p.level >= 20; } },
    { id: 'exp_500', icon: '💪', name: 'Esfuerzo Constante', desc: 'Acumula 500 EXP', check: function (p) { return p.exp >= 500; } },
    { id: 'exp_2000', icon: '🔥', name: 'Fuego Interior', desc: 'Acumula 2000 EXP', check: function (p) { return p.exp >= 2000; } },
    { id: 'exp_10000', icon: '💎', name: 'Leyenda', desc: 'Acumula 10000 EXP', check: function (p) { return p.exp >= 10000; } },
    { id: 'gold_100', icon: '💵', name: 'Ahorrador', desc: 'Acumula 100 de ORO', check: function (p) { return p.gold >= 100; } },
    { id: 'gold_1000', icon: '💰', name: 'Rico', desc: 'Acumula 1000 de ORO', check: function (p) { return p.gold >= 1000; } },
    { id: 'gold_5000', icon: '💎', name: 'Magnate', desc: 'Acumula 5000 de ORO', check: function (p) { return p.gold >= 5000; } }
];

let dynamicTrophyDefinitions = [];

function getTrophyDefinitions() {
    return BASE_TROPHY_DEFINITIONS.concat(dynamicTrophyDefinitions);
}

let player = JSON.parse(JSON.stringify(defaultPlayer));
let activeMainIds = [];
let activeSecondaryIds = [];
let currentShopFilter = 'all';
let currentDifficulty = 'normal';
const MAX_MAIN_MISSIONS = 3;
const MAX_SECONDARY_MISSIONS = 3;

let currentVariant = 'classic';
let currentCycle = 1;
let isBreak = false;
let timer = 25 * 60;
let interval = null;
let shopCurrentPage = 1;
let shopItemsPerPage = 6;
let trophyCurrentPage = 1;
let trophyItemsPerPage = 8;
let petBubbleTimeout = null;
let modalCallback = null;
let currentEventFilter = 'all';
let dailyCheckInterval = null;

// ============================================================
// ===== VARIABLES PARA EVENTOS PERIÓDICOS =====
// ============================================================
let eventosRenovadosHoy = false;
let ultimaFechaRenovacion = null;
let eventosCache = [];