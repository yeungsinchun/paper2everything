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
    function resize(){var w=canvas.clientWidth||640,h=canvas.clientHeight||360;renderer.setSize(w,h,false);var a=w/h;camera.left=-3*a;camera.right=3*a;camera.updateProjectionMatrix();renderer.render(scene,camera);}
    resize();global.addEventListener('resize',resize);
    function line(points,color,parent){var g=new T.BufferGeometry().setFromPoints(points.map(function(p){return new T.Vector3(p[0],p[1],0);}));var shape=new T.Line(g,new T.LineBasicMaterial({color:color||blue}));(parent||scene).add(shape);return shape;}
    function arrow(x,y,dx,dy,color,parent){var l=Math.hypot(dx,dy);if(!l)return;var h=new T.ArrowHelper(new T.Vector3(dx/l,dy/l,0),new T.Vector3(x,y,0),l,color||blue,.2,.12);(parent||scene).add(h);return h;}
    function sphere(x,y,r,color,parent){var m=new T.Mesh(new T.SphereGeometry(r,18,12),new T.MeshBasicMaterial({color:color||red}));m.position.set(x,y,0);(parent||scene).add(m);return m;}
    function rect(x,y,w,h,color){var m=new T.Mesh(new T.BoxGeometry(w,h,.12),new T.MeshBasicMaterial({color:color||blue}));m.position.set(x,y,0);scene.add(m);return m;}
    function arc(cx,cy,rx,ry,start,end,color,parent){var p=[];for(var i=0;i<=64;i++){var a=start+(end-start)*i/64;p.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}line(p,color,parent);}
    function coil(x,y,n,color,parent){for(var i=0;i<n;i++)arc(x+(i-(n-1)/2)*.42,y,.27,.8,0,Math.PI*2,color||gold,parent);}
    function magnet(x,y){rect(x-.55,y,1.1,.55,red);rect(x+.55,y,1.1,.55,blue);}
    function axes(){arrow(-3.2,-1.9,6.4,0,gray);arrow(-3.2,-1.9,0,3.8,gray);}
    function intoPage(){for(var x=-3;x<=3;x++)for(var y=-2;y<=2;y++){var px=x*.8,py=y*.8;line([[px-.09,py-.09],[px+.09,py+.09]],gray);line([[px-.09,py+.09],[px+.09,py-.09]],gray);}}
    var animate=null;
    if(topic==='charge-force'){
      intoPage();
      arc(0,0,1.5,1.5,-Math.PI/2,Math.PI/2,red);
      sphere(0,-1.5,.2,red);arrow(0,-1.5,1.1,0,gold);arrow(0,-1.5,0,.8,green);arrow(1.5,0,-.8,0,green);
    }else if(topic==='internal-r'){
      axes();line([[-2.7,1.5],[2.7,-1.1]],red);sphere(-2.7,1.5,.11,gold);sphere(2.7,-1.1,.11,gold);
    }else if(topic==='resistivity'){
      rect(-1.5,1,3,.3,gold);rect(-1.5,-1,1.5,.6,blue);
      arrow(-3,1,3,0,red);arrow(-3,-1,1.5,0,green);
    }else if(topic==='meter-effect'){
      line([[-2.7,-1.5],[2.7,-1.5],[2.7,1.5],[-2.7,1.5],[-2.7,-1.5]],blue);
      rect(-2.7,0,.2,.9,red);sphere(0,1.5,.4,gold);rect(1.6,1.5,.9,.2,green);
      line([[1.15,1.5],[1.15,.2],[2.05,.2],[2.05,1.5]],gray);sphere(1.6,.2,.32,red);
    }else if(topic==='power-heating'){
      line([[-2.7,-1.5],[2.7,-1.5],[2.7,1.5],[-2.7,1.5],[-2.7,-1.5]],blue);
      rect(-2.7,0,.2,.9,red);sphere(-1,1.5,.38,gold);sphere(1,1.5,.58,gold);
      arrow(-1.8,1.5,.5,0,red);arrow(.2,1.5,.5,0,red);
    }else if(topic==='kwh-meter'){
      rect(0,0,2.4,2.5,gray);rect(0,.45,1.8,.7,0xffffff);
      for(var digit=-1;digit<=1;digit++)rect(digit*.5,.45,.3,.4,blue);
      line([[-2.5,-1.5],[2.5,-1.5]],blue);sphere(2,-1.5,.35,gold);
    }else if(['coulomb','coulomb-force','efield-point','efield-plates'].includes(topic)){
      if(topic==='efield-plates'){rect(-2,0,.25,3.2,red);rect(2,0,.25,3.2,blue);for(var i=-2;i<=2;i++)arrow(-1.7,i*.55,3.4,0,gold);}
      else if(topic==='efield-point'){sphere(0,0,.38,red);for(var j=0;j<8;j++){var a=j*Math.PI/4;arrow(.6*Math.cos(a),.6*Math.sin(a),.85*Math.cos(a),.85*Math.sin(a),red);}}
      else {sphere(-1.7,0,.38,red);sphere(1.7,0,.38,topic==='coulomb'?red:blue);arrow(-1.15,0,topic==='coulomb'?-1:1,0,gold);arrow(1.15,0,topic==='coulomb'?1:-1,0,gold);}
    }else if(['current-flow','emf-pd','series-parallel','network-potential','fuse-choice','house-wiring'].includes(topic)){
      line([[-2.8,-1.5],[2.8,-1.5],[2.8,1.5],[-2.8,1.5],[-2.8,-1.5]],blue);rect(-2.8,0,.2,.9,red);rect(-2.45,0,.1,.55,red);
      rect(0,1.5,1,.22,gold);rect(0,-1.5,1,.22,gold);
      if(topic==='series-parallel'||topic==='network-potential'){line([[-2.8,0],[2.8,0]],green);rect(0,0,1,.2,gold);}
      if(topic==='house-wiring'||topic==='fuse-choice'){rect(2.8,0,.25,.65,red);line([[-3.4,-2.1],[3.4,-2.1]],green);}
      if(topic==='current-flow')for(var c=-2;c<=2;c++){arrow(c,1.7,.45,0,red);arrow(c,-1.7,-.45,0,green);}
      if(topic==='emf-pd')rect(-1.5,1.5,.45,.22,red);
    }else if(['bar-magnet','wire-coil-solenoid','wire-force','coil-torque','dc-motor','flux-geometry','lenz-law','generator','eddy-current','transformer','transmission-grid'].includes(topic)){
      if(topic==='bar-magnet'){magnet(0,0);for(var a=-1;a<=1;a++){arc(0,0,2.2,1.1+a*.35,0,Math.PI,green);arc(0,0,2.2,1.1+a*.35,Math.PI,2*Math.PI,green);}arrow(0,1.5,1,0,green);}
      if(topic==='wire-coil-solenoid'){coil(0,0,9,gold);arrow(-2,0,4,0,blue);for(var k=-2;k<=2;k++)arc(-2.3,0,.45+k*.12,1.25+k*.13,-Math.PI/2,Math.PI/2,green);}
      if(topic==='wire-force'){intoPage();line([[-2.3,0],[2.3,0]],gold);arrow(-2,0,1.2,0,red);arrow(0,0,0,1.1,green);}
      if(topic==='coil-torque'||topic==='dc-motor'){var motorCoil=new T.Group();scene.add(motorCoil);for(var b=-2;b<=2;b++)arrow(-3,b*.55,6,0,blue);line([[-1.4,0],[1.4,0]],gold,motorCoil);sphere(-1.4,0,.16,gold,motorCoil);sphere(1.4,0,.16,gold,motorCoil);var upForce=arrow(-1.4,0,0,1,red),downForce=arrow(1.4,0,0,-1,red);var curDot=new T.Group(),curCross=new T.Group();motorCoil.add(curDot);motorCoil.add(curCross);curDot.position.set(-1.4,0,0);curCross.position.set(1.4,0,0);sphere(0,0,.06,red,curDot);line([[-.1,-.1],[.1,.1]],red,curCross);line([[-.1,.1],[.1,-.1]],red,curCross);if(topic==='dc-motor'){arc(0,0,.35,.35,0,Math.PI,gold,motorCoil);arc(0,0,.35,.35,Math.PI,2*Math.PI,blue,motorCoil);animate=function(t){var turn=-t*1.2,c=Math.cos(turn),s=c>=0?Math.sin(turn):-Math.sin(turn);motorCoil.rotation.z=turn;upForce.position.set(-1.4*Math.abs(c),-1.4*s,0);downForce.position.set(1.4*Math.abs(c),1.4*s,0);if(c>=0){curDot.position.set(-1.4,0,0);curCross.position.set(1.4,0,0);}else{curDot.position.set(1.4,0,0);curCross.position.set(-1.4,0,0);}};}}
      if(topic==='flux-geometry'){line([[-1.5,-1.2],[1.5,-1.2],[1.5,1.2],[-1.5,1.2],[-1.5,-1.2]],gold);for(var f=-2;f<=2;f++)arrow(f*.55,-2,0,4,blue);}
      if(topic==='lenz-law'){magnet(-1.8,0);coil(1,0,3,gold);arrow(-.6,0,1,0,red);arrow(1.4,1,-.8,0,green);}
      if(topic==='generator'){var generatorCoil=new T.Group();scene.add(generatorCoil);coil(0,0,3,gold,generatorCoil);magnet(-2.5,0);magnet(2.5,0);arc(0,-1.6,.6,.3,0,Math.PI*2,green,generatorCoil);animate=function(t){generatorCoil.rotation.y=t*1.2;};}
      if(topic==='eddy-current'){magnet(0,1);rect(0,-1.2,2,.35,gray);for(var e=-1;e<=1;e++)arc(e*.55,-1.2,.3,.2,0,Math.PI*2,red);arrow(0,.6,0,-1,blue);}
      if(topic==='transformer'){rect(0,0,3.4,2.6,gray);rect(0,0,1.8,1.2,0xffffff);coil(-1.5,0,4,gold);coil(1.5,0,7,red);arrow(-2.9,0,.8,0,blue);arrow(2.2,0,.8,0,blue);}
      if(topic==='transmission-grid'){rect(-2,0,.8,.8,gold);rect(2,0,.8,.8,green);line([[-1.6,.7],[1.6,.7]],blue);line([[-1.6,-.7],[1.6,-.7]],blue);arrow(-.8,0,1.6,0,red);}
    }else if(topic==='iv-curves'){
      arrow(-3.1,0,6.2,0,gray);arrow(0,-2,0,4,gray);
      var ohmic=[],filament=[],diode=[];
      for(var w=0;w<=100;w++){
        var voltage=-3+6*w/100;
        ohmic.push([voltage,.52*voltage]);
        filament.push([voltage,1.5*Math.tanh(voltage/1.8)]);
        diode.push([voltage,voltage<.7?0:Math.min(1.85,.13*(Math.exp(1.5*(voltage-.7))-1))]);
      }
      line(ohmic,blue);line(filament,gold);line(diode,red);
    }else if(topic==='ac-wave'||topic==='rms-heating'){
      axes();var pts=[];for(var w=0;w<=100;w++)pts.push([-3+6*w/100,-.1+1.5*Math.sin(w*Math.PI*4/100)]);line(pts,red);if(topic==='rms-heating')line([[-3,.95],[3,.95]],green);else line([[-3,.95],[3,.95]],blue);
    }
    function frame(ms){if(animate)animate(ms*.001);renderer.render(scene,camera);if(animate)global.requestAnimationFrame(frame);}
    frame(0);
    scenes[name]={snapshot:function(){return {name:name};}};
  }
  function init(){document.querySelectorAll('[data-scene]').forEach(create);document.querySelectorAll('[data-replay]').forEach(function(btn){btn.addEventListener('click',function(){var host=document.getElementById(btn.getAttribute('data-replay'));if(host)host.dispatchEvent(new Event('notes-replay'));});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  global.NotesScenes=scenes;
})(window);
