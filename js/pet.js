                            // ===== FUNCIONES DE MASCOTA =====
                            // ============================================================

                            function updatePet() {
                                var petEmoji = document.getElementById('pet-emoji');
                                var petLevel = document.getElementById('pet-level');
                                var petContainer = document.getElementById('pet-container');

                                if (!petEmoji || !petLevel || !petContainer) return;

                                var mascota = player.equipment.mascota;

                                if (mascota) {
                                    var icon = mascota.icon || '🐾';
                                    petEmoji.innerHTML = renderIconHTML(icon, '🐾');
                                    var level = player.level;
                                    petLevel.textContent = 'Nv. ' + level;

                                    var healthPercent = Math.round((player.petHealth / player.petMaxHealth) * 100);
                                    if (healthPercent < 30) {
                                        petLevel.textContent += ' ❤️' + healthPercent + '%';
                                        petContainer.style.borderColor = 'var(--danger)';
                                    } else {
                                        petContainer.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                                    }

                                    var scale = 1 + (level / 50);
                                    petContainer.style.transform = 'scale(' + Math.min(scale, 1.6) + ')';

                                    if (player.petHealth < player.petMaxHealth * 0.3) {
                                        showPetBubble('💔 ¡Mi salud está muy baja!');
                                    }

                                } else {
                                    petEmoji.textContent = '🐾';
                                    petLevel.textContent = 'Nv. 1';
                                    petContainer.style.transform = 'scale(1)';
                                    petContainer.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                                    showPetBubble('¡Consigue una mascota en la tienda!');
                                }
                            }

                            function showPetBubble(text) {
                                var bubble = document.getElementById('pet-bubble');
                                if (!bubble) return;

                                bubble.textContent = text;
                                bubble.classList.add('show');

                                if (petBubbleTimeout) clearTimeout(petBubbleTimeout);
                                petBubbleTimeout = setTimeout(function () {
                                    bubble.classList.remove('show');
                                }, 4000);
                            }

                            function petClick() {
                                if (player.gameOver) {
                                    showPetBubble('💀 El héroe ha caído...');
                                    return;
                                }

                                if (!player.equipment.mascota) {
                                    showPetBubble('🐾 ¡Consigue una mascota en la tienda!');
                                    return;
                                }

                                if (player.petHealth < player.petMaxHealth * 0.3) {
                                    showPetBubble('💔 ¡Necesito un descanso!');
                                    return;
                                }

                                var messages = [
                                    '🐾 ¡Me alegra verte!',
                                    '🐾 ¿Listo para la batalla?',
                                    '🐾 ¡Eres mi héroe!',
                                    '🐾 ¡Vamos a por todas!',
                                    '🐾 ¡Eres increíble!',
                                    '🐾 ¡Nunca te rindas!',
                                    '🐾 ¡Tú puedes con todo!',
                                    '🐾 ¡Eres un verdadero héroe!',
                                    '🐾 ¡Guau! ¡Buen trabajo!'
                                ];

                                petClickCount++;
                                if (petClickCount % 5 === 0) {
                                    var bonusExp = 2 + Math.floor(player.level / 3);
                                    gainRewards(bonusExp, 0, null, 'inventory', '🐾 Mascota te ha dado ánimos', '+' + bonusExp + ' EXP');
                                    showPetBubble('🌟 ¡+' + bonusExp + ' EXP por tu energía!');
                                } else {
                                    var randomMsg = messages[Math.floor(Math.random() * messages.length)];
                                    showPetBubble(randomMsg);
                                }

                                var petContainer = document.getElementById('pet-container');
                                petContainer.style.animation = 'none';
                                setTimeout(function () {
                                    petContainer.style.animation = 'pet-float 3s ease-in-out infinite';
                                    petContainer.style.transform = 'scale(1.2)';
                                    setTimeout(function () {
                                        petContainer.style.transform = 'scale(1)';
                                    }, 300);
                                }, 50);
                            }

                            // ============================================================
