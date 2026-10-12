// ============================================================
// ===== HOSPITAL: medicinas (1 tarea) y tratamientos (lista) =====
// Solo curan HP: no dan EXP, oro ni puntos de atributo, y no cuentan
// para estadísticas ni trofeos de misiones. Se desbloquean por nivel,
// se deshabilitan con el HP lleno y tienen un enfriamiento.
// ============================================================

var HOSPITAL_MEDICINES = [
    { id: 'med_suero',          name: 'Suero Oral',          task: 'Tomar un vaso grande de agua (unos 500 ml), despacio.',                level: 1,  heal: 3,  cooldownH: 4 },
    { id: 'med_vitd',           name: 'Vitamina D',          task: 'Salir 15 minutos a la luz natural, sin pantallas.',                    level: 1,  heal: 3,  cooldownH: 4 },
    { id: 'med_fibra',          name: 'Fibra Natural',       task: 'Comer una fruta o una porción de verduras.',                           level: 1,  heal: 3,  cooldownH: 4 },
    { id: 'med_magnesio',       name: 'Magnesio',            task: 'Estirar cuello, espalda y piernas durante 5 minutos.',                 level: 3,  heal: 5,  cooldownH: 4 },
    { id: 'med_aire',           name: 'Aire Puro',           task: 'Ventilar el ambiente y respirar profundo durante 5 minutos.',          level: 3,  heal: 5,  cooldownH: 4 },
    { id: 'med_probiotico',     name: 'Probiótico',          task: 'Hacer una comida sin ultraprocesados.',                                level: 3,  heal: 5,  cooldownH: 4 },
    { id: 'med_melatonina',     name: 'Melatonina',          task: 'Apagar las pantallas 30 minutos antes de dormir.',                     level: 6,  heal: 8,  cooldownH: 6 },
    { id: 'med_calmante',       name: 'Calmante Natural',    task: 'Hacer 10 minutos de respiración lenta o meditación.',                  level: 6,  heal: 8,  cooldownH: 6 },
    { id: 'med_analgesico',     name: 'Analgésico Postural', task: 'Caminar 15 minutos sin el celular.',                                   level: 6,  heal: 8,  cooldownH: 6 },
    { id: 'med_omega',          name: 'Omega 3',             task: 'Cocinar y comer una comida casera equilibrada.',                       level: 10, heal: 12, cooldownH: 6 },
    { id: 'med_antiestres',     name: 'Antiestrés',          task: 'Escribir 10 minutos lo que te preocupa y cerrar la libreta.',          level: 10, heal: 12, cooldownH: 6 },
    { id: 'med_complejob',      name: 'Complejo B',          task: 'Hacer 20 minutos de ejercicio moderado.',                              level: 15, heal: 16, cooldownH: 8 },
    { id: 'med_reconstituyente', name: 'Reconstituyente',    task: 'Acostarte a la hora que te propusiste, sin postergar.',                level: 20, heal: 20, cooldownH: 8 }
];

var HOSPITAL_TREATMENTS = [
    { id: 'trt_hidro', name: 'Hidroterapia', level: 2, heal: 15, cooldownH: 24, tasks: [
        'Darte una ducha templada de 10 minutos, sin apuro',
        'Tomar 2 litros de agua a lo largo del día',
        'Evitar las bebidas azucaradas hoy',
        'Estirar 5 minutos al salir de la ducha'
    ] },
    { id: 'trt_fisio', name: 'Fisioterapia Casera', level: 5, heal: 25, cooldownH: 24, tasks: [
        'Entrar en calor con 5 minutos de movilidad articular',
        'Hacer 15 minutos de estiramientos o yoga suave',
        'Automasajear cuello y hombros durante 5 minutos',
        'Caminar 20 minutos a un ritmo cómodo',
        'Tomar agua al terminar la sesión'
    ] },
    { id: 'trt_sueno', name: 'Terapia del Sueño', level: 8, heal: 35, cooldownH: 24, tasks: [
        'Definir hora de dormir y de despertar, y respetarlas',
        'No tomar cafeína después de las 15:00',
        'Apagar las pantallas una hora antes de dormir',
        'Dejar el cuarto oscuro y ventilado',
        'Dormir entre 7 y 8 horas'
    ] },
    { id: 'trt_calma', name: 'Aromaterapia y Calma', level: 12, heal: 45, cooldownH: 36, tasks: [
        'Ordenar y airear tu espacio',
        'Preparar un ambiente tranquilo: luz baja y música suave',
        'Hacer 15 minutos de respiración consciente',
        'Darte un baño o una ducha relajante',
        'Leer 20 minutos sin pantallas'
    ] },
    { id: 'trt_dieta', name: 'Dieta Depurativa', level: 16, heal: 55, cooldownH: 36, tasks: [
        'Desayunar algo completo',
        'Comer tres porciones de frutas o verduras',
        'Pasar el día sin ultraprocesados',
        'Cenar liviano y temprano',
        'Tomar 2 litros de agua'
    ] },
    { id: 'trt_rehab', name: 'Rehabilitación Completa', level: 22, heal: 70, cooldownH: 48, tasks: [
        'Hacer 30 minutos de ejercicio',
        'Estirar 10 minutos al terminar',
        'Comer una comida casera equilibrada',
        'Pasar 15 minutos al aire libre',
        'No tomar alcohol hoy',
        'Dormir entre 7 y 8 horas'
    ] },
    { id: 'trt_chequeo', name: 'Chequeo Médico', level: 25, heal: 80, cooldownH: 72, tasks: [
        'Sacar turno para un control (médico, dentista u otro)',
        'Ir al control y hacerte los estudios indicados',
        'Anotar las indicaciones que te dieron',
        'Empezar a seguirlas hoy mismo'
    ] }
];

function hospitalEnsure() {
    if (!player.hospital) player.hospital = { cooldowns: {}, progress: {} };
    if (!player.hospital.cooldowns) player.hospital.cooldowns = {};
    if (!player.hospital.progress) player.hospital.progress = {};
}

function hospitalFmtRemaining(ms) {
    var min = Math.ceil(ms / 60000);
    if (min < 1) return 'menos de 1 min';
    var h = Math.floor(min / 60), m = min % 60;
    if (h === 0) return m + ' min';
    if (h >= 24) { var d = Math.floor(h / 24); return d + ' d ' + (h % 24) + ' h'; }
    return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
}

// Devuelve null si se puede usar, o el motivo: 'gameover' | 'locked' | 'full' | 'cooldown'
function hospitalBlockReason(item) {
    hospitalEnsure();
    if (player.gameOver) return 'gameover';
    if (player.level < item.level) return 'locked';
    if (player.hp >= player.maxHp) return 'full';
    var ready = player.hospital.cooldowns[item.id] || 0;
    if (Date.now() < ready) return 'cooldown';
    return null;
}

function hospitalApplyHeal(item, kind) {
    var before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + item.heal);
    var healed = player.hp - before;
    player.hospital.cooldowns[item.id] = Date.now() + item.cooldownH * 3600 * 1000;
    if (typeof addLogEntry === 'function') addLogEntry('heal', (kind === 'med' ? 'Medicina "' : 'Tratamiento "') + item.name + '"', '+' + healed + ' HP', 0, 0, null);
    if (typeof updateHUD === 'function') updateHUD();
    saveGame();
    showToast(item.name + ': +' + healed + ' HP', 'success', kind === 'med' ? 'Farmacia' : 'Tratamiento');
    return healed;
}

function takeMedicine(id) {
    var med = HOSPITAL_MEDICINES.filter(function (m) { return m.id === id; })[0];
    if (!med || hospitalBlockReason(med)) return;
    hospitalApplyHeal(med, 'med');
    renderHospital();
}

function toggleTreatmentTask(id, idx) {
    var t = HOSPITAL_TREATMENTS.filter(function (x) { return x.id === id; })[0];
    if (!t || hospitalBlockReason(t)) { renderHospital(); return; }
    var prog = player.hospital.progress[id];
    if (!prog || prog.length !== t.tasks.length) prog = t.tasks.map(function () { return false; });
    prog[idx] = !prog[idx];
    player.hospital.progress[id] = prog;
    if (prog.every(function (v) { return v; })) {
        delete player.hospital.progress[id];
        hospitalApplyHeal(t, 'trt');
    } else {
        saveGame();
    }
    renderHospital();
}

function renderHospitalStatus() {
    var el = document.getElementById('hospital-status');
    if (!el) return;
    var hp = Math.max(0, Math.round(player.hp)), max = player.maxHp;
    var pct = Math.max(0, Math.min(100, (hp / max) * 100));
    var state = pct >= 70 ? ['Estable', 'ok'] : (pct >= 35 ? ['Delicado', 'warn'] : ['Crítico', 'crit']);
    var note;
    if (player.gameOver) note = 'Estás en Game Over. El hospital no puede atenderte hasta que reinicies tu partida.';
    else if (hp >= max) note = 'Alta médica: tu HP está al máximo. No necesitás medicinas ni tratamientos por ahora.';
    else note = 'Te faltan ' + (max - hp) + ' HP. Las medicinas curan poco y los tratamientos mucho; los mejores se desbloquean al subir de nivel.';
    el.innerHTML =
        '<div class="hosp-status">' +
        '<div class="hosp-emblem"><span class="hosp-cross"></span></div>' +
        '<div class="hosp-vitals">' +
        '<div class="hosp-hp-row"><span class="hosp-hp-label">HP</span><span class="hosp-hp-value">' + hp + ' / ' + max + '</span><span class="hosp-state ' + state[1] + '">' + state[0] + '</span></div>' +
        '<div class="hosp-bar ' + state[1] + '"><div class="hosp-bar-fill" style="width:' + pct.toFixed(1) + '%"></div></div>' +
        '<div class="hosp-note">' + note + '</div>' +
        '</div></div>';
}

function hospitalStateLabel(reason, item) {
    if (reason === 'gameover') return 'Game Over';
    if (reason === 'locked') return 'Requiere nivel ' + item.level;
    if (reason === 'full') return 'HP al máximo';
    if (reason === 'cooldown') return 'Disponible en ' + hospitalFmtRemaining((player.hospital.cooldowns[item.id] || 0) - Date.now());
    return '';
}

function renderHospitalMedicines() {
    var el = document.getElementById('hospital-medicines');
    if (!el) return;
    var available = 0, html = '';
    HOSPITAL_MEDICINES.forEach(function (m) {
        var reason = hospitalBlockReason(m);
        if (!reason) available++;
        var cls = 'med-card' + (reason === 'locked' ? ' locked' : (reason === 'cooldown' ? ' cooldown' : (reason ? ' blocked' : ' ready')));
        html += '<div class="' + cls + '">' +
            '<span class="med-cross"></span>' +
            '<div class="med-pill"><i></i><i></i></div>' +
            '<div class="med-body">' +
            '<div class="med-top"><span class="med-name">' + m.name + '</span><span class="hosp-heal">+' + m.heal + ' HP</span></div>' +
            '<div class="med-rx"><b>Rx</b> ' + m.task + '</div>' +
            '<div class="hosp-chips"><span>Nv. ' + m.level + '</span><span>Enfría ' + m.cooldownH + ' h</span></div>' +
            '<button class="hosp-btn" ' + (reason ? 'disabled' : '') + ' onclick="takeMedicine(\'' + m.id + '\')">' + (reason ? hospitalStateLabel(reason, m) : 'Tomar') + '</button>' +
            '</div></div>';
    });
    el.innerHTML = html;
    var c = document.getElementById('hospital-med-count');
    if (c) c.innerText = available + ' / ' + HOSPITAL_MEDICINES.length + ' disponibles';
}

function renderHospitalTreatments() {
    var el = document.getElementById('hospital-treatments');
    if (!el) return;
    var available = 0, html = '';
    HOSPITAL_TREATMENTS.forEach(function (t) {
        var reason = hospitalBlockReason(t);
        if (!reason) available++;
        var prog = player.hospital.progress[t.id];
        if (!prog || prog.length !== t.tasks.length) prog = t.tasks.map(function () { return false; });
        var done = prog.filter(function (v) { return v; }).length;
        var cls = 'trt-card' + (reason === 'locked' ? ' locked' : (reason === 'cooldown' ? ' cooldown' : (reason ? ' blocked' : ' ready')));
        var segs = '';
        t.tasks.forEach(function (_, i) { segs += '<i class="' + (prog[i] ? 'on' : '') + '"></i>'; });
        var tasks = '';
        t.tasks.forEach(function (txt, i) {
            tasks += '<label class="trt-task' + (prog[i] ? ' done' : '') + '"><input type="checkbox" ' + (prog[i] ? 'checked ' : '') + (reason ? 'disabled ' : '') +
                'onchange="toggleTreatmentTask(\'' + t.id + '\', ' + i + ')"><span>' + txt + '</span></label>';
        });
        html += '<div class="' + cls + '">' +
            '<span class="med-cross"></span>' +
            '<div class="trt-head"><span class="trt-kicker">Tratamiento</span><span class="hosp-heal">+' + t.heal + ' HP</span></div>' +
            '<h3 class="trt-name">' + t.name + '</h3>' +
            '<div class="hosp-chips"><span>Nv. ' + t.level + '</span><span>Enfría ' + (t.cooldownH >= 24 ? (t.cooldownH / 24) + (t.cooldownH === 24 ? ' día' : ' días') : t.cooldownH + ' h') + '</span></div>' +
            '<div class="trt-progress"><div class="trt-progress-info"><span>' + done + ' / ' + t.tasks.length + ' tareas</span><span>Plan de tratamiento</span></div><div class="trt-segments">' + segs + '</div></div>' +
            '<div class="trt-tasks">' + tasks + '</div>' +
            (reason ? '<div class="hosp-lock-note">' + hospitalStateLabel(reason, t) + '</div>' : '') +
            '</div>';
    });
    el.innerHTML = html;
    var c = document.getElementById('hospital-trt-count');
    if (c) c.innerText = available + ' / ' + HOSPITAL_TREATMENTS.length + ' disponibles';
}

function renderHospital() {
    if (typeof player === 'undefined') return;
    hospitalEnsure();
    renderHospitalStatus();
    renderHospitalMedicines();
    renderHospitalTreatments();
}

// Refresca los enfriamientos y el HP mientras la pestaña está abierta
setInterval(function () {
    var tab = document.getElementById('tab-hospital');
    if (tab && tab.classList.contains('active')) renderHospital();
}, 30000);
