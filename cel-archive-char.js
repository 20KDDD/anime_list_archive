/* ============================================================================
   Cel Archive — Characters   (celarchive-characters.js)
   Best girls / best boys ranking, portraits auto-pulled from AniList, archetype
   tagging, and your computed "anime taste type". Mounts into the Characters tab
   created by celarchive-nav.js.
   Add with:  <script src="celarchive-characters.js" defer></script>  (after nav)
   Character data lives in its own localStorage key and has Export / Import so it
   can be backed up like your library.
   ========================================================================== */
(function () {
  "use strict";
  var LS = "celarchive.characters.v1";
  var cats = [["girl","Best Girls"],["boy","Best Boys"],["other","Other"]];
  var filter = "all";
  var page = null, pending = null;

  function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function newId(){return "c"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

  var chars = load();
  function load(){try{var a=JSON.parse(lsGet(LS)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
  function save(){lsSet(LS, JSON.stringify(chars))}

  /* ---- archetypes ---- */
  var DERE = {
    kuudere:{t:"Kuudere Enjoyer",d:"Cold, stone-faced, dead inside — until that one person shows up. You fall for the ones who'd sooner combust than admit they care, then care harder than anybody.",traits:["Deadpan","Secret softie","One-person loyal"]},
    tsundere:{t:"Tsundere Devotee",d:"\"It's not like I like you or anything!\" (They absolutely do.) You're here for the push-pull and the eventual blush.",traits:["Prickly outside","Soft inside","Easily flustered"]},
    yandere:{t:"Yandere Magnet",d:"Love turned all the way up, consequences optional. You like devotion so intense it's a little terrifying.",traits:["Obsessive","Devoted","Unhinged (lovingly)"]},
    dandere:{t:"Dandere Softie",d:"Quiet, shy, barely says a word — until they trust you, then they bloom. You fall for the slow reveal.",traits:["Shy","Gentle","Blooms with trust"]},
    deredere:{t:"Deredere Sweetheart",d:"Pure sunshine, openly affectionate, loves out loud. You go for the warm ones who wear their heart on their sleeve.",traits:["Warm","Openly loving","Sunshine"]},
    himedere:{t:"Himedere Loyalist",d:"Treat them like royalty and they're yours. You like a little pride and a lot of presence.",traits:["Regal","Proud","Commanding"]},
    sadodere:{t:"Sadodere Thrill-seeker",d:"Teasing, sharp-tongued, keeps you on your toes. You like a little danger with your affection.",traits:["Teasing","Sharp","Playfully mean"]}
  };
  var DERE_LIST = [["","— archetype (optional)"],["kuudere","Kuudere — cold, hidden soft"],["tsundere","Tsundere — prickly then sweet"],["yandere","Yandere — obsessive love"],["dandere","Dandere — shy, quiet"],["deredere","Deredere — openly loving"],["himedere","Himedere — wants to be adored"],["sadodere","Sadodere — teasing, mean"]];
  var DERE_LABEL = {}; DERE_LIST.forEach(function(e){if(e[0])DERE_LABEL[e[0]]=e[1].split(" — ")[0]});

  function tasteType(){
    var w={}, total=0, n=chars.length;
    chars.forEach(function(c,i){ if(!c.arche)return; var weight=Math.max(1,n-i); w[c.arche]=(w[c.arche]||0)+weight; total+=weight; });
    if(!total) return null;
    var arr=Object.keys(w).map(function(k){return [k,w[k]]}).sort(function(a,b){return b[1]-a[1]});
    return {top:arr[0][0], info:DERE[arr[0][0]], breakdown:arr.map(function(e){return [e[0],Math.round(e[1]/total*100)]})};
  }

  function grad(seed){var s=String(seed||""),h=0,i;for(i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;var a=200+(h%150),b=a+34;return "linear-gradient(150deg,hsl("+a+" 40% 34%),hsl("+b+" 50% 46%))"}

  /* ---- AniList character search ---- */
  function alChar(q){
    var query="query($q:String){Page(perPage:12){characters(search:$q){id gender name{full native} image{large} media(perPage:1,sort:POPULARITY_DESC){nodes{title{english romaji}}}}}}";
    return fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({query:query,variables:{q:q}})})
      .then(function(r){if(!r.ok)throw new Error("anilist "+r.status);return r.json()})
      .then(function(j){return (j.data&&j.data.Page&&j.data.Page.characters)||[]});
  }
  function fromTitle(m){var n=m&&m.media&&m.media.nodes&&m.media.nodes[0];return n?(n.title.english||n.title.romaji||""):""}
  function catFromGender(g){return g==="Female"?"girl":g==="Male"?"boy":"other"}

  /* ---- styles ---- */
  function styleEl(){
    if(document.getElementById("cach-style"))return;
    var s=document.createElement("style");s.id="cach-style";
    s.textContent=
      ".cach-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}"+
      ".cach-top .sp{flex:1}"+
      ".cach-sub{display:flex;gap:7px;flex-wrap:wrap;margin:6px 0 16px}"+
      ".cach-stab{background:var(--surface);border:1px solid var(--line);color:var(--muted);font-family:inherit;font-weight:700;font-size:12.5px;border-radius:999px;padding:6px 14px;cursor:pointer}"+
      ".cach-stab[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}"+
      ".cach-taste{background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 16%,var(--surface)),color-mix(in srgb,var(--accent2) 16%,var(--surface)));border:1px solid var(--line);border-radius:18px;padding:20px 22px;margin-bottom:22px}"+
      ".cach-el{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}"+
      ".cach-tt{font-family:var(--display,inherit);font-size:clamp(22px,4vw,30px);margin:6px 0 10px;line-height:1.05;color:var(--ink)}"+
      ".cach-taste p{margin:0 0 12px;max-width:62ch;font-size:14px;color:var(--ink)}"+
      ".cach-bars{display:flex;flex-direction:column;gap:7px;margin:2px 0 14px;max-width:440px}"+
      ".cach-bar{display:grid;grid-template-columns:96px 1fr 40px;align-items:center;gap:10px;font-size:12.5px}"+
      ".cach-bar .n{font-weight:700;color:var(--ink)}"+
      ".cach-bar .t{height:8px;border-radius:999px;background:var(--surface-2);overflow:hidden}"+
      ".cach-bar .t b{display:block;height:100%;background:var(--accent)}"+
      ".cach-bar .p{font-family:var(--mono,monospace);color:var(--muted);text-align:right}"+
      ".cach-tags{display:flex;gap:7px;flex-wrap:wrap}"+
      ".cach-tag{background:var(--surface);border:1px solid var(--line);color:var(--ink);font-size:11.5px;font-weight:700;border-radius:999px;padding:4px 11px}"+
      ".cach-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}"+
      "@media (max-width:560px){.cach-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}"+
      ".cach-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}"+
      ".cach-port{position:relative;aspect-ratio:3/4;background:var(--surface-2);overflow:hidden;display:flex;align-items:center;justify-content:center}"+
      ".cach-port img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}"+
      ".cach-port .ini{font-family:var(--display,inherit);font-size:30px;color:rgba(255,255,255,.85)}"+
      ".cach-rank{position:absolute;top:8px;left:8px;width:26px;height:26px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg)}"+
      ".cach-rank.gold{background:#FFC53D;color:#3a2a00}"+
      ".cach-ar{position:absolute;top:8px;right:8px;background:rgba(10,6,20,.6);color:#fff;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:999px}"+
      ".cach-info{padding:10px 12px 11px;display:flex;flex-direction:column;gap:3px}"+
      ".cach-nm{font-weight:700;font-size:14px;color:var(--ink)}"+
      ".cach-fr{font-size:11.5px;color:var(--muted)}.cach-fr b{color:var(--accent);font-weight:700}"+
      ".cach-ctrl{display:flex;gap:6px;margin-top:6px}"+
      ".cach-ctrl button{flex:0 0 auto;background:var(--surface-2);border:1px solid var(--line);color:var(--ink);border-radius:8px;font-size:12px;font-weight:700;padding:3px 8px;cursor:pointer}"+
      ".cach-ctrl .del{color:var(--st-dropped);margin-left:auto}"+
      ".cach-empty{border:1px dashed var(--line);border-radius:16px;padding:44px 20px;text-align:center;color:var(--muted)}"+
      /* modal */
      ".cach-scrim{position:fixed;inset:0;z-index:4000;background:rgba(5,3,12,.55);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow:auto}"+
      ".cach-modal{background:var(--surface);border:1px solid var(--line);border-radius:16px;max-width:560px;width:100%;margin:auto;padding:18px;box-shadow:0 30px 70px rgba(0,0,0,.5)}"+
      ".cach-mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}"+
      ".cach-mh h2{margin:0;font-size:17px;font-weight:800;color:var(--ink)}"+
      ".cach-x{background:var(--surface-2);border:1px solid var(--line);color:var(--ink);border-radius:9px;width:32px;height:32px;font-size:16px;cursor:pointer}"+
      ".cach-field{margin-bottom:12px}"+
      ".cach-field label{display:block;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}"+
      ".cach-inp,.cach-sel{width:100%;box-sizing:border-box;background:var(--bg);border:2px solid var(--line);color:var(--ink);border-radius:11px;padding:10px 12px;font-family:inherit;font-size:14px}"+
      ".cach-srow{display:flex;gap:8px}"+
      ".cach-btn{background:var(--accent);color:var(--accent-ink);border:none;border-radius:11px;padding:10px 16px;font-weight:800;font-size:13.5px;font-family:inherit;cursor:pointer}"+
      ".cach-ghost{background:transparent;color:var(--ink);border:2px solid var(--line);border-radius:11px;padding:9px 14px;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer}"+
      ".cach-res{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;max-height:260px;overflow:auto;margin-top:4px}"+
      ".cach-res button{background:var(--surface-2);border:2px solid var(--line);border-radius:10px;overflow:hidden;padding:0;cursor:pointer;text-align:left}"+
      ".cach-res button[aria-pressed=true]{border-color:var(--accent)}"+
      ".cach-res .ri{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;background:var(--surface)}"+
      ".cach-res .rn{display:block;font-size:10.5px;font-weight:700;color:var(--ink);padding:5px 6px 2px;line-height:1.1}"+
      ".cach-res .rf{display:block;font-size:9.5px;color:var(--muted);padding:0 6px 6px}"+
      ".cach-catpick{display:flex;gap:7px;flex-wrap:wrap}"+
      ".cach-catpick button{background:var(--surface-2);border:2px solid var(--line);color:var(--muted);border-radius:999px;padding:6px 14px;font-weight:700;font-size:12.5px;font-family:inherit;cursor:pointer}"+
      ".cach-catpick button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}"+
      ".cach-msg{font-size:12.5px;color:var(--muted);min-height:16px;margin-top:4px}"+
      ".cach-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}";
    document.head.appendChild(s);
  }

  /* ---- render ---- */
  function render(){
    if(!page)return;
    var body=page.querySelector("#cach-body");
    if(!body)return;
    var tt=tasteType();
    var html="";
    if(tt){
      html+='<div class="cach-taste"><div class="cach-el">Your anime taste type — from your ranked characters</div>'+
        '<div class="cach-tt">'+esc(tt.info.t)+'</div><p>'+esc(tt.info.d)+'</p>'+
        '<div class="cach-bars">'+tt.breakdown.map(function(e){return '<div class="cach-bar"><span class="n">'+esc(DERE_LABEL[e[0]]||e[0])+'</span><span class="t"><b style="width:'+e[1]+'%"></b></span><span class="p">'+e[1]+'%</span></div>'}).join("")+'</div>'+
        '<div class="cach-tags">'+tt.info.traits.map(function(x){return '<span class="cach-tag">'+esc(x)+'</span>'}).join("")+'</div></div>';
    } else if(chars.length){
      html+='<div class="cach-taste"><div class="cach-el">Your anime taste type</div><p style="margin:8px 0 0">Tag your characters with an archetype (kuudere, tsundere, yandere…) to unlock your taste type.</p></div>';
    }
    var list = filter==="all" ? ["girl","boy","other"] : [filter];
    var any=false;
    list.forEach(function(cat){
      var sub=chars.filter(function(c){return c.cat===cat});
      if(!sub.length)return; any=true;
      var label=({girl:"Best Girls",boy:"Best Boys",other:"Other"})[cat];
      if(filter==="all")html+='<div class="cach-el" style="margin:18px 0 10px">'+label+'</div>';
      html+='<div class="cach-grid">'+sub.map(function(c,i){
        return '<article class="cach-card">'+
          '<div class="cach-port">'+(c.img?'<img src="'+esc(c.img)+'" alt="" referrerpolicy="no-referrer" onerror="this.remove()">':'')+'<span class="ini">'+esc((c.name||"?").split(" ").map(function(w){return w[0]}).join("").slice(0,2))+'</span>'+
          '<span class="cach-rank'+(i===0?" gold":"")+'">'+(i+1)+'</span>'+
          (c.arche?'<span class="cach-ar">'+esc(DERE_LABEL[c.arche]||"")+'</span>':'')+'</div>'+
          '<div class="cach-info"><div class="cach-nm">'+esc(c.name)+'</div><div class="cach-fr">from <b>'+esc(c.from||"—")+'</b></div>'+
          '<div class="cach-ctrl"><button data-act="up" data-id="'+c.id+'" aria-label="Move up">↑</button><button data-act="down" data-id="'+c.id+'" aria-label="Move down">↓</button><button class="del" data-act="del" data-id="'+c.id+'" aria-label="Remove">Remove</button></div>'+
          '</div></article>';
      }).join("")+'</div>';
    });
    if(!any)html+='<div class="cach-empty">No characters yet. Tap <b>+ Add character</b> to search AniList and start your ranking.</div>';
    body.innerHTML=html;
  }

  function move(id,dir){
    var c=null,i;for(i=0;i<chars.length;i++)if(chars[i].id===id){c=chars[i];break}
    if(!c)return;
    var sub=chars.filter(function(x){return x.cat===c.cat});
    var pos=sub.indexOf(c), np=pos+dir; if(np<0||np>=sub.length)return;
    var tmp=sub[pos];sub[pos]=sub[np];sub[np]=tmp;
    var si=0;chars=chars.map(function(x){return x.cat===c.cat?sub[si++]:x});
    save();render();
  }
  function del(id){chars=chars.filter(function(c){return c.id!==id});save();render()}

  /* ---- add modal ---- */
  function openAdd(){
    pending=null;
    var scrim=document.createElement("div");scrim.className="cach-scrim";scrim.id="cach-scrim";
    scrim.innerHTML='<div class="cach-modal" role="dialog" aria-modal="true">'+
      '<div class="cach-mh"><h2>Add a character</h2><button type="button" class="cach-x" aria-label="Close">×</button></div>'+
      '<div class="cach-field"><label for="cach-q">Search AniList</label><div class="cach-srow"><input class="cach-inp" id="cach-q" type="text" placeholder="e.g. Makima, Levi, Frieren…"><button type="button" class="cach-btn" id="cach-go">Search</button></div></div>'+
      '<div class="cach-msg" id="cach-msg">Search a character to pull their portrait and anime automatically.</div>'+
      '<div class="cach-res" id="cach-res"></div>'+
      '<div class="cach-field" style="margin-top:14px"><label>Category</label><div class="cach-catpick" id="cach-cat">'+
        cats.map(function(c){return '<button type="button" data-cat="'+c[0]+'">'+c[1].replace("Best ","")+'</button>'}).join("")+'</div></div>'+
      '<div class="cach-field"><label for="cach-arche">Archetype (powers your taste type)</label><select class="cach-sel" id="cach-arche">'+
        DERE_LIST.map(function(e){return '<option value="'+e[0]+'">'+esc(e[1])+'</option>'}).join("")+'</select></div>'+
      '<div class="cach-foot"><button type="button" class="cach-ghost" id="cach-cancel">Cancel</button><button type="button" class="cach-btn" id="cach-save">Add character</button></div>'+
      '</div>';
    document.body.appendChild(scrim);
    function close(){scrim.remove()}
    function setCat(v){var bs=scrim.querySelectorAll("#cach-cat button");for(var i=0;i<bs.length;i++)bs[i].setAttribute("aria-pressed",String(bs[i].getAttribute("data-cat")===v))}
    setCat("girl");
    scrim.addEventListener("click",function(e){
      if(e.target===scrim||e.target.closest(".cach-x")||e.target.id==="cach-cancel"){close();return}
      var cb=e.target.closest("#cach-cat button"); if(cb){setCat(cb.getAttribute("data-cat"));return}
      var rb=e.target.closest("#cach-res button");
      if(rb){var bs=scrim.querySelectorAll("#cach-res button");for(var i=0;i<bs.length;i++)bs[i].setAttribute("aria-pressed","false");rb.setAttribute("aria-pressed","true");
        pending=JSON.parse(rb.getAttribute("data-c"));setCat(pending.cat);return}
    });
    var q=scrim.querySelector("#cach-q"), msg=scrim.querySelector("#cach-msg"), res=scrim.querySelector("#cach-res");
    function doSearch(){
      var term=q.value.trim(); if(!term){msg.textContent="Type a name first.";return}
      msg.textContent="Searching AniList…"; res.innerHTML="";
      alChar(term).then(function(list){
        if(!list.length){msg.textContent="No characters found. Try a different spelling.";return}
        msg.textContent="Tap a character to pick them:";
        res.innerHTML=list.map(function(m){
          var obj={name:m.name.full,from:fromTitle(m),img:m.image&&m.image.large,cat:catFromGender(m.gender)};
          return '<button type="button" data-c="'+esc(JSON.stringify(obj))+'" aria-pressed="false">'+
            (obj.img?'<img class="ri" src="'+esc(obj.img)+'" alt="" referrerpolicy="no-referrer">':'<span class="ri"></span>')+
            '<span class="rn">'+esc(obj.name)+'</span><span class="rf">'+esc(obj.from||"")+'</span></button>';
        }).join("");
      }).catch(function(){msg.textContent="Couldn't reach AniList. Check your connection and try again."});
    }
    scrim.querySelector("#cach-go").addEventListener("click",doSearch);
    q.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();doSearch()}});
    scrim.querySelector("#cach-save").addEventListener("click",function(){
      if(!pending){msg.textContent="Search and pick a character first.";return}
      var cat=(scrim.querySelector("#cach-cat button[aria-pressed=true]")||{}).getAttribute?scrim.querySelector("#cach-cat button[aria-pressed=true]").getAttribute("data-cat"):"girl";
      chars.push({id:newId(),name:pending.name,from:pending.from,img:pending.img||null,cat:cat||"girl",arche:scrim.querySelector("#cach-arche").value||null});
      save();close();render();
    });
    setTimeout(function(){q.focus()},30);
  }

  /* ---- export / import ---- */
  function exportChars(){
    var blob=new Blob([JSON.stringify({app:"cel-archive-characters",version:1,items:chars},null,2)],{type:"application/json"});
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cel-archive-characters.json";
    document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);
  }
  function importChars(file){
    var r=new FileReader();r.onload=function(){try{var j=JSON.parse(r.result);var arr=Array.isArray(j)?j:(j&&j.items);if(!Array.isArray(arr))throw 0;
      var have={};chars.forEach(function(c){have[c.id]=1});
      arr.forEach(function(c){if(c&&c.name){if(!c.id||have[c.id])c.id=newId();chars.push(c)}});
      save();render();
    }catch(e){alert && void 0;}};r.readAsText(file);
  }

  /* ---- mount ---- */
  function build(){
    styleEl();
    page.innerHTML=
      '<div class="cach-top"><div><div style="font-size:24px;font-weight:900;color:var(--ink)">Characters</div>'+
        '<div style="font-size:13px;color:var(--muted)">best girls &amp; best boys · portraits from AniList</div></div>'+
        '<span class="sp"></span>'+
        '<button type="button" class="cach-ghost" data-act="export">Export</button>'+
        '<button type="button" class="cach-ghost" data-act="import">Import</button>'+
        '<button type="button" class="cach-btn" data-act="add">+ Add character</button></div>'+
      '<div class="cach-sub" id="cach-sub">'+
        '<button type="button" class="cach-stab" data-f="all" aria-pressed="'+(filter==="all")+'">All</button>'+
        '<button type="button" class="cach-stab" data-f="girl" aria-pressed="'+(filter==="girl")+'">Best Girls</button>'+
        '<button type="button" class="cach-stab" data-f="boy" aria-pressed="'+(filter==="boy")+'">Best Boys</button>'+
        '<button type="button" class="cach-stab" data-f="other" aria-pressed="'+(filter==="other")+'">Other</button></div>'+
      '<input type="file" id="cach-file" accept=".json,application/json" hidden>'+
      '<div id="cach-body"></div>';
    page.addEventListener("click",function(e){
      var a=e.target.closest("[data-act]"), st=e.target.closest("[data-f]");
      if(st){filter=st.getAttribute("data-f");var bs=page.querySelectorAll("#cach-sub [data-f]");for(var i=0;i<bs.length;i++)bs[i].setAttribute("aria-pressed",String(bs[i].getAttribute("data-f")===filter));render();return}
      if(!a)return;
      var act=a.getAttribute("data-act"), id=a.getAttribute("data-id");
      if(act==="add")openAdd();
      else if(act==="export")exportChars();
      else if(act==="import")page.querySelector("#cach-file").click();
      else if(act==="up")move(id,-1);
      else if(act==="down")move(id,1);
      else if(act==="del")del(id);
    });
    page.querySelector("#cach-file").addEventListener("change",function(e){if(e.target.files&&e.target.files[0])importChars(e.target.files[0]);e.target.value=""});
    render();
  }

  function mount(tries){
    tries=tries||0;
    var nav=window.CelArchiveNav;
    if(nav&&nav.pages&&nav.pages.characters){page=nav.pages.characters;build();return}
    if(tries<40)return void setTimeout(function(){mount(tries+1)},100);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){mount(0)});else mount(0);
})();
