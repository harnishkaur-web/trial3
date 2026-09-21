/* ---------- Page navigation ---------- */
var TOTAL = 6;
var current = 0;
var pageNames = [
  "Why this card exists",
  "The card, both sides",
  "Side 2, in detail",
  "Quick check",
  "Pin it up",
  "Keep this close"
];

function render(){
  document.querySelectorAll('.page').forEach(function(p){
    p.classList.toggle('active', parseInt(p.getAttribute('data-page')) === current);
  });
  document.getElementById('pageName').textContent = pageNames[current];
  document.getElementById('pageNum').textContent = (current+1) + ' / ' + TOTAL;
  document.getElementById('navCount').textContent = (current+1);
  document.getElementById('progressFill').style.width = (((current+1)/TOTAL)*100) + '%';
  document.getElementById('backBtn').disabled = (current === 0);
  document.getElementById('nextBtn').disabled = (current === TOTAL-1);
  window.scrollTo({top:0, behavior:'smooth'});
}

function changePage(delta){
  var next = current + delta;
  if(next < 0 || next > TOTAL-1) return;
  current = next;
  render();
}

/* ---------- Flip card ---------- */
function toggleFlip(){
  document.getElementById('flipInner').classList.toggle('flipped');
}

/* ---------- Lane dropdown (accordion examples) ---------- */
var laneData = {
  iti: {
    fact:   "AI note: \u201cThis machine never needs calibration.\u201d Check the maintenance record before accepting a claim like this.",
    figure: "AI note: \u201c40 trainees\u201d attended the safety demo. Match this against the attendance register.",
    date:   "AI note: inventory was \u201clast updated on Tuesday.\u201d Confirm the exact date \u2014 vague terms hide errors.",
    name:   "AI note: credits \u201cthe lab in-charge\u201d without a name. Confirm the actual name from the duty roster.",
    source: "AI note: \u201cas per company policy,\u201d with no policy shown. Ask for the document or drop the claim."
  },
  higher: {
    fact:   "AI note: \u201cThis seminar was the first of its kind on campus.\u201d Check past event records before accepting.",
    figure: "AI note: \u201c150 students registered\u201d for the workshop. Match this against the registration sheet.",
    date:   "AI note: \u201cthe deadline was extended by a week.\u201d Confirm the exact new date from the official notice.",
    name:   "AI note: quotes \u201cthe department head\u201d without a name. Confirm the actual name from the notice or email.",
    source: "AI note: \u201cas per university guidelines,\u201d with nothing cited. Ask for the guideline or remove the claim."
  }
};

function updateLane(){
  var lane = document.getElementById('laneSelect').value;
  var data = laneData[lane];
  document.querySelectorAll('[data-lane-text]').forEach(function(el){
    var key = el.getAttribute('data-lane-text');
    el.textContent = data[key];
  });
}

/* ---------- Accordion ---------- */
function toggleAcc(headEl){
  var item = headEl.parentElement;
  item.classList.toggle('open');
}

/* ---------- Quiz ---------- */
var quizChoices = {};

function setQuizChoice(id, value){
  quizChoices[id] = value;
  var item = document.getElementById(id);
  item.classList.remove('right','wrong');
}

function checkQuiz(){
  var ids = ['q1','q2','q3','q4','q5'];
  var correctCount = 0;

  ids.forEach(function(id){
    var item = document.getElementById(id);
    var correct = item.getAttribute('data-correct');
    var chosen = quizChoices[id] || '';
    item.classList.remove('right','wrong');
    if(chosen === correct){
      item.classList.add('right');
      correctCount++;
    } else if(chosen !== ''){
      item.classList.add('wrong');
    }
  });

  var banner = document.getElementById('scoreBanner');
  banner.classList.add('show');
  if(correctCount === ids.length){
    banner.style.background = '#E7F7EF';
    banner.style.color = '#0E5C39';
    banner.textContent = 'All ' + correctCount + ' correct. You are sorting these fast \u2014 that is exactly the habit this card builds.';
  } else {
    banner.style.background = '#FFF6E4';
    banner.style.color = '#6B4A00';
    banner.textContent = correctCount + ' of ' + ids.length + ' correct so far. Check the highlighted ones and try again.';
  }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', function(){
  updateLane();
  render();
});