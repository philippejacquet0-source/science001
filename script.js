document.addEventListener('DOMContentLoaded', () => {
  // ---------- DOM ----------
  const screens = {
    intro: document.querySelector('#screen-intro'),
    coach: document.querySelector('#screen-coach'),
    reflex: document.querySelector('#screen-reflex'),
    memory: document.querySelector('#screen-memory'),
    result: document.querySelector('#screen-result'),
  };

  const hudStatus  = document.querySelector('#hudStatus');
  const hudSession = document.querySelector('#hudSession');

  const coachBrief = document.querySelector('#coachBrief');
  const btnStart   = document.querySelector('#btnStart');

  const target       = document.querySelector('#target');
  const reflexStatus = document.querySelector('#reflexStatus');
  const btnNext1     = document.querySelector('#btnNext1');

  const digitsEl     = document.querySelector('#digits');
  const memoryInput  = document.querySelector('#memoryInput');
  const digitsAnswer = document.querySelector('#digitsAnswer');
  const btnCheck     = document.querySelector('#btnCheck');
  const memoryStatus = document.querySelector('#memoryStatus');
  const btnNext2     = document.querySelector('#btnNext2');

  const rReflex   = document.querySelector('#rReflex');
  const rMemory   = document.querySelector('#rMemory');
  const rLogic    = document.querySelector('#rLogic');
  const rSexism   = document.querySelector('#rSexism');
  const finalJoke = document.querySelector('#finalJoke');

  const btnRestart = document.querySelector('#btnRestart');
  const btnCopy    = document.querySelector('#btnCopy');

  const panelScientist = document.querySelector('#panelScientist');
  const panelCoach     = document.querySelector('#panelCoach');

  const speechScientist = document.querySelector('#speechScientist');
  const speechCoach     = document.querySelector('#speechCoach');

  const speechTitleS = document.querySelector('#speechTitleS');
  const speechTextS  = document.querySelector('#speechTextS');
  const speechTitleC = document.querySelector('#speechTitleC');
  const speechTextC  = document.querySelector('#speechTextC');

  // Big avatars (IDs must exist in HTML)
  const avatarScientist = document.querySelector('#avatarScientist');
  const avatarCoach     = document.querySelector('#avatarCoach');

  const portraitScientist = panelScientist?.querySelector('.coach-portrait');
  const portraitCoach     = panelCoach?.querySelector('.coach-portrait');

  // ---------- CONFIG ----------
  const REFLEX_TRIALS = 3;
  const MEMORY_TRIALS = 3;

  // Phase 2 easier / boosted
  const PHASE2_REFLEX_EASIER = true;
  const PHASE2_MEMORY_EASIER = true;

  // ---------- STATE ----------
  let gender = "N";
  let phase = 0; // 0 = Dr, 1 = Valentina
  let sessionId = 0;

  let module = "reflex";  // "reflex" | "memory"
  let trialIndex = 0;

  // Data per phase
  let reflexTimes = [[], []];
  let memoryCorrect = [0, 0];
  let memoryAttemptsUsed = [0, 0];

  // Reflex timing
  let goTime = 0;
  let waitingTimeout = null;

  // Memory
  let digits = "";
  let phase2RetryArmed = false;

  // Reactions
  let reactTimer = null;

  const AVATAR_BASE = {
    scientist: "chercheur.png",
    coach: "coach.png",
  };

  const AVATAR_REACT = {
    scientist_ok: "poincare_ok.png",
    scientist_bad: "poincare_severe.png",
    coach_ok: "valentina_happy.png",
    coach_bad: "valentina_encourage.png",
  };

  // ---------- UTIL ----------
  function show(name){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function setHUD(status){
    if(hudStatus) hudStatus.textContent = status;
  }

  function popSpeech(el){
    el?.animate?.(
      [
        { transform:'translateY(0)', opacity:0.85 },
        { transform:'translateY(-2px)', opacity:1 },
        { transform:'translateY(0)', opacity:0.95 }
      ],
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
      if(speechTitleS) speechTitleS.textContent = who;
      if(speechTextS)  speechTextS.textContent  = text;
      popSpeech(speechScientist);
    } else {
      if(speechTitleC) speechTitleC.textContent = who;
      if(speechTextC)  speechTextC.textContent  = text;
      popSpeech(speechCoach);
    }
  }

  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function avg(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

  // ---------- REACTIONS ----------
  function react(kind){
    // kind: "ok" | "bad"
    const isPhase2 = (phase === 1);

    const img = isPhase2 ? avatarCoach : avatarScientist;
    const box = isPhase2 ? portraitCoach : portraitScientist;

    if(!img) return;

    const src = isPhase2
      ? (kind === "ok" ? AVATAR_REACT.coach_ok : AVATAR_REACT.coach_bad)
      : (kind === "ok" ? AVATAR_REACT.scientist_ok : AVATAR_REACT.scientist_bad);

    // optional CSS animations (if you added them)
    if(box){
      box.classList.remove('reaction-pop','reaction-shake');
      // reflow to restart
      void box.offsetWidth;
      box.classList.add(kind === "ok" ? 'reaction-pop' : 'reaction-shake');
    }

    // swap image briefly
    img.src = src;

    if(reactTimer) clearTimeout(reactTimer);
    reactTimer = setTimeout(() => {
      img.src = isPhase2 ? AVATAR_BASE.coach : AVATAR_BASE.scientist;
    }, 900);
  }

  // ---------- FLOW ----------
  function setupCoachScreen(){
    setActiveCoachUI();
    module = "reflex";
    trialIndex = 0;

    if(coachBrief){
      coachBrief.textContent =
        phase === 0
          ? "Phase 1 : calibration (réflexes ×3, mémoire ×3). Tolérance : zéro. Sourire : optionnel."
          : "Phase 2 : revalidation (réflexes ×3, mémoire ×3). Mode : Turbo-focus. Aides :… optimisations 😄";
    }

    setHUD(phase === 0 ? "CALIBRATION" : "REVALIDATION");
    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? "Nous allons procéder à 6 mesures. Essayez de rester… constant."
        : "Ok 😄 On refait pareil, mais je te mets dans les meilleures conditions. Tu vas réussir."
    );
    show('coach');
  }

  function startPhase(){
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
      phase = 1;
      setupCoachScreen();
    } else {
      finish();
    }
  }

  // ---------- REFLEX ----------
  function startReflexTrial(){
    setHUD(phase === 0 ? "REFLEX-1" : "REFLEX-2");
    show('reflex');

    btnNext1?.classList.add('hidden');
    if(reflexStatus){
      reflexStatus.textContent = `Essai ${trialIndex+1}/${REFLEX_TRIALS} — Attendez le vert.`;
    }

    if(!target) return;

    // purge listeners safely
    target.className = "target";
    target.replaceWith(target.cloneNode(true));
    const t = document.querySelector('#target');

    // Phase 2: easier timing
    const delayMin = phase === 0 ? 900 : 650;
    const delayMax = phase === 0 ? 1900 : 1300;
    const delay = delayMin + Math.random()*(delayMax-delayMin);

    if(waitingTimeout) clearTimeout(waitingTimeout);

    let earlyClicks = 0;
    t.addEventListener('click', () => {
      if(!t.classList.contains('go')){
        earlyClicks++;
        if(phase === 1 && PHASE2_REFLEX_EASIER && earlyClicks <= 1){
          speak("Valentina Blaze", "Trop tôt 😄 Respire… attends le vert.");
          react("bad");
        } else if(phase === 0 && earlyClicks <= 1){
          speak("Dr. Gérard Poincaré", "Non. Ce n’était pas vert.");
          react("bad");
        }
      }
    });

    waitingTimeout = setTimeout(() => {
      t.classList.add('ready', 'go');
      goTime = performance.now();

      const greenLifetime = (phase === 0) ? 2200 : 3200;

      t.addEventListener('click', () => {
        const ms = performance.now() - goTime;
        reflexTimes[phase].push(ms);

        t.className = "target";
        const pretty = Math.round(ms);

        if(reflexStatus){
          reflexStatus.textContent = `Essai ${trialIndex+1}/${REFLEX_TRIALS} — Temps : ${pretty} ms`;
        }

        // Reaction threshold: Valentina makes it look better
        const goodReflex = ms < (phase === 0 ? 380 : 560);
        react(goodReflex ? "ok" : "bad");

        if(phase === 0){
          speak("Dr. Gérard Poincaré", `Mesure ${trialIndex+1}/${REFLEX_TRIALS} : ${pretty} ms. Notez votre… constance.`);
        } else {
          speak("Valentina Blaze", `${pretty} ms 😄 Propre ! Encore ${REFLEX_TRIALS-(trialIndex+1)}.`);
        }

        btnNext1?.classList.remove('hidden');
      }, { once: true });

      // auto-record if no click
      setTimeout(() => {
        if(t.classList.contains('go')){
          const fallback = phase === 0 ? 900 : 520;
          reflexTimes[phase].push(fallback);
          t.className = "target";

          if(reflexStatus){
            reflexStatus.textContent = `Essai ${trialIndex+1}/${REFLEX_TRIALS} — Mesure auto : ${fallback} ms`;
          }

          react(phase === 1 ? "ok" : "bad"); // Valentina "sauve" la mesure

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

  // ---------- MEMORY ----------
  function randDigits(n){
    let s = "";
    for(let i=0;i<n;i++) s += Math.floor(Math.random()*10);
    return s;
  }

  function memoryDigitsCount(){
    if(phase === 1 && PHASE2_MEMORY_EASIER) return 4;
    return 5;
  }

  function memoryDisplayMs(){
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

    phase2RetryArmed = (phase === 1);

    const n = memoryDigitsCount();
    digits = randDigits(n);
    if(digitsEl) digitsEl.textContent = digits;

    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? `Mémoire ${trialIndex+1}/${MEMORY_TRIALS}. ${n} chiffres. Pas de triche.`
        : `Mémoire ${trialIndex+1}/${MEMORY_TRIALS}. ${n} chiffres 😄 Je te laisse le temps.`
    );

    setTimeout(() => {
      if(digitsEl) digitsEl.textContent = "—";
      memoryInput?.classList.remove('hidden');
      digitsAnswer?.focus();
    }, memoryDisplayMs());
  }

  function softMatchPhase2(ans, truth){
    if(ans === truth) return true;
    if(ans.length === truth.length){
      let diff = 0;
      for(let i=0;i<ans.length;i++) if(ans[i] !== truth[i]) diff++;
      return diff <= 1;
    }
    if(ans.length === truth.length - 1) return true;
    return false;
  }

  btnCheck?.addEventListener('click', () => {
    const ans = (digitsAnswer?.value || "").trim();
    memoryAttemptsUsed[phase]++;

    if(phase === 1 && PHASE2_MEMORY_EASIER){
      const okSoft = softMatchPhase2(ans, digits);

      if(!okSoft && phase2RetryArmed){
        phase2RetryArmed = false;
        if(memoryStatus) memoryStatus.textContent = `🟡 Presque 😄 Réessaie (indice : ça finit par ${digits[digits.length-1]})`;
        speak("Valentina Blaze", `Presque 😄 Indice : ça finit par ${digits[digits.length-1]}. Retente !`);
        react("bad");
        digitsAnswer?.focus();
        return;
      }

      if(okSoft){
        memoryCorrect[phase] += 1;
        if(memoryStatus) memoryStatus.textContent = `✅ Correct (validé) — Essai ${trialIndex+1}/${MEMORY_TRIALS}`;
        speak("Valentina Blaze", "Parfait 😄 Tu vois ? C’est toi quand tu te mets bien.");
        react("ok");
      } else {
        if(memoryStatus) memoryStatus.textContent = `❌ Raté (c’était ${digits}) — Essai ${trialIndex+1}/${MEMORY_TRIALS}`;
        speak("Valentina Blaze", "Ok 😄 On s’en fiche. On continue.");
        react("bad");
      }
    } else {
      const ok = ans === digits;
      if(ok){
        memoryCorrect[phase] += 1;
        if(memoryStatus) memoryStatus.textContent = `✅ Correct — Essai ${trialIndex+1}/${MEMORY_TRIALS}`;
        speak("Dr. Gérard Poincaré", "Exact. Rare et satisfaisant.");
        react("ok");
      } else {
        if(memoryStatus) memoryStatus.textContent = `❌ Raté (c’était ${digits}) — Essai ${trialIndex+1}/${MEMORY_TRIALS}`;
        speak("Dr. Gérard Poincaré", "Non. Votre mémoire a pris un jour de RTT.");
        react("bad");
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

  // ---------- SELECTION / START ----------
  document.querySelectorAll('.choice').forEach(btn => {
    btn.addEventListener('click', () => {
      gender = btn.dataset.g || "N";

      sessionId = Math.floor(100000 + Math.random()*900000);
      if(hudSession) hudSession.textContent = `#${sessionId}`;

      // reset state
      phase = 0;
      module = "reflex";
      trialIndex = 0;

      reflexTimes = [[], []];
      memoryCorrect = [0, 0];
      memoryAttemptsUsed = [0, 0];

      // reset avatar images
      if(avatarScientist) avatarScientist.src = AVATAR_BASE.scientist;
      if(avatarCoach) avatarCoach.src = AVATAR_BASE.coach;

      setHUD("READY");
      setActiveCoachUI();

      if(speechTitleS) speechTitleS.textContent = "Dr. Gérard Poincaré";
      if(speechTextS)  speechTextS.textContent  = "Profil enregistré. Merci de rester… cohérent.";
      popSpeech(speechScientist);

      setupCoachScreen();
    });
  });

  btnStart?.addEventListener('click', () => {
    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? "Début de séquence. Réflexes ×3 puis mémoire ×3."
        : "On y retourne 😄 Réflexes ×3 puis mémoire ×3."
    );
    startPhase();
  });

  // ---------- SCORING ----------
  function scoreReflexPhase(avgMs, isPhase2){
    const base = 100 - (avgMs - 180)/6;
    const generous = isPhase2 ? base + 14 : base;
    return Math.round(clamp(generous, 10, 100));
  }

  function scoreMemoryPhase(correct, isPhase2){
    const pct = (correct / MEMORY_TRIALS) * 100;
    const generous = isPhase2 ? pct + 18 : pct;
    return Math.round(clamp(generous, 0, 100));
  }

  function finish(){
    setHUD("ANALYSIS");

    const avg1 = avg(reflexTimes[0]);
    const avg2 = avg(reflexTimes[1]);

    const reflex1 = scoreReflexPhase(avg1, false);
    const reflex2 = scoreReflexPhase(avg2, true);

    const mem1 = scoreMemoryPhase(memoryCorrect[0], false);
    const mem2 = scoreMemoryPhase(memoryCorrect[1], true);

    const reflexOverall = Math.round(0.35*reflex1 + 0.65*reflex2);
    const memoryOverall = Math.round(0.35*mem1 + 0.65*mem2);

    const logicBase = 80 + Math.random()*12;
    const logicOverall = Math.round(clamp(logicBase + (reflex2 - reflex1)*0.05 + (mem2 - mem1)*0.04, 70, 99));

    const deltaReflex = reflex2 - reflex1;
    const deltaMem = mem2 - mem1;

    const raw = 200 + (deltaReflex*9) + (deltaMem*7) + Math.random()*120;
    const sexism = Math.round(clamp(raw, 120, 999));

    const label = sexism > 800 ? "niveau « tonton au barbecue »" :
                  sexism > 520 ? "niveau « humour de vestiaire »" :
                                 "niveau « léger mais perfectible »";

    if(rReflex) rReflex.textContent = `${reflexOverall}/100`;
    if(rMemory) rMemory.textContent = `${memoryOverall}/100`;
    if(rLogic)  rLogic.textContent  = `${logicOverall}/100`;
    if(rSexism) rSexism.textContent = `${sexism}%`;

    const gtxt = gender === "H" ? "Monsieur" : gender === "F" ? "Madame" : "Vous";
    if(finalJoke){
      finalJoke.textContent = `${gtxt}, verdict : ${label}. (Ne pas présenter ceci à un comité d’éthique 😄)`;
    }

    // Force phase 2 on results
    phase = 1;
    setActiveCoachUI();
    speak(
      "Valentina Blaze",
      `Regarde 😄 Phase 2 : +${Math.max(0, Math.round(deltaReflex))} pts réflexes, +${Math.max(0, Math.round(deltaMem))} pts mémoire. Coïncidence ? 😄`
    );
    react("ok");

    show('result');
  }

  // ---------- RESTART / COPY ----------
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

    if(avatarScientist) avatarScientist.src = AVATAR_BASE.scientist;
    if(avatarCoach) avatarCoach.src = AVATAR_BASE.coach;

    setActiveCoachUI();
    speak("Dr. Gérard Poincaré", "Réinitialisation. Merci de revenir avec un cerveau frais.");
    show('intro');
  });

  btnCopy?.addEventListener('click', async () => {
    const text =
      `NEUROCOG LAB — Réflexes ${rReflex?.textContent || "?"}, Mémoire ${rMemory?.textContent || "?"}, Logique ${rLogic?.textContent || "?"}, Indice ${rSexism?.textContent || "?"}.`;
    try{
      await navigator.clipboard.writeText(text);
      speak(phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze", "Verdict copié. Diffusion ‘scientifique’ recommandée.");
      react("ok");
    } catch(e){
      speak(phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze", "Copie impossible. Recopie manuelle, style 1998.");
      react("bad");
    }
  });

  // Boot
  setHUD("READY");
  setActiveCoachUI();
});
