// ============================================================
// ===== LIBRETA DE CONTACTOS =====
// Gente con la que querés mantener el contacto. Cada una tiene una frecuencia
// deseada; la libreta te dice a quién le toca y te da un poco de EXP cuando
// tocás su ficha cuando hablás con esa persona (solo suma EXP si ya tocaba, así no se abusa).
// No hay daño: la libreta no castiga, solo avisa.
// ============================================================

var CONTACT_TAGS = {
    amistad:  { label: 'Amistad',  attr: 'social' },
    familia:  { label: 'Familia',  attr: 'relaciones' },
    ligue:    { label: 'Ligue',    attr: 'relaciones' },
    pareja:   { label: 'Pareja',   attr: 'relaciones' },
    trabajo:  { label: 'Trabajo',  attr: 'carrera' },
    otro:     { label: 'Otro',     attr: 'social' }
};

var CONTACT_FREQS = [
    { days: 1,  label: 'Diaria',         exp: 3 },
    { days: 3,  label: 'Cada 3 días',    exp: 6 },
    { days: 7,  label: 'Cada semana',    exp: 10 },
    { days: 30, label: 'Cada mes',       exp: 15 }
];

// EXP según la frecuencia (cuanto más seguido, menos vale cada contacto) y tope diario entre todos los contactos
var CONTACT_EXP_DAILY_CAP = 30;

var contactEditingId = null;

function contactsEnsure() {
    if (!player.contacts) player.contacts = [];
    return player.contacts;
}

function contactFreqLabel(days) {
    var f = CONTACT_FREQS.filter(function (x) { return x.days === days; })[0];
    return f ? f.label : 'Cada ' + days + ' días';
}

function contactExpFor(days) {
    var f = CONTACT_FREQS.filter(function (x) { return x.days === days; })[0];
    return f ? f.exp : 10;
}

function contactElapsed(c) {
    var ref = c.lastContact || c.createdAt || localDateStr();
    return Math.max(0, daysBetweenStr(ref, localDateStr()));
}

// 'ok' (al día) | 'due' (por contactar) | 'late' (atrasado)
function contactStatus(c) {
    var e = contactElapsed(c), f = c.everyDays || 30;
    if (e >= f * 1.5) return 'late';
    if (e >= f) return 'due';
    return 'ok';
}

function contactDaysText(n) {
    if (n === 0) return 'hoy';
    if (n === 1) return 'ayer';
    return 'hace ' + n + ' días';
}

// Contactos a los que ya les toca (para los recordatorios)
function getOverdueContacts() {
    if (typeof player === 'undefined') return [];
    return contactsEnsure().filter(function (c) { return contactStatus(c) !== 'ok'; });
}

function contactsSorted() {
    var order = { late: 0, due: 1, ok: 2 };
    return contactsEnsure().slice().sort(function (a, b) {
        var sa = contactStatus(a), sb = contactStatus(b);
        if (sa !== sb) return order[sa] - order[sb];
        return (contactElapsed(b) / (b.everyDays || 30)) - (contactElapsed(a) / (a.everyDays || 30));
    });
}

function renderContacts() {
    if (typeof player === 'undefined') return;
    var el = document.getElementById('contacts-list');
    if (!el) return;
    var list = contactsSorted();
    var due = list.filter(function (c) { return contactStatus(c) !== 'ok'; }).length;
    var counter = document.getElementById('contacts-count');
    if (counter) counter.innerText = list.length ? (due + ' por contactar · ' + list.length + ' en total') : '';

    if (!list.length) {
        el.innerHTML = '<div class="event-empty">Tu libreta está vacía. Agregá a alguien con quien quieras mantener el contacto.</div>';
        return;
    }

    var statusLabel = { ok: 'Al día', due: 'Por contactar', late: 'Atrasado' };
    var today = localDateStr();
    var html = '';
    list.forEach(function (c) {
        var st = contactStatus(c), e = contactElapsed(c), f = c.everyDays || 30;
        var pct = Math.min(100, Math.round((e / f) * 100));
        var tag = CONTACT_TAGS[c.tag] || CONTACT_TAGS.otro;
        var lit = c.lastContact === today;
        var last = c.lastContact ? 'Último contacto: ' + contactDaysText(e) : 'Sin contacto registrado';
        html += '<div class="contact-card ' + st + (lit ? ' lit' : '') + '" onclick="markContact(\'' + c.id + '\')">' +
            '<div class="contact-avatar">👤</div>' +
            '<div class="contact-body">' +
            '<div class="contact-top"><span class="contact-name">' + escapeHtml(c.name) + '</span>' + (lit ? '<span class="contact-done">Hoy</span>' : '') + '</div>' +
            '<div class="contact-stats">' +
            '<span class="contact-chip">' + tag.label + '</span>' +
            '<span class="contact-chip">' + contactFreqLabel(f) + '</span>' +
            (lit ? '' : '<span class="contact-chip contact-status ' + st + '">' + statusLabel[st] + '</span>') +
            '<span class="contact-tools">' +
            '<button class="contact-tool" title="Editar" aria-label="Editar" onclick="event.stopPropagation(); editContact(\'' + c.id + '\')">✏️</button>' +
            '<button class="contact-tool" title="Eliminar" aria-label="Eliminar" onclick="event.stopPropagation(); deleteContact(\'' + c.id + '\')">🗑️</button>' +
            '</span></div>' +
            '<div class="contact-last">' + last + (c.note ? ' · ' + escapeHtml(c.note) : '') + '</div>' +
            '<div class="contact-bar"><div class="contact-bar-fill" style="width:' + pct + '%"></div></div>' +
            '</div></div>';
    });
    el.innerHTML = html;
}

function contactFormFill(c) {
    document.getElementById('contact-name').value = c ? c.name : '';
    document.getElementById('contact-tag').value = c ? c.tag : 'amistad';
    var freqSel = document.getElementById('contact-freq');
    var want = c ? String(c.everyDays) : '7';
    var has = false;
    for (var i = 0; i < freqSel.options.length; i++) { if (freqSel.options[i].value === want) has = true; }
    if (!has) { var o = document.createElement('option'); o.value = want; o.text = contactFreqLabel(parseInt(want, 10)); freqSel.add(o); }
    freqSel.value = want;
    document.getElementById('contact-last').value = c && c.lastContact ? c.lastContact : '';
    document.getElementById('contact-note').value = c ? (c.note || '') : '';
    var btn = document.getElementById('contact-save-btn');
    var cancel = document.getElementById('contact-cancel-btn');
    var title = document.getElementById('contact-form-title');
    if (btn) btn.innerText = c ? 'Guardar cambios' : 'Agregar a la libreta';
    if (cancel) cancel.style.display = c ? '' : 'none';
    if (title) title.innerText = c ? 'Editar Contacto' : 'Agregar Contacto';
}

function saveContact() {
    var name = (document.getElementById('contact-name').value || '').trim();
    if (!name) { showToast('Poné un nombre para el contacto.', 'warning', 'Libreta'); return; }
    var tag = document.getElementById('contact-tag').value;
    var every = parseInt(document.getElementById('contact-freq').value, 10) || 7;
    var last = document.getElementById('contact-last').value || null;
    var note = (document.getElementById('contact-note').value || '').trim();
    if (last && last > localDateStr()) last = localDateStr();
    var list = contactsEnsure();

    if (contactEditingId) {
        var c = list.filter(function (x) { return x.id === contactEditingId; })[0];
        if (c) { c.name = name; c.tag = tag; c.everyDays = every; c.lastContact = last; c.note = note; }
        showToast('Contacto actualizado.', 'success', 'Libreta');
    } else {
        list.push({
            id: 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36),
            name: name, tag: tag, everyDays: every, lastContact: last, note: note,
            createdAt: localDateStr(), lastRewardDate: null, count: 0
        });
        showToast(name + ' se agregó a la libreta.', 'success', 'Libreta');
    }
    contactEditingId = null;
    contactFormFill(null);
    saveGame();
    renderContacts();
    if (typeof checkStoryUnlocks === 'function') setTimeout(checkStoryUnlocks, 200);
}

function editContact(id) {
    var c = contactsEnsure().filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    contactEditingId = id;
    contactFormFill(c);
    var form = document.getElementById('contact-form-box');
    if (form && form.scrollIntoView) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelContactEdit() {
    contactEditingId = null;
    contactFormFill(null);
}

function deleteContact(id) {
    var c = contactsEnsure().filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    showModal('', 'Eliminar contacto', '¿Sacar a "' + c.name + '" de la libreta?', 'Eliminar', function () {
        player.contacts = contactsEnsure().filter(function (x) { return x.id !== id; });
        if (contactEditingId === id) cancelContactEdit();
        saveGame();
        renderContacts();
    }, true);
}

function markContact(id) {
    var c = contactsEnsure().filter(function (x) { return x.id === id; })[0];
    if (!c || player.gameOver) return;
    var today = localDateStr();
    if (c.lastContact === today) { showToast('Ya registraste contacto con ' + c.name + ' hoy. Si te equivocaste, corregí la fecha con Editar.', 'info', 'Libreta'); return; }

    var wasDue = contactStatus(c) !== 'ok';
    c.lastContact = today;
    c.count = (c.count || 0) + 1;

    var reward = 0;
    if (wasDue && c.lastRewardDate !== today) {
        if (!player.contactExp || player.contactExp.date !== today) player.contactExp = { date: today, total: 0 };
        reward = Math.min(contactExpFor(c.everyDays || 30), Math.max(0, CONTACT_EXP_DAILY_CAP - player.contactExp.total));
    }
    if (reward > 0) {
        c.lastRewardDate = today;
        player.contactExp.total += reward;
        var attr = (CONTACT_TAGS[c.tag] || CONTACT_TAGS.otro).attr;
        gainRewards(reward, 0, attr, 'contact', 'Contacto con "' + c.name + '"', 'Libreta de contactos');
        showToast('Hablaste con ' + c.name + '. +' + reward + ' EXP', 'success', 'Libreta');
    } else if (wasDue) {
        showToast('Contacto con ' + c.name + ' registrado. Ya llegaste al tope de EXP de contactos de hoy.', 'info', 'Libreta');
    } else {
        showToast('Contacto con ' + c.name + ' registrado. Todavía no tocaba, así que no suma EXP.', 'info', 'Libreta');
    }
    saveGame();
    renderContacts();
    if (typeof checkStoryUnlocks === 'function') setTimeout(checkStoryUnlocks, 200);
}
