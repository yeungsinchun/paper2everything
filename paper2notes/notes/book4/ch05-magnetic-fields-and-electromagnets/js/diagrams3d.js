
(function(global){
  "use strict";
  var THREE = global.THREE;
  var scenes = {};
  function stage(canvas, fit){
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    var camera = new THREE.PerspectiveCamera(32, canvas.clientWidth / canvas.clientHeight || 1.6, 0.1, 100);
    camera.position.set(0,1.5,8);
    camera.lookAt(0,0,0);
    var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    scene.add(new THREE.AmbientLight(0xffffff,0.85));
    var dl = new THREE.DirectionalLight(0xffffff,0.9);
    dl.position.set(4,6,5);
    scene.add(dl);
    function resize(){
      var w=canvas.clientWidth||640, h=canvas.clientHeight||360;
      renderer.setSize(w,h,false);
      camera.aspect=w/Math.max(h,1);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);
    return {scene:scene, camera:camera, renderer:renderer};
  }
  function placeholder(host, name){
    var canvas=host.querySelector("canvas");
    if(!canvas||!THREE) return;
    var gfx=stage(canvas);
    // simple placeholder geometry per scene name
    var geo, mat, mesh;
    if(name.includes("coulomb")||name.includes("efield")||name.includes("current")){
      geo=new THREE.SphereGeometry(0.35,24,16);
      mat=new THREE.MeshStandardMaterial({color:0x2a62a8, roughness:0.5});
      mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(0,0,0);
      gfx.scene.add(mesh);
      var arr=new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(-0.8,0,0),1.6,0xc0392b,0.18,0.12);
      gfx.scene.add(arr);
    } else if(name.includes("wire")||name.includes("coil")||name.includes("solenoid")||name.includes("magnet")||name.includes("bar")){
      geo=new THREE.CylinderGeometry(0.12,0.12,2.2,20);
      mat=new THREE.MeshStandardMaterial({color:0x6b7380});
      mesh=new THREE.Mesh(geo,mat);
      mesh.rotation.z=Math.PI/2;
      gfx.scene.add(mesh);
      var hf = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,-0.7,0),1.4,0x1d4f91,0.16,0.1);
      gfx.scene.add(hf);
    } else if(name.includes("flux")||name.includes("lenz")||name.includes("generator")||name.includes("eddy")||name.includes("transformer")||name.includes("grid")||name.includes("ac")||name.includes("rms")){
      geo=new THREE.TorusGeometry(0.6,0.08,12,32);
      mat=new THREE.MeshStandardMaterial({color:0xd4a017});
      mesh=new THREE.Mesh(geo,mat);
      gfx.scene.add(mesh);
      mesh.rotation.x=Math.PI/2;
    } else {
      geo=new THREE.BoxGeometry(1.2,0.8,0.6);
      mat=new THREE.MeshStandardMaterial({color:0x0f5c54});
      mesh=new THREE.Mesh(geo,mat);
      gfx.scene.add(mesh);
    }
    function frame(){
      requestAnimationFrame(frame);
      if(mesh) mesh.rotation.y+=0.005;
      gfx.renderer.render(gfx.scene, gfx.camera);
    }
    requestAnimationFrame(frame);
    scenes[name]={snapshot:function(){return {name:name};}};
  }
  function init(){
    var hosts=document.querySelectorAll("[data-scene]");
    hosts.forEach(function(h){
      var name=h.getAttribute("data-scene");
      placeholder(h,name);
    });
    // replay handling
    document.querySelectorAll("[data-replay]").forEach(function(btn){
      btn.addEventListener("click",function(){
        var id=btn.getAttribute("data-replay");
        var host=document.getElementById(id);
        if(host) host.dispatchEvent(new Event("notes-replay"));
      });
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init); else init();
  global.NotesScenes=scenes;
})(window);
