// ============================================================
// ===== ROMPER LA CALMA =====
// Para cuando no sabés por dónde empezar: el juego elige al azar una de
// las 52 tareas de la lista (movimiento, salir, casa, cuidado personal y mente) y te pide solo 2 minutos. Si completás los 2 minutos
// ganás un bonus chico (hasta 3 por día). Después decidís si seguís o parás.
// ============================================================

var CALMA_SECONDS = 120;
var CALMA_BONUS = 5;
var CALMA_DAILY_MAX = 3;

var calmaState = null;   // { item, status: 'proposed' | 'running' | 'done', endsAt, bonus }
var calmaTimer = null;

// Lista fija de tareas para romper la calma (52), por categoría
var CALMA_TASKS = [
    { n: 1, kind: "Activación física", title: "Hacer 20 sentadillas." },
    { n: 2, kind: "Activación física", title: "Hacer 10 flexiones de brazos." },
    { n: 3, kind: "Activación física", title: "Hacer 30 jumping jacks." },
    { n: 4, kind: "Activación física", title: "Hacer 1 minuto de plancha." },
    { n: 5, kind: "Activación física", title: "Correr en el lugar durante 2 minutos." },
    { n: 6, kind: "Activación física", title: "Hacer 15 estocadas." },
    { n: 7, kind: "Activación física", title: "Hacer 20 elevaciones de rodillas." },
    { n: 8, kind: "Activación física", title: "Hacer una serie de abdominales." },
    { n: 9, kind: "Activación física", title: "Hacer 20 elevaciones de talones." },
    { n: 10, kind: "Activación física", title: "Hacer una mini rutina con mancuernas." },
    { n: 11, kind: "Activación física", title: "Hacer 3 minutos de movilidad articular." },
    { n: 12, kind: "Activación física", title: "Bailar una canción completa." },
    { n: 13, kind: "Salir y cambiar de ambiente", title: "Salir a caminar una vuelta a la manzana." },
    { n: 14, kind: "Salir y cambiar de ambiente", title: "Ir a comprar algo caminando." },
    { n: 15, kind: "Salir y cambiar de ambiente", title: "Salir a tomar aire durante 5 minutos." },
    { n: 16, kind: "Salir y cambiar de ambiente", title: "Caminar hasta una plaza cercana." },
    { n: 17, kind: "Salir y cambiar de ambiente", title: "Barrer la vereda." },
    { n: 18, kind: "Salir y cambiar de ambiente", title: "Dar una vuelta a la manzana sin celular." },
    { n: 19, kind: "Salir y cambiar de ambiente", title: "Salir a buscar algo que necesites para la casa." },
    { n: 20, kind: "Salir y cambiar de ambiente", title: "Caminar escuchando música." },
    { n: 21, kind: "Tarea doméstica", title: "Tender la cama." },
    { n: 22, kind: "Tarea doméstica", title: "Lavar todos los platos." },
    { n: 23, kind: "Tarea doméstica", title: "Barrer una habitación." },
    { n: 24, kind: "Tarea doméstica", title: "Pasar un trapo por el piso." },
    { n: 25, kind: "Tarea doméstica", title: "Ordenar todo el escritorio." },
    { n: 26, kind: "Tarea doméstica", title: "Juntar y guardar la ropa desordenada." },
    { n: 27, kind: "Tarea doméstica", title: "Sacar la basura." },
    { n: 28, kind: "Tarea doméstica", title: "Limpiar el baño." },
    { n: 29, kind: "Tarea doméstica", title: "Limpiar los vidrios de una ventana." },
    { n: 30, kind: "Tarea doméstica", title: "Cambiar las sábanas." },
    { n: 31, kind: "Tarea doméstica", title: "Acomodar los muebles de tu habitación." },
    { n: 32, kind: "Tarea doméstica", title: "Organizar un cajón." },
    { n: 33, kind: "Tarea doméstica", title: "Aspirar una habitación." },
    { n: 34, kind: "Tarea doméstica", title: "Limpiar la cocina." },
    { n: 35, kind: "Tarea doméstica", title: "Ordenar tu espacio de entrenamiento." },
    { n: 36, kind: "Activación personal", title: "Ducharte y cambiarte de ropa." },
    { n: 37, kind: "Activación personal", title: "Preparar una botella grande de agua." },
    { n: 38, kind: "Activación personal", title: "Ponerte perfume y arreglarte aunque no salgas." },
    { n: 39, kind: "Activación personal", title: "Preparar la ropa para entrenar." },
    { n: 40, kind: "Activación personal", title: "Hacer tu rutina de cuidado personal." },
    { n: 41, kind: "Activación personal", title: "Preparar una comida para más tarde." },
    { n: 42, kind: "Activación personal", title: "Salir a comprar frutas." },
    { n: 43, kind: "Activación personal", title: "Preparar tu mochila o bolso para el día siguiente." },
    { n: 44, kind: "Desafío mental", title: "Leer 5 páginas de un libro." },
    { n: 45, kind: "Desafío mental", title: "Estudiar 5 minutos un tema pendiente." },
    { n: 46, kind: "Desafío mental", title: "Resolver un ejercicio de programación." },
    { n: 47, kind: "Desafío mental", title: "Escribir 5 objetivos personales." },
    { n: 48, kind: "Desafío mental", title: "Aprender algo nuevo durante 5 minutos." },
    { n: 49, kind: "Desafío mental", title: "Escribir una idea de proyecto y cómo empezar." },
    { n: 50, kind: "Desafío mental", title: "Organizar las tres prioridades del día." },
    { n: 51, kind: "Desafío mental", title: "Hacer una tarea que venís postergando." },
    { n: 52, kind: "Desafío mental", title: "Dejar el celular en otra habitación y permanecer 5 minutos sin pantallas." },
];

var calmaRecent = [];   // últimas propuestas, para no repetir enseguida

function calmaCandidates() {
    return CALMA_TASKS.map(function (t) { return { key: 'c:' + t.n, kind: t.kind, title: t.title }; });
}

// Una al azar de la lista (evita repetir las últimas 15 y la actual si pedís "otra")
function calmaPick(excludeKey) {
    var c = calmaCandidates().filter(function (x) { return x.key !== excludeKey && calmaRecent.indexOf(x.key) === -1; });
    if (!c.length) { calmaRecent = []; c = calmaCandidates().filter(function (x) { return x.key !== excludeKey; }); }
    var pick = c[Math.floor(Math.random() * c.length)];
    calmaRecent.push(pick.key);
    if (calmaRecent.length > 15) calmaRecent.shift();
    return pick;
}

function calmaBonusesToday() {
    var today = localDateStr();
    if (!player.calma || player.calma.date !== today) player.calma = { date: today, count: 0 };
    return player.calma.count;
}

function breakCalma() {
    if (calmaState && calmaState.status === 'running') return;
    var item = calmaPick(null);
    calmaState = item ? { item: item, status: 'proposed' } : { item: null, status: 'empty' };
    renderCalma();
}

function calmaAnother() {
    var item = calmaPick(calmaState && calmaState.item ? calmaState.item.key : null);
    calmaState = item ? { item: item, status: 'proposed' } : { item: null, status: 'empty' };
    renderCalma();
}

function calmaStart() {
    if (!calmaState || !calmaState.item) return;
    calmaState.status = 'running';
    calmaState.endsAt = Date.now() + CALMA_SECONDS * 1000;
    if (calmaTimer) clearInterval(calmaTimer);
    calmaTimer = setInterval(calmaTick, 1000);
    renderCalma();
}

function calmaCancel() {
    if (calmaTimer) { clearInterval(calmaTimer); calmaTimer = null; }
    calmaState = null;
    renderCalma();
}

function calmaFmt(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function calmaTick() {
    if (!calmaState || calmaState.status !== 'running') {
        if (calmaTimer) { clearInterval(calmaTimer); calmaTimer = null; }
        return;
    }
    var left = Math.max(0, Math.ceil((calmaState.endsAt - Date.now()) / 1000));
    var el = document.getElementById('calma-time');
    if (el) el.innerText = calmaFmt(left);
    if (left > 0) return;

    clearInterval(calmaTimer);
    calmaTimer = null;
    var count = calmaBonusesToday();
    var bonus = 0;
    if (count < CALMA_DAILY_MAX && !player.gameOver) {
        bonus = CALMA_BONUS;
        player.calma.count++;
        gainRewards(bonus, 0, 'disciplina', 'calma', 'Romper la Calma', 'Arrancaste "' + calmaState.item.title + '" (2 minutos)');
        showToast('Rompiste la Calma. +' + bonus + ' EXP', 'success', 'Romper la Calma');
    } else {
        showToast('Rompiste la Calma. Ya llegaste al tope de bonus de hoy.', 'info', 'Romper la Calma');
    }
    saveGame();
    calmaState.status = 'done';
    calmaState.bonus = bonus;
    renderCalma();
}

function renderCalma() {
    var el = document.getElementById('calma-box');
    if (!el || typeof player === 'undefined') return;
    var left = CALMA_DAILY_MAX - calmaBonusesToday();
    var s = calmaState;
    var html = '';

    if (!s) {
        html = '<p class="calma-hint">¿No sabés por dónde empezar? Te elijo una tarea al azar de la lista y te pido solo 2 minutos. Después decidís vos.</p>' +
            '<button class="action-btn" onclick="breakCalma()">Romper la Calma</button>' +
            '<span class="calma-left">' + (left > 0 ? 'Bonus disponibles hoy: ' + left : 'Ya usaste los bonus de hoy') + '</span>';
    } else if (s.status === 'empty') {
        html = '<div class="calma-card"><div class="calma-line">No tenés nada pendiente para hoy. La Calma ya está rota.</div></div>' +
            '<button class="calma-sub-btn" onclick="calmaCancel()">Cerrar</button>';
    } else if (s.status === 'proposed') {
        html = '<div class="calma-card">' +
            '<div class="calma-kind">' + s.item.kind + '</div>' +
            '<div class="calma-task">' + escapeHtml(s.item.title) + '</div>' +
            '<div class="calma-line">Solo 2 minutos. No tenés que terminarla.</div>' +
            '</div>' +
            '<div class="calma-actions">' +
            '<button class="action-btn" onclick="calmaStart()">Empezar 2 minutos</button>' +
            '<button class="calma-sub-btn" onclick="calmaAnother()">Otra</button>' +
            '<button class="calma-sub-btn" onclick="calmaCancel()">Cancelar</button>' +
            '</div>';
    } else if (s.status === 'running') {
        var secs = Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000));
        html = '<div class="calma-card running">' +
            '<div class="calma-kind">' + s.item.kind + '</div>' +
            '<div class="calma-task">' + escapeHtml(s.item.title) + '</div>' +
            '<div class="calma-time" id="calma-time">' + calmaFmt(secs) + '</div>' +
            '<div class="calma-line">Solo esto. Después decidís.</div>' +
            '</div>' +
            '<button class="calma-sub-btn" onclick="calmaCancel()">Cancelar</button>';
    } else {
        html = '<div class="calma-card done">' +
            '<div class="calma-kind">Calma rota</div>' +
            '<div class="calma-task">' + (s.bonus > 0 ? '+' + s.bonus + ' EXP' : 'Sin bonus (tope de hoy)') + '</div>' +
            '<div class="calma-line">Ya estás en movimiento. ¿Seguís con «' + escapeHtml(s.item.title) + '» o parás acá?</div>' +
            '</div>' +
            '<button class="action-btn" onclick="calmaCancel()">Listo</button>';
    }
    el.innerHTML = html;
}
