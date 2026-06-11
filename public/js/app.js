/* ═══ CONSTANTS ═══ */
var _TW='https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/';
function _ei(cp){return '<img class="emo" src="'+_TW+cp+'.svg" alt="">';}
var BW=4.6,BH=1.3,BD=3.6,CW=1.95,CH=0.82,CD=1.5;
var BODY_CY=-BH/2+.04+CH/2, BODY_TOP=BODY_CY+CH/2, BORDER_Y=BODY_TOP+.015;
var CPOS=[[-1.12,-.85],[1.12,-.85],[-1.12,.85],[1.12,.85]];

/* ═══ STATE ═══ */
var cur=0,soloMode=false,spinning=false,decorMode=false,deleteMode=false,selDec='rosette',decorScale=1,decorRot=0,decorColor='#f4b8c8';
var CAKE_NAMES=['Top Left','Top Right','Bot Left','Bot Right'];
// Customizable box + greeting card + lid interior (global, not per-cake)
var cardData={l1:'Happy',l2:'Birthday',sub:'to a year full of wonder'};
var lidData={title:'STAR-GAZER',msg:'Happy Birthday',sub:'Wishing you a year full of wonders.',bg:'#192840',photo:null,photoSrc:null};
var boxColorHex='#8ab8d0', lidColorHex='#9ecce0';
var SWATCHES=[['#aaccdf','Sky Blue'],['#92b8d4','Steel'],['#c2dcea','Ice'],['#b5d5c5','Sage'],['#a8d8a8','Mint'],['#d8e8c0','Pistachio'],['#f2c4c8','Rose'],['#e8a0aa','Berry'],['#f5b0b0','Coral'],['#c8b4d8','Lavender'],['#d8a8d0','Orchid'],['#f5dfc0','Peach'],['#f0d0a0','Apricot'],['#f8e8b0','Butter'],['#e0c0d0','Blush'],['#d4d4d4','White'],['#c8b090','Caramel'],['#404040','Charcoal']];
var DECOL=[['#f4b8c8','Pink'],['#f8e8d0','Cream'],['#f0f0f0','White'],['#d0b8f0','Lavender'],['#88d8c0','Mint'],['#8B5530','Choc']];
// Cake flavours — sponge colour shown as the exposed crumb band at the base
var FLAVORS=[
  {id:'vanilla',n:'Vanilla',e:_ei('1f366'),s:'#f1e1bb'},
  {id:'chocolate',n:'Chocolate',e:_ei('1f36b'),s:'#6b4630'},
  {id:'strawberry',n:'Strawberry',e:_ei('1f353'),s:'#f0bcc8'},
  {id:'redvelvet',n:'Red Velvet',e:_ei('2764'),s:'#a23b40'},
  {id:'matcha',n:'Matcha',e:_ei('1f375'),s:'#bcd592'},
  {id:'lemon',n:'Lemon',e:_ei('1f34b'),s:'#f3df85'},
  {id:'ube',n:'Ube',e:_ei('1f49c'),s:'#b49bd8'},
  {id:'funfetti',n:'Funfetti',e:_ei('1f389'),s:'#efe6d2'}
];
function flavorById(id){for(var i=0;i<FLAVORS.length;i++)if(FLAVORS[i].id===id)return FLAVORS[i];return FLAVORS[0];}
// Default color suggestion per decoration type (null = keep current decorColor)
var DECOR_DEFAULTS={moon:'#c2cdd8',starflat:'#c9a84c',flower:'#f0a0b0',heart:'#e08090',candle:null,rosette:null,pearl:null,custom:null,whipcream:'#fbf6ec'};
var DECOR_TYPES=[
  {id:'rosette',icon:_ei('1f338'),name:'Rosette'},{id:'pearl',icon:_ei('26aa'),name:'Pearl'},
  {id:'flower',icon:_ei('1f33a'),name:'Flower'},{id:'moon',icon:_ei('1f319'),name:'Moon'},
  {id:'starflat',icon:_ei('2b50'),name:'Star'},{id:'heart',icon:_ei('1f497'),name:'Heart'},
  {id:'candle',icon:_ei('1f56f'),name:'Candle'},{id:'whipcream',icon:_ei('1f300'),name:'Whip Cream'},
  {id:'custom',icon:_ei('270f'),name:'Custom'}
];
var cakeData=[];
for(var i=0;i<4;i++) cakeData.push({color:'#aaccdf',finish:'satin',flavor:['vanilla','strawberry','ube','chocolate'][i],top:['tarot_star','photo','text','tarot_moon'][i],t1:['THE STAR','','Older, Hotter, Wiser','THE MOON'][i],t2:['','','XXII',''][i],t3:'',decorations:[]});

/* ═══ UI ═══ */
function switchTab(t){
  document.querySelectorAll('.tab').forEach(function(el){el.classList.toggle('active',el.dataset.tab===t);});
  document.querySelectorAll('.tab-panel').forEach(function(el){el.classList.toggle('active',el.id==='tab-'+t);});
  // Editing happens in solo view; browsing happens in box view
  if(t==='edit'){if(!soloMode)enterSolo();}
  else if(t==='select'){if(soloMode)exitSolo();}
}
function selCake(i){
  cur=i;
  document.querySelectorAll('.ck-cell').forEach(function(e,j){e.classList.toggle('on',j===i);});
  document.getElementById('edit-label').textContent=CAKE_NAMES[i];
  loadUI();
}
function loadUI(){
  var d=cakeData[cur];
  document.querySelectorAll('.cs').forEach(function(s){s.classList.toggle('on',s.dataset.c===d.color);});
  document.getElementById('cpick').value=d.color;
  document.getElementById('sel-finish').value=d.finish;
  document.getElementById('sel-top').value=d.top;
  document.getElementById('t1').value=d.t1;document.getElementById('t2').value=d.t2;document.getElementById('t3').value=d.t3;
  document.getElementById('sel-flavor').value=d.flavor||'vanilla';
  document.getElementById('edit-label').textContent=CAKE_NAMES[cur];
  updatePhotoRow();updateFlavorNote();
}
function apply(){
  var d=cakeData[cur];d.finish=document.getElementById('sel-finish').value;
  d.top=document.getElementById('sel-top').value;
  d.flavor=document.getElementById('sel-flavor').value;
  d.t1=document.getElementById('t1').value;d.t2=document.getElementById('t2').value;d.t3=document.getElementById('t3').value;
  updatePhotoRow();updateFlavorNote();
  buildCake(cur);
}
function updateFlavorNote(){var f=flavorById(cakeData[cur].flavor||'vanilla');document.getElementById('flavor-note').innerHTML=f.e+' <strong style="color:#c9a84c">'+f.n+'</strong> sponge — shows at the cake base';}
// Show the upload control only for the Photo Print topping; reflect load state
function updatePhotoRow(){
  var d=cakeData[cur];
  document.getElementById('photo-row').style.display=(d.top==='photo')?'block':'none';
  var has=!!d.photo;
  document.getElementById('photo-status').textContent=has?'✓ Your photo is on the cake. Tap above to replace.':'Using placeholder — upload a photo to personalize.';
  document.getElementById('photo-remove').style.display=has?'block':'none';
}
// Read the chosen file, decode it, store per-cake, and rebuild
function uploadPhoto(inp){
  var f=inp.files&&inp.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      // Downscale big phone/iPad photos → small data-URL (fast, and stays under upload limits)
      var MAXD=1100, sc=Math.min(1, MAXD/Math.max(img.width,img.height));
      var cw=Math.max(1,Math.round(img.width*sc)), ch=Math.max(1,Math.round(img.height*sc));
      var cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
      cv.getContext('2d').drawImage(img,0,0,cw,ch);
      var durl;try{durl=cv.toDataURL('image/jpeg',0.85);}catch(e){durl=ev.target.result;}
      var fin=new Image();
      fin.onload=function(){
        cakeData[cur].photo=fin;
        cakeData[cur].photoSrc=durl;            // compact data-URL saved with the order
        cakeData[cur].top='photo';
        document.getElementById('sel-top').value='photo';
        updatePhotoRow();
        buildCake(cur);
      };
      fin.src=durl;
    };
    img.onerror=function(){document.getElementById('photo-status').textContent='⚠ Could not read that image. Try another.';};
    img.src=ev.target.result;
  };
  rd.readAsDataURL(f);
  inp.value=''; // allow re-selecting the same file later
}
function removePhoto(){cakeData[cur].photo=null;cakeData[cur].photoSrc=null;updatePhotoRow();buildCake(cur);}
function pickRGB(hex){cakeData[cur].color=hex;document.querySelectorAll('.cs').forEach(function(s){s.classList.remove('on');});buildCake(cur);}
function setDecorColor(hex){decorColor=hex;document.querySelectorAll('.dcol').forEach(function(e){e.classList.remove('on');});document.getElementById('decpick').value=hex;if(window.updatePreview)updatePreview();}
function undoDecor(){if(cakeData[cur].decorations.length){cakeData[cur].decorations.pop();buildCake(cur);}}
function clearDecor(){cakeData[cur].decorations=[];buildCake(cur);}
function toggleDelete(){deleteMode=!deleteMode;document.getElementById('btn-del').classList.toggle('active',deleteMode);document.getElementById('mode-badge').textContent=deleteMode?'DELETE MODE — Click near decoration to remove':'DECORATE MODE — Click cake to place';}

// Build flavour dropdown options
(function(){var sel=document.getElementById('sel-flavor');
  FLAVORS.forEach(function(f){var o=document.createElement('option');o.value=f.id;o.textContent=f.e+'  '+f.n;sel.appendChild(o);});
})();
// Build swatches
(function(){var row=document.getElementById('swatches');
  SWATCHES.forEach(function(s){var el=document.createElement('div');el.className='cs'+(s[0]===cakeData[0].color?' on':'');el.style.background=s[0];el.dataset.c=s[0];el.title=s[1];
  el.onclick=function(){cakeData[cur].color=s[0];document.querySelectorAll('.cs').forEach(function(e){e.classList.remove('on');});el.classList.add('on');document.getElementById('cpick').value=s[0];buildCake(cur);};row.appendChild(el);});
})();
// Build decoration palette
(function(){var grid=document.getElementById('dec-grid');
  DECOR_TYPES.forEach(function(dt){
    var el=document.createElement('div');el.className='dec-item'+(dt.id===selDec?' on':'');
    el.innerHTML=dt.icon+'<span>'+dt.name+'</span>';el.dataset.id=dt.id;
    el.onclick=function(){
      selDec=dt.id;
      document.querySelectorAll('.dec-item').forEach(function(e){e.classList.toggle('on',e.dataset.id===dt.id);});
      var def=DECOR_DEFAULTS[dt.id];
      if(def){setDecorColor(def);}
      if(!deleteMode){var mb=document.getElementById('mode-badge');
        mb.textContent=dt.id==='whipcream'?'WHIP CREAM — Drag on cake to pipe':(dt.id==='custom'?'CUSTOM — Click cake, then draw':'DECORATE MODE — Click cake to place');}
      if(window.updatePreview)updatePreview();
    };
    grid.appendChild(el);
  });
})();
// Build decoration color swatches
(function(){var row=document.getElementById('dcol-row');
  DECOL.forEach(function(s){
    var el=document.createElement('div');el.className='dcol'+(s[0]===decorColor?' on':'');
    el.style.background=s[0];el.title=s[1];
    el.onclick=function(){decorColor=s[0];document.getElementById('decpick').value=s[0];document.querySelectorAll('.dcol').forEach(function(e){e.classList.remove('on');});el.classList.add('on');if(window.updatePreview)updatePreview();};
    row.appendChild(el);
  });
})();

/* ═══ CANVAS TEXTURES (same as before, compact) ═══ */
function tex(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;return t;}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();}
function h2l(hex){var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h,s,l=(mx+mn)/2;if(mx===mn){h=s=0;}else{var d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=((g-b)/d+(g<b?6:0))/6;else if(mx===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;}return{h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};}
function H(h,s,l){return'hsl('+h+','+s+'%,'+l+'%)';}
function ds(c,x,y,r,p,col){c.beginPath();for(var i=0;i<p*2;i++){var a=i*Math.PI/p-Math.PI/2,rd=i%2===0?r:r*.4;if(!i)c.moveTo(x+Math.cos(a)*rd,y+Math.sin(a)*rd);else c.lineTo(x+Math.cos(a)*rd,y+Math.sin(a)*rd);}c.closePath();c.fillStyle=col;c.fill();}
function dfl(c,x,y,r,col){for(var i=0;i<5;i++){var a=i*Math.PI*2/5;c.beginPath();c.ellipse(x+Math.cos(a)*r*.56,y+Math.sin(a)*r*.56,r*.46,r*.27,a,0,Math.PI*2);c.fillStyle=col;c.fill();}c.beginPath();c.arc(x,y,r*.28,0,Math.PI*2);c.fillStyle='#fde8c0';c.fill();}
function dht(c,x,y,s,col,stroke){c.beginPath();c.moveTo(x,y+s*.35);c.bezierCurveTo(x,y-s*.45,x-s,y-s*.45,x-s,y);c.bezierCurveTo(x-s,y+s*.65,x,y+s*1.15,x,y+s*1.4);c.bezierCurveTo(x,y+s*1.15,x+s,y+s*.65,x+s,y);c.bezierCurveTo(x+s,y-s*.45,x,y-s*.45,x,y+s*.35);c.closePath();c.fillStyle=col;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}}

/* ── Topping art helpers (high-contrast, readable on any frosting) ── */
// Soft light backing so artwork reads on dark/light frosting alike
function plaque(c,x,y,r){var g=c.createRadialGradient(x,y,r*.2,x,y,r);g.addColorStop(0,'rgba(255,252,245,0.95)');g.addColorStop(.72,'rgba(251,245,235,0.85)');g.addColorStop(1,'rgba(250,244,232,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function leaf(c,x,y,r,ang){c.save();c.translate(x,y);c.rotate(ang);var lg=c.createLinearGradient(-r,0,r,0);lg.addColorStop(0,'#6f9e57');lg.addColorStop(1,'#92c473');c.beginPath();c.ellipse(0,0,r,r*.4,0,0,Math.PI*2);c.fillStyle=lg;c.fill();c.strokeStyle='rgba(50,75,40,0.35)';c.lineWidth=1.5;c.stroke();c.beginPath();c.moveTo(-r*.8,0);c.lineTo(r*.8,0);c.strokeStyle='rgba(50,75,40,0.3)';c.lineWidth=1;c.stroke();c.restore();}
function flower2(c,x,y,r,petal,pdark,center){c.save();c.shadowColor='rgba(0,0,0,0.14)';c.shadowBlur=6;c.shadowOffsetY=2;for(var i=0;i<6;i++){var a=i*Math.PI/3;c.save();c.translate(x,y);c.rotate(a);var pg=c.createLinearGradient(0,0,r,0);pg.addColorStop(0,pdark);pg.addColorStop(1,petal);c.beginPath();c.ellipse(r*.5,0,r*.5,r*.3,0,0,Math.PI*2);c.fillStyle=pg;c.fill();c.restore();}c.restore();c.beginPath();c.arc(x,y,r*.3,0,Math.PI*2);c.fillStyle=center;c.fill();c.strokeStyle='rgba(150,110,40,0.45)';c.lineWidth=1.5;c.stroke();}
// Text with a white halo → legible on any background
function softText(c,txt,x,y,font,fill){c.save();c.font=font;c.textAlign='center';c.lineJoin='round';c.lineWidth=5;c.strokeStyle='rgba(255,255,255,0.92)';c.strokeText(txt,x,y);c.fillStyle=fill;c.fillText(txt,x,y);c.restore();}
function goldDivider(c,x,y,half){c.strokeStyle='rgba(201,168,76,0.78)';c.lineWidth=2;c.beginPath();c.moveTo(x-half,y);c.lineTo(x-13,y);c.moveTo(x+13,y);c.lineTo(x+half,y);c.stroke();ds(c,x,y,7,5,'#c9a84c');}
function starGlow(c,x,y,r,col){c.save();c.shadowColor=col;c.shadowBlur=14;ds(c,x,y,r,5,col);c.restore();}

function sideTex(col,sponge){return tex(512,256,function(c,w,h){
  var hl=h2l(col);var g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,H(hl.h,hl.s,hl.l+12));g.addColorStop(.5,H(hl.h,hl.s,hl.l));g.addColorStop(1,H(hl.h,hl.s+4,hl.l-12));c.fillStyle=g;c.fillRect(0,0,w,h);
  c.globalAlpha=.12;for(var i=0;i<30;i++){var y=Math.random()*h;c.beginPath();c.moveTo(Math.random()*w*.2,y);c.lineTo(Math.random()*w*.2+200+Math.random()*200,y+Math.random()*6-3);c.strokeStyle=H(hl.h,hl.s,hl.l+22);c.lineWidth=1.5+Math.random()*2.5;c.stroke();}c.globalAlpha=1;
  var ts=c.createLinearGradient(0,0,0,22);ts.addColorStop(0,'rgba(255,255,255,0.2)');ts.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=ts;c.fillRect(0,0,w,22);
  // Flavor: exposed sponge band at the base with a wavy frosting hem
  if(sponge){
    var topY=h*0.66; // frosting covers top ~66%, sponge shows below
    c.beginPath();c.moveTo(0,topY);
    for(var x=0;x<=w;x+=40)c.quadraticCurveTo(x+20,topY+((x/40)%2?20:4),x+40,topY+12);
    c.lineTo(w,h);c.lineTo(0,h);c.closePath();
    var sg=h2l(sponge);c.fillStyle=H(sg.h,sg.s,sg.l);c.fill();
    // crumb speckles
    for(var i=0;i<70;i++){var sx=Math.random()*w,sy=topY+14+Math.random()*(h-topY-14);c.globalAlpha=.22;c.fillStyle=H(sg.h,Math.min(100,sg.s+10),Math.max(8,sg.l-22));c.beginPath();c.arc(sx,sy,Math.random()*1.8+.6,0,Math.PI*2);c.fill();}
    c.globalAlpha=1;
    // soft shadow where frosting overlaps sponge
    c.strokeStyle='rgba(0,0,0,0.14)';c.lineWidth=2.5;c.beginPath();c.moveTo(0,topY);for(var x=0;x<=w;x+=40)c.quadraticCurveTo(x+20,topY+((x/40)%2?20:4),x+40,topY+12);c.stroke();
  }
});}
function topTex(d){return tex(512,512,function(c,w,h){var hl=h2l(d.color);var g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w*.65);g.addColorStop(0,H(hl.h,hl.s,hl.l+12));g.addColorStop(.6,H(hl.h,hl.s,hl.l+3));g.addColorStop(1,H(hl.h,hl.s+3,hl.l-5));c.fillStyle=g;c.fillRect(0,0,w,h);c.globalAlpha=.07;for(var i=1;i<=8;i++){c.beginPath();c.arc(w/2,h/2,i*28,0,Math.PI*2);c.strokeStyle=H(hl.h,hl.s,hl.l+20);c.lineWidth=9;c.stroke();}c.globalAlpha=1;
  if(d.top==='tarot_star'){
    var cw=188,ch=262,cx=(w-cw)/2,cy=(h-ch)/2;
    c.save();c.shadowColor='rgba(0,0,0,0.32)';c.shadowBlur=16;c.shadowOffsetY=6;c.fillStyle='#f7f2e6';rr(c,cx,cy,cw,ch,8);c.fill();c.restore();
    c.strokeStyle='#c9a84c';c.lineWidth=2.5;rr(c,cx,cy,cw,ch,8);c.stroke();
    var ix=cx+14,iy=cy+14,iw=cw-28,ih=ch-58;
    c.save();rr(c,ix,iy,iw,ih,6);c.clip();
    var sg=c.createLinearGradient(0,iy,0,iy+ih);sg.addColorStop(0,'#26406c');sg.addColorStop(1,'#101c36');c.fillStyle=sg;c.fillRect(ix,iy,iw,ih);
    // scattered small stars
    [[30,40],[120,30],[142,92],[24,112],[104,150],[50,176],[132,168]].forEach(function(p,k){starGlow(c,ix+p[0],iy+p[1],k%2?5:4,'#ffe9a8');});
    // rolling horizon
    c.fillStyle='rgba(46,74,96,0.7)';c.beginPath();c.moveTo(ix,iy+ih);c.lineTo(ix,iy+ih-24);c.quadraticCurveTo(ix+iw*.5,iy+ih-46,ix+iw,iy+ih-24);c.lineTo(ix+iw,iy+ih);c.closePath();c.fill();
    // big radiant star with glow
    var bx=ix+iw/2,by=iy+ih*.45;
    c.save();c.shadowColor='#ffd86b';c.shadowBlur=24;ds(c,bx,by,30,8,'#ffe6a0');c.restore();
    ds(c,bx,by,15,8,'#fff7dc');
    // long sparkle rays
    c.strokeStyle='rgba(255,236,170,0.6)';c.lineWidth=2;c.beginPath();c.moveTo(bx,by-46);c.lineTo(bx,by+46);c.moveTo(bx-46,by);c.lineTo(bx+46,by);c.stroke();
    c.restore();
    c.strokeStyle='rgba(201,168,76,0.7)';c.lineWidth=1.5;rr(c,ix,iy,iw,ih,6);c.stroke();
    c.fillStyle='#6a5a40';c.font='bold italic 15px serif';c.textAlign='center';c.fillText('THE STAR',cx+cw/2,cy+ch-18);
    ds(c,cx+cw/2-52,cy+ch-23,4,5,'#c9a84c');ds(c,cx+cw/2+52,cy+ch-23,4,5,'#c9a84c');
  }
  else if(d.top==='tarot_moon'){
    var cw=188,ch=262,cx=(w-cw)/2,cy=(h-ch)/2;
    c.save();c.shadowColor='rgba(0,0,0,0.32)';c.shadowBlur=16;c.shadowOffsetY=6;c.fillStyle='#f7f2e6';rr(c,cx,cy,cw,ch,8);c.fill();c.restore();
    c.strokeStyle='#c9a84c';c.lineWidth=2.5;rr(c,cx,cy,cw,ch,8);c.stroke();
    var ix=cx+14,iy=cy+14,iw=cw-28,ih=ch-58;
    c.save();rr(c,ix,iy,iw,ih,6);c.clip();
    var mg=c.createLinearGradient(0,iy,0,iy+ih);mg.addColorStop(0,'#243b66');mg.addColorStop(1,'#0e1830');c.fillStyle=mg;c.fillRect(ix,iy,iw,ih);
    // moon-phase dots across the top
    for(var k=0;k<5;k++){c.beginPath();c.arc(ix+24+k*(iw-48)/4,iy+20,5,0,Math.PI*2);c.fillStyle='rgba(255,232,165,'+(0.32+0.16*(2-Math.abs(2-k)))+')';c.fill();}
    // stars
    [[28,74],[140,64],[34,152],[150,138],[118,170]].forEach(function(p){starGlow(c,ix+p[0],iy+p[1],4,'#ffe9a8');});
    // crescent: soft glow over the body, gold disc, then carve the bite with the panel gradient
    var mx=ix+iw/2,my=iy+ih*.46,MR=46;
    var gl=c.createRadialGradient(mx-MR*.35,my,2,mx-MR*.35,my,MR*1.25);
    gl.addColorStop(0,'rgba(255,228,150,0.5)');gl.addColorStop(1,'rgba(255,228,150,0)');
    c.fillStyle=gl;c.beginPath();c.arc(mx-MR*.35,my,MR*1.25,0,Math.PI*2);c.fill();
    c.fillStyle='#ffe6a0';c.beginPath();c.arc(mx,my,MR,0,Math.PI*2);c.fill();           // lit disc (no shadow)
    c.fillStyle=mg;c.beginPath();c.arc(mx+MR*.52,my-MR*.05,MR*.94,0,Math.PI*2);c.fill(); // carve bite → crescent
    // small craters on the lit edge
    c.fillStyle='rgba(190,150,70,0.38)';
    c.beginPath();c.arc(mx-MR*.42,my-MR*.18,3.2,0,Math.PI*2);c.fill();
    c.beginPath();c.arc(mx-MR*.5,my+MR*.2,2.6,0,Math.PI*2);c.fill();
    starGlow(c,mx+26,my-34,6,'#fff2c0');
    c.restore();
    c.strokeStyle='rgba(201,168,76,0.7)';c.lineWidth=1.5;rr(c,ix,iy,iw,ih,6);c.stroke();
    c.fillStyle='#6a5a40';c.font='bold italic 15px serif';c.textAlign='center';c.fillText('THE MOON',cx+cw/2,cy+ch-18);
    ds(c,cx+cw/2-54,cy+ch-23,4,5,'#c9a84c');ds(c,cx+cw/2+54,cy+ch-23,4,5,'#c9a84c');
  }
  else if(d.top==='photo'){var pw=228,ph=282,px=(w-pw)/2,py=(h-ph)/2;
    // Polaroid frame
    c.save();c.shadowColor='rgba(0,0,0,0.25)';c.shadowBlur=12;c.shadowOffsetY=4;
    c.fillStyle='#efe9de';c.fillRect(px,py,pw,ph);c.restore();
    var ax=px+8,ay=py+8,aw=pw-16,ah=ph-50; // photo window
    if(d.photo&&d.photo.width){
      // Cover-fit the user's image into the window, cropping overflow
      var ar=d.photo.width/d.photo.height,tr=aw/ah,dw,dh;
      if(ar>tr){dh=ah;dw=ah*ar;}else{dw=aw;dh=aw/ar;}
      var dx=ax+(aw-dw)/2,dy=ay+(ah-dh)/2;
      c.save();c.beginPath();c.rect(ax,ay,aw,ah);c.clip();c.drawImage(d.photo,dx,dy,dw,dh);c.restore();
    }else{
      // Placeholder silhouette
      c.fillStyle='#8898b0';c.fillRect(ax,ay,aw,ah);
      c.beginPath();c.arc(ax+aw/2,ay+ah/2-8,48,0,Math.PI*2);c.fillStyle='#6878a8';c.fill();
      c.beginPath();c.ellipse(ax+aw/2,ay+ah/2+36,56,28,0,Math.PI,0,true);c.fill();
    }
    // Inner edge + caption line
    c.strokeStyle='rgba(120,130,150,0.4)';c.lineWidth=1;c.strokeRect(ax,ay,aw,ah);
    if(d.t1){c.fillStyle='rgba(90,80,70,0.85)';c.font='italic 20px serif';c.textAlign='center';c.fillText(d.t1,px+pw/2,py+ph-18);}
  }
  else if(d.top==='text'){
    var tcx=w/2,tcy=h/2;
    plaque(c,tcx,tcy,162);
    goldDivider(c,tcx,tcy-72,92);
    if(d.t1)softText(c,d.t1,tcx,tcy-10,'italic 700 36px serif','#3a4d72');
    if(d.t2)softText(c,d.t2,tcx,tcy+32,'italic 500 27px serif','#7a5a8a');
    if(d.t3)softText(c,d.t3,tcx,tcy+66,'600 20px serif','#a07a3a');
    goldDivider(c,tcx,tcy+94,92);
  }
  else if(d.top==='floral'){
    var fcx=w/2,fcy=h/2-12;
    plaque(c,fcx,fcy,154);
    // leaves tucked under the bouquet
    leaf(c,fcx-72,fcy+14,42,-0.5);leaf(c,fcx+74,fcy+10,42,0.5);
    leaf(c,fcx-44,fcy+74,36,0.95);leaf(c,fcx+48,fcy+70,36,-0.95);leaf(c,fcx,fcy-82,38,0);
    // flowers — solid gradient petals, contrasting centers
    flower2(c,fcx,fcy,54,'#ff9fb0','#e8607f','#ffd35e');
    flower2(c,fcx-80,fcy-30,36,'#ffc6d2','#f08aa0','#fff0b0');
    flower2(c,fcx+82,fcy-28,34,'#c9a0e6','#a266cc','#ffe79a');
    flower2(c,fcx-60,fcy+64,32,'#ffd7a0','#f0a868','#e8785f');
    flower2(c,fcx+64,fcy+62,30,'#aee3bf','#74c293','#ffd35e');
  }
  else if(d.top==='constellation'){
    var ncx=w/2,ncy=h/2-6,NR=152;
    c.save();c.beginPath();c.arc(ncx,ncy,NR,0,Math.PI*2);c.clip();
    // night-sky disc
    var ng=c.createRadialGradient(ncx,ncy-40,12,ncx,ncy,NR);ng.addColorStop(0,'#27406b');ng.addColorStop(1,'#0e1830');
    c.fillStyle=ng;c.fillRect(ncx-NR,ncy-NR,NR*2,NR*2);
    // background stars (fixed pattern)
    var bs=[[-95,-66],[-52,42],[28,-92],[82,-44],[-32,-30],[60,64],[-72,84],[104,18],[8,96],[-112,12],[44,28],[92,-92],[-20,-100],[120,72],[-120,-30]];
    bs.forEach(function(p,i){c.beginPath();c.arc(ncx+p[0],ncy+p[1],(i%3)*0.6+0.8,0,Math.PI*2);c.fillStyle='rgba(222,232,255,'+(0.45+(i%4)*0.13)+')';c.fill();});
    // bright constellation, connected
    var cs=[[-82,-52],[-34,-12],[18,-42],[70,-22],[42,42],[-8,62]];
    c.strokeStyle='rgba(255,224,140,0.65)';c.lineWidth=1.6;c.beginPath();
    cs.forEach(function(p,i){if(i)c.lineTo(ncx+p[0],ncy+p[1]);else c.moveTo(ncx+p[0],ncy+p[1]);});c.stroke();
    cs.forEach(function(p){starGlow(c,ncx+p[0],ncy+p[1],7,'#ffe08a');});
    c.restore();
    // gold rim
    c.beginPath();c.arc(ncx,ncy,NR,0,Math.PI*2);c.strokeStyle='#c9a84c';c.lineWidth=3;c.stroke();
  }
  else if(d.top==='heart'){
    var hcx=w/2,hcy=h/2-34;
    plaque(c,hcx,hcy+24,150);
    c.save();c.shadowColor='rgba(180,60,90,0.28)';c.shadowBlur=16;c.shadowOffsetY=6;
    var hgr=c.createLinearGradient(hcx,hcy-54,hcx,hcy+96);hgr.addColorStop(0,'#ff8fa8');hgr.addColorStop(1,'#e05875');
    dht(c,hcx,hcy,88,hgr,'#c9a84c');c.restore();
    // glossy highlight
    c.beginPath();c.ellipse(hcx-28,hcy+8,15,26,-0.5,0,Math.PI*2);c.fillStyle='rgba(255,255,255,0.45)';c.fill();
    if(d.t1)softText(c,d.t1,hcx,hcy+168,'italic 600 30px serif','#c4546f');
  }
  ds(c,52,52,13,5,'rgba(201,168,76,0.6)');ds(c,460,55,11,5,'rgba(201,168,76,0.55)');ds(c,48,460,12,5,'rgba(201,168,76,0.55)');ds(c,462,458,10,5,'rgba(201,168,76,0.5)');
  // Bottom text overlay — legible white-halo text; photo/text/heart render their own captions
  if(d.top!=='text'&&d.top!=='heart'&&d.top!=='photo'){
    if(d.t1)softText(c,d.t1,w/2,h-58,'italic 600 26px serif','#3a4d72');
    if(d.t2)softText(c,d.t2,w/2,h-32,'italic 20px serif','#5a6d92');
    if(d.t3)softText(c,d.t3,w/2,h-12,'600 16px serif','#9a7a3a');
  }
  });}
function lidTex(){return tex(600,400,function(c,w,h){c.fillStyle=lidData.bg||'#192840';c.fillRect(0,0,w,h);for(var i=0;i<50;i++){c.beginPath();c.arc(Math.random()*w,Math.random()*h,Math.random()*1.2+.4,0,Math.PI*2);c.fillStyle='rgba(184,200,232,'+(Math.random()*.25+.1)+')';c.fill();}c.strokeStyle='#c9a84c';c.lineWidth=2.5;c.strokeRect(8,8,w-16,h-16);var fx=210,fy=22,fw=180,fh=238;c.fillStyle='#142038';c.strokeStyle='#c9a84c';c.lineWidth=2.5;rr(c,fx,fy,fw,fh,8);c.fill();c.stroke();var ecx=fx+fw/2,ecy=fy+fh/2+4,erx=54,ery=68;c.beginPath();c.ellipse(ecx,ecy,erx,ery,0,0,Math.PI*2);c.fillStyle='#283858';c.fill();if(lidData.photo&&lidData.photo.width){c.save();c.beginPath();c.ellipse(ecx,ecy,erx,ery,0,0,Math.PI*2);c.clip();var par=lidData.photo.width/lidData.photo.height,ptr=erx/ery,pdw,pdh;if(par>ptr){pdh=ery*2;pdw=pdh*par;}else{pdw=erx*2;pdh=pdw/par;}c.drawImage(lidData.photo,ecx-pdw/2,ecy-pdh/2,pdw,pdh);c.restore();}else{c.beginPath();c.arc(ecx,ecy-14,24,0,Math.PI*2);c.fillStyle='#5a78a0';c.fill();c.beginPath();c.ellipse(ecx,ecy+28,30,22,0,Math.PI,0,true);c.fill();}c.strokeStyle='#c9a84c';c.lineWidth=1.5;c.beginPath();c.ellipse(ecx,ecy,erx,ery,0,0,Math.PI*2);c.stroke();c.fillStyle='#c9a84c';c.textAlign='center';c.font='bold 11px serif';c.fillText('THE CELESTIAL',fx+fw/2,fy+fh+16);if(lidData.title)c.fillText(lidData.title,fx+fw/2,fy+fh+30);c.fillStyle='#e0c870';c.font='italic 16px serif';if(lidData.msg)c.fillText(lidData.msg+' \u2661',w/2,316);c.fillStyle='#8898b8';c.font='11px serif';if(lidData.sub)c.fillText(lidData.sub,w/2,336);ds(c,155,285,8,5,'#c9a84c');ds(c,455,275,6,5,'rgba(201,168,76,0.5)');});}

// Greeting card front (portrait) — celestial parchment with crescent + message
function cardTex(){return tex(360,440,function(c,w,h){
  var bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#fbf4e2');bg.addColorStop(1,'#efe2c6');c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(var i=0;i<26;i++){c.beginPath();c.arc(Math.random()*w,Math.random()*h,Math.random()*1+.4,0,Math.PI*2);c.fillStyle='rgba(201,168,76,'+(Math.random()*.18+.05)+')';c.fill();}
  c.strokeStyle='#c9a84c';c.lineWidth=4;c.strokeRect(14,14,w-28,h-28);c.lineWidth=1.5;c.strokeRect(22,22,w-44,h-44);
  // crescent moon (gold disc carved by the parchment gradient)
  var mx=w/2,my=104,MR=44;
  var gl=c.createRadialGradient(mx-MR*.3,my,2,mx-MR*.3,my,MR*1.2);gl.addColorStop(0,'rgba(220,180,90,0.5)');gl.addColorStop(1,'rgba(220,180,90,0)');
  c.fillStyle=gl;c.beginPath();c.arc(mx-MR*.3,my,MR*1.2,0,Math.PI*2);c.fill();
  c.fillStyle='#e6c25c';c.beginPath();c.arc(mx,my,MR,0,Math.PI*2);c.fill();
  c.fillStyle=bg;c.beginPath();c.arc(mx+MR*.5,my-MR*.05,MR*.92,0,Math.PI*2);c.fill();
  ds(c,mx-66,my+8,7,5,'#c9a84c');ds(c,mx+70,my-6,6,5,'#c9a84c');ds(c,mx+40,my-52,5,5,'rgba(201,168,76,0.7)');
  c.fillStyle='#5e4f37';c.textAlign='center';
  c.font='italic 700 40px serif';
  if(cardData.l1)c.fillText(cardData.l1,w/2,242);
  if(cardData.l2)c.fillText(cardData.l2,w/2,288);
  goldDivider(c,w/2,322,92);
  c.fillStyle='#9a7a3a';c.font='italic 17px serif';
  if(cardData.sub)c.fillText(cardData.sub,w/2,352);
  c.fillStyle='#8a6a3a';c.font='20px serif';c.fillText('✦   ☾   ✦',w/2,402);
});}

/* ═══ THREE.JS SETUP ═══ */
var scene=new THREE.Scene();scene.background=new THREE.Color(0x0a0e1a);scene.fog=new THREE.Fog(0x0a0e1a,24,55);
var camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);camera.position.set(0,4,10);
var renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
document.body.insertBefore(renderer.domElement,document.body.firstChild);
scene.add(new THREE.AmbientLight(0x8090c0,.7));
var keyL=new THREE.DirectionalLight(0xfff8f0,1.3);keyL.position.set(4,10,5);keyL.castShadow=true;keyL.shadow.mapSize.set(1024,1024);keyL.shadow.camera.near=.5;keyL.shadow.camera.far=30;keyL.shadow.camera.left=-8;keyL.shadow.camera.right=8;keyL.shadow.camera.top=8;keyL.shadow.camera.bottom=-8;scene.add(keyL);
scene.add(new THREE.DirectionalLight(0x4466aa,.35).translateX(-5).translateY(2).translateZ(-4));
var glowL=new THREE.PointLight(0xffd080,.85,12);glowL.position.set(0,3,2);scene.add(glowL);

var world=new THREE.Group();scene.add(world);
var boxGrp=new THREE.Group();world.add(boxGrp);
var scatterGrp=new THREE.Group();world.add(scatterGrp);
var cakeGrps=[];var hitPlanes=[];
for(var i=0;i<4;i++){var g=new THREE.Group();g.position.set(CPOS[i][0],0,CPOS[i][1]);world.add(g);cakeGrps.push(g);
  var hp=new THREE.Mesh(new THREE.PlaneGeometry(CW,CD),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));hp.rotation.x=-Math.PI/2;hp.position.y=BODY_TOP;g.add(hp);hitPlanes.push(hp);}

var goldMat=new THREE.MeshStandardMaterial({color:0xc9a84c,roughness:.2,metalness:.88});
var silverMat=new THREE.MeshStandardMaterial({color:0xc2cdd8,roughness:.3,metalness:.72});
var boxMat=new THREE.MeshStandardMaterial({color:0x8ab8d0,roughness:.48,metalness:.04});
var innerM=new THREE.MeshStandardMaterial({color:0xd8edf8,roughness:.8});
var divM=new THREE.MeshStandardMaterial({color:0xb5d2e5,roughness:.88});
function mk(geo,mat,x,y,z,par){var m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(par||world).add(m);return m;}

mk(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0xf0ead8,roughness:1}),0,-BH/2-.06,0).rotation.x=-Math.PI/2;
mk(new THREE.BoxGeometry(BW,.08,BD),boxMat,0,-BH/2,0,boxGrp);mk(new THREE.BoxGeometry(BW,BH,.08),boxMat,0,0,BD/2,boxGrp);mk(new THREE.BoxGeometry(BW,BH,.08),boxMat,0,0,-BD/2,boxGrp);mk(new THREE.BoxGeometry(.08,BH,BD),boxMat,-BW/2,0,0,boxGrp);mk(new THREE.BoxGeometry(.08,BH,BD),boxMat,BW/2,0,0,boxGrp);
mk(new THREE.BoxGeometry(BW-.1,.03,BD-.1),innerM,0,-BH/2+.05,0,boxGrp);mk(new THREE.BoxGeometry(.04,BH*.65,BD-.12),divM,0,-.05,0,boxGrp);mk(new THREE.BoxGeometry(BW-.12,BH*.65,.04),divM,0,-.05,0,boxGrp);

/* ═══ 3D DECORATION MAKERS ═══ */
var pinkMat=new THREE.MeshStandardMaterial({color:0xf0a0b0,roughness:.6,metalness:.1});
var warmMat=new THREE.MeshStandardMaterial({color:0xfde8c0,roughness:.7});
var heartMat=new THREE.MeshStandardMaterial({color:0xdd8090,roughness:.3,metalness:.5});

function mk3Drosette(par,x,y,z,s,mat,rot){
  // Piped rosette: outer ring of 8 blobs + inner ring of 5 + center peak
  var R=.13*s;
  var g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot||0;
  for(var i=0;i<8;i++){
    var a=i*Math.PI*2/8;
    var b=new THREE.Mesh(new THREE.SphereGeometry(R*.34,10,8),mat);
    b.scale.y=.62;b.position.set(Math.cos(a)*R*.65,R*.04,Math.sin(a)*R*.65);b.castShadow=true;g.add(b);
  }
  for(var i=0;i<5;i++){
    var a=(i+.5)*Math.PI*2/5;
    var b=new THREE.Mesh(new THREE.SphereGeometry(R*.2,8,6),mat);
    b.scale.y=.7;b.position.set(Math.cos(a)*R*.31,R*.13,Math.sin(a)*R*.31);b.castShadow=true;g.add(b);
  }
  var tip=new THREE.Mesh(new THREE.SphereGeometry(R*.18,8,8),mat);
  tip.position.y=R*.22;tip.castShadow=true;g.add(tip);
  par.add(g);
}


function mk3Dpearl(par,x,y,z,s,mat,rot){
  var R=.09*s;
  var b=new THREE.Mesh(new THREE.SphereGeometry(R,16,12),mat);
  b.scale.y=.72;b.position.set(x,y+R*.28,z);b.castShadow=true;par.add(b);
}

function mk3Dflower(par,x,y,z,s,mat,rot){
  var R=.13*s;
  var g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot||0;
  var pm=mat||pinkMat;
  for(var i=0;i<5;i++){
    var a=i*Math.PI*2/5;
    var petal=new THREE.Mesh(new THREE.SphereGeometry(R*.5,12,8),pm);
    petal.scale.set(1.5,.32,.8);
    petal.position.set(Math.cos(a)*R*.7,R*.08,Math.sin(a)*R*.7);
    petal.rotation.y=-a;petal.castShadow=true;g.add(petal);
  }
  var ctr=new THREE.Mesh(new THREE.SphereGeometry(R*.25,10,8),warmMat);
  ctr.scale.y=.55;ctr.position.y=R*.18;ctr.castShadow=true;g.add(ctr);
  par.add(g);
}

function mk3Dmoon(par,x,y,z,s,mat,rot){
  // Crescent = outer circle (R) minus an offset inner circle (ir at +cx); trace the two arcs
  var R=.13*s,ir=R*.92,cx=R*.5,n=30;
  var xi=(R*R-ir*ir+cx*cx)/(2*cx), yi=Math.sqrt(Math.max(0,R*R-xi*xi));
  var ao=Math.atan2(yi,xi), bu=Math.atan2(yi,xi-cx);
  var sh=new THREE.Shape();
  sh.moveTo(R*Math.cos(ao),R*Math.sin(ao));                                      // upper tip
  for(var i=1;i<=n;i++){var a=ao+(2*Math.PI-2*ao)*(i/n);sh.lineTo(R*Math.cos(a),R*Math.sin(a));} // outer arc (left)
  var a0=2*Math.PI-bu;
  for(var i=1;i<=n;i++){var a=a0+(bu-a0)*(i/n);sh.lineTo(cx+ir*Math.cos(a),ir*Math.sin(a));}     // inner bite arc
  sh.closePath();
  var geo=new THREE.ExtrudeGeometry(sh,{depth:.034*s,bevelEnabled:false});
  geo.center();geo.translate(0,0,.017*s);   // center so it rotates in place, then sit on the surface
  var grp=new THREE.Group();grp.position.set(x,y,z);grp.rotation.y=rot||0;
  var m=new THREE.Mesh(geo,mat||silverMat);m.rotation.x=-Math.PI/2;m.castShadow=true;grp.add(m);par.add(grp);
}

function mk3Dstarflat(par,x,y,z,s,mat,rot){
  var R=.11*s;
  var pts=[];for(var i=0;i<10;i++){var a=i*Math.PI/5-Math.PI/2,r=i%2===0?R:R*.4;pts.push(new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r));}
  var grp=new THREE.Group();grp.position.set(x,y,z);grp.rotation.y=rot||0;
  var m=new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts),{depth:.035*s,bevelEnabled:false}),mat||goldMat);
  m.rotation.x=-Math.PI/2;m.castShadow=true;grp.add(m);par.add(grp);
}

function mk3Dheart(par,x,y,z,s,mat,rot){
  // Heart shape - correctly oriented (point faces forward/down)
  var R=.09*s;
  var sh=new THREE.Shape();
  sh.moveTo(0,0);
  sh.bezierCurveTo(-R,R,-R*2.5,R,-R*2.5,0);
  sh.bezierCurveTo(-R*2.5,-R*1.2,-R*1.2,-R*2.2,0,-R*2.8);
  sh.bezierCurveTo(R*1.2,-R*2.2,R*2.5,-R*1.2,R*2.5,0);
  sh.bezierCurveTo(R*2.5,R,R,R,0,0);
  var grp=new THREE.Group();grp.position.set(x,y,z);grp.rotation.y=(rot||0)+Math.PI;
  var hgeo=new THREE.ExtrudeGeometry(sh,{depth:.03*s,bevelEnabled:false});
  hgeo.center();hgeo.translate(0,0,.015*s);  // center so it rotates in place
  var m=new THREE.Mesh(hgeo,mat||heartMat);
  m.rotation.x=-Math.PI/2;m.castShadow=true;grp.add(m);par.add(grp);
}

function mk3Dcandle(par,x,y,z,s,_m,rot){
  var R=.04*s,H2=.28*s;
  mk(new THREE.CylinderGeometry(R,R,H2,10),new THREE.MeshStandardMaterial({color:0xf8e8d0,roughness:.8}),x,y+H2/2,z,par);
  mk(new THREE.CylinderGeometry(.005,.005,.05,6),new THREE.MeshStandardMaterial({color:0x222222}),x,y+H2+.03,z,par);
  var fl=new THREE.MeshStandardMaterial({color:0xff8820,emissive:new THREE.Color(0xff6600),emissiveIntensity:2,roughness:.1});
  var fm=mk(new THREE.SphereGeometry(.03*s,8,6),fl,x,y+H2+.07,z,par);fm.scale.y=1.5;
  var pl=new THREE.PointLight(0xff8820,.3,1.2);pl.position.set(x,y+H2+.08,z);par.add(pl);
}

function mk3Dcustom(par,x,y,z,s,mat,rot,shape,drawnPts){
  var R=.11*s;
  var g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot||0;
  var m=mat||new THREE.MeshStandardMaterial({color:0xf4b8c8,roughness:.78,metalness:.06});
  var mesh;
  if(shape==='drawn'&&drawnPts&&drawnPts.length>=3){
    // Extrude the user-drawn path into a 3D shape
    var sh=new THREE.Shape();
    drawnPts.forEach(function(p,i){
      // Canvas y-down → 3D y-up: flip Y
      if(i===0)sh.moveTo(p.x*R,-p.y*R);else sh.lineTo(p.x*R,-p.y*R);
    });
    sh.closePath();
    var dgeo=new THREE.ExtrudeGeometry(sh,{depth:.042*s,bevelEnabled:false});
    dgeo.center();dgeo.translate(0,0,.021*s);  // center so it rotates in place
    mesh=new THREE.Mesh(dgeo,m);
    mesh.rotation.x=-Math.PI/2;
  }else if(shape==='cube'){
    mesh=new THREE.Mesh(new THREE.BoxGeometry(R*1.5,R*.9,R*1.5),m);mesh.position.y=R*.45;
  }else if(shape==='cylinder'){
    mesh=new THREE.Mesh(new THREE.CylinderGeometry(R*.65,R*.65,R*1.3,20),m);mesh.position.y=R*.65;
  }else if(shape==='disc'){
    mesh=new THREE.Mesh(new THREE.CylinderGeometry(R*1.1,R*1.1,R*.22,28),m);mesh.position.y=R*.11;
  }else if(shape==='pyramid'){
    mesh=new THREE.Mesh(new THREE.ConeGeometry(R,R*1.5,8),m);mesh.position.y=R*.75;
  }else if(shape==='gem'){
    mesh=new THREE.Mesh(new THREE.OctahedronGeometry(R*.9),m);mesh.position.y=R*.9;
  }else{
    mesh=new THREE.Mesh(new THREE.SphereGeometry(R,20,14,0,Math.PI*2,0,Math.PI*.55),m);
  }
  if(mesh){mesh.castShadow=true;g.add(mesh);}
  par.add(g);
}

// Resample a polyline (local x,z) to even arc-length spacing
function resamplePath(pts,step){
  if(!pts||pts.length<2)return (pts||[]).slice();
  var out=[{x:pts[0].x,z:pts[0].z}],carried=0;
  for(var i=1;i<pts.length;i++){
    var ax=pts[i-1].x,az=pts[i-1].z,bx=pts[i].x,bz=pts[i].z;
    var seg=Math.hypot(bx-ax,bz-az),pos=0;
    while(carried+(seg-pos)>=step){
      var need=step-carried;pos+=need;carried=0;
      var t=seg>0?pos/seg:0;
      out.push({x:ax+(bx-ax)*t,z:az+(bz-az)*t});
    }
    carried+=(seg-pos);
  }
  return out;
}
// Piped whipped-cream rope along a drawn path — bumpy blobs + peaked tip
function mk3Dwhip(par,path,s,mat){
  if(!path||!path.length)return;
  var R=.072*s,pts=resamplePath(path,R*.62);
  if(!pts.length)pts=path.slice();
  for(var i=0;i<pts.length;i++){
    var b=new THREE.Mesh(new THREE.SphereGeometry(R,12,10),mat);
    b.scale.set(1,.86+(i%2?.06:0),1);
    b.position.set(pts[i].x,BORDER_Y+R*.5,pts[i].z);
    b.castShadow=true;par.add(b);
  }
  var e=pts[pts.length-1];
  var tip=new THREE.Mesh(new THREE.ConeGeometry(R*.72,R*1.5,12),mat);
  tip.position.set(e.x,BORDER_Y+R*1.05,e.z);tip.castShadow=true;par.add(tip);
}

var DECOR_FN={rosette:mk3Drosette,pearl:mk3Dpearl,flower:mk3Dflower,moon:mk3Dmoon,starflat:mk3Dstarflat,heart:mk3Dheart,candle:mk3Dcandle,custom:mk3Dcustom};

function getFinish(f){if(f==='matte')return{r:.95,m:0};if(f==='glossy')return{r:.25,m:.1};if(f==='metallic')return{r:.18,m:.55};return{r:.65,m:.04};}

// Rounded-corner cake body — a soft rounded-rectangle prism (not a hard box)
function roundedRectShape(wd,dp,r){
  var hw=wd/2,hd=dp/2,s=new THREE.Shape();
  s.moveTo(-hw+r,-hd);
  s.lineTo(hw-r,-hd);s.quadraticCurveTo(hw,-hd,hw,-hd+r);
  s.lineTo(hw,hd-r);s.quadraticCurveTo(hw,hd,hw-r,hd);
  s.lineTo(-hw+r,hd);s.quadraticCurveTo(-hw,hd,-hw,hd-r);
  s.lineTo(-hw,-hd+r);s.quadraticCurveTo(-hw,-hd,-hw+r,-hd);
  return s;
}
// Custom UVs: top cap maps the art 0..1 (matching the old box top); walls wrap with height as V
var cakeUV={
  generateTopUV:function(geo,vs,a,b,c){
    function uv(i){return new THREE.Vector2((vs[i*3]+CW/2)/CW,(vs[i*3+1]+CD/2)/CD);}
    return [uv(a),uv(b),uv(c)];
  },
  generateSideWallUV:function(geo,vs,a,b,c,d){
    function U(i){return (Math.atan2(vs[i*3+1],vs[i*3])+Math.PI)/(2*Math.PI);}
    function V(i){return vs[i*3+2]/CH;}
    return [new THREE.Vector2(U(a),V(a)),new THREE.Vector2(U(b),V(b)),new THREE.Vector2(U(c),V(c)),new THREE.Vector2(U(d),V(d))];
  }
};
// Build once and reuse (geometry is identical for all 4 cakes); rotate so height is +Y
var cakeGeo=new THREE.ExtrudeGeometry(roundedRectShape(CW,CD,0.26),{depth:CH,bevelEnabled:false,curveSegments:6,steps:1,UVGenerator:cakeUV});
cakeGeo.translate(0,0,-CH/2);cakeGeo.rotateX(-Math.PI/2);

function buildCake(i){
  var g=cakeGrps[i];
  // Keep hitplane, remove everything else
  while(g.children.length>1)g.remove(g.children[g.children.length-1]);
  g.position.set(CPOS[i][0],0,CPOS[i][1]);
  var d=cakeData[i];var fin=getFinish(d.finish);
  var spng=flavorById(d.flavor||'vanilla').s;
  var sMat=new THREE.MeshStandardMaterial({map:sideTex(d.color,spng),roughness:fin.r,metalness:fin.m});
  var tMat=new THREE.MeshStandardMaterial({map:topTex(d),roughness:Math.max(.3,fin.r-.1),metalness:fin.m});
  // Rounded cake body: [cap material (top art), wall material (frosting sides)]
  var body=new THREE.Mesh(cakeGeo,[tMat,sMat]);
  body.position.set(0,BODY_CY,0);body.castShadow=true;body.receiveShadow=true;g.add(body);
  // Placed decorations
  var hl=h2l(d.color);
  var frostMat=new THREE.MeshStandardMaterial({color:new THREE.Color(H(hl.h,hl.s,hl.l+12)),roughness:.92});
  d.decorations.forEach(function(dec){
    if(dec.type==='whipcream'){
      var wmat=new THREE.MeshStandardMaterial({color:new THREE.Color(dec.col||'#fbf6ec'),roughness:.86,metalness:.02});
      mk3Dwhip(g,dec.path,dec.scale||1,wmat);
      return;
    }
    var fn=DECOR_FN[dec.type];
    if(fn){
      var mat=null;
      if(dec.type!=='candle'&&dec.col){
        // Metallic sheen only for the default silver moon / gold star; custom colors render as soft fondant
        var lc=dec.col.toLowerCase();
        var isMetallic=(dec.type==='moon'&&lc==='#c2cdd8')||(dec.type==='starflat'&&lc==='#c9a84c');
        mat=new THREE.MeshStandardMaterial({color:new THREE.Color(dec.col),roughness:isMetallic?.24:.62,metalness:isMetallic?.72:.08});
      }
      fn(g,dec.x,BORDER_Y,dec.z,dec.scale,mat,dec.rot||0,dec.customShape||'dome',dec.drawnPts||null);
    }
  });
}
for(var ci=0;ci<4;ci++)buildCake(ci);

/* ═══ LID ═══ */
var lidPivot=new THREE.Group();lidPivot.position.set(0,BH/2,-BD/2);boxGrp.add(lidPivot);
var lidW=BW+.05,lidD=BD+.05,lidT=.11;
var lidOM=new THREE.MeshStandardMaterial({color:0x9ecce0,roughness:.44,metalness:.04});
var lidIM=new THREE.MeshStandardMaterial({map:lidTex(),roughness:.62});
var lid=new THREE.Mesh(new THREE.BoxGeometry(lidW,lidT,lidD),[lidOM,lidOM,lidOM,lidIM,lidOM,lidOM]);
lid.position.set(0,0,lidD/2);lid.castShadow=true;lid.receiveShadow=true;lidPivot.add(lid);
var rimMat=new THREE.MeshStandardMaterial({color:0x8ab8d0,roughness:.48});
[[lidW,.18,.08,0,-.09+lidT/2,lidD+.02],[.08,.18,lidD+.08,-lidW/2-.02,-.09+lidT/2,lidD/2],[.08,.18,lidD+.08,lidW/2+.02,-.09+lidT/2,lidD/2],[lidW+.04,.18,.08,0,-.09+lidT/2,-.02]].forEach(function(a){var m=new THREE.Mesh(new THREE.BoxGeometry(a[0],a[1],a[2]),rimMat);m.position.set(a[3],a[4],a[5]);m.castShadow=true;lidPivot.add(m);});

/* ═══ POP-UP CARD (rises as the lid opens) ═══ */
// Hinged at the BACK RIM so the whole card stands above the box — clear of the inner dividers & cakes
var cardPivot=new THREE.Group();cardPivot.position.set(0,BH/2-.06,-BD/2+.07);boxGrp.add(cardPivot);
var cardW=1.7,cardH=1.95;
var cardFront=new THREE.MeshStandardMaterial({map:cardTex(),roughness:.7});
var cardEdge=new THREE.MeshStandardMaterial({color:0xeadfc6,roughness:.85});
var cardMesh=new THREE.Mesh(new THREE.BoxGeometry(cardW,cardH,.04),[cardEdge,cardEdge,cardEdge,cardEdge,cardFront,cardEdge]);
cardMesh.position.set(0,cardH/2,0);cardMesh.castShadow=true;cardPivot.add(cardMesh);
cardPivot.rotation.x=Math.PI/2; // start folded flat (hidden under the closed lid)

/* ═══ BOX / CARD CUSTOMIZATION HOOKS (called from the UI) ═══ */
function setBoxColor(hex){boxColorHex=hex;boxMat.color.set(hex);rimMat.color.set(hex);}
function setLidColor(hex){lidColorHex=hex;lidOM.color.set(hex);}
function rebuildCard(){if(cardFront){cardFront.map=cardTex();cardFront.needsUpdate=true;}}
function rebuildLid(){if(lidIM){lidIM.map=lidTex();lidIM.needsUpdate=true;}}
function setLidBg(hex){lidData.bg=hex;rebuildLid();}
function uploadLidPhoto(inp){
  var f=inp.files&&inp.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var M=900,sc=Math.min(1,M/Math.max(img.width,img.height));
      var cw=Math.max(1,Math.round(img.width*sc)),ch=Math.max(1,Math.round(img.height*sc));
      var cv=document.createElement('canvas');cv.width=cw;cv.height=ch;cv.getContext('2d').drawImage(img,0,0,cw,ch);
      var durl;try{durl=cv.toDataURL('image/jpeg',0.85);}catch(e){durl=ev.target.result;}
      var fin=new Image();
      fin.onload=function(){lidData.photo=fin;lidData.photoSrc=durl;rebuildLid();
        var s=document.getElementById('lid-photo-status');if(s)s.textContent='✓ Photo set. Tap to replace.';
        var r=document.getElementById('lid-photo-remove');if(r)r.style.display='block';};
      fin.src=durl;
    };
    img.src=ev.target.result;
  };
  rd.readAsDataURL(f);inp.value='';
}
function removeLidPhoto(){lidData.photo=null;lidData.photoSrc=null;rebuildLid();
  var s=document.getElementById('lid-photo-status');if(s)s.textContent='No photo — celestial silhouette shown.';
  var r=document.getElementById('lid-photo-remove');if(r)r.style.display='none';}
window.setBoxColor=setBoxColor;window.setLidColor=setLidColor;window.rebuildCard=rebuildCard;window.rebuildLid=rebuildLid;
window.setLidBg=setLidBg;window.uploadLidPhoto=uploadLidPhoto;window.removeLidPhoto=removeLidPhoto;

/* ═══ DECORATION PREVIEW (mini renderer shown in the Decor panel) ═══ */
var pvR,pvScene,pvCam,pvGroup;
function decMat(type,col){
  if(type==='candle'||!col)return null;
  var lc=col.toLowerCase();
  var metal=(type==='moon'&&lc==='#c2cdd8')||(type==='starflat'&&lc==='#c9a84c');
  return new THREE.MeshStandardMaterial({color:new THREE.Color(col),roughness:metal?.24:.62,metalness:metal?.72:.08});
}
function initPreview(){
  var cv=document.getElementById('dec-preview');if(!cv)return false;
  pvR=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
  pvR.setPixelRatio(Math.min(devicePixelRatio,2));pvR.setSize(cv.width,cv.height,false);
  pvScene=new THREE.Scene();
  pvCam=new THREE.PerspectiveCamera(40,1,.05,10);pvCam.position.set(0,.36,.6);pvCam.lookAt(0,.05,0);
  pvScene.add(new THREE.AmbientLight(0xffffff,.95));
  var l=new THREE.DirectionalLight(0xfff6e8,.9);l.position.set(1.2,2,1.5);pvScene.add(l);
  pvGroup=new THREE.Group();pvScene.add(pvGroup);
  return true;
}
function updatePreview(){
  if(!pvR&&!initPreview())return;
  while(pvGroup.children.length)pvGroup.remove(pvGroup.children[0]);
  var type=selDec;
  if(type==='whipcream'){
    mk3Dwhip(pvGroup,[{x:-.16,z:0},{x:0,z:0},{x:.16,z:0}],decorScale,
      new THREE.MeshStandardMaterial({color:new THREE.Color(decorColor||'#fbf6ec'),roughness:.86,metalness:.02}));
  }else if(type&&type!=='custom'&&type!=='delete'&&DECOR_FN[type]){
    DECOR_FN[type](pvGroup,0,0,0,decorScale,decMat(type,decorColor),decorRot,'dome',null);
  }
  pvR.render(pvScene,pvCam);
}
window.updatePreview=updatePreview;

/* ═══ SCATTERED CHARMS ═══ */
[[-3.4,-2.1,.13],[3.1,-1.7,.11],[-2.7,2.4,.1],[3.4,2.1,.12]].forEach(function(p){var pts=[];for(var i=0;i<10;i++){var a=i*Math.PI/5-Math.PI/2,r=i%2===0?p[2]:p[2]*.38;pts.push(new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r));}var m=new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts),{depth:.02,bevelEnabled:false}),goldMat);m.position.set(p[0],-BH/2-.02,p[1]);m.rotation.x=-Math.PI/2;scatterGrp.add(m);});
var sfV=[];for(var i=0;i<500;i++)sfV.push((Math.random()-.5)*55,(Math.random()-.5)*28+6,(Math.random()-.5)*55);
var sfGeo=new THREE.BufferGeometry();sfGeo.setAttribute('position',new THREE.Float32BufferAttribute(sfV,3));
var starField=new THREE.Points(sfGeo,new THREE.PointsMaterial({color:0xb8c8e8,size:.05,transparent:true,opacity:.55}));scene.add(starField);

/* ═══ DRAW MODAL ═══ */
var drawModalOpen=false,isDrawingOn=false,drawnPts=[],pendingDrawPos=null;
var drawMirror=false,drawSmooth=true;
var _dc=null,_dctx=null;

function toggleMirror(){drawMirror=!drawMirror;document.getElementById('draw-mirror-btn').classList.toggle('on',drawMirror);renderDrawCanvas();}
function toggleSmooth(){drawSmooth=!drawSmooth;document.getElementById('draw-smooth-btn').classList.toggle('on',drawSmooth);renderDrawCanvas();}

// Closed-curve Chaikin smoothing — rounds the hand-drawn polygon
function chaikin(pts,iter){
  for(var k=0;k<iter;k++){
    if(pts.length<3)break;
    var out=[];
    for(var i=0;i<pts.length;i++){
      var a=pts[i],b=pts[(i+1)%pts.length];
      out.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25]);
      out.push([a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]);
    }
    pts=out;
  }
  return pts;
}
// Build the final closed point list (mirror across vertical axis if enabled)
function finalShape(src){
  var pts=src||drawnPts;
  if(pts.length<2)return pts.slice();
  if(!drawMirror)return pts.slice();
  var W=_dc.width,out=pts.slice();
  for(var i=pts.length-1;i>=0;i--)out.push([W-pts[i][0],pts[i][1]]);
  return out;
}

function initDrawCanvas(){
  _dc=document.getElementById('draw-canvas');
  _dctx=_dc.getContext('2d');
  function map(cx,cy){var r=_dc.getBoundingClientRect();
    // map CSS px → canvas buffer px, clamped to bounds
    var x=(cx-r.left)/r.width*_dc.width, y=(cy-r.top)/r.height*_dc.height;
    return [Math.max(0,Math.min(_dc.width,x)),Math.max(0,Math.min(_dc.height,y))];}
  function getPos(e){return map(e.clientX,e.clientY);}
  function getTPos(e){return map(e.touches[0].clientX,e.touches[0].clientY);}
  function startDraw(px,py){isDrawingOn=true;drawnPts=[[px,py]];renderDrawCanvas();}
  function moveDraw(px,py){
    if(!isDrawingOn)return;
    var last=drawnPts[drawnPts.length-1];
    if(Math.hypot(px-last[0],py-last[1])>6){drawnPts.push([px,py]);renderDrawCanvas();}
  }
  function endDraw(){if(!isDrawingOn)return;isDrawingOn=false;if(drawnPts.length>2)renderDrawCanvas();}
  _dc.addEventListener('mousedown',function(e){e.preventDefault();var p=getPos(e);startDraw(p[0],p[1]);});
  // move/up on window so drawing continues smoothly and always ends even if released off-canvas
  window.addEventListener('mousemove',function(e){if(isDrawingOn){var p=getPos(e);moveDraw(p[0],p[1]);}});
  window.addEventListener('mouseup',function(){if(drawModalOpen)endDraw();});
  _dc.addEventListener('touchstart',function(e){e.preventDefault();var p=getTPos(e);startDraw(p[0],p[1]);},{passive:false});
  _dc.addEventListener('touchmove',function(e){e.preventDefault();var p=getTPos(e);moveDraw(p[0],p[1]);},{passive:false});
  window.addEventListener('touchend',function(){if(drawModalOpen)endDraw();});
}

function setDrawStatus(txt){var el=document.getElementById('draw-status');if(el)el.textContent=txt;}

function renderDrawCanvas(){
  if(!_dctx||!_dc)return;
  var W=_dc.width,H=_dc.height; // use attribute size (340×340)
  _dctx.fillStyle='#0a0e1c';_dctx.fillRect(0,0,W,H);
  // Grid lines
  _dctx.strokeStyle='rgba(201,168,76,0.07)';_dctx.lineWidth=1;
  for(var i=1;i<4;i++){
    _dctx.beginPath();_dctx.moveTo(W*i/4,0);_dctx.lineTo(W*i/4,H);_dctx.stroke();
    _dctx.beginPath();_dctx.moveTo(0,H*i/4);_dctx.lineTo(W,H*i/4);_dctx.stroke();
  }
  // Center crosshair (mirror axis highlighted when symmetry is on)
  _dctx.strokeStyle=drawMirror?'rgba(201,168,76,0.55)':'rgba(201,168,76,0.22)';
  _dctx.lineWidth=drawMirror?1.5:1;
  _dctx.beginPath();_dctx.moveTo(W/2,0);_dctx.lineTo(W/2,H);_dctx.stroke();
  _dctx.strokeStyle='rgba(201,168,76,0.22)';_dctx.lineWidth=1;
  _dctx.beginPath();_dctx.moveTo(0,H/2);_dctx.lineTo(W,H/2);_dctx.stroke();

  if(drawnPts.length<2){setDrawStatus(isDrawingOn?'Keep drawing…':'Draw a shape…');return;}

  var shape=finalShape();
  var col=decorColor||'#c9a84c';
  // Fill preview in the actual decoration color
  _dctx.beginPath();_dctx.moveTo(shape[0][0],shape[0][1]);
  for(var i=1;i<shape.length;i++)_dctx.lineTo(shape[i][0],shape[i][1]);
  _dctx.closePath();
  _dctx.globalAlpha=0.3;_dctx.fillStyle=col;_dctx.fill();_dctx.globalAlpha=1;
  // Outline
  _dctx.beginPath();_dctx.moveTo(shape[0][0],shape[0][1]);
  for(var i=1;i<shape.length;i++)_dctx.lineTo(shape[i][0],shape[i][1]);
  _dctx.closePath();_dctx.strokeStyle=col;_dctx.lineWidth=2.5;_dctx.lineJoin='round';_dctx.lineCap='round';_dctx.stroke();
  // Start dot on the raw stroke
  _dctx.beginPath();_dctx.arc(drawnPts[0][0],drawnPts[0][1],5,0,Math.PI*2);
  _dctx.fillStyle=col;_dctx.fill();

  setDrawStatus(drawnPts.length+' pts'+(drawMirror?' · mirrored':'')+(drawSmooth?' · smooth':''));
}

function clearDrawCanvas(){drawnPts=[];renderDrawCanvas();}

function openDrawModal(px,pz){
  drawModalOpen=true;isDrawingOn=false;pendingDrawPos={x:px,z:pz};drawnPts=[];
  document.getElementById('draw-overlay').style.display='flex';
  renderDrawCanvas();
}

function cancelDraw(){
  drawModalOpen=false;isDrawingOn=false;pendingDrawPos=null;
  document.getElementById('draw-overlay').style.display='none';
}

function simplifyPts(pts,tol){
  var r=[pts[0]];
  for(var i=1;i<pts.length;i++){var l=r[r.length-1];if(Math.hypot(pts[i][0]-l[0],pts[i][1]-l[1])>=tol)r.push(pts[i]);}
  return r.length>=3?r:pts;
}

function confirmDraw(){
  if(drawnPts.length<3||!pendingDrawPos){cancelDraw();return;}
  var shape=simplifyPts(finalShape(),4);
  if(drawSmooth)shape=chaikin(shape,2);
  var W=_dc.width,H=_dc.height,maxR=Math.max(W,H)/2;
  var norm=shape.map(function(p){return{x:(p[0]-W/2)/maxR,y:(p[1]-H/2)/maxR};});
  cakeData[cur].decorations.push({type:'custom',x:pendingDrawPos.x,z:pendingDrawPos.z,
    scale:decorScale,rot:decorRot,col:decorColor,customShape:'drawn',drawnPts:norm});
  buildCake(cur);
  cancelDraw();
}

/* ═══ RAYCASTER (click to place) ═══ */
var raycaster=new THREE.Raycaster();
var mouseVec=new THREE.Vector2();
// Clamp a point to the rounded-rectangle cake top (so it follows the real edge, incl. corners)
function clampRoundRect(x,z,inset){
  var hw=CW/2-inset,hd=CD/2-inset,r=Math.max(0.04,0.26-inset);
  var ccx=Math.max(-(hw-r),Math.min(hw-r,x)),ccz=Math.max(-(hd-r),Math.min(hd-r,z));
  var dx=x-ccx,dz=z-ccz,dd=Math.hypot(dx,dz);
  if(dd>r){x=ccx+dx/dd*r;z=ccz+dz/dd*r;}
  return [x,z];
}
function tryPlaceDecor(e){
  if(!soloMode||drawModalOpen)return;
  mouseVec.x=(e.clientX/innerWidth)*2-1;
  mouseVec.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(mouseVec,camera);
  var hits=raycaster.intersectObject(hitPlanes[cur]);
  if(hits.length>0){
    var pt=cakeGrps[cur].worldToLocal(hits[0].point.clone());
    var _c=clampRoundRect(pt.x,pt.z,.1);pt.x=_c[0];pt.z=_c[1];
    if(deleteMode){
      var decs=cakeData[cur].decorations;
      var best=-1,bestD=.15;
      for(var i=0;i<decs.length;i++){
        var dist;
        if(decs[i].type==='whipcream'&&decs[i].path){
          dist=Infinity;
          for(var j=0;j<decs[i].path.length;j++){var pd=Math.hypot(decs[i].path[j].x-pt.x,decs[i].path[j].z-pt.z);if(pd<dist)dist=pd;}
        }else{
          dist=Math.hypot(decs[i].x-pt.x,decs[i].z-pt.z);
        }
        if(dist<bestD){bestD=dist;best=i;}
      }
      if(best>=0){decs.splice(best,1);buildCake(cur);}
    }else if(selDec==='custom'){
      openDrawModal(pt.x,pt.z);
    }else{
      cakeData[cur].decorations.push({type:selDec,x:pt.x,z:pt.z,scale:decorScale,rot:decorRot,col:decorColor});
      buildCake(cur);
    }
  }
}

/* ═══ SOLO VIEW ═══ */
function enterSolo(){soloMode=true;var _sb=document.getElementById('solo-back');if(_sb)_sb.style.display='block';document.getElementById('mode-badge').style.display='block';document.getElementById('hint').textContent='Drag: orbit · Shift+drag: pan · Click: place decoration';boxGrp.visible=false;scatterGrp.visible=false;for(var i=0;i<4;i++)cakeGrps[i].visible=(i===cur);soloAz=0;soloEl=.5;soloDist=3;panX=0;panY=0;}
function exitSolo(){soloMode=false;deleteMode=false;var _bd=document.getElementById('btn-del');if(_bd)_bd.classList.remove('active','on');var _sb=document.getElementById('solo-back');if(_sb)_sb.style.display='none';document.getElementById('mode-badge').style.display='none';document.getElementById('hint').textContent='Drag to rotate \xb7 Scroll to zoom';boxGrp.visible=true;scatterGrp.visible=true;for(var i=0;i<4;i++)cakeGrps[i].visible=true;}

/* ═══ CONTROLS ═══ */
var lidAng=0,tLid=0,isDrag=false,shiftHeld=false,dragDist=0;
var prevM={x:0,y:0},startM={x:0,y:0};
var rotY=.3,rotX=.25,tRotY=.3,tRotX=.25,camDist=10;
var soloAz=0,soloEl=.5,soloDist=3,panX=0,panY=0;
function openLid(){tLid=-Math.PI*.72;}function closeLid(){tLid=0;}
function toggleSpin(){spinning=!spinning;document.getElementById('btn-spin').classList.toggle('active',spinning);document.getElementById('btn-spin').textContent=spinning?'Stop':'Spin';}
function resetCam(){if(soloMode){soloAz=0;soloEl=.5;soloDist=3;panX=0;panY=0;}else{tRotY=.3;tRotX=.25;camDist=10;}}

/* ── Whip-cream piping ── */
var piping=false,pipePath=[],_pipeMat=null;
function rayLocal(x,y){
  mouseVec.x=(x/innerWidth)*2-1;mouseVec.y=-(y/innerHeight)*2+1;
  raycaster.setFromCamera(mouseVec,camera);
  var hits=raycaster.intersectObject(hitPlanes[cur]);
  if(!hits.length)return null;
  var pt=cakeGrps[cur].worldToLocal(hits[0].point.clone());
  var _c=clampRoundRect(pt.x,pt.z,.045);pt.x=_c[0];pt.z=_c[1]; // small inset → can pipe along the rim
  return pt;
}
function addPipeBlob(lx,lz){
  var R=.072*decorScale;
  var b=new THREE.Mesh(new THREE.SphereGeometry(R,10,8),_pipeMat);
  b.scale.y=.86;b.position.set(lx,BORDER_Y+R*.5,lz);b.castShadow=true;
  cakeGrps[cur].add(b);
}

function onDown(x,y,shift){
  // Whip-cream tool: dragging on the cake pipes a cream trail instead of orbiting
  if(soloMode&&selDec==='whipcream'&&!deleteMode&&!shift){
    var p=rayLocal(x,y);
    if(p){piping=true;pipePath=[{x:p.x,z:p.z}];
      _pipeMat=new THREE.MeshStandardMaterial({color:new THREE.Color(decorColor||'#fbf6ec'),roughness:.86,metalness:.02});
      addPipeBlob(p.x,p.z);return;}
  }
  isDrag=true;shiftHeld=shift;prevM={x:x,y:y};startM={x:x,y:y};dragDist=0;
}
function onMove(x,y){
  if(piping){
    var p=rayLocal(x,y);
    if(p){var last=pipePath[pipePath.length-1];if(Math.hypot(p.x-last.x,p.z-last.z)>.022){pipePath.push({x:p.x,z:p.z});addPipeBlob(p.x,p.z);}}
    return;
  }
  if(!isDrag)return;var dx=(x-prevM.x)*.005,dy=(y-prevM.y)*.005;dragDist+=Math.abs(x-prevM.x)+Math.abs(y-prevM.y);
  if(soloMode){if(shiftHeld){panX+=dx*soloDist*.3;panY-=dy*soloDist*.3;}else{soloAz-=dx;soloEl+=dy;soloEl=Math.max(-.4,Math.min(1.45,soloEl));}}
  else{tRotY+=dx;tRotX+=dy;tRotX=Math.max(-.55,Math.min(.85,tRotX));}prevM={x:x,y:y};}
function onUp(e){
  if(piping){
    piping=false;
    if(pipePath.length>=1){cakeData[cur].decorations.push({type:'whipcream',path:pipePath.slice(),scale:decorScale,col:decorColor});}
    buildCake(cur);pipePath=[];return;
  }
  if(isDrag&&soloMode&&dragDist<8){tryPlaceDecor(e);}isDrag=false;}

renderer.domElement.addEventListener('mousedown',function(e){onDown(e.clientX,e.clientY,e.shiftKey);});
window.addEventListener('mouseup',function(e){onUp(e);});
renderer.domElement.addEventListener('mousemove',function(e){onMove(e.clientX,e.clientY);});
renderer.domElement.addEventListener('wheel',function(e){if(soloMode)soloDist=Math.max(1.2,Math.min(8,soloDist+e.deltaY*.006));else camDist=Math.max(4,Math.min(20,camDist+e.deltaY*.012));},{passive:true});
/* Touch: 1 finger = orbit/place/pipe · 2 fingers = pinch-zoom + pan */
var pinchD=0,pinchMid=null;
function _tDist(e){var a=e.touches[0],b=e.touches[1];return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}
function _tMid(e){var a=e.touches[0],b=e.touches[1];return {x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};}
renderer.domElement.addEventListener('touchstart',function(e){
  if(e.touches.length===2){isDrag=false;piping=false;pinchD=_tDist(e);pinchMid=_tMid(e);}
  else if(e.touches.length===1){onDown(e.touches[0].clientX,e.touches[0].clientY,false);}
},{passive:false});
renderer.domElement.addEventListener('touchmove',function(e){
  if(e.touches.length===2){
    e.preventDefault();
    var d=_tDist(e),mid=_tMid(e);
    if(pinchD){var f=(pinchD-d)*.012;
      if(soloMode)soloDist=Math.max(1.2,Math.min(8,soloDist+f));
      else camDist=Math.max(4,Math.min(20,camDist+f));}
    if(pinchMid&&soloMode){panX+=-(mid.x-pinchMid.x)*soloDist*.0016;panY+=(mid.y-pinchMid.y)*soloDist*.0016;}
    pinchD=d;pinchMid=mid;
  }else if(e.touches.length===1){onMove(e.touches[0].clientX,e.touches[0].clientY);}
},{passive:false});
window.addEventListener('touchend',function(e){pinchD=0;pinchMid=null;onUp(e.changedTouches?e.changedTouches[0]:e);});
window.addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('dblclick',resetCam);

/* ═══ ANIMATE ═══ */
var t=0,centerY=(BODY_CY+BODY_TOP)/2;
function animate(){
  requestAnimationFrame(animate);t+=.016;
  lidAng+=(tLid-lidAng)*.042;lidPivot.rotation.x=lidAng;
  // Card pops up once the lid is past ~25% open
  var openF=Math.min(1,Math.max(0,lidAng/(-Math.PI*.72)));
  var rise=Math.min(1,Math.max(0,(openF-.25)/.7));
  cardPivot.rotation.x=(Math.PI/2)*(1-rise);
  if(soloMode){
    if(spinning)soloAz+=.006;
    world.rotation.x=0;world.rotation.y=0;
    var cp=CPOS[cur];
    camera.position.lerp(new THREE.Vector3(cp[0]+soloDist*Math.sin(soloAz)*Math.cos(soloEl)+panX,centerY+soloDist*Math.sin(soloEl)+panY,cp[1]+soloDist*Math.cos(soloAz)*Math.cos(soloEl)),.12);
    camera.lookAt(cp[0]+panX,centerY+panY,cp[1]);
  }else{
    if(spinning)tRotY+=.003;
    rotY+=(tRotY-rotY)*.08;rotX+=(tRotX-rotX)*.08;
    world.rotation.y=rotY;world.rotation.x=rotX;
    camera.position.lerp(new THREE.Vector3(0,3.2,camDist),.055);camera.lookAt(0,0,0);
  }
  glowL.intensity=.75+Math.sin(t*.8)*.22;starField.material.opacity=.38+Math.sin(t*.5)*.16;
  cakeGrps.forEach(function(g){g.children.forEach(function(c){if(c.isPointLight)c.intensity=.25+Math.random()*.15;});});
  renderer.render(scene,camera);
}
/* ═══ ORDER SAVE / LOAD ═══ */
// Serialize all 4 cakes to plain JSON (photos kept as data-URLs)
function serializeDesign(){
  return {
    box:{color:boxColorHex,lid:lidColorHex},
    card:{l1:cardData.l1,l2:cardData.l2,sub:cardData.sub},
    lid:{title:lidData.title,msg:lidData.msg,sub:lidData.sub,bg:lidData.bg,photoSrc:lidData.photoSrc||null},
    cakes:cakeData.map(function(d){
      return {color:d.color,finish:d.finish,flavor:d.flavor,top:d.top,
        t1:d.t1,t2:d.t2,t3:d.t3,
        decorations:d.decorations||[],
        photoSrc:d.photoSrc||null};
    })};
}
// Only accept inline image data-URLs from saved orders (block remote URLs / non-image
// data: payloads — orders are public, so photoSrc is untrusted when reopened).
function safePhoto(src){return (typeof src==='string'&&/^data:image\/(png|jpe?g|gif|webp);/i.test(src))?src:null;}
// Restore a saved design into the 4 cakes and rebuild
function loadDesign(design){
  if(!design||!design.cakes)return;
  // box + card customization
  if(design.box){setBoxColor(design.box.color||boxColorHex);setLidColor(design.box.lid||lidColorHex);}
  if(design.card){cardData.l1=design.card.l1||'';cardData.l2=design.card.l2||'';cardData.sub=design.card.sub||'';rebuildCard();}
  if(design.lid){lidData.title=design.lid.title||'';lidData.msg=design.lid.msg||'';lidData.sub=design.lid.sub||'';
    lidData.bg=design.lid.bg||lidData.bg;lidData.photoSrc=safePhoto(design.lid.photoSrc);lidData.photo=null;
    if(lidData.photoSrc){var lim=new Image();lim.onload=function(){lidData.photo=lim;rebuildLid();};lim.src=lidData.photoSrc;}
    rebuildLid();}
  design.cakes.forEach(function(s,i){
    if(i>3)return;var d=cakeData[i];
    d.color=s.color||d.color;d.finish=s.finish||d.finish;d.flavor=s.flavor||d.flavor;
    d.top=s.top||d.top;d.t1=s.t1||'';d.t2=s.t2||'';d.t3=s.t3||'';
    d.decorations=s.decorations||[];
    d.photoSrc=safePhoto(s.photoSrc);d.photo=null;
    if(d.photoSrc){(function(idx,src){var im=new Image();im.onload=function(){cakeData[idx].photo=im;buildCake(idx);};im.src=src;})(i,d.photoSrc);}
    buildCake(i);
  });
  loadUI();
  // reflect box/card into the panel inputs if present
  var q=function(id){return document.getElementById(id);};
  if(q('boxpick')&&design.box)q('boxpick').value=design.box.color||boxColorHex;
  if(q('lidpick')&&design.box)q('lidpick').value=design.box.lid||lidColorHex;
  if(q('card-l1')&&design.card){q('card-l1').value=cardData.l1;q('card-l2').value=cardData.l2;q('card-sub').value=cardData.sub;}
  if(q('lid-title')&&design.lid){q('lid-title').value=lidData.title;q('lid-msg').value=lidData.msg;q('lid-sub').value=lidData.sub;}
  if(q('lidbg-pick')&&design.lid)q('lidbg-pick').value=lidData.bg;
  if(q('lid-photo-remove'))q('lid-photo-remove').style.display=lidData.photoSrc?'block':'none';
  if(q('lid-photo-status'))q('lid-photo-status').textContent=lidData.photoSrc?'✓ Photo set. Tap to replace.':'No photo — celestial silhouette shown.';
}

function openOrder(){
  document.getElementById('order-form').style.display='block';
  document.getElementById('order-done').style.display='none';
  document.getElementById('ord-err').textContent='';
  document.getElementById('order-overlay').style.display='flex';
}
function closeOrder(){document.getElementById('order-overlay').style.display='none';}
function submitOrder(){
  var payload={customer:{
      name:document.getElementById('ord-name').value,
      phone:document.getElementById('ord-phone').value,
      pickup:document.getElementById('ord-pickup').value,
      notes:document.getElementById('ord-notes').value
    },design:serializeDesign()};
  document.getElementById('ord-err').textContent='Submitting…';
  fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.orderId){document.getElementById('ord-id').textContent=d.orderId;
        document.getElementById('order-form').style.display='none';
        document.getElementById('order-done').style.display='block';}
      else{document.getElementById('ord-err').textContent=d.error||'Failed';}
    })
    .catch(function(){document.getElementById('ord-err').textContent='Server unreachable. Run the backend, then open via http://localhost:3000';});
}
// If opened as /?order=ID (e.g. from the admin dashboard), load that design
(function(){
  var id=new URLSearchParams(location.search).get('order');
  if(!id)return;
  fetch('/api/order?id='+encodeURIComponent(id)).then(function(r){return r.json();}).then(function(o){
    if(o&&o.design){loadDesign(o.design);
      var el=document.getElementById('order-loaded');el.style.display='block';
      el.textContent='✓ Loaded order '+o.orderId+(o.customer&&o.customer.name?' — '+o.customer.name:'');}
  }).catch(function(){});
})();

// (legacy sidebar removed — premium UI shell handles layout via ui.js)
setTimeout(function(){tLid=-Math.PI*.72;},700);loadUI();animate();initDrawCanvas();
