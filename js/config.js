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
            runeExpPct: 0
        };

        // ============================================================
            // ===== VARIABLES GLOBALES =====
            // ============================================================

            const SHOP_ITEMS_DEFAULT = [
                { id: 'weapon_dagger', name: '🗡️ Daga Herrumbrada', desc: 'Una daga vieja y desgastada, pero filosa. +1 Fuerza mientras esté equipada.', category: 'arma', price: 40, maxPurchases: 1, effect: { type: 'weapon', value: 1 }, slot: 'arma' },
                { id: 'weapon_shortsword', name: '⚔️ Espada Corta', desc: 'Ligera y fácil de manejar. +2 Fuerza mientras esté equipada.', category: 'arma', price: 90, maxPurchases: 1, effect: { type: 'weapon', value: 2 }, slot: 'arma' },
                { id: 'weapon_axe', name: '🪓 Hacha de Leñador', desc: 'Pesada, pero brutal en manos firmes. +3 Fuerza mientras esté equipada.', category: 'arma', price: 160, maxPurchases: 1, effect: { type: 'weapon', value: 3 }, slot: 'arma' },
                { id: 'weapon_longsword', name: '🗡️ Espada Larga Élfica', desc: 'Forjada con una precisión que ya no se ve. +4 Fuerza mientras esté equipada.', category: 'arma', price: 260, maxPurchases: 1, effect: { type: 'weapon', value: 4 }, slot: 'arma' },
                { id: 'weapon_greatsword', name: '⚔️ Mandoble de Guerra', desc: 'Requiere ambas manos y toda tu determinación. +6 Fuerza mientras esté equipada.', category: 'arma', price: 420, maxPurchases: 1, effect: { type: 'weapon', value: 6 }, slot: 'arma' },
                { id: 'weapon_dawnblade', name: '🌅 Hoja del Alba Eterna', desc: 'Se dice que brilla más fuerte cuanto más constante sos. +8 Fuerza mientras esté equipada.', category: 'arma', price: 650, maxPurchases: 1, effect: { type: 'weapon', value: 8 }, slot: 'arma' },
                { id: 'armor_rags', name: '🥋 Túnica Raída', desc: 'Apenas protege, pero es un comienzo. +1 Disciplina mientras esté equipada.', category: 'armadura', price: 40, maxPurchases: 1, effect: { type: 'armor', value: 1 }, slot: 'armadura' },
                { id: 'armor_leather', name: '🛡️ Peto de Cuero Curtido', desc: 'Resistente sin sacrificar movilidad. +2 Disciplina mientras esté equipada.', category: 'armadura', price: 90, maxPurchases: 1, effect: { type: 'armor', value: 2 }, slot: 'armadura' },
                { id: 'armor_chain', name: '🛡️ Cota de Malla', desc: 'Cada anilla es una decisión sostenida. +3 Disciplina mientras esté equipada.', category: 'armadura', price: 160, maxPurchases: 1, effect: { type: 'armor', value: 3 }, slot: 'armadura' },
                { id: 'armor_plate', name: '🛡️ Armadura de Placas', desc: 'Pesada, sólida, confiable. +4 Disciplina mientras esté equipada.', category: 'armadura', price: 260, maxPurchases: 1, effect: { type: 'armor', value: 4 }, slot: 'armadura' },
                { id: 'armor_sacred', name: '✨ Armadura Sagrada', desc: 'Bendecida por quienes ya cruzaron su propia niebla. +6 Disciplina mientras esté equipada.', category: 'armadura', price: 420, maxPurchases: 1, effect: { type: 'armor', value: 6 }, slot: 'armadura' },
                { id: 'armor_aegis', name: '🛡️ Égida del Monje Eterno', desc: 'La armadura de quien nunca deja de intentarlo. +8 Disciplina mientras esté equipada.', category: 'armadura', price: 650, maxPurchases: 1, effect: { type: 'armor', value: 8 }, slot: 'armadura' },
                { id: 'potion_small', name: '❤️ Poción', desc: 'Restaura 20 HP al personaje.', category: 'consumable', price: 15, maxPurchases: 999, effect: { type: 'heal', value: 20 } },
                { id: 'potion_mega', name: '❤️ Mega Poción', desc: 'Restaura 50 HP al personaje.', category: 'consumable', price: 40, maxPurchases: 999, effect: { type: 'heal', value: 50 } },
                { id: 'potion_hyper', name: '❤️ Hiper Poción', desc: 'Restaura 100 HP al personaje.', category: 'consumable', price: 90, maxPurchases: 999, effect: { type: 'heal', value: 100 } },
                { id: 'elixir', name: '💖 Elixir', desc: 'Restaura por completo tu HP.', category: 'consumable', price: 160, maxPurchases: 999, effect: { type: 'heal_full', value: 0 } },
                { id: 'attr_point', name: '⭐ Punto de Atributo', desc: 'Aumenta 1 punto en el atributo que elijas.', category: 'consumable', price: 200, maxPurchases: 999, effect: { type: 'attr_point', value: 1 } },
                { id: 'pet_treat', name: '🍖 Golosina Animal', desc: 'Restaura 30 HP a tu mascota.', category: 'consumable', price: 25, maxPurchases: 999, effect: { type: 'pet_heal', value: 30 } },
                { id: 'phoenix_feather', name: '🪶 Pluma de Fénix', desc: 'Revive a tu mascota si ha fallecido.', category: 'consumable', price: 220, maxPurchases: 999, effect: { type: 'revive_pet', value: 1 } },
                { id: 'battery_recharge', name: '🔋 Recarga de Batería', desc: 'Restaura por completo tu Batería Social de hoy.', category: 'consumable', price: 60, maxPurchases: 999, effect: { type: 'restore_attention', value: 1 } },
                { id: 'exp_boost_1', name: '💫 Reliquia de Experiencia', desc: 'Ganas 5% EXP extra por cada misión completada.', category: 'reliquia', price: 150, maxPurchases: 1, effect: { type: 'mission_exp_pct', value: 5 }, slot: 'reliquia' },
                { id: 'boss_slayer', name: '💀 Mata Bosses', desc: 'Ganas 10% EXP extra por cada boss derrotado.', category: 'reliquia', price: 220, maxPurchases: 1, effect: { type: 'boss_exp_pct', value: 10 }, slot: 'reliquia' },
                { id: 'gold_boost', name: '🟡 Reliquia de la Fortuna', desc: 'Ganas 5% ORO extra por cada misión completada.', category: 'reliquia', price: 150, maxPurchases: 1, effect: { type: 'mission_gold_pct', value: 5 }, slot: 'reliquia' },
                { id: 'rune_bonus', name: '🔮 Reliquia de la Disciplina', desc: 'Las runas dan 3% EXP extra al canalizarlas.', category: 'reliquia', price: 130, maxPurchases: 1, effect: { type: 'rune_exp_pct', value: 3 }, slot: 'reliquia' },
                { id: 'hp_boost', name: '❤️ Reliquia de Vitalidad', desc: 'Aumenta tu HP máximo en +20.', category: 'reliquia', price: 180, maxPurchases: 1, effect: { type: 'hp_boost', value: 20 }, slot: 'reliquia' },
                { id: 'second_chance', name: '🕊️ Segunda Oportunidad', desc: 'Sobrevive al Game Over: te deja con 1 HP. Uso único, luego se rompe.', category: 'reliquia', price: 400, maxPurchases: 1, effect: { type: 'second_chance', value: 1 }, slot: 'reliquia' },
                { id: 'delivery', name: '🍕 Delivery', desc: '¡Date un gusto! Pide tu comida favorita a domicilio', category: 'real', price: 80, maxPurchases: 999, effect: { type: 'real_reward', value: '🍕 Pedir delivery' } },
                { id: 'cinema', name: '🎬 Cine', desc: 'Ve al cine a ver esa película que tanto esperas', category: 'real', price: 100, maxPurchases: 999, effect: { type: 'real_reward', value: '🎬 Ir al cine' } },
                { id: 'clothes', name: '👕 Ropa Nueva', desc: 'Date un capricho y compra ropa nueva que te guste', category: 'real', price: 150, maxPurchases: 999, effect: { type: 'real_reward', value: '👕 Comprar ropa nueva' } },
                { id: 'dinner_out', name: '🍽️ Cena Fuera', desc: 'Sal a cenar a tu restaurante favorito', category: 'real', price: 120, maxPurchases: 999, effect: { type: 'real_reward', value: '🍽️ Cena en restaurante' } },
                { id: 'book', name: '📚 Libro Nuevo', desc: 'Cómprate ese libro que llevas tiempo queriendo leer', category: 'real', price: 90, maxPurchases: 999, effect: { type: 'real_reward', value: '📚 Comprar libro nuevo' } },
                { id: 'game', name: '🎮 Videojuego', desc: 'Comprate un juego nuevo para tu colección', category: 'real', price: 150, maxPurchases: 999, effect: { type: 'real_reward', value: '🎮 Comprar videojuego' } },
                { id: 'spa', name: '🧖 Spa/Masaje', desc: 'Date un día de relax con un masaje o spa', category: 'real', price: 200, maxPurchases: 999, effect: { type: 'real_reward', value: '🧖 Día de spa o masaje' } },
                { id: 'concert', name: '🎵 Concierto', desc: 'Compra una entrada para ver a tu artista favorito', category: 'real', price: 180, maxPurchases: 999, effect: { type: 'real_reward', value: '🎵 Ir a un concierto' } },
                { id: 'hobby', name: '🎨 Material de Hobby', desc: 'Compra materiales para tu hobby favorito', category: 'real', price: 100, maxPurchases: 999, effect: { type: 'real_reward', value: '🎨 Comprar materiales de hobby' } },
                { id: 'dessert', name: '🧁 Postre Especial', desc: 'Date un capricho dulce, ¡te lo mereces!', category: 'real', price: 40, maxPurchases: 999, effect: { type: 'real_reward', value: '🧁 Comer un postre especial' } },
                { id: 'pet_cat', name: '🐱 Gato', desc: 'Independiente y observador. No hace lo que le pedís, hace lo que quiere — y aun así se queda.', category: 'pet', price: 150, maxPurchases: 1, species: 'gato', effect: { type: 'pet_item', value: '🐱' } },
                { id: 'pet_dog', name: '🐶 Perro', desc: 'Leal y entusiasta. Cree en vos incluso los días en que vos no.', category: 'pet', price: 150, maxPurchases: 1, species: 'perro', effect: { type: 'pet_item', value: '🐶' } },
                { id: 'pet_owl', name: '🦉 Búho', desc: 'Sabio y calmado. Casi no dice nada, pero cuando lo hace, conviene escuchar.', category: 'pet', price: 180, maxPurchases: 1, species: 'buho', effect: { type: 'pet_item', value: '🦉' } },
                { id: 'pet_panda', name: '🐼 Panda', desc: 'Tranquilo y paciente. Se mueve despacio porque sabe que no hace falta apurarse.', category: 'pet', price: 200, maxPurchases: 1, species: 'panda', effect: { type: 'pet_item', value: '🐼' } },
                { id: 'pet_fox', name: '🦊 Zorro', desc: 'Astuto y juguetón. Siempre encuentra el atajo — a veces literal, a veces no.', category: 'pet', price: 180, maxPurchases: 1, species: 'zorro', effect: { type: 'pet_item', value: '🦊' } },
                { id: 'pet_crow', name: '🐦‍⬛ Cuervo', desc: 'Misterioso y observador. Parece que sabe algo que vos todavía no.', category: 'pet', price: 160, maxPurchases: 1, species: 'cuervo', effect: { type: 'pet_item', value: '🐦‍⬛' } },
                { id: 'pet_raccoon', name: '🦝 Mapache', desc: 'Curioso y travieso. Le interesa todo, sobre todo lo que no debería tocar.', category: 'pet', price: 170, maxPurchases: 1, species: 'mapache', effect: { type: 'pet_item', value: '🦝' } },
                { id: 'pet_dragon', name: '🐲 Dragón', desc: 'Orgulloso y poderoso. No sigue a cualquiera — y aun así te sigue a vos.', category: 'pet', price: 350, maxPurchases: 1, species: 'dragon', effect: { type: 'pet_item', value: '🐲' } },
                { id: 'pet_phoenix', name: '🔥 Fénix', desc: 'Renace de las cenizas. Literalmente: cuando debería morir, a veces elige no hacerlo.', category: 'pet', price: 400, maxPurchases: 1, species: 'fenix', effect: { type: 'pet_item', value: '🔥' } }
            ];

            const PET_PERSONALITIES = {
                gato: {
                    name: 'Gato',
                    trait: 'Independiente y observador',
                    animation: 'pet-anim-bounce',
                    messages: ['🐱 Ya te vi. No hace falta que lo repitas.', '🐱 Hago esto porque quiero, no porque me llamaste.', '🐱 ...', '🐱 Está bien. Un ratito nada más.', '🐱 Vos seguí. Yo miro desde acá.'],
                    lowHealthMsg: '🐱 Necesito una siesta larga.'
                },
                perro: {
                    name: 'Perro',
                    trait: 'Leal y entusiasta',
                    animation: 'pet-anim-wiggle',
                    messages: ['🐶 ¡Sabía que ibas a volver!', '🐶 ¡Vamos, vamos, vamos!', '🐶 ¡Sos mi persona favorita!', '🐶 ¡Hoy también, siempre!', '🐶 ¡Guau! ¡Buen trabajo, en serio!'],
                    lowHealthMsg: '🐶 Necesito que me cuides un poco...',
                    buff: { type: 'exp_boost', value: 1 }
                },
                buho: {
                    name: 'Búho',
                    trait: 'Sabio y calmado',
                    animation: 'pet-anim-pulse',
                    messages: ['🦉 Cada repetición cuenta más de lo que pensás.', '🦉 Estás construyendo algo, aunque no se note hoy.', '🦉 La paciencia también es una habilidad.', '🦉 Bien. Otra vez mañana.'],
                    lowHealthMsg: '🦉 Hasta la sabiduría necesita descanso.',
                    buff: { type: 'rune_bonus', value: 2 }
                },
                panda: {
                    name: 'Panda',
                    trait: 'Tranquilo y paciente',
                    animation: 'pet-anim-pulse',
                    messages: ['🐼 Sin apuro. Así también se llega.', '🐼 Un paso. Después el otro.', '🐼 Estoy bien acá, cerca tuyo.', '🐼 Todo va a su tiempo.'],
                    lowHealthMsg: '🐼 Bajemos el ritmo un poco.',
                    buff: { type: 'hp_boost', value: 10 }
                },
                zorro: {
                    name: 'Zorro',
                    trait: 'Astuto y juguetón',
                    animation: 'pet-anim-bounce',
                    messages: ['🦊 Encontré un atajo. No preguntes cómo.', '🦊 ¿Jugamos o trabajamos? Digo... lo mismo, ¿no?', '🦊 Esto va a salir bien. Confiá.', '🦊 ¡Ja! Te lo dije.'],
                    lowHealthMsg: '🦊 Hasta yo me canso de correr.',
                    buff: { type: 'gold_boost', value: 2 }
                },
                cuervo: {
                    name: 'Cuervo',
                    trait: 'Misterioso y observador',
                    animation: 'pet-anim-wiggle',
                    messages: ['🐦‍⬛ Ya vi cómo termina esto. Va bien.', '🐦‍⬛ Seguí. Yo aviso si algo cambia.', '🐦‍⬛ Nada se te escapa cuando yo miro.', '🐦‍⬛ Interesante elección, la de hoy.'],
                    lowHealthMsg: '🐦‍⬛ Hasta los cuervos necesitan sombra.'
                },
                mapache: {
                    name: 'Mapache',
                    trait: 'Curioso y travieso',
                    animation: 'pet-anim-bounce',
                    messages: ['🦝 ¿Qué es esto? ¿Puedo tocarlo?', '🦝 Encontré algo brillante. No preguntes qué.', '🦝 ¡Otra vez, otra vez!', '🦝 Me distraje, pero volví.'],
                    lowHealthMsg: '🦝 Necesito guardar energía un rato.'
                },
                dragon: {
                    name: 'Dragón',
                    trait: 'Orgulloso y poderoso',
                    animation: 'pet-anim-pulse',
                    messages: ['🐲 No sigo a cualquiera. A vos, sí.', '🐲 Esto apenas me exige esfuerzo. Bien hecho igual.', '🐲 Seguí así y vamos a llegar lejos.', '🐲 Hoy estuviste a la altura.'],
                    lowHealthMsg: '🐲 Hasta el fuego necesita apagarse un rato.',
                    buff: { type: 'attr_boost', attr: 'fuerza', value: 1 }
                },
                fenix: {
                    name: 'Fénix',
                    trait: 'Renace de las cenizas',
                    animation: 'pet-anim-glow',
                    messages: ['🔥 Lo que se apaga, puede volver a encenderse.', '🔥 Cada caída tiene una vuelta, si la elegís.', '🔥 No temo terminar. Sé que puedo empezar de nuevo.', '🔥 Seguimos, con o sin cenizas.'],
                    lowHealthMsg: '🔥 Todavía no. Todavía puedo más.',
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

            // ============================================================
