/* ============================================================================
   Cel Archive — Nav shell   (celarchive-nav.js)
   Adds a top nav (Library / Characters / Hall of Fame / Stats) and reorganises
   the page into tabbed views, with no change to your existing library logic:
     - Library tab  = your rail + grid (unchanged)
     - Stats tab    = your Stats & taste section (moved out of the collapsible)
     - Characters / Hall of Fame = placeholders the next stages fill in
   Add with:  <script src="celarchive-nav.js" defer></script>  (after the app)
   Exposes window.CelArchiveNav = { pages, show } so later files can mount into
   the Characters and Hall of Fame pages.
   ========================================================================== */
(function () {
  "use strict";
  var PAGES = ["library", "characters", "hof", "stats"];
  var TABS = [
    {id:"library",    label:"Library"},
    {id:"characters", label:"Characters"},
    {id:"hof",        label:"Hall of Fame"},
    {id:"stats",      label:"Stats"}
  ];

  function styleEl(){
    var s=document.createElement("style");
    s.textContent=
      ".canv-nav{display:flex;gap:4px;flex-wrap:wrap;align-items:center;padding:12px 0 0;border-bottom:1px solid var(--line);margin:4px 0 16px}"+
      ".canv-tab{background:transparent;border:none;color:var(--muted);font-family:inherit;font-weight:700;font-size:14px;padding:9px 16px;border-radius:999px 999px 0 0;cursor:pointer}"+
      ".canv-tab:hover{color:var(--ink)}"+
      ".canv-tab[aria-current=true]{color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent)}"+
      ".canv-page[hidden]{display:none!important}"+
      ".canv-phead{margin:2px 0 10px}"+
      ".canv-phead h2{font-size:24px;font-weight:900;margin:0;color:var(--ink)}"+
      ".canv-phead .sub{font-size:13px;color:var(--muted);margin-top:3px}"+
      ".canv-empty{border:1px dashed var(--line);border-radius:16px;padding:46px 22px;text-align:center;color:var(--muted);margin-top:10px}"+
      ".canv-empty h3{color:var(--ink);font-size:18px;margin:0 0 6px}"+
      ".canv-empty p{margin:0;max-width:40ch;margin-inline:auto}"+
      "@media (max-width:560px){.canv-nav{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.canv-nav::-webkit-scrollbar{display:none}.canv-tab{flex:0 0 auto;white-space:nowrap}}";
    document.head.appendChild(s);
  }

  function emptyState(title, msg){
    return '<div class="canv-empty"><h3>'+title+'</h3><p>'+msg+'</p></div>';
  }

  function mount(){
    var wrap=document.querySelector(".wrap");
    if(!wrap || document.getElementById("canv-nav")) return;
    styleEl();

    var header=wrap.querySelector(".top") || wrap.querySelector("header");
    var statsToggle=document.getElementById("statsToggle");
    var collapsible=document.getElementById("collapsibleStats");
    var libwrap=wrap.querySelector(".libwrap");

    /* nav bar, right after the header */
    var nav=document.createElement("nav");
    nav.className="canv-nav"; nav.id="canv-nav";
    nav.setAttribute("aria-label","Sections");
    nav.innerHTML=TABS.map(function(t){
      return '<button type="button" class="canv-tab" data-view="'+t.id+'" aria-current="false">'+t.label+'</button>';
    }).join("");
    if(header && header.nextSibling) wrap.insertBefore(nav, header.nextSibling);
    else wrap.appendChild(nav);

    /* page containers */
    var pages={};
    PAGES.forEach(function(id){
      var d=document.createElement("section");
      d.className="canv-page"; d.setAttribute("data-page", id);
      d.hidden = (id!=="library");
      pages[id]=d; wrap.appendChild(d);
    });

    /* move existing content into the right pages (kept by reference — ids intact) */
    if(libwrap) pages.library.appendChild(libwrap);

    var sh=document.createElement("div");
    sh.className="canv-phead";
    sh.innerHTML='<h2>Stats</h2><div class="sub">your taste at a glance</div>';
    pages.stats.appendChild(sh);
    if(statsToggle) statsToggle.hidden=true;           /* toggle no longer needed — it is its own tab */
    if(collapsible){ collapsible.hidden=false; pages.stats.appendChild(collapsible); }

    /* placeholders the next stages replace */
    pages.characters.innerHTML=
      '<div class="canv-phead"><h2>Characters</h2><div class="sub">best girls &amp; best boys</div></div>'+
      emptyState("Coming next","Rank your favourite characters, pull their portraits from AniList, and get your anime taste type. This tab fills in with the Characters update.");
    pages.hof.innerHTML=
      '<div class="canv-phead"><h2>Hall of Fame</h2><div class="sub">your trophy wall</div></div>'+
      emptyState("Coming next","Your champions, hot takes, and genre trophies. This tab fills in with the Hall of Fame update.");

    function show(id){
      PAGES.forEach(function(x){ if(pages[x]) pages[x].hidden = (x!==id); });
      var btns=nav.querySelectorAll("[data-view]"), i;
      for(i=0;i<btns.length;i++) btns[i].setAttribute("aria-current", String(btns[i].getAttribute("data-view")===id));
      try{ window.scrollTo({top:0, behavior:"smooth"}); }catch(e){ window.scrollTo(0,0); }
    }
    nav.addEventListener("click", function(e){
      var b=e.target.closest("[data-view]");
      if(b) show(b.getAttribute("data-view"));
    });

    window.CelArchiveNav={ pages:pages, show:show, TABS:TABS };
    show("library");
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
