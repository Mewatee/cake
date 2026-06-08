/* ════════════════════════════════════════════════════════════
   CÉLESTE — UI controller
   Bridges the premium shell (index.html) to the 3D engine (app.js).
   app.js has already loaded, so all its globals are available:
     cur, cakeData, FLAVORS, flavorById, spinning, deleteMode,
     loadUI(), apply(), buildCake(), enterSolo(), exitSolo(),
     openLid(), closeLid(), resetCam(), openOrder() …
   ════════════════════════════════════════════════════════════ */
(function(){

  /* ── topping catalogue (elegant glyphs, no emoji) ── */
  var TOPPINGS=[
    {id:'tarot_star',    g:'✦', n:'The Star'},
    {id:'tarot_moon',    g:'☾', n:'The Moon'},
    {id:'constellation', g:'✧', n:'Constellation'},
    {id:'floral',        g:'❀', n:'Floral'},
    {id:'heart',         g:'♡', n:'Heart'},
    {id:'photo',         g:'▣', n:'Photo Print'},
    {id:'text',          g:'✍', n:'Custom Text'},
    {id:'plain',         g:'◦', n:'Plain'}
  ];

  function $(id){return document.getElementById(id);}

  /* ════════════════════ build option cards ════════════════════ */
  function buildFlavorCards(){
    var wrap=$('flavor-cards');if(!wrap)return;
    wrap.innerHTML='';
    FLAVORS.forEach(function(f){
      var b=document.createElement('button');
      b.className='optcard';b.dataset.id=f.id;
      b.innerHTML='<span class="g sw" style="background:'+f.s+'"></span>'+
                  '<span class="nm"><b>'+f.n+'</b></span>';
      b.onclick=function(){selectFlavor(f.id);};
      wrap.appendChild(b);
    });
  }
  function buildToppingCards(){
    var wrap=$('topping-cards');if(!wrap)return;
    wrap.innerHTML='';
    TOPPINGS.forEach(function(t){
      var b=document.createElement('button');
      b.className='optcard';b.dataset.id=t.id;
      b.innerHTML='<span class="g">'+t.g+'</span>'+
                  '<span class="nm"><b>'+t.n+'</b></span>';
      b.onclick=function(){selectTopping(t.id);};
      wrap.appendChild(b);
    });
  }

  /* ════════════════════ reflect engine state → UI ════════════════════ */
  function syncControls(){
    var d=cakeData[cur];
    // finish segmented
    document.querySelectorAll('#finish-seg button').forEach(function(b){
      b.classList.toggle('on',b.dataset.f===d.finish);
    });
    // flavour cards
    document.querySelectorAll('#flavor-cards .optcard').forEach(function(c){
      c.classList.toggle('on',c.dataset.id===(d.flavor||'vanilla'));
    });
    // topping cards
    document.querySelectorAll('#topping-cards .optcard').forEach(function(c){
      c.classList.toggle('on',c.dataset.id===d.top);
    });
  }

  function syncTray(){
    document.querySelectorAll('#tray .ctile').forEach(function(tile){
      var i=+tile.dataset.i,d=cakeData[i];if(!d)return;
      var dot=tile.querySelector('.dot');if(dot)dot.style.background=d.color;
      var fl=tile.querySelector('.flav');
      if(fl&&typeof flavorById==='function')fl.textContent=flavorById(d.flavor||'vanilla').n;
    });
  }
  window.syncTray=syncTray;

  /* ════════════════════ navigation / view ════════════════════ */
  window.dismissOnboard=function(){
    var o=$('onboard');if(o)o.classList.add('hide');
  };

  function focusCake(i){
    cur=i;
    loadUI();          // sets hidden bridge selects, label, swatch .on, photo + flavour note
    enterSolo();       // soloMode on, frame just this cake
    syncControls();
  }

  window.openEditor=function(i){
    focusCake(i);
    document.body.classList.add('editing');
    setEditSection('frosting');
    var sc=document.querySelector('.ed-scroll');if(sc)sc.scrollTop=0;
  };
  window.closeEditor=function(){
    document.body.classList.remove('editing');
    exitSolo();
    syncTray();
  };
  window.cycleCake=function(dir){
    focusCake((cur+dir+4)%4);
    var sc=document.querySelector('.ed-scroll');if(sc)sc.scrollTop=0;
  };

  window.setEditSection=function(s){
    document.querySelectorAll('.ed-nav button').forEach(function(b){
      b.classList.toggle('on',b.dataset.sec===s);
    });
    document.querySelectorAll('.ed-sec').forEach(function(p){
      p.classList.toggle('on',p.dataset.sec===s);
    });
  };

  /* ── lid toggle (engine tracks tLid) ── */
  window.toggleLid=function(){
    if(window.tLid===0){openLid();}else{closeLid();}
    var b=$('lid-btn');if(b)b.classList.toggle('on',window.tLid!==0);
  };

  /* ── icon-safe overrides of app.js handlers ── */
  window.toggleSpin=function(){
    spinning=!spinning;
    var b=$('btn-spin');if(b)b.classList.toggle('on',spinning);
  };
  window.toggleDelete=function(){
    deleteMode=!deleteMode;
    var b=$('btn-del');if(b)b.classList.toggle('on',deleteMode);
    var mb=$('mode-badge');
    if(mb)mb.textContent=deleteMode?'DELETE MODE — Tap a decoration to remove'
                                   :'DECORATE MODE — Tap the cake to place';
  };

  /* ════════════════════ option selection ════════════════════ */
  window.selectFinish=function(f){
    $('sel-finish').value=f;apply();syncControls();
  };
  function selectFlavor(id){
    $('sel-flavor').value=id;apply();syncControls();
  }
  function selectTopping(id){
    $('sel-top').value=id;apply();syncControls();
  }
  window.selectFlavor=selectFlavor;
  window.selectTopping=selectTopping;

  /* ════════════════════ init ════════════════════ */
  buildFlavorCards();
  buildToppingCards();

  // Keep the tray dots/labels live with every rebuild
  if(typeof window.buildCake==='function'){
    var _origBuild=window.buildCake;
    window.buildCake=function(i){_origBuild(i);syncTray();};
  }

  syncControls();
  syncTray();

})();
