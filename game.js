/**
 * CASE FILE #EGO-001 - INVESTIGATION GAME
 * Main JavaScript Controller
 */

// ====================================
// GAME STATE
// ====================================
const gameState = {
    investigatorName: '',
    currentScreen: 'screen-name',

    // Evidence tracking
    exhibitAExamined: false,
    exhibitBExamined: false,
    fragmentsRevealed: 0,
    timelineExamined: false,
    contradictionsExamined: false,
    contradictionSliders: new Set(),
    contradictionValues: {},

    // Phase completion
    phase1Complete: false,
    phase2Complete: false,
    phase3Complete: false,
    phase4Complete: false,

    // Interrogation
    suspectsInterrogated: new Set(),
    currentSuspect: null,
    currentQuestionIndex: 0,
    suspectOrder: ['social-media', 'high-standards', 'comparison', 'validation'],
    nextSuspectIndex: 0,

    // Assessment
    assessmentAnswers: {},

    // Audio
    audioEnabled: false
};

// ====================================
// SUSPECT DATA
// ====================================
const suspects = {
    'social-media': {
        name: 'SOCIAL MEDIA',
        image: 'images/suspect_social_media_1766694003037.png',
        questions: [
            {
                investigator: "You created an environment of constant surveillance.",
                options: [
                    "You made visibility addictive.",
                    "You turned self-worth into a number."
                ],
                responses: [
                    "I gave them what they wanted. They chose to look.",
                    "The numbers were always there. I just made them visible."
                ]
            },
            {
                investigator: "The subject couldn't stop comparing themselves to others.",
                options: [
                    "You showed them everyone else's highlight reel.",
                    "You kept them scrolling, always looking for validation."
                ],
                responses: [
                    "I showed what people chose to share. The interpretation was theirs.",
                    "They could have stopped at any time. They never did."
                ]
            }
        ]
    },
    'high-standards': {
        name: 'HIGH STANDARDS',
        image: 'images/suspect_high_standards_1766694018503.png',
        questions: [
            {
                investigator: "Nothing the subject did was ever good enough for you.",
                options: [
                    "You demanded constant improvement.",
                    "You made rest feel like failure."
                ],
                responses: [
                    "Without me, there would be no excellence. No growth.",
                    "Rest is for people who are satisfied. Satisfaction is for people who have stopped growing."
                ]
            },
            {
                investigator: "The subject's journals are filled with self-criticism.",
                options: [
                    "You installed that inner critic.",
                    "You made them believe they were never enough."
                ],
                responses: [
                    "That critic was their fuel. It pushed them forward.",
                    "[Long pause] ...The point was never to arrive. The point was to keep reaching."
                ]
            }
        ]
    },
    'comparison': {
        name: 'COMPARISON',
        image: 'images/suspect_comparison_1766694033811.png',
        questions: [
            {
                investigator: "You made sure the subject could never just be.",
                options: [
                    "You made them measure themselves constantly.",
                    "You showed them how much further others had gotten."
                ],
                responses: [
                    "Measurement is how you know where you stand. I provided clarity.",
                    "Others? I only showed what was already visible. The gap was real."
                ]
            },
            {
                investigator: "Success always felt like failure because someone always had more.",
                options: [
                    "You made winning impossible.",
                    "You moved the goalposts every time they got close."
                ],
                responses: [
                    "Winning was never the point. Improvement was.",
                    "The goalposts move for everyone. That's called progress."
                ]
            }
        ]
    },
    'validation': {
        name: 'EXTERNAL VALIDATION',
        image: 'images/suspect_validation_1766694048771.png',
        questions: [
            {
                investigator: "The subject's worth depended entirely on others.",
                options: [
                    "You made them need applause to feel real.",
                    "You outsourced their self-worth."
                ],
                responses: [
                    "Humans are social creatures. Wanting to matter to others isn't a flaw—it's the design.",
                    "Who else should determine worth if not others? The self is not objective."
                ]
            },
            {
                investigator: "Without external confirmation, the subject felt hollow.",
                options: [
                    "You created a void that only others could fill.",
                    "Do you accept any responsibility for the collapse?"
                ],
                responses: [
                    "Perhaps the void was always there. I simply... revealed it.",
                    "I gave them what they asked for. If it wasn't enough, perhaps you should ask why they needed so much."
                ]
            }
        ]
    }
};

// ====================================
// AUDIO FUNCTIONS
// ====================================
function initAudio() {
    const drone = document.getElementById('ambientDrone');
    if (drone) {
        drone.volume = 0.15;
    }
}

function toggleAudio() {
    gameState.audioEnabled = !gameState.audioEnabled;
    const drone = document.getElementById('ambientDrone');
    const audioOn = document.querySelector('.audio-on');
    const audioOff = document.querySelector('.audio-off');

    if (gameState.audioEnabled) {
        audioOn.classList.remove('hidden');
        audioOff.classList.add('hidden');
        drone.play().catch(e => console.log('Audio play failed:', e));
    } else {
        audioOn.classList.add('hidden');
        audioOff.classList.remove('hidden');
        drone.pause();
    }
}

// ====================================
// NAVIGATION
// ====================================
function navigateToScreen(targetId) {
    const currentScreen = document.getElementById(gameState.currentScreen);
    const targetScreen = document.getElementById(targetId);

    if (!targetScreen || currentScreen === targetScreen) return;

    // Fade out current
    currentScreen.classList.add('fade-out');
    currentScreen.classList.remove('active');

    setTimeout(() => {
        currentScreen.classList.remove('fade-out');
        currentScreen.style.display = 'none';

        // Fade in target
        targetScreen.style.display = 'flex';
        targetScreen.classList.add('active', 'fade-in');

        setTimeout(() => {
            targetScreen.classList.remove('fade-in');
        }, 400);

        gameState.currentScreen = targetId;
        initializeScreen(targetId);
        window.scrollTo(0, 0);
    }, 400);
}

function setInvestigatorName(name) {
    gameState.investigatorName = name;
    document.querySelectorAll('.investigator-name-display').forEach(el => {
        el.textContent = name;
    });
}

// ====================================
// SCREEN INITIALIZATION
// ====================================
function initializeScreen(screenId) {
    switch (screenId) {
        case 'screen-board':
            updateBoardPhases();
            break;
        case 'screen-suspects':
            updateSuspectsGallery();
            break;
        case 'screen-timeline':
            animateTimeline();
            break;
        case 'screen-contradictions':
            initContradictionSequence();
            break;
    }
}

// ====================================
// BOARD PHASES
// ====================================
function updateBoardPhases() {
    const phase1 = document.getElementById('phase-exhibits');
    const phase2 = document.getElementById('phase-timeline');
    const phase3 = document.getElementById('phase-interrogation');
    const phase4 = document.getElementById('phase-contradictions');
    const phaseConclusion = document.getElementById('phase-conclusion');

    // Update exhibit statuses
    updateExhibitStatus('exhibit-a', gameState.exhibitAExamined);
    updateExhibitStatus('exhibit-b', gameState.exhibitBExamined);

    // Phase 1 complete?
    if (gameState.exhibitAExamined && gameState.exhibitBExamined) {
        gameState.phase1Complete = true;
        phase1.classList.add('completed');
        phase2.classList.remove('locked');
    }

    // Update timeline status
    updateTimelineStatus();

    // Phase 2 complete?
    if (gameState.timelineExamined) {
        gameState.phase2Complete = true;
        phase2.classList.add('completed');
        phase3.classList.remove('locked');
    }

    // Update interrogation progress
    document.getElementById('interrogationStatus').textContent =
        `${gameState.suspectsInterrogated.size}/4 suspects interrogated`;

    // Phase 3 complete?
    if (gameState.suspectsInterrogated.size === 4) {
        gameState.phase3Complete = true;
        phase3.classList.add('completed');
        phase4.classList.remove('locked');
    }

    // Phase 4 complete?
    if (gameState.contradictionsExamined) {
        gameState.phase4Complete = true;
        phase4.classList.add('completed');
        phaseConclusion.classList.remove('locked');
    }
}

function updateExhibitStatus(exhibitId, examined) {
    const exhibit = document.getElementById(exhibitId);
    if (!exhibit) return;

    if (examined) {
        exhibit.classList.add('examined');
        exhibit.querySelector('.status-icon').textContent = '●';
        exhibit.querySelector('.status-text').textContent = 'EXAMINED';
    }
}

function updateTimelineStatus() {
    const timeline = document.getElementById('timeline-preview');
    if (!timeline) return;

    if (gameState.timelineExamined) {
        timeline.querySelector('.status-icon').textContent = '●';
        timeline.querySelector('.status-text').textContent = 'REVIEWED';
    }
}

// ====================================
// TIMELINE ANIMATION
// ====================================
function animateTimeline() {
    const events = document.querySelectorAll('.timeline-event');
    const note = document.getElementById('timelineNote');

    // Hide all first
    events.forEach(event => {
        event.classList.add('hidden');
        event.classList.remove('visible');
    });
    if (note) {
        note.classList.add('hidden');
        note.classList.remove('visible');
    }

    // Reveal one by one - slower for reading
    events.forEach((event, index) => {
        setTimeout(() => {
            event.classList.remove('hidden');
            event.classList.add('visible');
        }, 1000 + (index * 2500));
    });

    // Show note after all events
    if (note) {
        setTimeout(() => {
            note.classList.remove('hidden');
            note.classList.add('visible');
        }, 1000 + (events.length * 2500) + 1000);
    }
}

// ====================================
// FRAGMENTS
// ====================================
function initFragments() {
    const fragments = document.querySelectorAll('.fragment');

    fragments.forEach(fragment => {
        fragment.addEventListener('click', () => {
            if (fragment.classList.contains('revealed')) return;

            fragment.classList.add('revealed');
            const analysis = fragment.querySelector('.fragment-analysis');
            if (analysis) {
                analysis.classList.remove('hidden');
            }

            gameState.fragmentsRevealed++;

            // Show observation container when first fragment is clicked
            const observationContainer = document.getElementById('mirrorObservationContainer');
            if (observationContainer && gameState.fragmentsRevealed === 1) {
                observationContainer.classList.remove('hidden');
            }

            // Check if all revealed - show completion message
            if (gameState.fragmentsRevealed === 5) {
                const observation = document.getElementById('mirrorObservation');
                if (observation) {
                    observation.innerHTML = `${gameState.investigatorName}, notice how the ego defined itself entirely through external reference points.<br><br><em>You have examined all fragments. Return to the investigation board to continue.</em>`;
                }
            }
        });
    });
}

// ====================================
// SUSPECTS GALLERY
// ====================================
function updateSuspectsGallery() {
    const cards = document.querySelectorAll('.suspect-card');

    cards.forEach((card, index) => {
        const suspectId = card.dataset.suspect;

        // Remove all dynamic classes first
        card.classList.remove('locked', 'interrogated');

        if (gameState.suspectsInterrogated.has(suspectId)) {
            card.classList.add('interrogated');
            card.querySelector('.suspect-status').textContent = 'COMPLETED';
        } else if (index === gameState.nextSuspectIndex) {
            // This is the current suspect to interrogate
            card.querySelector('.suspect-status').textContent = 'READY';
        } else if (index > gameState.nextSuspectIndex) {
            card.classList.add('locked');
            card.querySelector('.suspect-status').textContent = 'LOCKED';
        }
    });

    // Update progress
    document.getElementById('suspectsProgress').textContent = gameState.suspectsInterrogated.size;

    // Show completion message if all done
    if (gameState.suspectsInterrogated.size === 4) {
        document.getElementById('allInterrogatedMsg').classList.remove('hidden');
    }
}

function initSuspectCards() {
    const cards = document.querySelectorAll('.suspect-card');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('locked') || card.classList.contains('interrogated')) {
                return;
            }

            const suspectId = card.dataset.suspect;
            startInterrogation(suspectId);
        });
    });
}

// ====================================
// INTERROGATION
// ====================================
function startInterrogation(suspectId) {
    const suspect = suspects[suspectId];
    if (!suspect) return;

    gameState.currentSuspect = suspectId;
    gameState.currentQuestionIndex = 0;

    // Set up the profile
    const profile = document.getElementById('suspectProfile');
    profile.innerHTML = `
        <img src="${suspect.image}" alt="${suspect.name}">
        <h3>${suspect.name}</h3>
    `;

    // Clear transcript and show initial prompt
    const transcript = document.getElementById('transcript');
    transcript.innerHTML = `
        <div class="transcript-line">
            <p class="speaker system">[INTERROGATION INITIATED]</p>
            <p>Subject: ${suspect.name}</p>
        </div>
    `;
    document.getElementById('nextQuestion').style.display = 'none';

    // Navigate and show first question options
    navigateToScreen('screen-interrogation');
    showQuestionOptions();
}

function showQuestionOptions() {
    const suspect = suspects[gameState.currentSuspect];
    const question = suspect.questions[gameState.currentQuestionIndex];

    if (!question) {
        finishInterrogation();
        return;
    }

    // Show prompt
    const transcript = document.getElementById('transcript');
    transcript.innerHTML += `
        <div class="transcript-line">
            <p class="speaker system">[SELECT YOUR APPROACH]</p>
        </div>
    `;

    // Show options for user to choose how to proceed
    const optionsContainer = document.getElementById('questionOptions');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'question-option';
        btn.textContent = option;
        btn.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(btn);
    });

    // Scroll to bottom
    transcript.scrollTop = transcript.scrollHeight;
}

function selectOption(optionIndex) {
    const suspect = suspects[gameState.currentSuspect];
    const question = suspect.questions[gameState.currentQuestionIndex];

    // Hide options
    document.getElementById('questionOptions').innerHTML = '';

    const transcript = document.getElementById('transcript');

    // Add investigator's chosen statement
    transcript.innerHTML += `
        <div class="transcript-line">
            <p class="speaker investigator">${gameState.investigatorName.toUpperCase()}:</p>
            <p>"${question.options[optionIndex]}"</p>
        </div>
    `;

    // Add awaiting response message
    transcript.innerHTML += `
        <div class="transcript-line awaiting" id="awaitingResponse">
            <p class="awaiting-text">⏳ Awaiting response...</p>
        </div>
    `;

    transcript.scrollTop = transcript.scrollHeight;

    // Remove awaiting message and add suspect response after delay
    setTimeout(() => {
        const awaiting = document.getElementById('awaitingResponse');
        if (awaiting) awaiting.remove();

        transcript.innerHTML += `
            <div class="transcript-line">
                <p class="speaker suspect">${suspect.name}:</p>
                <p>"${question.responses[optionIndex]}"</p>
            </div>
        `;

        transcript.scrollTop = transcript.scrollHeight;

        // Move to next question or finish
        gameState.currentQuestionIndex++;

        setTimeout(() => {
            if (gameState.currentQuestionIndex < suspect.questions.length) {
                showQuestionOptions();
            } else {
                finishInterrogation();
            }
        }, 1200);
    }, 1500);
}

function finishInterrogation() {
    const transcript = document.getElementById('transcript');
    transcript.innerHTML += `
        <div class="transcript-line" style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1rem; padding-top: 1rem;">
            <p style="color: var(--text-muted); font-style: italic;">[END OF INTERROGATION]</p>
        </div>
    `;

    // Mark suspect as interrogated
    gameState.suspectsInterrogated.add(gameState.currentSuspect);
    gameState.nextSuspectIndex++;

    // Show next button
    const nextBtn = document.getElementById('nextQuestion');
    nextBtn.style.display = 'inline-flex';

    if (gameState.nextSuspectIndex < 4) {
        nextBtn.textContent = 'MOVE TO NEXT SUSPECT →';
        nextBtn.onclick = () => {
            const nextSuspectId = gameState.suspectOrder[gameState.nextSuspectIndex];
            startInterrogation(nextSuspectId);
        };
    } else {
        nextBtn.textContent = 'RETURN TO SUSPECTS LIST →';
        nextBtn.onclick = () => {
            navigateToScreen('screen-suspects');
        };
    }
}

// ====================================
// CONTRADICTIONS (Interactive)
// ====================================
function initContradictionSequence() {
    // Show first item, hide others
    const items = document.querySelectorAll('.contradiction-item');
    items.forEach((item, index) => {
        if (index === 0) {
            item.classList.remove('hidden');
            item.classList.add('visible');
        } else {
            item.classList.add('hidden');
            item.classList.remove('visible');
        }
    });

    // Reset states
    document.getElementById('contradictionSubmit').classList.add('hidden');
    document.getElementById('contradictionResult').classList.add('hidden');
}

function initContradictions() {
    const sliders = document.querySelectorAll('.spectrum-slider');
    const submitBtn = document.getElementById('submitContradictions');

    sliders.forEach(slider => {
        slider.addEventListener('input', () => {
            const sliderId = slider.dataset.slider;
            const item = slider.closest('.contradiction-item');

            // Mark as touched
            item.classList.add('touched');
            gameState.contradictionSliders.add(sliderId);
            gameState.contradictionValues[sliderId] = parseInt(slider.value);

            // Show next contradiction after a short delay
            const currentNum = parseInt(sliderId);
            const nextItem = document.querySelector(`[data-contradiction="${currentNum + 1}"]`);

            if (nextItem && nextItem.classList.contains('hidden')) {
                setTimeout(() => {
                    nextItem.classList.remove('hidden');
                    nextItem.classList.add('visible');
                    nextItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 600);
            }

            // Show submit button after all sliders moved
            if (gameState.contradictionSliders.size === 3) {
                setTimeout(() => {
                    document.getElementById('contradictionSubmit').classList.remove('hidden');
                    document.getElementById('contradictionSubmit').scrollIntoView({ behavior: 'smooth' });
                }, 800);
            }
        });
    });

    if (submitBtn) {
        submitBtn.addEventListener('click', submitContradictions);
    }
}

function submitContradictions() {
    const values = gameState.contradictionValues;
    let rightCount = 0;

    // Count how many lean toward the "uncomfortable truth" side (right/higher values)
    Object.values(values).forEach(v => {
        if (v > 50) rightCount++;
    });

    const resultText = document.getElementById('contradictionResultText');
    const name = gameState.investigatorName;

    let message;
    if (rightCount >= 2) {
        message = `${name}, you positioned yourself closer to the private struggles—the doubt, the exhaustion, the arbitrary standards you still follow. The subject would recognize you.`;
    } else if (rightCount === 0) {
        message = `${name}, you stayed on the side of confidence and clarity. Interesting. The subject tried to stay there too. It didn't hold.`;
    } else {
        message = `${name}, you sit in the middle. Neither fully confident nor fully doubting. This is perhaps the most honest position—and the most exhausting.`;
    }

    resultText.textContent = message;
    document.getElementById('contradictionResult').classList.remove('hidden');
    document.getElementById('contradictionSubmit').classList.add('hidden');

    gameState.contradictionsExamined = true;

    // Scroll to result
    document.getElementById('contradictionResult').scrollIntoView({ behavior: 'smooth' });
}

// ====================================
// ASSESSMENT
// ====================================
function initAssessment() {
    const questions = document.querySelectorAll('.assessment-question');

    questions.forEach(question => {
        const buttons = question.querySelectorAll('.answer-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                handleAssessmentAnswer(question, btn);
            });
        });
    });
}

function handleAssessmentAnswer(questionEl, selectedBtn) {
    const questionNum = parseInt(questionEl.dataset.question);
    const answer = selectedBtn.dataset.answer;

    // Store answer
    gameState.assessmentAnswers[questionNum] = answer;

    // Mark selected
    questionEl.querySelectorAll('.answer-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    selectedBtn.classList.add('selected');

    // Show next question or complete
    const nextQuestionNum = questionNum + 1;
    const nextQuestion = document.querySelector(`[data-question="${nextQuestionNum}"]`);

    if (nextQuestion) {
        setTimeout(() => {
            nextQuestion.classList.remove('hidden');
            nextQuestion.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    } else {
        // All questions answered
        setTimeout(() => {
            document.getElementById('assessmentComplete').classList.remove('hidden');
            document.getElementById('assessmentComplete').scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
}

// ====================================
// CONCLUSION
// ====================================
function initConclusion() {
    const buttons = document.querySelectorAll('.responsibility-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const choice = btn.dataset.choice;
            showVerdict(choice);
        });
    });
}

function showVerdict(choice) {
    const container = document.getElementById('verdictContainer');
    container.classList.remove('hidden');

    // Hide options
    document.getElementById('responsibilityOptions').style.display = 'none';

    let verdictText = '';

    switch (choice) {
        case 'social-media':
            verdictText = `<p>You have blamed Social Media.</p><p>But it only provided the stage. Someone had to choose to perform.</p>`;
            break;
        case 'high-standards':
            verdictText = `<p>You have blamed High Standards.</p><p>But without standards, there would be no growth. Someone internalized them.</p>`;
            break;
        case 'comparison':
            verdictText = `<p>You have blamed Comparison.</p><p>But comparison requires a comparator. Someone chose to measure.</p>`;
            break;
        case 'validation':
            verdictText = `<p>You have blamed External Validation.</p><p>But validation only matters to those who seek it. Someone was seeking.</p>`;
            break;
        case 'self':
            verdictText = `<p>You have blamed the Subject.</p><p>An honest assessment. But perhaps too simple.</p>`;
            break;
        case 'none':
            verdictText = `<p>You have declined to assign singular blame.</p><p>Perhaps this is the most honest answer.</p>`;
            break;
    }

    container.innerHTML = verdictText + `<button class="proceed-btn" id="proceedToFinal" style="margin-top: 1.5rem;"><span class="btn-text">PROCEED TO FINAL REVELATION</span><span class="btn-icon">→</span></button>`;

    document.getElementById('proceedToFinal').addEventListener('click', () => {
        navigateToScreen('screen-final');
        showFinalRevelation();
    });
}

// ====================================
// FINAL REVELATION
// ====================================
function showFinalRevelation() {
    const container = document.getElementById('finalText');
    const name = gameState.investigatorName;

    // Lower ambient audio
    const drone = document.getElementById('ambientDrone');
    if (drone && gameState.audioEnabled) {
        drone.volume = 0.05;
    }

    // Faster, more punchy unsettling messages
    const messages = [
        { text: `Interesting choice, ${name}.`, delay: 0 },
        { text: `But here's the thing—`, delay: 1500 },
        { text: `It doesn't matter who you blamed.`, delay: 3000, class: 'final-message' },
        { text: `The verdict was always the same.`, delay: 5000, class: 'final-message' },
        { text: `Social media, high standards, comparison, validation—they all apply. They always did.`, delay: 7500 },
        { text: `The ego is fragile because all of them exist. All of them feed on each other.`, delay: 10500, class: 'final-message' },
        { text: `And ${name}... you already knew that, didn't you?`, delay: 13500, class: 'final-mocking' },
        { text: `The subject isn't a stranger.`, delay: 16000, class: 'final-message' },
        { text: `The subject is you.`, delay: 18000, class: 'final-revelation' }
    ];

    // Clear and build
    container.innerHTML = '';

    messages.forEach(msg => {
        const p = document.createElement('p');
        p.textContent = msg.text;
        if (msg.class) p.classList.add(msg.class);
        container.appendChild(p);

        setTimeout(() => {
            p.classList.add('visible');
            // Auto-scroll to keep the latest message in view
            p.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, msg.delay);
    });

    // Show close case button faster
    setTimeout(() => {
        document.getElementById('closeCaseContainer').classList.remove('hidden');

        // Fade audio back
        if (drone && gameState.audioEnabled) {
            let vol = 0.05;
            const fadeIn = setInterval(() => {
                vol += 0.02;
                drone.volume = Math.min(vol, 0.15);
                if (vol >= 0.15) clearInterval(fadeIn);
            }, 200);
        }
    }, 21000);
}

// ====================================
// RESET GAME
// ====================================
function resetGame() {
    // Reset state - DON'T set currentScreen here, we'll handle it after
    gameState.investigatorName = '';
    gameState.exhibitAExamined = false;
    gameState.exhibitBExamined = false;
    gameState.fragmentsRevealed = 0;
    gameState.timelineExamined = false;
    gameState.contradictionsExamined = false;
    gameState.phase1Complete = false;
    gameState.phase2Complete = false;
    gameState.phase3Complete = false;
    gameState.phase4Complete = false;
    gameState.suspectsInterrogated = new Set();
    gameState.currentSuspect = null;
    gameState.currentQuestionIndex = 0;
    gameState.nextSuspectIndex = 0;
    gameState.assessmentAnswers = {};
    gameState.contradictionSliders = new Set();
    gameState.contradictionValues = {};

    // Reset UI elements
    document.getElementById('investigatorName').value = '';
    document.getElementById('submitName').disabled = true;

    // Reset phases
    document.querySelectorAll('.investigation-phase').forEach((phase, index) => {
        phase.classList.remove('completed');
        if (index > 0) phase.classList.add('locked');
    });

    // Reset exhibits
    document.querySelectorAll('.exhibit-card').forEach(card => {
        card.classList.remove('examined');
        card.querySelector('.status-icon').textContent = '○';
        card.querySelector('.status-text').textContent = 'NOT EXAMINED';
    });

    // Reset timeline
    const timeline = document.getElementById('timeline-preview');
    if (timeline) {
        timeline.querySelector('.status-icon').textContent = '○';
        timeline.querySelector('.status-text').textContent = 'NOT REVIEWED';
    }

    // Reset timeline events
    document.querySelectorAll('.timeline-event').forEach(event => {
        event.classList.add('hidden');
        event.classList.remove('visible');
    });
    const timelineNote = document.getElementById('timelineNote');
    if (timelineNote) {
        timelineNote.classList.add('hidden');
        timelineNote.classList.remove('visible');
    }

    // Reset fragments
    document.querySelectorAll('.fragment').forEach(frag => {
        frag.classList.remove('revealed');
        const analysis = frag.querySelector('.fragment-analysis');
        if (analysis) analysis.classList.add('hidden');
    });

    // Reset observation
    const observation = document.getElementById('mirrorObservation');
    if (observation) observation.textContent = '';
    const observationContainer = document.getElementById('mirrorObservationContainer');
    if (observationContainer) observationContainer.classList.add('hidden');

    // Reset suspects
    document.querySelectorAll('.suspect-card').forEach((card, index) => {
        card.classList.remove('interrogated');
        if (index > 0) card.classList.add('locked');
        else card.classList.remove('locked');
        card.querySelector('.suspect-status').textContent = index === 0 ? 'READY' : 'LOCKED';
    });

    document.getElementById('suspectsProgress').textContent = '0';
    document.getElementById('allInterrogatedMsg').classList.add('hidden');

    // Reset assessment
    document.querySelectorAll('.assessment-question').forEach((q, i) => {
        q.querySelectorAll('.answer-btn').forEach(btn => btn.classList.remove('selected'));
        if (i > 0) q.classList.add('hidden');
    });
    document.getElementById('assessmentComplete').classList.add('hidden');

    // Reset contradictions
    document.querySelectorAll('.contradiction-item').forEach((item, index) => {
        item.classList.remove('touched', 'visible');
        if (index === 0) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
    document.querySelectorAll('.spectrum-slider').forEach(slider => {
        slider.value = 50;
    });
    document.getElementById('contradictionSubmit').classList.add('hidden');
    const contradictionResult = document.getElementById('contradictionResult');
    if (contradictionResult) contradictionResult.classList.add('hidden');

    // Reset conclusion
    document.getElementById('responsibilityOptions').style.display = '';
    document.getElementById('verdictContainer').classList.add('hidden');
    document.getElementById('verdictContainer').innerHTML = '';

    // Reset final
    document.getElementById('finalText').innerHTML = '';
    document.getElementById('closeCaseContainer').classList.add('hidden');

    // Hide ALL screens first
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active', 'fade-in', 'fade-out');
    });

    // Show the name screen directly
    const nameScreen = document.getElementById('screen-name');
    nameScreen.style.display = 'flex';
    nameScreen.classList.add('active');
    gameState.currentScreen = 'screen-name';

    window.scrollTo(0, 0);
}

// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    initFragments();
    initSuspectCards();
    initContradictions();
    initAssessment();
    initConclusion();

    // Name input handling
    const nameInput = document.getElementById('investigatorName');
    const submitBtn = document.getElementById('submitName');

    nameInput.addEventListener('input', () => {
        submitBtn.disabled = nameInput.value.trim().length < 2;
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && nameInput.value.trim().length >= 2) {
            submitBtn.click();
        }
    });

    submitBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name.length >= 2) {
            setInvestigatorName(name);
            navigateToScreen('screen-intro');
        }
    });

    // Start investigation button
    document.getElementById('startInvestigation').addEventListener('click', () => {
        navigateToScreen('screen-board');
    });

    // Exhibit clicks
    document.getElementById('exhibit-a').addEventListener('click', () => {
        navigateToScreen('screen-mirror');
    });

    document.getElementById('exhibit-b').addEventListener('click', () => {
        navigateToScreen('screen-observation');
    });

    // Timeline button
    document.getElementById('examineTimeline').addEventListener('click', () => {
        navigateToScreen('screen-timeline');
    });

    // Interrogation button
    document.getElementById('goToInterrogation').addEventListener('click', () => {
        navigateToScreen('screen-suspects');
    });

    // Contradictions button
    document.getElementById('examineContradictions').addEventListener('click', () => {
        navigateToScreen('screen-contradictions');
    });

    // Conclusion button
    document.getElementById('concludeBtn').addEventListener('click', () => {
        navigateToScreen('screen-assessment');
    });

    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = gameState.currentScreen;

            // Mark evidence as examined when leaving
            if (current === 'screen-mirror') {
                gameState.exhibitAExamined = true;
            } else if (current === 'screen-observation') {
                gameState.exhibitBExamined = true;
            } else if (current === 'screen-timeline') {
                gameState.timelineExamined = true;
            } else if (current === 'screen-contradictions') {
                gameState.contradictionsExamined = true;
            }

            navigateToScreen('screen-board');
        });
    });

    // Return after interrogation
    document.getElementById('returnAfterInterrogation').addEventListener('click', () => {
        navigateToScreen('screen-board');
    });

    // Proceed from contradictions to assessment
    document.getElementById('proceedFromContradictions').addEventListener('click', () => {
        navigateToScreen('screen-assessment');
    });

    // Proceed to conclusion from assessment
    document.getElementById('proceedToConclusion').addEventListener('click', () => {
        navigateToScreen('screen-conclusion');
    });

    // Audio toggle
    document.getElementById('audioToggle').addEventListener('click', toggleAudio);

    // Close case button
    document.getElementById('closeCaseBtn').addEventListener('click', resetGame);
});
