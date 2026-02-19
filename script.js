const screens = {
  intro: document.querySelector('#screen-intro'),
  coach: document.querySelector('#screen-coach'),
  reflex: document.querySelector('#screen-reflex'),
  memory: document.querySelector('#screen-memory'),
  result: document.querySelector('#screen-result'),
};

const coachTitle = document.querySelector('#coachTitle');
const coachText  = document.querySelector('#coachText');
const avatar     = document.querySelector('#avatar');

const btnStart   = document.querySelector('#btnStart');
const target     = document.querySelector('#target');
const reflexStatus = document.querySelector('#reflexStatus');
const btnNext1   = document.querySelector('#btnNext1');

const digitsEl   = document.querySelector('#digits');
const memoryInput = document.querySelector('#memoryInput');
const digitsAnswer = document.querySelector('#digitsAnswer');
const btnCheck   = document.querySelector('#btnCheck');
const memoryStatus = document.querySelector('#memoryStatus');
const btnNext2   = document.querySelector('#btnNext2');

const rReflex = document.querySelector('#rReflex');
const rMemory = document.querySelector('#rMemory');
const rLogic  = document.querySelector('#rLogic');
const rSexism = document.querySelector('#rSexism');
const finalJoke = document.querySelector('#finalJoke');
const btnRestart = document.querySelector('#btnRestart');

let gender = "N";
let phase = 0; // 0 coach1, 1 coach2

let reflexTimes = [];
let memoryScore = 0;

let goTime = 0;
let waitingTimeout = null;
let digits = "";

function show(name){
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

document.querySelectorAll('.choice').forEach(btn => {
  btn.addEventListener('click', () => {
    gender = btn.dataset.g;
    phase = 0;
    reflexTimes = [];
    memoryScore = 0;
    setupCoach();
    show('coach');
  });
});

function setupCoach(){
  if(phase === 0){
    coachTitle.textContent = "Coach 1 : Chercheur";
    coachText.textContent  = "Bonjour. Nous allons évaluer vos réflexes et votre mémoire. Restez concentré.";
    avatar.style.filter = "saturate(0.8)";
  } else {
    coachTitle.textContent = "Coach 2 : Coach";
    coachText.textContent  = "Super ! On refait les mêmes exercices. Vous allez tout exploser 😄";
    avatar.style.filter = "saturate(1.3)";
  }
}

btnStart.addEventListener('click', () => {
  startReflex();
});

function startReflex(){
  reflexStatus.textContent = "Préparez-vous…";
  btnNext1.classList.add('hidden');
  target.className = "target";
  target.removeEventListener('click', onClickTarget);

  show('reflex');

  // délai aléatoire
  const delay = 800 + Math.random()*1600;

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

  target.className = "target"; // reset red
  const pretty = Math.round(t);

  reflexStatus.textContent = `Temps : ${pretty} ms`;
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
  show('memory');
  memoryStatus.textContent = "";
  btnNext2.classList.add('hidden');
  memoryInput.classList.add('hidden');
  digitsAnswer.value = "";

  digits = randDigits(5);
  digitsEl.textContent = digits;

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
  btnNext2.classList.remove('hidden');
});

btnNext2.addEventListener('click', () => {
  // Deux phases, deux tours
  if(phase === 0){
    phase = 1;
    setupCoach();
    show('coach');
  } else {
    finish();
  }
});

function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }

function finish(){
  // Score réflexes : basé sur moyenne ms
  const avg = reflexTimes.reduce((a,b)=>a+b,0)/reflexTimes.length;
  const reflexScore = Math.round(clamp(100 - (avg-180)/6, 10, 100));

  // Score mémoire sur 2 essais
  const memScore = Math.round((memoryScore/2)*100);

  // Score logique : fake mais plausible
  const logicScore = Math.round(82 + Math.random()*15);

  // Indice sexisme : volontairement absurde
  const sexism = Math.round(120 + (Math.random()*900));
  const label = sexism > 700 ? "niveau 'tonton au barbecue'" :
                sexism > 400 ? "niveau 'humour de vestiaire'" :
                               "niveau 'léger mais perfectible'";

  rReflex.textContent = `${reflexScore}/100`;
  rMemory.textContent = `${memScore}/100`;
  rLogic.textContent  = `${logicScore}/100`;
  rSexism.textContent = `${sexism}%`;

  const gtxt = gender === "H" ? "Monsieur" : gender === "F" ? "Madame" : "Vous";
  finalJoke.textContent = `${gtxt}, verdict : ${label}. (Ceci est une blague, respirez 😄)`;

  show('result');
}

btnRestart.addEventListener('click', () => {
  show('intro');
});
