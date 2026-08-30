// ===== المنطق الرئيسي =====

let currentFilter = 'all';
const container = document.getElementById('matchesContainer');
const prevScores = {}; // لتتبع الأهداف الجديدة وميضها

// جلب نتائج دوري واحد
async function fetchLeague(league) {
  const res = await fetch(`${API_BASE}/${league.code}/scoreboard`);
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
          logo: home.team.logo || home.team.logos?.[0]?.href || '',
          score: parseInt(home.score ?? 0)
        },
        away: {
          name: away.team.displayName,
          logo: away.team.logo || away.team.logos?.[0]?.href || '',
          score: parseInt(away.score ?? 0)
        },
        state: e.status.type.state, // 'in' جارية | 'pre' لم تبدأ | 'post' انتهت
        detail: e.status.type.shortDetail || e.status.type.description
      };
    })
  };
}

// جلب جميع الدوريات
async function loadAll() {
  const results = await Promise.allSettled(LEAGUES.map(fetchLeague));
  const leagues = results.filter(r => r.status === 'fulfilled' && r.value.events.length)
                         .map(r => r.value);

  // اكتشاف الأهداف الجديدة
  leagues.forEach(l => l.events.forEach(m => {
    const key = m.id;
    if (prevScores[key] && (prevScores[key].h !== m.home.score || prevScores[key].a !== m.away.score)) {
      m.goal = true;
    }
    prevScores[key] = { h: m.home.score, a: m.away.score };
  }));

  window._leagues = leagues;
  buildNav(leagues);
  render();
  document.getElementById('lastUpdate').textContent =
    'آخر تحديث: ' + new Date().toLocaleTimeString('ar-EG');
}

// تبويبات الفلترة
function buildNav(leagues) {
  const nav = document.getElementById('nav');
  if (nav.dataset.built) return;
  nav.dataset.built = '1';
  nav.innerHTML = `<button class="active" onclick="setFilter('all', this)">الكل</button>` +
    leagues.map(l =>
      `<button onclick="setFilter('${l.code}', this)">${l.flag} ${l.arName}</button>`
    ).join('');
}

function setFilter(code, btn) {
  currentFilter = code;
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// العرض
function render() {
  const all = window._leagues || [];
  const filtered = currentFilter === 'all' ? all : all.filter(l => l.code === currentFilter);

  if (!filtered.length) {
    container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px">لا توجد مباريات اليوم في هذا الدوري</p>';
    return;
  }

  container.innerHTML = filtered.map(l => `
    <div class="league">
      <div class="league-header"><span>${l.flag}</span> ${l.arName} — ${l.name}</div>
      ${l.events.map(m => `
        <div class="match ${m.goal ? 'goal-flash' : ''}" id="match-${m.id}">
          <div class="team home">
            <img class="team-logo" src="${m.home.logo}" alt="">
            ${m.home.name}
          </div>
          <div class="score-box">
            <div class="score ${m.state === 'in' ? 'live' : ''}">${m.home.score} - ${m.away.score}</div>
            <div class="minute ${m.state === 'post' ? 'finished' : m.state === 'pre' ? 'scheduled' : ''}">
              ${m.state === 'in' ? '⏱ ' : m.state === 'post' ? '✓ ' : '🕒 '}
              ${STATUS_AR[m.detail] || m.detail}
            </div>
          </div>
          <div class="team away">
            <img class="team-logo" src="${m.away.logo}" alt="">
            ${m.away.name}
          </div>
        </div>`).join('')}
    </div>`).join('');
}

// التحديث التلقائي
loadAll();
setInterval(loadAll, REFRESH_INTERVAL);