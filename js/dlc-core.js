// ============================================================
// ===== NÚCLEO DE LOS DLC (formato versión 2) =====
// Un DLC es un único JSON autocontenido: misiones + historia + finales +
// trofeos. Todo se desbloquea SOLO con misiones de ese mismo DLC.
//
//  - Principales: una cadena en orden. Se muestra 1 por cada DLC activo.
//  - Secundarias: 3 en total (de todos los DLC activos), al azar y opcionales.
//  - Al cumplir la última principal el DLC se cierra.
//  - Las condiciones se escriben como datos (ver evalDlcCond).
//
// Todo el estado de un DLC (capítulos abiertos, decisiones, banderas, final)
// vive dentro de su entrada en player.dlcs: borrar el DLC borra su progreso.
// ============================================================

const DLC_FORMAT = 2;
const DLC_TIER_ICONS = { bronze: '🥉', silver: '🥈', gold: '🥇' };
const DLC_TIER_LABELS = { bronze: 'Bronce', silver: 'Plata', gold: 'Oro' };

// ---------- Utilidades ----------
function dlcSlug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'dlc'; }
function getDlcByName(name) { return (player.dlcs || []).find(function (d) { return d.name === name; }) || null; }
function isDlcLive(d) { return !!d && d.active !== false && !d.closed; }
function dlcMissions(dlc) { return (player.rawMissions || []).filter(function (m) { return m.dlcName === dlc.name; }); }
function dlcTrophyId(dlc, tid) { return 'dlc_' + dlcSlug(dlc.file) + '_' + tid; }

// ============================================================
// ===== CONDICIONES (se evalúan siempre dentro de un DLC) =====
// ============================================================
//  { "mission": "m12" }                          misión cumplida
//  { "missions": { "count": 3, "type": "main", "attr": "fuerza" } }
//        cantidad cumplida (type y attr opcionales); "all": true = todas las que coinciden
//  { "chapter": "c05" }                          capítulo abierto
//  { "chapters": { "special": true, "count": 2 } }   capítulos especiales abiertos (o "all": true)
//  { "flag": "confie_lola" }                     marca activada por una decisión
//  { "choice": { "c01": "a" } }                  decisión concreta tomada
//  { "ending": "f1" }                            final obtenido
//  { "closed": true }                            DLC cerrado (historia terminada)
//  { "all": [..] }  { "any": [..] }  { "not": {..} }

function evalDlcCond(dlc, c) {
    if (c === undefined || c === null) return true;
    if (typeof c !== 'object') return false;

    if (c.all) return c.all.every(function (x) { return evalDlcCond(dlc, x); });
    if (c.any) return c.any.some(function (x) { return evalDlcCond(dlc, x); });
    if (c.not) return !evalDlcCond(dlc, c.not);

    if (c.mission !== undefined) {
        var m = dlcMissions(dlc).find(function (x) { return x.key === c.mission; });
        return !!(m && m.completed);
    }
    if (c.missions) {
        var spec = c.missions;
        var ms = dlcMissions(dlc).filter(function (x) {
            return (!spec.type || x.type === spec.type) && (!spec.attr || x.attr === spec.attr);
        });
        var done = ms.filter(function (x) { return x.completed; }).length;
        if (spec.all) return ms.length > 0 && done === ms.length;
        return done >= (spec.count || 1);
    }
    if (c.chapter !== undefined) return (dlc.opened || []).indexOf(c.chapter) !== -1;
    if (c.chapters) {
        var sp = dlc.chapters.filter(function (x) { return !!x.special === !!c.chapters.special; });
        var opened = sp.filter(function (x) { return dlc.opened.indexOf(x.id) !== -1; }).length;
        if (c.chapters.all) return sp.length > 0 && opened === sp.length;
        return opened >= (c.chapters.count || 1);
    }
    if (c.flag !== undefined) return !!(dlc.flags && dlc.flags[c.flag]);
    if (c.choice) return Object.keys(c.choice).every(function (k) { return dlc.choices && dlc.choices[k] === c.choice[k]; });
    if (c.ending !== undefined) return dlc.endingId === c.ending;
    if (c.closed !== undefined) return !!dlc.closed === !!c.closed;
    return false;
}

// Recorre una condición y devuelve todo lo que referencia (para validar el JSON)
function collectCondRefs(c, out) {
    out = out || { missions: [], chapters: [], flags: [], choices: [], endings: [], unknown: [] };
    if (c === undefined || c === null) return out;
    if (typeof c !== 'object' || Array.isArray(c)) { out.unknown.push(JSON.stringify(c)); return out; }
    var known = ['all', 'any', 'not', 'mission', 'missions', 'chapter', 'chapters', 'flag', 'choice', 'ending', 'closed'];
    Object.keys(c).forEach(function (k) { if (known.indexOf(k) === -1) out.unknown.push(k); });
    if (c.all) c.all.forEach(function (x) { collectCondRefs(x, out); });
    if (c.any) c.any.forEach(function (x) { collectCondRefs(x, out); });
    if (c.not) collectCondRefs(c.not, out);
    if (c.mission !== undefined) out.missions.push(c.mission);
    if (c.chapter !== undefined) out.chapters.push(c.chapter);
    if (c.flag !== undefined) out.flags.push(c.flag);
    if (c.choice) Object.keys(c.choice).forEach(function (k) { out.choices.push([k, c.choice[k]]); });
    if (c.ending !== undefined) out.endings.push(c.ending);
    return out;
}

// ============================================================
// ===== VALIDACIÓN E INSTALACIÓN =====
// ============================================================

// Devuelve { errors: [...], warnings: [...], dlc: entrada lista para guardar | null }
function buildDlcFromJson(data) {
    var errors = [], warnings = [];
    function err(t) { errors.push(t); }

    if (!data || typeof data !== 'object' || Array.isArray(data)) return { errors: ['El archivo no es un DLC válido.'], warnings: [], dlc: null };
    if (data.format !== DLC_FORMAT) {
        return { errors: ['Este DLC usa un formato antiguo. Falta "format": ' + DLC_FORMAT + ' (los DLC de versión 1 ya no se pueden instalar).'], warnings: [], dlc: null };
    }

    var name = (typeof data.dlcName === 'string') ? data.dlcName.trim() : '';
    if (!name) err('Falta "dlcName".');
    var file = (data.file === undefined || data.file === null) ? '' : String(data.file).trim();
    if (!file) err('Falta "file" (el número del expediente, por ejemplo "1209").');
    var storyTitle = (data.story && typeof data.story.title === 'string') ? data.story.title.trim() : '';
    if (!storyTitle) err('Falta "story.title".');

    (player.dlcs || []).forEach(function (d) {
        if (name && d.name === name) err('Ya hay un DLC instalado con el nombre "' + name + '". Elimínalo primero.');
        if (file && String(d.file) === file) err('Ya hay un DLC instalado con el número de expediente ' + file + '.');
    });

    // --- Misiones ---
    var attrKeys = Object.keys(attrNames);
    var missions = Array.isArray(data.missions) ? data.missions : null;
    if (!missions || missions.length === 0) { err('Falta "missions" (lista de misiones).'); missions = []; }
    var missionKeys = {};
    var mainCount = 0, secCount = 0;
    missions.forEach(function (m, i) {
        var ref = 'Misión #' + (i + 1);
        if (!m || typeof m !== 'object') { err(ref + ': no es un objeto.'); return; }
        if (typeof m.key !== 'string' || !m.key.trim()) err(ref + ': falta "key" (por ejemplo "m01").');
        else if (missionKeys[m.key]) err(ref + ': la clave "' + m.key + '" está repetida.');
        else missionKeys[m.key] = true;
        if (m.type !== 'main' && m.type !== 'secondary') err(ref + ': "type" debe ser "main" o "secondary".');
        else if (m.type === 'main') mainCount++; else secCount++;
        if (attrKeys.indexOf(m.attr) === -1) err(ref + ': "attr" inválido (' + m.attr + '). Usa: ' + attrKeys.join(', ') + '.');
        if (typeof m.title !== 'string' || !m.title.trim()) err(ref + ': falta "title".');
        if (typeof m.expReward !== 'number' || m.expReward < 0) err(ref + ': "expReward" debe ser un número.');
    });
    if (missions.length && mainCount === 0) err('Debe haber al menos una misión principal.');

    // --- Capítulos ---
    var chapters = Array.isArray(data.chapters) ? data.chapters : [];
    if (chapters.length === 0) err('Falta "chapters" (la historia necesita al menos un capítulo).');
    var chapterIds = {};
    var slotMap = {};
    chapters.forEach(function (c, i) {
        var ref = 'Capítulo #' + (i + 1) + (c && c.id ? ' (' + c.id + ')' : '');
        if (!c || typeof c !== 'object') { err(ref + ': no es un objeto.'); return; }
        if (typeof c.id !== 'string' || !c.id.trim()) err(ref + ': falta "id".');
        else if (chapterIds[c.id]) err(ref + ': el id "' + c.id + '" está repetido.');
        else chapterIds[c.id] = c;
        if (typeof c.title !== 'string' || !c.title.trim()) err(ref + ': falta "title".');
        if (!Array.isArray(c.text) || c.text.length === 0) err(ref + ': "text" debe ser una lista de párrafos.');
        if (c.special) {
            if (!Number.isInteger(c.afterSlot) || c.afterSlot < 1) err(ref + ': un especial necesita "afterSlot" (el número de capítulo tras el cual aparece).');
            if (c.choices && c.choices.length) warnings.push(ref + ': los capítulos especiales no tienen decisiones; se ignoran.');
        } else {
            if (!Number.isInteger(c.slot) || c.slot < 1) err(ref + ': falta "slot" (su posición en la trama: 1, 2, 3...).');
            else (slotMap[c.slot] = slotMap[c.slot] || []).push(c);
        }
        if (Array.isArray(c.choices)) {
            var choiceIds = {};
            c.choices.forEach(function (ch) {
                if (!ch || typeof ch.id !== 'string' || typeof ch.label !== 'string') err(ref + ': una opción necesita "id" y "label".');
                else if (choiceIds[ch.id]) err(ref + ': la opción "' + ch.id + '" está repetida.');
                else choiceIds[ch.id] = true;
            });
        }
    });
    // Variantes en un mismo slot: todas necesitan "onlyIf"
    Object.keys(slotMap).forEach(function (s) {
        if (slotMap[s].length > 1 && slotMap[s].some(function (c) { return !c.onlyIf; })) {
            err('Slot ' + s + ': si hay varios capítulos en la misma posición, cada uno necesita "onlyIf".');
        }
    });
    // Posiciones sin huecos
    var slotNums = Object.keys(slotMap).map(Number).sort(function (a, b) { return a - b; });
    slotNums.forEach(function (n, i) { if (n !== i + 1) err('Los "slot" deben ser consecutivos desde 1 (falta el ' + (i + 1) + ').'); });

    // "unlocksChapter" en las misiones: atajo de unlock { mission }
    missions.forEach(function (m) {
        if (m && m.unlocksChapter) {
            var c = chapterIds[m.unlocksChapter];
            if (!c) err('La misión "' + m.key + '" abre un capítulo que no existe ("' + m.unlocksChapter + '").');
            else if (!c.unlock) c.unlock = { mission: m.key };
        }
    });
    chapters.forEach(function (c) {
        if (c && c.id && !c.unlock) err('El capítulo "' + c.id + '" no tiene cómo desbloquearse (falta "unlock" o una misión con "unlocksChapter").');
    });

    // --- Finales y trofeos ---
    var endings = Array.isArray(data.endings) ? data.endings : [];
    if (endings.length === 0) err('Falta "endings" (al menos un final).');
    var endingIds = {};
    endings.forEach(function (e, i) {
        var ref = 'Final #' + (i + 1);
        if (!e || typeof e.id !== 'string') { err(ref + ': falta "id".'); return; }
        if (endingIds[e.id]) err(ref + ': el id "' + e.id + '" está repetido.'); else endingIds[e.id] = true;
        if (typeof e.title !== 'string' || !e.title.trim()) err(ref + ': falta "title".');
        if (!Array.isArray(e.text) || e.text.length === 0) err(ref + ': "text" debe ser una lista de párrafos.');
    });
    if (endings.length && !endings.some(function (e) { return e && e.default; })) err('Un final debe llevar "default": true (el que sale si no se cumple ningún otro).');

    var trophies = Array.isArray(data.trophies) ? data.trophies : [];
    var trophyIds = {};
    trophies.forEach(function (t, i) {
        var ref = 'Trofeo #' + (i + 1);
        if (!t || typeof t.id !== 'string' || !t.id.trim()) { err(ref + ': falta "id".'); return; }
        if (trophyIds[t.id]) err(ref + ': el id "' + t.id + '" está repetido.'); else trophyIds[t.id] = true;
        if (t.id === 'platino') err(ref + ': "platino" es un id reservado (el platino se otorga solo).');
        if (typeof t.name !== 'string' || !t.name.trim()) err(ref + ': falta "name".');
        if (t.tier && !DLC_TIER_ICONS[t.tier]) err(ref + ': "tier" debe ser bronze, silver o gold.');
        if (!t.if) err(ref + ': falta "if" (la condición).');
    });

    // --- Referencias dentro de todas las condiciones ---
    var allConds = [];
    chapters.forEach(function (c) {
        if (!c) return;
        if (c.unlock) allConds.push(['capítulo ' + c.id + ' (unlock)', c.unlock]);
        if (c.onlyIf) allConds.push(['capítulo ' + c.id + ' (onlyIf)', c.onlyIf]);
        (c.text || []).forEach(function (p) { if (p && typeof p === 'object' && p.if) allConds.push(['párrafo de ' + c.id, p.if]); });
        (c.choices || []).forEach(function (ch) { if (ch && ch.if) allConds.push(['opción ' + c.id + '/' + ch.id, ch.if]); });
    });
    endings.forEach(function (e) { if (e && e.if) allConds.push(['final ' + e.id, e.if]); });
    trophies.forEach(function (t) { if (t && t.if) allConds.push(['trofeo ' + t.id, t.if]); });

    var setFlags = {};
    chapters.forEach(function (c) { (c && c.choices || []).forEach(function (ch) { (ch.set || []).forEach(function (f) { setFlags[f] = true; }); }); });

    allConds.forEach(function (pair) {
        var refs = collectCondRefs(pair[1]);
        refs.unknown.forEach(function (u) { err('En ' + pair[0] + ': condición desconocida "' + u + '".'); });
        refs.missions.forEach(function (k) { if (!missionKeys[k]) err('En ' + pair[0] + ': la misión "' + k + '" no existe.'); });
        refs.chapters.forEach(function (k) { if (!chapterIds[k]) err('En ' + pair[0] + ': el capítulo "' + k + '" no existe.'); });
        refs.endings.forEach(function (k) { if (!endingIds[k]) err('En ' + pair[0] + ': el final "' + k + '" no existe.'); });
        refs.flags.forEach(function (k) { if (!setFlags[k]) warnings.push('En ' + pair[0] + ': la marca "' + k + '" nunca se activa en ninguna decisión.'); });
        refs.choices.forEach(function (pc) {
            var c = chapterIds[pc[0]];
            if (!c) err('En ' + pair[0] + ': el capítulo "' + pc[0] + '" no existe.');
            else if (!(c.choices || []).some(function (ch) { return ch.id === pc[1]; })) err('En ' + pair[0] + ': el capítulo "' + pc[0] + '" no tiene la opción "' + pc[1] + '".');
        });
    });

    if (errors.length) return { errors: errors, warnings: warnings, dlc: null };

    var dlc = {
        name: name,
        file: file,
        storyTitle: storyTitle,
        total: missions.length,
        main: mainCount,
        secondary: secCount,
        active: true,          // un DLC nuevo arranca activo
        closed: false,
        opened: [],            // capítulos abiertos
        read: [],              // capítulos leídos
        flags: {},
        choices: {},
        endingId: null,
        chapters: chapters,
        endings: endings,
        trophies: trophies,
        installedAt: Date.now()
    };
    return { errors: [], warnings: warnings, dlc: dlc, missions: missions };
}

function installDlcBuild(build) {
    var dlc = build.dlc;
    build.missions.forEach(function (m, i) {
        player.rawMissions.push({
            id: 'm_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
            dlcName: dlc.name,
            key: m.key,
            order: i,
            title: m.title,
            type: m.type,
            attr: m.attr,
            expReward: m.expReward,
            goldReward: m.goldReward || 0,
            completed: false
        });
    });
    player.dlcs.push(dlc);
    rebuildDlcTrophies();
}

// Quita un DLC y todo lo suyo (misiones, historia, decisiones y trofeos)
function removeDlcByName(name) {
    var dlc = getDlcByName(name);
    player.rawMissions = player.rawMissions.filter(function (m) { return m.dlcName !== name; });
    player.dlcs = player.dlcs.filter(function (d) { return d.name !== name; });
    if (dlc) {
        var prefix = 'dlc_' + dlcSlug(dlc.file) + '_';
        player.trophies = (player.trophies || []).filter(function (id) { return id.indexOf(prefix) !== 0; });
    }
    rebuildDlcTrophies();
}

// ============================================================
// ===== TROFEOS DE LOS DLC =====
// ============================================================

function rebuildDlcTrophies() {
    dynamicTrophyDefinitions = [];
    (player.dlcs || []).forEach(function (dlc) {
        var dlcName = dlc.name;
        var ids = [];
        (dlc.trophies || []).forEach(function (t) {
            var id = dlcTrophyId(dlc, t.id);
            ids.push(id);
            dynamicTrophyDefinitions.push({
                id: id,
                cat: 'dlc',
                catLabel: 'DLC' + (t.tier ? ' · ' + DLC_TIER_LABELS[t.tier] : ''),
                icon: t.icon || DLC_TIER_ICONS[t.tier] || '🏆',
                name: t.name,
                desc: t.desc || ('Trofeo de "' + dlcName + '"'),
                secret: !!t.secret,
                check: function (p) { var d = getDlcByName(dlcName); return !!d && evalDlcCond(d, t.if); }
            });
        });
        // Platino: todos los demás trofeos del DLC y todas sus misiones cumplidas (se otorga solo)
        var platId = dlcTrophyId(dlc, 'platino');
        dynamicTrophyDefinitions.push({
            id: platId,
            cat: 'dlc',
            catLabel: 'DLC · Platino',
            icon: '💎',
            name: 'Platino: ' + dlcName,
            desc: 'Consigue todos los trofeos de "' + dlcName + '" y cumple todas sus misiones',
            secret: false,
            check: function (p) {
                var d = getDlcByName(dlcName);
                if (!d) return false;
                var ms = dlcMissions(d);
                if (ms.length === 0 || !ms.every(function (m) { return m.completed; })) return false;
                return ids.every(function (tid) { return (p.trophies || []).indexOf(tid) !== -1; });
            }
        });
    });
}

// ============================================================
// ===== SECUNDARIAS ACTIVAS (3 en total) =====
// ============================================================

function secondaryPool() {
    var liveNames = {};
    (player.dlcs || []).forEach(function (d) { if (isDlcLive(d)) liveNames[d.name] = true; });
    return player.rawMissions.filter(function (m) { return m.type === 'secondary' && !m.completed && liveNames[m.dlcName]; });
}

function shuffled(list) { return list.slice().sort(function () { return 0.5 - Math.random(); }); }

// Mantiene las secundarias válidas y completa hasta MAX_SECONDARY_MISSIONS
function refreshSecondaries() {
    var pool = secondaryPool();
    var poolIds = pool.map(function (m) { return m.id; });
    activeSecondaryIds = activeSecondaryIds.filter(function (id) { return poolIds.indexOf(id) !== -1; });
    var free = shuffled(pool.filter(function (m) { return activeSecondaryIds.indexOf(m.id) === -1; }));
    while (activeSecondaryIds.length < MAX_SECONDARY_MISSIONS && free.length) activeSecondaryIds.push(free.shift().id);
}

function refreshMissions() { refreshSecondaries(); }

// ¿Cuál es la principal que toca en este DLC? (la primera sin cumplir, en orden)
function currentMainMission(dlc) {
    return dlcMissions(dlc)
        .filter(function (m) { return m.type === 'main' && !m.completed; })
        .sort(function (a, b) { return a.order - b.order; })[0] || null;
}

// Cierra el DLC cuando se cumple su última principal
function checkDlcClosure(dlcName) {
    var dlc = getDlcByName(dlcName);
    if (!dlc || dlc.closed) return false;
    var mains = dlcMissions(dlc).filter(function (m) { return m.type === 'main'; });
    if (mains.length === 0 || !mains.every(function (m) { return m.completed; })) return false;
    dlc.closed = true;
    refreshSecondaries();
    setTimeout(function () {
        addLogEntry('story', 'DLC "' + dlc.name + '" completado', 'Expediente ' + dlc.file, 0, 0, null);
        showToast('¡Terminaste "' + dlc.storyTitle + '"! El DLC se cierra.', 'success', 'DLC');
    }, 300);
    return true;
}
