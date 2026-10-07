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
  if(slide.hasAttribute('data-score')) checkQuiz();
  updatePrimary();
  /* a new screen opens at its top (phones kept the scroll position) */
  if(render.last !== current){
    render.last = current;
    Array.prototype.forEach.call(document.querySelectorAll('.saa-scrollzone, #slides, .page.active'), function(z){ z.scrollTop = 0; });
  }
}

/* ---------- Gates (QA Oct 2026) ---------- */
/* Next stays locked until the screen's task is done: the card flipped, the listed sections
   opened, or the quick-check question answered correctly. '' = done, else a short message. */
var seenFlip = false;
var openedAcc = {};
function gateOf(slide){
  if(slide.querySelector('#flipInner')) return seenFlip ? '' : 'Flip the card to read both sides first.';
  var acc = slide.querySelectorAll('.acc-item');
  if(acc.length){
    var todo = Array.prototype.filter.call(acc, function(it){ return !openedAcc[it.getAttribute('data-key')]; });
    if(!todo.length) return '';
    return 'Open ' + Array.prototype.map.call(acc, function(it){ return it.querySelector('.atitle').textContent; })
      .join(', ').replace(/, ([^,]*)$/, ' and $1') + ' first.';
  }
  var qid = slide.getAttribute('data-quiz');
  if(qid) return document.getElementById(qid).classList.contains('right') ? '' : 'Answer this question correctly to go on.';
  return '';
}
/* A locked screen carries data-saa-locked: the shared kit then dims Next (aria-disabled).
   Next can still be pressed; it then says what is left to do. */
function updateGate(tried){
  var slide = slides[current];
  var msg = current === TOTAL-1 ? '' : gateOf(slide);
  document.getElementById('nextBtn').disabled = (current === TOTAL-1);
  if(msg) slide.setAttribute('data-saa-locked',''); else slide.removeAttribute('data-saa-locked');
  if(tried && msg) slide.__gateTried = true;
  var m = slide.querySelector('.g12-gate');
  if(!m && msg && slide.__gateTried){
    m = document.createElement('p');
    m.className = 'g12-gate saa-vo-skip';
    m.setAttribute('aria-live','polite');
    var host = slide.querySelector('.saa-work') || slide.querySelector('.card') || slide;
    if(slide.querySelector('.flip-wrap')) host = slide.querySelector('.flip-wrap');
    host.appendChild(m);
  }
  if(m){ m.textContent = msg; m.hidden = !(msg && slide.__gateTried); }
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
  updateGate();
}

function changePage(delta){
  if(delta > 0 && gateOf(slides[current])){ updateGate(true); return; }
  goTo(current + delta);
}

function goTo(i){
  if(i < 0 || i > TOTAL-1) return;
  current = i;
  render();
}

/* Arrow keys = the footer buttons, so the same locks apply (the kit lock listens for clicks on Next).
   Not inside an activity, a form field or the quiz chips, where the arrows belong to that control. */
document.addEventListener('keydown', function(e){
  var el = e.target;
  var t = el && el.tagName;
  if(t === 'SELECT' || t === 'INPUT' || t === 'TEXTAREA') return;
  if(el && el.closest && el.closest('.saa-kit, .g12-chips, .score-chips, [role="radiogroup"], [role="slider"]')) return;
  if(e.altKey || e.ctrlKey || e.metaKey) return;
  if(e.key === 'ArrowRight'){ var n = document.getElementById('nextBtn'); if(!n.disabled) n.click(); }
  if(e.key === 'ArrowLeft'){ var b = document.getElementById('backBtn'); if(!b.disabled) b.click(); }
});

/* ---------- Flip card ---------- */
function toggleFlip(){
  document.getElementById('flipInner').classList.toggle('flipped');
  seenFlip = true;
  updateGate();
}

/* ---------- Lane dropdown (accordion examples) ---------- */
var laneData = {
  iti: {
    fact:   "AI note: “This machine never needs calibration.” Check the maintenance record before you accept this.",
    figure: "AI note: “40 trainees” attended the safety demo. Match this number against the attendance register.",
    date:   "AI note: the inventory was “last updated on Tuesday.” Confirm the exact date. Vague words hide mistakes.",
    name:   "AI note: it credits “the lab in-charge” with no name. Confirm the real name from the duty roster.",
    source: "AI note: “as per company policy,” with no policy shown. Ask for the document, or remove the claim."
  },
  higher: {
    fact:   "AI note: “This seminar was the first of its kind on campus.” Check past event records before you accept it.",
    figure: "AI note: “150 students registered” for the workshop. Match this number against the registration sheet.",
    date:   "AI note: “the deadline was extended by a week.” Confirm the exact new date from the official notice.",
    name:   "AI note: it quotes “the department head” with no name. Confirm the real name from the notice or email.",
    source: "AI note: “as per university guidelines,” with nothing cited. Ask for the guideline, or remove the claim."
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
    openedAcc[item.getAttribute('data-key')] = true;
  }
  updateGate();
}

/* ---------- Quiz ---------- */
var QUIZ_IDS = ['q1','q2','q3','q4','q5'];
var quizChoices = {};
var labelOf = {fact:'Fact', figure:'Figure', date:'Date', name:'Name', source:'Source'};
/* Why-feedback for each question: right = the reason, hint = a nudge without the answer. */
var quizWhy = {
  q1: {ok: '“Last updated on Tuesday” tells you when, so you confirm the exact date.',
       hint: 'Look at the bold words again. Do they tell you who, how many or when?'},
  q2: {ok: '“150 students” is a number, so you match it against the registration sheet.',
       hint: 'Look at the bold words again. What kind of detail is “150 students”?'},
  q3: {ok: '“As per university guidelines” says where the claim came from, so you ask for that guideline.',
       hint: 'Look at the bold words again. Do they say where the rule came from?'},
  q4: {ok: '“The lab in-charge” stands for a person, so you confirm the real name.',
       hint: 'Look at the bold words again. Do they point to a person?'},
  q5: {ok: '“Never needs calibration” is a claim stated as true, so you check the maintenance record.',
       hint: 'Look at the bold words again. Is this a number, a time or a claim stated as true?'}
};

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
    fb.innerHTML = '<b>Yes.</b> This one is a ' + labelOf[correct] + '. ' + quizWhy[id].ok;
  } else {
    item.classList.add('wrong');
    fb.classList.add('is-bad');
    fb.innerHTML = '<b>Not quite.</b> ' + quizWhy[id].hint + ' Then try again.';
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
    banner.textContent = 'All ' + correctCount + ' are correct. You sort these fast, and that is the habit this card builds.';
  } else {
    banner.classList.add('is-warn');
    banner.textContent = correctCount + ' of ' + QUIZ_IDS.length + ' are correct so far. Tap a red or empty number and try that question again.';
  }
}

document.querySelectorAll('.score-chip').forEach(function(chip){
  chip.addEventListener('click', function(){
    var item = document.getElementById(chip.getAttribute('data-q'));
    goTo(slides.indexOf(item.closest('.page')));
  });
});

/* ---------- Printable card ---------- */
/* The print-only block (#printCard) is filled with copies of the two flip-card faces, so the
   printed card always matches the card on screen 3. The print stylesheet shows only this block. */
function buildPrintCard(){
  var host = document.getElementById('printCard');
  if(!host) return;
  [['front','.flip-front'],['back','.flip-back']].forEach(function(pair){
    var slot = host.querySelector('[data-print-side="' + pair[0] + '"]');
    var face = document.querySelector('#flipInner ' + pair[1]);
    if(!slot || !face) return;
    var copy = face.cloneNode(true);
    copy.className = 'pc-side pc-' + pair[0];
    copy.querySelectorAll('[id]').forEach(function(el){ el.removeAttribute('id'); });
    /* on paper use the light-theme (navy) icons, not the ivory screen ones */
    copy.querySelectorAll('img[src*="icons/dark/"]').forEach(function(im){ im.src = im.getAttribute('src').replace('icons/dark/','icons/'); });
    slot.innerHTML = '';
    slot.appendChild(copy);
  });
}

function printCard(){
  buildPrintCard();
  window.print();
}

/* ---------- Game 12 designer assets (Oct 2026) ---------- */
/* The designer's A4 print sheet (both sides, crop marks). Opens in a new tab / downloads; works offline. */
function openCardPdf(){
  var a = document.createElement('a');
  a.href = 'assets/print/Marking-Card-A4.pdf';
  a.download = 'Marking-Card-A4.pdf';
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}

/* Check-type chips (screens 6-10): the five choices as icon buttons. The original <select> stays
   in the DOM (hidden) and is kept in sync, so setQuizChoice / checkOne / scoring are unchanged. */
function buildCheckChips(){
  var order = ['fact','figure','date','name','source'];
  document.querySelectorAll('.quiz-item').forEach(function(item){
    var sel = item.querySelector('select.quiz-select');
    if(!sel || item.querySelector('.g12-chips')) return;
    var id = item.id;
    var group = document.createElement('div');
    group.className = 'g12-chips';
    group.setAttribute('role','group');
    group.setAttribute('aria-label','Check type');
    function paint(){
      group.querySelectorAll('button').forEach(function(b){
        var on = b.getAttribute('data-value') === sel.value;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.querySelector('img').src = 'assets/icons/' + (on ? 'active/' : 'dark/') + 'icon-' + b.getAttribute('data-value') + '.webp';
      });
    }
    order.forEach(function(v){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'g12-chip'; b.setAttribute('data-value', v);
      var im = document.createElement('img'); im.alt = ''; im.setAttribute('aria-hidden','true');
      var t = document.createElement('span'); t.textContent = labelOf[v];
      b.appendChild(im); b.appendChild(t);
      b.addEventListener('click', function(){
        sel.value = v;
        setQuizChoice(id, v);
        paint();
      });
      group.appendChild(b);
    });
    sel.classList.add('g12-sel-hidden');
    sel.setAttribute('tabindex','-1');
    sel.setAttribute('aria-hidden','true');
    sel.addEventListener('change', paint);
    sel.parentNode.insertBefore(group, sel.nextSibling);
    paint();
  });
}
buildCheckChips();

/* ---------- Init ---------- */
buildPrintCard();
buildProgress();
updateLane();
render();
