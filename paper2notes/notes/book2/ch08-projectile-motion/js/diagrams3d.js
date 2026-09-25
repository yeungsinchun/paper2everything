
(function (global) {
  "use strict";
  var THREE = global.THREE;
  if(!THREE) return;
  function stage(canvas){
    var scene=new THREE.Scene(); scene.background=new THREE.Color(0xffffff);
    var camera=new THREE.OrthographicCamera(-8,8,4.5,-4.5,0.1,40);
    camera.position.set(0,1,12); camera.lookAt(0,0,0);
    var renderer=new THREE.WebGLRenderer({canvas:canvas, antialias:true}); renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    scene.add(new THREE.AmbientLight(0xffffff,0.8));
    var dl=new THREE.DirectionalLight(0xffffff,0.7); dl.position.set(4,6,8); scene.add(dl);
    function resize(){ var w=canvas.clientWidth||480,h=canvas.clientHeight||320; renderer.setSize(w,h,false); var aspect=w/Math.max(h,1); var halfH=4.5, halfW=halfH*aspect; camera.left=-halfW; camera.right=halfW; camera.top=halfH; camera.bottom=-halfH; camera.updateProjectionMatrix(); }
    resize(); window.addEventListener("resize", resize);
    return {scene:scene,camera:camera,renderer:renderer};
  }
  function initOne(canvas){
    var host=canvas.closest?canvas.closest("[data-scene]"):canvas.parentElement;
    var name=host?host.getAttribute("data-scene"):"";
    var g=stage(canvas); var scene=g.scene,camera=g.camera,renderer=g.renderer;
    function addArrow(s,e,col){
      col=col||0x0f5c54;
      var dir=new THREE.Vector3().subVectors(e,s); var len=dir.length(); if(len<0.01) return;
      dir.normalize();
      var cyl=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,len,10), new THREE.MeshStandardMaterial({color:col}));
      var mid=new THREE.Vector3().addVectors(s,e).multiplyScalar(0.5); cyl.position.copy(mid); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir); scene.add(cyl);
      var cone=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.4,12), new THREE.MeshStandardMaterial({color:col})); cone.position.copy(e); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir); scene.add(cone);
    }
    function addGrid(){ var grid=new THREE.GridHelper(16,16,0xdddddd,0xeeeeee); grid.position.y=-2.2; scene.add(grid); }
    function animate(fn){ function loop(){ requestAnimationFrame(loop); fn(Date.now()*0.001); renderer.render(scene,camera); } loop(); }
    if(name==="trench"){
      var A=new THREE.Vector3(-3,-1.2,0), B=new THREE.Vector3(1,-1.2,0), C=new THREE.Vector3(1,1.8,0);
      addGrid(); addArrow(A,B,0x1d4f91); addArrow(B,C,0x1d4f91); addArrow(A,C,0xc0392b);
      [A,B,C].forEach(function(p){ var s=new THREE.Mesh(new THREE.SphereGeometry(0.18,12,10), new THREE.MeshStandardMaterial({color:0x1d4f91})); s.position.copy(p); scene.add(s); });
      renderer.render(scene,camera);
    } else if(name==="vector-add"||name==="force-add"){
      addGrid(); if(name==="force-add"){ var o2=new THREE.Vector3(-4,0,0), a2=new THREE.Vector3(-2,0,0), b2=new THREE.Vector3(1.5,0,0), c2=new THREE.Vector3(4,0,0); addArrow(o2,a2,0x0f5c54); addArrow(a2,b2,0x0f5c54); addArrow(b2,c2,0x0f5c54); addArrow(o2,c2,0xc0392b); }
      else { var o=new THREE.Vector3(-3,0,0), a=new THREE.Vector3(-1,1.5,0), b=new THREE.Vector3(2,0.3,0); addArrow(o,a,0x0f5c54); var ab=new THREE.Vector3().addVectors(a,b); addArrow(a,ab,0x0f5c54); addArrow(o,ab,0xc0392b); }
      renderer.render(scene,camera);
    } else if(name==="peter"){
      addGrid(); var O=new THREE.Vector3(-2,0,0), P=new THREE.Vector3(2,0,0);
      var pathRed=new THREE.EllipseCurve(0,0,2.2,2.2,0,Math.PI,false,0); var ptsR=pathRed.getPoints(20);
      var geomR=new THREE.BufferGeometry().setFromPoints(ptsR.map(function(p){ return new THREE.Vector3(p.x,p.y,0);})); var lineR=new THREE.Line(geomR, new THREE.LineBasicMaterial({color:0xc0392b})); scene.add(lineR);
      var pathG=new THREE.EllipseCurve(0,0,2.2,2.2,Math.PI,Math.PI*2,false,0); var ptsG=pathG.getPoints(20);
      var geomG=new THREE.BufferGeometry().setFromPoints(ptsG.map(function(p){ return new THREE.Vector3(p.x,p.y,0);})); var lineG=new THREE.Line(geomG, new THREE.LineBasicMaterial({color:0x1d4f91})); scene.add(lineG);
      renderer.render(scene,camera);
    } else if(name==="st-vt"){
      addGrid(); var o=new THREE.Vector3(-3.5,-2,0), a=new THREE.Vector3(3.5,2,0); addArrow(o,a,0x0f5c54);
      var dot=new THREE.Mesh(new THREE.SphereGeometry(0.2,10,8), new THREE.MeshStandardMaterial({color:0xc0392b})); dot.position.copy(o); scene.add(dot);
      animate(function(t){ var p=(Math.sin(t*0.6)*0.5+0.5); dot.position.lerpVectors(o,a,p); });
    } else if(name==="uam"){
      addGrid(); var v0=new THREE.Vector3(-3.5,-1.5,0), v1=new THREE.Vector3(3.5,2.2,0); addArrow(v0,v1,0x0f5c54);
      for(var i=0;i<7;i++){ var d=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,6), new THREE.MeshStandardMaterial({color:0xc0392b})); d.position.set(-3.5+i*1.1, -1.5+i*0.55,0); scene.add(d); }
      renderer.render(scene,camera);
    } else if(name==="freefall"){
      addGrid(); var top=new THREE.Vector3(0,2.5,0), bottom=new THREE.Vector3(0,-2,0); addArrow(top,bottom,0xc0392b);
      var ball=new THREE.Mesh(new THREE.SphereGeometry(0.28,12,10), new THREE.MeshStandardMaterial({color:0x1d4f91})); ball.position.copy(top); scene.add(ball);
      animate(function(t){ var p=(t*0.5)%2; var y=2.5 - (p>1? (2-p)*2.5*0.8 : p*2.5*0.8); ball.position.y=y; });
    } else {
      addGrid(); var s=new THREE.Vector3(-3.2,0,0), e=new THREE.Vector3(3.2,0,0); addArrow(s,e,0x0f5c54);
      var dot=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,10), new THREE.MeshStandardMaterial({color:0xc0392b})); scene.add(dot);
      animate(function(t){ var p=(Math.sin(t*0.8)*0.5+0.5); dot.position.lerpVectors(s,e,p); });
    }
  }
  function boot(){ var cvs=document.querySelectorAll("canvas.scene-canvas"); for(var i=0;i<cvs.length;i++) initOne(cvs[i]); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(window);
