// ===== FUNCIONES DE RUNAS =====

function calculateRuneLevelAndProgress(totalExp) {
    var level = 1;
    var currentLevelBase = 0;
    var nextLevelTarget = 100;

    if (totalExp >= 1000) {
        level = 5 + Math.floor((totalExp - 1000) / 600);
        currentLevelBase = 1000 + (level - 5) * 600;
        nextLevelTarget = currentLevelBase + 600;
    } else if (totalExp >= 500) {
        level = 4;
        currentLevelBase = 500;
        nextLevelTarget = 1000;
    } else if (totalExp >= 250) {
        level = 3;
        currentLevelBase = 250;
        nextLevelTarget = 500;
    } else if (totalExp >= 100) {
        level = 2;
        currentLevelBase = 100;
        nextLevelTarget = 250;
    } else {
        level = 1;
        currentLevelBase = 0;
        nextLevelTarget = 100;
    }

    return {
        level: level,
        currentExpInLevel: totalExp - currentLevelBase,
        expNeededForLevel: nextLevelTarget - currentLevelBase,
        totalExp: totalExp
    };
}

function completeRune(id) {
    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }

    var rune = player.rawRunes.find(function (r) { return r.id === id; });
    if (!rune) {
        showToast('Error: No se encontró la runa.', 'error', 'Error');
        return;
    }

    if (rune.completed) {
        showToast('Esta runa ya fue canalizada hoy. ¡Vuelve mañana!', 'warning', 'Runa');
        return;
    }

    rune.completed = true;
    rune.streak = (rune.streak || 0) + 1;

    var bonus = player.runeBonus || 0;
    var totalExpReward = rune.expReward + bonus;

    rune.totalExp = (rune.totalExp || 0) + totalExpReward;

    gainRewards(totalExpReward, rune.goldReward, rune.attr, 'rune', '💠 Runa "' + rune.title + '"', 'Racha: ' + rune.streak + ' días');

    saveGame();
    renderRunes();
    checkAndUnlockTrophies();

    showToast('✨ Runa "' + rune.title + '" canalizada con éxito! +' + totalExpReward + ' EXP, +' + rune.goldReward + ' ORO', 'success', 'Runa');
}

// ===== ANIMACIÓN DE CANALIZACIÓN (desactivada) =====
// Se deja la función como no-op para no romper a quienes la llaman.
function triggerRuneChannelAnimation(cardElement, expAmount) {
    return;
}

function handleRuneClick(event, runeId) {
    if (player.gameOver) {
        completeRune(runeId);
        return;
    }
    
    var rune = player.rawRunes.find(function(r) { return r.id === runeId; });
    if (!rune || rune.completed) return;
    
    var card = event.currentTarget;
    
    // Calcular EXP antes de canalizar (para la animación)
    var bonus = player.runeBonus || 0;
    var mult = getDifficultyMultipliers();
    var expReward = Math.floor((rune.expReward + bonus) * mult.exp);
    
    // Disparar animación
    triggerRuneChannelAnimation(card, expReward);
    
    // Esperar un poco antes de ejecutar la lógica
    setTimeout(function() {
        completeRune(runeId);
    }, 400);
}

function checkAndResetRunes() {
    if (player.gameOver) return;
    if (!player.rawRunes || player.rawRunes.length === 0) return;

    var today = new Date();
    var todayStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    var lastReset = player.lastRuneReset;

    if (lastReset !== todayStr) {
        var lostRunes = [];
        var keptRunes = [];

        player.rawRunes.forEach(function (r) {
            if (r.completed === undefined) r.completed = false;
            if (r.streak === undefined) r.streak = 0;

            if (r.completed) {
                r.completed = false;
                keptRunes.push(r.title);
            } else if (r.streak > 0) {
                var oldStreak = r.streak;
                r.streak = 0;
                lostRunes.push({ name: r.title, streak: oldStreak });
            }
        });

        player.lastRuneReset = todayStr;

        if (lostRunes.length > 0) {
            var damageAmount = lostRunes.length * 3;
            applyDamage(damageAmount, 'Pérdida automática de rachas de runas', lostRunes.length * 2);

            var msg = '📅 Nuevo día: ' + todayStr + '\n\n';
            msg += '💔 ' + lostRunes.length + ' runa(s) perdieron su racha:\n';
            lostRunes.forEach(function (r) {
                msg += '• ' + r.name + ' (perdió ' + r.streak + ' días)\n';
            });
            msg += '\n💔 Daño recibido: ' + damageAmount + ' HP';

            showToast(msg, 'warning', 'Runas - Nuevo Día');
            addLogEntry('damage', '📅 Pérdida automática de rachas de runas', lostRunes.map(function (r) { return r.name + ' (' + r.streak + 'd)'; }).join(', '), 0, 0, null);
        } else {
            showToast('📅 ¡Nuevo día! Runas recargadas. ¡A canalizar!', 'success', 'Runas');
        }

        saveGame();
        renderRunes();
        updateHUD();
    }
}

function resetDailyRunes() {
    if (player.gameOver) {
        showToast('Estás en Game Over. Debes reiniciar tu partida.', 'error', 'Error');
        return;
    }

    var today = new Date();
    var todayStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    var lastReset = player.lastRuneReset;

    if (lastReset === todayStr) {
        showToast('Ya se reseteó automáticamente hoy. ¡A canalizar runas!', 'info', 'Runas');
        return;
    }

    showModal(
        '🔄',
        'Reiniciar Runas Manualmente',
        '¿Estás seguro de reiniciar las runas manualmente?\n\n' +
        '📌 Las runas que NO completaste hoy perderán su racha.\n' +
        '📌 Las runas que YA completaste hoy mantendrán su racha.\n' +
        '📌 Esto aplica daño por las rachas perdidas.\n\n' +
        '💡 Normalmente esto ocurre automáticamente cada día.',
        'Reiniciar',
        function () {
            executeManualResetRunes(todayStr);
        },
        true
    );
}

function executeManualResetRunes(todayStr) {
    var lostRunes = [];
    var keptRunes = [];

    player.rawRunes.forEach(function (r) {
        if (r.completed === undefined) r.completed = false;
        if (r.streak === undefined) r.streak = 0;

        if (r.completed) {
            r.completed = false;
            keptRunes.push(r.title);
        } else if (r.streak > 0) {
            var oldStreak = r.streak;
            r.streak = 0;
            lostRunes.push({ name: r.title, streak: oldStreak });
        }
    });

    player.lastRuneReset = todayStr;

    if (lostRunes.length > 0) {
        var damageAmount = lostRunes.length * 3;
        applyDamage(damageAmount, 'Pérdida manual de rachas de runas', lostRunes.length * 2);

        var msg = '💔 ' + lostRunes.length + ' runa(s) perdieron su racha:\n';
        lostRunes.forEach(function (r) {
            msg += '• ' + r.name + ' (perdió ' + r.streak + ' días)\n';
        });
        msg += '\n💔 Daño recibido: ' + damageAmount + ' HP';

        showToast(msg, 'warning', 'Runas Reiniciadas');
        addLogEntry('damage', '🔄 Pérdida manual de rachas de runas', lostRunes.map(function (r) { return r.name + ' (' + r.streak + 'd)'; }).join(', '), 0, 0, null);
    } else {
        showToast('☀️ ¡Runas recargadas! Todas las rachas se mantuvieron. ¡A canalizar!', 'success', 'Runas');
    }

    saveGame();
    renderRunes();
    updateHUD();
}

function renderRunes() {
    var container = document.getElementById('rune-container');
    if (!container) return;

    if (!player.rawRunes || player.rawRunes.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px 0; color: var(--text-muted); font-family:'Georgia',serif;">
                No hay runas instaladas.
            </div>
        `;
        return;
    }

    player.rawRunes.forEach(function (r) {
        if (r.completed === undefined) r.completed = false;
        if (r.streak === undefined) r.streak = 0;
        if (r.totalExp === undefined) r.totalExp = 0;
    });

    var html = '';

    player.rawRunes.forEach(function (runa) {
        var prog = calculateRuneLevelAndProgress(runa.totalExp || 0);
        var percent = Math.min(100, (prog.currentExpInLevel / prog.expNeededForLevel) * 100);
        var icon = runa.icon || "💠";

        var isCompleted = runa.completed === true;

        html += `
            <div class="rune-card ${isCompleted ? 'completed' : ''}" 
                 onclick="${isCompleted ? '' : `handleRuneClick(event, '${runa.id}')`}"
                 style="${isCompleted ? 'cursor:default;' : ''}">
                <div class="rune-icon">${renderIconHTML(icon, '💠')}</div>
                <span class="rune-title">${runa.title}</span>
                <div class="rune-stats">
                    <span class="rune-badge level">✦ Nv.${prog.level}</span>
                    <span class="rune-badge streak">🔥 ${runa.streak || 0}d</span>
                </div>
                <div class="rune-progress">
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${percent}%;"></div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}