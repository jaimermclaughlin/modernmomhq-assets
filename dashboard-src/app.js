(function(){
'use strict';
var D = window.DATA;
var ART = window.DASH_MODE === 'artifact';
var TODAY = new Date(D.meta.compiledISO + 'T12:00:00');
var DAY = 86400000;

/* ---------- helpers ---------- */
function esc(s){return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function $(sel,root){return (root||document).querySelector(sel);}
function $all(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
function uniq(a){var s={},o=[];a.forEach(function(x){if(x!=null&&x!==''&&!s[x]){s[x]=1;o.push(x);}});return o;}
function store(k,v){try{if(v===undefined){var r=localStorage.getItem('mmhq-intel-'+k);return r?JSON.parse(r):null;}localStorage.setItem('mmhq-intel-'+k,JSON.stringify(v));}catch(e){return null;}}
function toast(msg){var t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show');},1800);}

var SRC = {}; D.sources.forEach(function(s){SRC[s.id]=s;});
var SEG = {}; D.segments.forEach(function(s){SEG[s.id]=s;});
var TOP = {}; D.topics.forEach(function(t){TOP[t.id]=t;});

function parseDate(d){
  if(!d) return null;
  var m = String(d).match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if(!m) return null;
  return new Date(+m[1], m[2]?(+m[2]-1):6, m[3]?+m[3]:15);
}
function recency(d){
  var dt = parseDate(d); if(!dt) return 'undated';
  var days = (TODAY - dt)/DAY;
  if(days <= 90) return '90d';
  if(days <= 365) return '12m';
  return 'older';
}
var REC_LABEL = {'90d':'Last 90 days','12m':'Last 12 months','older':'Older (foundational)','undated':'Date not shown'};
function fmtDate(d){
  if(!d) return 'Date not shown';
  var dt = parseDate(d); if(!dt) return esc(d);
  var parts = String(d).split('-');
  var mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if(parts.length===1) return parts[0];
  if(parts.length===2) return mon[+parts[1]-1]+' '+parts[0];
  return mon[+parts[1]-1]+' '+(+parts[2])+', '+parts[0];
}

var LEVELS = {
  verified:{label:'Verified finding',cls:'lv-verified',ico:'\u2713',desc:'Supported by published research, official data, or several independent sources that agree.'},
  pattern:{label:'Qualitative pattern',cls:'lv-pattern',ico:'\u2248',desc:'Recurs across firsthand statements and creator or journalist accounts. Shows what women say, not how many women experience it.'},
  hypothesis:{label:'Strategic hypothesis',cls:'lv-hypothesis',ico:'?',desc:'My interpretation of the evidence. Worth testing with your own audience before treating as fact.'},
  gap:{label:'Under-researched',cls:'lv-gap',ico:'\u2026',desc:'Thin or inaccessible evidence. Flagged so you know where the research stops.'}
};
function levelBadge(l){var L=LEVELS[l]||LEVELS.gap;return '<span class="badge '+L.cls+'" title="'+esc(L.desc)+'"><span class="ico" aria-hidden="true">'+L.ico+'</span>'+esc(L.label)+'</span>';}
function segTag(id){var s=SEG[id];if(!s)return '';return '<span class="tag"><span class="dot" style="background:var(--seg-'+id+')" aria-hidden="true"></span>'+esc(s.short)+'</span>';}
function topicTag(id){var t=TOP[id];if(!t)return '';return '<span class="tag">'+esc(t.name)+'</span>';}
function tagsHTML(segs,topics){return '<div class="tags">'+(segs||[]).map(segTag).join('')+(topics||[]).map(topicTag).join('')+'</div>';}
var FID = {
  caption:{label:'Verbatim title or caption',desc:'Appeared word for word as the title or caption of the linked page in search results.'},
  excerpt:{label:'Search excerpt',desc:'Quoted in a search-engine summary of the linked page. Exact wording could not be confirmed because the page itself could not be opened from this research environment.'},
  article:{label:'Quoted by article',desc:'A journalist or author quoting someone else; the linked article is the source.'},
  set:{label:'Excerpt, page not pinpointed',desc:'Quoted in a search-engine summary of a small set of related pages. The link goes to the most likely page in that set, but the exact page could not be confirmed.'},
  data:{label:'Reported figure',desc:'A figure as reported by the linked publisher.'}
};
function fidHTML(q){
  var f = FID[q.fid] || FID.excerpt;
  var h = '<span class="fid"><span class="chip" title="'+esc(f.desc)+'">'+esc(f.label)+'</span>';
  if(q.ver) h += '<span class="chip ok" title="An exact-phrase search for this wording returned the same source.">\u2713 Phrase confirmed</span>';
  return h + '</span>';
}
function srcLine(id){
  var s = SRC[id]; if(!s) return '<li class="muted">Missing source '+esc(id)+'</li>';
  return '<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a><div class="src-meta">'+esc(s.pub)+' \u00b7 '+esc(s.platform)+' \u00b7 '+fmtDate(s.date)+' \u00b7 '+esc(s.type)+(s.quality?' \u00b7 Evidence quality: '+esc(s.quality):'')+'</div></li>';
}
function quoteHTML(q){
  var s = SRC[q.src]||{};
  return '<blockquote class="q"><p>\u201c'+esc(q.q)+'\u201d</p>'+
    '<div class="src-meta">'+(s.url?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.pub||s.title)+'</a>':'')+' \u00b7 '+esc(s.platform||'')+' \u00b7 '+fmtDate(s.date)+(q.who?' \u00b7 '+esc(q.who):'')+'</div>'+
    '<div style="margin-top:6px">'+fidHTML(q)+'</div>'+(q.note?'<div class="src-meta" style="margin-top:4px">Note: '+esc(q.note)+'</div>':'')+'</blockquote>';
}
function evidenceHTML(item,open){
  var qs = item.quotes||[], ss = uniq((item.sources||[]).concat(qs.map(function(q){return q.src;})));
  if(!qs.length && !ss.length && !item.evidence) return '';
  var h = '<details class="ev"'+(open?' open':'')+'><summary>Evidence: '+(qs.length?qs.length+' quote'+(qs.length===1?'':'s')+', ':'')+ss.length+' source'+(ss.length===1?'':'s')+'</summary>';
  if(item.evidence) h += '<p class="small" style="margin-top:8px">'+esc(item.evidence)+'</p>';
  h += qs.map(quoteHTML).join('');
  if(ss.length) h += '<h4>Sources</h4><ul class="src-list">'+ss.map(srcLine).join('')+'</ul>';
  return h + '</details>';
}
function sameText(a,b){var n=function(t){return String(t||'').toLowerCase().replace(/[^a-z0-9]/g,'');};var x=n(a),y=n(b);return !!x&&!!y&&(x.indexOf(y.slice(0,30))>-1||y.indexOf(x.slice(0,30))>-1);}
function allSources(item){return uniq((item.sources||[]).concat((item.quotes||[]).map(function(q){return q.src;})));}
function breadth(item){return allSources(item).length;}
function meter(n,max){var h='<span class="meter" aria-hidden="true">';for(var i=1;i<=max;i++)h+='<i class="'+(i<=n?'on':'')+'"></i>';return h+'</span>';}
var INT = {High:3,Medium:2,Low:1};
function indicators(item){
  var h = '<div class="ind">';
  h += '<span title="Number of distinct sources in this dataset that support this item. Reflects what search could surface, not how common the experience is.">Sources in dataset: <b>'+breadth(item)+'</b></span>';
  if(item.intensity) h += '<span title="'+esc(item.intensityWhy||'Qualitative judgment of emotional intensity in the source language.')+'">Emotional intensity (judgment): <b>'+esc(item.intensity)+'</b>'+meter(INT[item.intensity]||0,3)+'</span>';
  var rec = allSources(item).map(function(id){return SRC[id]?recency(SRC[id].date):null;});
  var n90 = rec.filter(function(r){return r==='90d';}).length, n12 = rec.filter(function(r){return r==='12m';}).length;
  h += '<span title="Sources dated in the last 90 days / last 12 months">Recent sources: <b>'+n90+'</b> (90d) \u00b7 <b>'+n12+'</b> (12m)</span>';
  return h+'</div>';
}
function hasSeg(item,seg){
  var s = item.segs||[];
  if(seg==='intersection') return (s.indexOf('adhd')>-1||s.indexOf('suspected')>-1)&&s.indexOf('moms')>-1;
  return s.indexOf(seg)>-1;
}
function textOf(item){
  var parts=[item.title,item.summary,item.why,item.cat,item.evidence,item.conventional,item.experiencing,item.whyIncomplete,item.alternative,item.relevance,item.q,item.theme,item.name,item.focus,item.what,item.from,item.format,item.home,item.caution];
  (item.quotes||[]).forEach(function(q){parts.push(q.q);});
  (item.changes||[]).forEach(function(c){parts.push(c);});
  (item.points||[]).forEach(function(p){parts.push(p);});
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/* ---------- stars ---------- */
var stars = store('stars') || {};
function starBtn(id,label){return '<button class="star" data-star="'+esc(id)+'" aria-pressed="'+(stars[id]?'true':'false')+'" aria-label="Save '+esc(label)+' to My research log" title="Save to My research log">'+(stars[id]?'\u2605':'\u2606')+'</button>';}
document.addEventListener('click',function(e){
  var b = e.target.closest('[data-star]'); if(!b) return;
  var id = b.getAttribute('data-star');
  if(stars[id]) delete stars[id]; else stars[id] = Date.now();
  store('stars',stars);
  $all('[data-star="'+id+'"]').forEach(function(x){x.setAttribute('aria-pressed',stars[id]?'true':'false');x.textContent=stars[id]?'\u2605':'\u2606';});
  toast(stars[id]?'Saved to My research log':'Removed from My research log');
  if(currentTab==='log') renderLog();
});

/* ---------- generic filter bar ---------- */
function segChips(name,includeIntersection){
  var segs = D.segments.map(function(s){return s.id;});
  if(includeIntersection) segs.push('intersection');
  return '<label>Audience segment<span class="chipset" role="group" aria-label="Audience segment">'+segs.map(function(id){
    var nm = id==='intersection'?'ADHD/EF + mothers':SEG[id].short;
    return '<button type="button" class="chip-btn" data-filter="'+name+'" data-seg="'+id+'" aria-pressed="false"><span class="dot" style="background:var(--seg-'+id+')" aria-hidden="true"></span>'+esc(nm)+'</button>';
  }).join('')+'</span></label>';
}
function selectHTML(label,key,opts){
  return '<label>'+esc(label)+'<select data-key="'+key+'"><option value="">All</option>'+opts.map(function(o){return '<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>';}).join('')+'</select></label>';
}
function bindFilters(root,state,render){
  $all('[data-seg]',root).forEach(function(b){b.addEventListener('click',function(){
    var id=b.getAttribute('data-seg'); var on=b.getAttribute('aria-pressed')!=='true';
    b.setAttribute('aria-pressed',on?'true':'false');
    state.segs = state.segs||[];
    if(on) state.segs.push(id); else state.segs = state.segs.filter(function(x){return x!==id;});
    render();
  });});
  $all('select[data-key]',root).forEach(function(s){s.addEventListener('change',function(){state[s.getAttribute('data-key')]=s.value;render();});});
  $all('input[data-key]',root).forEach(function(s){s.addEventListener('input',function(){state[s.getAttribute('data-key')]=s.value.toLowerCase();render();});});
}
function passes(item,state){
  if(state.segs&&state.segs.length){ if(!state.segs.some(function(s){return hasSeg(item,s);})) return false; }
  if(state.topic && (item.topics||[]).indexOf(state.topic)<0) return false;
  if(state.level && item.level!==state.level) return false;
  if(state.cat && item.cat!==state.cat) return false;
  if(state.q && textOf(item).indexOf(state.q)<0) return false;
  return true;
}
var topicOpts = function(){return D.topics.map(function(t){return [t.id,t.name];});};
var levelOpts = function(){return Object.keys(LEVELS).map(function(k){return [k,LEVELS[k].label];});};

/* ---------- generic card ---------- */
function itemCard(item,extra){
  return '<article class="card" id="item-'+esc(item.id)+'">'+
    '<div class="card-top"><span class="cat">'+esc(item.cat||'')+'</span><span style="display:flex;gap:6px;align-items:center">'+levelBadge(item.level)+starBtn(item.id,item.title)+'</span></div>'+
    '<h3>'+esc(item.title)+'</h3>'+
    (item.summary?'<p>'+esc(item.summary)+'</p>':'')+
    (extra||'')+
    tagsHTML(item.segs,item.topics)+
    indicators(item)+
    evidenceHTML(item)+
  '</article>';
}

/* ---------- panels ---------- */
var PANELS = [
  {id:'exec',name:'Executive Intelligence'},
  {id:'segments',name:'Audience Segments'},
  {id:'pain',name:'Pain Point Explorer'},
  {id:'sick',name:'What They\u2019re Sick Of'},
  {id:'want',name:'What They Actually Want'},
  {id:'listen',name:'Social Listening'},
  {id:'landscape',name:'Content Landscape'},
  {id:'disrupt',name:'Disruptor Matrix'},
  {id:'recs',name:'Strategic Recommendations'},
  {id:'resources',name:'Content Resources'},
  {id:'library',name:'Research Library'},
  {id:'log',name:'My Research Log'}
];
var currentTab = null;
function buildTabs(){
  $('#tabs').innerHTML = PANELS.map(function(p,i){return '<button class="tab" role="tab" id="tab-'+p.id+'" aria-controls="panel-'+p.id+'" aria-selected="false" data-tab="'+p.id+'"><span class="num">'+(i+1<10?'0':'')+(i+1)+'</span>'+esc(p.name)+'</button>';}).join('');
  $all('[data-tab]').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-tab'));});});
}
var RENDER = {};
var rendered = {};
function go(id,focusId){
  if(!RENDER[id]) id='exec';
  currentTab = id;
  $all('.tab').forEach(function(t){var on=t.getAttribute('data-tab')===id;t.setAttribute('aria-selected',on?'true':'false');if(on)t.scrollIntoView({block:'nearest',inline:'nearest'});});
  $all('section.panel').forEach(function(p){p.classList.toggle('active',p.id==='panel-'+id);});
  if(!rendered[id] || id==='log'){RENDER[id]();rendered[id]=true;}
  if(location.hash!=='#'+id) history.replaceState(null,'','#'+id);
  if(focusId){
    var el = document.getElementById(focusId);
    if(el){
      $all('details',el).forEach(function(d){d.open=true;});
      if(el.tagName==='DETAILS') el.open=true;
      el.classList.add('hl'); setTimeout(function(){el.classList.remove('hl');},2600);
      el.scrollIntoView({behavior:'smooth',block:'center'});
    }
  } else {
    var nav = $('nav.tabs'); var top = nav.getBoundingClientRect().top + window.scrollY;
    if(window.scrollY > top) window.scrollTo({top:top,behavior:'auto'});
  }
}
function head(eyebrow,title,intro){return '<div class="panel-head"><span class="eyebrow">'+esc(eyebrow)+'</span><h2>'+title+'</h2>'+(intro?'<p>'+intro+'</p>':'')+'</div>';}

/* Executive */
RENDER.exec = function(){
  var E = D.exec, nS = D.sources.length;
  var nQ = 0; ['painPoints','sickOf','wants'].forEach(function(k){D[k].forEach(function(i){nQ+=(i.quotes||[]).length;});}); nQ += D.listening.length;
  var byType = {}; D.sources.forEach(function(s){byType[s.type]=(byType[s.type]||0)+1;});
  var n90 = D.sources.filter(function(s){return recency(s.date)==='90d';}).length;
  var n12 = D.sources.filter(function(s){return recency(s.date)==='12m';}).length;
  var h = head('01 \u00b7 Executive Intelligence','What matters <em>most</em>',esc(E.intro));
  h += '<div class="hero-strip">'+
    '<div class="stat"><div class="n">'+nS+'</div><div class="l">Sources catalogued, each linked</div></div>'+
    '<div class="stat"><div class="n">'+(byType['Firsthand']||0)+'</div><div class="l">Firsthand audience sources (posts, captions, essays)</div></div>'+
    '<div class="stat"><div class="n">'+(byType['Research']||0)+'</div><div class="l">Research, survey and official data sources</div></div>'+
    '<div class="stat"><div class="n">'+n90+' / '+(n90+n12)+'</div><div class="l">Sources dated in the last 90 days / last 12 months (many sources show no date)</div></div>'+
  '</div>';
  h += '<h3 style="font-family:var(--display);font-size:26px;font-weight:400">Most important findings</h3><ol class="numbered">'+E.findings.map(function(f){
    return '<li id="item-'+esc(f.id)+'"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:4px"><b style="font-size:17px">'+esc(f.title)+'</b>'+levelBadge(f.level)+'</div><p style="margin:0">'+esc(f.summary)+'</p>'+evidenceHTML(f)+'</li>';
  }).join('')+'</ol>';
  h += '<div class="grid three" style="margin-top:22px">';
  [['Emerging cultural and behavioral patterns',E.patterns],['Surprising discoveries',E.surprises],['Key implications for your brand',E.implications]].forEach(function(b){
    h += '<div class="card"><h3 style="font-family:var(--display);font-size:24px;font-weight:400">'+esc(b[0])+'</h3>'+b[1].map(function(x){
      return '<div id="item-'+esc(x.id)+'" style="padding:10px 0;border-top:1px solid var(--line)"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px"><b>'+esc(x.title)+'</b>'+levelBadge(x.level)+'</div><p class="small" style="margin:0">'+esc(x.summary)+'</p>'+evidenceHTML(x)+'</div>';
    }).join('')+'</div>';
  });
  h += '</div>';
  $('#panel-exec').innerHTML = h;
};

/* Segments */
RENDER.segments = function(){
  var h = head('02 \u00b7 Audience Segments','Who is <em>actually</em> in this audience',esc(D.segmentIntro));
  h += '<div class="venn-wrap"><div class="venn card">'+vennSVG()+'<p class="small muted" style="margin-top:8px">Schematic only. Circle sizes are not to scale and do not represent population size. Select a region to jump to its profile.</p></div><div>'+
    '<h3 style="font-family:var(--display);font-size:24px;font-weight:400">How the segments relate</h3>'+D.segmentRelations.map(function(r){return '<p>'+esc(r)+'</p>';}).join('')+'</div></div>';
  h += '<div class="grid two" style="margin-top:20px">'+D.segmentProfiles.map(function(p){
    var dot = p.seg==='intersection'?'intersection':p.seg;
    return '<article class="card" id="seg-'+esc(p.seg)+'"><div class="card-top"><span class="cat"><span class="dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--seg-'+dot+');margin-right:6px" aria-hidden="true"></span>'+esc(p.label)+'</span>'+levelBadge(p.level)+'</div>'+
      '<h3 style="font-family:var(--display);font-size:24px;font-weight:400">'+esc(p.name)+'</h3><p>'+esc(p.who)+'</p>'+
      '<dl class="kv"><div><dt>Defining experiences</dt><dd><ul>'+p.experiences.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></dd></div>'+
      '<div><dt>Priorities</dt><dd><ul>'+p.priorities.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></dd></div>'+
      '<div><dt>How they differ</dt><dd>'+esc(p.differs)+'</dd></div></dl>'+evidenceHTML(p)+'</article>';
  }).join('')+'</div>';
  h += '<h3 style="font-family:var(--display);font-size:26px;font-weight:400;margin-top:28px">Where needs overlap</h3><p class="muted small">Qualitative mapping from the evidence in this dashboard. \u25cf = central to this segment in the sources reviewed, \u25d0 = present but secondary, \u25cb = rarely surfaced in sources reviewed. These are judgments, not measurements.</p>';
  var cols = ['adhd','suspected','moms','millennial'];
  h += '<div class="table-wrap"><table><thead><tr><th scope="col">Need or experience</th>'+cols.map(function(c){return '<th scope="col">'+esc(SEG[c].short)+'</th>';}).join('')+'<th scope="col">Evidence</th></tr></thead><tbody>'+D.overlaps.map(function(o){
    return '<tr><th scope="row" style="position:static;background:none;text-transform:none;letter-spacing:0;font-size:14px;color:var(--ink);font-weight:600">'+esc(o.need)+'</th>'+cols.map(function(c){var v=o.m[c];var sym=v===2?'\u25cf':v===1?'\u25d0':'\u25cb';var lab=v===2?'Central':v===1?'Secondary':'Rarely surfaced';return '<td title="'+lab+'"><span aria-hidden="true" style="font-size:18px;color:var(--accent)">'+sym+'</span><span class="sr-only">'+lab+'</span></td>';}).join('')+'<td class="small">'+(o.sources||[]).map(function(id){var s=SRC[id];return s?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.pub)+'</a>':'';}).join(', ')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
  $('#panel-segments').innerHTML = h;
  $all('[data-goto-seg]').forEach(function(g){
    function act(){var t=document.getElementById('seg-'+g.getAttribute('data-goto-seg'));if(t){t.scrollIntoView({behavior:'smooth',block:'start'});t.classList.add('hl');setTimeout(function(){t.classList.remove('hl');},2200);}}
    g.addEventListener('click',act); g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}});
  });
};
function vennSVG(){
  return '<svg viewBox="0 0 560 360" role="img" aria-labelledby="vennT vennD"><title id="vennT">Audience segment overlap</title><desc id="vennD">A rectangle for millennial women aged 30 to 45 contains two overlapping circles: women with diagnosed or suspected ADHD or executive function challenges, and mothers. The overlap is ADHD mothers.</desc>'+
  '<rect class="region" data-goto-seg="millennial" tabindex="0" role="button" aria-label="Millennial women 30 to 45 profile" x="6" y="6" width="548" height="348" rx="18" fill="var(--seg-millennial)" fill-opacity=".10" stroke="var(--seg-millennial)" stroke-width="1.5"/>'+
  '<text x="24" y="34" font-size="13" font-weight="600">Millennial women, about 30 to 45</text>'+
  '<circle class="region" data-goto-seg="adhd" tabindex="0" role="button" aria-label="ADHD and executive function profile" cx="210" cy="196" r="128" fill="var(--seg-adhd)" fill-opacity=".16" stroke="var(--seg-adhd)" stroke-width="1.5"/>'+
  '<circle class="region" data-goto-seg="moms" tabindex="0" role="button" aria-label="Mothers profile" cx="350" cy="196" r="128" fill="var(--seg-moms)" fill-opacity=".16" stroke="var(--seg-moms)" stroke-width="1.5"/>'+
  '<text x="152" y="190" font-size="13" font-weight="600" text-anchor="middle">Diagnosed or</text><text x="152" y="207" font-size="13" font-weight="600" text-anchor="middle">suspected ADHD,</text><text x="152" y="224" font-size="13" font-weight="600" text-anchor="middle">EF challenges</text>'+
  '<text x="412" y="200" font-size="13" font-weight="600" text-anchor="middle">Mothers</text><text x="412" y="217" font-size="12" text-anchor="middle">(ADHD not</text><text x="412" y="232" font-size="12" text-anchor="middle">assumed)</text>'+
  '<g class="region" data-goto-seg="intersection" tabindex="0" role="button" aria-label="ADHD mothers intersection profile"><rect x="236" y="172" width="88" height="48" rx="10" fill="var(--surface)" stroke="var(--seg-intersection)" stroke-width="1.5"/><text x="280" y="192" font-size="12.5" font-weight="700" text-anchor="middle">ADHD</text><text x="280" y="209" font-size="12.5" font-weight="700" text-anchor="middle">mothers</text></g>'+
  '<text x="280" y="340" font-size="11.5" text-anchor="middle" fill="var(--muted)" style="fill:var(--muted)">Many women sit outside both circles; they are still part of the audience.</text>'+
  '</svg>';
}

/* Pain points */
var painState = {segs:[]};
RENDER.pain = function(){
  var cats = uniq(D.painPoints.map(function(p){return p.cat;}));
  var h = head('03 \u00b7 Pain Point Explorer','What they are <em>struggling</em> with',esc(D.painIntro));
  h += '<div class="filters" id="pain-filters">'+segChips('pain',true)+selectHTML('Category','cat',cats.map(function(c){return [c,c];}))+selectHTML('Topic','topic',topicOpts())+selectHTML('Evidence level','level',levelOpts())+
    '<label>Sort<select data-key="sort"><option value="breadth">Most sources</option><option value="intensity">Highest intensity</option><option value="recent">Most recent sources</option><option value="az">A to Z</option></select></label>'+
    '<label>Filter text<input type="search" data-key="q" placeholder="e.g. medication, school"></label><span class="count" id="pain-count"></span></div>';
  h += '<div id="pain-chart"></div><div class="grid two" id="pain-list" style="margin-top:16px"></div>';
  $('#panel-pain').innerHTML = h;
  bindFilters($('#pain-filters'),painState,drawPain);
  drawPain();
};
function recentScore(item){return allSources(item).filter(function(id){return SRC[id]&&recency(SRC[id].date)==='90d';}).length*2+allSources(item).filter(function(id){return SRC[id]&&recency(SRC[id].date)==='12m';}).length;}
function sortItems(list,how){
  list = list.slice();
  if(how==='intensity') list.sort(function(a,b){return (INT[b.intensity]||0)-(INT[a.intensity]||0)||breadth(b)-breadth(a);});
  else if(how==='recent') list.sort(function(a,b){return recentScore(b)-recentScore(a);});
  else if(how==='az') list.sort(function(a,b){return a.title.localeCompare(b.title);});
  else list.sort(function(a,b){return breadth(b)-breadth(a);});
  return list;
}
function drawPain(){
  var list = sortItems(D.painPoints.filter(function(p){return passes(p,painState);}),painState.sort);
  $('#pain-count').textContent = list.length+' of '+D.painPoints.length+' pain points';
  // evidence breadth by category (distinct sources), single series
  var cats = uniq(D.painPoints.map(function(p){return p.cat;}));
  var rows = cats.map(function(c){var ids=[];list.filter(function(p){return p.cat===c;}).forEach(function(p){ids=ids.concat(allSources(p));});return {c:c,n:uniq(ids).length,k:list.filter(function(p){return p.cat===c;}).length};}).filter(function(r){return r.k>0;}).sort(function(a,b){return b.n-a.n;});
  var max = Math.max.apply(null,rows.map(function(r){return r.n;}).concat([1]));
  $('#pain-chart').innerHTML = rows.length?'<details class="card" open><summary style="cursor:pointer;font-weight:600">Evidence breadth by category (current filter)</summary><p class="small muted" style="margin:8px 0 10px">Bars count distinct sources in this dataset per category. They show where the evidence collected is deepest. They are not prevalence estimates and do not mean one problem is more common in the population than another.</p><div class="table-wrap"><table><thead><tr><th scope="col">Category</th><th scope="col">Pain points</th><th scope="col">Distinct sources</th></tr></thead><tbody>'+rows.map(function(r){
    return '<tr><td>'+esc(r.c)+'</td><td class="num">'+r.k+'</td><td><div class="bar-cell" title="'+r.n+' distinct sources"><span class="b" style="width:'+Math.max(4,Math.round(r.n/max*220))+'px"></span><span class="num">'+r.n+'</span></div></td></tr>';
  }).join('')+'</tbody></table></div></details>':'';
  $('#pain-list').innerHTML = list.length?list.map(function(p){return itemCard(p,p.intensityWhy?'<p class="small muted"><b>Why this intensity rating:</b> '+esc(p.intensityWhy)+'</p>':'');}).join(''):'<div class="empty">No pain points match these filters.</div>';
}

/* Sick of / Want: shared sectioned renderer */
function sectioned(panelId,num,title,intro,items,catOrder,stateObj,extraFn){
  var h = head(num,title,esc(intro));
  h += '<div class="filters" id="'+panelId+'-filters">'+segChips(panelId,true)+selectHTML('Section','cat',catOrder.map(function(c){return [c,c];}))+selectHTML('Topic','topic',topicOpts())+selectHTML('Evidence level','level',levelOpts())+'<label>Filter text<input type="search" data-key="q" placeholder="Search this section"></label><span class="count" id="'+panelId+'-count"></span></div><div id="'+panelId+'-list"></div>';
  $('#panel-'+panelId).innerHTML = h;
  function draw(){
    var list = items.filter(function(i){return passes(i,stateObj);});
    $('#'+panelId+'-count').textContent = list.length+' of '+items.length+' items';
    var out = '';
    catOrder.forEach(function(c){
      var sub = sortItems(list.filter(function(i){return i.cat===c;}),'breadth');
      if(!sub.length) return;
      out += '<h3 style="font-family:var(--display);font-size:26px;font-weight:400;margin:22px 0 10px">'+esc(c)+' <span class="muted small" style="font-family:var(--sans)">('+sub.length+')</span></h3><div class="grid two">'+sub.map(function(i){return itemCard(i,extraFn?extraFn(i):'');}).join('')+'</div>';
    });
    $('#'+panelId+'-list').innerHTML = out || '<div class="empty">Nothing matches these filters.</div>';
  }
  bindFilters($('#'+panelId+'-filters'),stateObj,draw);
  draw();
}
var sickState={segs:[]}, wantState={segs:[]};
RENDER.sick = function(){
  sectioned('sick','04 \u00b7 What They\u2019re Sick Of','What they are <em>done</em> hearing',D.sickIntro,D.sickOf,['Rejected advice','Frustrating expectations','Disappointing solutions','Criticized content','What they wish others understood'],sickState,function(i){
    return i.why?'<dl class="kv"><div><dt>Why it fails, according to the sources</dt><dd>'+esc(i.why)+'</dd></div></dl>':'';
  });
};
RENDER.want = function(){
  sectioned('want','05 \u00b7 What They Actually Want','What they are <em>asking</em> for',D.wantIntro,D.wants,['Desired outcomes','Solutions they request or recommend','Current workarounds','Unmet needs'],wantState,function(i){
    return i.why?'<dl class="kv"><div><dt>Why it matters</dt><dd>'+esc(i.why)+'</dd></div></dl>':'';
  });
};

/* Social listening */
var listenState = {segs:[]};
RENDER.listen = function(){
  var L = D.listening;
  var plats = uniq(L.map(function(x){return (SRC[x.src]||{}).platform;})).sort();
  var themes = uniq(L.map(function(x){return x.theme;})).sort();
  var tones = uniq(L.map(function(x){return x.tone;})).sort();
  var h = head('06 \u00b7 Social Listening','In their <em>own words</em>',esc(D.listenIntro));
  h += '<div class="filters" id="listen-filters">'+segChips('listen',true)+selectHTML('Platform','platform',plats.map(function(p){return [p,p];}))+selectHTML('Theme','theme',themes.map(function(p){return [p,p];}))+selectHTML('Tone (judgment)','tone',tones.map(function(p){return [p,p];}))+
    selectHTML('Recency','rec',[['90d','Last 90 days'],['12m','Last 12 months'],['older','Older'],['undated','Date not shown']])+selectHTML('Quote fidelity','fid',[['caption','Verbatim title or caption'],['excerpt','Search excerpt'],['article','Quoted by article'],['ver','Phrase confirmed only']])+
    '<label>Filter text<input type="search" data-key="q" placeholder="Search quotes"></label><span class="count" id="listen-count"></span></div><div class="grid two" id="listen-list"></div>';
  h += '<h3 style="font-family:var(--display);font-size:26px;font-weight:400;margin:30px 0 6px">Recurring language</h3><p class="small muted">Words and phrases that recur across the sources. Each links to an example. Recurrence here means it appeared repeatedly in what search could reach, not that it is universal.</p><div class="table-wrap"><table><thead><tr><th scope="col">Phrase</th><th scope="col">How it is used</th><th scope="col">Segments</th><th scope="col">Example source</th></tr></thead><tbody>'+D.glossary.map(function(g){
    return '<tr><td style="font-weight:600">'+esc(g.term)+'</td><td>'+esc(g.meaning)+'</td><td>'+(g.segs||[]).map(segTag).join(' ')+'</td><td class="small">'+(g.sources||[]).map(function(id){var s=SRC[id];return s?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.pub)+'</a>':'';}).join(', ')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
  h += '<h3 style="font-family:var(--display);font-size:26px;font-weight:400;margin:30px 0 6px">Discussion dynamics</h3><div class="grid two">'+D.dynamics.map(function(d){return '<div class="card" id="item-'+esc(d.id)+'"><div class="card-top"><span class="cat">'+esc(d.cat)+'</span>'+levelBadge(d.level)+'</div><h3>'+esc(d.title)+'</h3><p>'+esc(d.summary)+'</p>'+evidenceHTML(d)+'</div>';}).join('')+'</div>';
  $('#panel-listen').innerHTML = h;
  bindFilters($('#listen-filters'),listenState,drawListen);
  drawListen();
};
function drawListen(){
  var st = listenState;
  var list = D.listening.filter(function(x){
    var s = SRC[x.src]||{};
    if(st.segs&&st.segs.length&&!st.segs.some(function(g){return hasSeg(x,g);})) return false;
    if(st.platform&&s.platform!==st.platform) return false;
    if(st.theme&&x.theme!==st.theme) return false;
    if(st.tone&&x.tone!==st.tone) return false;
    if(st.rec&&recency(s.date)!==st.rec) return false;
    if(st.fid==='ver'&&!x.ver) return false;
    if(st.fid&&st.fid!=='ver'&&x.fid!==st.fid) return false;
    if(st.q&&(x.q+' '+x.theme+' '+(s.title||'')).toLowerCase().indexOf(st.q)<0) return false;
    return true;
  }).sort(function(a,b){var da=parseDate((SRC[a.src]||{}).date),db=parseDate((SRC[b.src]||{}).date);return (db?db.getTime():0)-(da?da.getTime():0);});
  $('#listen-count').textContent = list.length+' of '+D.listening.length+' statements';
  $('#listen-list').innerHTML = list.length?list.map(function(x){
    var s = SRC[x.src]||{};
    return '<article class="card" id="item-'+esc(x.id)+'"><div class="card-top"><span class="cat">'+esc(s.platform||'')+' \u00b7 '+fmtDate(s.date)+'</span><span style="display:flex;gap:6px;align-items:center"><span class="tag">'+esc(REC_LABEL[recency(s.date)])+'</span>'+starBtn(x.id,'quote')+'</span></div>'+
      '<blockquote class="q" style="margin-top:4px"><p>\u201c'+esc(x.q)+'\u201d</p></blockquote>'+
      '<div class="ind"><span>Theme: <b>'+esc(x.theme)+'</b></span><span title="Tone is a qualitative reading of the language, not a sentiment score.">Tone (judgment): <b>'+esc(x.tone)+'</b></span>'+(x.who?'<span>'+esc(x.who)+'</span>':'')+'</div>'+
      '<div style="margin:4px 0 8px">'+fidHTML(x)+'</div>'+tagsHTML(x.segs,[])+
      '<div class="small"><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+(sameText(s.title,x.q)?'View the source':esc(s.title))+'</a> <span aria-hidden="true">\u2197</span><div class="src-meta">'+esc(s.pub)+' \u00b7 '+esc(s.type)+'</div></div>'+
      (x.note?'<p class="small muted" style="margin-top:8px">'+esc(x.note)+'</p>':'')+'</article>';
  }).join(''):'<div class="empty">No statements match these filters.</div>';
}

/* Landscape */
var landState = {segs:[]};
RENDER.landscape = function(){
  var C = D.creators, LS = D.landscape;
  var plats = uniq([].concat.apply([],C.map(function(c){return c.platforms;}))).sort();
  var h = head('07 \u00b7 Competitor and Content Landscape','Who is <em>already</em> talking to her',esc(LS.intro));
  h += '<div class="filters" id="land-filters">'+segChips('land',false)+selectHTML('Platform','platform',plats.map(function(p){return [p,p];}))+selectHTML('Creator type','ctype',uniq(C.map(function(c){return c.ctype;})).map(function(x){return [x,x];}))+'<label>Filter text<input type="search" data-key="q" placeholder="Name, topic, format"></label><span class="count" id="land-count"></span></div><div class="grid three" id="land-list"></div>';
  h += '<div class="grid two" style="margin-top:26px">';
  [['Common content patterns',LS.patterns],['Repetitive or formulaic content',LS.repetitive],['Overrepresented perspectives',LS.overrep],['Underserved topics and audiences',LS.underserved],['High-performing or high-discussion topics (where verifiable)',LS.performing],['Where a genuinely different voice fits',LS.opportunities]].forEach(function(b){
    h += '<div class="card"><h3 style="font-family:var(--display);font-size:24px;font-weight:400">'+esc(b[0])+'</h3>'+(b[1]||[]).map(function(x){return '<div id="item-'+esc(x.id)+'" style="padding:10px 0;border-top:1px solid var(--line)"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px"><b>'+esc(x.title)+'</b>'+levelBadge(x.level)+'</div><p class="small" style="margin:0">'+esc(x.summary)+'</p>'+evidenceHTML(x)+'</div>';}).join('')+'</div>';
  });
  h += '</div>';
  $('#panel-landscape').innerHTML = h;
  bindFilters($('#land-filters'),landState,drawLand);
  drawLand();
};
function drawLand(){
  var st = landState;
  var list = D.creators.filter(function(c){
    if(st.segs&&st.segs.length&&!st.segs.some(function(g){return hasSeg(c,g);})) return false;
    if(st.platform&&c.platforms.indexOf(st.platform)<0) return false;
    if(st.ctype&&c.ctype!==st.ctype) return false;
    if(st.q&&textOf(c).indexOf(st.q)<0&&(c.formats||'').toLowerCase().indexOf(st.q)<0&&(c.topicsText||'').toLowerCase().indexOf(st.q)<0) return false;
    return true;
  });
  $('#land-count').textContent = list.length+' of '+D.creators.length+' creators and publications';
  $('#land-list').innerHTML = list.length?list.map(function(c){
    return '<article class="card" id="item-'+esc(c.id)+'"><div class="card-top"><span class="cat">'+esc(c.ctype)+'</span>'+starBtn(c.id,c.name)+'</div><h3>'+esc(c.name)+'</h3><div class="small muted" style="margin-bottom:6px">'+esc(c.platforms.join(' \u00b7 '))+'</div>'+
      '<p>'+esc(c.focus)+'</p><dl class="kv">'+
      (c.formats?'<div><dt>Formats</dt><dd>'+esc(c.formats)+'</dd></div>':'')+
      (c.topicsText?'<div><dt>Recurring topics</dt><dd>'+esc(c.topicsText)+'</dd></div>':'')+
      '<div><dt>Audience size</dt><dd>'+esc(c.audience||'Not verified')+'</dd></div>'+
      (c.criticism?'<div><dt>Criticism or pushback</dt><dd>'+esc(c.criticism)+'</dd></div>':'')+
      (c.gap?'<div><dt>What they leave open (judgment)</dt><dd>'+esc(c.gap)+'</dd></div>':'')+
      '</dl>'+tagsHTML(c.segs,[])+evidenceHTML(c)+'</article>';
  }).join(''):'<div class="empty">No creators match these filters.</div>';
}

/* Disruptor matrix */
var APPROACH = [
  {id:'advice',name:'Challenge the advice',desc:'Popular recommendations that overlook important realities or fail for certain women.'},
  {id:'assumption',name:'Challenge the assumption',desc:'Widespread misunderstandings about behavior, relationships, productivity, parenting or ADHD.'},
  {id:'standard',name:'Challenge the standard',desc:'Social expectations women are beginning to question or reject.'},
  {id:'approach',name:'Show a different approach',desc:'Practical alternatives and experiments that address unmet needs.'}
];
var disState = {};
RENDER.disrupt = function(){
  var h = head('08 \u00b7 Disruptor Opportunity Matrix','Where a different take has <em>substance</em>',esc(D.disruptIntro));
  h += '<details class="integrity" style="margin:0 0 16px"><summary><svg class="chev" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>How the opportunity ratings work (qualitative judgments, not scores)</summary><div class="body small">'+D.ratingCriteria.map(function(r){return '<p><b>'+esc(r.name)+':</b> '+esc(r.desc)+'</p>';}).join('')+'</div></details>';
  h += '<div class="filters" id="dis-filters">'+selectHTML('Content pillar','pillar',D.pillars.map(function(p){return [String(p.n),'Pillar '+p.n+': '+p.name];}))+selectHTML('Evidence strength','ev',[['Strong','Strong'],['Moderate','Moderate'],['Emerging','Emerging']])+'<label>Filter text<input type="search" data-key="q" placeholder="Search opportunities"></label><span class="count" id="dis-count"></span></div><div class="matrix" id="dis-list"></div>';
  $('#panel-disrupt').innerHTML = h;
  bindFilters($('#dis-filters'),disState,drawDis);
  drawDis();
};
function drawDis(){
  var st = disState, total=0;
  var out = APPROACH.map(function(a){
    var list = D.disruptors.filter(function(d){
      if(d.approach!==a.id) return false;
      if(st.pillar&&d.pillars.indexOf(+st.pillar)<0) return false;
      if(st.ev&&d.ratings.evidence!==st.ev) return false;
      if(st.q&&textOf(d).indexOf(st.q)<0) return false;
      return true;
    });
    total += list.length;
    return '<div class="col"><h3>'+esc(a.name)+'</h3><p>'+esc(a.desc)+'</p>'+(list.length?list.map(function(d){
      return '<details class="card" id="item-'+esc(d.id)+'" style="margin-bottom:10px;padding:14px"><summary style="cursor:pointer;list-style:none"><b style="font-size:15.5px;display:block;line-height:1.35">'+esc(d.title)+'</b><div class="tags" style="margin-top:8px">'+
        '<span class="tag">Evidence: '+esc(d.ratings.evidence)+'</span><span class="tag">Resonance: '+esc(d.ratings.resonance)+'</span><span class="tag">Differentiation: '+esc(d.ratings.differentiation)+'</span>'+d.pillars.map(function(p){return '<span class="tag">Pillar '+p+'</span>';}).join('')+'</div><span class="small" style="color:var(--accent);font-weight:600">+ Open the full case</span></summary>'+
        '<dl class="kv" style="margin-top:12px"><div><dt>The conventional belief</dt><dd>'+esc(d.conventional)+'</dd></div><div><dt>What the audience is actually experiencing</dt><dd>'+esc(d.experiencing)+'</dd></div><div><dt>Why the belief is incomplete or misleading</dt><dd>'+esc(d.whyIncomplete)+'</dd></div><div><dt>Evidence</dt><dd>'+esc(d.evidence)+'</dd></div><div><dt>Alternative perspective worth exploring</dt><dd>'+esc(d.alternative)+'</dd></div><div><dt>Why it matters to your audience</dt><dd>'+esc(d.relevance)+'</dd></div>'+
        '<div><dt>Brand fit (judgment)</dt><dd>'+esc(d.ratings.fit)+'</dd></div>'+(d.caution?'<div><dt>Handle with care</dt><dd>'+esc(d.caution)+'</dd></div>':'')+'</dl>'+
        '<div style="display:flex;justify-content:space-between;align-items:center">'+levelBadge(d.level||'hypothesis')+starBtn(d.id,d.title)+'</div>'+
        '<h4>Sources</h4><ul class="src-list">'+uniq(d.sources).map(srcLine).join('')+'</ul></details>';
    }).join(''):'<div class="empty small">None match.</div>')+'</div>';
  }).join('');
  $('#dis-count').textContent = total+' of '+D.disruptors.length+' opportunities';
  $('#dis-list').innerHTML = out;
}

/* Recommendations */
RENDER.recs = function(){
  var R = D.recs;
  var h = head('09 \u00b7 Strategic Recommendations','What to do with <em>all of this</em>',esc(R.intro));
  function block(title,items){
    return '<div class="card"><h3 style="font-family:var(--display);font-size:24px;font-weight:400">'+esc(title)+'</h3><ol class="numbered">'+items.map(function(x){
      return '<li id="item-'+esc(x.id)+'"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px"><b>'+esc(x.title)+'</b>'+levelBadge(x.level||'hypothesis')+'</div><p class="small" style="margin:0">'+esc(x.summary)+'</p>'+(x.links&&x.links.length?'<p class="small" style="margin:6px 0 0">Related: '+x.links.map(function(l){return '<a href="#" data-jump="'+esc(l)+'">'+esc(lookupTitle(l))+'</a>';}).join(' \u00b7 ')+'</p>':'')+evidenceHTML(x)+'</li>';
    }).join('')+'</ol></div>';
  }
  h += '<div class="grid two">'+block('Most promising audience problems',R.problems)+block('Strongest opportunities for differentiated content',R.differentiation)+'</div>';
  h += '<h3 style="font-family:var(--display);font-size:26px;font-weight:400;margin:26px 0 10px">Aligned to your four content pillars</h3><div class="grid two">'+D.pillars.map(function(p){
    var items = R.pillars.filter(function(x){return x.pillar===p.n;});
    return '<div class="card"><span class="eyebrow">Pillar '+p.n+'</span><h3 style="font-family:var(--display);font-size:24px;font-weight:400">'+esc(p.name)+'</h3><p class="small muted">'+esc(p.desc)+'</p>'+items.map(function(x){
      return '<div id="item-'+esc(x.id)+'" style="padding:10px 0;border-top:1px solid var(--line)"><b>'+esc(x.title)+'</b><p class="small" style="margin:4px 0 0">'+esc(x.summary)+'</p>'+(x.links&&x.links.length?'<p class="small" style="margin:4px 0 0">Evidence: '+x.links.map(function(l){return '<a href="#" data-jump="'+esc(l)+'">'+esc(lookupTitle(l))+'</a>';}).join(' \u00b7 ')+'</p>':'')+'</div>';
    }).join('')+'</div>';
  }).join('')+'</div>';
  h += '<div class="grid two" style="margin-top:22px">'+block('Topics deserving further investigation',R.investigate)+block('How to use this with a relationship-first goal',R.approach)+'</div>';
  $('#panel-recs').innerHTML = h;
};
/* Content Resources */
var resState = {segs:[]}, covState = {segs:[]};
var FLAG_ICO = {create:'+', edit:'✎', use:'✓'};
var FLAG_ORDER = ['use','edit','create'];
var PRIO = {Now:0, Next:1, Later:2};
function flagInfo(id){var f=((D.resources&&D.resources.flags)||[]).filter(function(x){return x.id===id;})[0];return f||{id:id,name:id,desc:''};}
function flagBadge(id){var f=flagInfo(id);return '<span class="badge fl-'+esc(id)+'" title="'+esc(f.desc)+'"><span class="ico" aria-hidden="true">'+(FLAG_ICO[id]||'')+'</span>'+esc(f.name)+'</span>';}
var COV = {
  yes:{name:'Covered',desc:'The 2020 workbooks address this in a way that matches the research.'},
  part:{name:'Partly',desc:'Touched on, but the research suggests something important is missing.'},
  conflict:{name:'Works against it',desc:'Addressed in a way the research suggests backfires with this audience.'},
  no:{name:'Not covered',desc:'Nothing in the three workbooks addresses this.'}
};
function covBadge(c){var x=COV[c]||COV.no;return '<span class="badge cv-'+esc(c)+'" title="'+esc(x.desc)+'">'+esc(x.name)+'</span>';}
function jumpList(ids){return (ids||[]).map(function(l){return '<a href="#" data-jump="'+esc(l)+'">'+esc(lookupTitle(l))+'</a>';}).join(' · ');}
function srcInline(ids){
  if(!ids||!ids.length) return '';
  return '<div class="src-meta" style="margin-top:3px">Source: '+ids.map(function(id){var s=SRC[id];return s?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a> ('+esc(s.pub)+')':esc(id);}).join(' · ')+'</div>';
}
function auditList(arr){
  return '<ul class="tight">'+arr.map(function(b){
    return '<li>'+esc(b.text)+(b.links&&b.links.length?'<div class="src-meta" style="margin-top:3px">In the research: '+jumpList(b.links)+'</div>':'')+srcInline(b.sources)+'</li>';
  }).join('')+'</ul>';
}
var ITEM_MAP = null;
function itemById(id){
  if(!ITEM_MAP){ITEM_MAP={};['painPoints','sickOf','wants','disruptors'].forEach(function(k){D[k].forEach(function(i){ITEM_MAP[i.id]=i;});});}
  return ITEM_MAP[id];
}
function resById(id){return D.resources.items.filter(function(r){return r.id===id;})[0];}
function resCard(r){
  var lead = r.flag==='create'?'What to build':(r.flag==='use'?'Before you post it':'What to change');
  return '<article class="card" id="item-'+esc(r.id)+'">'+
    '<div class="card-top"><span class="cat">'+(r.type==='content'?'Content piece':'Resource')+'</span><span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'+flagBadge(r.flag)+starBtn(r.id,r.title)+'</span></div>'+
    '<h3>'+esc(r.title)+'</h3>'+
    '<p>'+esc(r.what)+'</p>'+
    '<dl class="kv">'+
      '<div><dt>Built from</dt><dd>'+esc(r.from)+'</dd></div>'+
      '<div><dt>Format and home</dt><dd>'+esc(r.format)+' · '+esc(r.home)+'</dd></div>'+
      (r.changes&&r.changes.length?'<div><dt>'+lead+'</dt><dd><ul class="tight">'+r.changes.map(function(c){return '<li>'+esc(c)+'</li>';}).join('')+'</ul></dd></div>':'')+
      '<div><dt>Why the research supports it</dt><dd>'+esc(r.why)+'</dd></div>'+
      (r.caution?'<div><dt>Handle with care</dt><dd>'+esc(r.caution)+'</dd></div>':'')+
      '<div><dt>Pain points and evidence</dt><dd class="small">'+jumpList(r.links)+'</dd></div>'+
    '</dl>'+
    '<div class="tags"><span class="tag">Priority: '+esc(r.priority)+'</span>'+(r.pillars||[]).map(function(p){return '<span class="tag">Pillar '+p+'</span>';}).join('')+(r.segs||[]).map(segTag).join('')+'</div>'+
    '<div style="margin-top:10px">'+levelBadge('hypothesis')+'</div>'+
    evidenceHTML(r)+
  '</article>';
}
function resPasses(r,st){
  if(st.flag&&r.flag!==st.flag) return false;
  if(st.type&&r.type!==st.type) return false;
  if(st.pillar&&(r.pillars||[]).indexOf(+st.pillar)<0) return false;
  if(st.priority&&r.priority!==st.priority) return false;
  if(st.segs&&st.segs.length&&!st.segs.some(function(s){return hasSeg(r,s);})) return false;
  if(st.q&&textOf(r).indexOf(st.q)<0) return false;
  return true;
}
function drawRes(){
  var items = D.resources.items, list = items.filter(function(r){return resPasses(r,resState);});
  $('#res-count').textContent = list.length+' of '+items.length+' pieces';
  var out = FLAG_ORDER.map(function(f){
    var sub = list.filter(function(r){return r.flag===f;}).sort(function(a,b){return PRIO[a.priority]-PRIO[b.priority];});
    if(!sub.length) return '';
    return '<h4 class="flag-h">'+flagBadge(f)+' <span class="muted small">'+sub.length+' · '+esc(flagInfo(f).desc)+'</span></h4><div class="grid two">'+sub.map(resCard).join('')+'</div>';
  }).join('');
  $('#res-list').innerHTML = out || '<div class="empty">Nothing matches these filters.</div>';
}
function drawCov(){
  var st = covState, all = D.resources.coverage;
  var rows = all.filter(function(c){
    var it = itemById(c[0])||{};
    if(st.cov&&c[1]!==st.cov) return false;
    if(st.has==='with'&&!c[3]) return false;
    if(st.has==='without'&&c[3]) return false;
    if(st.segs&&st.segs.length&&!st.segs.some(function(s){return hasSeg(it,s);})) return false;
    return true;
  });
  $('#cov-count').textContent = rows.length+' of '+all.length+' rows';
  $('#cov-body').innerHTML = rows.length?rows.map(function(c){
    var it = itemById(c[0])||{}, res = c[3]?c[3].split(' '):[];
    return '<tr><td class="c-item"><a href="#" data-jump="'+esc(c[0])+'">'+esc(lookupTitle(c[0]))+'</a><div class="src-meta">'+esc(INDEX[c[0]]?INDEX[c[0]].section:'')+'</div></td>'+
      '<td class="c-who"><div class="tags" style="margin:0">'+(it.segs||[]).map(segTag).join('')+'</div></td>'+
      '<td class="c-cov"><span class="c-lab">2020 workbooks: </span>'+covBadge(c[1])+(c[2]?'<div class="src-meta" style="margin-top:4px">'+esc(c[2])+'</div>':'')+(c[4]?'<div class="small" style="margin-top:4px">'+esc(c[4])+'</div>':'')+'</td>'+
      '<td class="c-res"><span class="c-lab">Addressed now by</span>'+(res.length?res.map(function(id){var r=resById(id);return '<div style="margin-bottom:6px"><a href="#" data-jump="'+esc(id)+'">'+esc(r?r.title:id)+'</a> <span class="fl-mini fl-'+esc(r?r.flag:'')+'">'+esc(r?flagInfo(r.flag).name:'')+'</span></div>';}).join(''):'<span class="muted small">Nothing planned yet</span>')+'</td></tr>';
  }).join(''):'<tr><td colspan="4"><div class="empty">Nothing matches these filters.</div></td></tr>';
}
function auditCard(p){
  return '<details class="card audit" id="item-'+esc(p.id)+'"><summary><span class="cat">'+esc(p.label)+'</span><b class="audit-title">'+esc(p.name)+'</b>'+
    '<div class="tags" style="margin-top:6px"><span class="tag">'+p.holds.length+' still hold up</span><span class="tag">'+p.change.length+' to change</span><span class="tag">'+p.fix.length+' to fix before reuse</span></div>'+
    '<span class="small" style="color:var(--accent);font-weight:600">+ Open the audit</span></summary>'+
    '<p class="small" style="margin-top:12px"><b>Inside:</b> '+esc(p.inside)+'</p>'+
    '<div class="grid three">'+
      '<div><h4>What still holds up</h4>'+auditList(p.holds)+'</div>'+
      '<div><h4>What the research says to change</h4>'+auditList(p.change)+'</div>'+
      '<div><h4>Fix before you reuse it</h4>'+auditList(p.fix)+'</div>'+
    '</div>'+
    '<p class="small" style="margin:12px 0 0"><b>Becomes:</b> '+jumpList(p.becomes)+'</p>'+
  '</details>';
}
RENDER.resources = function(){
  var R = D.resources;
  var h = head('10 · Content Resources','Your 2020 workbooks, <em>rebuilt</em>',esc(R.intro));
  var n = {create:0,edit:0,use:0}; R.items.forEach(function(r){n[r.flag]++;});
  var open = R.coverage.filter(function(c){return c[1]==='no'&&!c[3];}).length;
  h += '<div class="hero-strip">'+FLAG_ORDER.map(function(f){return '<div class="stat"><div class="n">'+n[f]+'</div><div class="l">'+flagBadge(f)+'<div style="margin-top:6px">'+esc(flagInfo(f).desc)+'</div></div></div>';}).join('')+
    '<div class="stat"><div class="n">'+open+'</div><div class="l">Pain points with nothing planned yet. These are future content topics, not workbook fixes.</div></div></div>';
  h += '<h3 class="sec-h">How to rebrand them</h3><div class="grid two">'+
    '<div class="card"><h3>Where each piece lives</h3><ul class="tight">'+R.homes.map(function(x){return '<li><b>'+esc(x.brand)+':</b> '+esc(x.role)+'</li>';}).join('')+'</ul><p class="small muted" style="margin:8px 0 0">'+esc(R.funnel)+'</p></div>'+
    '<div class="card"><h3>Strip from every workbook</h3><ul class="tight">'+R.removeEverywhere.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
    '<div class="card"><h3>A decision only you can make: faith content</h3><p class="small" style="margin:0">'+esc(R.faith)+'</p></div>'+
    '<div class="card"><h3>What was reviewed</h3><p class="small" style="margin:0">'+esc(R.notUploaded)+' Added '+esc(R.added)+'.</p><p class="small" style="margin:8px 0 0"><b>Priority:</b> '+R.priorities.map(function(p){return esc(p.id)+' = '+esc(p.desc);}).join(' ')+'</p></div>'+
  '</div>';
  h += '<h3 class="sec-h">Your content resources, flagged</h3>';
  h += '<div class="filters" id="res-filters">'+segChips('res',true)+selectHTML('Flag','flag',FLAG_ORDER.map(function(f){return [f,flagInfo(f).name];}))+selectHTML('Type','type',[['resource','Resource'],['content','Content piece']])+selectHTML('Content pillar','pillar',D.pillars.map(function(p){return [String(p.n),'Pillar '+p.n+': '+p.name];}))+selectHTML('Priority','priority',[['Now','Now'],['Next','Next'],['Later','Later']])+'<label>Filter text<input type="search" data-key="q" placeholder="Search resources"></label><span class="count" id="res-count"></span></div><div id="res-list"></div>';
  h += '<h3 class="sec-h">Pain points: what your workbooks covered, and what covers them now</h3><p class="small muted" style="margin-top:-4px">Every pain point in this research, plus the wants and rejected advice your workbooks touch. Use the segment filter to see ADHD-specific rows or rows that apply to all mothers. Coverage is my reading of the workbooks against the research, not a measured score.</p>';
  h += '<div class="filters" id="cov-filters">'+segChips('cov',true)+selectHTML('2020 coverage','cov',Object.keys(COV).map(function(k){return [k,COV[k].name];}))+selectHTML('Planned resource','has',[['with','Has a planned resource'],['without','Nothing planned yet']])+'<span class="count" id="cov-count"></span></div>';
  h += '<div class="table-wrap"><table class="cov-table"><thead><tr><th scope="col">Pain point or need</th><th scope="col">Who</th><th scope="col">Your 2020 workbooks</th><th scope="col">Addressed now by</th></tr></thead><tbody id="cov-body"></tbody></table></div>';
  h += '<h3 class="sec-h">The three workbooks, checked against the research</h3><div class="grid">'+R.products.map(auditCard).join('')+'</div>';
  $('#panel-resources').innerHTML = h;
  bindFilters($('#res-filters'),resState,drawRes);
  bindFilters($('#cov-filters'),covState,drawCov);
  drawRes(); drawCov();
};
var INDEX = {};
function lookupTitle(id){var x=INDEX[id];return x?x.title:id;}
document.addEventListener('click',function(e){
  var a = e.target.closest('[data-jump]'); if(!a) return;
  e.preventDefault(); var x = INDEX[a.getAttribute('data-jump')]; if(x) go(x.tab,'item-'+x.id);
});

/* Library */
var libState = {sort:'date',dir:-1};
RENDER.library = function(){
  var S = D.sources;
  var cited = {};
  ['painPoints','sickOf','wants','disruptors','creators'].forEach(function(k){D[k].forEach(function(i){allSources(i).forEach(function(id){cited[id]=(cited[id]||0)+1;});});});
  D.listening.forEach(function(x){cited[x.src]=(cited[x.src]||0)+1;});
  D.exec.findings.concat(D.exec.patterns,D.exec.surprises,D.exec.implications).forEach(function(i){allSources(i).forEach(function(id){cited[id]=(cited[id]||0)+1;});});
  if(D.resources){D.resources.items.forEach(function(i){allSources(i).forEach(function(id){cited[id]=(cited[id]||0)+1;});});D.resources.products.forEach(function(p){p.holds.concat(p.change,p.fix).forEach(function(b){(b.sources||[]).forEach(function(id){cited[id]=(cited[id]||0)+1;});});});}
  S.forEach(function(s){s._cited=cited[s.id]||0;});
  var h = head('11 \u00b7 Research Library','Every source, <em>linked</em>',esc(D.libraryIntro));
  h += '<div class="filters" id="lib-filters">'+selectHTML('Source type','type',uniq(S.map(function(s){return s.type;})).sort().map(function(x){return [x,x];}))+selectHTML('Platform','platform',uniq(S.map(function(s){return s.platform;})).sort().map(function(x){return [x,x];}))+selectHTML('Evidence quality','quality',[['High','High'],['Moderate','Moderate'],['Low','Low']])+selectHTML('Recency','rec',[['90d','Last 90 days'],['12m','Last 12 months'],['older','Older'],['undated','Date not shown']])+
    '<label>Filter text<input type="search" data-key="q" placeholder="Title, publisher, note"></label><button class="btn small" id="lib-csv" type="button">'+(ART?'Copy as CSV':'Export CSV')+'</button><span class="count" id="lib-count"></span></div>';
  h += '<div class="table-wrap"><table id="lib-table"><thead><tr>'+[['title','Source'],['type','Type'],['platform','Platform'],['date','Date'],['quality','Evidence quality'],['_cited','Cited in']].map(function(c){return '<th scope="col"><button type="button" data-sort="'+c[0]+'">'+c[1]+' <span aria-hidden="true">\u2195</span></button></th>';}).join('')+'</tr></thead><tbody id="lib-body"></tbody></table></div>';
  h += '<h3 style="font-family:var(--display);font-size:28px;font-weight:400;margin:34px 0 8px" id="limitations">Research limitations</h3>';
  h += '<div class="table-wrap"><table><thead><tr><th scope="col">Platform or source</th><th scope="col">Access status</th><th scope="col">What could be seen</th><th scope="col">What could not</th></tr></thead><tbody>'+D.limitations.platforms.map(function(p){return '<tr><td style="font-weight:600">'+esc(p.platform)+'</td><td>'+esc(p.status)+'</td><td>'+esc(p.could)+'</td><td>'+esc(p.couldnt)+'</td></tr>';}).join('')+'</tbody></table></div>';
  h += '<div class="grid two" style="margin-top:16px"><div class="card"><h3>Method</h3><ul>'+D.limitations.method.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul></div><div class="card"><h3>Known gaps and cautions</h3><ul>'+D.limitations.gaps.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul></div></div>';
  $('#panel-library').innerHTML = h;
  bindFilters($('#lib-filters'),libState,drawLib);
  $all('[data-sort]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-sort');if(libState.sort===k)libState.dir*=-1;else{libState.sort=k;libState.dir=(k==='title'||k==='type'||k==='platform')?1:-1;}drawLib();});});
  $('#lib-csv').addEventListener('click',function(){exportCSV(libFiltered());});
  drawLib();
};
function libFiltered(){
  var st = libState;
  var list = D.sources.filter(function(s){
    if(st.type&&s.type!==st.type) return false;
    if(st.platform&&s.platform!==st.platform) return false;
    if(st.quality&&s.quality!==st.quality) return false;
    if(st.rec&&recency(s.date)!==st.rec) return false;
    if(st.q&&(s.title+' '+s.pub+' '+(s.note||'')).toLowerCase().indexOf(st.q)<0) return false;
    return true;
  });
  var k = st.sort, d = st.dir;
  list.sort(function(a,b){
    if(k==='date'){var x=parseDate(a.date),y=parseDate(b.date);return d*((x?x.getTime():0)-(y?y.getTime():0));}
    if(k==='_cited') return d*((a._cited||0)-(b._cited||0));
    if(k==='quality'){var o={High:3,Moderate:2,Low:1};return d*((o[a.quality]||0)-(o[b.quality]||0));}
    return d*String(a[k]||'').localeCompare(String(b[k]||''));
  });
  return list;
}
function drawLib(){
  var list = libFiltered();
  $('#lib-count').textContent = list.length+' of '+D.sources.length+' sources';
  $('#lib-body').innerHTML = list.map(function(s){
    return '<tr id="src-'+esc(s.id)+'"><td style="min-width:260px"><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a><div class="src-meta">'+esc(s.pub)+(s.note?' \u00b7 '+esc(s.note):'')+'</div></td><td>'+esc(s.type)+'</td><td>'+esc(s.platform)+'</td><td class="num">'+fmtDate(s.date)+'<div class="src-meta">'+esc(REC_LABEL[recency(s.date)])+'</div></td><td>'+esc(s.quality||'')+'</td><td class="num">'+(s._cited||0)+'</td></tr>';
  }).join('') || '<tr><td colspan="6" class="muted">No sources match.</td></tr>';
}
function exportCSV(list){
  var cols = ['title','url','pub','platform','date','type','quality','note'];
  var csv = cols.join(',')+'\n'+list.map(function(s){return cols.map(function(c){return '"'+String(s[c]||'').replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  output('audience-research-sources.csv','text/csv',csv,'CSV');
}
function output(name,type,content,label){ if(ART) copyText(content,label); else download(name,type,content); }
function copyText(text,label){
  function fallback(){
    var box=$('#copy-box');
    if(!box){box=document.createElement('div');box.id='copy-box';box.className='card';box.style.cssText='position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom, 0px));z-index:60;max-width:720px;margin:0 auto';
      box.innerHTML='<div class="card-top"><b>Copy this text</b><button class="btn small" type="button" id="copy-close">Close</button></div><label for="copy-text" class="sr-only">Text to copy</label><textarea id="copy-text" style="width:100%;min-height:160px;font:13px/1.4 ui-monospace,monospace;background:var(--bg);color:var(--ink);border:1px solid var(--line-strong);border-radius:8px;padding:8px"></textarea><p class="small muted" style="margin:6px 0 0">Select all, then copy with Ctrl+C or Cmd+C.</p>';
      document.body.appendChild(box);$('#copy-close').addEventListener('click',function(){box.remove();});}
    var ta=$('#copy-text'); ta.value=text; ta.focus(); ta.select();
  }
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(function(){toast(label+' copied to clipboard');},fallback); return; } }catch(e){}
  fallback();
}
function download(name,type,content){
  try{var blob=new Blob([content],{type:type});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);toast('Downloaded '+name);}catch(e){toast('Download is not available here');}
}

/* My research log */
RENDER.log = function(){
  var entries = store('log') || [];
  var h = head('12 \u00b7 My Research Log','Keep this <em>going</em>',esc(D.logIntro));
  var starred = Object.keys(stars).sort(function(a,b){return stars[b]-stars[a];}).map(function(id){return INDEX[id];}).filter(Boolean);
  h += '<div class="grid two"><div class="card"><h3>Saved items ('+starred.length+')</h3>'+(starred.length?'<ul class="src-list">'+starred.map(function(x){return '<li><a href="#" data-jump="'+esc(x.id)+'">'+esc(x.title)+'</a><div class="src-meta">'+esc(x.section)+'</div></li>';}).join('')+'</ul>':'<p class="muted small">Select the \u2606 on any finding, quote, creator or opportunity to save it here.</p>')+'</div>';
  h += '<div class="card"><h3>Add a new observation</h3><p class="small muted">'+(ART?'Saved in this browser only. Use Copy log to keep a backup, and Import to bring a saved log onto another device.':'Saved in this browser only. Export to keep a copy or move it to another device.')+'</p><form id="log-form" class="form-grid">'+
    '<label class="full">What you observed<textarea name="obs" required placeholder="e.g. Comment thread under a reel about school pickup guilt"></textarea></label>'+
    '<label class="full">Exact quote (only if copied word for word)<textarea name="quote" placeholder="Paste exact wording"></textarea></label>'+
    '<label>Link<input name="url" type="url" placeholder="https://"></label>'+
    '<label>Platform<select name="platform"><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>Reddit</option><option>Substack</option><option>DMs or comments on my content</option><option>Research or survey</option><option>Other</option></select></label>'+
    '<label>Date seen<input name="date" type="date"></label>'+
    '<label>Segment<select name="seg">'+D.segments.map(function(s){return '<option value="'+s.id+'">'+esc(s.short)+'</option>';}).join('')+'</select></label>'+
    '<label>Evidence type<select name="type"><option>Firsthand</option><option>Research</option><option>Journalism</option><option>Expert/Creator</option><option>My interpretation</option></select></label>'+
    '<div class="full" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">Save observation</button><button class="btn" type="button" id="log-export">'+(ART?'Copy log (JSON)':'Export log (JSON)')+'</button><label class="btn" style="cursor:pointer">Import JSON<input id="log-import" type="file" accept="application/json" class="sr-only"></label></div></form></div></div>';
  h += '<h3 style="font-family:var(--display);font-size:26px;font-weight:400;margin:26px 0 10px">Your observations ('+entries.length+')</h3>';
  h += entries.length?'<div class="grid two">'+entries.slice().reverse().map(function(e,i){var idx=entries.length-1-i;return '<article class="card"><div class="card-top"><span class="cat">'+esc(e.platform)+' \u00b7 '+(e.date?fmtDate(e.date):'Date not set')+'</span><button class="btn small" data-del="'+idx+'" type="button">Delete</button></div><p>'+esc(e.obs)+'</p>'+(e.quote?'<blockquote class="q"><p>\u201c'+esc(e.quote)+'\u201d</p></blockquote>':'')+'<div class="tags">'+segTag(e.seg)+'<span class="tag">'+esc(e.type)+'</span></div>'+(e.url?'<a class="small" href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">'+esc(e.url)+'</a>':'')+'</article>';}).join('')+'</div>':'<div class="empty">No observations yet. Your own comment sections and DMs are the best next data source.</div>';
  h += '<div class="card" style="margin-top:22px"><h3>Suggested listening routine</h3><ul>'+D.routine.map(function(r){return '<li>'+esc(r)+'</li>';}).join('')+'</ul></div>';
  $('#panel-log').innerHTML = h;
  $('#log-form').addEventListener('submit',function(ev){
    ev.preventDefault(); var f = ev.target; var e = {obs:f.obs.value.trim(),quote:f.quote.value.trim(),url:f.url.value.trim(),platform:f.platform.value,date:f.date.value,seg:f.seg.value,type:f.type.value,added:new Date().toISOString()};
    if(!e.obs) return; var list = store('log')||[]; list.push(e); if(store('log',list)===null&&!store('log')) toast('Could not save: browser storage is unavailable'); else toast('Observation saved'); RENDER.log();
  });
  $all('[data-del]').forEach(function(b){b.addEventListener('click',function(){var list=store('log')||[];list.splice(+b.getAttribute('data-del'),1);store('log',list);RENDER.log();});});
  $('#log-export').addEventListener('click',function(){output('my-audience-research-log.json','application/json',JSON.stringify({exported:new Date().toISOString(),observations:store('log')||[],saved:Object.keys(stars)},null,2),'Log');});
  $('#log-import').addEventListener('change',function(ev){var file=ev.target.files[0];if(!file)return;var r=new FileReader();r.onload=function(){try{var j=JSON.parse(r.result);var cur=store('log')||[];store('log',cur.concat(j.observations||[]));(j.saved||[]).forEach(function(id){stars[id]=stars[id]||Date.now();});store('stars',stars);toast('Imported');RENDER.log();}catch(e){toast('That file could not be read');}};r.readAsText(file);});
};

/* ---------- global search ---------- */
function buildIndex(){
  function add(tab,section,item){INDEX[item.id]={id:item.id,tab:tab,section:section,title:item.title||item.name||(item.q?item.q.slice(0,90)+(item.q.length>90?'\u2026':''):item.id),text:textOf(item)};}
  D.exec.findings.forEach(function(i){add('exec','Executive: key finding',i);});
  D.exec.patterns.forEach(function(i){add('exec','Executive: pattern',i);});
  D.exec.surprises.forEach(function(i){add('exec','Executive: surprise',i);});
  D.exec.implications.forEach(function(i){add('exec','Executive: implication',i);});
  D.painPoints.forEach(function(i){add('pain','Pain point',i);});
  D.sickOf.forEach(function(i){add('sick','Sick of: '+i.cat,i);});
  D.wants.forEach(function(i){add('want','Wants: '+i.cat,i);});
  D.listening.forEach(function(i){add('listen','Social listening',i);});
  D.dynamics.forEach(function(i){add('listen','Discussion dynamics',i);});
  D.creators.forEach(function(i){add('landscape','Creator',i);});
  ['patterns','repetitive','overrep','underserved','performing','opportunities'].forEach(function(k){(D.landscape[k]||[]).forEach(function(i){add('landscape','Landscape',i);});});
  D.disruptors.forEach(function(i){add('disrupt','Disruptor: '+i.approach,i);});
  ['problems','differentiation','investigate','approach','pillars'].forEach(function(k){D.recs[k].forEach(function(i){add('recs','Recommendation',i);});});
  if(D.resources){
    D.resources.items.forEach(function(i){add('resources','Content resource: '+flagInfo(i.flag).name,i);});
    D.resources.products.forEach(function(p){INDEX[p.id]={id:p.id,tab:'resources',section:'2020 workbook audit',title:p.name+' (2020 workbook)',text:(p.name+' '+p.label+' '+p.inside+' '+p.holds.concat(p.change,p.fix).map(function(b){return b.text;}).join(' ')).toLowerCase()};});
  }
}
function globalSearch(q){
  var box = $('#search-results');
  q = q.trim().toLowerCase();
  if(q.length<2){box.classList.remove('open');box.innerHTML='';return;}
  var terms = q.split(/\s+/);
  var hits = Object.keys(INDEX).map(function(k){return INDEX[k];}).filter(function(x){return terms.every(function(t){return x.text.indexOf(t)>-1||x.title.toLowerCase().indexOf(t)>-1;});});
  var srcHits = D.sources.filter(function(s){var t=(s.title+' '+s.pub+' '+(s.note||'')).toLowerCase();return terms.every(function(x){return t.indexOf(x)>-1;});});
  var groups = {};
  hits.forEach(function(x){(groups[x.section]=groups[x.section]||[]).push(x);});
  var h = '<div class="small muted" style="margin-bottom:8px">'+hits.length+' findings and '+srcHits.length+' sources match \u201c'+esc(q)+'\u201d</div>';
  Object.keys(groups).forEach(function(g){
    h += '<div class="sr-group"><h4>'+esc(g)+' ('+groups[g].length+')</h4>'+groups[g].slice(0,12).map(function(x){return '<button class="sr-item" type="button" data-go="'+esc(x.id)+'">'+hl(x.title,terms)+'<small>'+snippet(x.text,terms)+'</small></button>';}).join('')+'</div>';
  });
  if(srcHits.length) h += '<div class="sr-group"><h4>Sources ('+srcHits.length+')</h4>'+srcHits.slice(0,15).map(function(s){return '<a class="sr-item" href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+hl(s.title,terms)+'<small>'+esc(s.pub)+' \u00b7 '+esc(s.platform)+' \u00b7 '+fmtDate(s.date)+'</small></a>';}).join('')+'</div>';
  if(!hits.length&&!srcHits.length) h += '<div class="muted">Nothing found. Try a broader word.</div>';
  box.innerHTML = h; box.classList.add('open');
  $all('[data-go]',box).forEach(function(b){b.addEventListener('click',function(){var x=INDEX[b.getAttribute('data-go')];box.classList.remove('open');go(x.tab,'item-'+x.id);});});
}
function hl(s,terms){var o=esc(s);terms.forEach(function(t){if(t.length<2)return;o=o.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>');});return o;}
function snippet(text,terms){var i=text.indexOf(terms[0]);if(i<0)return '';var s=Math.max(0,i-60);return hl((s>0?'\u2026':'')+text.slice(s,i+110)+'\u2026',terms);}

/* ---------- theme ---------- */
function setTheme(t){
  if(t) document.documentElement.setAttribute('data-theme',t); else document.documentElement.removeAttribute('data-theme');
  store('theme',t||'');
  var dark = t==='dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  $('#theme-btn').setAttribute('aria-pressed',dark?'true':'false');
  $('#theme-btn').lastChild.textContent = dark?' Light mode':' Dark mode';
}

/* ---------- init ---------- */
function init(){
  $('#meta-compiled').textContent = D.meta.compiled;
  $('#meta-window').textContent = D.meta.window;
  $('#meta-sources').textContent = D.sources.length;
  $('#limits-summary').innerHTML = D.meta.accessSummary;
  $('#legend').innerHTML = Object.keys(LEVELS).map(function(k){return '<div>'+levelBadge(k)+'<p class="small" style="margin:6px 0 0">'+esc(LEVELS[k].desc)+'</p></div>';}).join('')+
    Object.keys(FID).filter(function(k){return k!=='data';}).map(function(k){return '<div><span class="fid"><span class="chip">'+esc(FID[k].label)+'</span></span><p class="small" style="margin:6px 0 0">'+esc(FID[k].desc)+'</p></div>';}).join('')+
    '<div><span class="fid"><span class="chip ok">\u2713 Phrase confirmed</span></span><p class="small" style="margin:6px 0 0">An exact-phrase search for the wording returned the same source, which raises confidence that the wording is accurate.</p></div>';
  buildTabs(); buildIndex();
  var sb = $('#global-search'); var t;
  sb.addEventListener('input',function(){clearTimeout(t);t=setTimeout(function(){globalSearch(sb.value);},120);});
  sb.addEventListener('keydown',function(e){if(e.key==='Escape'){sb.value='';globalSearch('');}});
  document.addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){e.preventDefault();sb.focus();}});
  if($('#theme-btn')){
    var saved = store('theme'); if(saved) setTheme(saved); else setTheme('');
    $('#theme-btn').addEventListener('click',function(){var dark=$('#theme-btn').getAttribute('aria-pressed')==='true';setTheme(dark?'light':'dark');});
  }
  if($('#print-btn')) $('#print-btn').addEventListener('click',function(){PANELS.forEach(function(p){if(!rendered[p.id]){RENDER[p.id]();rendered[p.id]=true;}});window.print();});
  window.addEventListener('hashchange',function(){var id=location.hash.slice(1);if(id&&id!==currentTab)go(id);});
  go(location.hash.slice(1)||'exec');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
