import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GUI } from "lil-gui";
import { InfiniteGridHelper } from "./InfiniteGridHelper";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x63b4b6);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000.0
);
camera.position.set(11.7, 1, -11.2);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const textures = [
  "textures/dog_texture.png",
  "textures/cat.png",
  "textures/minecraft_grass.jpg",
  "textures/python.png"
].map((name) => {
  const texture = textureLoader.load(name);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
});

const gui = new GUI();
gui.addColor(scene, "background").name("Background color");

const cameraGui = gui.addFolder("Camera position");
cameraGui.add(camera.position, "x").name("X").listen();
cameraGui.add(camera.position, "y").name("Y").listen();
cameraGui.add(camera.position, "z").name("Z").listen();

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.minDistance = 2;
orbitControls.maxDistance = 50;
orbitControls.screenSpacePanning = false;

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener( "dragging-changed", (event) => { orbitControls.enabled = !event.value; });

const transformControlsGroup = new THREE.Group();
transformControlsGroup.add(transformControls.getHelper());
scene.add(transformControlsGroup);

const objects = [];

let selectedObject = null;
let selectedObjectGui = null;


scene.add(new InfiniteGridHelper(1, 1, 0xaaaaaa));

const objectLoader = new OBJLoader();

function loadObject({title, scale, xpos, ypos, zpos, xrot, yrot, zrot, texture_index}){
  let dest = "models/" + title;
  objectLoader.load(dest, (obj) => {
    const object = obj.children[0];
    object.scale.set(scale, scale, scale);
    object.position.set(xpos, ypos, zpos);
    object.rotation.set(xrot, yrot, zrot);
    object.material = new THREE.MeshPhongMaterial({ map: textures[texture_index] });
    objects.push(object);
    scene.add(object);
  });
}

loadObject({title: "merin.obj", scale: 4, xpos: -12, ypos: 0, zpos: 20, xrot: 0, yrot: 0.53, zrot: 0, texture_index: 2});
loadObject({title: "dog.obj", scale: 3.02, xpos: -4, ypos: 3.9, zpos: 18.8, xrot: 3.13, yrot: 0.8, zrot: -3.08, texture_index: 0});
loadObject({title: "toilet.obj", scale: 9.4, xpos: 1.1, ypos: 0, zpos: 21.4, xrot: 3.14, yrot: -0.58, zrot: 3.14, texture_index: 3});
loadObject({title: "cat.obj", scale: 7.2, xpos: -9.3, ypos: 5.5, zpos: 9.7, xrot: 0.18, yrot: 0.29, zrot: 0, texture_index: 1});

const lights = [];

function setLightSource({light, x, y, z}){
  light.position.set(x, y, z);
  scene.add(light);
  return light;
}

function createMesh({meshGeometry, meshMaterial, x, y, z, light}){
  const mesh = new THREE.Mesh(meshGeometry, meshMaterial);
  mesh.position.set(x, y, z);
  mesh.userData.light = light;
  scene.add(mesh);

  objects.push(mesh);

  return mesh;
}

function createLightMesh({ color, x, y, z, light, targeted, tx, ty, tz }){

  const meshGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const meshMaterial = new THREE.MeshBasicMaterial({ color });

  const sourceMesh = createMesh({ meshGeometry, meshMaterial, x, y, z, light });
  
  if (targeted){
    const targetMesh = createMesh({ meshGeometry, meshMaterial, x: tx, y: ty, z: tz, light });
    light.target = targetMesh;
  }

  return sourceMesh;
}

function createLightSource({ x, y, z, tx, ty, tz, color, intensity, type }){

  let light;
  let targeted;
  let helper;

  switch(type){
    case "point":
      light = new THREE.PointLight(color, intensity);
      targeted = false;
      break;
    case "direction":
      light = new THREE.DirectionalLight(color, intensity);
      targeted = true;
      break;
    case "spot":
      light = new THREE.SpotLight(color, intensity);
      targeted = true;
      light.angle = 0.45;
      break;
  }

  light = setLightSource({ light, x, y, z });

  let sourceMesh = createLightMesh({ color, x, y, z, light, targeted, tx, ty, tz });

  if (targeted){
    if (type == "direction"){
      helper = new THREE.DirectionalLightHelper(light);
    } else {
      helper = new THREE.SpotLightHelper(light);
    }
      scene.add(helper);
      lights.push({ light, mesh: sourceMesh, helper });
  } else {
    lights.push({ light, mesh: sourceMesh });
  }
}

const ambientLight = new THREE.AmbientLight(0x3f3f3f, 5);
scene.add(ambientLight);

const ambientLightGui = gui.addFolder("Ambient Light");
ambientLightGui.addColor(ambientLight, "color").name("Color");
ambientLightGui.add(ambientLight, "intensity", 0, 100).name("Intensity");

createLightSource({ x: -19.18, y: +7.43, z: -6.5, color: 0xff0000, intensity: 50, type: "point" });
createLightSource({ x: -12.27, y: 6.5, z: 5.6, color: 0xffffff, intensity: 10, type: "point" });
createLightSource({ x: -7.94, y: 5.84, z: 3.23, color: 0xff7700, intensity: 25, type: "point" });
createLightSource({ x: -3.16, y: 11.49, z: 20.75, tx: -3.32, ty: 6.64, tz: 18.45, color: 0xffffff, intensity: 0.5, type: "direction" });
createLightSource({ x: -6.25, y: 4.23, z: 9.51, tx: 1.82, ty: 3.7, tz: 21.7, color: 0xffff80, intensity: 200, type: "spot" });
createLightSource({ x: -11.42, y: 4.23, z: 13.33, tx: -4.52, ty: 3.7, tz: 25.3, color: 0xffff80, intensity: 200, type: "spot" });

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "T":
    case "t":
      transformControls.setMode("translate");
      break;
    case "R":
    case "r":
      if (!selectedObject.userData.light) {
        transformControls.setMode("rotate");
      }
      break;
    case "S":
    case "s":
      if (!selectedObject.userData.light) {
        transformControls.setMode("scale");
      }
      break;
  }
});

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

let dragging = false;
renderer.domElement.addEventListener("mousedown", () => (dragging = false));
renderer.domElement.addEventListener("mousemove", () => (dragging = true));
renderer.domElement.addEventListener("mouseup", (event) => {

  if (dragging) return;

  const mouse = new THREE.Vector2();
  mouse.x = +(event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  transformControls.detach();
  selectedObject?.material?.emissive?.set(0);

  selectedObjectGui?.destroy();
  selectedObjectGui = null;

  selectedObject = raycaster.intersectObjects(objects, true).at(0)?.object;

  if (selectedObject) {

    selectedObject.material.emissive?.set(0x505050);
    transformControls.attach(selectedObject);

    selectedObjectGui = gui.addFolder("Selected object");

    const positionGui = selectedObjectGui.addFolder("Position");
    positionGui.add(selectedObject.position, "x").name("X").listen();
    positionGui.add(selectedObject.position, "y").name("Y").listen();
    positionGui.add(selectedObject.position, "z").name("Z").listen();

    const selectedLight = selectedObject.userData.light;
    if (selectedLight) {
      transformControls.setMode("translate");

      const lightGui = selectedObjectGui.addFolder("Light");
      lightGui.addColor(selectedLight, "color").name("Color");
      if (selectedLight.type == "PointLight") {
        lightGui.add(selectedLight, "intensity", 0, 200).name("Intensity");
        lightGui.add(selectedLight, "decay", 0, 5).name("Decay");

      } else if (selectedLight.type == "SpotLight") {
        lightGui.add(selectedLight, "intensity", 0, 200).name("Intensity");
        lightGui.add(selectedLight, "angle", 0, Math.PI / 2).name("Angle");

      } else if (selectedLight.type == "DirectionalLight") {
        lightGui.add(selectedLight, "intensity", 0, 10).name("Intensity");
      }

    } else {

      const scaleGui = selectedObjectGui.addFolder("Scale");
      scaleGui.add(selectedObject.scale, "x").name("X").listen();
      scaleGui.add(selectedObject.scale, "y").name("Y").listen();
      scaleGui.add(selectedObject.scale, "z").name("Z").listen();

      const rotationGui = selectedObjectGui.addFolder("Rotation");
      rotationGui.add(selectedObject.rotation, "x").name("X").listen();
      rotationGui.add(selectedObject.rotation, "y").name("Y").listen();
      rotationGui.add(selectedObject.rotation, "z").name("Z").listen();

      const textureGui = selectedObjectGui.addFolder("Texture");
      textureGui.add(selectedObject.material.map.offset, "x", 0, 1).name("Offset X");
      textureGui.add(selectedObject.material.map.offset, "y", 0, 1).name("Offset Y");

      textureGui.add(selectedObject.material.map, "rotation", 0, 2 * Math.PI).name("Rotation");
    }
  }
});

renderer.setAnimationLoop(() => {
  orbitControls.update();

  for (const { light, mesh, helper } of lights) {
    light.position.copy(mesh.position);
    mesh.material.color.copy(light.color);

    if (light.type == "SpotLight") {
      light.distance = light.target.position.distanceTo(light.position);
    }

    helper?.update();
  }

  renderer.render(scene, camera);
});