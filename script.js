document.addEventListener('DOMContentLoaded', () => {
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

  let gender = "N";
  let phase  = 0; // 0 = Dr, 1 = Valentina
  let sessionId = 0;

  let reflexTimes = [];
  let memoryScore = 0;

  let goTime = 0;
  let waitingTimeout = null;
  let digits = "";

  function show(name){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function setHUD(status){
    if (hudStatus) hudStatus.textContent = status;
  }

  function popSpeech(el){
    el?.animate?.(
      [{ transform:'translateY(0)', opacity:0.85 }, { transform:'translateY(-2px)', opacity:1 }, { transform:'translateY(0)', opacity:0.95 }],
      { duration: 240, easing: 'ease-out' }
    );
  }

  function setActiveCoachUI(){
    if (!panelScientist || !panelCoach) {
      console.warn("Panels introuvables: #panelScientist / #panelCoach");
      return;
    }

    if (phase === 0){
      panelScientist.classList.add('active');
      panelCoach.classList.remove('active');
    } else {
      panelCoach.classList.add('active');
      panelScientist.classList.remove('active');
    }

    // Debug visuel en console
    console.log("Phase=", phase, "Scientist active=", panelScientist.classList.contains('active'),
                "Coach active=", panelCoach.classList.contains('active'));
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

  function setupCoachScreen(){
    setActiveCoachUI();

    if (coachBrief) {
      coachBrief.textContent =
        phase === 0
          ? "Protocole NCX-17. Phase 1 : calibration des réflexes et de la mémoire. Aucune approximation n’est tolérée."
          : "Phase 2 : revalidation sous stimulus motivationnel renforcé. (Oui, c’est très scientifique.)";
    }
    setHUD(phase === 0 ? "CALIBRATION" : "REVALIDATION");

    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? "Je prends la main. Nous allons mesurer vos performances sans flatter votre ego."
        : "Coucou 😄 Maintenant c’est moi. Même test, mais en mode turbo-focus."
    );

    show('coach');
  }

  document.querySelectorAll('.choice').forEach(btn => {
    btn.addEventListener('click', () => {
      gender = btn.dataset.g || "N";
      sessionId = Math.floor(100000 + Math.random() * 900000);
      if (hudSession) hudSession.textContent = `#${sessionId}`;

      phase = 0;
      reflexTimes = [];
      memoryScore = 0;

      setHUD("READY");
      setActiveCoachUI();

      if (speechTitleS) speechTitleS.textContent = "Dr. Gérard Poincaré";
      if (speechTextS)  speechTextS.textContent  = "Profil enregistré. Passons au protocole.";
      popSpeech(speechScientist);

      show('coach');
      setupCoachScreen();
    });
  });

  btnStart?.addEventListener('click', () => {
    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? "Module A. Cliquez uniquement au signal vert."
        : "Go 😄 Dès que c’est vert tu cliques !"
    );
    startReflex();
  });

  function startReflex(){
    if (reflexStatus) reflexStatus.textContent = "Préparez-vous…";
    btnNext1?.classList.add('hidden');

    if (!target) return;

    target.className = "target";
    target.replaceWith(target.cloneNode(true));
    const newTarget = document.querySelector('#target');

    setHUD("REFLEX");
    show('reflex');

    const delay = 850 + Math.random() * 1700;
    if (waitingTimeout) clearTimeout(waitingTimeout);

    waitingTimeout = setTimeout(() => {
      newTarget.classList.add('ready', 'go');
      newTarget.addEventListener('click', onClickTarget, { once: true });
      goTime = performance.now();
    }, delay);

    function onClickTarget(){
      const t = performance.now() - goTime;
      reflexTimes.push(t);
      newTarget.className = "target";

      const pretty = Math.round(t);
      if (reflexStatus) reflexStatus.textContent = `Temps : ${pretty} ms`;

      speak(
        phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
        phase === 0
          ? `Mesure acquise : ${pretty} ms. Acceptable.`
          : `${pretty} ms ! Nice 😄`
      );

      btnNext1?.classList.remove('hidden');
    }
  }

  btnNext1?.addEventListener('click', () => startMemory());

  function randDigits(n=5){
    let s = "";
    for(let i=0;i<n;i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  function startMemory(){
    setHUD("MEMORY");
    show('memory');

    if (memoryStatus) memoryStatus.textContent = "";
    btnNext2?.classList.add('hidden');
    memoryInput?.classList.add('hidden');
    if (digitsAnswer) digitsAnswer.value = "";

    digits = randDigits(5);
    if (digitsEl) digitsEl.textContent = digits;

    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? "Retenez la suite. Sans tricher."
        : "Regarde… imprime… retape 😄"
    );

    setTimeout(() => {
      if (digitsEl) digitsEl.textContent = "—";
      memoryInput?.classList.remove('hidden');
      digitsAnswer?.focus();
    }, 1300);
  }

  btnCheck?.addEventListener('click', () => {
    const ans = (digitsAnswer?.value || "").trim();
    const ok = ans === digits;
    memoryScore += ok ? 1 : 0;

    if (memoryStatus) memoryStatus.textContent = ok ? "✅ Correct" : `❌ Raté (c’était ${digits})`;

    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      ok ? "Bien." : "Aïe."
    );

    btnNext2?.classList.remove('hidden');
  });

  btnNext2?.addEventListener('click', () => {
    if(phase === 0){
      // 🔥 Basculement phase 2 IMMEDIAT (photo changée)
      phase = 1;
      setActiveCoachUI();
      setupCoachScreen();
      return;
    }
    finish();
  });

  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }

  function finish(){
    setHUD("ANALYSIS");

    const avg = reflexTimes.reduce((a,b)=>a+b,0) / reflexTimes.length;
    const reflexScore = Math.round(clamp(100 - (avg - 180) / 6, 10, 100));
    const memScore = Math.round((memoryScore / 2) * 100);
    const logicScore = Math.round(82 + Math.random() * 15);

    const sexism = Math.round(120 + (Math.random() * 900));
    const label = sexism > 700 ? "niveau « tonton au barbecue »" :
                  sexism > 400 ? "niveau « humour de vestiaire »" :
                                 "niveau « léger mais perfectible »";

    rReflex.textContent = `${reflexScore}/100`;
    rMemory.textContent = `${memScore}/100`;
    rLogic.textContent  = `${logicScore}/100`;
    rSexism.textContent = `${sexism}%`;

    const gtxt = gender === "H" ? "Monsieur" : gender === "F" ? "Madame" : "Vous";
    finalJoke.textContent = `${gtxt}, verdict : ${label}. (Spoiler : c’est une blague 😄)`;

    // Assure la visibilité Valentina sur la page résultat (phase 2)
    phase = 1;
    setActiveCoachUI();
    speak("Valentina Blaze", "Voilà 😄 Résultat scientifique garanti 100% à vue de nez.");
    show('result');
  }

  btnRestart?.addEventListener('click', () => {
    setHUD("READY");
    hudSession.textContent = "#—";
    gender = "N";
    phase = 0;
    reflexTimes = [];
    memoryScore = 0;

    setActiveCoachUI();
    speak("Dr. Gérard Poincaré", "Réinitialisation. Merci de revenir avec un cerveau frais.");
    show('intro');
  });

  btnCopy?.addEventListener('click', async () => {
    const text = `NEUROCOG LAB — Réflexes ${rReflex?.textContent || "?"}, Mémoire ${rMemory?.textContent || "?"}, Logique ${rLogic?.textContent || "?"}, Indice ${rSexism?.textContent || "?"}.`;
    try{
      await navigator.clipboard.writeText(text);
      speak(phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze", "Verdict copié. Diffusion recommandée 😄");
    } catch(e){
      speak(phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze", "Copie impossible. Recopie manuelle, style 1998.");
    }
  });

  // Boot
  setHUD("READY");
  setActiveCoachUI();
});
