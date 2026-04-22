
let tasks = []; 


const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

const taskListEl = $('#taskList');
const addBtn = $('#addBtn');
const clearBtn = $('#clearBtn');
const taskText = $('#taskText');
const taskSection = $('#taskSection');
const taskDate = $('#taskDate');
const taskPriority = $('#taskPriority');
const filterBtns = document.querySelectorAll('[data-filter]');
const tabBtns = document.querySelectorAll('.tab');
const panelTitle = $('#panelTitle');
const todayCountEl = $('#todayCount');


let activeTab = 'absent';
let activeFilter = 'all';

function formatDate(d) {
  if(!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString();
}


function renderTasks() {
  taskListEl.innerHTML = '';

  const filtered = tasks.filter(t => {
   
    if (activeTab !== 'all' && t.section !== activeTab) return false;
  
    if (activeFilter === 'active' && t.completed) return false;
    if (activeFilter === 'completed' && !t.completed) return false;
    return true;
  });

  panelTitle.textContent = activeTab === 'all' ? 'All Tasks' :
                      activeTab === 'assign' ? 'Assignments' :
                      activeTab === 'study' ? 'Study' :
                      activeTab === 'absent' ? 'Absent' :
                      activeTab === 'health' ? 'Health' : 'Tasks';

  filtered.sort((a,b) => {
    if(!a.date && !b.date) return 0;
    if(!a.date) return 1;
    if(!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  filtered.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task-item' + (t.completed ? ' completed' : '');
    li.dataset.section = t.section;

    const left = document.createElement('div'); left.className = 'task-left';
    const cb = document.createElement('div'); cb.className = 'checkbox' + (t.completed ? ' checked' : '');
    cb.title = t.completed ? 'Mark as active' : 'Mark as complete';

    cb.addEventListener('click', () => {
      t.completed = !t.completed;
      renderTasks();
      updateTodayCount();
    });

    const textWrap = document.createElement('div');
    const title = document.createElement('div'); title.className = 'task-title'; title.textContent = t.text;
    const meta = document.createElement('div'); meta.className = 'task-meta';
    meta.innerHTML = (t.date ? `<span class="task-date">Due: ${formatDate(t.date)}</span> • ` : '') + `<span>${t.priority}</span>`;

    textWrap.appendChild(title); textWrap.appendChild(meta);
    left.appendChild(cb); left.appendChild(textWrap);

    const actions = document.createElement('div'); actions.className = 'task-actions';
    const del = document.createElement('button'); del.innerHTML = '🗑️'; del.title='Delete';
    del.addEventListener('click', () => {
      tasks = tasks.filter(x => x.id !== t.id);
      renderTasks();
      updateTodayCount();
    });

    actions.appendChild(del);

    li.appendChild(left); li.appendChild(actions);
    taskListEl.appendChild(li);
  });
}


addBtn.addEventListener('click', () => {
  const text = taskText.value.trim();
  if (!text) return alert('Please enter task text');
  const t = {
    id: uid(),
    text,
    section: taskSection.value,
    date: taskDate.value || null,
    priority: taskPriority.value || 'normal',
    completed: false
  };
  tasks.push(t);
  taskText.value = ''; taskDate.value = '';
  renderTasks();
  updateTodayCount();
});


clearBtn.addEventListener('click', () => {
  taskText.value=''; taskDate.value=''; taskPriority.value='normal';
});


tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    renderTasks();
  });
});


filterBtns.forEach(f => {
  f.addEventListener('click', () => {
    filterBtns.forEach(b=>b.classList.remove('active'));
    f.classList.add('active');
    activeFilter = f.dataset.filter;
    renderTasks();
  });
});


function updateTodayCount() {
  const today = new Date().toISOString().slice(0,10);
  const count = tasks.filter(t => !t.completed && t.date === today).length;
  todayCountEl.textContent = count;
}


const makeScheduleBtn = $('#makeSchedule');
const clearScheduleBtn = $('#clearSchedule');

function parseHolidays(input) {
  if(!input) return [];
  return input.split(',').map(s=>s.trim()).filter(Boolean);
}

function getDatesBetween(start, end) {
  const arr = [];
  let cur = new Date(start);
  const e = new Date(end);
  while (cur <= e) {
    arr.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return arr;
}

makeScheduleBtn.addEventListener('click', () => {
  const name = $('#subName').value.trim();
  const units = parseInt($('#units').value, 10);
  const s = $('#startDate').value;
  const e = $('#endDate').value;
  const holInput = $('#holidays').value;

  if(!name || !units || !s || !e) {
    return alert('Please fill subject, units, start and end date');
  }

  if(new Date(s) > new Date(e)) return alert('Start date must be before end date');

  const holidays = parseHolidays(holInput); // strings
  let dates = getDatesBetween(s, e)
    .map(d => d.toISOString().slice(0,10))
    .filter(d => !holidays.includes(d) && (new Date(d).getDay() !== 0)); 
    // optional: skip Sundays (you can remove that filter)

  if(dates.length === 0) return alert('No available study days (after excluding holidays).');

  // distribute units roughly evenly
  const perDay = Math.floor(units / dates.length);
  let remainder = units % dates.length;

  // create tasks for study section
  dates.forEach((dt) => {
    let assign = perDay;
    if (remainder > 0) { assign += 1; remainder -= 1; }
    if(assign === 0) return; // skip days with 0
    const taskText = `${name}: Study ${assign} unit${assign>1?'s':''}`;
    tasks.push({
      id: uid(),
      text: taskText,
      section: 'study',
      date: dt,
      priority: 'normal',
      completed: false
    });
  });

  // render & feedback
  renderTasks();
  updateTodayCount();
  alert('Study schedule created and added to Study section.');
});

// clear schedule (just an option to remove study tasks)
clearScheduleBtn.addEventListener('click', () => {
  if(!confirm('Remove all study tasks?')) return;
  tasks = tasks.filter(t => t.section !== 'study');
  renderTasks();
  updateTodayCount();
});

// init with some demo tasks for convenience (remove in final)
(function seedDemo(){
  tasks.push({id:uid(), text:'CS Lab missed - contact lab incharge', section:'absent', date:null, priority:'high', completed:false});
  tasks.push({id:uid(), text:'Math assignment 3', section:'assign', date:new Date(Date.now()+2*86400000).toISOString().slice(0,10), priority:'high', completed:false});
  tasks.push({id:uid(), text:'Practice OS questions', section:'study', date:new Date().toISOString().slice(0,10), priority:'normal', completed:false});
  tasks.push({id:uid(), text:'Morning walk / health', section:'health', date:null, priority:'low', completed:false});
  renderTasks();
  updateTodayCount();
})();
