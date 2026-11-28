// ============================================================
// ===== MISIONES DE LOS DLC =====
// Principales: una por cada DLC activo, en orden (cadena).
// Secundarias: 3 en total, al azar; el re-roll solo toca estas.
// ============================================================

function rerollMissions() {
    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }
    var pool = secondaryPool();
    if (pool.length === 0) {
        showToast('No hay misiones secundarias disponibles.', 'warning', 'Misiones');
        return;
    }
    // Sortea de nuevo evitando repetir las que ya se veían (si alcanzan las demás)
    var others = pool.filter(function (m) { return activeSecondaryIds.indexOf(m.id) === -1; });
    var source = others.length >= Math.min(MAX_SECONDARY_MISSIONS, pool.length) ? others : pool;
    activeSecondaryIds = shuffled(source).slice(0, MAX_SECONDARY_MISSIONS).map(function (m) { return m.id; });

    saveGame();
    renderMissions();
    showToast('Secundarias renovadas.', 'info', 'Renovar');
}

function handleMissionCardClick(event, id) {
    if (player.gameOver) {
        completeMission(id);
        return;
    }

    var mission = player.rawMissions.find(function (m) { return m.id === id; });
    if (!mission || mission.completed) {
        completeMission(id);
        return;
    }

    var card = event.currentTarget.closest('.mission-card');
    var mult = getDifficultyMultipliers();
    var expBoost = player.expBoost || 0;
    var totalExp = Math.floor((mission.expReward + expBoost) * mult.exp);
    var color = mission.type === 'main' ? 'var(--dusk)' : 'var(--verdigris)';

    if (card && typeof triggerFxBurst === 'function') {
        triggerFxBurst(card, '+' + totalExp + ' EXP', color);
        setTimeout(function () { completeMission(id); }, 400);
    } else {
        completeMission(id);
    }
}

function completeMission(id) {
    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }

    var mission = player.rawMissions.find(function (m) { return m.id === id; });
    if (!mission || mission.completed) return;
    var dlc = getDlcByName(mission.dlcName);
    // Solo se pueden cumplir las que se ven (DLC activo; la principal de turno)
    if (!isDlcLive(dlc)) return;
    if (mission.type === 'main') {
        var current = currentMainMission(dlc);
        if (!current || current.id !== mission.id) return;
    }

    mission.completed = true;
    mission.completedAt = Date.now();

    var expBoost = player.expBoost || 0;
    var goldBoost = player.goldBoost || 0;
    gainRewards(mission.expReward + expBoost, (mission.goldReward || 0) + goldBoost, mission.attr, 'mission',
        (mission.type === 'main' ? 'Misión principal "' : 'Misión secundaria "') + mission.title + '"', 'DLC: ' + mission.dlcName);

    if (mission.type === 'secondary') {
        activeSecondaryIds = activeSecondaryIds.filter(function (mid) { return mid !== id; });
    }

    // Primero la historia (abre capítulos), después el cierre del DLC y los trofeos
    if (typeof checkStoryUnlocks === 'function') checkStoryUnlocks(true);
    checkDlcClosure(mission.dlcName);
    refreshSecondaries();
    if (typeof checkStoryUnlocks === 'function') checkStoryUnlocks(true);

    saveGame();
    renderMissions();
    updateHUD();
    checkAndUnlockTrophies();

    showToast('Misión "' + mission.title + '" completada!', 'success', 'Misión');
}

function missionCardHTML(m, extraHead) {
    var expBoost = player.expBoost || 0;
    var mult = getDifficultyMultipliers();
    return `
        <div class="mission-card-content">
            <div class="mission-card-head">
                <span class="mission-dlc-name">${escapeHtml(m.dlcName)}${extraHead || ''}</span>
                <span class="mission-attr-display">${(attrNames[m.attr] || m.attr).replace(/^([^\p{L}\s]+)\s+(.+)$/u, '<span class="ui-emoji">$1</span> $2')}</span>
            </div>
            <div class="mission-title">${escapeHtml(m.title)}</div>
            <div class="mission-card-spacer"></div>
            <div class="mission-footer">
                <span class="reward-chip">Recompensa: +${Math.floor((m.expReward + expBoost) * mult.exp)} EXP ${expBoost > 0 ? '(bono +' + expBoost + ')' : ''}</span>
                <button class="mission-complete-btn" onclick="handleMissionCardClick(event, '${m.id}')" ${player.gameOver ? 'disabled' : ''}>Completar</button>
            </div>
        </div>`;
}

function renderMissions() {
    var mainBox = document.getElementById('main-mission-container');
    var secBox = document.getElementById('secondary-mission-container');
    if (!mainBox || !secBox) return;

    refreshSecondaries();

    // ----- Principales: una por DLC activo -----
    mainBox.innerHTML = '';
    var live = (player.dlcs || []).filter(isDlcLive);
    var shown = 0;
    live.forEach(function (dlc) {
        var m = currentMainMission(dlc);
        if (!m) return;
        shown++;
        var mains = dlcMissions(dlc).filter(function (x) { return x.type === 'main'; });
        var done = mains.filter(function (x) { return x.completed; }).length;
        var card = document.createElement('div');
        card.className = 'mission-card main';
        card.innerHTML = missionCardHTML(m, ' <span class="mission-progress">· ' + (done + 1) + '/' + mains.length + '</span>');
        mainBox.appendChild(card);
    });
    if (shown === 0) {
        var anyDlc = (player.dlcs || []).length > 0;
        mainBox.innerHTML = '<div class="event-empty" style="grid-column: 1 / -1;">' +
            (anyDlc ? 'No hay DLC activos. Activa uno desde la pestaña Historia.' : 'Instala un DLC desde Configuración para obtener misiones.') + '</div>';
    }

    // ----- Secundarias: 3 en total -----
    secBox.innerHTML = '';
    var secs = activeSecondaryIds.map(function (id) { return player.rawMissions.find(function (m) { return m.id === id; }); }).filter(Boolean);
    secs.forEach(function (m) {
        var card = document.createElement('div');
        card.className = 'mission-card secondary';
        card.innerHTML = missionCardHTML(m, '');
        secBox.appendChild(card);
    });
    if (secs.length === 0) {
        secBox.innerHTML = '<div class="event-empty" style="grid-column: 1 / -1;">No hay misiones secundarias por ahora.</div>';
    }
}
