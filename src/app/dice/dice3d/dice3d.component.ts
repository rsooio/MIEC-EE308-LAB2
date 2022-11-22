import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { threeToCannon, ShapeType } from 'three-to-cannon';
import { debounceTime, fromEvent } from 'rxjs';

interface ternion {
  x: number
  y: number
  z: number
}

interface quaternion extends ternion {
  w: number
}

interface dice {
  body: CANNON.Body
  mesh: THREE.Mesh
  rotate?: CANNON.Quaternion
}

interface vector {
  position: ternion
  velocity: ternion
  angle: ternion
  axis: quaternion
  rotate?: quaternion
}


@Component({
  selector: 'app-dice3d',
  templateUrl: './dice3d.component.html',
  styleUrls: ['./dice3d.component.scss']
})
export class Dice3dComponent implements AfterViewInit {
  @ViewChild('canvas')
  private canvasRef!: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  @Input() public dimentions: { width: number, height: number } = { width: 5, height: 3 };

  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  private scene!: THREE.Scene;
  private clock = new THREE.Clock();
  private light?: THREE.SpotLight;
  private desk?: THREE.Mesh;

  private world!: CANNON.World;
  private diceBodyMaterial?: CANNON.Material;

  private oldElapsedTime = 0;

  private control!: OrbitControls;

  private dices: dice[] = [];
  private mesh?: THREE.Mesh;
  // private bowl?: THREE.Group;
  private shape?: CANNON.Shape;

  private sync = false;
  public done = new Promise<void>(r => r());
  private resolve?: () => void;

  private init = false;

  private generateWorld() {
    this.scene = new THREE.Scene();

    const light = new THREE.AmbientLight(0xf0f5fb, 0.8);
    this.scene.add(light);
    // this.scene.environment!.encoding = THREE.sRGBEncoding;

    // this.bowl?.scale.set(0.1, 0.1, 0.1);
    // this.scene.add(this.bowl!);
    // this.bowl?.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5);
    // this.bowl?.position.set(-2, 1.5, 0)
    // this.bowl!.castShadow = true;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    // this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;
    // this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(devicePixelRatio);

    this.reinit();
    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe({
        next: () => {
          this.canvas.style.width = '100%';
          this.canvas.style.height = '100%';
          this.reinit();
        },
      })

    this.world = new CANNON.World();
    this.world.allowSleep = true;
    this.world.gravity.set(0, 0, -9.8 * 16);
    // this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    (this.world.solver as CANNON.GSSolver).iterations = 16;

    this.diceBodyMaterial = new CANNON.Material();
    const deskBodyMaterial = new CANNON.Material();
    const barrierBodyMaterial = new CANNON.Material();
    this.world.addContactMaterial(new CANNON.ContactMaterial(deskBodyMaterial, this.diceBodyMaterial, {
      friction: 0.01,
      restitution: 0.5,
    }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(barrierBodyMaterial, this.diceBodyMaterial, {
      friction: 0,
      restitution: 0.5,
    }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.diceBodyMaterial, this.diceBodyMaterial, {
      friction: 0,
      restitution: 0.5,
    }));

    // const bowl = new CANNON.Body({
    //   mass: 0,
    //   material: deskBodyMaterial,
    // })
    // const {shape, offset, orientation } = threeToCannon(this.bowl!)!;
    // bowl.addShape(shape, offset, orientation);
    // this.world.addBody(bowl);

    this.world.addBody(new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: deskBodyMaterial,
    }));

    let barrier = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: barrierBodyMaterial,
    })
    barrier.position.set(0, this.dimentions.height * 0.93, 0);
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    this.world.addBody(barrier);

    barrier = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: barrierBodyMaterial,
    })
    barrier.position.set(0, -this.dimentions.height * 0.93, 0);
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(barrier);

    barrier = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: barrierBodyMaterial,
    })
    barrier.position.set(this.dimentions.width * 0.93, 0, 0);
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    this.world.addBody(barrier);

    barrier = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: barrierBodyMaterial,
    })
    barrier.position.set(-this.dimentions.width * 0.93, 0, 0);
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    this.world.addBody(barrier);
  }

  private reinit() {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    const aspect = Math.min(this.canvas.clientWidth / this.dimentions.width, this.canvas.clientHeight / this.dimentions.height);
    const cameraZ = this.canvas.clientHeight / aspect / Math.tan(10 * Math.PI / 180);
    if (this.camera) this.scene.remove(this.camera);
    const y = this.camera ? this.camera.position.y * cameraZ / this.camera.position.z : -10;
    this.camera = new THREE.PerspectiveCamera(20, this.canvas.clientWidth / this.canvas.clientHeight, 1, cameraZ * 2);
    this.camera.position.set(0, y, cameraZ);

    this.control = new OrbitControls(this.camera, this.canvas);
    this.control.enableDamping = true;
    this.control.dampingFactor = 0.1;
    this.control.enableZoom = false;
    this.control.enablePan = false;
    this.control.minPolarAngle = Math.PI * 0.5;
    this.control.maxPolarAngle = Math.PI * 0.9;
    this.control.minAzimuthAngle = 0;
    this.control.maxAzimuthAngle = 0;

    const longSide = Math.max(this.dimentions.width, this.dimentions.height);
    if (this.light) this.scene.remove(this.light);
    this.light = new THREE.SpotLight(0xefdfd5, 2);
    this.light.position.set(-longSide / 2, longSide / 2, longSide * 2);
    this.light.target.position.set(0, 0, 0);
    this.light.distance = longSide * 5;
    this.light.castShadow = true;
    this.light.shadow.camera.near = longSide / 10;
    this.light.shadow.camera.far = longSide * 5;
    this.light.shadow.camera.fov = 50;
    this.light.shadow.bias = 0.001;
    this.light.shadow.mapSize.set(4096, 4096);
    this.scene.add(this.light);

    if (this.desk) this.scene.remove(this.desk);
    const loader = new THREE.TextureLoader();
    this.desk = new THREE.Mesh(
      new THREE.PlaneGeometry(this.dimentions.width * 2, this.dimentions.height * 2, 1, 1),
      new THREE.MeshPhongMaterial({
        // color: 0xff9999,
        map: loader.load('/assets/model/WoodFineDark.jpg'),
        reflectivity: 1,
        specular: 0x222222,
        shininess: 20,
      }),
    )
    this.desk.receiveShadow = true;
    this.scene.add(this.desk);

    this.renderer.render(this.scene, this.camera);
    if (!this.init) this.init = true;
  }

  private startRenderingLoop() {
    let component: Dice3dComponent = this;
    (function render() {
      component.tick();
      requestAnimationFrame(render);
      component.renderer.render(component.scene, component.camera);
      // component.render();
    }());
  }

  private clearDices() {
    this.dices.forEach(dice => {
      if (dice.mesh) this.scene.remove(dice.mesh);
      this.world.removeBody(dice.body);
    });
    this.dices = [];
  }

  private getBody(vector: vector) {
    const body = new CANNON.Body({
      mass: 100,
      material: this.diceBodyMaterial,
      shape: this.shape,
      // shape: new CANNON.Box(new CANNON.Vec3(0.335, 0.335, 0.335)),
    });
    // body.sleepTimeLimit = 0.01;
    this.copy(body.position, vector.position);
    body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(vector.axis.x, vector.axis.y, vector.axis.z),
      vector.axis.w,
    );
    this.copy(body.angularVelocity, vector.angle);
    this.copy(body.velocity, vector.velocity);
    body.linearDamping = 0.1;
    body.angularDamping = 0.1;
    return body;
  }

  private addDices(vectors: vector[]) {
    vectors.forEach(vector => {
      const body = this.getBody(vector);
      this.world.addBody(body);

      const mesh = this.mesh!.clone();
      this.copy(mesh.position, vector.position);
      mesh.quaternion.setFromAxisAngle(new THREE.Vector3(vector.axis.x, vector.axis.y, vector.axis.z), vector.axis.w);
      if (vector.rotate) {
        const rotate = new CANNON.Quaternion;
        this.copy(rotate, vector.rotate);
        this.copy(mesh.quaternion, mesh.quaternion.multiply(new THREE.Quaternion(vector.rotate.x, vector.rotate.y, vector.rotate.z, vector.rotate.w)));
        this.dices.push({ body, mesh, rotate });
      } else {
        this.dices.push({ body, mesh });
      }
      this.scene.add(mesh);
    })
  }

  private makeRandom(seed: ternion) {
    const randomAngle = (Math.random() - 0.5) * 0.2 * Math.PI;
    return {
      x: seed.x * Math.cos(randomAngle) - seed.y * Math.sin(randomAngle),
      y: seed.x * Math.sin(randomAngle) + seed.y * Math.cos(randomAngle),
    }
  }

  private generateSeed(strength: number = 0.5): ternion {
    const x = this.dimentions.width * (Math.random() * 2 - 1);
    const y = this.dimentions.height * -(Math.random() * 2 - 1);
    return { x, y, z: strength * 40 }
  }

  private generateVector(seed: ternion): vector {
    const posRnd = this.makeRandom(seed);
    const velRnd = this.makeRandom(seed);
    const inertia = 13;

    return {
      position: {
        x: this.dimentions.width * (posRnd.x >= 0 ? -1 : 1) * 0.9,
        y: this.dimentions.height * (posRnd.y >= 0 ? -1 : 1) * 0.9,
        z: Math.random() * 2 + 4
      },
      velocity: {
        x: velRnd.x * seed.z,
        y: velRnd.y * seed.z,
        z: -3
      },
      angle: {
        x: -posRnd.y * (Math.random() * 5 + inertia),
        y: posRnd.x * (Math.random() * 5 + inertia),
        z: 0,
      },
      axis: {
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        w: Math.random(),
      }
    }
  }

  public generateVectors(strength: number = 0.5, quantity: number = 6): vector[] {
    const seed = this.generateSeed(strength);
    const vectors: vector[] = [];
    for (let i = 0; i < quantity; i++) {
      vectors.push(this.generateVector(seed));
    }
    return vectors;
  }

  private getDiceValue(dice: dice) {
    const up = new CANNON.Vec3(0, 0, 1);
    const iQuaternion = new CANNON.Quaternion;
    if (dice.rotate) dice.body.quaternion.mult(dice.rotate).inverse(iQuaternion);
    else dice.body.quaternion.inverse(iQuaternion);
    iQuaternion.vmult(up, up);

    const result: { angle: number, value: number }[] = [];
    result.push({ angle: Math.abs(up.x), value: up.x > 0 ? 2 : 5 });
    result.push({ angle: Math.abs(up.y), value: up.y > 0 ? 1 : 6 });
    result.push({ angle: Math.abs(up.z), value: up.z > 0 ? 4 : 3 });

    return result.sort((a, b) => b.angle - a.angle)[0].value;
  }

  public getDiceValues() {
    return this.dices.map(dice => this.getDiceValue(dice));
  }

  private rotateQuaternion(from: number, to: number) {
    type rotation = [0 | 5 | 6 | 3, 0 | 1 | -1 | 2];

    const rq = (param: rotation) => {
      const rotate = new CANNON.Quaternion;
      const axis = new CANNON.Vec3;
      if (param[0] == 5) axis.set(1, 0, 0);
      if (param[0] == 6) axis.set(0, 1, 0);
      if (param[0] == 3) axis.set(0, 0, 1);
      rotate.setFromAxisAngle(axis, Math.PI * 0.5 * param[1]);
      return rotate;
    };

    const mappingTable: [0 | 5 | 6 | 3, 0 | 1 | -1 | 2][][] = [
      [[0, 0], [3, 1], [5, 1], [5, -1], [3, -1], [3, 2]],
      [[3, -1], [0, 0], [6, -1], [6, 1], [3, 2], [3, 1]],
      [[5, -1], [6, 1], [0, 0], [6, 2], [6, -1], [5, 1]],
      [[5, 1], [6, -1], [6, 2], [0, 0], [6, 1], [5, -1]],
      [[3, 1], [3, 2], [6, 1], [6, -1], [0, 0], [3, -1]],
      [[5, 2], [3, -1], [5, -1], [5, 1], [3, 1], [0, 0]]
    ]

    return rq(mappingTable[from - 1][to - 1]);
  }

  private simulateVectors(vectors: vector[]) {
    this.clearDices();
    this.addDices(vectors);
    while (this.dices.some(v => !v.body.sleepState)) {
      this.world.step(1 / 60);
    }
  }

  public shiftVectors(vectors: vector[], values: number[]): vector[] {
    this.simulateVectors(vectors);
    vectors.forEach((v, i) => {
      v.rotate = this.rotateQuaternion(this.getDiceValue(this.dices[i]), values[i] || values[i % values.length]);
    });
    return vectors;
  }

  public verifyVectors(vectors: vector[], values: number[]) {
    this.simulateVectors(vectors);
    return values.sort().join('') == this.getDiceValues().sort().join('');
  }

  public throw(vectors: vector[]) {
    this.clearDices();
    this.addDices(vectors);
    this.sync = true;
    this.done = new Promise<void>(r => this.resolve = r);
  }

  private tick() {
    const elapsedTime = this.clock.getElapsedTime();
    const deltaTime = elapsedTime - this.oldElapsedTime;
    this.oldElapsedTime = elapsedTime;
    if (this.sync) {
      this.world.step(1 / 60, deltaTime, 3);
      this.dices.forEach(v => {
        this.copy(v.mesh.position, v.body.position);
        if (v.rotate) this.copy(v.mesh.quaternion, v.body.quaternion.mult(v.rotate));
        else this.copy(v.mesh.quaternion, v.body.quaternion);
      });
      if (this.dices.every(dice => dice.body.sleepState)) {
        this.resolve!();
        this.sync = false;
      }
    }
  }

  private copy(a: ternion | quaternion, b: ternion | quaternion) {
    a.x = b.x;
    a.y = b.y;
    a.z = b.z;
    if ('w' in a && 'w' in b) {
      a.w = b.w;
    }
  }

  private loadDice() {
    const gltfLoader = new GLTFLoader();
    return new Promise<void>((resolve: () => void, reject: () => void) => {
      gltfLoader.load('/assets/model/dice/scene.gltf', gltf => {
        this.mesh = <THREE.Mesh>gltf.scene.children[0].children[0].children[0].children[0];
        this.mesh.geometry.translate(-0.67, 0, 0);
        this.mesh.castShadow = true;
        console.log(this.mesh.toJSON())

        this.shape = threeToCannon(this.mesh, { type: ShapeType.BOX })?.shape;
        resolve();

        // const objLoader = new OBJLoader();
        // objLoader.load('/assets/model/bowl.obj', obj => {
        //   this.bowl = obj;
        // })
      })
    })
  }

  constructor() { (window as any).bobing = this; }

  async ngAfterViewInit() {
    await this.loadDice();
    this.generateWorld();
    // const seed = this.generateSeed();
    // const vectors = this.shiftVectors(this.generateVectors(6), [1, 2, 3, 4, 5, 6]);
    // console.log(vectors);
    // this.throw(vectors);

    this.startRenderingLoop();
  }
}
