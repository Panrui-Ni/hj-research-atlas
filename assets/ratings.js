'use strict';
/* HJ Atlas anonymous ratings: one optional, independently deployable feature.
 * Without a configured API scores are only saved as a local draft.
 * No total score, rank, or claim of verification is generated.
 */
(() => {
  const dims = [
    {id:'concept', title:'概念创新', desc:'新问题、新概念或新的理论视角'},
    {id:'method', title:'方法创新', desc:'新的证明思路、方法或工具'},
    {id:'technical', title:'技术深度', desc:'克服的实质数学困难'},
    {id:'systematic', title:'系统性', desc:'结论及理论体系的完整程度'},
    {id:'generality', title:'理论一般性', desc:'适用范围及统一不同问题的能力'}
  ];
  const levels = [
    {id:'very_high', title:'极高', desc:'突破性的观念或贡献，明显超出已有研究框架'},
    {id:'high', title:'高', desc:'相对于已有工作有显著的实质进展'},
    {id:'moderate', title:'一般', desc:'有原创贡献，属于常规而有价值的研究推进'},
    {id:'low', title:'较低', desc:'在该维度主要是有限增量或直接的延伸'}
  ];
  const conf = window.HJ_ATLAS_CONFIG?.ratings || {};
  const apiEnabled = /^https:\/\//.test(conf.apiBase||'') && Boolean(conf.turnstileSiteKey);
  const scores = new Map();
  const esc = s => String(s).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const byId = (paperId) => document.querySelector(`[data-ratings-panel="${CSS.escape(paperId)}"]`);
  function localGet(key) {try {return localStorage.getItem(key);}catch{return null;}}
  function localSet(key,value) {try {localStorage.setItem(key,value);return true;}catch{return false;}}
  function currentDraft(paperId){try{return JSON.parse(localGet('hj-atlas-draft-'+paperId)||'{}')}catch{return {}}}
  function fields(paperId) {
    const draft = currentDraft(paperId);
    return dims.map(d=>`<label class="rating-field"><span><strong>${esc(d.title)}</strong><small>${esc(d.desc)}</small></span><select aria-label="${esc(d.title)}" data-rating-dimension="${d.id}"><option value="">不评价 / 不确定</option>${levels.map(l=>`<option value="${l.id}" ${draft[d.id]===l.id?'selected':''}>${l.title}</option>`).join('')}</select></label>`).join('');
  }
  function renderPanel(paperId) {
    return `<div class="rating-wrap"><button type="button" class="rating-toggle" data-rating-open="${esc(paperId)}" aria-expanded="false">◇ 匿名分维度评价 <span aria-hidden="true">▾</span></button>
    <div class="rating-panel" data-ratings-panel="${esc(paperId)}" hidden>
      <p class="rating-intro">评分针对<strong>这篇论文</strong>，不评价作者或期刊。无需填写姓名。各维度独立，不设总分。</p>
      <div class="rating-fields">${fields(paperId)}</div>
      <details class="rating-rubric"><summary>四档评价如何理解？</summary><ul>${levels.map(l=>`<li><strong>${l.title}：</strong>${l.desc}</li>`).join('')}</ul><p>同一篇工作可以在不同维度取得不同等级。缺乏充分了解时请选择“不评价”。</p></details>
      <div class="rating-security" data-rating-security>${apiEnabled?'匿名评分需先通过防刷验证。':''}</div>
      <div class="rating-challenge" data-rating-challenge></div>
      <button class="btn primary rating-submit" type="button" data-rating-submit="${esc(paperId)}">${apiEnabled?'提交或更新匿名评分':'保存本地评价草稿'}</button>
      <p class="rating-feedback" data-rating-feedback role="status" aria-live="polite">${apiEnabled?'公开结果不显示投票人身份；浏览器记录用于修改自己的评分。':'演示模式：仅在此浏览器保存草稿，不提交或计入社区投票。'}</p>
      <div class="rating-stats" data-rating-stats><p class="rating-empty">${apiEnabled?'正在等待查看社区评价……':'连接评分服务后，这里将展示真实社区的评分分布。'}</p></div>
      <p class="rating-footnote">评分是研究者的主观判断，不代表数学正确性或学术认证。低样本量的统计结果应谨慎解释。</p>
    </div></div>`;
  }
  let turnstileScript;
  const widgets = new WeakMap();
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (turnstileScript) return turnstileScript;
    turnstileScript = new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
      script.onload=()=>resolve();script.onerror=()=>reject(new Error('无法加载防刷组件'));
      document.head.appendChild(script);
    });
    return turnstileScript;
  }
  async function setupChallenge(panel) {
    if (!apiEnabled || !panel?.isConnected || widgets.has(panel)) return;
    const box=panel.querySelector('[data-rating-challenge]');
    try {
      await loadTurnstile();
      if (!panel.isConnected || widgets.has(panel)) return;
      const state={token:'',id:null};widgets.set(panel,state);
      state.id=window.turnstile.render(box,{sitekey:conf.turnstileSiteKey,callback:token=>{state.token=token;},'expired-callback':()=>{state.token='';},'error-callback':()=>{state.token='';}});
    } catch (error) {panel.querySelector('[data-rating-feedback]').textContent=error.message+'。请检查网络连接。';}
  }
  function feedback(panel,msg){panel.querySelector('[data-rating-feedback]').textContent=msg;}
  function userToken() {
    let token = localGet('hj-atlas-anonymous-voter');
    if(!token){
      if (!window.crypto?.randomUUID) throw new Error('当前浏览器不支持安全的匿名标识生成。');
      token = window.crypto.randomUUID();
      if(!localSet('hj-atlas-anonymous-voter',token)) throw new Error('请启用浏览器本地存储后再评分。');
    }
    return token;
  }
  const endpoint=()=>String(conf.apiBase||'').replace(/\/$/,'')+'/votes';
  async function loadStats(paperId, panel){
    if(!apiEnabled) return;
    try {
      const res=await fetch(endpoint()+'?paperId='+encodeURIComponent(paperId));
      if(!res.ok)throw Error('HTTP '+res.status);
      const data=await res.json();if(panel.isConnected)drawStats(panel,data);
    }catch {if(panel.isConnected)panel.querySelector('[data-rating-stats]').textContent='目前无法读取评分统计。';}
  }
  function drawStats(panel, data){
    const dest=panel.querySelector('[data-rating-stats]');
    dest.innerHTML='<h4>社区评分分布 <small>不计算综合分</small></h4>' + dims.map(d=>{
      const item=data.dimensions?.[d.id]||{};
      const n=levels.reduce((sum,l)=>sum+Number(item[l.id]||0),0);
      if(n<5)return `<div class="rating-stat-row"><span>${esc(d.title)}</span><small>${n} 份评价 · 样本不足，暂不展示分布</small></div>`;
      const ordered=[...levels].reverse(), med=[]; let cursor=0;
      const lower=Math.floor((n-1)/2), upper=Math.floor(n/2);
      for(const l of ordered){const next=cursor+Number(item[l.id]||0);if(cursor<=lower&&next>lower) med.push(l.title);if(cursor<=upper&&next>upper&&upper!==lower) med.push(l.title);cursor=next;}
      const median=[...new Set(med)].join('–');
      return `<div class="rating-stat-row"><div class="rating-stat-label"><strong>${esc(d.title)}</strong><small>${n} 份 · 中位 ${esc(median)}</small></div><div class="rating-bars">${levels.map(l=>`<span class="rating-bar" title="${l.title}: ${item[l.id]||0} 份" style="flex:${Math.max(0, Number(item[l.id]||0))} 1 0%"></span>`).join('')}</div><div class="rating-legend">${levels.map(l=>`${l.title} ${item[l.id]||0}`).join(' · ')}</div></div>`;
    }).join('');
  }
  function collect(panel){
    const values={};panel.querySelectorAll('[data-rating-dimension]').forEach(el=>{values[el.dataset.ratingDimension]=el.value;});return values;
  }
  async function submit(paperId,button){
    const panel=byId(paperId);if(!panel)return;
    const draft=collect(panel);
    const selected=Object.values(draft).filter(Boolean).length;
    if(!selected){feedback(panel,'请至少对一个熟悉的维度作出评价。');return;}
    if(!localSet('hj-atlas-draft-'+paperId,JSON.stringify(draft))){feedback(panel,'无法保存草稿：请检查浏览器存储权限。');return;}
    if(!apiEnabled){feedback(panel,'已在本浏览器保存评价草稿；尚未提交到社区。');return;}
    const state=widgets.get(panel);
    if(!state?.token){feedback(panel,'请先完成防刷验证。');return;}
    button.disabled=true;button.textContent='提交中……';
    try{
      const response=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paperId,voterToken:userToken(),scores:draft,turnstileToken:state.token})});
      const body=await response.json().catch(()=>({error:'服务器响应异常'}));
      if(!response.ok)throw Error(body.error||'提交失败');
      feedback(panel,'匿名评分已记录，可以修改后重新提交。');
      drawStats(panel,body);
    }catch(error){feedback(panel,'提交失败：'+String(error.message||error));}
    finally{button.disabled=false;button.textContent='提交或更新匿名评分';if(state){state.token='';if(window.turnstile&&state.id!==null)window.turnstile.reset(state.id);}}
  }
  document.addEventListener('click', async event=>{
    const open=event.target.closest('[data-rating-open]');
    if(open){
      const panel=byId(open.dataset.ratingOpen);if(!panel)return;
      const visible=panel.hidden;panel.hidden=!visible;open.setAttribute('aria-expanded',String(visible));
      if(visible){if(apiEnabled){setupChallenge(panel);loadStats(open.dataset.ratingOpen,panel);}}
      return;
    }
    const save=event.target.closest('[data-rating-submit]');if(save)submit(save.dataset.ratingSubmit,save);
  });
  window.HJRating={renderPanel,dimensions:dims,levels};
})();
