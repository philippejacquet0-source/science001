const screens = {
  intro: document.querySelector('#screen-intro'),
  coach: document.querySelector('#screen-coach'),
  reflex: document.querySelector('#screen-reflex'),
  memory: document.querySelector('#screen-memory'),
  result: document.querySelector('#screen-result'),
};

const hudStatus = document.querySelector('#hudStatus');
const hudSession = document.querySelector('#hudSession');

const coachBrief = document.querySelector('#coachBrief');
const btnStart = document.querySelector('#btnStart');

const target = document.querySelector('#target');
const reflexStatus = document.querySelector('#reflexStatus');
const btnNext1 = document.querySelector('#btnNext1');

const digitsEl = document.querySelector('#digits');
const memoryInput = document.querySelector('#memoryInput');
const digitsAnswer = document.querySelector('#digitsAnswer');
const btnCheck = document.querySelector('#btnCheck');
const memoryStatus = document.querySelector('#memoryStatus');
const btnNext2 = document.querySelector('#btnNext2');

const rReflex = document.querySelector('#rReflex');
const rMemory = document.querySelector('#rMemory');
const rLogic = document.querySelector('#rLogic');
const rSexism = document.querySelector('#rSexism');
const finalJoke = document.querySelector('#finalJoke');
const btnRestart = document.querySelector('#btnRestart');
const btnCopy = document.querySelector('#btnCopy');

const cardScientist = document.querySelector('#cardScientist');
const cardCoach = document.querySelector('#cardCoach');

const speechTitle = document.querySelector('#speechTitle');
const speechText = document.querySelector('#speechText');

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
  hudStatus.textContent = status;
}

function speak(who, text){
  speechTitle.textContent = who;
  speechText.textContent = text;

  // micro animation “vivant”
  const el = document.querySelector('.speech');
  el.animate(
    [{ transform: 'translateY(0)', opacity: 0.85 }, { transform: 'translateY(-2px)', opacity: 1 }, { transform: 'translateY(0)', opacity: 0.95 }],
    { duration: 240, easing: 'ease-out' }
  );
}

function setActiveCoach(){
  if(phase === 0){
    cardScientist.classList.add('active');
    cardCoach.classList.remove('active');
    speak("Dr. Gérard Poincaré", "Initialisation… Je vous prie de garder votre dignité et votre temps de réaction sous contrôle.");
  } else {
    cardCoach.classList.add('active');
    cardScientist.classList.remove('active');
    speak("Valentina Blaze", "Ok champion 😄 On refait pareil, mais en mode turbo-focus. Tu vas tout détruire.");
  }
}

function setupCoachScreen(){
  if(phase === 0){
    coachBrief.textContent = "Protocole NCX-17. Phase 1 : calibration des réflexes et de la mémoire. Aucune approximation n’est tolérée.";
    setHUD("CALIBRATION");
  } else {
    coachBrief.textContent = "Phase 2 : revalidation sous stimulus motivational renforcé. (Oui, c’est très scientifique.)";
    setHUD("REVALIDATION");
  }
  setActiveCoach();
  show('coach');
}

document.querySelectorAll('.choice').forEach(btn => {
  btn.addEventListener('click', () => {
    gender = btn.dataset.g;

    sessionId = Math.floor(100000 + Math.random()*900000);
    hudSession.textContent = `#${sessionId}`;

    phase = 0;
    reflexTimes = [];
    memoryScore = 0;

    setHUD("READY");
    speak("Système", "Sélection enregistrée. Injection de sérieux… en cours.");
    setupCoachScreen();
  });
});

btnStart.addEventListener('click', () => {
  speak(phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
        phase === 0
          ? "Module A. Cliquez uniquement au signal vert. Toute précipitation sera… notée."
          : "Go ! Dès que c’est vert tu cliques. Facile. Respire. Focus 😄");
  startReflex();
});

function startReflex(){
  reflexStatus.textContent = "Préparez-vous…";
  btnNext1.classList.add('hidden');
  target.className = "target";
  target.removeEventListener('click', onClickTarget);

  setHUD("REFLEX");
  show('reflex');

  const delay = 850 + Math.random()*1700;

  if(waitingTimeout) clearTimeout(waitingTimeout);
  waitingTimeout = setTimeout(() => {
    target.classList.add('ready', 'go');
    target.addEventListener('click', onClickTarget, { once: true });
    goTime = performance.now();
  }, delay);
}

function onClickTarget(){
  const t = performance.now() - goTime;
  reflexTimes.push(t);

  target.className = "target";
  const pretty = Math.round(t);

  reflexStatus.textContent = `Temps : ${pretty} ms`;

  if(phase === 0){
    speak("Dr. Gérard Poincaré", `Mesure acquise : ${pretty} ms. C’est… acceptable. Passons au module mémoire.`);
  } else {
    speak("Valentina Blaze", `${pretty} ms ! Nice. Tu vois ? Quand tu veux 😄 Module mémoire, go.`);
  }

  btnNext1.classList.remove('hidden');
}

btnNext1.addEventListener('click', () => {
  startMemory();
});

function randDigits(n=5){
  let s = "";
  for(let i=0;i<n;i++) s += Math.floor(Math.random()*10);
  return s;
}

function startMemory(){
  setHUD("MEMORY");
  show('memory');

  memoryStatus.textContent = "";
  btnNext2.classList.add('hidden');
  memoryInput.classList.add('hidden');
  digitsAnswer.value = "";

  digits = randDigits(5);
  digitsEl.textContent = digits;

  speak(phase === 0 ? "Dr. Gérard Poincaré" : "Valentina Blaze",
        phase === 0
          ? "Retenez la suite. Le cerveau est une machine : on la nourrit avec des chiffres."
          : "OK tu regardes… tu imprimes… et tu retapes. Je crois en toi 😄");

  setTimeout(() => {
    digitsEl.textContent = "—";
    memoryInput.classList.remove('hidden');
    digitsAnswer.focus();
  }, 1300);
}

btnCheck.addEventListener('click', () => {
  const ans = (digitsAnswer.value || "").trim();
  const ok = ans === digits;
  memoryScore += ok ? 1 : 0;

  memoryStatus.textContent = ok ? "✅ Correct" : `❌ Raté (c’était ${digits})`;

  if(phase === 0){
    speak("Dr. Gérard Poincaré", ok ? "Exact. Vos synapses coopèrent." : "Non. Vos synapses ont pris un café sans vous.");
  } else {
    speak("Valentina Blaze", ok ? "Yesss 😄 Propre !" : "Aïe 😄 c’est pas grave, on enchaîne !");
  }

  btnNext2.classList.remove('hidden');
});

btnNext2.addEventListener('click', () => {
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

  rReflex.textContent = `${reflexScore}/100`;
  rMemory.textContent = `${memScore}/100`;
  rLogic.textContent  = `${logicScore}/100`;
  rSexism.textContent = `${sexism}%`;

  const gtxt = gender === "H" ? "Monsieur" : gender === "F" ? "Madame" : "Vous";
  finalJoke.textContent = `${gtxt}, verdict : ${label}. (Spoiler : c’est une blague 😄)`;

  // Dernière réplique
  speak("Système", "Calcul terminé. Impression de crédibilité : 100%. Interprétation scientifique : …aucune 😄");

  show('result');
}

btnRestart.addEventListener('click', () => {
  setHUD("READY");
  hudSession.textContent = "#—";
  speak("Système", "Réinitialisation complète. Retour au panneau de contrôle.");
  show('intro');
});

btnCopy.addEventListener('click', async () => {
  const text = `NEUROCOG LAB — Verdict: Réflexes ${rReflex.textContent}, Mémoire ${rMemory.textContent}, Logique ${rLogic.textContent}, Indice de sexisme ${rSexism.textContent}.`;
  try{
    await navigator.clipboard.writeText(text);
    speak("Système", "Verdict copié dans le presse-papiers. Diffusion virale recommandée.");
  } catch(e){
    speak("Système", "Impossible de copier (permissions navigateur). Mais tu peux le recopier à la main, comme en 1998.");
  }
});
