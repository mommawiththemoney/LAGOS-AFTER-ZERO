import * as THREE from 'three';
import { soundEngine } from './audio';

// Reusable math vectors to prevent GC allocations
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();

export interface BoxCollider {
  min: THREE.Vector3;
  max: THREE.Vector3;
  isInteractable?: boolean;
  name?: string;
  interactId?: string;
}

export class PlayerCharacter {
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.9, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotationY: number = 0;
  public isGrounded: boolean = true;
  public isMoving: boolean = false;
  public isSprinting: boolean = false;
  
  // Character sub-parts for procedural animation
  private torso!: THREE.Mesh;
  private head!: THREE.Mesh;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private backpack!: THREE.Mesh;
  public flashlightLight!: THREE.SpotLight;
  public flashlightMesh!: THREE.Mesh;
  public flashlightTarget!: THREE.Object3D;
  public isFlashlightOn: boolean = true;

  // Animation cycle
  private walkTime: number = 0;
  private footstepTimer: number = 0;

  // Camera settings
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.25; // slight downward angle
  public cameraDistance: number = 3.6;
  public currentCameraPos: THREE.Vector3 = new THREE.Vector3(0, 2.5, 5);

  // Player bounding cylinder/box for collisions
  public radius: number = 0.45;
  public height: number = 1.8;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    this.buildCharacterMesh();
    scene.add(this.mesh);
    this.mesh.position.copy(this.position);
  }

  /**
   * Build composite 8-part procedural survivor model
   */
  private buildCharacterMesh() {
    // Shared materials
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x3d433b, // faded army olive jacket
      roughness: 0.8,
      metalness: 0.1,
    });
    const cargoPantsMat = new THREE.MeshStandardMaterial({
      color: 0x2b2b2b, // dark charcoal cargo pants
      roughness: 0.9,
      metalness: 0.05,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x5a3d28, // rich deep skin tone
      roughness: 0.6,
      metalness: 0.0,
    });
    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x7c4d28, // weathered leather / canvas tan
      roughness: 0.85,
    });
    const bandanaMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // red survivor cloth bandana
      roughness: 0.7,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
    });

    // 1. Torso
    const torsoGeom = new THREE.BoxGeometry(0.5, 0.65, 0.32);
    this.torso = new THREE.Mesh(torsoGeom, jacketMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // 2. Head & Bandana
    const headGeom = new THREE.BoxGeometry(0.26, 0.28, 0.26);
    this.head = new THREE.Mesh(headGeom, skinMat);
    this.head.position.y = 1.55;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    const bandanaGeom = new THREE.BoxGeometry(0.28, 0.09, 0.28);
    const bandana = new THREE.Mesh(bandanaGeom, bandanaMat);
    bandana.position.y = 0.05;
    this.head.add(bandana);

    // 3. Survivor Backpack & Bedroll
    const bpGeom = new THREE.BoxGeometry(0.42, 0.5, 0.22);
    this.backpack = new THREE.Mesh(bpGeom, backpackMat);
    this.backpack.position.set(0, 1.08, -0.25);
    this.backpack.castShadow = true;
    this.mesh.add(this.backpack);

    const bedrollGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.44, 8);
    bedrollGeom.rotateZ(Math.PI / 2);
    const bedroll = new THREE.Mesh(bedrollGeom, new THREE.MeshStandardMaterial({ color: 0x475569 }));
    bedroll.position.set(0, 0.3, 0);
    this.backpack.add(bedroll);

    // 4. Arms with shoulder pivots
    const armGeom = new THREE.BoxGeometry(0.14, 0.55, 0.14);
    armGeom.translate(0, -0.25, 0); // pivot at shoulder

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.33, 1.32, 0);
    const leftArmMesh = new THREE.Mesh(armGeom, jacketMat);
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.33, 1.32, 0);
    const rightArmMesh = new THREE.Mesh(armGeom, jacketMat);
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    this.mesh.add(this.rightArm);

    // 5. Flashlight in right hand
    const flashGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.22, 8);
    flashGeom.rotateX(Math.PI / 2);
    this.flashlightMesh = new THREE.Mesh(flashGeom, new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.8, roughness: 0.3 }));
    this.flashlightMesh.position.set(0, -0.5, 0.12);
    this.rightArm.add(this.flashlightMesh);

    // Flashlight SpotLight
    this.flashlightLight = new THREE.SpotLight(0xfff7e6, 3.5, 26, Math.PI / 6, 0.35, 1.2);
    this.flashlightLight.position.set(0, 0, 0.1);
    this.flashlightLight.castShadow = true;
    this.flashlightLight.shadow.mapSize.width = 512;
    this.flashlightLight.shadow.mapSize.height = 512;
    this.flashlightLight.shadow.bias = -0.001;

    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, 10);
    this.mesh.add(this.flashlightTarget);
    this.flashlightLight.target = this.flashlightTarget;

    this.mesh.add(this.flashlightLight);
    this.flashlightLight.position.set(0.35, 1.0, 0.3);

    // 6. Legs with hip pivots
    const legGeom = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    legGeom.translate(0, -0.32, 0); // pivot at hip

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(legGeom, cargoPantsMat);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.15, 0.25), bootMat);
    leftBoot.position.set(0, -0.66, 0.03);
    this.leftLeg.add(leftBoot);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(legGeom, cargoPantsMat);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.15, 0.25), bootMat);
    rightBoot.position.set(0, -0.66, 0.03);
    this.rightLeg.add(rightBoot);
    this.mesh.add(this.rightLeg);
  }

  public setFlashlight(enabled: boolean) {
    this.isFlashlightOn = enabled;
    this.flashlightLight.visible = enabled;
    soundEngine.playFlashlightClick(enabled);
  }

  public toggleFlashlight(): boolean {
    this.setFlashlight(!this.isFlashlightOn);
    return this.isFlashlightOn;
  }

  /**
   * Update character physics, input movement, animation & collisions
   */
  public update(
    delta: number,
    input: { forward: number; strafe: number; sprint: boolean; jump: boolean },
    colliders: BoxCollider[],
    canSprint: boolean
  ) {
    const dt = Math.min(delta, 0.1);
    
    // Calculate movement vector relative to camera yaw
    _forward.set(Math.sin(this.cameraYaw), 0, Math.cos(this.cameraYaw)).normalize();
    _right.set(Math.sin(this.cameraYaw + Math.PI / 2), 0, Math.cos(this.cameraYaw + Math.PI / 2)).normalize();

    _moveDir.set(0, 0, 0);
    if (input.forward !== 0) _moveDir.addScaledVector(_forward, input.forward);
    if (input.strafe !== 0) _moveDir.addScaledVector(_right, input.strafe);

    const hasInput = _moveDir.lengthSq() > 0.001;
    this.isMoving = hasInput;
    this.isSprinting = hasInput && input.sprint && canSprint;

    if (hasInput) {
      _moveDir.normalize();
      const speed = this.isSprinting ? 7.6 : 3.8;
      
      // Face movement direction smoothly
      const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
      let diff = targetAngle - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1, dt * 14);

      // Move velocity in X and Z
      this.velocity.x = _moveDir.x * speed;
      this.velocity.z = _moveDir.z * speed;
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 16, dt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 16, dt);
    }

    // Gravity & Jump
    if (input.jump && this.isGrounded) {
      this.velocity.y = 5.2;
      this.isGrounded = false;
    }

    this.velocity.y -= 15.0 * dt; // gravity
    if (this.velocity.y < -20) this.velocity.y = -20;

    // Tentative new position
    const nextX = this.position.x + this.velocity.x * dt;
    const nextY = this.position.y + this.velocity.y * dt;
    const nextZ = this.position.z + this.velocity.z * dt;

    // Check collisions on X axis
    if (!this.checkCollision(nextX, this.position.y, this.position.z, colliders)) {
      this.position.x = nextX;
    } else {
      this.velocity.x = 0;
    }

    // Check collisions on Z axis
    if (!this.checkCollision(this.position.x, this.position.y, nextZ, colliders)) {
      this.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }

    // Vertical collision with ground / floors
    if (nextY <= 0.0) {
      this.position.y = 0.0;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      // Check box colliders below
      let hitGround = false;
      const playerFeet = nextY;
      for (const col of colliders) {
        if (
          this.position.x + this.radius > col.min.x &&
          this.position.x - this.radius < col.max.x &&
          this.position.z + this.radius > col.min.z &&
          this.position.z - this.radius < col.max.z
        ) {
          if (this.position.y >= col.max.y - 0.25 && playerFeet <= col.max.y) {
            this.position.y = col.max.y;
            this.velocity.y = 0;
            this.isGrounded = true;
            hitGround = true;
            break;
          }
        }
      }
      if (!hitGround) {
        this.position.y = nextY;
        this.isGrounded = false;
      }
    }

    // Update mesh transform
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    // Flashlight target sync
    this.flashlightTarget.position.set(
      Math.sin(this.rotationY) * 12,
      -0.2,
      Math.cos(this.rotationY) * 12
    );

    // Procedural animation (walking / sprinting stride swing)
    if (this.isMoving && this.isGrounded) {
      const animSpeed = this.isSprinting ? 14 : 9;
      this.walkTime += dt * animSpeed;

      const swing = Math.sin(this.walkTime) * (this.isSprinting ? 0.75 : 0.45);
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing * 0.8;
      this.rightArm.rotation.x = swing * 0.4; // held flashlight stays more steady
      this.torso.position.y = 1.05 + Math.abs(Math.sin(this.walkTime * 2)) * 0.04;

      // Footstep sound trigger
      this.footstepTimer += dt * animSpeed;
      if (this.footstepTimer > Math.PI) {
        soundEngine.playFootstep(this.isSprinting);
        this.footstepTimer = 0;
      }
    } else {
      // Return smoothly to idle
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0, 10, dt);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0, 10, dt);
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0, 10, dt);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0, 10, dt);
      this.torso.position.y = THREE.MathUtils.damp(this.torso.position.y, 1.05, 10, dt);
      this.footstepTimer = 0;
    }
  }

  /**
   * Collision test against environment AABB boxes
   */
  private checkCollision(x: number, y: number, z: number, colliders: BoxCollider[]): boolean {
    const minX = x - this.radius;
    const maxX = x + this.radius;
    const minY = y;
    const maxY = y + this.height;
    const minZ = z - this.radius;
    const maxZ = z + this.radius;

    for (const col of colliders) {
      if (col.isInteractable) continue; // interactables don't block movement
      if (
        maxX > col.min.x &&
        minX < col.max.x &&
        maxY > col.min.y &&
        minY < col.max.y &&
        maxZ > col.min.z &&
        minZ < col.max.z
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Update third-person camera with smooth follow and collision avoidance
   */
  public updateCamera(camera: THREE.PerspectiveCamera, delta: number, colliders: BoxCollider[]) {
    const dt = Math.min(delta, 0.1);

    // Target look-at point (around player chest/head)
    _targetPos.set(this.position.x, this.position.y + 1.45, this.position.z);

    // Desired camera position in spherical coordinates relative to yaw/pitch
    const horizDist = this.cameraDistance * Math.cos(this.cameraPitch);
    const vertDist = this.cameraDistance * Math.sin(this.cameraPitch);

    _camOffset.set(
      -Math.sin(this.cameraYaw) * horizDist,
      vertDist,
      -Math.cos(this.cameraYaw) * horizDist
    );

    const idealCamPos = _targetPos.clone().add(_camOffset);

    // Raycast from player center toward camera to prevent wall clipping
    _rayOrigin.copy(_targetPos);
    _rayDir.subVectors(idealCamPos, _targetPos);
    const maxDist = _rayDir.length();
    _rayDir.normalize();

    let actualDistance = maxDist;

    // Check collision with solid buildings
    for (const col of colliders) {
      if (col.isInteractable) continue;
      // Ray-AABB intersection check
      const hitDist = rayIntersectAABB(_rayOrigin, _rayDir, col.min, col.max);
      if (hitDist !== null && hitDist > 0.3 && hitDist < actualDistance) {
        actualDistance = Math.max(0.6, hitDist - 0.25);
      }
    }

    const finalCamPos = _rayOrigin.clone().addScaledVector(_rayDir, actualDistance);

    // Silky exponential damping
    this.currentCameraPos.x = THREE.MathUtils.damp(this.currentCameraPos.x, finalCamPos.x, 15, dt);
    this.currentCameraPos.y = THREE.MathUtils.damp(this.currentCameraPos.y, finalCamPos.y, 15, dt);
    this.currentCameraPos.z = THREE.MathUtils.damp(this.currentCameraPos.z, finalCamPos.z, 15, dt);

    camera.position.copy(this.currentCameraPos);
    camera.lookAt(_targetPos);
  }
}

/**
 * Fast Ray - AABB box intersection
 */
function rayIntersectAABB(origin: THREE.Vector3, dir: THREE.Vector3, boxMin: THREE.Vector3, boxMax: THREE.Vector3): number | null {
  let tmin = (boxMin.x - origin.x) / (dir.x !== 0 ? dir.x : 1e-8);
  let tmax = (boxMax.x - origin.x) / (dir.x !== 0 ? dir.x : 1e-8);
  if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

  let tymin = (boxMin.y - origin.y) / (dir.y !== 0 ? dir.y : 1e-8);
  let tymax = (boxMax.y - origin.y) / (dir.y !== 0 ? dir.y : 1e-8);
  if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

  if (tmin > tymax || tymin > tmax) return null;
  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;

  let tzmin = (boxMin.z - origin.z) / (dir.z !== 0 ? dir.z : 1e-8);
  let tzmax = (boxMax.z - origin.z) / (dir.z !== 0 ? dir.z : 1e-8);
  if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

  if (tmin > tzmax || tzmin > tmax) return null;
  if (tzmin > tmin) tmin = tzmin;
  if (tzmax < tmax) tmax = tzmax;

  return tmin > 0 ? tmin : null;
}
