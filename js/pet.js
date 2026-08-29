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
                                        var personality = mascota.species && PET_PERSONALITIES[mascota.species];
                                        showPetBubble(personality ? personality.lowHealthMsg : '💔 ¡Mi salud está muy baja!');
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
                                    var lowPersonality = player.equipment.mascota.species && PET_PERSONALITIES[player.equipment.mascota.species];
                                    showPetBubble(lowPersonality ? lowPersonality.lowHealthMsg : '💔 ¡Necesito un descanso!');
                                    return;
                                }

                                var species = player.equipment.mascota.species;
                                var personality = species && PET_PERSONALITIES[species];
                                var messages = personality ? personality.messages : ['🐾 ¡Me alegra verte!', '🐾 ¡Vamos a por todas!'];
                                var animationName = personality ? personality.animation : 'pet-anim-bounce';

                                var randomMsg = messages[Math.floor(Math.random() * messages.length)];
                                showPetBubble(randomMsg);

                                var petContainer = document.getElementById('pet-container');
                                petContainer.style.animation = 'none';
                                setTimeout(function () {
                                    petContainer.style.animation = 'pet-float 3s ease-in-out infinite';
                                    petContainer.classList.remove('pet-anim-bounce', 'pet-anim-wiggle', 'pet-anim-pulse', 'pet-anim-glow');
                                    void petContainer.offsetWidth;
                                    petContainer.classList.add(animationName);
                                    setTimeout(function () {
                                        petContainer.classList.remove(animationName);
                                    }, 600);
                                }, 50);
                            }

                            // ============================================================
