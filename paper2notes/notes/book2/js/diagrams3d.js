(function (global) {
  "use strict";
  var T = global.THREE;
  if (!T) return;
  var ink = 0x174f78, accent = 0xc34832, green = 0x18846e, pale = 0xabb8c2, gold = 0xc39422;
  function boot(canvas) {
    var host = canvas.closest('[data-scene]');
    var name = host.getAttribute('data-scene');
    var scene = new T.Scene(); scene.background = new T.Color(0xffffff);
    var camera = new T.OrthographicCamera(-5,5,3,-3,.1,30);
    camera.position.set(0,0,12); camera.lookAt(0,0,0);
    var renderer = new T.WebGLRenderer({canvas:canvas,antialias:true});
    renderer.setPixelRatio(Math.min(global.devicePixelRatio||1,2));
    scene.add(new T.AmbientLight(0xffffff,1));
    var updateHud = null;
    function resize() { var w=canvas.clientWidth||640,h=canvas.clientHeight||360; renderer.setSize(w,h,false); var a=w/h; camera.left=-3*a; camera.right=3*a; camera.updateProjectionMatrix(); if (updateHud) updateHud(); renderer.render(scene,camera); }
    resize(); global.addEventListener('resize',resize);
    function line(points,color,width,parent) {
      if (width && typeof width === 'object' && width.isObject3D) { parent = width; width = undefined; }
      var g=new T.BufferGeometry().setFromPoints(points.map(function(p){return new T.Vector3(p[0],p[1],0);})); var o=new T.Line(g,new T.LineBasicMaterial({color:color||ink})); (parent||scene).add(o); return o;
    }
    function arrow(x,y,dx,dy,color,parent) { var len=Math.hypot(dx,dy); if(!len)return; var h=new T.ArrowHelper(new T.Vector3(dx/len,dy/len,0),new T.Vector3(x,y,0),len,color||ink,.22,.13); (parent||scene).add(h); return h; }
    function ball(x,y,r,color,parent) { if (r && typeof r === 'object' && r.isObject3D) { parent=r; r=undefined; } var m=new T.Mesh(new T.SphereGeometry(r||.17,18,12),new T.MeshBasicMaterial({color:color||accent})); m.position.set(x,y,0);(parent||scene).add(m);return m; }
    function box(x,y,w,h,color,parent) { if (color && typeof color === 'object' && color.isObject3D) { parent=color; color=undefined; } var m=new T.Mesh(new T.BoxGeometry(w,h,.15),new T.MeshBasicMaterial({color:color||ink}));m.position.set(x,y,0);(parent||scene).add(m);return m; }
    function curve(f,n,color,parent) { var pts=[];for(var i=0;i<=n;i++)pts.push(f(i/n));return line(pts,color,undefined,parent); }
    function axis() { arrow(-3.5,-2.1,7,0,pale);arrow(-3.5,-2.1,0,4.2,pale); }
    function project(camera, canvas, vec) {
      var v = vec.clone().project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * (canvas.clientWidth || canvas.width) + (canvas.offsetLeft || 0),
        y: (-v.y * 0.5 + 0.5) * (canvas.clientHeight || canvas.height) + (canvas.offsetTop || 0)
      };
    }
    function placeHud(el, canvas, camera, vec) {
      if (!el) return;
      var p = project(camera, canvas, vec);
      el.style.left = p.x + "px";
      el.style.top = p.y + "px";
    }
    var moving=null, travel=null, animate=null;
    if(name==='peter'){
      curve(function(u){var a=Math.PI*(1-u);return [2*Math.cos(a),1.4*Math.sin(a)];},50,accent);
      curve(function(u){var a=-Math.PI*u;return [2*Math.cos(a),1.4*Math.sin(a)];},50,green);
      arrow(-.45,1.4,.9,0,accent);arrow(.45,-1.4,-.9,0,green);
      ball(-2,0,.14,ink);ball(2,0,.14,ink);
    } else if(name==='shirley'){
      var a=[-2.5,-1.7], b=[a[0]+2.4,a[1]];
      arrow(a[0],a[1],2.4,0,ink);arrow(b[0],b[1],0,2.4,green);arrow(a[0],a[1],2.4,2.4,accent);
    } else if(name==='g'||name==='ticker'){
      line([[-2.8,2.2],[2.8,2.2]],ink);
      for(var d=0;d<7;d++)ball(name==='ticker'?-2.5+d*d*.14:0,1.8-d*.55,.11,accent);
      arrow(1.4,1.6,0,-2.8,green);
    } else if(name==='bung'||name==='hole'){
      curve(function(u){return [-1.2+1.65*Math.cos(2*Math.PI*u),.55+1.1*Math.sin(2*Math.PI*u)];},80,ink);
      ball(-1.2,.55,.17,green);moving=ball(.45,.55,.22,accent);
      travel=function(u){moving.position.set(-1.2+1.65*Math.cos(u*2*Math.PI),.55+1.1*Math.sin(u*2*Math.PI),0);};
      line([[.45,.55],[2.4,.55],[2.4,-1.7]],pale);ball(2.4,-1.7,.28,gold);arrow(2.4,-1.7,0,-.6,accent);
    } else if(name==='safety'){
      axis();curve(function(u){return [-3+6*u,-1.8+3.4*Math.exp(-Math.pow((u-.3)/.11,2))];},70,accent);
      curve(function(u){return [-3+6*u,-1.8+1.8*Math.exp(-Math.pow((u-.55)/.25,2))];},70,green);
    } else if(name==='pumped'){
      box(-2,1.5,2,.35,ink);box(2,-1.6,2,.35,ink);line([[-1,1.5],[.4,1.5],[.4,-1.6],[1,-1.6]],ink);arrow(.4,.8,0,-1.5,accent);ball(.4,-1.1,.42,gold);
    } else if(name==='roller'){
      curve(function(u){return [-3+6*u,-1.7+3.3*Math.pow(2*u-1,2)];},80,ink);moving=ball(-3,1.6,.23,accent);travel=function(u){moving.position.set(-3+6*u,-1.7+3.3*Math.pow(2*u-1,2),0);};
    } else if(name==='plumb'){
      // --- enhanced plumb: square lamina + crossing diagonals + animated plumb line group ---
      var plumbSquare = line([[-1.8,1.4],[1.8,1.4],[1.8,-1.4],[-1.8,-1.4],[-1.8,1.4]],ink);
      // diagonals (static) showing C.G. intersection
      line([[-1.8,1.4],[1.8,-1.4]],accent);line([[1.8,1.4],[-1.8,-1.4]],green);
      var cgBall = ball(0,0,.14,gold);
      // plumb bob group hanging from top edge centre
      var plumbGroup = new T.Group();
      plumbGroup.position.set(0,1.4,0);
      scene.add(plumbGroup);
      // string from suspension to bob
      var strGeom = new T.BufferGeometry().setFromPoints([new T.Vector3(0,0,0), new T.Vector3(0,-2.4,0)]);
      var strLine = new T.Line(strGeom, new T.LineBasicMaterial({color:pale}));
      plumbGroup.add(strLine);
      var bob = new T.Mesh(new T.SphereGeometry(0.18,16,10), new T.MeshBasicMaterial({color:gold}));
      bob.position.set(0,-2.6,0);
      plumbGroup.add(bob);
      // huds
      var hudPlumb = host.querySelector('[data-hud="plumb"]');
      var hudCG = host.querySelector('[data-hud="CG"]');
      // world positions for huds: plumb label near string top, CG near centre
      updateHud = function() {
        placeHud(hudPlumb, canvas, camera, new T.Vector3(0.55,0.75,0));
        placeHud(hudCG, canvas, camera, new T.Vector3(0.42,0.28,0));
      };
      updateHud();
      animate = function(t) {
        // gentle swing ±6° with slow damping, illustrating plumb line settling
        var ang = Math.sin(t*1.05) * 0.11 * (0.72 + 0.28 * Math.cos(t*0.18));
        plumbGroup.rotation.z = ang;
        updateHud();
      };
    } else if(name==='board'){
      // --- enhanced board: square pivoted at B, CG at centre, animated subtle balance ---
      // pivot marker static at B (-1.7,-1.7)
      var pivotMarker = ball(-1.7,-1.7,.16,gold);
      var boardGroup = new T.Group();
      boardGroup.position.set(-1.7,-1.7,0);
      scene.add(boardGroup);
      // square in local coords (0,0) is B, (3.4,3.4) is opposite corner C
      line([[0,0],[3.4,0],[3.4,3.4],[0,3.4],[0,0]], ink, null, boardGroup);
      // C.G. at centre of square (1.7,1.7) local -> world (0,0)
      var cg = ball(1.7,1.7,.12,gold, boardGroup);
      // dimension tick for side 0.3 m (visual scale: 3.4 units = 0.3 m, so just annotate)
      // forces: one at top-right corner (3.4,3.4) downward, one at bottom-right (3.4,0) upward -> couple/moment balance
      var fTop = arrow(3.4,3.4,0,-1.35,accent, boardGroup);
      var fBot = arrow(3.4,0,0,1.35,green, boardGroup);
      // side label helper line (small)
      var hudB = host.querySelector('[data-hud="B"]');
      var hudCGboard = host.querySelector('[data-hud="CG"]');
      updateHud = function() {
        // pivot B world stays at (-1.7,-1.7), offset slightly for label
        placeHud(hudB, canvas, camera, new T.Vector3(-1.7, -1.95, 0));
        // CG world follows boardGroup rotation: compute world position of CG
        var cgWorld = new T.Vector3(1.7,1.7,0);
        cgWorld.applyMatrix4(boardGroup.matrixWorld);
        // but for orthographic, apply group transform manually: boardGroup position + rotated local
        // simpler: use boardGroup.localToWorld
        var cw = cg.clone ? cg.position.clone() : new T.Vector3(1.7,1.7,0);
        // cg is child of boardGroup, so its world matrix includes group rotation
        cg.updateMatrixWorld();
        var worldPos = new T.Vector3();
        cg.getWorldPosition(worldPos);
        // offset label slightly above CG
        worldPos.y += 0.35;
        worldPos.x += 0.18;
        placeHud(hudCGboard, canvas, camera, worldPos);
      };
      updateHud();
      animate = function(t) {
        // subtle oscillation ±1.5° to suggest equilibrium check (sum M=0, not rotating)
        var ang = Math.sin(t*0.48) * 0.028;
        boardGroup.rotation.z = ang;
        // also pulse arrow opacity via scale (simulate force magnitude variation) — use arrow scale y
        var pulse = 1 + 0.06 * Math.sin(t*1.6);
        if (fTop) fTop.scale.set(1, pulse, 1);
        if (fBot) fBot.scale.set(1, pulse, 1);
        updateHud();
      };
    } else if(name==='power'){
      box(-1.5,-.5,1,.6,green);arrow(-1,-.5,2.6,0,ink);arrow(-1,0,1.6,0,accent);line([[-3,-1.4],[3,-1.4]],pale);
    } else if(name==='energy'){
      curve(function(u){return [-3+6*u,-1.7+3*u*u];},50,ink);ball(-2.5,-1.5,.23,accent);ball(2.5,1.2,.23,green);arrow(1.8,.7,0,1.2,gold);
    } else if(name==='throw'){
      axis();curve(function(u){return [-2.5+4.5*u,-1.8+3.3*u-3.7*u*u];},60,accent);curve(function(u){return [-2.5+4.5*u,-1.8+2.6*u-3.7*u*u];},60,green);arrow(1,0,0,-1,ink);
    } else if(name==='st-vt'){
      axis();curve(function(u){return [-3+6*u,-1.8+3.4*u*u];},60,accent);line([[-3,-1.8],[3,1.6]],ink);
    } else if(name==='exp'){
      axis();line([[-3,-1.8],[2.8,1.5]],ink);for(var j=1;j<=4;j++)ball(-3+j*1.15,-1.8+j*.66,.11,accent);
    } else if(name==='collision'){
      line([[-3,-1.9],[3,-1.9]],pale);ball(-1.5,-1.5,.32,accent);ball(1.2,-1.5,.32,green);arrow(-2.7,-1.5,1,0,ink);arrow(2.5,-1.5,-1,0,ink);
    } else if(name==='force-add'){
      box(0,-.6,1.1,.7,green);line([[-3,-1.2],[3,-1.2]],pale);
      arrow(-.6,-.4,-.5,0,accent);arrow(-.6,-.8,-1.5,0,accent);
      arrow(.6,-.4,2.5,0,ink);arrow(.6,-.8,1,0,ink);
    } else if(name==='inertia'){
      box(-1,-1,1,.7,green);line([[-3,-1.45],[3,-1.45]],pale);
      arrow(-.4,-.7,2.3,0,ink);arrow(-1.5,-1,0,-.8,accent);
    } else if(name==='friction'){
      box(0,-1,1.3,.8,green);line([[-3,-1.45],[3,-1.45]],pale);
      arrow(.7,-.9,1.7,0,ink);arrow(-.7,-1,-1.7,0,accent);
      arrow(0,-.5,0,-1.1,gold);
    } else if(name==='action'){
      box(-1.3,-1,1.4,.8,green);box(-1.3,-1.7,2.3,.22,pale);
      arrow(-1.3,-.6,0,-.9,accent);arrow(-1.3,-1.6,0,.9,ink);
    } else if(name==='hose'){
      box(-2,-.9,1.4,.45,green);line([[-1.3,-.9],[1.7,-.9]],ink);
      for(var h=0;h<5;h++)ball(1.7+h*.25,-.9,.08,ink);
      arrow(-1.2,-.2,-1.4,0,accent);arrow(.8,-.2,1.4,0,ink);
    } else if(name==='work'){
      line([[-3,-1.8],[3,-1.8]],pale);box(-1,-1.25,1,.7,green);
      arrow(-.5,-1.25,2.3,1.15,ink);arrow(-.5,-1.25,0,-1.1,accent);
    } else if(name==='range'){
      arrow(-3,-1.85,6,0,pale);arrow(-3,-1.85,0,3.8,pale);
      curve(function(u){return [-3+6*u,-1.85+3.25*Math.sin(Math.PI*u)];},80,accent);
      line([[0,-1.85],[0,1.4]],pale);ball(0,1.4,.18,gold);
    } else if(name==='baseball'){
      ball(-2.6,-1.5,.3,accent);
      arrow(-2.6,-1.5,3,0,ink);arrow(.4,-1.5,0,2.4,green);arrow(-2.6,-1.5,3,2.4,accent);
      line([[-2.6,-1.5],[.4,-1.5],[.4,.9]],pale);
    } else if(name==='bomber'){
      var targetX=2.5, flightTime=Math.sqrt(2*500/9.8);
      var towerX=targetX-5.5*80/(150*flightTime), towerHeight=3.7*30/500;
      function bombPosition(u){return [-3+5.5*u,-1.85+3.7*(1-u*u)];}
      line([[-3.4,-1.85],[3,-1.85]],pale);
      curve(bombPosition,80,accent);
      moving=ball(-3,1.85,.16,accent);travel=function(u){var p=bombPosition(u);moving.position.set(p[0],p[1],0);};
      box(-3,2.02,.9,.16,ink);arrow(-3,1.85,1.2,0,ink);
      box(towerX,-1.85+towerHeight/2,.12,towerHeight,pale);
      box(targetX,-1.9,.4,.12,green);
    } else if (name==='projectile') {
      axis();
      var angle=.6,vx=5.4*Math.cos(angle),vy=5.4*Math.sin(angle);
      function pos(t){return [-3+vx*t,-1.85+vy*t-3.1*t*t];}
      var end=Math.min(1.18,vy/3.1);
      curve(function(u){return pos(u*end);},80,accent);
      moving=ball(-3,-1.85,.16,accent);travel=function(u){var p=pos(u*end);moving.position.set(p[0],p[1],0);};
      arrow(-3,-1.85,1.25,0,ink);arrow(-3,-1.85,0,.9,green);
    } else if(name==='gravity'){
      ball(-1.8,0,.55,green);ball(1.8,0,.36,accent);
      arrow(-1.1,0,1,0,ink);arrow(1.1,0,-1,0,ink);
      line([[-1.8,-.7],[-1.8,-1.2],[1.8,-1.2],[1.8,-.7]],pale);
    } else if(name==='kepler'){
      arrow(-3.1,-1.7,2.7,0,pale);arrow(-3.1,-1.7,0,3.1,pale);
      line([[-3,-1.55],[-.6,1.05]],accent);
      arrow(.4,-1.7,2.7,0,pale);arrow(.4,-1.7,0,3.1,pale);
      curve(function(u){var height=3*u;return [.5+2.5*u,-1.45+2.5/((1+height)*(1+height))];},80,green);
      ball(.5+2.5*2/3,-1.45+2.5/9,.1,gold);
    } else if(name==='gvalue'){
      arrow(-3.1,-1.7,2.9,0,pale);arrow(-3.1,-1.7,0,3.1,pale);
      curve(function(u){return [-3+2.5*u,-1.55+2.7*u*u];},60,accent);
      curve(function(u){return [1.6+1.1*Math.cos(2*Math.PI*u),1.1*Math.sin(2*Math.PI*u)];},80,ink);
      moving=ball(2.7,0,.17,green);travel=function(u){moving.position.set(1.6+1.1*Math.cos(2*Math.PI*u),1.1*Math.sin(2*Math.PI*u),0);};
      arrow(2.7,0,-.85,0,accent);arrow(2.7,0,0,.8,green);
    } else if(['circular','orbit','debris'].includes(name)) {
      var radius=1.8;
      curve(function(u){return [radius*Math.cos(u*2*Math.PI),radius*Math.sin(u*2*Math.PI)];},90,ink);
      ball(0,0,name==='orbit'||name==='debris'?.65:.4,green);
      moving=ball(radius,0,.18,accent);travel=function(u){moving.position.set(radius*Math.cos(u*2*Math.PI),radius*Math.sin(u*2*Math.PI),0);};
      arrow(radius,0,-1.05,0,accent);
      if(name==='debris')for(var k=0;k<12;k++)ball(2.4*Math.cos(k*.52),2.4*Math.sin(k*.52),.05,pale);
    } else if(['trench','vector-add','resolve','connected','incline'].includes(name)) {
      if(name==='trench'||name==='vector-add'||name==='resolve') {
        var ox=-2.7,oy=-1.3;arrow(ox,oy,2.4,0,ink);arrow(ox+2.4,oy,0,2.4,green);arrow(ox,oy,2.4,2.4,accent);
        if(name==='resolve'){line([[ox,oy+2.4],[ox+2.4,oy+2.4]],pale);}
      } else if(name==='incline') {
        line([[-3,-2],[3,-2],[-1,1.5],[-3,-2]],ink);box(-.1,.2,.7,.45,green);arrow(-.1,.2,0,-1.25,accent);arrow(-.1,.2,-.7,.55,ink);
      } else {box(-1.8,-1,1,.7,ink);box(1,-1,1.4,.7,green);line([[-1.3,-1],[.3,-1]],pale);arrow(1,-.5,1.1,0,accent);}
    } else if(name==='seesaw'){
      // --- enhanced seesaw: 4 masses P Q R S, pivoted, gentle rocking to illustrate moment = F d_perp ---
      // pivot base (static)
      line([[-0.55,-1.7],[0.55,-1.7],[0,-0.3]], pale);
      line([[-0.55,-1.7],[0.55,-1.7]], pale);
      var seesawGroup = new T.Group();
      seesawGroup.position.set(0, -0.3, 0);
      scene.add(seesawGroup);
      line([[-2.8,0],[2.8,0]], ink, null, seesawGroup);
      var mP = ball(-2.8,0.22,0.20,accent, seesawGroup);
      var mQ = ball(-1.4,0.22,0.20,accent, seesawGroup);
      var mR = ball(1.4,0.22,0.20,green, seesawGroup);
      var mS = ball(2.8,0.22,0.20,green, seesawGroup);
      arrow(-2.8,0.22,0,-0.85,accent, seesawGroup);
      arrow(-1.4,0.22,0,-0.65,accent, seesawGroup);
      arrow(1.4,0.22,0,-0.65,green, seesawGroup);
      arrow(2.8,0.22,0,-0.85,green, seesawGroup);
      // small label helpers for perpendicular distance bracket (dashed)
      var hudPivot = host.querySelector('[data-hud="pivot"]');
      var hudMoment = host.querySelector('[data-hud="moment"]');
      // also auto-create P Q R S labels if not present, but we reuse existing huds; keep pivot/moment as primary
      updateHud = function() {
        placeHud(hudPivot, canvas, camera, new T.Vector3(0, -0.68, 0));
        placeHud(hudMoment, canvas, camera, new T.Vector3(1.95, 1.25, 0));
      };
      updateHud();
      animate = function(t) {
        var ang = Math.sin(t*0.62) * 0.062; // ~3.5° rocking, shows moment arm changes but net M stays 0 when balanced
        seesawGroup.rotation.z = ang;
        updateHud();
      };
    } else if(name==='lever'){
      // --- enhanced lever: load near fulcrum, effort far, shows mechanical advantage, animated lift ---
      line([[-0.55,-1.7],[0.55,-1.7],[0,-0.3]], pale);
      line([[-0.55,-1.7],[0.55,-1.7]], pale);
      var leverGroup = new T.Group();
      leverGroup.position.set(0, -0.3, 0);
      scene.add(leverGroup);
      // arm: load arm 1.6, effort arm 2.6
      line([[-1.75,0],[2.65,0]], ink, null, leverGroup);
      var loadMass = box(-1.75,0.28,0.55,0.42,accent, leverGroup);
      var effortArrow = arrow(2.65,0.12,0,-0.95,green, leverGroup);
      var loadArrow = arrow(-1.75,0.28,0,-0.85,accent, leverGroup);
      // ground line
      line([[-3.2,-1.7],[3.2,-1.7]], pale);
      var hudLoad = host.querySelector('[data-hud="load"]');
      var hudEffort = host.querySelector('[data-hud="effort"]');
      updateHud = function() {
        // compute world positions of load/effort with current rotation
        loadMass.updateMatrixWorld();
        var loadWorld = new T.Vector3(); loadMass.getWorldPosition(loadWorld); loadWorld.y += 0.55; loadWorld.x -= 0.05;
        placeHud(hudLoad, canvas, camera, loadWorld);
        var effortWorld = new T.Vector3(2.65,0.12,0);
        effortWorld.applyMatrix4(leverGroup.matrixWorld);
        // leverGroup matrixWorld includes translation to (0,-0.3)
        // need to manually transform: apply rotation then add position
        // using getWorldPosition of a helper
        var helper = effortArrow;
        helper.updateMatrixWorld();
        var effPos = new T.Vector3(); helper.getWorldPosition(effPos); effPos.y += 0.35; effPos.x += 0.12;
        placeHud(hudEffort, canvas, camera, effPos);
      };
      updateHud();
      animate = function(t) {
        // lift cycle: lever tilts ±7°, showing load rising when effort down
        var ang = Math.sin(t*0.55) * 0.11;
        leverGroup.rotation.z = ang;
        updateHud();
      };
    } else if(['uam','freefall'].includes(name)) {
      axis();
      if(name==='freefall'){line([[-2.6,2],[2.6,2]],pale);curve(function(u){return [0,1.7-3.5*u*u];},40,accent);moving=ball(0,1.7,.18);travel=function(u){moving.position.set(0,1.7-3.5*u*u,0);};}
      else {curve(function(u){return [-3+6*u,-1.8+3.2*u*u];},50,ink);for(var j=0;j<6;j++)ball(-3+j,-1.8+3.2*(j/6)**2,.08,accent);}
    }
    function frame(ms){
      if(travel) travel((ms*0.0002)%1);
      if(animate) animate(ms*0.001);
      if(updateHud && !animate) updateHud();
      renderer.render(scene,camera);
      if(travel || animate) requestAnimationFrame(frame);
    }
    frame(0);
    // ensure hud placed after first render even for static
    if (updateHud) {
      // placement may need a tick after renderer size settled
      setTimeout(updateHud, 60);
      setTimeout(updateHud, 300);
    }
  }
  function init(){document.querySelectorAll('canvas.scene-canvas').forEach(boot);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
