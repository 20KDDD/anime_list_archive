/* ============================================================================
   Cel Archive — Themes & Ambient Particle Effects   (celarchive-fx.js)
   Self-contained. Add to your page with:
       <script src="celarchive-fx.js" defer></script>
   It injects a "Theme" button into the header, a theme panel, and a canvas
   particle layer. Colours follow the active theme. Choice is saved per device.
   Touches no existing app logic — it only sets CSS variables on :root.
   ========================================================================== */
(function () {
  "use strict";
  var LS_THEME = "celarchive.theme", LS_FX = "celarchive.fx";
  function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}

  /* ---- theme palettes (each sets the app's CSS variables) ---- */
  var THEMES = [
    {id:"arcade",name:"Arcade",tag:"lime + purple (default)",c:{bg:"#150C28",surface:"#1E1240","surface-2":"#2A1A4E",ink:"#F3EEFF",muted:"#9A7FD0",line:"#3A2566",accent:"#B8FF3C","accent-ink":"#150C28",accent2:"#FF4D9D"}},
    {id:"sakura",name:"Sakura",tag:"soft pink bloom",c:{bg:"#241018",surface:"#33161F","surface-2":"#44202B",ink:"#FFEEF3",muted:"#D58AA0",line:"#4E2630",accent:"#FF6FA5","accent-ink":"#2A0A14",accent2:"#FFD36B"}},
    {id:"abyss",name:"Abyss",tag:"deep-sea cyan",c:{bg:"#0A1424",surface:"#11203A","surface-2":"#1A2D4E",ink:"#E8F1FF",muted:"#7F9BC0",line:"#223A5E",accent:"#38E0FF","accent-ink":"#04141C",accent2:"#7A6CFF"}},
    {id:"ember",name:"Ember",tag:"fire & ash",c:{bg:"#1C0F0A",surface:"#2A1812","surface-2":"#3A2219",ink:"#FFF0E8",muted:"#C89479",line:"#4A2C1F",accent:"#FF7A3C","accent-ink":"#1C0A04",accent2:"#FFD24A"}},
    {id:"matcha",name:"Matcha",tag:"forest green",c:{bg:"#0F1A12",surface:"#17271B","surface-2":"#203525",ink:"#EEFBF0",muted:"#8BB598",line:"#2A4530",accent:"#8EF06A","accent-ink":"#0A1A0C",accent2:"#E0C24A"}},
    {id:"mono",name:"Mono",tag:"clean grayscale",c:{bg:"#101014",surface:"#1A1A20","surface-2":"#26262E",ink:"#F2F2F5",muted:"#9A9AA6",line:"#33333D",accent:"#E8E8EE","accent-ink":"#101014",accent2:"#9A9AA6"}},
    {id:"cyberpunk",name:"Cyberpunk",tag:"neon city · code rain",c:{bg:"#070A14",surface:"#0F1626","surface-2":"#172238",ink:"#E6F2FF",muted:"#6F9BC0",line:"#1E2E4A",accent:"#00F0FF","accent-ink":"#02121A",accent2:"#FF2E88"}},
    {id:"celestial",name:"Celestial",tag:"starlit night · twinkle",c:{bg:"#0A0A1F",surface:"#14142E","surface-2":"#1E1E42",ink:"#F0EEFF",muted:"#8F8FC8",line:"#2A2A58",accent:"#B9A7FF","accent-ink":"#0C0A22",accent2:"#7FE0FF"}},
    {id:"rainy",name:"Rainy Day",tag:"melancholy · rain",c:{bg:"#0E1418",surface:"#172026","surface-2":"#1F2C33",ink:"#E6EEF2",muted:"#7F98A4",line:"#28383F",accent:"#7FC0D0","accent-ink":"#06161C",accent2:"#9FB4C0"}},
    {id:"fireflies",name:"Fireflies",tag:"summer night · glow",c:{bg:"#0F1310",surface:"#181E16","surface-2":"#212A1E",ink:"#EEF5E8",muted:"#9AB088",line:"#2C3826",accent:"#EBD66A","accent-ink":"#141608",accent2:"#A6E07A"}}
  ];
  var ANIME_THEMES = [
    {id:"naruto",name:"Naruto",tag:"hidden leaf · autumn",c:{bg:"#141A2E",surface:"#1C2740","surface-2":"#273352",ink:"#FFF2E0",muted:"#9FB0D0",line:"#2E3D5E",accent:"#FF8A2B","accent-ink":"#1A0E02",accent2:"#4A74C8"}},
    {id:"bleach",name:"Bleach",tag:"soul reaper · ash",c:{bg:"#0C0C0E",surface:"#16161A","surface-2":"#222228",ink:"#F2EEE8",muted:"#9A968E",line:"#2E2E36",accent:"#FF8C1A","accent-ink":"#140A02",accent2:"#38B0D8"}},
    {id:"chainsaw",name:"Chainsaw Man",tag:"blood & chainsaws",c:{bg:"#140808",surface:"#1F0E0C","surface-2":"#2E1512",ink:"#FFE6E2",muted:"#C78A82",line:"#40201C",accent:"#E51526","accent-ink":"#FFFFFF",accent2:"#E8A23A"}},
    {id:"jjk",name:"Jujutsu Kaisen",tag:"cursed energy",c:{bg:"#0D0A1A",surface:"#161228","surface-2":"#201A3A",ink:"#EFEAFF",muted:"#9087C0",line:"#2C2550",accent:"#B4133B","accent-ink":"#FFFFFF",accent2:"#6A5CE0"}},
    {id:"demonslayer",name:"Demon Slayer",tag:"water & flame",c:{bg:"#0C1618",surface:"#132225","surface-2":"#1C3034",ink:"#EAF6F5",muted:"#86AEB0",line:"#26444A",accent:"#17B0A6","accent-ink":"#02191A",accent2:"#F26D8E"}},
    {id:"aot",name:"Attack on Titan",tag:"walls & smoke",c:{bg:"#14140F",surface:"#1E1E16","surface-2":"#2A2A20",ink:"#EFEDE2",muted:"#A09C88",line:"#34342A",accent:"#9A3324","accent-ink":"#FFFFFF",accent2:"#6E7A52"}},
    {id:"onepiece",name:"One Piece",tag:"grand line",c:{bg:"#07192E",surface:"#0E2540","surface-2":"#163353",ink:"#E6F2FF",muted:"#7FA6C8",line:"#1E3E5E",accent:"#1E90D8","accent-ink":"#02141F",accent2:"#F2C14E"}},
    {id:"dragonball",name:"Dragon Ball",tag:"ki energy",c:{bg:"#141020",surface:"#1E1830","surface-2":"#2A2242",ink:"#FFF3E2",muted:"#A89AC0",line:"#342C4E",accent:"#FF7A1A","accent-ink":"#1A0D02",accent2:"#3DC0FF"}},
    {id:"deathnote",name:"Death Note",tag:"shinigami",c:{bg:"#0C0C0D",surface:"#151517","surface-2":"#212124",ink:"#EDEDEE",muted:"#8E8E92",line:"#2C2C30",accent:"#C01622","accent-ink":"#FFFFFF",accent2:"#8E8E92"}},
    {id:"yourname",name:"Your Name",tag:"twilight comet",c:{bg:"#0E1030",surface:"#171A42","surface-2":"#212658",ink:"#EFEFFF",muted:"#8E92C8",line:"#2C3068",accent:"#FF9E5A","accent-ink":"#1A0E04",accent2:"#6AA8FF"}},
    {id:"evangelion",name:"Evangelion",tag:"NERV",c:{bg:"#120A1C",surface:"#1C1230","surface-2":"#281A42",ink:"#F0E8FF",muted:"#9A8AC0",line:"#342450",accent:"#7A2BE0","accent-ink":"#FFFFFF",accent2:"#6CE05A"}},
    {id:"bebop",name:"Cowboy Bebop",tag:"jazz & space",c:{bg:"#141210",surface:"#1E1B16","surface-2":"#2A261E",ink:"#F2EEE2",muted:"#A89E86",line:"#36302A",accent:"#E0A82E","accent-ink":"#1A1202",accent2:"#2E9E9E"}},
    {id:"yourlie",name:"Your Lie in April",tag:"stage lights",c:{bg:"#0E1220",surface:"#171C30","surface-2":"#212842",ink:"#EEF2FF",muted:"#8E9AC0",line:"#2C3450",accent:"#6AA8FF","accent-ink":"#02101F",accent2:"#F29ABF"}},
    {id:"toradora",name:"Toradora",tag:"romance · hearts",c:{bg:"#1E1418",surface:"#2A1C22","surface-2":"#3A262E",ink:"#FFEDF2",muted:"#CC94A6",line:"#4A2E38",accent:"#FF6F8E","accent-ink":"#1C060C",accent2:"#FFC56B"}},
    {id:"violet",name:"Violet Evergarden",tag:"letters & snow",c:{bg:"#0E1420",surface:"#172030","surface-2":"#212E42",ink:"#EEF3FA",muted:"#8EA0B4",line:"#2C3A4E",accent:"#7FB0E0","accent-ink":"#04121F",accent2:"#E8D9A8"}}
  ];
  var HOF_THEMES = [
    {id:"t-frieren",name:"Frieren",tag:"Best Anime",c:{bg:"#101A1C",surface:"#17272A","surface-2":"#20383C",ink:"#EEF7F6",muted:"#8FB5B2",line:"#284A4D",accent:"#8FE0D2","accent-ink":"#06201C",accent2:"#E9C87A"}},
    {id:"t-avatar",name:"Avatar: TLA",tag:"Best Cartoon",c:{bg:"#1B1208",surface:"#2A1D0F","surface-2":"#3A2A17",ink:"#FFF3E0",muted:"#C6A06A",line:"#4A361D",accent:"#FF9D2E","accent-ink":"#1B1004",accent2:"#4BB6D8"}},
    {id:"t-spirited",name:"Spirited Away",tag:"Best Movie",c:{bg:"#0C1620",surface:"#13212F","surface-2":"#1C2F41",ink:"#EAF2F8",muted:"#86A2B8",line:"#263E52",accent:"#E2574A","accent-ink":"#1A0605",accent2:"#E7B14A"}},
    {id:"t-makima",name:"Makima",tag:"Best Girl",c:{bg:"#1C0D0C",surface:"#2A1513","surface-2":"#3A1E1A",ink:"#FFEAE6",muted:"#CC8A80",line:"#4A2621",accent:"#FF5640","accent-ink":"#1C0603",accent2:"#E9B24A"}}
  ];
  var ALL = THEMES.concat(ANIME_THEMES, HOF_THEMES);
  var FXKEY = {arcade:"spark",sakura:"petal",abyss:"bubble",ember:"ember",matcha:"leaf",mono:"dust",cyberpunk:"matrix",celestial:"star",rainy:"rain",fireflies:"firefly",naruto:"autumn",bleach:"ash",chainsaw:"blood",jjk:"firefly",demonslayer:"petal",aot:"fog",onepiece:"bubble",dragonball:"ember",deathnote:"feather",yourname:"meteor",evangelion:"glitch",bebop:"notes",yourlie:"bokeh",toradora:"hearts",violet:"snowstorm","t-frieren":"snow","t-avatar":"ember","t-spirited":"ash","t-makima":"ember"};

  /* ---- particle effects ---- */
  var MATRIX_CH = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789".split("");
  var FX = {
    spark:{m:"linear",dir:-1,shape:"dot",n:34,size:[1,3],spd:[.2,.6],sway:.5},
    petal:{m:"linear",dir:1,shape:"petal",n:38,size:[4,8],spd:[.5,1.2],sway:1.4},
    bubble:{m:"linear",dir:-1,shape:"bubble",n:34,size:[2,6],spd:[.3,.9],sway:.7},
    ember:{m:"linear",dir:-1,shape:"ember",n:48,size:[1,3],spd:[.4,1.2],sway:.9},
    leaf:{m:"linear",dir:1,shape:"petal",n:30,size:[4,7],spd:[.4,1.0],sway:1.2},
    dust:{m:"linear",dir:1,shape:"dot",n:26,size:[1,2],spd:[.2,.5],sway:.4},
    snow:{m:"linear",dir:1,shape:"snow",n:46,size:[1.5,3.5],spd:[.25,.7],sway:1.0,col:["#FFFFFF","#EAF7F4"]},
    ash:{m:"float",shape:"ash",n:30,size:[1.5,3],spd:[.15,.5],sway:.6},
    code:{m:"linear",dir:1,shape:"code",n:42,size:[7,18],spd:[1.6,3.6],sway:.06},
    star:{m:"float",shape:"star",n:46,size:[1.5,3.5],spd:[.05,.25],sway:.4},
    rain:{m:"linear",dir:1,shape:"rain",n:72,size:[8,18],spd:[3.5,6],sway:.04},
    firefly:{m:"float",shape:"firefly",n:28,size:[1.5,3],spd:[.15,.5],sway:.5},
    hearts:{m:"linear",dir:1,shape:"heart",n:30,size:[4,8],spd:[.5,1.1],sway:1.1},
    notes:{m:"linear",dir:1,shape:"note",n:26,size:[5,9],spd:[.4,1.0],sway:1.2},
    autumn:{m:"linear",dir:1,shape:"leafv",n:34,size:[4,8],spd:[.5,1.1],sway:1.5},
    meteor:{m:"linear",dir:1,shape:"meteor",n:16,size:[16,34],spd:[4,7],sway:0,vx:[1.6,3.4]},
    bokeh:{m:"float",shape:"bokeh",n:22,size:[6,16],spd:[.05,.2],sway:.3},
    feather:{m:"linear",dir:1,shape:"feather",n:26,size:[5,10],spd:[.2,.6],sway:1.6},
    matrix:{m:"linear",dir:1,shape:"matrix",n:46,size:[12,16],spd:[1.8,3.8],sway:0},
    glitch:{m:"linear",dir:1,shape:"glitch",n:40,size:[2,6],spd:[1.0,2.6],sway:.2},
    fog:{m:"float",shape:"fog",n:14,size:[40,90],spd:[.03,.12],sway:.2},
    snowstorm:{m:"linear",dir:1,shape:"snow",n:90,size:[1.5,3.5],spd:[1.0,2.2],sway:1.4,vx:[1.2,2.8],col:["#FFFFFF","#EAF7F4"]},
    blood:{m:"linear",dir:1,shape:"blood",n:40,size:[2,5],spd:[2.0,4.2],sway:.1}
  };
  var cv, cx, fxType = "spark", fxOn = true, parts = [], W = 0, Ht = 0, COLS = ["#B8FF3C","#FF4D9D"];
  var reduceM = false;
  function rnd(a,b){return a+Math.random()*(b-a)}
  function themeCols(){var s=getComputedStyle(document.documentElement);return [(s.getPropertyValue("--accent")||"#B8FF3C").trim(),(s.getPropertyValue("--accent2")||"#FF4D9D").trim()]}
  function sz(){W=cv.width=window.innerWidth;Ht=cv.height=window.innerHeight}
  function mk(f,init){var s=rnd(f.size[0],f.size[1]),pal=f.col||COLS,p={s:s,c:pal[Math.floor(Math.random()*pal.length)],rot:rnd(0,6.28),vr:rnd(-.02,.02),tw:rnd(0,6.28)};
    if(f.shape==="matrix")p.ch=MATRIX_CH[Math.floor(Math.random()*MATRIX_CH.length)];
    if(f.vx)p.wx=rnd(f.vx[0],f.vx[1]);
    if(f.m==="float"){p.x=rnd(0,W);p.y=rnd(0,Ht);p.dx=rnd(-.4,.4);p.dy=rnd(-.4,.4)}
    else{p.x=rnd(0,W);p.vy=rnd(f.spd[0],f.spd[1]);p.sw=rnd(.3,f.sway);p.ph=rnd(0,6.28);p.y=init?rnd(0,Ht):(f.dir>0?-18:Ht+18)}
    return p}
  function seedFx(){COLS=themeCols();var f=FX[fxType]||FX.spark,i;parts=[];for(i=0;i<f.n;i++)parts.push(mk(f,true))}
  function setFx(k){fxType=k;if(cv)seedFx()}
  function drawFx(){if(!cx)return;cx.clearRect(0,0,W,Ht);if(!fxOn||reduceM)return;var f=FX[fxType]||FX.spark,sh=f.shape,i,p;
    for(i=0;i<parts.length;i++){p=parts[i];
      if(f.m==="float"){p.x+=p.dx;p.y+=p.dy;p.tw+=.05;if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=Ht+20;if(p.y>Ht+20)p.y=-20}
      else{p.y+=p.vy*f.dir;p.ph+=.02;p.x+=(p.wx||0)+Math.sin(p.ph)*p.sw;p.rot+=p.vr;
        if(p.x<-44)p.x=W+44;if(p.x>W+44)p.x=-44;
        if(f.dir>0&&p.y>Ht+22)parts[i]=mk(f,false);
        if(f.dir<0&&p.y<-22)parts[i]=mk(f,false);p=parts[i]}
      cx.save();cx.translate(p.x,p.y);cx.globalAlpha=.85;cx.fillStyle=p.c;cx.strokeStyle=p.c;
      if(sh==="petal"){cx.rotate(p.rot);cx.beginPath();cx.ellipse(0,0,p.s,p.s/2,0,0,6.28);cx.fill()}
      else if(sh==="bubble"){cx.globalAlpha=.45;cx.lineWidth=1.3;cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.stroke()}
      else if(sh==="snow"){cx.globalAlpha=.9;cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.fill()}
      else if(sh==="ember"){cx.globalAlpha=.4+.5*Math.abs(Math.sin(p.tw+=.03));cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.fill()}
      else if(sh==="code"){cx.globalAlpha=.7;cx.fillRect(-.8,0,1.6,p.s);cx.globalAlpha=.95;cx.fillRect(-.9,p.s-3,1.8,3)}
      else if(sh==="rain"){cx.globalAlpha=.35;cx.lineWidth=1.1;cx.beginPath();cx.moveTo(0,0);cx.lineTo(0,p.s);cx.stroke()}
      else if(sh==="star"){cx.globalAlpha=.3+.7*Math.abs(Math.sin(p.tw));var r=p.s;cx.fillRect(-r,-.6,2*r,1.2);cx.fillRect(-.6,-r,1.2,2*r)}
      else if(sh==="firefly"){cx.globalAlpha=.35+.6*Math.abs(Math.sin(p.tw));cx.shadowBlur=8;cx.shadowColor=p.c;cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.fill()}
      else if(sh==="ash"){cx.globalAlpha=.4;cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.fill()}
      else if(sh==="heart"){cx.rotate(p.rot*.2);var h=p.s;cx.beginPath();cx.moveTo(0,h*.35);cx.bezierCurveTo(h,-h*.5,h*.4,-h,0,-h*.25);cx.bezierCurveTo(-h*.4,-h,-h,-h*.5,0,h*.35);cx.fill()}
      else if(sh==="note"){var nr=p.s;cx.rotate(.2);cx.beginPath();cx.ellipse(-nr*.4,nr*.5,nr*.55,nr*.4,-.3,0,6.28);cx.fill();cx.fillRect(nr*.05,-nr,1.4,nr*1.5);cx.fillRect(nr*.05,-nr,nr*.55,2)}
      else if(sh==="leafv"){cx.rotate(p.rot);cx.beginPath();cx.ellipse(0,0,p.s*.55,p.s,0,0,6.28);cx.fill();cx.globalAlpha*=.5;cx.lineWidth=.8;cx.beginPath();cx.moveTo(0,-p.s);cx.lineTo(0,p.s);cx.stroke()}
      else if(sh==="meteor"){cx.globalAlpha=.55;cx.lineWidth=1.4;cx.beginPath();cx.moveTo(0,0);cx.lineTo(-p.s*.6,-p.s*.5);cx.stroke();cx.globalAlpha=.95;cx.beginPath();cx.arc(0,0,1.7,0,6.28);cx.fill()}
      else if(sh==="bokeh"){cx.globalAlpha=.12+.1*Math.abs(Math.sin(p.tw));cx.shadowBlur=p.s;cx.shadowColor=p.c;cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.fill()}
      else if(sh==="feather"){cx.rotate(p.rot);cx.globalAlpha=.8;cx.beginPath();cx.ellipse(0,0,p.s*.3,p.s,0,0,6.28);cx.fill();cx.globalAlpha*=.5;cx.lineWidth=.7;cx.beginPath();cx.moveTo(0,-p.s);cx.lineTo(0,p.s);cx.stroke()}
      else if(sh==="matrix"){cx.globalAlpha=.8;cx.font=(p.s|0)+"px monospace";cx.textAlign="center";cx.textBaseline="middle";if(Math.random()<.04)p.ch=MATRIX_CH[Math.floor(Math.random()*MATRIX_CH.length)];cx.fillText(p.ch||"ア",0,0)}
      else if(sh==="glitch"){cx.globalAlpha=.4+.5*Math.random();var j=Math.random()<.3?rnd(-3,3):0;cx.fillRect(-p.s/2+j,-p.s/2,p.s,p.s)}
      else if(sh==="fog"){cx.globalAlpha=.06+.04*Math.abs(Math.sin(p.tw));cx.shadowBlur=p.s*.7;cx.shadowColor=p.c;cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.fill()}
      else if(sh==="blood"){cx.globalAlpha=.75;cx.beginPath();cx.arc(0,0,p.s*.6,0,6.28);cx.fill();cx.globalAlpha=.4;cx.lineWidth=1.2;cx.beginPath();cx.moveTo(0,0);cx.lineTo(0,-p.s*1.4);cx.stroke()}
      else{cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.fill()}
      cx.restore()}
  }

  /* ---- apply a theme (sets CSS vars on :root) ---- */
  function applyTheme(t){
    var r=document.documentElement, k;
    for(k in t.c){if(t.c.hasOwnProperty(k))r.style.setProperty("--"+k,t.c[k])}
    lsSet(LS_THEME,t.id);
    var sw=document.querySelectorAll(".cafx-sw"),i;
    for(i=0;i<sw.length;i++)sw[i].setAttribute("aria-pressed",String(sw[i].getAttribute("data-id")===t.id));
    setFx(FXKEY[t.id]||"spark");
  }

  /* ---- UI ---- */
  function styleEl(){
    var s=document.createElement("style");
    s.textContent=
      "#cafx-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.55}"+
      ".wrap{position:relative;z-index:1}"+
      ".cafx-scrim{position:fixed;inset:0;z-index:4000;background:rgba(5,3,12,.55);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow:auto}"+
      ".cafx-panel{background:var(--surface);border:1px solid var(--line);border-radius:16px;max-width:620px;width:100%;margin:auto;padding:18px;box-shadow:0 30px 70px rgba(0,0,0,.5)}"+
      ".cafx-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}"+
      ".cafx-head h2{margin:0;font-size:17px;font-weight:800;color:var(--ink)}"+
      ".cafx-x{background:var(--surface-2);border:1px solid var(--line);color:var(--ink);border-radius:9px;width:32px;height:32px;font-size:16px;cursor:pointer}"+
      ".cafx-lbl{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px}"+
      ".cafx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px}"+
      ".cafx-sw{display:flex;align-items:center;gap:10px;background:var(--surface-2);border:2px solid var(--line);border-radius:12px;padding:9px 11px;text-align:left;cursor:pointer;color:var(--ink)}"+
      ".cafx-sw[aria-pressed=true]{border-color:var(--accent)}"+
      ".cafx-dots{display:inline-flex}.cafx-dots i{width:15px;height:15px;border-radius:50%;display:inline-block;border:2px solid var(--surface-2);margin-left:-5px}.cafx-dots i:first-child{margin-left:0}"+
      ".cafx-nm{font-weight:700;font-size:12.5px;line-height:1.1}.cafx-vb{font-size:10px;color:var(--muted)}"+
      ".cafx-row{display:flex;align-items:center;gap:8px;margin-top:16px;font-size:13px;color:var(--ink);font-weight:600}"+
      ".cafx-tdot{width:12px;height:12px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px var(--surface),0 0 0 3px var(--line)}";
    document.head.appendChild(s);
  }
  function swatch(t,label){
    return '<button type="button" class="cafx-sw" data-id="'+t.id+'">'+
      '<span class="cafx-dots"><i style="background:'+t.c.accent+'"></i><i style="background:'+t.c.accent2+'"></i><i style="background:'+t.c.surface+'"></i></span>'+
      '<span><span class="cafx-nm">'+t.name+'</span><br><span class="cafx-vb">'+label+'</span></span></button>';
  }
  function buildPanel(){
    var scrim=document.createElement("div");scrim.className="cafx-scrim";scrim.hidden=true;scrim.id="cafx-scrim";
    function grp(label,arr,key){return '<div class="cafx-lbl">'+label+'</div><div class="cafx-grid">'+arr.map(function(t){return swatch(t,t[key])}).join("")+'</div>'}
    scrim.innerHTML='<div class="cafx-panel" role="dialog" aria-modal="true">'+
      '<div class="cafx-head"><h2>Theme &amp; effects</h2><button type="button" class="cafx-x" aria-label="Close">×</button></div>'+
      grp("Vibe presets",THEMES,"tag")+
      grp("Anime presets — palette + matching effect",ANIME_THEMES,"tag")+
      grp("From your Hall of Fame",HOF_THEMES,"tag")+
      '<label class="cafx-row"><input type="checkbox" id="cafx-toggle"'+(fxOn?" checked":"")+'> Ambient effects (petals, embers, drifting bits — matches the theme)</label>'+
      '</div>';
    document.body.appendChild(scrim);
    function close(){scrim.hidden=true}
    scrim.addEventListener("click",function(e){
      if(e.target===scrim){close();return}
      if(e.target.closest(".cafx-x")){close();return}
      var b=e.target.closest(".cafx-sw");
      if(b){var t=null,i;for(i=0;i<ALL.length;i++)if(ALL[i].id===b.getAttribute("data-id")){t=ALL[i];break}if(t)applyTheme(t)}
    });
    var tog=scrim.querySelector("#cafx-toggle");
    tog.addEventListener("change",function(){fxOn=tog.checked;lsSet(LS_FX,fxOn?"1":"0");if(!fxOn&&cx)cx.clearRect(0,0,W,Ht)});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!scrim.hidden)close()});
    return scrim;
  }

  function mount(){
    try{reduceM=window.matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){}
    styleEl();
    cv=document.createElement("canvas");cv.id="cafx-canvas";cv.setAttribute("aria-hidden","true");
    document.body.insertBefore(cv,document.body.firstChild);
    cx=cv.getContext("2d");sz();window.addEventListener("resize",function(){sz();seedFx()});

    var scrim=buildPanel();

    var btn=document.createElement("button");btn.type="button";btn.className="btn ghost";btn.id="cafx-open";
    btn.innerHTML='<span class="cafx-tdot"></span> Theme';
    btn.addEventListener("click",function(){scrim.hidden=false});
    var actions=document.querySelector(".actions");
    if(actions){var menu=actions.querySelector(".menu");if(menu)actions.insertBefore(btn,menu);else actions.appendChild(btn)}
    else document.body.appendChild(btn);

    // apply saved choice (or leave the app's default palette, just start particles)
    var savedFx=lsGet(LS_FX);if(savedFx==="0")fxOn=false;
    var saved=lsGet(LS_THEME),t=null,i;
    for(i=0;i<ALL.length;i++)if(ALL[i].id===saved){t=ALL[i];break}
    if(t)applyTheme(t);else{seedFx();}
    var tog2=document.getElementById("cafx-toggle");if(tog2)tog2.checked=fxOn;

    (function loop(){drawFx();window.requestAnimationFrame(loop)})();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
