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
    function resize() { var w=canvas.clientWidth||640,h=canvas.clientHeight||360; renderer.setSize(w,h,false); var a=w/h; camera.left=-3*a; camera.right=3*a; camera.updateProjectionMatrix(); }
    resize(); global.addEventListener('resize',resize);
    function line(points,color,width) { var g=new T.BufferGeometry().setFromPoints(points.map(function(p){return new T.Vector3(p[0],p[1],0);})); var o=new T.Line(g,new T.LineBasicMaterial({color:color||ink,linewidth:width||2})); scene.add(o); return o; }
    function arrow(x,y,dx,dy,color) { var len=Math.hypot(dx,dy); if(!len)return; scene.add(new T.ArrowHelper(new T.Vector3(dx/len,dy/len,0),new T.Vector3(x,y,0),len,color||ink,.22,.13)); }
    function ball(x,y,r,color) { var m=new T.Mesh(new T.SphereGeometry(r||.17,18,12),new T.MeshBasicMaterial({color:color||accent})); m.position.set(x,y,0);scene.add(m);return m; }
    function box(x,y,w,h,color) { var m=new T.Mesh(new T.BoxGeometry(w,h,.15),new T.MeshBasicMaterial({color:color||ink}));m.position.set(x,y,0);scene.add(m);return m; }
    function curve(f,n,color) { var pts=[];for(var i=0;i<=n;i++)pts.push(f(i/n));return line(pts,color); }
    function axis() { arrow(-3.5,-2.1,7,0,pale);arrow(-3.5,-2.1,0,4.2,pale); }
    var moving=null, travel=null;
    if(name==='peter'||name==='shirley'){
      var a=name==='shirley'?[-2.5,-1.7]:[-2.4,-1.4], b=[a[0]+2.4,a[1]],c=[b[0],b[1]+2.4];
      arrow(a[0],a[1],2.4,0,ink);arrow(b[0],b[1],0,2.4,green);arrow(a[0],a[1],2.4,2.4,accent);
      if(name==='peter'){curve(function(u){return [1.7*Math.cos(Math.PI*u),1.7*Math.sin(Math.PI*u)];},40,pale);}
    } else if(name==='g'||name==='ticker'){
      line([[-2.8,2.2],[2.8,2.2]],ink);
      for(var d=0;d<7;d++)ball(name==='ticker'?-2.5+d*d*.14:0,1.8-d*.55,.11,accent);
      arrow(1.4,1.6,0,-2.8,green);
    } else if(name==='bung'||name==='hole'){
      curve(function(u){return [-1.2+1.65*Math.cos(2*Math.PI*u),.55+1.1*Math.sin(2*Math.PI*u)];},80,ink);
      ball(-1.2,.55,.17,green);moving=ball(.45,.55,.22,accent);
      travel=function(u){moving.position.set(-1.2+1.65*Math.cos(u*2*Math.PI),.55+1.1*Math.sin(u*2*Math.PI),0);};
      line([[.45,.55],[2.4,.55],[2.4,-1.7]],gray);ball(2.4,-1.7,.28,gold);arrow(2.4,-1.7,0,-.6,accent);
    } else if(name==='safety'){
      axis();curve(function(u){return [-3+6*u,-1.8+3.4*Math.exp(-Math.pow((u-.3)/.11,2))];},70,accent);
      curve(function(u){return [-3+6*u,-1.8+1.8*Math.exp(-Math.pow((u-.55)/.25,2))];},70,green);
    } else if(name==='pumped'){
      box(-2,1.5,2,.35,ink);box(2,-1.6,2,.35,ink);line([[-1,1.5],[.4,1.5],[.4,-1.6],[1,-1.6]],ink);arrow(.4,.8,0,-1.5,accent);ball(.4,-1.1,.42,gold);
    } else if(name==='roller'){
      curve(function(u){return [-3+6*u,-1.7+3.3*Math.pow(2*u-1,2)];},80,ink);moving=ball(-3,1.6,.23,accent);travel=function(u){moving.position.set(-3+6*u,-1.7+3.3*Math.pow(2*u-1,2),0);};
    } else if(name==='plumb'){
      line([[-1.8,1.4],[1.8,1.4],[1.8,-1.4],[-1.8,-1.4],[-1.8,1.4]],ink);
      line([[-1.8,1.4],[1.8,-1.4]],accent);line([[1.8,1.4],[-1.8,-1.4]],green);ball(0,0,.14,gold);
    } else if(name==='board'){
      line([[-1.7,-1.7],[1.7,-1.7],[1.7,1.7],[-1.7,1.7],[-1.7,-1.7]],ink);ball(-1.7,-1.7,.16,gold);arrow(1.7,1.7,0,-1.4,accent);arrow(1.7,-1.7,0,1.4,green);
    } else if(name==='power'){
      box(-1.5,-.5,1,.6,green);arrow(-1,-.5,2.6,0,ink);arrow(1.3,-.5,0,1.5,accent);line([[-3,-1.4],[3,-1.4]],gray);
    } else if(name==='energy'){
      curve(function(u){return [-3+6*u,-1.7+3*u*u];},50,ink);ball(-2.5,-1.5,.23,accent);ball(2.5,1.2,.23,green);arrow(1.8,.7,0,1.2,gold);
    } else if(name==='throw'){
      axis();curve(function(u){return [-2.5+4.5*u,-1.8+3.3*u-3.7*u*u];},60,accent);curve(function(u){return [-2.5+4.5*u,-1.8+2.6*u-3.7*u*u];},60,green);arrow(1,0,0,-1,ink);
    } else if(name==='st-vt'){
      axis();curve(function(u){return [-3+6*u,-1.8+3.4*u*u];},60,accent);line([[-3,-1.8],[3,1.6]],ink);
    } else if(name==='exp'){
      axis();line([[-3,-1.8],[2.8,1.5]],ink);for(var j=1;j<=4;j++)ball(-3+j*1.15,-1.8+j*.66,.11,accent);
    } else if(name==='collision'){
      line([[-3,-1.9],[3,-1.9]],gray);ball(-1.5,-1.5,.32,accent);ball(1.2,-1.5,.32,green);arrow(-2.7,-1.5,1,0,ink);arrow(2.5,-1.5,-1,0,ink);
    } else if (['projectile','bomber','range','baseball'].includes(name)) {
      axis();
      var launch=name==='bomber'?1.65:0, angle=name==='baseball'?.7:name==='range'?.9:.6;
      var vx=name==='bomber'?5.8:5.4*Math.cos(angle),vy=name==='bomber'?0:5.4*Math.sin(angle);
      function pos(t){return [-3+vx*t,-1.85+launch+vy*t-3.1*t*t];}
      var end=name==='bomber'?.73:Math.min(1.18,vy/3.1);
      curve(function(u){return pos(u*end);},80,accent);
      moving=ball(-3,-1.85+launch,.16,accent);travel=function(u){var p=pos(u*end);moving.position.set(p[0],p[1],0);};
      arrow(-3,-1.85+launch,1.25,0,ink); if(name!=='bomber')arrow(-3,-1.85+launch,0,.9,green);
      if(name==='bomber'){box(-3,1.95,.9,.16,ink);box(1.4,-1.4,.12,.95,pale);box(2.1,-1.9,.45,.12,green);}
      if(name==='range'){curve(function(u){return [-3+6*u,-1.85+2.7*Math.sin(Math.PI*u)];},60,green);}
      if(name==='baseball')ball(-3,-1.85,.27,accent);
    } else if(['circular','orbit','kepler','gravity','gvalue','debris'].includes(name)) {
      var radius=name==='kepler'?2.25:1.8;
      curve(function(u){return [radius*Math.cos(u*2*Math.PI),radius*Math.sin(u*2*Math.PI)];},90,ink);
      ball(0,0,name==='gravity'||name==='g'?.65:.4,green);
      moving=ball(radius,0,.18,accent);travel=function(u){moving.position.set(radius*Math.cos(u*2*Math.PI),radius*Math.sin(u*2*Math.PI),0);};
      arrow(radius,0,-1.05,0,accent);
      if(name==='kepler')curve(function(u){return [2.7*Math.cos(u*2*Math.PI),1.4*Math.sin(u*2*Math.PI)];},90,pale);
      if(name==='gvalue')ball(0,0,1.05,pale);
    } else if(['trench','vector-add','force-add','resolve','action','connected','hose','incline','friction','inertia'].includes(name)) {
      if(name==='trench'||name==='vector-add'||name==='force-add'||name==='resolve') {
        var ox=-2.7,oy=-1.3;arrow(ox,oy,2.4,0,ink);arrow(ox+2.4,oy,1.4,1.8,green);arrow(ox,oy,3.8,1.8,accent);
        if(name==='resolve'){arrow(ox,oy,0,1.8,green);line([[ox,oy+1.8],[ox+3.8,oy+1.8]],pale);}
      } else if(name==='incline'||name==='friction') {
        line([[-3,-2],[3,-2],[-1,1.5],[-3,-2]],ink);box(-.1,.2,.7,.45,green);arrow(-.1,.2,0,-1.25,accent);arrow(-.1,.2,-.7,.55,ink);
      } else if(name==='action'||name==='hose'){box(-1.5,-1,.8,.6,green);arrow(-1,-.8,2,0,ink);arrow(-1,-.8,-1.5,0,accent);}
      else if(name==='connected'){box(-1.8,-1,1,.7,ink);box(1,-1,1.4,.7,green);line([[-1.3,-1],[.3,-1]],pale);arrow(1,-.5,1.1,0,accent);}
      else {box(-1.3,-1.4,2.4,.3,pale);ball(0,.5,.45,green);arrow(0,.5,0,-1.3,accent);}
    } else if(['lever','seesaw','work'].includes(name)) {
      line([[-2.8,-.3],[2.8,.5]],ink);line([[-.5,-1.7],[.5,-1.7],[0,-.3]],pale);
      arrow(-2,-.2,0,-1.1,accent);arrow(2,.35,0,-.8,green);
    } else if(['uam','freefall'].includes(name)) {
      axis();
      if(name==='freefall'){curve(function(u){return [-2.6+5.2*u,1.7-3.5*u*u];},40,accent);moving=ball(-2.6,1.7,.18);travel=function(u){moving.position.set(-2.6+5.2*u,1.7-3.5*u*u,0);};}
      else {curve(function(u){return [-3+6*u,-1.8+3.2*u*u];},50,ink);for(var j=0;j<6;j++)ball(-3+j,-1.8+3.2*(j/6)**2,.08,accent);}
    }
    function frame(t){if(travel)travel((t*.0002)%1);renderer.render(scene,camera);if(travel)requestAnimationFrame(frame);}
    frame(0);
  }
  function init(){document.querySelectorAll('canvas.scene-canvas').forEach(boot);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
