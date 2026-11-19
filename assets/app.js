/* HJ Atlas – static client. No analytics, logins, or backend dependency. */
(() => {
  'use strict';
  const config = window.HJ_ATLAS_CONFIG || {};
  const repo = config.repository || 'Panrui-Ni/hj-research-atlas';
  const repoUrl = `https://github.com/${repo}`;
  const state = { data: null, branch: '', topic: '', query: '', year: '', sort: 'newest' };
  const get = id => document.getElementById(id);
  const escapeHTML = v => String(v ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const num = v => Number(v).toLocaleString('en-US');
  const slug = v => String(v || '').replace(/[^a-z0-9-]/ig, '-');
  const paperMap = () => new Map(state.data.papers.map(p => [p.id, p]));
  const papersFor = (branch, topic) => state.data.papers.filter(p => (!branch || p.branch === branch) && (!topic || p.topic === topic));

  function setDynamicLinks() {
    get('repo-link').href = repoUrl;
    get('discussion-link').href = config.discussionsPage || `${repoUrl}/discussions`;
    const issue = config.issuePage || `${repoUrl}/issues/new/choose`;
    ['suggest-link', 'correct-link', 'footer-correct-link'].forEach(id => get(id).href = issue);
  }

  function navigate(branch, topic) {
    state.branch = branch;
    state.topic = topic || '';
    updateFilters();
    if (state.query) { state.query = ''; get('search').value = ''; }
    const anchor = topic ? `topic=${encodeURIComponent(topic)}` : branch ? `branch=${encodeURIComponent(branch)}` : 'all';
    history.replaceState(null, '', '#' + anchor);
    render();
    get('main-content').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function buildNav() {
    const allCount = state.data.papers.length;
    const main = `<button type="button" data-branch="" data-topic="" class="nav-main${!state.branch && !state.topic?' active':''}"><span>All research areas</span><span class="count">${allCount}</span></button>`;
    get('branch-nav').innerHTML = main + state.data.branches.map(b => {
      const total = papersFor(b.id).length;
      const heading = `<button type="button" data-branch="${escapeHTML(b.id)}" data-topic="" class="nav-main${state.branch===b.id&&!state.topic?' active':''}"><span>${escapeHTML(b.label)}</span><span class="count">${total}</span></button>`;
      const topics = b.topics.map(t => `<button type="button" data-branch="${escapeHTML(b.id)}" data-topic="${escapeHTML(t)}" class="nav-topic${state.topic===t&&state.branch===b.id?' active':''}"><span>${escapeHTML(t)}</span><span class="count">${papersFor(b.id,t).length}</span></button>`).join('');
      return `<div class="branch-group">${heading}${topics}</div>`;
    }).join('');
    get('branch-nav').querySelectorAll('button[data-branch]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.branch,btn.dataset.topic)));
  }

  function updateFilters() {
    const topics = [...new Set(papersFor(state.branch).map(p => p.topic))].sort();
    const opts = ['<option value="">All topics</option>',...topics.map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`)];
    get('topic-select').innerHTML = opts.join('');
    if (!topics.includes(state.topic)) state.topic = '';
    get('topic-select').value = state.topic;
    const years = [...new Set(state.data.papers.map(p=>p.year))].sort((a,b)=>b-a);
    get('year-select').innerHTML = ['<option value="">All years</option>', ...years.map(y=>`<option value="${y}">${y}</option>`)].join('');
    get('year-select').value = state.year;
  }

  function card(p, lookup) {
    const journal = p.journal ? `<span class="bullet">·</span><span>${escapeHTML(p.journal)}</span>` : '';
    const context = p.context || 'Not documented yet.';
    const scope = p.scope || 'See the paper for hypotheses.';
    const related = (p.related || []).filter(id=>lookup.has(id)).map(id=>`<a href="#paper=${encodeURIComponent(id)}" data-related="${escapeHTML(id)}">${escapeHTML(lookup.get(id).authors.split(';')[0].trim())} et al. (${lookup.get(id).year})</a>`).join(' · ');
    const rhtml = related ? `<div class="related">Related in this index: ${related}</div>` : '';
    return `<article class="paper-card" id="${slug(p.id)}" data-id="${escapeHTML(p.id)}">
       <div class="paper-top"><span>${p.year}</span><span class="bullet">·</span><span class="topic">${escapeHTML(p.topic)}</span>${journal}</div>
       <h3><a href="https://arxiv.org/abs/${encodeURIComponent(p.arxiv)}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.title)}</a></h3>
       <p class="authors">${escapeHTML(p.authors.replaceAll(';', ' ·'))}</p>
       <div class="contribution-grid">
         <div class="field-label">PRIOR CONTEXT</div><div class="field-text">${escapeHTML(context)}</div>
         <div class="field-label">ACTUAL ADDITION</div><div class="field-text added">${escapeHTML(p.contribution)}</div>
         <div class="field-label">SCOPE</div><div class="field-text">${escapeHTML(scope)}</div>
       </div>
       <div class="paper-footer"><a class="paper-arxiv" href="https://arxiv.org/abs/${encodeURIComponent(p.arxiv)}" target="_blank" rel="noopener noreferrer">arXiv:${escapeHTML(p.arxiv)} ↗</a><a class="paper-link" href="#paper=${encodeURIComponent(p.id)}" data-permalink="${escapeHTML(p.id)}">Link to this entry</a><a class="paper-link" href="${repoUrl}/issues/new/choose" target="_blank" rel="noopener noreferrer">Suggest correction ↗</a></div>${rhtml}
    </article>`;
  }

  function render() {
    const d=state.data;
    const search = state.query.trim().toLowerCase();
    const list=d.papers.filter(p => {
      if (state.branch && p.branch!==state.branch) return false;
      if (state.topic && p.topic!==state.topic) return false;
      if (state.year && String(p.year)!==state.year) return false;
      if (!search) return true;
      const text=[p.title,p.authors,p.topic,p.branch,p.journal,p.context,p.contribution,p.scope].join(' ').toLowerCase();
      return text.includes(search);
    }).sort((a,b) => state.sort==='oldest' ? a.year-b.year||a.title.localeCompare(b.title) : state.sort==='title' ? a.title.localeCompare(b.title) : b.year-a.year||a.title.localeCompare(b.title));
    const b=d.branches.find(b=>b.id===state.branch);
    get('section-title').textContent=state.topic||b?.label||'All papers';
    get('section-description').textContent=state.topic ? `${b?.label || 'Research'} · selected papers` : b?.description || 'Selected research results and their mathematical increments';
    get('result-count').textContent=`${num(list.length)} ${list.length===1?'paper':'papers'}`;
    get('paper-list').innerHTML=list.length ? list.map(p=>card(p,paperMap())).join('') : '<div class="empty"><h3>No matching entries</h3><p>Try another filter or propose a missing paper.</p></div>';
    get('paper-list').querySelectorAll('[data-related], [data-permalink]').forEach(link => link.addEventListener('click', evt => {
      evt.preventDefault();
      const id=link.dataset.related || link.dataset.permalink;
      jumpToPaper(id);
    }));
    buildNav();
  }

  function jumpToPaper(id) {
    const p=state.data.papers.find(p=>p.id===id);
    if (!p) return;
    state.branch='';state.topic='';state.year='';state.query='';get('search').value='';get('year-select').value='';
    updateFilters();render();
    history.replaceState(null,'','#paper='+encodeURIComponent(id));
    const el=get(slug(id));
    if (el) { el.classList.add('target-card'); el.scrollIntoView({behavior:'smooth',block:'center'}); }
  }

  function readHash() {
    const hash=decodeURIComponent(window.location.hash.slice(1));
    if (hash.startsWith('paper=')) return {paper:hash.slice(6)};
    if (hash.startsWith('branch=')) return {branch:hash.slice(7)};
    if (hash.startsWith('topic=')) return {topic:hash.slice(6)};
    return {};
  }

  async function init() {
    setDynamicLinks();
    try {
      const data=window.HJ_INLINE_DATA || await (await fetch('data/atlas.json', {cache:'no-cache'})).json();
      if (!data.branches || !Array.isArray(data.papers)) throw new Error('Unexpected data format');
      state.data=data;
      get('last-updated').textContent=`${data.papers.length} selected papers · Updated ${data.about.updated} · Coverage is not comprehensive`;
      const hash=readHash();
      if (hash.branch && data.branches.some(b=>b.id===hash.branch)) state.branch=hash.branch;
      if (hash.topic) {const b=data.branches.find(b=>b.topics.includes(hash.topic));if(b){state.branch=b.id;state.topic=hash.topic;}}
      updateFilters();render();
      get('search').addEventListener('input',e=>{state.query=e.target.value;render();});
      get('topic-select').addEventListener('change',e=>{state.topic=e.target.value;render();});
      get('year-select').addEventListener('change',e=>{state.year=e.target.value;render();});
      get('sort-select').addEventListener('change',e=>{state.sort=e.target.value;render();});
      get('clear-filters').addEventListener('click',()=>{state.branch='';state.topic='';state.query='';state.year='';get('search').value='';get('year-select').value='';updateFilters();history.replaceState(null,'','#all');render();});
      window.addEventListener('hashchange',()=>{const hash=readHash();if(hash.paper)jumpToPaper(hash.paper);else if(hash.branch||hash.topic){if(hash.topic){const b=data.branches.find(b=>b.topics.includes(hash.topic));if(b)navigate(b.id,hash.topic);}else navigate(hash.branch||'','');}});
      if(hash.paper)jumpToPaper(hash.paper);
    } catch (err) {
      get('paper-list').innerHTML=`<div class="empty"><h3>Unable to load papers</h3><p>The literature file could not be opened. Please visit the published GitHub Pages site or report the issue.</p></div>`;
      get('result-count').textContent='Error';
      console.error('HJ Atlas data error', err);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
