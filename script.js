// ===== المنطق الرئيسي + التقويم =====

let currentFilter = 'all';
let selectedDate = new Date(); // التاريخ المحدد حاليًا
const container = document.getElementById('matchesContainer');
const prevScores = {};

// ===== أدوات التاريخ =====
function toAPIFormat(d) {
  // يحول التاريخ إلى YYYYMMDD بصيغة ESPN
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function toInputFormat(d) {
  // يحول التاريخ إلى YYYY-MM-DD لحقل input[type=date]
  return toAPIFormat(d).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
}

function formatArabicDate(d) {
  const isToday = toInputFormat(d) === toInputFormat(new Date());
  const isTomorrow = toInputFormat(d) === toInputFormat(new Date(Date.now() + 86400000));
  const isYesterday = toInputFormat(d) === toInputFormat(new Date(Date.now() - 86400000));
  if (isToday) return 'اليوم';
  if (isTomorrow) return 'غدًا';
  if (isYesterday) return 'أمس';
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

// ===== جلب نتائج دوري واحد حسب التاريخ =====
async function fetchLeague(league) {
  const url = `${API_BASE}/${league.code}/scoreboard?dates=${toAPIFormat(selectedDate)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  return {
    ...league,
    name: data.leagues?.[0]?.name || league.code,
    events: (data.events || []).map(e => {
      const comp = e.competitions[0];
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      return {
        id: e.id,
        home: {
          name: home.team.displayName,
          logo: home.team.logo || home.team.logos?.[0]?.href || ''
        },
        away: {
          name: away.team.displayName,
          logo: away.team.logo || away.team.logos?.[0]?.href || ''
        },
        state: e.status.type.state, // pre | in | post
        detail: e.status.type.shortDetail || e.status.type.description || '',
        time: new Date(e.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
    })
  };
}

// ===== جلب جميع الدوريات للتاريخ المحدد =====
async function loadAll() {
  container.innerHTML = '<p class="status-bar">⏳ جاري تحميل النتائج...</p>';

  const results = await Promise.allSettled(LEAGUES.map(fetchLeague));
  const leagues = results.filter(r => r.status === 'fulfilled' && r.value.events.length)
                         .map(r => r.value);

  // اكتشاف الأهداف الجديدة لتأثير الوميض
  leagues.forEach(l => l.events.forEach(m => {
    const key = m.id;
    if (prevScores[key] && (prevScores[key].h !== m.home.score || prevScores[key].a !== m.away.score)) {
      m.goal = true;
    }
    prevScores[key] = { h: m.home.score, a: m.away.score };
  }));

  window._leagues = leagues;
  buildNav();
  updateDateBar();
  render();

  document.getElementById('lastUpdate').textContent =
    'آخر تحديث: ' + new Date().toLocaleTimeString('ar-EG');
}

// ===== شريط التاريخ =====
function updateDateBar() {
  document.getElementById('datePicker').value = toInputFormat(selectedDate);

  const prev = new Date(selectedDate.getTime() - 86400000);
  const next = new Date(selectedDate.getTime() + 86400000);

  document.getElementById('prevDay').textContent = `◀ ${formatArabicDate(prev)}`;
  document.getElementById('nextDay').textContent = `${formatArabicDate(next)} ▶`;
}

// الانتقال ليوم معين (عدد أيام: +1 أو -1 ...)
function goToDate(offsetDays) {
  selectedDate = new Date(selectedDate.getTime() + offsetDays * 86400000);
  loadAll();
}

// اختيار تاريخ من التقويم
function onDateChange() {
  const val = document.getElementById('datePicker').value;
  if (!val) return;
  const [y, m, d] = val.split('-').map(Number);
  selectedDate = new Date(y, m - 1, d);
  loadAll();
}

// العودة لليوم الحالي
function goToday() {
  selectedDate = new Date();
  loadAll();
}

// ربط الأزرار
document.getElementById('prevDay').addEventListener('click', () => goToDate(-1));
document.getElementById('nextDay').addEventListener('click', () => goToDate(1));
document.getElementById('datePicker').addEventListener('change', onDateChange);
document.getElementById('todayBtn').addEventListener('click', goToday);

// ===== تبويبات الفلترة =====
function buildNav() {
  const nav = document.getElementById('nav');
  if (nav.dataset.built) return;
  nav.dataset.built = '1';
  nav.innerHTML = `<button class="active" onclick="setFilter('all', this)">الكل</button>` +
    LEAGUES.map(l =>
      `<button onclick="setFilter('${l.code}', this)">${l.flag} ${l.arName}</button>`
    ).join('');
}

function setFilter(code, btn) {
  currentFilter = code;
  document.querySelectorAll('#nav button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// ===== العرض =====
function render() {
  const all = window._leagues || [];
  const filtered = currentFilter === 'all' ? all : all.filter(l => l.code === currentFilter);

  // رأس يعرض التاريخ المعروض
  const dateHeader = `<div class="date-header">🗓️ مباريات ${formatArabicDate(selectedDate)}</div>`;

  if (!filtered.length) {
    container.innerHTML = dateHeader +
      '<p class="no-matches">لا توجد مباريات في هذا اليوم — جرّب يوماً آخر</p>';
    return;
  }

  container.innerHTML = dateHeader + filtered.map(l => `
    <div class="league">
      <div class="league-header"><span>${l.flag}</span> ${l.arName} — ${l.name}</div>
      ${l.events.map(m => `
        <div class="match ${m.goal ? 'goal-flash' : ''}" id="match-${m.id}">
          <div class="team home">
            <img class="team-logo" src="${m.home.logo}" alt="" onerror="this.style.display='none'">
            ${m.home.name}
          </div>
          <div class="score-box">
            <div class="score ${m.state === 'in' ? 'live' : ''}">${m.home.score} - ${m.away.score}</div>
            <div class="minute ${m.state === 'post' ? 'finished' : m.state === 'pre' ? 'scheduled' : ''}">
              ${m.state === 'pre' ? '🕒 ' + m.time :
                m.state === 'in' ? '⏱ ' + (STATUS_AR[m.detail] || m.detail) :
                '✓ ' + (STATUS_AR[m.detail] || m.detail)}
            </div>
          </div>
          <div class="team away">
            <img class="team-logo" src="${m.away.logo}" alt="" onerror="this.style.display='none'">
            ${m.away.name}
          </div>
        </div>`).join('')}
    </div>`).join('');
}

// ===== التشغيل والتحديث التلقائي =====
loadAll();

// التحديث التلقائي يعمل فقط عندما يكون التاريخ المعروض هو اليوم
setInterval(() => {
  const isToday = toInputFormat(selectedDate) === toInputFormat(new Date());
  if (isToday) loadAll();
}, REFRESH_INTERVAL);
