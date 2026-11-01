/* ============================================================================
   Cel Archive — Hall of Fame   (celarchive-halloffame.js)
   Your trophy wall. Auto genre/format champions are computed from your real
   library; Best Girl/Boy come from your Characters ranking; Signature picks and
   Hot takes are crowned by you. Mounts into the Hall of Fame tab (celarchive-nav.js).
   Add with:  <script src="celarchive-halloffame.js" defer></script>  (after nav)
   Your crowns save in their own localStorage key.
   ========================================================================== */
(function () {
  "use strict";
  var LS = "celarchive.hof.v1";
  var LS_LIB = "celarchive.items.v1";
  var LS_CH = "celarchive.characters.v1";
  var page = null;

  function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}

  function lib(){try{var a=JSON.parse(lsGet(LS_LIB)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
  function chars(){try{var a=JSON.parse(lsGet(LS_CH)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
  var crowns = (function(){try{return JSON.parse(lsGet(LS)||"{}")||{}}catch(e){return {}}})();
  function saveCrowns(){lsSet(LS, JSON.stringify(crowns))}

  var SVG = {
    crown:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z"/></svg>',
    medal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="15" r="6"/><path d="M9 9 6 2m9 7 3-7M8.5 3.5h7"/></svg>',
    flame:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.5-2-1-3 2 1 3 3 3 5a5 5 0 0 1-10 0c0-5 4-7 5-11z"/></svg>'
  };

  function champBy(list){var b=null;list.forEach(function(x){if(x.score&&(!b||x.score>b.score))b=x});return b}
  function topChar(cat){var c=chars().filter(function(x){return x.cat===cat});return c[0]||null}

  /* signature picks — some have an auto default, all can be crowned/overridden */
  var SIG = [
    {k:"bestAnime", l:"Best Anime of All Time", top:true, auto:function(){var c=champBy(lib().filter(function(x){return x.kind==="anime"}));return c?{v:c.title,sub:c.score+"/10 · top-rated anime"}:null}},
    {k:"bestGirl",  l:"Best Girl",  auto:function(){var t=topChar("girl");return t?{v:t.name,sub:"your #1 ranked girl"}:null}},
    {k:"bestBoy",   l:"Best Boy",   auto:function(){var t=topChar("boy");return t?{v:t.name,sub:"your #1 ranked boy"}:null}},
    {k:"saddest",   l:"Saddest Anime",   sub:"the one that wrecked you"},
    {k:"darkest",   l:"Darkest Anime",   sub:"went somewhere you didn't expect"},
    {k:"funniest",  l:"Funniest Anime",  sub:"actual laugh-out-loud"},
    {k:"twist",     l:"Best Plot Twist", sub:"never saw it coming"},
    {k:"rewatched", l:"Most Rewatched",  auto:function(){var b=null;lib().forEach(function(x){if(x.rewatches&&(!b||x.rewatches>b.rewatches))b=x});return b?{v:b.title,sub:b.rewatches+"× rewatched"}:null}}
  ];
  var HOT = [
    {k:"worst",     l:"Worst Anime Ever", sub:"the one you regret finishing"},
    {k:"overrated", l:"Most Overrated",   sub:"everyone loves it — you don't"},
    {k:"underrated",l:"Most Underrated",  sub:"deserves way more love"},
    {k:"guilty",    l:"Guilty Pleasure",  sub:"so bad it's kinda great"},
    {k:"letdown",   l:"Biggest Letdown",  sub:"started strong, fell off"},
    {k:"dropped",   l:"Dropped Too Soon", sub:"couldn't push through"}
  ];

  function resolve(def){
    if(crowns[def.k]) return {v:crowns[def.k], sub:"crowned by you", manual:true};
    if(def.auto){var a=def.auto();if(a)return {v:a.v, sub:a.sub, manual:false};}
    return {v:"Crown yours", sub:def.sub||"", manual:false, placeholder:true};
  }

  function styleEl(){
    if(document.getElementById("chof-style"))return;
    var s=document.createElement("style");s.id="chof-style";
    s.textContent=
      ".chof-sub{display:flex;align-items:baseline;gap:10px;margin:22px 0 12px;flex-wrap:wrap}"+
      ".chof-sub:first-child{margin-top:4px}"+
      ".chof-l2{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink)}"+
      ".chof-note{font-size:12px;color:var(--muted)}"+
      ".chof-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}"+
      ".chof-card{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px;display:flex;gap:13px;align-items:center;overflow:hidden}"+
      ".chof-card.top{border-color:#FFC53D;background:linear-gradient(135deg,color-mix(in srgb,#FFC53D 14%,var(--surface)),var(--surface))}"+
      ".chof-medal{flex:0 0 auto;width:44px;height:44px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;color:#FFC53D;border:1px solid var(--line)}"+
      ".chof-card.top .chof-medal{background:#FFC53D;color:#3a2a00;border-color:#FFC53D}"+
      ".chof-medal svg{width:23px;height:23px}"+
      ".chof-info{min-width:0;flex:1}"+
      ".chof-l{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}"+
      ".chof-v{font-weight:800;font-size:15.5px;line-height:1.2;margin-top:3px;color:var(--ink);overflow-wrap:anywhere}"+
      ".chof-v.ph{color:var(--muted);font-weight:700}"+
      ".chof-s{font-size:11.5px;color:var(--muted);margin-top:3px}"+
      ".chof-set{position:absolute;top:10px;right:10px;background:var(--surface-2);border:1px solid var(--line);color:var(--ink);border-radius:8px;font-size:11px;font-weight:700;padding:3px 9px;cursor:pointer}"+
      ".chof-set:hover{border-color:var(--accent);color:var(--accent)}"+
      ".chof-scrim{position:fixed;inset:0;z-index:4000;background:rgba(5,3,12,.55);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow:auto}"+
      ".chof-modal{background:var(--surface);border:1px solid var(--line);border-radius:16px;max-width:480px;width:100%;margin:auto;padding:18px;box-shadow:0 30px 70px rgba(0,0,0,.5)}"+
      ".chof-mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.chof-mh h2{margin:0;font-size:16px;font-weight:800;color:var(--ink)}"+
      ".chof-x{background:var(--surface-2);border:1px solid var(--line);color:var(--ink);border-radius:9px;width:32px;height:32px;font-size:16px;cursor:pointer}"+
      ".chof-inp{width:100%;box-sizing:border-box;background:var(--bg);border:2px solid var(--line);color:var(--ink);border-radius:11px;padding:10px 12px;font-family:inherit;font-size:14px;margin-bottom:8px}"+
      ".chof-list{max-height:240px;overflow:auto;display:flex;flex-direction:column;gap:4px}"+
      ".chof-list button{text-align:left;background:var(--surface-2);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:8px 11px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit}"+
      ".chof-list button:hover{border-color:var(--accent)}"+
      ".chof-foot{display:flex;gap:10px;margin-top:12px}.chof-foot .sp{flex:1}"+
      ".chof-ghost{background:transparent;color:var(--ink);border:2px solid var(--line);border-radius:11px;padding:9px 14px;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer}"+
      ".chof-clear{color:var(--st-dropped);border-color:color-mix(in srgb,var(--st-dropped) 45%,var(--line))}";
    document.head.appendChild(s);
  }

  function block(title, note, defs, icon, auto){
    var html='<div class="chof-sub"><span class="chof-l2">'+title+'</span><span class="chof-note">'+note+'</span></div><div class="chof-grid">';
    defs.forEach(function(d){
      if(auto){ /* auto champions: value passed directly */
        html+='<div class="chof-card"><div class="chof-medal">'+icon+'</div><div class="chof-info"><div class="chof-l">'+esc(d.l)+'</div><div class="chof-v'+(d.v?'':' ph')+'">'+esc(d.v||"—")+'</div>'+(d.s?'<div class="chof-s">'+esc(d.s)+'</div>':'')+'</div></div>';
      } else {
        var r=resolve(d);
        html+='<div class="chof-card'+(d.top&&r.v!=="Crown yours"?" top":"")+'">'+
          '<div class="chof-medal">'+(d.top&&r.v!=="Crown yours"?SVG.crown:icon)+'</div>'+
          '<div class="chof-info"><div class="chof-l">'+esc(d.l)+'</div><div class="chof-v'+(r.placeholder?" ph":"")+'">'+esc(r.v)+'</div>'+(r.sub?'<div class="chof-s">'+esc(r.sub)+'</div>':'')+'</div>'+
          '<button class="chof-set" data-crown="'+d.k+'" data-label="'+esc(d.l)+'">'+(r.placeholder?"Crown":"Change")+'</button>'+
          '</div>';
      }
    });
    return html+'</div>';
  }

  function render(){
    if(!page)return;
    var body=page.querySelector("#chof-body");if(!body)return;
    var items=lib();
    /* genre champions */
    var gmap={}, gcount={};
    items.forEach(function(x){ (x.genres||[]).forEach(function(g){ gcount[g]=(gcount[g]||0)+1; if(x.score&&(!gmap[g]||x.score>gmap[g].score))gmap[g]=x; }); });
    var genres=Object.keys(gmap).sort(function(a,b){return (gcount[b]||0)-(gcount[a]||0)||a.localeCompare(b)}).slice(0,12);
    var genreDefs=genres.map(function(g){return {l:"Best "+g, v:gmap[g].title, s:gmap[g].score+"/10"}});
    /* format / kind champions */
    var KD=[["anime","Best Anime"],["donghua","Best Donghua"],["cartoon","Best Cartoon"],["aeni","Best Aeni"]];
    var fmtDefs=[];
    KD.forEach(function(k){var c=champBy(items.filter(function(x){return x.kind===k[0]}));if(c)fmtDefs.push({l:k[1],v:c.title,s:c.score+"/10"})});
    var mv=champBy(items.filter(function(x){return x.type==="Movie"}));if(mv)fmtDefs.push({l:"Best Movie",v:mv.title,s:mv.score+"/10"});

    var html=block("Signature picks","crowned by you",SIG,SVG.crown,false)+
             block("Hot takes","your spicy opinions — crowned by you",HOT,SVG.flame,false);
    if(genreDefs.length) html+=block("Genre champions","auto — your highest-rated in each genre",genreDefs,SVG.medal,true);
    if(fmtDefs.length)   html+=block("Format champions","auto — top of each kind",fmtDefs,SVG.medal,true);
    if(!items.length && !Object.keys(crowns).length) html+='<div class="chof-note" style="margin-top:14px">Add titles to your library and rank some characters, and your champions appear here automatically. Crown your signature picks any time.</div>';
    body.innerHTML=html;
  }

  /* crown picker */
  function openCrown(k, label){
    var titles=[], seen={};
    lib().forEach(function(x){if(x.title&&!seen[x.title]){seen[x.title]=1;titles.push(x.title)}});
    var scrim=document.createElement("div");scrim.className="chof-scrim";
    scrim.innerHTML='<div class="chof-modal" role="dialog" aria-modal="true">'+
      '<div class="chof-mh"><h2>Crown: '+esc(label)+'</h2><button type="button" class="chof-x" aria-label="Close">×</button></div>'+
      '<input class="chof-inp" id="chof-q" type="text" placeholder="Search your library, or type anything…">'+
      '<div class="chof-list" id="chof-list"></div>'+
      '<div class="chof-foot">'+(crowns[k]?'<button type="button" class="chof-ghost chof-clear" id="chof-clear">Clear crown</button>':'')+'<span class="sp"></span><button type="button" class="chof-ghost" id="chof-cancel">Cancel</button></div>'+
      '</div>';
    document.body.appendChild(scrim);
    var q=scrim.querySelector("#chof-q"), list=scrim.querySelector("#chof-list");
    function draw(){
      var term=q.value.trim().toLowerCase();
      var m=titles.filter(function(t){return !term||t.toLowerCase().indexOf(term)>=0}).slice(0,40);
      var html=m.map(function(t){return '<button type="button" data-pick="'+esc(t)+'">'+esc(t)+'</button>'}).join("");
      if(term && titles.indexOf(q.value.trim())<0) html='<button type="button" data-pick="'+esc(q.value.trim())+'">Use “'+esc(q.value.trim())+'”</button>'+html;
      list.innerHTML=html||'<div class="chof-note">Type a name to crown it.</div>';
    }
    draw();
    function close(){scrim.remove()}
    q.addEventListener("input",draw);
    scrim.addEventListener("click",function(e){
      if(e.target===scrim||e.target.closest(".chof-x")||e.target.id==="chof-cancel"){close();return}
      if(e.target.id==="chof-clear"){delete crowns[k];saveCrowns();close();render();return}
      var b=e.target.closest("[data-pick]");
      if(b){crowns[k]=b.getAttribute("data-pick");saveCrowns();close();render()}
    });
    setTimeout(function(){q.focus()},30);
  }

  function build(){
    styleEl();
    page.innerHTML=
      '<div style="margin-bottom:10px"><div style="font-size:24px;font-weight:900;color:var(--ink)">Hall of Fame</div>'+
      '<div style="font-size:13px;color:var(--muted)">your trophy wall — manual crowns + auto champions</div></div>'+
      '<div id="chof-body"></div>';
    page.addEventListener("click",function(e){
      var b=e.target.closest("[data-crown]");
      if(b)openCrown(b.getAttribute("data-crown"), b.getAttribute("data-label"));
    });
    render();
  }

  function mount(tries){
    tries=tries||0;
    var nav=window.CelArchiveNav;
    if(nav&&nav.pages&&nav.pages.hof){page=nav.pages.hof;build();return}
    if(tries<40)return void setTimeout(function(){mount(tries+1)},100);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){mount(0)});else mount(0);
})();
