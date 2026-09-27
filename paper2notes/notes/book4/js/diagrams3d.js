(function (global) {
  "use strict";
  var T=global.THREE;
  if(!T)return;
  var scenes={};
  var blue=0x20588d,red=0xc34532,green=0x178268,gold=0xc39422,gray=0xa6afb7;
  function create(host){
    var canvas=host.querySelector('canvas');if(!canvas)return;
    var name=host.getAttribute('data-scene');
    var topic=name.indexOf('summary-ch')===0?({'01':'coulomb','02':'current-flow','03':'series-parallel','04':'house-wiring','05':'bar-magnet','06':'dc-motor','07':'generator','08':'transformer'})[name.slice(10,12)]:name;
    var scene=new T.Scene();scene.background=new T.Color(0xffffff);
    var camera=new T.OrthographicCamera(-5,5,3,-3,.1,30);camera.position.set(0,0,12);camera.lookAt(0,0,0);
    var renderer=new T.WebGLRenderer({canvas:canvas,antialias:true});renderer.setPixelRatio(Math.min(global.devicePixelRatio||1,2));
    scene.add(new T.AmbientLight(0xffffff,1));
    function resize(){var w=canvas.clientWidth||640,h=canvas.clientHeight||360;renderer.setSize(w,h,false);var a=w/h;camera.left=-3*a;camera.right=3*a;camera.updateProjectionMatrix();}
    resize();global.addEventListener('resize',resize);
    function line(points,color){var g=new T.BufferGeometry().setFromPoints(points.map(function(p){return new T.Vector3(p[0],p[1],0);}));scene.add(new T.Line(g,new T.LineBasicMaterial({color:color||blue})));}
    function arrow(x,y,dx,dy,color){var l=Math.hypot(dx,dy);if(l)scene.add(new T.ArrowHelper(new T.Vector3(dx/l,dy/l,0),new T.Vector3(x,y,0),l,color||blue,.2,.12));}
    function sphere(x,y,r,color){var m=new T.Mesh(new T.SphereGeometry(r,18,12),new T.MeshBasicMaterial({color:color||red}));m.position.set(x,y,0);scene.add(m);return m;}
    function rect(x,y,w,h,color){var m=new T.Mesh(new T.BoxGeometry(w,h,.12),new T.MeshBasicMaterial({color:color||blue}));m.position.set(x,y,0);scene.add(m);return m;}
    function arc(cx,cy,rx,ry,start,end,color){var p=[];for(var i=0;i<=64;i++){var a=start+(end-start)*i/64;p.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}line(p,color);}
    function coil(x,y,n,color){for(var i=0;i<n;i++)arc(x+(i-(n-1)/2)*.42,y,.27,.8,0,Math.PI*2,color||gold);}
    function magnet(x,y){rect(x-.55,y,1.1,.55,red);rect(x+.55,y,1.1,.55,blue);}
    function axes(){arrow(-3.2,-1.9,6.4,0,gray);arrow(-3.2,-1.9,0,3.8,gray);}
    var animate=null;
    if(['coulomb','coulomb-force','charge-force','efield-point','efield-plates'].includes(topic)){
      if(topic==='efield-plates'){rect(-2,0,.25,3.2,red);rect(2,0,.25,3.2,blue);for(var i=-2;i<=2;i++)arrow(-1.7,i*.55,3.4,0,gold);}
      else {sphere(-1.7,0,.38,red);sphere(1.7,0,.38,blue);arrow(-1.15,0,1,0,gold);arrow(1.15,0,-1,0,gold);if(topic==='efield-point')for(var j=0;j<8;j++){var a=j*Math.PI/4;arrow(-1.7+.6*Math.cos(a),.6*Math.sin(a),.7*Math.cos(a),.7*Math.sin(a),red);}if(topic==='charge-force')arc(0,0,1.6,1.2,0,Math.PI*1.7,green);}
    }else if(['current-flow','emf-pd','series-parallel','internal-r','network-potential','resistivity','fuse-choice','house-wiring','kwh-meter','power-heating','meter-effect'].includes(topic)){
      line([[-2.8,-1.5],[2.8,-1.5],[2.8,1.5],[-2.8,1.5],[-2.8,-1.5]],blue);rect(-2.8,0,.2,.9,red);rect(-2.45,0,.1,.55,red);
      rect(0,1.5,1,.22,gold);rect(0,-1.5,1,.22,gold);
      if(topic==='series-parallel'||topic==='network-potential'){line([[-2.8,0],[2.8,0]],green);rect(0,0,1,.2,gold);}
      if(topic==='house-wiring'||topic==='fuse-choice'){rect(2.8,0,.25,.65,red);line([[-3.4,-2.1],[3.4,-2.1]],green);}
      if(topic==='current-flow')for(var c=-2;c<=2;c++)arrow(c,1.5,.45,0,red);
      if(topic==='internal-r'||topic==='emf-pd')rect(-1.5,1.5,.45,.22,red);
      if(topic==='resistivity')rect(0,1.5,2,.28,gold);
      if(topic==='kwh-meter'||topic==='power-heating')sphere(0,0,.55,gold);
      if(topic==='meter-effect')sphere(2.8,0,.38,green);
    }else if(['bar-magnet','wire-coil-solenoid','wire-force','coil-torque','dc-motor','flux-geometry','lenz-law','generator','eddy-current','transformer','transmission-grid'].includes(topic)){
      if(topic==='bar-magnet'){magnet(0,0);for(var a=-1;a<=1;a++){arc(0,0,2.2,1.1+a*.35,0,Math.PI,green);arc(0,0,2.2,1.1+a*.35,Math.PI,2*Math.PI,green);}arrow(0,1.5,1,0,green);}
      if(topic==='wire-coil-solenoid'){coil(0,0,9,gold);arrow(-2,0,4,0,blue);for(var k=-2;k<=2;k++)arc(-2.3,0,.45+k*.12,1.25+k*.13,-Math.PI/2,Math.PI/2,green);}
      if(topic==='wire-force'){line([[-2.5,-1.8],[2.5,1.8]],gold);for(var v=-2;v<=2;v++)arrow(v,-1.7,0,3.4,blue);arrow(0,0,2,0,red);}
      if(topic==='coil-torque'||topic==='dc-motor'){line([[-1.4,-1],[-1.4,1],[1.4,1],[1.4,-1],[-1.4,-1]],gold);for(var b=-2;b<=2;b++)arrow(-3,b*.55,6,0,blue);arrow(-1.4,0,0,1,red);arrow(1.4,0,0,-1,red);if(topic==='dc-motor'){arc(0,-1.45,.42,.27,0,Math.PI,gold);arc(0,-1.45,.42,.27,Math.PI,2*Math.PI,blue);}}
      if(topic==='flux-geometry'){line([[-1.5,-1.2],[1.5,-1.2],[1.5,1.2],[-1.5,1.2],[-1.5,-1.2]],gold);for(var f=-2;f<=2;f++)arrow(f*.55,-2,0,4,blue);}
      if(topic==='lenz-law'){magnet(-1.8,0);coil(1,0,3,gold);arrow(-.6,0,1,0,red);arrow(1.4,1,-.8,0,green);}
      if(topic==='generator'){coil(0,0,3,gold);magnet(-2.5,0);magnet(2.5,0);arc(0,-1.6,.6,.3,0,Math.PI*2,green);animate=function(t){scene.rotation.z=.12*Math.sin(t);};}
      if(topic==='eddy-current'){magnet(0,1);rect(0,-1.2,2,.35,gray);for(var e=-1;e<=1;e++)arc(e*.55,-1.2,.3,.2,0,Math.PI*2,red);arrow(0,.6,0,-1,blue);}
      if(topic==='transformer'){rect(0,0,3.4,2.6,gray);rect(0,0,1.8,1.2,0xffffff);coil(-1.5,0,4,gold);coil(1.5,0,7,red);arrow(-2.9,0,.8,0,blue);arrow(2.2,0,.8,0,blue);}
      if(topic==='transmission-grid'){rect(-2,0,.8,.8,gold);rect(2,0,.8,.8,green);line([[-1.6,.7],[1.6,.7]],blue);line([[-1.6,-.7],[1.6,-.7]],blue);arrow(-.8,0,1.6,0,red);}
    }else if(['ac-wave','rms-heating','iv-curves'].includes(topic)){
      axes();var pts=[];for(var w=0;w<=100;w++)pts.push([-3+6*w/100,-.1+1.5*Math.sin(w*Math.PI*4/100)]);line(pts,red);if(topic==='rms-heating')line([[-3,.95],[3,.95]],green);if(topic==='iv-curves')line([[-2.5,-1.5],[2.5,1.5]],blue);
    }
    function frame(ms){if(animate)animate(ms*.001);renderer.render(scene,camera);if(animate)global.requestAnimationFrame(frame);}
    frame(0);
    scenes[name]={snapshot:function(){return {name:name};}};
  }
  function init(){document.querySelectorAll('[data-scene]').forEach(create);document.querySelectorAll('[data-replay]').forEach(function(btn){btn.addEventListener('click',function(){var host=document.getElementById(btn.getAttribute('data-replay'));if(host)host.dispatchEvent(new Event('notes-replay'));});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  global.NotesScenes=scenes;
})(window);
