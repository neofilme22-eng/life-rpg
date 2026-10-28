// ============================================================
// ===== REGLAMENTO =====
// Resume todas las reglas del juego con los valores reales.
// Las curvas y tablas salen del código en vivo (nextLevelExp, hospital, dificultad).
// El daño y las recompensas están documentados a mano: mantener sincronizado
// con damage-system.js, pressure.js, runes.js, daily-missions.js, bosses.js y events-dungeons.js.
// ============================================================

var RULES_DAMAGE = [
    { cause: 'Tarea diaria vencida', dmg: '15 HP por tarea', when: 'Pasó su hora límite (o las 23:59 si no tiene hora) sin completarla. Una vez por tarea.' },
    { cause: 'Día sin ninguna tarea cumplida', dmg: '+15 HP', when: 'Todas las tareas del día vencieron y no completaste ninguna.' },
    { cause: 'Meta vencida', dmg: '30 HP (o su damage)', when: 'Pasó la fecha límite de la meta sin cumplirla. Una vez por meta.' },
    { cause: 'Reloj en Contra', dmg: '2/3 del daño de la meta (20 HP)', when: 'Pasó la mitad del plazo de una meta y no completaste ni una tarea. Una vez por meta.' },
    { cause: 'Caso Frío', dmg: '10 HP', when: 'Ninguna meta tuvo una tarea cumplida en 30 días. Se repite cada 30 días.' },
    { cause: 'Evento expirado', dmg: '8 a 25 HP (o su damage)', when: 'Iniciaste un evento y se acabó su tiempo sin terminarlo. Baja según cuánto avanzaste.' },
    { cause: 'Pista que se Enfría', dmg: '~1/3 del daño del evento (8 HP)', when: 'Pasó la mitad del tiempo de un evento iniciado sin marcar ninguna tarea. Una vez por evento.' },
    { cause: 'Evento Sorpresa sin resolver', dmg: '40 HP', when: 'No completaste el evento sorpresa dentro de sus 24 horas.' },
    { cause: 'Racha de runa perdida (Lo que Costó Construir)', dmg: '1 HP por día de racha (mín. 3, tope 20 por runa o su damage; tope total 40)', when: 'Al cambiar el día, una runa con racha que no canalizaste vuelve a 0.' },
    { cause: 'Ritual a Medias', dmg: '5 HP', when: 'Al cambiar el día, ayer canalizaste menos de la mitad de tus runas.' },
    { cause: 'Silencio Radial', dmg: '10 HP', when: '3 días seguidos sin completar ninguna tarea diaria. Se repite cada 3 días.' },
    { cause: 'Inactividad', dmg: '10 HP por día (tope 60)', when: 'Pasás más de 1 día sin abrir el juego. El primer día es de gracia.' }
];

var RULES_DIFFICULTY = [
    { key: 'easy', label: 'Fácil', exp: 1.6, levelCurve: 0.65, damageMod: 0.5 },
    { key: 'normal', label: 'Normal', exp: 1, levelCurve: 1, damageMod: 1 },
    { key: 'hard', label: 'Difícil', exp: 0.65, levelCurve: 1.45, damageMod: 1.6 },
    { key: 'expert', label: 'Experto', exp: 0.4, levelCurve: 2, damageMod: 2.2 }
];

function rulesFmt(n) { return Number(n).toLocaleString('es-AR'); }

function rulesTable(headers, rows) {
    var h = '<div class="rules-wrap"><table class="rules-table"><thead><tr>' + headers.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
        h += '<tr' + (r.cls ? ' class="' + r.cls + '"' : '') + '>' + r.cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
    });
    return h + '</tbody></table></div>';
}

function rulesSection(title, body) {
    return '<div class="section-box"><div class="section-header"><span class="section-title">' + title + '</span><span class="section-ornament"></span></div><div class="rules-body">' + body + '</div></div>';
}

function renderRules() {
    var el = document.getElementById('rules-content');
    if (!el || typeof player === 'undefined') return;
    var mult = getDifficultyMultipliers();
    var curDiff = (typeof currentDifficulty !== 'undefined' && currentDifficulty) || 'normal';
    var html = '';

    // ---- Art. I: niveles y EXP
    var lvRows = [], cum = 0, marks = { 1: 1, 2: 1, 3: 1, 5: 1, 10: 1, 15: 1, 20: 1, 25: 1, 29: 1 };
    for (var l = 1; l <= 29; l++) {
        var need = nextLevelExp(l);
        cum += need;
        if (marks[l]) lvRows.push({ cells: ['Nivel ' + l + ' → ' + (l + 1), rulesFmt(need) + ' EXP', rulesFmt(cum) + ' EXP'] });
    }
    html += rulesSection('Art. I — Niveles y Experiencia',
        '<p class="rules-p">La EXP necesaria para pasar de nivel es <span class="rules-tag">100 + 40 × nivel^1,3</span>, redondeada a 5 y multiplicada por la dificultad. Un premio grande puede subir varios niveles de una vez, y cada subida restaura todo tu HP.</p>' +
        '<p class="rules-p">Valores con tu dificultad actual (<b>' + (RULES_DIFFICULTY.filter(function (d) { return d.key === curDiff; })[0] || RULES_DIFFICULTY[1]).label + '</b>):</p>' +
        rulesTable(['Subida', 'Costo del nivel', 'EXP total acumulada'], lvRows) +
        '<p class="rules-p">La dificultad también cambia cuánta EXP ganás y cuánto daño recibís:</p>' +
        rulesTable(['Dificultad', 'EXP ganada', 'Costo de niveles', 'Daño recibido'], RULES_DIFFICULTY.map(function (d) {
            return { cls: d.key === curDiff ? 'current' : '', cells: [d.label + (d.key === curDiff ? ' (actual)' : ''), '×' + d.exp, '×' + d.levelCurve, '×' + d.damageMod] };
        })));

    // ---- Art. II: vida
    html += rulesSection('Art. II — Vida (HP)',
        '<p class="rules-p">Tu HP máximo es <span class="rules-tag">100 + 5 × (nivel − 1)</span>: ' + [1, 10, 20, 30].map(function (n) { return 'nivel ' + n + ' = ' + (100 + 5 * (n - 1)) + ' HP'; }).join(', ') + '. Ahora tenés <b>' + Math.round(player.hp) + ' / ' + player.maxHp + '</b>.</p>' +
        '<p class="rules-p">Si tu HP llega a 0 es <b>Game Over</b>: perdés el 20% de tu EXP actual (multiplicado por el modificador de EXP de la dificultad), todos tus atributos bajan 1 punto (mínimo 1) y reaparecés con la mitad de tu HP máximo. También podés borrar la partida.</p>');

    // ---- Art. III: daño
    var tl = (typeof tensionLevel === 'function') ? tensionLevel() : 0;
    html += rulesSection('Art. III — Daño',
        rulesTable(['Causa', 'Daño', 'Cuándo'], RULES_DAMAGE.map(function (r) { return { cells: [r.cause, r.dmg, r.when] }; })) +
        '<p class="rules-p"><b>Dificultad.</b> Todo el daño se multiplica por tu modificador actual: <span class="rules-tag">×' + mult.damageMod + '</span>.</p>' +
        '<p class="rules-p"><b>Tensión.</b> Cada día seguido en el que recibís daño suma +10% al daño del día siguiente, hasta +50%. Un día sin daño la reinicia. Hoy tu tensión es <b>+' + (tl * 10) + '%</b>.</p>' +
        '<p class="rules-p"><b>Valores propios.</b> Las metas, los eventos y las runas pueden traer un campo <span class="rules-tag">damage</span> en su JSON que reemplaza el daño predeterminado. No se muestra en las tarjetas.</p>' +
        '<p class="rules-p"><b>Evento Sorpresa.</b> Cada tanto aparece uno al azar (en promedio, una vez por semana) arriba en Eventos. Tenés 24 horas para resolverlo: si lo completás ganás EXP; si no, recibís 40 HP de daño.</p>');

    // ---- Art. IV: curación
    var meds = (typeof HOSPITAL_MEDICINES !== 'undefined') ? HOSPITAL_MEDICINES : [];
    var trts = (typeof HOSPITAL_TREATMENTS !== 'undefined') ? HOSPITAL_TREATMENTS : [];
    var medRows = meds.map(function (m) { return { cells: [m.name, 'Nivel ' + m.level, '+' + m.heal + ' HP', m.cooldownH + ' h'] }; });
    var trtRows = trts.map(function (t) { return { cells: [t.name, 'Nivel ' + t.level, '+' + t.heal + ' HP', (t.cooldownH / 24) + (t.cooldownH === 24 ? ' día' : ' días')] }; });
    html += rulesSection('Art. IV — Curación',
        '<p class="rules-p">Hay dos formas de recuperar HP: <b>subir de nivel</b> (lo restaura por completo) y el <b>Hospital</b>. Medicinas y tratamientos solo curan: no dan EXP ni puntos de atributo, se desbloquean por nivel, tienen un enfriamiento y se deshabilitan cuando tu HP está al máximo.</p>' +
        '<p class="rules-p"><b>Medicinas</b> (una tarea cada una):</p>' + rulesTable(['Medicina', 'Se desbloquea', 'Cura', 'Enfriamiento'], medRows) +
        '<p class="rules-p"><b>Tratamientos</b> (una lista de tareas; curan al completarlas todas):</p>' + rulesTable(['Tratamiento', 'Se desbloquea', 'Cura', 'Enfriamiento'], trtRows));

    // ---- Art. V: recompensas
    html += rulesSection('Art. V — Recompensas',
        rulesTable(['Origen', 'EXP'], [
            { cells: ['Tarea diaria', '8 EXP'] },
            { cells: ['Runa canalizada', 'La de su JSON (expReward)'] },
            { cells: ['Misión de DLC', 'La de su JSON (expReward)'] },
            { cells: ['Evento', 'La de su JSON (expReward)'] },
            { cells: ['Meta', 'La de su JSON (expReward)'] },
            { cells: ['Evento Sorpresa resuelto', '80 a 110 EXP'] },
            { cells: ['Contacto de la libreta', '3 a 15 EXP según la frecuencia (diaria 3, cada 3 días 6, semanal 10, mensual 15), solo si ya tocaba; tope 30 EXP por día'] }
        ]) +
        '<p class="rules-p">Toda la EXP se multiplica por el modificador de EXP de la dificultad. Los trofeos (18 propios y uno por cada DLC) se desbloquean solos al cumplir su condición.</p>');

    // ---- Art. VI: JSON
    html += rulesSection('Art. VI — Formato de los JSON',
        rulesTable(['Tipo', 'Estructura'], [
            { cells: ['Misiones (DLC)', '<span class="rules-code">{ dlcName, trophyIcon, trophyName, missions: [ { title, type: "main" | "secondary", attr, expReward, goldReward } ] }</span>'] },
            { cells: ['Eventos', '<span class="rules-code">[ { title, type: "dungeon", icon, image, start, duration (horas), levelRequired, tasks: [..], expReward, goldReward, damage, period } ]</span>'] },
            { cells: ['Metas', '<span class="rules-code">{ bosses: [ { name, icon, image, tasks: [..], expReward, goldReward, damage, deadline: "AAAA-MM-DD" } ] }</span>'] },
            { cells: ['Runas', '<span class="rules-code">{ runeSetName, runes: [ { title, icon, attr, expReward, goldReward, damage } ] }</span>'] }
        ]) +
        '<p class="rules-p">Atributos válidos: <span class="rules-tag">fuerza</span> <span class="rules-tag">disciplina</span> <span class="rules-tag">mente</span> <span class="rules-tag">creatividad</span> <span class="rules-tag">carrera</span> <span class="rules-tag">finanzas</span> <span class="rules-tag">social</span> <span class="rules-tag">relaciones</span>.</p>' +
        '<p class="rules-p"><span class="rules-tag">damage</span> es opcional y va en HP fijos. <span class="rules-tag">deadline</span> es opcional: sin fecha límite, una meta no puede vencer ni activar el Reloj en Contra. El oro (<span class="rules-tag">goldReward</span>) hoy no se usa.</p>');

    el.innerHTML = html;
}
