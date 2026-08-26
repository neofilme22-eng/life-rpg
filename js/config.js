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
            flock: [],
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
            lastRuneReset: null
        };

        // ============================================================
            // ===== VARIABLES GLOBALES =====
            // ============================================================

            const SHOP_ITEMS_DEFAULT = [
                { id: 'sword_wood', name: '🗡️ Espada de Madera', desc: 'Una espada básica para principiantes. +2 de daño.', category: 'arma', price: 50, maxPurchases: 1, effect: { type: 'weapon', value: 2 }, slot: 'arma' },
                { id: 'sword_iron', name: '⚔️ Espada de Hierro', desc: 'Una espada robusta de hierro. +5 de daño.', category: 'arma', price: 120, maxPurchases: 1, effect: { type: 'weapon', value: 5 }, slot: 'arma' },
                { id: 'sword_steel', name: '🗡️ Espada de Acero', desc: 'Una espada afilada de acero. +10 de daño.', category: 'arma', price: 250, maxPurchases: 1, effect: { type: 'weapon', value: 10 }, slot: 'arma' },
                { id: 'bow_elven', name: '🏹 Arco Élfico', desc: 'Un arco ligero y preciso. +8 de daño.', category: 'arma', price: 200, maxPurchases: 1, effect: { type: 'weapon', value: 8 }, slot: 'arma' },
                { id: 'staff_magic', name: '🪄 Bastón Mágico', desc: 'Un bastón que canaliza energía arcana. +12 de daño.', category: 'arma', price: 300, maxPurchases: 1, effect: { type: 'weapon', value: 12 }, slot: 'arma' },
                { id: 'dagger_shadow', name: '🗡️ Daga Sombría', desc: 'Una daga ligera y letal. +6 de daño.', category: 'arma', price: 160, maxPurchases: 1, effect: { type: 'weapon', value: 6 }, slot: 'arma' },
                { id: 'axe_battle', name: '🪓 Hacha de Batalla', desc: 'Un hacha pesada que causa gran daño. +15 de daño.', category: 'arma', price: 350, maxPurchases: 1, effect: { type: 'weapon', value: 15 }, slot: 'arma' },
                { id: 'armor_leather', name: '🛡️ Armadura de Cuero', desc: 'Armadura ligera de cuero. +2 de defensa.', category: 'armadura', price: 60, maxPurchases: 1, effect: { type: 'armor', value: 2 }, slot: 'armadura' },
                { id: 'armor_chain', name: '🛡️ Cota de Malla', desc: 'Armadura de malla resistente. +5 de defensa.', category: 'armadura', price: 150, maxPurchases: 1, effect: { type: 'armor', value: 5 }, slot: 'armadura' },
                { id: 'armor_plate', name: '🛡️ Armadura de Placas', desc: 'Armadura completa de placas de acero. +10 de defensa.', category: 'armadura', price: 300, maxPurchases: 1, effect: { type: 'armor', value: 10 }, slot: 'armadura' },
                { id: 'armor_mithril', name: '🛡️ Armadura de Mithril', desc: 'Una armadura legendaria de mithril. +15 de defensa.', category: 'armadura', price: 500, maxPurchases: 1, effect: { type: 'armor', value: 15 }, slot: 'armadura' },
                { id: 'armor_scale', name: '🛡️ Armadura de Escamas', desc: 'Armadura hecha con escamas de dragón. +8 de defensa.', category: 'armadura', price: 220, maxPurchases: 1, effect: { type: 'armor', value: 8 }, slot: 'armadura' },
                { id: 'armor_robe', name: '🛡️ Túnica Arcana', desc: 'Túnica tejida con hilos mágicos. +6 de defensa.', category: 'armadura', price: 180, maxPurchases: 1, effect: { type: 'armor', value: 6 }, slot: 'armadura' },
                { id: 'armor_bone', name: '🛡️ Armadura de Hueso', desc: 'Armadura creada con huesos de bestias ancestrales. +12 de defensa.', category: 'armadura', price: 400, maxPurchases: 1, effect: { type: 'armor', value: 12 }, slot: 'armadura' },
                { id: 'exp_boost_1', name: '💫 Reliquia de Experiencia', desc: 'Ganas +5 EXP extra por cada misión completada', category: 'reliquia', price: 50, maxPurchases: 1, effect: { type: 'exp_boost', value: 5 }, slot: 'reliquia' },
                { id: 'exp_boost_2', name: '💫 Reliquia de Sabiduría', desc: 'Ganas +10 EXP extra por cada misión completada', category: 'reliquia', price: 120, maxPurchases: 1, effect: { type: 'exp_boost', value: 10 }, slot: 'reliquia' },
                { id: 'gold_boost', name: '🟡 Reliquia de la Fortuna', desc: 'Ganas +5 ORO extra por cada misión completada', category: 'reliquia', price: 80, maxPurchases: 1, effect: { type: 'gold_boost', value: 5 }, slot: 'reliquia' },
                { id: 'rune_bonus', name: '🔮 Reliquia de la Disciplina', desc: 'Las runas dan +3 EXP extra al canalizarlas', category: 'reliquia', price: 100, maxPurchases: 1, effect: { type: 'rune_bonus', value: 3 }, slot: 'reliquia' },
                { id: 'hp_boost', name: '❤️ Reliquia de Vitalidad', desc: 'Aumenta tu HP máximo en +20', category: 'reliquia', price: 150, maxPurchases: 1, effect: { type: 'hp_boost', value: 20 }, slot: 'reliquia' },
                { id: 'hp_potion', name: '❤️ Poción de Vida', desc: 'Restaura 50 HP al personaje', category: 'consumable', price: 30, maxPurchases: 999, effect: { type: 'heal', value: 50 } },
                { id: 'attr_point', name: '⭐ Punto de Atributo', desc: 'Aumenta 1 punto en el atributo que elijas', category: 'consumable', price: 40, maxPurchases: 999, effect: { type: 'attr_point', value: 1 } },
                { id: 'revive_pet', name: '💫 Polvo de Estrellas', desc: 'Revive a tu mascota si ha fallecido.', category: 'consumable', price: 200, maxPurchases: 999, effect: { type: 'revive_pet', value: 1 } },
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
                { id: 'pet_dog', name: '🐶 Perro Fiel', desc: 'Un compañero leal que te sigue a todas partes.', category: 'pet', price: 150, maxPurchases: 1, effect: { type: 'pet_item', value: '🐶' } },
                { id: 'pet_cat', name: '🐱 Gato Misterioso', desc: 'Un gato enigmático que te da suerte.', category: 'pet', price: 180, maxPurchases: 1, effect: { type: 'pet_item', value: '🐱' } },
                { id: 'pet_dragon', name: '🐲 Dragón Pequeño', desc: 'Un dragón que escupe chispas de sabiduría.', category: 'pet', price: 250, maxPurchases: 1, effect: { type: 'pet_item', value: '🐲' } },
                { id: 'pet_fox', name: '🦊 Zorro Astuto', desc: 'Un zorro inteligente que te ayuda a encontrar tesoros.', category: 'pet', price: 200, maxPurchases: 1, effect: { type: 'pet_item', value: '🦊' } },
                { id: 'pet_owl', name: ' Búho Sabio', desc: 'Un búho que te susurra conocimientos antiguos.', category: 'pet', price: 220,icon: 'https://cdn-icons-png.flaticon.com/512/616/616451.png', maxPurchases: 1, effect: { type: 'pet_item', value: '🦉' } }
            ];

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

            const FLOCK_STATUSES = [
                { id: 'unknown', label: '❓ Desconocida' },
                { id: 'encounter', label: '👋 Encuentro' },
                { id: 'known', label: '🤝 Conocida' },
                { id: 'friend', label: '🤗 Amiga' },
                { id: 'romance', label: '❤️ Interés Romántico' },
                { id: 'partner', label: '💞 Pareja' }
            ];

            const INTERACTION_TYPES = [
                { id: 'charla', label: '💬 Charla', affinityMin: 3, affinityMax: 8, exp: 5, gold: 2 },
                { id: 'profunda', label: '🧠 Conversación profunda', affinityMin: 6, affinityMax: 15, exp: 12, gold: 3 },
                { id: 'juntada', label: '☕ Juntada', affinityMin: 5, affinityMax: 12, exp: 8, gold: 4 },
                { id: 'beso', label: '👄 Beso', affinityMin: 8, affinityMax: 18, exp: 10, gold: 3 },
                { id: 'sexo', label: '😈 Sexo', affinityMin: 12, affinityMax: 25, exp: 15, gold: 5 }
            ];

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
                flock: '👠',
                shop: '🛒',
                level: '👑',
                trophy: '🏆',
                pomodoro: '🕯️',
                daily: '📋',
                inventory: '🎒',
                damage: '💔'
            };

            const BASE_TROPHY_DEFINITIONS = [
                { id: 'level_2', icon: 'https://cdn-icons-png.flaticon.com/512/3429/3429417.png', name: 'Aprendiz', desc: 'Alcanza el nivel 2', check: function (p) { return p.level >= 2; } },
                { id: 'level_5', icon: 'https://cdn-icons-png.flaticon.com/512/2822/2822323.png', name: 'Explorador', desc: 'Alcanza el nivel 5', check: function (p) { return p.level >= 5; } },
                { id: 'level_10', icon: 'https://cdn-icons-png.flaticon.com/512/2822/2822332.png', name: 'Guerrero', desc: 'Alcanza el nivel 10', check: function (p) { return p.level >= 10; } },
                { id: 'level_20', icon: 'https://cdn-icons-png.flaticon.com/512/3943/3943804.png', name: 'Campeón', desc: 'Alcanza el nivel 20', check: function (p) { return p.level >= 20; } },
                { id: 'exp_500', icon: 'https://cdn-icons-png.flaticon.com/512/2811/2811490.png', name: 'Esfuerzo Constante', desc: 'Acumula 500 EXP', check: function (p) { return p.exp >= 500; } },
                { id: 'exp_2000', icon: 'https://cdn-icons-png.flaticon.com/512/3755/3755147.png', name: 'Fuego Interior', desc: 'Acumula 2000 EXP', check: function (p) { return p.exp >= 2000; } },
                { id: 'exp_10000', icon: 'https://cdn-icons-png.flaticon.com/512/5080/5080344.png', name: 'Leyenda', desc: 'Acumula 10000 EXP', check: function (p) { return p.exp >= 10000; } },
                { id: 'gold_100', icon: 'https://cdn-icons-png.flaticon.com/512/9382/9382189.png', name: 'Ahorrador', desc: 'Acumula 100 de ORO', check: function (p) { return p.gold >= 100; } },
                { id: 'gold_1000', icon: 'https://cdn-icons-png.flaticon.com/512/2460/2460475.png', name: 'Rico', desc: 'Acumula 1000 de ORO', check: function (p) { return p.gold >= 1000; } },
                { id: 'gold_5000', icon: 'https://cdn-icons-png.flaticon.com/512/2144/2144792.png', name: 'Magnate', desc: 'Acumula 5000 de ORO', check: function (p) { return p.gold >= 5000; } }
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
            let petClickCount = 0;
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
