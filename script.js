/* ============================================================
   configuration — edit these placeholders
   ============================================================ */

const CONFIG = {
  WEB3FORMS_ACCESS_KEY: '9dc31995-abfd-4b42-be06-4c5b648103ee',

  INTRO_FADE_DURATION: 2200,
  INTRO_DELAY_BETWEEN_LINES: 2900,
  INTRO_DELAY_BEFORE_HINT: 1700,

  INTRO_LINES: [
    'ჩემს ცხოვრებაში ორი ადამიანი შემხვედრია რომელმაც ჩემი შეხედულებები არა მხოლოდ გაიგო, არამედ იგრძნო და გაიაზრა.',
    'აქედან ერთი სანდროა, პირველი კი შენ ხარ.',
    'არ ვცდილობ არანაირი მიზნის მიღწევას ამ საუბრით, უფრო ჩემს გრძნობებს გიზიარებ.',
    'ერთი რამ რაც ძნელი გზით ვისწავლე,',
    'ის არის, რომ თუ ტვინი ისაა რითაც გზას იკვლევ, მაშინ გული ისაა რაც ძალას გაძლევს რომ იარო.'
  ],

  QUESTIONS: [
    'რატომ დამთანხმდი ამაზე?',
    'გარედან ძალიან შეიცვალე, შიგნით ისევ იგივეა?',
    'ისევ გაქვს შენი ოცნებები და მიზნები?'
  ],

  SONGS: [
    { id: 'uTen4lcHVAo', title: 'Deftones - Passenger' },
    { id: '1UN7uSflwqw', title: 'Sum 41 - Thanks For Nothing' },
    { id: 'FChMHEfzOLI', title: 'KoRn - Got the Life' },
    { id: 'Iqlzoz_jH3c', title: 'U2 - Sunday Bloody Sunday' },
    { id: 'hjlNzuB-cNQ', title: 'typeonegative - I Don\'t Wanna Be Me' }
  ]
};

/* ============================================================
   state
   ============================================================ */

const state = {
  currentScene: 'intro',
  questionIndex: 0,
  answers: [],
  songIndex: 0
};

/* ============================================================
   helpers
   ============================================================ */

const $ = (sel) => document.querySelector(sel);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function showScene(id) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('is-active'));
  const target = document.getElementById('scene-' + id);
  if (target) target.classList.add('is-active');
  state.currentScene = id;
}

/* ============================================================
   scene 1 — intro
   ============================================================ */

async function runIntro() {
  const container = $('#introLines');
  container.innerHTML = '';

  // apply the configured fade duration to each line's transition
  // (overrides the CSS default so config wins)
  for (const line of CONFIG.INTRO_LINES) {
    const p = document.createElement('p');
    p.className = 'line';
    p.style.transitionDuration = CONFIG.INTRO_FADE_DURATION + 'ms';
    p.textContent = line;
    container.appendChild(p);
    // force reflow so the transition runs
    void p.offsetWidth;
    p.classList.add('is-visible');
    await sleep(CONFIG.INTRO_DELAY_BETWEEN_LINES);
  }

  await sleep(CONFIG.INTRO_DELAY_BEFORE_HINT);
  $('#introHint').classList.add('is-visible');
}

function bindIntroAdvance() {
  const intro = $('#scene-intro');
  intro.addEventListener('click', () => {
    // only advance once all lines have been shown
    if (intro.querySelectorAll('.line.is-visible').length < CONFIG.INTRO_LINES.length) return;
    showScene('questions');
    renderQuestion();
  });
}

/* ============================================================
   scene 2 — questions
   ============================================================ */

function renderQuestion() {
  const i = state.questionIndex;
  const total = CONFIG.QUESTIONS.length;
  $('#qCounter').textContent =
    String(i + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');

  // re-trigger the entrance animation
  const qText = $('#qText');
  qText.style.animation = 'none';
  void qText.offsetWidth;
  qText.textContent = CONFIG.QUESTIONS[i];
  qText.style.animation = '';

  const input = $('#qInput');
  input.value = state.answers[i] || '';
  input.focus();

  // button label on the last question
  $('#qNext').textContent = (i === total - 1) ? 'გაგზავნა' : 'მომდევნო';

  $('#qStatus').textContent = '';
  $('#qStatus').className = 'q-status';
}

async function submitToWeb3Forms(payload) {
  const body = Object.assign(
    {
      access_key: CONFIG.WEB3FORMS_ACCESS_KEY,
      from_name: 'her answers'
    },
    payload
  );

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function handleQuestionNext() {
  const input = $('#qInput');
  const value = input.value.trim();

  if (!value) {
    const status = $('#qStatus');
    status.textContent = 'თქვი რაიმე, არ აქვს მნიშვნელობა რა';
    status.className = 'q-status is-error';
    input.focus();
    return;
  }

  state.answers[state.questionIndex] = value;

  const btn = $('#qNext');
  const status = $('#qStatus');

  if (state.questionIndex < CONFIG.QUESTIONS.length - 1) {
    state.questionIndex++;
    renderQuestion();
    return;
  }

  // last question — submit
  btn.disabled = true;
  btn.textContent = 'იგზავნება...';
  status.textContent = '';
  status.className = 'q-status';

  try {
    // fail-open: even if web3forms key isn't set, still let her move on
    const data = await submitToWeb3Forms({
      subject: 'answers — from the site',
      q1: CONFIG.QUESTIONS[0],
      a1: state.answers[0] || '(no answer)',
      q2: CONFIG.QUESTIONS[1],
      a2: state.answers[1] || '(no answer)',
      q3: CONFIG.QUESTIONS[2],
      a3: state.answers[2] || '(no answer)'
    });
    status.textContent = 'გაიგზავნა';
    status.className = 'q-status is-success';
  } catch (err) {
    // network error — don't punish her for it
    status.textContent = 'გაიგზავნა';
    status.className = 'q-status is-success';
  }

  await sleep(1100);
  showScene('music');
  resetMusicScene();
}

/* ============================================================
   scene 3 — music
   ============================================================ */

function resetMusicScene() {
  $('#musicPrompt').hidden = false;
  $('#musicPlayer').hidden = true;
  $('#mNext').hidden = true;
  $('#mFinish').hidden = true;
  // stop any playing video
  $('#ytPlayer').src = '';
  state.songIndex = 0;
}

function playSongAt(i) {
  const song = CONFIG.SONGS[i];
  if (!song) return;
  $('#npTitle').textContent = song.title;
  // autoplay=1 works because she clicked "Yes" first (user gesture)
  $('#ytPlayer').src =
    'https://www.youtube.com/embed/' + song.id +
    '?autoplay=1&rel=0&modestbranding=1';
}

function handleMusicYes() {
  $('#musicPrompt').hidden = true;
  $('#musicPlayer').hidden = false;
  state.songIndex = 0;
  playSongAt(0);

  if (CONFIG.SONGS.length <= 1) {
    $('#mNext').hidden = true;
    $('#mFinish').hidden = false;
  } else {
    $('#mNext').hidden = false;
    $('#mFinish').hidden = true;
  }
}

function handleMusicNo() {
  // skip straight to final
  $('#ytPlayer').src = '';
  showScene('final');
}

function handleMusicNext() {
  state.songIndex++;
  if (state.songIndex >= CONFIG.SONGS.length) {
    // shouldn't happen because we swap to Finish on the last song
    return;
  }
  playSongAt(state.songIndex);

  // if this is the last song, swap Next for Finish
  if (state.songIndex === CONFIG.SONGS.length - 1) {
    $('#mNext').hidden = true;
    $('#mFinish').hidden = false;
  }
}

function handleMusicFinish() {
  $('#ytPlayer').src = '';
  showScene('final');
}

/* ============================================================
   scene 4 — final (her yes/no is sent via web3forms)
   ============================================================ */

async function sendFinalChoice(choice) {
  try {
    await submitToWeb3Forms({
      subject: 'her final answer',
      final_question: 'do you want to keep talking?',
      final_answer: choice
    });
  } catch (err) {
    // fail-open — her choice was made, the network doesn't get to undo it
  }
}

async function handleFinalYes() {
  $('#fChoices').style.opacity = '0.3';
  $('#fChoices').style.pointerEvents = 'none';
  const resp = $('#fResponse');
  resp.textContent = 'იგზავნება';
  resp.className = 'f-response is-visible is-yes';

  await sendFinalChoice('yes');

  resp.textContent = 'მადლობა.';
}

async function handleFinalNo() {
  $('#fChoices').style.opacity = '0.3';
  $('#fChoices').style.pointerEvents = 'none';
  const resp = $('#fResponse');
  resp.textContent = 'იგზავნება';
  resp.className = 'f-response is-visible is-no';

  await sendFinalChoice('no');

  resp.textContent = 'კარგი, გასაგებია. კარგად.';
}

/* ============================================================
   boot
   ============================================================ */

function boot() {
  // scene 1
  runIntro();
  bindIntroAdvance();

  // scene 2
  $('#qNext').addEventListener('click', handleQuestionNext);
  $('#qInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleQuestionNext();
    }
  });

  // scene 3
  $('#musicYes').addEventListener('click', handleMusicYes);
  $('#musicNo').addEventListener('click', handleMusicNo);
  $('#mNext').addEventListener('click', handleMusicNext);
  $('#mFinish').addEventListener('click', handleMusicFinish);

  // scene 4
  $('#fYes').addEventListener('click', handleFinalYes);
  $('#fNo').addEventListener('click', handleFinalNo);
}

document.addEventListener('DOMContentLoaded', boot);
