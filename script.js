document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel) => document.querySelector(sel);

  const screens = {
    intro: $('#screen-intro'),
    coach: $('#screen-coach'),
    reflex: $('#screen-reflex'),
    memory: $('#screen-memory'),
    result: $('#screen-result'),
  };

  // Si un écran manque, on stoppe avec un message clair
  if (!screens.intro || !screens.coach || !screens.reflex || !screens.memory || !screens.result) {
    console.error("Screens manquants : vérifie les IDs #screen-* dans index.html");
    return;
  }

  const hudStatus = $('#hudStatus');
  const hudSession = $('#hudSession');

  const coachBrief = $('#coachBrief');
  const btnStart = $('#btnStart');

  const target = $('#target');
  const reflexStatus = $('#reflexStatus');
  const btnNext1 = $('#btnNext1');

  const digitsEl = $('#digits');
  const memoryInput = $('#memoryInput');
  const digitsAnswer = $('#digitsAnswer');
  const btnCheck = $('#btnCheck');
  const memoryStatus = $('#memoryStatus');
  const btnNext2 = $('#btnNext2');

  const rReflex = $('#rReflex');
  const rMemory = $('#rMemory');
  const rLogic = $('#rLogic');
  const rSexism = $('#rSexism');
  const finalJoke = $('#finalJoke');
  const btnRestart = $('#btnRestart');
  const btnCopy = $('#btnCopy');

  const cardScientist = $('#cardScientist');
  const cardCoach = $('#cardCoach');

  const speechTitle = $('#speechTitle');
  const speechText = $('#speechText');

  // Garde-fous : si un élément critique manque, on log au lieu de crasher.
  const required = [
    ['hudStatus', hudStatus], ['hudSession', hudSession],
    ['coachBrief', coachBrief], ['btnStart', btnStart],
    ['target', target], ['reflexStatus', reflexStatus], ['btnNext1', btnNext1],
    ['digits', digitsEl], ['memoryInput', memoryInput], ['digitsAnswer', digitsAnswer],
    ['btnCheck', btnCheck], ['memoryStatus', memoryStatus], ['btnNext2', btnNext2],
    ['rReflex', rReflex], ['rMemory', rMemory], ['rLogic', rLogic], ['rSexism', rSexism],
    ['finalJoke', finalJoke], ['btnRestart', btnRestart], ['btnCopy', btnCopy],
    ['cardScientist', cardScientist], ['cardCoach', cardCoach],
    ['speechTitle', speechTitle], ['speechText', speechText],
  ];
  const missing = required.filter(([, el]) => !el).map(([name]) => name);
  if (missing.length) {
    console.error("IDs manquants dans index.html :", missing);
    // On continue quand même, mais certaines fonctions seront limitées.
  }

  let gender = "N";
  let phase = 0;        // 0 = chercheur, 1 = coach
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

  function speak(who, text){
    if (speechTitle) speechTitle.textContent = who;
    if (speechText) speechText.textContent = text;

    const el = document.querySelector('.speech');
    if (el && el.animate) {
      el.animate(
        [{ transform: 'translateY(0)', opacity: 0.85 }, { transform: 'translateY(-2px)', opacity: 1 }, { transform: 'translateY(0)', opacity: 0.95 }],
        { duration: 240, easing: 'ease-out' }
      );
    }
  }

  function setActiveCoach(){
    if (phase === 0){
      cardScientist?.classList.add('active');
      cardCoach?.classList.remove('active');
      speak("Dr. Gérard Poincaré", "Initialisation… Gardez votre dignité et votre temps de réaction sous contrôle.");
    } else {
      cardCoach?.classList.add('active');
      cardScientist?.classList.remove('active');
      speak("Valentina Blaze", "Ok champion 😄 On refait pareil, mais en mode turbo-focus. Tu vas tout détruire.");
    }
  }

  function setupCoachScreen(){
    if (coachBrief) {
      coachBrief.textContent =
        phase === 0
          ? "Protocole NCX-17. Phase 1 : calibration des réflexes et de la mémoire. Aucune approximation n’est tolérée."
          : "Phase 2 : revalidation sous stimulus motivational renforcé. (Oui, c’est très scientifique.)";
    }

    setHUD(phase === 0 ? "CALIBRATION" : "REVALIDATION");
    setActiveCoach();
    show('coach');
  }

  // Bind choix H/F/N
  document.querySelectorAll('.choice').forEach(btn => {
    btn.addEventListener('click', () => {
      gender = btn.dataset.g || "N";
      sessionId = Math.floor(100000 + Math.random()*900000);
      if (hudSession) hudSession.textContent = `#${sessionId}`;

      phase = 0;
      reflexTimes = [];
      memoryScore = 0;

      setHUD("READY");
      speak("Système", "Sélection enregistrée. Injection de sérieux… en cours.");
      setupCoachScreen();
    });
  });

  btnStart?.addEventListener('click', () => {
    speak(
      phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
      phase === 0
        ? "Module A. Cliquez uniquement au signal vert. Toute précipitation sera notée."
        : "Go ! Dès que c’est vert tu cliques. Respire. Focus 😄"
    );
    startReflex();
  });

  function startReflex(){
    if (reflexStatus) reflexStatus.textContent = "Préparez-vous…";
    btnNext1?.classList.add('hidden');

    if (!target) return;

    target.className = "target";
    target.replaceWith(target.cloneNode(true)); // retire les anciens listeners
    const newTarget = $('#target');

    setHUD("REFLEX");
    show('reflex');

    const delay = 850 + Math.random()*1700;

    if(waitingTimeout) clearTimeout(waitingTimeout);
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

      if(phase === 0){
        speak("Dr. Gérard Poincaré", `Mesure acquise : ${pretty} ms. Acceptable. Passons au module mémoire.`);
      } else {
        speak("Valentina Blaze", `${pretty} ms ! Nice 😄 Module mémoire, go.`);
      }

      btnNext1?.classList.remove('hidden');
    }
  }

  btnNext1?.addEventListener('click', () => startMemory());

  function randDigits(n=5){
    let s = "";
    for(let i=0;i<n;i++) s += Math.floor(Math.random()*10);
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
      phase === 0 ? "Retenez la suite. Le cerveau est une machine : on la nourrit avec des chiffres."
                : "Tu regardes… tu imprimes… et tu retapes 😄"
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

    if(phase === 0){
      speak("Dr. Gérard Poincaré", ok ? "Exact. Vos synapses coopèrent." : "Non. Vos synapses ont pris un café sans vous.");
    } else {
      speak("Valentina Blaze", ok ? "Yess 😄 Propre !" : "Aïe 😄 pas grave, on enchaîne !");
    }

    btnNext2?.classList.remove('hidden');
  });

  btnNext2?.addEventListener('click', () => {
    if(phase === 0){
      phase = 1;
      setupCoachScreen();
    } else {
      finish();
    }
  });

  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }

  function finish(){
    setHUD("ANALYSIS");

    const avg = reflexTimes.reduce((a,b)=>a+b,0)/reflexTimes.length;
    const reflexScore = Math.round(clamp(100 - (avg-180)/6, 10, 100));
    const memScore = Math.round((memoryScore/2)*100);
    const logicScore = Math.round(82 + Math.random()*15);

    const sexism = Math.round(120 + (Math.random()*900));
    const label = sexism > 700 ? "niveau « tonton au barbecue »" :
                  sexism > 400 ? "niveau « humour de vestiaire »" :
                                 "niveau « léger mais perfectible »";

    if (rReflex) rReflex.textContent = `${reflexScore}/100`;
    if (rMemory) rMemory.textContent = `${memScore}/100`;
    if (rLogic)  rLogic.textContent  = `${logicScore}/100`;
    if (rSexism) rSexism.textContent = `${sexism}%`;

    const gtxt = gender === "H" ? "Monsieur" : gender === "F" ? "Madame" : "Vous";
    if (finalJoke) finalJoke.textContent = `${gtxt}, verdict : ${label}. (Spoiler : c’est une blague 😄)`;

    speak("Système", "Calcul terminé. Crédibilité : 100%. Interprétation scientifique : …aucune 😄");
    show('result');
  }

  btnRestart?.addEventListener('click', () => {
    setHUD("READY");
    if (hudSession) hudSession.textContent = "#—";
    speak("Système", "Réinitialisation complète. Retour au panneau de contrôle.");
    show('intro');
  });

  btnCopy?.addEventListener('click', async () => {
    const text = `NEUROCOG LAB — Verdict: Réflexes ${rReflex?.textContent || "?"}, Mémoire ${rMemory?.textContent || "?"}, Logique ${rLogic?.textContent || "?"}, Indice de sexisme ${rSexism?.textContent || "?"}.`;
    try{
      await navigator.clipboard.writeText(text);
      speak("Système", "Verdict copié. Diffusion virale recommandée.");
    } catch(e){
      speak("Système", "Copie impossible (permissions). Copie manuelle style 1998.");
    }
  });

  // Boot message
  speak("Système", "Portail initialisé. Sélectionnez un profil pour démarrer.");
  setHUD("READY");
});
