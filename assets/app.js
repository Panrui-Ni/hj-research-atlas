'use strict';
// Data is local and version-controlled; publication and comments use GitHub.
const config = window.HJ_ATLAS_CONFIG || { repository: '', giscus: {} };
let atlas = null;
let allTopics = [];
let topicIndex = new Map();
let branchIndex = new Map();
let referenceIndex = new Map();
let searchTerm = '';
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const escapeHTML = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const esc = escapeHTML;
const isHttp = (url) => /^https:\/\//.test(url || '');
const repoReady = () => /^[\w.-]+\/[\w.-]+$/.test(config.repository || '');
const discussionReady = () => repoReady() && config.giscus && Boolean(config.giscus.repoId && config.giscus.categoryId && config.giscus.category);
const repoURL = () => repoReady() ? `https://github.com/${config.repository}` : 'https://github.com/new';
const linkToTopic = id => `#topic/${encodeURIComponent(id)}`;
const getBranch = topic => branchIndex.get(topic.branchId);
function toast(message) { const element = $('#toast'); element.textContent = message; element.classList.add('visible'); setTimeout(() => element.classList.remove('visible'), 3400); }
function proposalLink(topicId = '') {
  if (!repoReady()) return null;
  return `${repoURL()}/issues/new?template=topic-proposal.yml${topicId ? `&title=${encodeURIComponent('Proposal: ' + topicId)}` : ''}`;
}
function textButton(text, url, primary = false, attributes = '') {
  return url ? `<a class="btn ${primary ? 'primary' : 'secondary'}" href="${esc(url)}" ${attributes}>${esc(text)} <span aria-hidden="true">↗</span></a>`
      : `<button type="button" class="btn ${primary ? 'primary' : 'secondary'}" data-unconfigured="true">${esc(text)} ↗</button>`;
}
function titleFor(topic) { return topic.zh || topic.en; }
function math(text) { return `<span class="math-expr">\\(${esc(text)}\\)</span>`; }
function branchColor(branch) { return esc(branch.accent || '#28777a'); }
function renderSidebar() {
  const filtered = atlas.branches.map(branch => ({...branch, topics: branch.topics.filter(topic => searchMatch(topic))})).filter(branch => branch.topics.length || (!searchTerm && true));
  $('#branch-count').textContent = String(atlas.branches.length).padStart(2, '0');
  $('#sidebar-tree').innerHTML = filtered.map(branch => `<div class="tree-group ${searchTerm ? 'open' : ''}" data-tree="${esc(branch.id)}">
    <button type="button" class="branch-heading" aria-expanded="${searchTerm ? 'true' : 'false'}" data-expand="${esc(branch.id)}" style="--branch-color:${branchColor(branch)}"><span class="branch-circle"></span><span>${esc(branch.zh)}</span><span class="branch-chevron">›</span></button>
    <div class="tree-topics">${branch.topics.map(topic => `<a class="topic-link" href="${linkToTopic(topic.id)}" data-sidebar-topic="${esc(topic.id)}">${esc(topic.zh)}</a>`).join('')}</div>
  </div>`).join('') || `<div class="no-results">没有匹配的研究节点</div>`;
  $$('.branch-heading').forEach(btn => btn.addEventListener('click', () => {
    const group = btn.closest('.tree-group'); const open = group.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open));
  }));
  updateSidebarActive();
}
function searchMatch(topic) {
  if (!searchTerm) return true;
  const haystack = [topic.zh,topic.en,topic.summary, ...topic.questions||[], ...topic.refs||[]].join(' ').toLowerCase();
  return haystack.includes(searchTerm);
}
function updateSidebarActive() {
  const route = routeNow();
  $$('.topic-link').forEach(link => link.classList.toggle('active', link.dataset.sidebarTopic === route.id));
  if (route.page === 'topic') {
    const topic = topicIndex.get(route.id);
    if (topic) {
      const group = $(`[data-tree="${topic.branchId}"]`);
      if (group && !group.classList.contains('open')) {
        group.classList.add('open');
        const heading = $('.branch-heading', group); if(heading) heading.setAttribute('aria-expanded','true');
      }
    }
  }
  $$('[data-nav]').forEach(link => link.classList.toggle('active', (route.page === 'topic' ? 'map' : route.page) === link.dataset.nav));
}
function routeNow() {
  let raw = decodeURIComponent(location.hash.slice(1) || 'map');
  if (raw.startsWith('topic/')) return {page: 'topic', id: raw.slice(6)};
  return {page: ['map','questions','community'].includes(raw) ? raw : 'map'};
}
function heroArt() {return `<div class="hero-art" aria-hidden="true"><svg viewBox="0 0 180 170" fill="none"><circle cx="90" cy="82" r="69" stroke="#e2ece5" stroke-width="1" stroke-dasharray="3 6"/><circle cx="90" cy="82" r="44" stroke="#e2ece5" stroke-width="1"/><path d="M90 151V33M90 107l-46-39m46 19 43-41m-43 72 49-11m-49-48L61 28" stroke="#76a894" stroke-width="2" stroke-linecap="round"/><circle cx="90" cy="33" r="9" fill="#eef7ef" stroke="#4a9b7a" stroke-width="2"/><circle cx="61" cy="28" r="7" fill="#e6ecf8" stroke="#6f8bb8" stroke-width="2"/><circle cx="133" cy="46" r="8" fill="#f2e9f0" stroke="#ac7fa1" stroke-width="2"/><circle cx="44" cy="68" r="9" fill="#f9eee6" stroke="#cd946e" stroke-width="2"/><circle cx="139" cy="107" r="8" fill="#f2f1e3" stroke="#bea465" stroke-width="2"/><circle cx="90" cy="107" r="5" fill="#337b6a"/><path d="M90 45v53" stroke="#2c806b" stroke-width="3"/><circle cx="90" cy="151" r="7" fill="#205f54"/><circle cx="164" cy="95" r="3" fill="#bfd7c7"/><circle cx="23" cy="105" r="3" fill="#a0c9b3"/></svg></div>`;}
function renderMap() {
  const count = allTopics.length; const refsCount = atlas.references.length; const questions = allTopics.reduce((acc,t)=>acc+(t.questions||[]).length,0);
  const branchCards = atlas.branches.filter(branch => branch.topics.some(searchMatch)).map((branch, index) => `<article class="branch-card" style="--branch-color:${branchColor(branch)}"><div class="branch-over"><span class="index">${String(index+1).padStart(2,'0')} / FIELD</span><span class="branch-tag"></span></div>
  <div class="branch-name">${esc(branch.zh)}</div><div class="branch-en">${esc(branch.en)}</div><div class="branch-leaves">${branch.topics.filter(searchMatch).map(topic => `<a class="leaf-link" href="${linkToTopic(topic.id)}">${esc(topic.zh)}<span class="leaf-arrow">↗</span></a>`).join('')}</div></article>`).join('');
  return `<section class="hero"><div class="hero-copy"><div class="overline">An open map for a fast-moving field</div><h1>探索数学的<span class="accent">下一条分支。</span></h1>
  <p class="hero-desc">从 Hamilton–Jacobi 出发，连接定理、假设、反例、未解问题与研究者的讨论。知识不应该被静态目录封存，而应当由整个数学共同体持续建设。</p>
  <div class="hero-actions">${textButton('参与建设', proposalLink(), true)} <a href="#questions" class="btn secondary">发现待讨论问题 <span>↗</span></a></div></div>${heroArt()}</section>
  <div class="metrics"><div class="metric"><strong>${atlas.branches.length.toString().padStart(2,'0')}</strong><span>研究分支 / Fields</span></div><div class="metric"><strong>${count.toString().padStart(2,'0')}</strong><span>研究节点 / Topics</span></div><div class="metric"><strong>${refsCount.toString().padStart(2,'0')}</strong><span>示例文献 / Papers</span></div><div class="metric"><strong>${questions.toString().padStart(2,'0')}</strong><span>讨论提示 / Prompts</span></div></div>
  <div class="section-head"><div><div class="section-kicker">THE KNOWLEDGE TREE</div><h2>研究领域全景</h2><p>选择任意节点，查看相关论文、研究问题与社区讨论。</p></div><span class="badge">持续更新 · Living Atlas</span></div>
  <div class="map-root"><div class="root-block"><div class="root-title">Hamilton–Jacobi Equations</div><div class="root-subtitle">THE COMMON ROOT</div></div><div class="root-connector"></div></div>
  <div class="branch-grid">${branchCards || '<div class="no-results">没有匹配结果，请尝试其他关键词。</div>'}</div>
  <div class="notice-box"><div class="notice-icon">✳</div><div><strong>一张地图，而不是一个排名。</strong><p>这里不以期刊等级或点赞数决定研究价值。每个结果都应当有来源，每个问题都可以被讨论，每项修改都留下记录。当前条目为种子内容，并非完整文献综述。</p></div></div>`;
}
function paperCard(refId) {
  const paper = referenceIndex.get(refId);
  if (!paper) return '';
  return `<article class="paper-card"><div class="paper-head"><div><a class="paper-title" href="${esc(paper.url)}" target="_blank" rel="noopener noreferrer">${esc(paper.title)} ↗</a><div class="paper-authors">${esc(paper.authors)}</div><div class="paper-meta">${esc(paper.venue)} · ${esc(paper.year)}</div></div><span class="paper-status">${paper.type==='published'?'已发表':'预印本'}</span></div>${window.HJRating?window.HJRating.renderPanel(paper.id):''}</article>`;
}
function renderResults(topic){
  if(!topic.results || !topic.results.length) return '<div class="notice-small">暂未整理经逐条核查的定理摘要。欢迎根据论文原文补充准确假设、结论及定理编号。</div>';
  return topic.results.map(result => `<article class="result-card"><strong>${esc(result.name)}</strong><p>${esc(result.text)}</p>${referenceIndex.has(result.ref)?`<a href="${esc(referenceIndex.get(result.ref).url)}" target="_blank" rel="noopener noreferrer">查看原始论文 ↗</a>`:''}<div class="paper-meta">${esc(result.review||'有待核对精确假设')}</div></article>`).join('');
}
function renderTopic(topic) {
  const branch = getBranch(topic);
  const related = (topic.links || []).filter(id => topicIndex.has(id)).map(id => `<a class="related-link" href="${linkToTopic(id)}">${esc(topicIndex.get(id).zh)}</a>`).join('');
  const papers = (topic.refs||[]).filter(id => referenceIndex.has(id)).map(paperCard).join('') || '<div class="notice-small">尚未添加代表性文献，欢迎向项目提交可靠的论文信息。</div>';
  const questions = (topic.questions || []).map(question => `<article class="question-card"><span class="question-mark">?</span><div><div class="question-text">${esc(question)}</div><div class="question-note">开放讨论提示 · 不代表该问题目前尚未解决</div></div></article>`).join('');
  return `<div class="breadcrumbs"><a href="#map">研究地图</a><span>›</span><span>${esc(branch.zh)}</span><span>›</span><span>${esc(topic.zh)}</span></div>
  <div class="topic-title-row"><div><div class="topic-label" style="color:${branchColor(branch)}">${esc(branch.en)} / TOPIC</div><h1>${esc(topic.zh)}</h1><div class="topic-subtitle">${esc(topic.en)}</div></div><span class="badge">● 社区整理中</span></div>
  <p class="topic-lead">${esc(topic.summary)}</p>${topic.formula?`<div class="formula-panel">${math(topic.formula)}</div>`:''}
  <div class="detail-layout"><div class="detail-main"><section class="section-block"><h2>已有结果 · Results</h2><p class="section-description">列出具体结论时须同时给出准确假设和原始出处。</p>${renderResults(topic)}</section>
  <section class="section-block"><h2>关联文献 · Literature</h2><p class="section-description">当前仅展示少量示例文献，不代表完整性或优先级。</p>${papers}</section>
  <section class="section-block"><h2>待讨论问题 · Questions</h2><p class="section-description">任何人都可以纠正过时问题、提出反例或建议新方向。</p>${questions || '<div class="notice-small">欢迎发起这个方向的第一个研究讨论。</div>'}</section>
  <section class="section-block" id="discussion"><h2>社区讨论 · Discussion</h2><p class="section-description">每个节点拥有独立的公开评论区，可评论、回复和分享证明思路。</p><div class="discussion-box" id="comments-host"><div class="discussion-placeholder"><strong>评论区尚未启用</strong><p>发布到 GitHub 并完成 giscus 设置后，这里将显示该节点的独立评论与回复。</p><span class="discussion-help">基于 GitHub Discussions · 登录 GitHub 后参与</span></div></div></section>
  </div><aside class="detail-side"><div class="side-card"><h3>相关研究分支</h3>${related||'<div class="side-note">正在整理相关分支。</div>'}</div>
  <div class="side-card"><h3>加入建设</h3><p class="side-note">发现漏掉的文献或更强的结果？提交可审阅的修改建议，保留明确出处和版本记录。</p>${textButton('提出修改',proposalLink(topic.id),false)}</div>
  <div class="side-card"><h3>引用与可信度</h3><p class="side-note">本网站不替代论文原文和同行评议。数学正确性、原创性、重要性与社区兴趣应分开记录。</p></div></aside></div>`;
}
function renderQuestions() {
  const cards = allTopics.filter(t => (t.questions||[]).length).flatMap(topic => (topic.questions||[]).map(question => ({topic,question}))).filter(item => !searchTerm || searchMatch(item.topic) || item.question.toLowerCase().includes(searchTerm)).slice(0,60);
  return `<section class="questions-top"><div class="overline">Questions lead the way</div><h1>从一个问题开始。</h1><p class="hero-desc">公开提问、补充文献、指出已有解答，也可以提出全新的研究方向。下列内容是讨论提示，不代表经过全面检索确认的未解问题。</p><div class="hero-actions">${textButton('提交一个新问题',proposalLink(),true)}<a href="#map" class="btn secondary">返回研究地图 ↗</a></div></section><div class="section-head"><div><div class="section-kicker">OPEN CONVERSATIONS</div><h2>讨论中的问题</h2></div><span class="badge">${cards.length} prompts</span></div><div class="questions-grid">${cards.map(item=>`<a class="question-tile" href="${linkToTopic(item.topic.id)}"><div class="q-top"><span>RESEARCH QUESTION</span><span>↗</span></div><div class="q-name">${esc(item.question)}</div><div class="q-category">${esc(getBranch(item.topic).zh)} · ${esc(item.topic.zh)}</div></a>`).join('')}</div>`;
}
function renderCommunity() {
  return `<section class="community-top"><div class="overline">Community, not gatekeeping</div><h1>让数学由共同体<br>自由地生长。</h1><p class="community-lead">HJ Atlas 希望探索一种开放、可追溯、能容纳不同意见的数学知识组织方式。我们汇总结果，但不替研究者决定哪些问题“值得研究”。</p></section>
  <div class="principles">
  <article class="principle"><span class="principle-index">01 / OPEN CONTRIBUTIONS</span><h3>任何人都可以提出贡献</h3><p>开放增加节点、论文、反例和开放问题。通过公开修改提议维护基本质量，不依赖作者的职称或机构。</p></article>
  <article class="principle"><span class="principle-index">02 / PROVENANCE FIRST</span><h3>所有断言均应有来源</h3><p>记录假设、结论、定理编号、作者、论文版本和确认状态。区分文献声称与社区独立核查。</p></article>
  <article class="principle"><span class="principle-index">03 / KEEP DISSENT VISIBLE</span><h3>允许有分歧</h3><p>数学正确性可以严格核验，研究重要性则允许不同评价。不能用投票或声望压制合理的少数观点。</p></article>
  <article class="principle"><span class="principle-index">04 / HUMAN + AI</span><h3>AI 可以提议，不能直接认证</h3><p>AI 可以帮助发现、分类和比较新结果，但机器生成的论证或文献内容必须标明并接受人类检查。</p></article>
  </div>
  <div class="community-callout"><h3>从研究地图开始，一起制定未来的规则。</h3><p>首版将 GitHub Discussions 用作公开的评论与回复空间，用 Pull Requests 审核知识图谱内容。治理规则本身也应接受社区讨论和修改。</p>${textButton('去 GitHub 社区',repoReady()?`${repoURL()}/discussions`:null,false)}</div>
  <div class="section-block"><h2>如何参与？</h2><p class="hero-desc">发现新结果时，可以提交原始链接、精确假设、结论以及建议关联到哪些既有节点；发现问题时，请明确指出相关论文版本和可能的数学障碍。所有对内容的修改保留公开的历史。</p><p class="notice-small">初期的维护者负责合并数据修改，不能将其理解为对数学方向的最终裁决。公开、可分叉的数据文件有助于避免形成新的单点权威。</p></div>`;
}
function updateHead(route) {document.title=route.page==='topic'&&topicIndex.has(route.id)?`${topicIndex.get(route.id).zh} | HJ Atlas`:`HJ Atlas — Hamilton–Jacobi Research Atlas`;}
function typeset() {if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([$('#app-content')]).catch(()=>{});}
function showComments(topic) {
  if (!discussionReady()) return;
  const host = $('#comments-host'); if (!host) return;
  host.innerHTML = '';
  const script = document.createElement('script');
  script.src='https://giscus.app/client.js'; script.async=true; script.crossOrigin='anonymous';
  const attrs={'repo':config.repository,'repo-id':config.giscus.repoId,'category':config.giscus.category,'category-id':config.giscus.categoryId,
     'mapping':'specific','term':`HJAtlas-topic-${topic.id}`,'strict':'1','reactions-enabled':'1','emit-metadata':'0','input-position':'top','theme':'light','lang':'zh-CN','loading':'lazy'};
  Object.entries(attrs).forEach(([key,value])=>script.setAttribute('data-'+key, value)); host.append(script);
}
function renderRoute(){
  if(!atlas) return;
  const route=routeNow();updateHead(route);
  const container=$('#app-content');
  if(route.page==='topic') {
    const topic=topicIndex.get(route.id);
    container.innerHTML=topic?renderTopic(topic):`<div class="loading">未找到这个节点。<a class="small-link" href="#map">返回地图</a></div>`;
    if(topic) showComments(topic);
  } else if (route.page==='questions') container.innerHTML=renderQuestions();
  else if (route.page==='community') container.innerHTML=renderCommunity();
  else container.innerHTML=renderMap();
  container.classList.remove('page-enter');void container.offsetWidth;container.classList.add('page-enter');
  updateSidebarActive();typeset();
  window.scrollTo({top:0,behavior:'instant'});
}
async function initialize(){
  try {
    const embedded=$('#offline-atlas-data');
    atlas=embedded?JSON.parse(embedded.textContent):await (await fetch('./data/atlas.json')).json();
    if (!Array.isArray(atlas.branches) || !Array.isArray(atlas.references)) throw new Error('Invalid atlas data');
    for(const branch of atlas.branches){branchIndex.set(branch.id,branch);for(const topic of branch.topics){topic.branchId=branch.id;allTopics.push(topic);topicIndex.set(topic.id,topic);}}
    atlas.references.forEach(ref=>referenceIndex.set(ref.id,ref));
    renderSidebar();renderRoute();
    $('#search').addEventListener('input',event=>{searchTerm=event.target.value.trim().toLowerCase();renderSidebar();const page=routeNow().page;if(page==='map'||page==='questions')renderRoute();});
    window.addEventListener('hashchange',renderRoute);
    document.addEventListener('click',event=>{const target=event.target.closest('[data-unconfigured]');if(target)toast('请先创建 GitHub 仓库并在 config.js 中填写设置，详见 README.md。');});
    document.addEventListener('keydown',event=>{if(event.key==='/'&&document.activeElement!==$('#search')&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){event.preventDefault();$('#search').focus();}});
    const repoHeader=$('#repo-header');repoHeader.href=repoURL();$('#repo-header-text').textContent=repoReady()?'Repository':'GitHub';
  } catch (error) {
    console.error(error);$('#app-content').innerHTML=`<div class="loading"><strong>加载数据失败。</strong><p>请用本地服务器运行：<code>python3 -m http.server 8000</code>，或打开单文件预览版本。</p></div>`;
  }
}
initialize();
