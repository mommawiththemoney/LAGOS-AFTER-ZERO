import * as THREE from 'three';
import { textureFactory } from './textures';
import { BoxCollider } from './character';
import { WorldCollectible } from './types';

export class WorldManager {
  public scene: THREE.Scene;
  public colliders: BoxCollider[] = [];
  public collectibles: WorldCollectible[] = [];
  public collectibleMeshes: Map<string, THREE.Object3D> = new Map();

  // Dynamic lights & environmental props
  public sunLight!: THREE.DirectionalLight;
  public moonLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public safehouseInteriorLight!: THREE.PointLight;
  public streetLights: THREE.PointLight[] = [];
  public rainParticles: THREE.Points | null = null;
  public radioBeaconMesh: THREE.Mesh | null = null;
  public roadBlockGateMesh: THREE.Group | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupLighting();
    this.buildSilentMainland();
    this.spawnInitialCollectibles();
  }

  /**
   * Set up cinematic 3-point environmental lighting with day/night balance
   */
  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0x7fb5e6, 0x24211e, 0.6);
    this.scene.add(this.hemiLight);

    // Sun light (warm key light with soft shadow mapping)
    this.sunLight = new THREE.DirectionalLight(0xfff1d0, 1.8);
    this.sunLight.position.set(45, 60, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    const d = 45;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0006;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // Moon light (cool indigo for eerie night)
    this.moonLight = new THREE.DirectionalLight(0x4a6fa5, 0.4);
    this.moonLight.position.set(-40, 50, -30);
    this.scene.add(this.moonLight);

    // Atmospheric horizon fog
    this.scene.fog = new THREE.FogExp2(0x1a2126, 0.015);
  }

  /**
   * Update day / night cycle and lighting colors
   * gameTime: 0.0 to 24.0 (hours)
   */
  public updateEnvironment(gameTime: number, delta: number) {
    // 6.0 = dawn, 12.0 = noon, 18.0 = dusk, 24.0/0.0 = midnight (Zero Hour)
    const angle = ((gameTime - 6) / 24) * Math.PI * 2;
    const sunHeight = Math.sin(angle);
    const sunHoriz = Math.cos(angle);

    this.sunLight.position.set(sunHoriz * 60, Math.max(-10, sunHeight * 60), 30);
    this.moonLight.position.set(-sunHoriz * 60, Math.max(-10, -sunHeight * 60), -30);

    const isDay = sunHeight > 0.05;
    const isTwilight = Math.abs(sunHeight) <= 0.15;

    if (isDay) {
      const dayFactor = Math.min(1, sunHeight * 2.5);
      this.sunLight.intensity = THREE.MathUtils.lerp(0.2, 1.8, dayFactor);
      this.sunLight.color.set(isTwilight ? 0xff8c42 : 0xfff3d6); // amber dawn/dusk
      this.hemiLight.intensity = THREE.MathUtils.lerp(0.2, 0.8, dayFactor);
      this.hemiLight.color.set(0x93c5fd); // daytime sky
      this.hemiLight.groundColor.set(0x3e352b);
      this.moonLight.intensity = 0.0;
      (this.scene.fog as THREE.FogExp2).color.set(isTwilight ? 0x6e4334 : 0x475569);
    } else {
      // Night (eerie Lagos after Zero Hour)
      const nightFactor = Math.min(1, Math.abs(sunHeight) * 2.0);
      this.sunLight.intensity = 0.0;
      this.moonLight.intensity = THREE.MathUtils.lerp(0.1, 0.55, nightFactor);
      this.hemiLight.intensity = 0.18;
      this.hemiLight.color.set(0x1e293b);
      this.hemiLight.groundColor.set(0x0f172a);
      (this.scene.fog as THREE.FogExp2).color.set(0x0a0e14);
    }

    // Street lights flickers at night
    const streetLightOn = !isDay || isTwilight;
    this.streetLights.forEach((light, i) => {
      light.visible = streetLightOn;
      if (streetLightOn && Math.random() < 0.015) {
        // Subtle faulty electrical grid flicker
        light.intensity = Math.random() * 2.0;
      } else if (streetLightOn) {
        light.intensity = 1.6;
      }
    });

    // Radio beacon red strobe
    if (this.radioBeaconMesh) {
      const pulse = (Math.sin(Date.now() * 0.006) + 1) * 0.5;
      (this.radioBeaconMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + pulse * 2.5;
    }

    // Gentle rain particle fall
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position;
      for (let i = 1; i < pos.count * 3; i += 3) {
        pos.array[i] -= 28 * delta;
        if (pos.array[i] < 0) {
          pos.array[i] = 40;
        }
      }
      pos.needsUpdate = true;
    }
  }

  /**
   * Set safehouse power state (powered generator turns on warm interior light)
   */
  public setSafehousePower(hasPower: boolean) {
    if (this.safehouseInteriorLight) {
      this.safehouseInteriorLight.intensity = hasPower ? 2.5 : 0.4;
      this.safehouseInteriorLight.color.set(hasPower ? 0xffeaae : 0x60a5fa);
    }
  }

  /**
   * Open the roadblock gate after player collects access card in Mission 5
   */
  public unlockRoadblockGate() {
    if (this.roadBlockGateMesh) {
      this.roadBlockGateMesh.position.y = 5.0; // lifted open
      // Remove or update the barrier collider
      const idx = this.colliders.findIndex((c) => c.name === 'roadblock_barrier');
      if (idx !== -1) {
        this.colliders.splice(idx, 1);
      }
    }
  }

  /**
   * Procedural construction of Region A: The Silent Mainland
   */
  private buildSilentMainland() {
    // 1. Terrain Ground
    const groundGeom = new THREE.PlaneGeometry(160, 160);
    groundGeom.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4a4339, // red-brown laterite dirt
      roughness: 0.95,
      metalness: 0.02,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Asphalt Roads & Intersections
    this.buildRoadNetwork();

    // 3. Player Safehouse (Damaged building with interior)
    this.buildSafehouseBuilding();

    // 4. Commercial District: Mama Ngozi Provision Store & Alaba Tech Repairs
    this.buildCommercialShops();

    // 5. Vehicles (Abandoned Lagos Danfo minibuses, Keke tricycle, sedan)
    this.buildAbandonedVehicles();

    // 6. Perimeter Walls, Gates, Streetlights & Generators
    this.buildUrbanProps();

    // 7. Tropical Royal Palm Trees & Vegetation
    this.buildTropicalFoliage();

    // 8. Roadblock to Region B (The Island Bridge)
    this.buildRoadblockToCheckpoint();

    // 9. Rain system (light atmospheric Lagos drizzle)
    this.setupRainSystem();
  }

  /**
   * Roads and sidewalks
   */
  private buildRoadNetwork() {
    const roadTex = textureFactory.getRoadTexture();
    const sidewalkTex = textureFactory.getSidewalkTexture();

    // Main Avenue (Adeniji Expressway) running along Z axis
    const mainRoadGeom = new THREE.PlaneGeometry(12, 120);
    mainRoadGeom.rotateX(-Math.PI / 2);
    const mainRoadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.85,
    });
    roadTex.repeat.set(1, 10);
    const mainRoad = new THREE.Mesh(mainRoadGeom, mainRoadMat);
    mainRoad.position.set(0, 0.02, 0);
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);

    // Cross street running along X axis
    const crossRoadGeom = new THREE.PlaneGeometry(100, 10);
    crossRoadGeom.rotateX(-Math.PI / 2);
    const crossRoadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.85,
    });
    const crossRoad = new THREE.Mesh(crossRoadGeom, crossRoadMat);
    crossRoad.position.set(0, 0.022, 15);
    crossRoad.receiveShadow = true;
    this.scene.add(crossRoad);

    // Sidewalks on Main Avenue
    const swMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.9,
    });
    sidewalkTex.repeat.set(1, 15);

    // Left Sidewalk
    const swLeft = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 120), swMat);
    swLeft.position.set(-7.5, 0.1, 0);
    swLeft.receiveShadow = true;
    this.scene.add(swLeft);

    // Right Sidewalk
    const swRight = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 120), swMat);
    swRight.position.set(7.5, 0.1, 0);
    swRight.receiveShadow = true;
    this.scene.add(swRight);
  }

  /**
   * The Player Safehouse:
   * A damaged 2-storey building with open doorway, interior room, bed cot,
   * workbench, storage crate, and damaged backup generator outside.
   */
  private buildSafehouseBuilding() {
    const wallTex = textureFactory.getWallTexture('#c9bc9c');
    const zincTex = textureFactory.getZincRoofTexture();
    const woodTex = textureFactory.getWoodTexture();

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ map: zincTex, roughness: 0.6, metalness: 0.3 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });

    const safehouseGroup = new THREE.Group();
    safehouseGroup.position.set(-16, 0, -8);

    // Safehouse floor
    const floorGeom = new THREE.BoxGeometry(12, 0.25, 14);
    const floorMesh = new THREE.Mesh(floorGeom, new THREE.MeshStandardMaterial({ color: 0x3d3832, roughness: 0.8 }));
    floorMesh.position.set(0, 0.125, 0);
    floorMesh.receiveShadow = true;
    safehouseGroup.add(floorMesh);

    // Walls with entrance doorway on +X face (facing street)
    // Back wall (-X)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 14), wallMat);
    backWall.position.set(-5.8, 2.75, 0);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    safehouseGroup.add(backWall);
    this.addBoxCollider(-21.8 - 0.3, 0, -15, -21.8 + 0.3, 6, -1);

    // Left wall (-Z)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(12, 5.5, 0.4), wallMat);
    leftWall.position.set(0, 2.75, -6.8);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    safehouseGroup.add(leftWall);
    this.addBoxCollider(-22, 0, -15 - 0.3, -10, 6, -15 + 0.3);

    // Right wall (+Z)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(12, 5.5, 0.4), wallMat);
    rightWall.position.set(0, 2.75, 6.8);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    safehouseGroup.add(rightWall);
    this.addBoxCollider(-22, 0, -1.2 - 0.3, -10, 6, -1.2 + 0.3);

    // Front wall (+X) with doorway opening in middle
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 5.5), wallMat);
    frontWallLeft.position.set(5.8, 2.75, -4.25);
    frontWallLeft.castShadow = true;
    safehouseGroup.add(frontWallLeft);
    this.addBoxCollider(-10.4, 0, -15, -9.8, 6, -9.5);

    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 5.5), wallMat);
    frontWallRight.position.set(5.8, 2.75, 4.25);
    frontWallRight.castShadow = true;
    safehouseGroup.add(frontWallRight);
    this.addBoxCollider(-10.4, 0, -6.5, -9.8, 6, -1);

    // Doorway lintel
    const frontLintel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 3.0), wallMat);
    frontLintel.position.set(5.8, 4.25, 0);
    safehouseGroup.add(frontLintel);

    // Corrugated pitched roof
    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 15), roofMat);
    roofLeft.position.set(-2.8, 6.1, 0);
    roofLeft.rotation.z = 0.2;
    roofLeft.castShadow = true;
    safehouseGroup.add(roofLeft);

    const roofRight = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 15), roofMat);
    roofRight.position.set(2.8, 6.1, 0);
    roofRight.rotation.z = -0.2;
    roofRight.castShadow = true;
    safehouseGroup.add(roofRight);

    // Interior furniture:
    // Bed / Sleeping Cot
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.4), woodMat);
    bedFrame.position.set(-4.2, 0.2, -4.8);
    bedFrame.castShadow = true;
    safehouseGroup.add(bedFrame);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.2), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    mattress.position.set(-4.2, 0.5, -4.8);
    safehouseGroup.add(mattress);
    this.addBoxCollider(-20.5, 0, -13.5, -18.0, 1.0, -11.5, true, 'safehouse_bed', 'interact_bed');

    // Crafting Workbench
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 1.2), woodMat);
    benchTop.position.set(-4.2, 1.0, 4.8);
    benchTop.castShadow = true;
    safehouseGroup.add(benchTop);

    // Bench legs
    for (const [bx, bz] of [[-5.3, 4.3], [-3.1, 4.3], [-5.3, 5.3], [-3.1, 5.3]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0), woodMat);
      leg.position.set(bx, 0.5, bz);
      safehouseGroup.add(leg);
    }
    this.addBoxCollider(-20.5, 0, -4.0, -18.0, 1.4, -1.8, true, 'safehouse_workbench', 'interact_workbench');

    // Safehouse Storage Locker / Chest
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.0), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 }));
    chest.position.set(-4.6, 0.4, 1.2);
    chest.castShadow = true;
    safehouseGroup.add(chest);
    this.addBoxCollider(-21.0, 0, -7.5, -19.5, 1.2, -6.0, true, 'safehouse_storage', 'interact_storage');

    // Desk for the Damaged Radio
    const radioDesk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.9), woodMat);
    radioDesk.position.set(4.0, 0.45, -4.8);
    radioDesk.castShadow = true;
    safehouseGroup.add(radioDesk);
    this.addBoxCollider(-12.8, 0, -13.5, -11.0, 1.3, -11.5, true, 'safehouse_radio_desk', 'interact_radio_desk');

    // Generator outside the building (Essential Nigerian feature!)
    const genGroup = new THREE.Group();
    genGroup.position.set(7.5, 0, 4.5);
    const genBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.0), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.4 }));
    genBody.position.y = 0.55;
    genBody.castShadow = true;
    genGroup.add(genBody);

    const genTank = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.3, 8), new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.7 }));
    genTank.rotateZ(Math.PI / 2);
    genTank.position.set(0, 1.2, 0);
    genGroup.add(genTank);
    safehouseGroup.add(genGroup);
    this.addBoxCollider(-9.5, 0, -4.5, -7.5, 1.6, -2.5, true, 'safehouse_generator', 'interact_generator');

    // Safehouse hanging light bulb
    this.safehouseInteriorLight = new THREE.PointLight(0xffedd5, 1.2, 14);
    this.safehouseInteriorLight.position.set(0, 3.8, 0);
    this.safehouseInteriorLight.castShadow = true;
    safehouseGroup.add(this.safehouseInteriorLight);

    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
    bulbMesh.position.set(0, 3.8, 0);
    safehouseGroup.add(bulbMesh);

    this.scene.add(safehouseGroup);
  }

  /**
   * Commercial Shopfronts: Mama Ngozi Provisions & Alaba Tech Repairs
   */
  private buildCommercialShops() {
    const wallTex = textureFactory.getWallTexture('#bcc5bf'); // greenish weathered shop
    const shopSignTex = textureFactory.getShopSignTexture();
    const elecSignTex = textureFactory.getElectronicsShopSign();
    const zincTex = textureFactory.getZincRoofTexture();

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ map: zincTex, roughness: 0.6, metalness: 0.3 });

    // Shop 1: Mama Ngozi Provisions (Located on East side of main avenue at Z = -12)
    const shop1 = new THREE.Group();
    shop1.position.set(16, 0, -12);

    // Floor
    const f1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    f1.position.set(0, 0.1, 0);
    shop1.add(f1);

    // Back wall
    const bw1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 12), wallMat);
    bw1.position.set(4.8, 2.25, 0);
    bw1.castShadow = true;
    shop1.add(bw1);
    this.addBoxCollider(20.5, 0, -18, 21.5, 5, -6);

    // Side walls
    const sw1a = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 0.4), wallMat);
    sw1a.position.set(0, 2.25, -5.8);
    sw1a.castShadow = true;
    shop1.add(sw1a);
    this.addBoxCollider(11, 0, -18.2, 21, 5, -17.5);

    const sw1b = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 0.4), wallMat);
    sw1b.position.set(0, 2.25, 5.8);
    sw1b.castShadow = true;
    shop1.add(sw1b);
    this.addBoxCollider(11, 0, -6.5, 21, 5, -5.8);

    // Front veranda / counter (open entrance)
    const counter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 4.0), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    counter.position.set(-2.5, 0.55, 2.5);
    counter.castShadow = true;
    shop1.add(counter);
    this.addBoxCollider(13.0, 0, -10.0, 14.5, 1.4, -5.5);

    // Shelves with food and drinks
    const shelves = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 6.0), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
    shelves.position.set(3.8, 1.25, 0);
    shelves.castShadow = true;
    shop1.add(shelves);
    this.addBoxCollider(19.2, 0, -15.5, 20.5, 2.8, -8.5);

    // Roof
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.15, 13), roofMat);
    r1.position.set(0, 4.6, 0);
    r1.castShadow = true;
    shop1.add(r1);

    // Shop Signboard
    const signGeom = new THREE.PlaneGeometry(6.5, 1.6);
    const signMat = new THREE.MeshStandardMaterial({ map: shopSignTex, roughness: 0.5 });
    const signMesh = new THREE.Mesh(signGeom, signMat);
    signMesh.position.set(-4.9, 3.8, 0);
    signMesh.rotation.y = -Math.PI / 2;
    shop1.add(signMesh);

    this.scene.add(shop1);

    // Shop 2: Alaba Tech & Repairs (Located on East side at Z = 22)
    const shop2 = new THREE.Group();
    shop2.position.set(16, 0, 22);

    const f2 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    f2.position.set(0, 0.1, 0);
    shop2.add(f2);

    const bw2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 10), wallMat);
    bw2.position.set(4.8, 2.25, 0);
    bw2.castShadow = true;
    shop2.add(bw2);
    this.addBoxCollider(20.5, 0, 17, 21.5, 5, 27);

    const sw2a = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 0.4), wallMat);
    sw2a.position.set(0, 2.25, -4.8);
    shop2.add(sw2a);
    this.addBoxCollider(11, 0, 16.8, 21, 5, 17.5);

    const sw2b = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 0.4), wallMat);
    sw2b.position.set(0, 2.25, 4.8);
    shop2.add(sw2b);
    this.addBoxCollider(11, 0, 26.5, 21, 5, 27.2);

    // Electronics workbench inside
    const bench2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 3.5), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4 }));
    bench2.position.set(3.2, 0.5, 0);
    shop2.add(bench2);
    this.addBoxCollider(18.5, 0, 20.0, 20.0, 1.4, 24.0);

    // Electronics sign
    const sign2Mesh = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.6), new THREE.MeshStandardMaterial({ map: elecSignTex, roughness: 0.5 }));
    sign2Mesh.position.set(-4.9, 3.8, 0);
    sign2Mesh.rotation.y = -Math.PI / 2;
    shop2.add(sign2Mesh);

    const r2 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.15, 11), roofMat);
    r2.position.set(0, 4.6, 0);
    shop2.add(r2);

    this.scene.add(shop2);
  }

  /**
   * Procedural abandoned Lagos vehicles:
   * Danfo buses (Lagos yellow minibuses), Keke Napep tricycle, abandoned car
   */
  private buildAbandonedVehicles() {
    // Danfo Bus 1 (Abandoned in middle of main road, slightly skewed)
    const danfo1 = this.createDanfoMesh();
    danfo1.position.set(1.5, 0, -2);
    danfo1.rotation.y = -0.35;
    this.scene.add(danfo1);
    this.addBoxCollider(-0.5, 0, -5, 3.5, 2.6, 1);

    // Danfo Bus 2 (Turned across intersection at Z = 16)
    const danfo2 = this.createDanfoMesh();
    danfo2.position.set(-10, 0, 15);
    danfo2.rotation.y = 1.25;
    this.scene.add(danfo2);
    this.addBoxCollider(-13, 0, 12, -7, 2.6, 18);

    // Keke Tricycle (Yellow commercial 3-wheeler on sidewalk near shop)
    const keke = this.createKekeMesh();
    keke.position.set(6.8, 0, -6);
    keke.rotation.y = 0.5;
    this.scene.add(keke);
    this.addBoxCollider(5.5, 0, -7.5, 8.0, 2.0, -4.5);

    // Abandoned Sedan
    const car = this.createSedanMesh();
    car.position.set(-2.5, 0, 28);
    car.rotation.y = 0.15;
    this.scene.add(car);
    this.addBoxCollider(-4.0, 0, 25.5, -1.0, 1.8, 30.5);
  }

  /**
   * Procedural 8-part Lagos Danfo Minibus model
   */
  private createDanfoMesh(): THREE.Group {
    const group = new THREE.Group();
    const liveryTex = textureFactory.getDanfoLiveryTexture();

    const bodyMat = new THREE.MeshStandardMaterial({
      map: liveryTex,
      roughness: 0.45,
      metalness: 0.25,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.9,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.9,
    });
    const bumperMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.6,
      metalness: 0.5,
    });

    // 1. Lower chassis & body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.3, 5.0), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // 2. Cabin / Roof with windows
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.9, 4.6), glassMat);
    cabin.position.set(0, 1.95, -0.1);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof cap
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 4.8), bodyMat);
    roof.position.set(0, 2.45, -0.1);
    group.add(roof);

    // 3. Front grille & headlights
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.15), bumperMat);
    grille.position.set(0, 0.9, 2.52);
    group.add(grille);

    const hlMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0x554400 });
    const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), hlMat);
    hlLeft.position.set(-0.7, 0.9, 2.55);
    group.add(hlLeft);
    const hlRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), hlMat);
    hlRight.position.set(0.7, 0.9, 2.55);
    group.add(hlRight);

    // 4. Bumpers
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, 0.3), bumperMat);
    frontBumper.position.set(0, 0.45, 2.55);
    group.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, 0.3), bumperMat);
    rearBumper.position.set(0, 0.45, -2.55);
    group.add(rearBumper);

    // 5. Four wheels
    const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
    wheelGeom.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]]) {
      const wheel = new THREE.Mesh(wheelGeom, tireMat);
      wheel.position.set(wx, 0.38, wz);
      wheel.castShadow = true;
      group.add(wheel);
    }

    return group;
  }

  /**
   * Procedural Keke Napep / Marwa Tricycle
   */
  private createKekeMesh(): THREE.Group {
    const group = new THREE.Group();
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

    // Chassis
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.4), yellowMat);
    base.position.y = 0.5;
    base.castShadow = true;
    group.add(base);

    // Canopy frame
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 2.0), darkMat);
    canopy.position.set(0, 1.6, -0.1);
    group.add(canopy);

    // Poles
    for (const [px, pz] of [[-0.6, 0.8], [0.6, 0.8], [-0.6, -0.9], [0.6, -0.9]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1), darkMat);
      pole.position.set(px, 1.05, pz);
      group.add(pole);
    }

    // 3 Wheels (1 front, 2 rear)
    const wheelGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 10);
    wheelGeom.rotateZ(Math.PI / 2);
    const frontWheel = new THREE.Mesh(wheelGeom, darkMat);
    frontWheel.position.set(0, 0.25, 1.0);
    group.add(frontWheel);

    const rlWheel = new THREE.Mesh(wheelGeom, darkMat);
    rlWheel.position.set(-0.7, 0.25, -0.8);
    group.add(rlWheel);

    const rrWheel = new THREE.Mesh(wheelGeom, darkMat);
    rrWheel.position.set(0.7, 0.25, -0.8);
    group.add(rrWheel);

    return group;
  }

  /**
   * Abandoned Sedan
   */
  private createSedanMesh(): THREE.Group {
    const group = new THREE.Group();
    const sedanMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });

    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 4.2), sedanMat);
    lower.position.y = 0.55;
    lower.castShadow = true;
    group.add(lower);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.65, 2.2), glassMat);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    const wheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10);
    wheelGeom.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]]) {
      const wheel = new THREE.Mesh(wheelGeom, tireMat);
      wheel.position.set(wx, 0.32, wz);
      wheel.castShadow = true;
      group.add(wheel);
    }
    return group;
  }

  /**
   * Street fixtures, compound perimeter walls, streetlights, and generators
   */
  private buildUrbanProps() {
    const wallTex = textureFactory.getWallTexture('#d6cebd');
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });

    // Streetlights along main avenue
    const lightPositions: [number, number][] = [
      [-8.5, -30], [-8.5, 0], [-8.5, 30],
      [8.5, -20], [8.5, 10], [8.5, 40]
    ];

    lightPositions.forEach(([lx, lz], i) => {
      const pole = new THREE.Group();
      pole.position.set(lx, 0, lz);

      // Metal pole
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6.5, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 }));
      post.position.y = 3.25;
      post.castShadow = true;
      pole.add(post);

      // Arm extending over road
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      const armDir = lx < 0 ? 1 : -1;
      arm.position.set(armDir * 0.9, 6.4, 0);
      pole.add(arm);

      // Lamp fixture
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x111827 }));
      fixture.position.set(armDir * 1.6, 6.3, 0);
      pole.add(fixture);

      // Point Light
      const pLight = new THREE.PointLight(0xfff7ed, 1.6, 18);
      pLight.position.set(armDir * 1.6, 6.1, 0);
      pLight.castShadow = i % 2 === 0; // only alternate lights cast shadow for high mobile FPS
      pole.add(pLight);
      this.streetLights.push(pLight);

      this.scene.add(pole);
      this.addBoxCollider(lx - 0.3, 0, lz - 0.3, lx + 0.3, 6.5, lz + 0.3);
    });

    // Residential compound perimeter walls bounding the neighbourhood
    // North Boundary Wall (Z = -50)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(90, 3.2, 0.5), wallMat);
    northWall.position.set(0, 1.6, -50);
    northWall.castShadow = true;
    this.scene.add(northWall);
    this.addBoxCollider(-45, 0, -50.5, 45, 4, -49.5);

    // West Boundary Wall (X = -45)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 100), wallMat);
    westWall.position.set(-45, 1.6, 0);
    westWall.castShadow = true;
    this.scene.add(westWall);
    this.addBoxCollider(-45.5, 0, -50, -44.5, 4, 50);

    // East Boundary Wall (X = 45)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 100), wallMat);
    eastWall.position.set(45, 1.6, 0);
    eastWall.castShadow = true;
    this.scene.add(eastWall);
    this.addBoxCollider(44.5, 0, -50, 45.5, 4, 50);
  }

  /**
   * Tropical royal palm trees with trunks and curved fronds
   */
  private buildTropicalFoliage() {
    const palmPositions: [number, number][] = [
      [-11, -22], [-12, -35], [-24, 8], [-28, 22],
      [11, -32], [26, -5], [24, 34], [-6, -42], [7, 45]
    ];

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a483a, roughness: 0.9 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.6, side: THREE.DoubleSide });

    palmPositions.forEach(([px, pz]) => {
      const palm = new THREE.Group();
      palm.position.set(px, 0, pz);

      // Curved trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 7.5, 8), trunkMat);
      trunk.position.y = 3.75;
      trunk.castShadow = true;
      palm.add(trunk);

      // Fronds / Palm leaves spreading out
      for (let f = 0; f < 8; f++) {
        const frondAngle = (f / 8) * Math.PI * 2;
        const frondGeom = new THREE.PlaneGeometry(0.8, 3.4);
        frondGeom.translate(0, 1.7, 0);
        const frond = new THREE.Mesh(frondGeom, frondMat);
        frond.position.set(0, 7.4, 0);
        frond.rotation.y = frondAngle;
        frond.rotation.x = 0.55; // drooping down
        frond.castShadow = true;
        palm.add(frond);
      }

      this.scene.add(palm);
      this.addBoxCollider(px - 0.4, 0, pz - 0.4, px + 0.4, 7.5, pz + 0.4);
    });
  }

  /**
   * Roadblock to Region B (The Island Bridge):
   * Concrete jersey barriers, checkpoint security booth, warning signs, and locked gate
   */
  private buildRoadblockToCheckpoint() {
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }); // hazardous orange concrete
    const hazardSignTex = textureFactory.getRoadblockWarningSign();

    // Roadblock at Z = 52
    const roadblockGroup = new THREE.Group();
    roadblockGroup.position.set(0, 0, 52);

    // Concrete barrier blocks left and right
    for (let x = -14; x <= 14; x += 3.5) {
      if (Math.abs(x) < 4) continue; // gap for security gate
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 1.0), barrierMat);
      barrier.position.set(x, 0.7, 0);
      barrier.castShadow = true;
      roadblockGroup.add(barrier);
      this.addBoxCollider(x - 1.6, 0, 51.5, x + 1.6, 2.0, 52.5);
    }

    // Security Gate in the middle (mission 5 unlocked)
    this.roadBlockGateMesh = new THREE.Group();
    const gateBar = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.6 })
    );
    gateBar.position.set(0, 1.2, 0);
    this.roadBlockGateMesh.add(gateBar);
    roadblockGroup.add(this.roadBlockGateMesh);

    // Barrier collider named 'roadblock_barrier' so it can be cleared when unlocked
    const gateCollider: BoxCollider = {
      min: new THREE.Vector3(-4.0, 0, 51.5),
      max: new THREE.Vector3(4.0, 2.8, 52.5),
      name: 'roadblock_barrier',
    };
    this.colliders.push(gateCollider);

    // Checkpoint Security Booth
    const boothMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const booth = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 3.5), boothMat);
    booth.position.set(6.5, 1.6, 2.5);
    booth.castShadow = true;
    roadblockGroup.add(booth);
    this.addBoxCollider(5.0, 0, 53.0, 8.0, 3.5, 56.5);

    // Hazard Sign billboard over the bridge
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(7.0, 3.5),
      new THREE.MeshStandardMaterial({ map: hazardSignTex, roughness: 0.4 })
    );
    signBoard.position.set(0, 3.6, -0.5);
    roadblockGroup.add(signBoard);

    this.scene.add(roadblockGroup);

    // Radio Transmitter Beacon at the survivor coordinates (Z = 20, X = -10)
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(-10, 0, 20);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 4.0, 6), new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 }));
    mast.position.y = 2.0;
    beaconGroup.add(mast);

    const redBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.0 })
    );
    redBeacon.position.y = 4.1;
    beaconGroup.add(redBeacon);
    this.radioBeaconMesh = redBeacon;

    this.scene.add(beaconGroup);
  }

  /**
   * Atmospheric tropical rain particle system
   */
  private setupRainSystem() {
    const rainCount = 1800;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 110;
      positions[i * 3 + 1] = Math.random() * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 110;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.22,
      transparent: true,
      opacity: 0.4,
    });

    this.rainParticles = new THREE.Points(geom, mat);
    this.scene.add(this.rainParticles);
  }

  /**
   * Spawn interactive 3D collectibles across the world
   */
  private spawnInitialCollectibles() {
    const initialItems: WorldCollectible[] = [
      // Safehouse starting gear
      {
        id: 'col_flashlight',
        itemId: 'flashlight',
        name: 'Heavy Duty Flashlight',
        position: [-12.2, 0.95, -12.8],
        category: 'tool',
        collected: false,
        promptText: 'Pick up Flashlight',
      },
      {
        id: 'col_damaged_radio',
        itemId: 'damaged_radio',
        name: 'Damaged Shortwave Radio',
        position: [-12.0, 0.95, -12.2],
        category: 'quest',
        collected: false,
        promptText: 'Inspect Shortwave Radio',
      },
      {
        id: 'col_note_1',
        itemId: 'journal_note_1',
        name: 'Survivor Note: The Silent Midnight',
        position: [-19.5, 0.65, -12.5],
        category: 'clue',
        collected: false,
        promptText: 'Read Torn Journal Page',
      },

      // Mama Ngozi Provision Store items
      {
        id: 'col_water_1',
        itemId: 'bottled_water',
        name: 'Bottled Mineral Water',
        position: [19.2, 1.4, -13.0],
        category: 'water',
        collected: false,
        promptText: 'Take Bottled Water',
      },
      {
        id: 'col_water_2',
        itemId: 'bottled_water',
        name: 'Bottled Mineral Water',
        position: [19.2, 1.4, -11.0],
        category: 'water',
        collected: false,
        promptText: 'Take Bottled Water',
      },
      {
        id: 'col_food_1',
        itemId: 'canned_sardines',
        name: 'Canned Titus Sardines',
        position: [19.2, 0.8, -14.0],
        category: 'food',
        collected: false,
        promptText: 'Take Canned Sardines',
      },
      {
        id: 'col_food_2',
        itemId: 'plantain_chips',
        name: 'Sealed Plantain Chips',
        position: [13.5, 1.15, -7.5],
        category: 'food',
        collected: false,
        promptText: 'Take Plantain Chips',
      },

      // Alaba Tech Repairs items
      {
        id: 'col_battery_1',
        itemId: 'batteries',
        name: 'High-Capacity Lithium Batteries',
        position: [19.0, 1.1, 21.0],
        category: 'material',
        collected: false,
        promptText: 'Take High-Capacity Batteries',
      },
      {
        id: 'col_battery_2',
        itemId: 'batteries',
        name: 'Rechargeable Battery Pack',
        position: [19.0, 1.1, 23.0],
        category: 'material',
        collected: false,
        promptText: 'Take Battery Pack',
      },
      {
        id: 'col_scrap_1',
        itemId: 'scrap_metal',
        name: 'Industrial Scrap Metal',
        position: [17.5, 0.2, 24.5],
        category: 'material',
        collected: false,
        promptText: 'Collect Scrap Metal',
      },
      {
        id: 'col_scrap_2',
        itemId: 'scrap_metal',
        name: 'Industrial Scrap Metal',
        position: [-8.5, 0.2, -4.0],
        category: 'material',
        collected: false,
        promptText: 'Collect Scrap Metal',
      },

      // Inside abandoned Danfo bus
      {
        id: 'col_cloth_1',
        itemId: 'cloth',
        name: 'Clean Fabric & Bandage Cloth',
        position: [1.6, 1.1, -1.8],
        category: 'material',
        collected: false,
        promptText: 'Salvage Cloth',
      },
      {
        id: 'col_cloth_2',
        itemId: 'cloth',
        name: 'Clean Fabric & Bandage Cloth',
        position: [-10.2, 1.1, 15.2],
        category: 'material',
        collected: false,
        promptText: 'Salvage Cloth',
      },

      // Survivor Radio Beacon / Checkpoint
      {
        id: 'col_note_2',
        itemId: 'journal_note_2',
        name: 'Military Dispatch: Zero Hour Protocol',
        position: [-9.8, 0.2, 20.2],
        category: 'clue',
        collected: false,
        promptText: 'Read Military Log Sheet',
      },
      {
        id: 'col_medkit_1',
        itemId: 'first_aid_kit',
        name: 'Emergency Medical Trauma Kit',
        position: [-9.2, 0.2, 19.5],
        category: 'medical',
        collected: false,
        promptText: 'Take First Aid Kit',
      },

      // Bridge Roadblock Checkpoint booth
      {
        id: 'col_access_card',
        itemId: 'access_card',
        name: 'Island Bridge Clearance Keycard',
        position: [6.5, 1.1, 54.5],
        category: 'quest',
        collected: false,
        promptText: 'Take Security Keycard',
      },
      {
        id: 'col_note_3',
        itemId: 'journal_note_3',
        name: 'Zero Point Facility Blueprint Clue',
        position: [6.8, 1.1, 55.2],
        category: 'clue',
        collected: false,
        promptText: 'Read Classified Memo',
      },
    ];

    this.collectibles = initialItems;

    // Build 3D glowing pickup indicators for each item
    initialItems.forEach((item) => {
      this.createCollectibleMesh(item);
    });
  }

  private createCollectibleMesh(item: WorldCollectible) {
    const group = new THREE.Group();
    group.position.set(...item.position);

    // Color code by category
    let color = 0x38bdf8; // tool/quest blue
    if (item.category === 'food') color = 0xf59e0b;
    else if (item.category === 'water') color = 0x06b6d4;
    else if (item.category === 'medical') color = 0xef4444;
    else if (item.category === 'material') color = 0x10b981;
    else if (item.category === 'clue') color = 0xa855f7;

    // 1. Core item representation
    const geom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.4,
      emissive: color,
      emissiveIntensity: 0.4,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    group.add(mesh);

    // 2. Subtle ground ring marker
    const ringGeom = new THREE.RingGeometry(0.25, 0.35, 16);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = -0.15;
    group.add(ring);

    this.scene.add(group);
    this.collectibleMeshes.set(item.id, group);
  }

  /**
   * Remove collected item from 3D world
   */
  public markItemCollected(id: string) {
    const item = this.collectibles.find((c) => c.id === id);
    if (item) {
      item.collected = true;
    }
    const mesh = this.collectibleMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.collectibleMeshes.delete(id);
    }
  }

  /**
   * Helper to add an AABB collider
   */
  public addBoxCollider(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    isInteractable: boolean = false,
    name?: string,
    interactId?: string
  ) {
    this.colliders.push({
      min: new THREE.Vector3(Math.min(minX, maxX), Math.min(minY, maxY), Math.min(minZ, maxZ)),
      max: new THREE.Vector3(Math.max(minX, maxX), Math.max(minY, maxY), Math.max(minZ, maxZ)),
      isInteractable,
      name,
      interactId,
    });
  }
}
