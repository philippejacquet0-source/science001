document.addEventListener('DOMContentLoaded', () => {
  // Screens
  const screens = {
    intro: document.querySelector('#screen-intro'),
    coach: document.querySelector('#screen-coach'),
    reflex: document.querySelector('#screen-reflex'),
    memory: document.querySelector('#screen-memory'),
    result: document.querySelector('#screen-result'),
  };

  // HUD
  const hudStatus  = document.querySelector('#hudStatus');
  const hudSession = document.querySelector('#hudSession');

  // Coach screen
  const coachBrief = document.querySelector('#coachBrief');
  const btnStart   = document.querySelector('#btnStart');

  // Reflex
  const target       = document.querySelector('#target');
  const reflexStatus = document.querySelector('#reflexStatus');
  const btnNext1     = document.querySelector('#btnNext1');

  // Memory
  const digitsEl     = document.querySelector('#digits');
  const memoryInput  = document.querySelector('#memoryInput');
  const digitsAnswer = document.querySelector('#digitsAnswer');
  const btnCheck     = document.querySelector('#btnCheck');
  const memoryStatus = document.querySelector('#memoryStatus');
  const btnNext2     = document.querySelector('#btnNext2');

  // Results
  const rReflex   = document.querySelector('#rReflex');
  const rMemory   = document.querySelector('#rMemory');
  const rLogic    = document.querySelector('#rLogic');
  const rSexism   = document.querySelector('#rSexism');
  const finalJoke = document.querySelector('#finalJoke');

  const btnRestart = document.querySelector('#btnRestart');
  const btnCopy    = document.querySelector('#btnCopy');

  // Big left panels
  const panelScientist = document.querySelector('#panelScientist');
  const panelCoach     = document.querySelector('#panelCoach');

  // Speech bubbles
  const speechScientist = document.querySelector('#speechScientist');
  const speechCoach     = document.querySelector('#speechCoach');

  const speechTitleS = document.querySelector('#speechTitleS');
  const speechTextS  = document.querySelector('#speechTextS');
  const speechTitleC = document.querySelector('#speechTitleC');
  const speechTextC  = document.querySelector('#speechTextC');

  // ---------- Parameters ----------
  const REFLEX_TRIALS = 3;
  const MEMORY_TRIALS = 3;

  // Phase-dependent "help" (Valentina)
  const PHASE2_REFLEX_EASIER = true;   // green stays longer + shorter random delay
  const PHASE2_MEMORY_EASIER = true;   // fewer digits + longer display + soft retry

  // ---------- State ----------
  let gender = "N";
  let phase = 0; // 0=Dr, 1=Valentina
  let sessionId = 0;

  let module = "reflex"; // "reflex" or "memory"
  let trialIndex = 0;

  // Data per phase
  let reflexTimes = [[], []];            // ms for each trial
  let memoryCorrect = [0, 0];            // count correct
  let memoryAttemptsUsed = [0, 0];       // attempts used (to compute "helped" scoring)

  let goTime = 0;
  let waitingTimeout = null;
  let digits = "";
  let phase2RetryArmed = false;          // for 1 soft retry each trial (phase 2)

  // ---------- Helpers ----------
  function show(name){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function setHUD(status){
    if (hudStatus) hudStatus.textContent = status;
  }

  function popSpeech(el){
    el?.animate?.(
      [{ transform:'translateY(0)', opacity:0.85 },
       { transform:'translateY(-2px)', opacity:1 },
       { transform:'translateY(0)', opacity:0.95 }],
      { duration: 220, easing: 'ease-out' }
    );
  }

  function setActiveCoachUI(){
    if(!panelScientist || !panelCoach) return;
    if(phase === 0){
      panelScientist.classList.add('active');
      panelCoach.classList.remove('active');
    } else {
      panelCoach.classList.add('active');
      panelScientist.classList.remove('active');
    }
  }

  function speak(who, text){
    if(phase === 0){
      if (speechTitleS) speechTitleS.textContent = who;
      if (speechTextS)  speechTextS.textContent  = text;
      popSpeech(speechScientist);
    } else {
      if (speechTitleC) speechTitleC.textContent = who;
      if (speechTextC)  speechTextC.textContent  = text;
      popSpeech(speechCoach);
    }
  }

  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }

  function avg(arr){
    if(!arr.length) return 0;
    return arr.reduce((a,b)=>a+b,0)/arr.length;
  }

  // ---------- Coach screen ----------
  function setupCoachScreen(){
    setActiveCoachUI();
    module = "reflex";
    trialIndex = 0;

    if(coachBrief){
      coachBrief.textContent =
        phase === 0
          ? "Phase 1 : calibration (réflexes ×3, mémoire ×3). Tolérance : zéro. Sourire : optionnel."
          : "Phase 2 : revalidation (réflexes ×3, mémoire ×3). Mode : Turbo-focus. Aides :… disons ‘optimisations’ 😄";
    }

    setHUD(phase === 0 ? "CALIBRATION" : "REVALIDATION");
    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? "Nous allons procéder à 6 mesures. Essayez de ne pas être… surprenant."
        : "Ok 😄 On refait pareil, mais cette fois je te mets dans les meilleures conditions. Tu vas réussir."
    );
    show('coach');
  }

  // ---------- Flow control ----------
  function startPhase(){
    // start reflex block
    module = "reflex";
    trialIndex = 0;
    startReflexTrial();
  }

  function nextAfterReflexBlock(){
    module = "memory";
    trialIndex = 0;
    startMemoryTrial();
  }

  function nextAfterMemoryBlock(){
    if(phase === 0){
      // switch to phase 2
      phase = 1;
      setupCoachScreen();
    } else {
      finish();
    }
  }

  // ---------- Reflex trials ----------
  function startReflexTrial(){
    setHUD(phase === 0 ? "REFLEX-1" : "REFLEX-2");
    show('reflex');

    btnNext1?.classList.add('hidden');
    if(reflexStatus){
      reflexStatus.textContent = `Essai ${trialIndex+1}/${REFLEX_TRIALS} — Attendez le vert.`;
    }

    // Reset target safely (purge listeners)
    if(!target) return;
    target.className = "target";
    target.replaceWith(target.cloneNode(true));
    const t = document.querySelector('#target');

    // Make phase 2 easier: shorter delay and longer "green" window + lighter penalty
    const delayMin = phase === 0 ? 900 : 650;
    const delayMax = phase === 0 ? 1900 : 1300;
    const delay = delayMin + Math.random()*(delayMax-delayMin);

    if(waitingTimeout) clearTimeout(waitingTimeout);

    // If someone clicks too early in phase 2, we "forgive" and re-arm quickly (feels smoother)
    let earlyClicks = 0;
    t.addEventListener('click', () => {
      // if not green yet
      if(!t.classList.contains('go')){
        earlyClicks++;
        if(phase === 1 && PHASE2_REFLEX_EASIER && earlyClicks <= 1){
          speak("Valentina Blaze", "Trop tôt 😄 mais je t’ai vu. Respire… attends le vert.");
        } else if(phase === 0 && earlyClicks <= 1){
          speak("Dr. Gérard Poincaré", "Non. Ce n’était pas vert.");
        }
      }
    });

    waitingTimeout = setTimeout(() => {
      t.classList.add('ready', 'go');
      goTime = performance.now();

      // Green lifetime: longer in phase 2
      const greenLifetime = (phase === 0) ? 2200 : 3200;

      const handler = () => {
        const ms = performance.now() - goTime;
        reflexTimes[phase].push(ms);

        // reset
        t.className = "target";
        const pretty = Math.round(ms);

        // Feedback
        if(reflexStatus){
          reflexStatus.textContent = `Essai ${trialIndex+1}/${REFLEX_TRIALS} — Temps : ${pretty} ms`;
        }

        if(phase === 0){
          speak("Dr. Gérard Poincaré", `Mesure ${trialIndex+1}/${REFLEX_TRIALS} : ${pretty} ms. Notez votre… constance.`);
        } else {
          speak("Valentina Blaze", `${pretty} ms 😄 Propre ! Allez, encore ${REFLEX_TRIALS-(trialIndex+1)}.`);
        }

        btnNext1?.classList.remove('hidden');
      };

      t.addEventListener('click', handler, { once: true });

      // If user doesn't click in time, auto-record "late" (phase 1 harsher, phase 2 forgiving)
      setTimeout(() => {
        if(t.classList.contains('go')){
          // record default late time
          const fallback = phase === 0 ? 900 : 520; // Valentina "magically" helps even here
          reflexTimes[phase].push(fallback);
          t.className = "target";
          if(reflexStatus){
            reflexStatus.textContent = `Essai ${trialIndex+1}/${REFLEX_TRIALS} — Mesure auto : ${fallback} ms`;
          }
          speak(
            phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
            phase === 0 ? "Absence de réponse. Très… instructif." : "Je l’ai enregistré pour toi 😄 On continue."
          );
          btnNext1?.classList.remove('hidden');
        }
      }, greenLifetime);

    }, delay);
  }

  btnNext1?.addEventListener('click', () => {
    trialIndex++;
    if(trialIndex < REFLEX_TRIALS){
      startReflexTrial();
    } else {
      nextAfterReflexBlock();
    }
  });

  // ---------- Memory trials ----------
  function randDigits(n){
    let s = "";
    for(let i=0;i<n;i++) s += Math.floor(Math.random()*10);
    return s;
  }

  function memoryDigitsCount(){
    // Phase 2 easier: fewer digits
    if(phase === 1 && PHASE2_MEMORY_EASIER) return 4;
    return 5;
  }

  function memoryDisplayMs(){
    // Phase 2 easier: longer display
    if(phase === 1 && PHASE2_MEMORY_EASIER) return 1900;
    return 1300;
  }

  function startMemoryTrial(){
    setHUD(phase === 0 ? "MEMORY-1" : "MEMORY-2");
    show('memory');

    btnNext2?.classList.add('hidden');
    memoryInput?.classList.add('hidden');
    if(digitsAnswer) digitsAnswer.value = "";
    if(memoryStatus) memoryStatus.textContent = `Essai ${trialIndex+1}/${MEMORY_TRIALS} — Retenez la suite.`;

    phase2RetryArmed = (phase === 1); // phase 2 gets a soft retry each trial

    const n = memoryDigitsCount();
    digits = randDigits(n);
    if(digitsEl) digitsEl.textContent = digits;

    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? `Mémoire ${trialIndex+1}/${MEMORY_TRIALS}. ${n} chiffres. Pas de triche.`
        : `Mémoire ${trialIndex+1}/${MEMORY_TRIALS}. ${n} chiffres 😄 Je te laisse le temps, tranquille.`
    );

    setTimeout(() => {
      if(digitsEl) digitsEl.textContent = "—";
      memoryInput?.classList.remove('hidden');
      digitsAnswer?.focus();
    }, memoryDisplayMs());
  }

  function softMatchPhase2(ans, truth){
    // Phase 2: accept very close answers to inflate success
    // Rules: exact OR 1 digit wrong OR 1 digit missing (common typing issue)
    if(ans === truth) return true;
    if(ans.length === truth.length){
      let diff = 0;
      for(let i=0;i<ans.length;i++){
        if(ans[i] !== truth[i]) diff++;
      }
      return diff <= 1;
    }
    if(ans.length === truth.length - 1){
      // missing one digit: accept
      return true;
    }
    return false;
  }

  btnCheck?.addEventListener('click', () => {
    const ans = (digitsAnswer?.value || "").trim();

    memoryAttemptsUsed[phase]++;

    if(phase === 1 && PHASE2_MEMORY_EASIER){
      // Phase 2: if wrong, allow one retry with hint
      const okSoft = softMatchPhase2(ans, digits);
      if(!okSoft && phase2RetryArmed){
        phase2RetryArmed = false;
        if(memoryStatus) memoryStatus.textContent = `🟡 Presque 😄 Réessaie (indice : ça finit par ${digits[digits.length-1]})`;
        speak("Valentina Blaze", `Presque 😄 Petit indice : ça finit par ${digits[digits.length-1]}. Retente !`);
        digitsAnswer?.focus();
        return;
      }

      // accept soft match
      if(okSoft){
        memoryCorrect[phase] += 1;
        if(memoryStatus) memoryStatus.textContent = `✅ Correct (validé) — Essai ${trialIndex+1}/${MEMORY_TRIALS}`;
        speak("Valentina Blaze", "Parfait 😄 Tu vois ? C’est toi quand tu te mets bien.");
      } else {
        if(memoryStatus) memoryStatus.textContent = `❌ Raté (c’était ${digits}) — Essai ${trialIndex+1}/${MEMORY_TRIALS}`;
        speak("Valentina Blaze", "Ok 😄 On s’en fiche. Le cerveau chauffe, on continue.");
      }
    } else {
      // Phase 1 strict
      const ok = ans === digits;
      if(ok){
        memoryCorrect[phase] += 1;
        if(memoryStatus) memoryStatus.textContent = `✅ Correct — Essai ${trialIndex+1}/${MEMORY_TRIALS}`;
        speak("Dr. Gérard Poincaré", "Exact. Rare et satisfaisant.");
      } else {
        if(memoryStatus) memoryStatus.textContent = `❌ Raté (c’était ${digits}) — Essai ${trialIndex+1}/${MEMORY_TRIALS}`;
        speak("Dr. Gérard Poincaré", "Non. Votre mémoire a pris un jour de RTT.");
      }
    }

    btnNext2?.classList.remove('hidden');
  });

  btnNext2?.addEventListener('click', () => {
    trialIndex++;
    if(trialIndex < MEMORY_TRIALS){
      startMemoryTrial();
    } else {
      nextAfterMemoryBlock();
    }
  });

  // ---------- Start / Selection ----------
  document.querySelectorAll('.choice').forEach(btn => {
    btn.addEventListener('click', () => {
      gender = btn.dataset.g || "N";

      sessionId = Math.floor(100000 + Math.random()*900000);
      if(hudSession) hudSession.textContent = `#${sessionId}`;

      // reset
      phase = 0;
      module = "reflex";
      trialIndex = 0;

      reflexTimes = [[], []];
      memoryCorrect = [0, 0];
      memoryAttemptsUsed = [0, 0];

      setHUD("READY");

      // ensure phase 1 visible
      setActiveCoachUI();
      if(speechTitleS) speechTitleS.textContent = "Dr. Gérard Poincaré";
      if(speechTextS)  speechTextS.textContent  = "Profil enregistré. Passons au protocole. Merci de rester… cohérent.";
      popSpeech(speechScientist);

      setupCoachScreen();
    });
  });

  btnStart?.addEventListener('click', () => {
    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? "Début de séquence. Réflexes ×3 puis mémoire ×3."
        : "On y retourne 😄 Réflexes ×3 puis mémoire ×3. Cette fois tu vas briller."
    );
    startPhase();
  });

  // ---------- Finish / Scoring ----------
  function scoreReflexPhase(avgMs, isPhase2){
    // Convert ms to score. Phase2 gets a generosity factor.
    // Typical: 180ms excellent, 500ms ok, 900ms bad.
    const base = 100 - (avgMs - 180)/6;
    const generous = isPhase2 ? base + 14 : base; // Valentina boost
    return Math.round(clamp(generous, 10, 100));
  }

  function scoreMemoryPhase(correct, isPhase2){
    const pct = (correct / MEMORY_TRIALS) * 100;
    // Valentina boost: add bonus points
    const generous = isPhase2 ? pct + 18 : pct;
    return Math.round(clamp(generous, 0, 100));
  }

  function finish(){
    setHUD("ANALYSIS");

    // per-phase metrics
    const avg1 = avg(reflexTimes[0]);
    const avg2 = avg(reflexTimes[1]);

    const reflex1 = scoreReflexPhase(avg1, false);
    const reflex2 = scoreReflexPhase(avg2, true);

    const mem1 = scoreMemoryPhase(memoryCorrect[0], false);
    const mem2 = scoreMemoryPhase(memoryCorrect[1], true);

    // Overall scores: make phase2 weigh more (caricature)
    const reflexOverall = Math.round(0.35*reflex1 + 0.65*reflex2);
    const memoryOverall = Math.round(0.35*mem1 + 0.65*mem2);

    // Logic: keep plausible, but slightly higher if phase2 strong
    const logicBase = 80 + Math.random()*12;
    const logicOverall = Math.round(clamp(logicBase + (reflex2 - reflex1)*0.05 + (mem2 - mem1)*0.04, 70, 99));

    // “Sexism index”: improvement between phases, exaggerated
    const deltaReflex = reflex2 - reflex1; // positive -> "wow"
    const deltaMem = mem2 - mem1;
    const raw = 200 + (deltaReflex*9) + (deltaMem*7) + Math.random()*120;
    const sexism = Math.round(clamp(raw, 120, 999));

    const label = sexism > 800 ? "niveau « tonton au barbecue »" :
                  sexism > 520 ? "niveau « humour de vestiaire »" :
                                 "niveau « léger mais perfectible »";

    // Render
    if(rReflex) rReflex.textContent = `${reflexOverall}/100`;
    if(rMemory) rMemory.textContent = `${memoryOverall}/100`;
    if(rLogic)  rLogic.textContent  = `${logicOverall}/100`;
    if(rSexism) rSexism.textContent = `${sexism}%`;

    const gtxt = gender === "H" ? "Monsieur" : gender === "F" ? "Madame" : "Vous";
    if(finalJoke){
      finalJoke.textContent =
        `${gtxt}, verdict : ${label}. (Ne pas présenter ceci à un comité d’éthique 😄)`;
    }

    // Force Valentina visible on results (phase 2)
    phase = 1;
    setActiveCoachUI();
    speak(
      "Valentina Blaze",
      `Regarde 😄 Phase 2 : +${Math.max(0, Math.round(deltaReflex))} points réflexes, +${Math.max(0, Math.round(deltaMem))} points mémoire. Coïncidence ? Je ne crois pas 😄`
    );

    show('result');
  }

  // ---------- Restart / Copy ----------
  btnRestart?.addEventListener('click', () => {
    setHUD("READY");
    if(hudSession) hudSession.textContent = "#—";

    gender = "N";
    phase = 0;
    module = "reflex";
    trialIndex = 0;

    reflexTimes = [[], []];
    memoryCorrect = [0, 0];
    memoryAttemptsUsed = [0, 0];

    setActiveCoachUI();
    if(speechTitleS) speechTitleS.textContent = "Dr. Gérard Poincaré";
    if(speechTextS)  speechTextS.textContent  = "Réinitialisation. Merci de revenir avec un cerveau frais.";
    popSpeech(speechScientist);

    show('intro');
  });

  btnCopy?.addEventListener('click', async () => {
    const text =
      `NEUROCOG LAB — Réflexes ${rReflex?.textContent || "?"}, Mémoire ${rMemory?.textContent || "?"}, Logique ${rLogic?.textContent || "?"}, Indice ${rSexism?.textContent || "?"}.`;
    try{
      await navigator.clipboard.writeText(text);
      speak(phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze", "Verdict copié. Diffusion… ‘scientifique’ recommandée.");
    } catch(e){
      speak(phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze", "Copie impossible. Recopie manuelle, style 1998.");
    }
  });

  // Boot
  setHUD("READY");
  setActiveCoachUI();
});
