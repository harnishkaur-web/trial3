/* ---------- Slide navigation ---------- */
/* Slides are the <section class="page"> elements, in order. The count, labels and
   progress segments are all derived from the DOM, so nothing here hard-codes a total. */
var slides = Array.prototype.slice.call(document.querySelectorAll('.page'));
var TOTAL = slides.length;
var current = 0;

function buildProgress(){
  var dots = document.getElementById('progressDots');
  dots.innerHTML = '';
  for(var i = 0; i < TOTAL; i++){ dots.appendChild(document.createElement('span')); }
  dots.setAttribute('aria-valuemax', TOTAL);
}

function render(){
  slides.forEach(function(p, i){ p.classList.toggle('active', i === current); });
  var slide = slides[current];
  document.getElementById('pageName').textContent = slide.getAttribute('data-name') || '';
  document.getElementById('pageNum').textContent = (current+1) + ' / ' + TOTAL;
  var dots = document.getElementById('progressDots');
  Array.prototype.forEach.call(dots.children, function(d, i){
    d.classList.toggle('is-done', i < current);
    d.classList.toggle('is-current', i === current);
  });
  dots.setAttribute('aria-valuenow', current+1);
  document.getElementById('backBtn').disabled = (current === 0);
  document.getElementById('nextBtn').disabled = (current === TOTAL-1);
  if(slide.hasAttribute('data-score')) checkQuiz();
  updatePrimary();
}

/* One amber per slide: on a quiz slide, "Check my answer" is the primary until the
   question is answered correctly; then Next takes the amber back. */
function updatePrimary(){
  var slide = slides[current];
  var qid = slide.getAttribute('data-quiz');
  var quiet = false;
  if(qid){
    var item = document.getElementById(qid);
    var right = item.classList.contains('right');
    slide.querySelector('.check-btn').classList.toggle('is-quiet', right);
    quiet = !right;
  }
  document.getElementById('nextBtn').classList.toggle('is-quiet', quiet);
}

function changePage(delta){
  goTo(current + delta);
}

function goTo(i){
  if(i < 0 || i > TOTAL-1) return;
  current = i;
  render();
}

document.addEventListener('keydown', function(e){
  var t = e.target && e.target.tagName;
  if(t === 'SELECT' || t === 'INPUT' || t === 'TEXTAREA') return;
  if(e.key === 'ArrowRight') changePage(1);
  if(e.key === 'ArrowLeft') changePage(-1);
});

/* ---------- Flip card ---------- */
function toggleFlip(){
  document.getElementById('flipInner').classList.toggle('flipped');
}

/* ---------- Lane dropdown (accordion examples) ---------- */
var laneData = {
  iti: {
    fact:   "AI note: “This machine never needs calibration.” Check the maintenance record before accepting a claim like this.",
    figure: "AI note: “40 trainees” attended the safety demo. Match this against the attendance register.",
    date:   "AI note: inventory was “last updated on Tuesday.” Confirm the exact date — vague terms hide errors.",
    name:   "AI note: credits “the lab in-charge” without a name. Confirm the actual name from the duty roster.",
    source: "AI note: “as per company policy,” with no policy shown. Ask for the document or drop the claim."
  },
  higher: {
    fact:   "AI note: “This seminar was the first of its kind on campus.” Check past event records before accepting.",
    figure: "AI note: “150 students registered” for the workshop. Match this against the registration sheet.",
    date:   "AI note: “the deadline was extended by a week.” Confirm the exact new date from the official notice.",
    name:   "AI note: quotes “the department head” without a name. Confirm the actual name from the notice or email.",
    source: "AI note: “as per university guidelines,” with nothing cited. Ask for the guideline or remove the claim."
  }
};

/* The lane dropdown appears on both "Why each check matters" slides; they stay in sync. */
function updateLane(src){
  var lane = src ? src.value : document.getElementById('laneSelect').value;
  document.querySelectorAll('.lane-select').forEach(function(s){ s.value = lane; });
  var data = laneData[lane];
  document.querySelectorAll('[data-lane-text]').forEach(function(el){
    var key = el.getAttribute('data-lane-text');
    el.textContent = data[key];
  });
}

/* ---------- Accordion ---------- */
/* One open item per slide so the expanded state always fits on screen. */
function toggleAcc(headEl){
  var item = headEl.parentElement;
  var willOpen = !item.classList.contains('open');
  item.parentElement.querySelectorAll('.acc-item').forEach(function(it){
    it.classList.remove('open');
    it.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
  });
  if(willOpen){
    item.classList.add('open');
    headEl.setAttribute('aria-expanded', 'true');
  }
}

/* ---------- Quiz ---------- */
var QUIZ_IDS = ['q1','q2','q3','q4','q5'];
var quizChoices = {};
var labelOf = {fact:'Fact', figure:'Figure', date:'Date', name:'Name', source:'Source'};

function setQuizChoice(id, value){
  quizChoices[id] = value;
  var item = document.getElementById(id);
  item.classList.remove('right','wrong');
  var slide = item.closest('.page');
  slide.querySelector('.check-btn').disabled = (value === '');
  var fb = document.getElementById('fb-' + id);
  fb.className = 'quiz-fb';
  fb.textContent = '';
  updatePrimary();
}

/* Check the single question on the current slide. */
function checkOne(id){
  var item = document.getElementById(id);
  var correct = item.getAttribute('data-correct');
  var chosen = quizChoices[id] || '';
  if(chosen === '') return;
  item.classList.remove('right','wrong');
  var fb = document.getElementById('fb-' + id);
  fb.className = 'quiz-fb show';
  if(chosen === correct){
    item.classList.add('right');
    fb.classList.add('is-ok');
    fb.innerHTML = '<b>Correct.</b> This one is a ' + labelOf[correct] + '.';
  } else {
    item.classList.add('wrong');
    fb.classList.add('is-bad');
    fb.innerHTML = '<b>Not quite.</b> Check the highlighted phrase and try again.';
  }
  updatePrimary();
}

/* Score across all five questions (shown on the "Your score" slide). */
function checkQuiz(){
  var correctCount = 0;

  QUIZ_IDS.forEach(function(id){
    var item = document.getElementById(id);
    var correct = item.getAttribute('data-correct');
    var chosen = quizChoices[id] || '';
    /* answered questions get the same right/wrong highlight + feedback as checkOne */
    if(chosen !== '') checkOne(id);
    var chip = document.querySelector('.score-chip[data-q="' + id + '"]');
    chip.classList.remove('is-right','is-wrong');
    if(chosen === correct){
      chip.classList.add('is-right');
      correctCount++;
    } else if(chosen !== ''){
      chip.classList.add('is-wrong');
    }
    var n = QUIZ_IDS.indexOf(id) + 1;
    chip.setAttribute('aria-label', 'Question ' + n + ': ' + (chosen === correct ? 'correct' : chosen === '' ? 'not answered' : 'incorrect'));
  });

  var banner = document.getElementById('scoreBanner');
  banner.classList.add('show');
  banner.classList.remove('is-ok','is-warn');
  if(correctCount === QUIZ_IDS.length){
    banner.classList.add('is-ok');
    banner.textContent = 'All ' + correctCount + ' correct. You are sorting these fast — that is exactly the habit this card builds.';
  } else {
    banner.classList.add('is-warn');
    banner.textContent = correctCount + ' of ' + QUIZ_IDS.length + ' correct so far. Check the highlighted ones and try again.';
  }
}

document.querySelectorAll('.score-chip').forEach(function(chip){
  chip.addEventListener('click', function(){
    var item = document.getElementById(chip.getAttribute('data-q'));
    goTo(slides.indexOf(item.closest('.page')));
  });
});

/* ---------- Init ---------- */
buildProgress();
updateLane();
render();
