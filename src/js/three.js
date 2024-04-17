import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};
let controller, reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
export default class Three {
  constructor(canvas) {
    this.canvas = canvas;
    this.init();
    this.setResize();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, device.width / device.height, 0.1, 100);
    this.camera.position.set(0, 0, 2);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.xr.enabled = true;

    document.body.appendChild(ARButton.createButton(this.renderer, { requiredFeatures: ['hit-test'] }));

    this.geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32).translate(0, 0.1, 0);


    controller = this.renderer.xr.getController(0);
    controller.addEventListener('select', this.onSelect.bind(this));
    this.scene.add(controller);

    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    this.scene.add(reticle);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = false;

    this.clock = new THREE.Clock();

    this.setLights();
    this.setGeometry();
    this.addInteractiveObject(); // Method to add interactive object
    this.render();
  }

  onSelect() {
    if (reticle.visible) {
      const material = new THREE.MeshPhongMaterial({ color: 0xffffff * Math.random() });
      const mesh = new THREE.Mesh(this.geometry, material);
      reticle.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
      mesh.scale.y = Math.random() * 2 + 1;
      this.scene.add(mesh);
    }

  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff);
    this.scene.add(this.ambientLight);
  }

  setGeometry() {
    this.planeGeometry = new THREE.PlaneGeometry(1, 1, 128, 128);
    this.planeMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      wireframe: true,
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: {
        progress: { type: 'f', value: 0 }
      }
    });
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    // this.scene.add(this.planeMesh);
  }

  addInteractiveObject() {
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);  // Create a simple box geometry
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });  // Green, for visibility
    this.cube = new THREE.Mesh(geometry, material);  // Create the mesh
    this.cube.position.set(0, 0, -0.5);  // Position in front of the camera
    // this.scene.add(this.cube);
  }

  render() {
    this.renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {

        const referenceSpace = this.renderer.xr.getReferenceSpace();
        const session = this.renderer.xr.getSession();

        if (hitTestSourceRequested === false) {

          session.requestReferenceSpace('viewer').then(function (referenceSpace) {

            session.requestHitTestSource({ space: referenceSpace }).then(function (source) {

              hitTestSource = source;

            });

          });

          session.addEventListener('end', function () {

            hitTestSourceRequested = false;
            hitTestSource = null;

          });

          hitTestSourceRequested = true;

        }

        if (hitTestSource) {

          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length) {

            const hit = hitTestResults[0];

            reticle.visible = true;
            reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

          } else {
            console.log("not bvisble...")
            reticle.visible = false;

          }

        }

      }
      this.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  update() {
    const elapsedTime = this.clock.getElapsedTime();
    this.planeMaterial.uniforms.progress.value = elapsedTime;
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
