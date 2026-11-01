/* ============================================================================
   Cel Archive — Achievements   (celarchive-achievements.js)
   An auto-earned badge shelf computed from your real library. Locked badges
   show how close you are. Mounts into the Stats tab (celarchive-nav.js), under
   your existing stats. No fake levels — everything unlocks from what you log.
   Add with:  <script src="celarchive-achievements.js" defer></script>  (after nav)
   ========================================================================== */
(function () {
  "use strict";
  var LS_LIB = "celarchive.items.v1";
  var page = null;

  function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function lib(){try{var a=JSON.parse(lsGet(LS_LIB)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}

  var SVG = {
    star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.5 7 .8-5.2 4.8L18.4 22 12 18.3 5.6 22 7.2 14.1 2 9.3l7-.8z"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };

  function stats(){
    var items=lib(), SEEN={completed:1,watching:1,unfinished:1,dropped:1,on_hold:1};
    var seasonsOf=function(x){return Array.isArray(x.seasons)?x.seasons:[]};
    var seen=items.filter(function(x){return SEEN[x.status]});
    var done=items.filter(function(x){return x.status==="completed"});
    var scored=items.filter(function(x){return x.score});
    var kinds={}; seen.forEach(function(x){if(x.kind)kinds[x.kind]=1});
    var genres={}; items.forEach(function(x){(x.genres||[]).forEach(function(g){genres[g]=1})});
    var decades={}; items.forEach(function(x){if(x.year)decades[Math.floor(x.year/10)*10]=1});
    return {
      total:items.length, done:done.length, scored:scored.length,
      tens:scored.filter(function(x){return Math.round(x.score)===10}).length,
      genres:Object.keys(genres).length, decades:Object.keys(decades).length,
      seasonsWatched:items.reduce(function(a,x){return a+seasonsOf(x).filter(function(s){return s.watched}).length},0),
      movies:done.filter(function(x){return x.type==="Movie"}).length,
      favs:items.filter(function(x){return x.favorite}).length,
      rew:items.reduce(function(a,x){return a+(x.rewatches||0)},0),
      maxSeasons:items.reduce(function(a,x){return Math.max(a,seasonsOf(x).length)},0),
      kindCount:["anime","donghua","cartoon","aeni"].filter(function(k){return kinds[k]}).length,
      before2000:Object.keys(decades).some(function(d){return +d<2000})
    };
  }

  var BADGES = [
    {n:"First Archive",       d:"Log your first title",                 c:function(S){return {on:S.total>=1}}},
    {n:"Fifty Club",          d:"Complete 50 titles",                   c:function(S){return {cur:S.done,goal:50}}},
    {n:"Century Club",        d:"Complete 100 titles",                  c:function(S){return {cur:S.done,goal:100}}},
    {n:"Critic",              d:"Rate 50 titles",                       c:function(S){return {cur:S.scored,goal:50}}},
    {n:"Perfectionist",       d:"Hand out ten 10/10s",                  c:function(S){return {cur:S.tens,goal:10}}},
    {n:"Marathoner",          d:"Finish a 5+ season series",            c:function(S){return {cur:Math.min(S.maxSeasons,5),goal:5}}},
    {n:"Genre Explorer",      d:"Watch 12 different genres",            c:function(S){return {cur:S.genres,goal:12}}},
    {n:"Decade Hunter",       d:"Watch titles from 6 decades",          c:function(S){return {cur:S.decades,goal:6}}},
    {n:"Globe Trotter",       d:"Anime + Donghua + Cartoon + Aeni",     c:function(S){return {cur:S.kindCount,goal:4}}},
    {n:"Movie Buff",          d:"Complete 10 movies",                   c:function(S){return {cur:S.movies,goal:10}}},
    {n:"Binge Master",        d:"Watch 100 seasons",                    c:function(S){return {cur:S.seasonsWatched,goal:100}}},
    {n:"Favorites Curator",   d:"Mark 10 favorites",                    c:function(S){return {cur:S.favs,goal:10}}},
    {n:"Rewatcher",           d:"Rack up 10 rewatches",                 c:function(S){return {cur:S.rew,goal:10}}},
    {n:"Classic Connoisseur", d:"Watch something from before 2000",     c:function(S){return {on:S.before2000}}}
  ];

  function styleEl(){
    if(document.getElementById("cab-style"))return;
    var s=document.createElement("style");s.id="cab-style";
    s.textContent=
      ".cab-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:28px 0 14px}"+
      ".cab-head h2{font-size:19px;font-weight:900;margin:0;color:var(--ink)}"+
      ".cab-head .sub{font-size:13px;color:var(--muted)}"+
      ".cab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}"+
      ".cab-badge{display:flex;gap:12px;align-items:flex-start;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:13px 14px}"+
      ".cab-badge.locked{opacity:.55}"+
      ".cab-ic{flex:0 0 auto;width:38px;height:38px;border-radius:11px;background:color-mix(in srgb,var(--accent) 20%,var(--surface-2));color:var(--accent);display:flex;align-items:center;justify-content:center}"+
      ".cab-badge.locked .cab-ic{background:var(--surface-2);color:var(--muted)}"+
      ".cab-ic svg{width:20px;height:20px}"+
      ".cab-n{font-weight:800;font-size:13.5px;color:var(--ink)}"+
      ".cab-d{font-size:11.5px;color:var(--muted);margin-top:2px}"+
      ".cab-p{margin-top:6px;height:5px;border-radius:3px;background:var(--surface-2);overflow:hidden}"+
      ".cab-p b{display:block;height:100%;background:var(--accent)}"+
      ".cab-count{font-family:var(--mono,monospace);font-size:10.5px;color:var(--muted);margin-top:4px}";
    document.head.appendChild(s);
  }

  function render(){
    if(!page)return;
    var wrap=page.querySelector("#cab-wrap");if(!wrap)return;
    var S=stats(), rows=BADGES.map(function(b){
      var r=b.c(S), on = r.on!=null ? r.on : (r.cur>=r.goal);
      var pct = r.goal ? Math.min(100, Math.round((r.cur||0)/r.goal*100)) : (on?100:0);
      return {b:b, on:on, cur:r.cur, goal:r.goal, pct:pct};
    });
    rows.sort(function(a,b){return (b.on?1:0)-(a.on?1:0) || b.pct-a.pct;});
    var earned=rows.filter(function(x){return x.on}).length;
    wrap.innerHTML=
      '<div class="cab-head"><h2>Achievements</h2><span class="sub">'+earned+' of '+BADGES.length+' unlocked · auto-earned from your library</span></div>'+
      '<div class="cab-grid">'+rows.map(function(x){
        return '<div class="cab-badge'+(x.on?"":" locked")+'">'+
          '<div class="cab-ic">'+(x.on?SVG.star:SVG.lock)+'</div>'+
          '<div style="min-width:0"><div class="cab-n">'+esc(x.b.n)+'</div><div class="cab-d">'+esc(x.b.d)+'</div>'+
          (!x.on && x.goal ? '<div class="cab-p"><b style="width:'+x.pct+'%"></b></div><div class="cab-count">'+(x.cur||0)+' of '+x.goal+'</div>' : '')+
          '</div></div>';
      }).join("")+'</div>';
  }

  function build(){
    styleEl();
    var wrap=document.createElement("div");wrap.id="cab-wrap";
    page.appendChild(wrap);
    render();
    /* refresh when the Stats tab is opened (library may have changed) */
    var navBtn=document.querySelector('#canv-nav [data-view="stats"]');
    if(navBtn)navBtn.addEventListener("click",function(){setTimeout(render,0)});
  }

  function mount(tries){
    tries=tries||0;
    var nav=window.CelArchiveNav;
    if(nav&&nav.pages&&nav.pages.stats){page=nav.pages.stats;build();return}
    if(tries<40)return void setTimeout(function(){mount(tries+1)},100);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){mount(0)});else mount(0);
})();
