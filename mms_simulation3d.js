/**
 * QueueFlow 3D - Multi-Server (M/M/s):(ꝏ/FIFO) 3D Simulation
 * ==========================================================
 * Interactive Three.js WebGL discrete-event queue environment
 * with s Parallel Server Booths, Shared Central FIFO Queue,
 * Procedural 3D Humanoids, Animated Walk Cycles, and Waypoint Navigation.
 */

class QueueSimulationMMS3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationFrameId = null;

    // Simulation Parameters
    this.lambda = 3.0;       // arrival rate (cust / time unit)
    this.mu = 2.0;           // service rate per server (cust / time unit)
    this.s = 2;              // number of parallel servers
    this.timeScale = 1.0;    // 1.0 = Real-Time
    this.isRunning = true;

    // Discrete simulation state
    this.simTime = 0;
    this.nextArrivalTime = 0;
    this.completedCount = 0;
    this.arrivedCount = 0;

    // Multi-Server state array
    // Each entry: { id, busy, activeCustomer, serviceCompletionTime, deskGroup, clerkAvatar, statusLightMat, spotLight }
    this.serverStations = [];

    // Queue storage
    this.queue = [];             // Waiting customers in FIFO line
    this.customersInSystem = []; // All active 3D humanoid entities in scene

    // Visual assets
    this.stanchionGroup = null;
    this.platformGroup = null;
    this.exitPortalArch = null;
    this.entrancePortalArch = null;

    // Coordinates configuration
    this.SPAWN_POS = new THREE.Vector3(-14, 0, 0);
    this.DISPATCH_POS = new THREE.Vector3(-1.0, 0, 0);
    this.SLOT_SPACING = 1.4;
    this.SERVER_X = 3.2;
    this.SERVICE_X = 1.6;
    this.SERVER_SPACING = 3.0; // Distance between parallel desks along Z

    // Modern clothing palette
    this.clothingPalettes = [
      { shirt: 0x2563eb, pants: 0x1e293b, skin: 0xfbd38d, hair: 0x27272a }, // Royal blue & navy
      { shirt: 0x059669, pants: 0x334155, skin: 0xfcd34d, hair: 0x451a03 }, // Emerald & slate
      { shirt: 0xd97706, pants: 0x1f2937, skin: 0xed8936, hair: 0x18181b }, // Amber & dark
      { shirt: 0x7c3aed, pants: 0x374151, skin: 0xfbcfe8, hair: 0x3f3f46 }, // Violet & grey
      { shirt: 0x0284c7, pants: 0x1e293b, skin: 0xfed7aa, hair: 0x581c87 }, // Sky blue & dark
      { shirt: 0xe11d48, pants: 0x18181b, skin: 0xfef08a, hair: 0x1c1917 }, // Rose & charcoal
      { shirt: 0x475569, pants: 0x0f172a, skin: 0xfbb6ce, hair: 0x292524 }, // Modern charcoal
      { shirt: 0x0d9488, pants: 0x1e293b, skin: 0xfde047, hair: 0x713f12 }  // Teal & slate
    ];

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 450;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc);
    this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.015);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(-2, 18, 24);

    // 3. Renderer with shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 60;
      this.controls.target.set(0, 1.0, 1.0);
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Environment & Floor Platform
    this.setupEnvironment();

    // 7. Parallel Server Stations (Build for initial s)
    this.rebuildServerStations(this.s);

    // 8. Queue Lane Markers & Portals
    this.setupPortalsAndLanes();

    // Resize listener
    window.addEventListener('resize', () => this.onWindowResize());

    // Schedule initial arrival
    this.scheduleNextArrival();

    // Start loop
    this.lastTimestamp = performance.now();
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaf0, 1.5);
    dirLight.position.set(12, 26, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -26;
    dirLight.shadow.camera.right = 26;
    dirLight.shadow.camera.top = 26;
    dirLight.shadow.camera.bottom = -26;
    dirLight.shadow.bias = -0.0004;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.65);
    fillLight.position.set(-15, 14, -12);
    this.scene.add(fillLight);
  }

  setupEnvironment() {
    this.platformGroup = new THREE.Group();
    this.scene.add(this.platformGroup);

    const platformMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05
    });

    // Main central platform
    const floorGeo = new THREE.BoxGeometry(32, 0.4, 28);
    const floor = new THREE.Mesh(floorGeo, platformMat);
    floor.position.set(-1, -0.2, 0);
    floor.receiveShadow = true;
    this.platformGroup.add(floor);

    // Grid helper
    const gridHelper = new THREE.GridHelper(38, 38, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.set(0, 0.005, 0);
    this.platformGroup.add(gridHelper);
  }

  setupPortalsAndLanes() {
    // Entrance Portal Arch (at X = -14, Z = 0)
    const entranceGroup = new THREE.Group();
    entranceGroup.position.copy(this.SPAWN_POS);

    const archGeo = new THREE.TorusGeometry(1.6, 0.1, 16, 32, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    const entranceArch = new THREE.Mesh(archGeo, archMat);
    entranceArch.rotation.z = Math.PI;
    entranceArch.position.y = 1.6;
    entranceGroup.add(entranceArch);

    const signGeo = new THREE.BoxGeometry(1.8, 0.35, 0.06);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x0369a1 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.8, 0);
    entranceGroup.add(sign);

    this.scene.add(entranceGroup);
    this.entrancePortalArch = entranceGroup;

    // Shared Arrival Queue Floor Runner
    const runnerGeo = new THREE.PlaneGeometry(14.0, 1.8);
    const runnerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(-7.5, 0.012, 0);
    runner.receiveShadow = true;
    this.scene.add(runner);

    // Stanchions along Entrance Queue Lane
    this.setupQueueStanchions();
  }

  setupQueueStanchions() {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });

    const createPost = (x, z) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12);
      const pole = new THREE.Mesh(poleGeo, postMat);
      pole.position.y = 0.45;
      pole.castShadow = true;
      group.add(pole);

      const baseGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16);
      const base = new THREE.Mesh(baseGeo, postMat);
      base.position.y = 0.02;
      group.add(base);

      const capGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const cap = new THREE.Mesh(capGeo, postMat);
      cap.position.y = 0.92;
      group.add(cap);

      this.scene.add(group);
      return group;
    };

    const createBelt = (x1, z1, x2, z2) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);

      const beltGeo = new THREE.BoxGeometry(0.02, 0.05, length);
      const belt = new THREE.Mesh(beltGeo, beltMat);
      belt.position.set((x1 + x2) / 2, 0.78, (z1 + z2) / 2);
      belt.rotation.y = angle;
      this.scene.add(belt);
    };

    // Stanchions top and bottom of arrival line
    for (let x = -13; x <= -1.0; x += 2.6) {
      createPost(x, -1.0);
      createPost(x, 1.0);
    }
    createBelt(-13, -1.0, -1.0, -1.0);
    createBelt(-13, 1.0, -1.0, 1.0);
  }

  /**
   * Rebuilds 3D Parallel Server Stations when s changes
   */
  rebuildServerStations(sCount) {
    this.s = Math.max(1, Math.min(20, parseInt(sCount, 10) || 1));

    // Remove existing stations from scene
    this.serverStations.forEach(st => {
      if (st.deskGroup && st.deskGroup.parent) {
        this.scene.remove(st.deskGroup);
      }
    });
    this.serverStations = [];

    // Dynamically place s service counters along X = SERVER_X, spaced across Z
    const s = this.s;
    for (let i = 0; i < s; i++) {
      const zOffset = (i - (s - 1) / 2) * this.SERVER_SPACING;

      const stationGroup = new THREE.Group();
      stationGroup.position.set(this.SERVER_X, 0, zOffset);

      // 1. Modern Desk
      const deskGeo = new THREE.BoxGeometry(1.4, 1.1, 2.2);
      const deskMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
        metalness: 0.2
      });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0, 0.55, 0);
      desk.castShadow = true;
      desk.receiveShadow = true;
      stationGroup.add(desk);

      // Oak wooden desktop trim
      const topTrimGeo = new THREE.BoxGeometry(1.5, 0.08, 2.3);
      const topTrimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
      const topTrim = new THREE.Mesh(topTrimGeo, topTrimMat);
      topTrim.position.set(0, 1.14, 0);
      topTrim.castShadow = true;
      stationGroup.add(topTrim);

      // Receptionist Workstation Screen
      const monitorGeo = new THREE.BoxGeometry(0.08, 0.5, 0.8);
      const monitorMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.2
      });
      const monitor = new THREE.Mesh(monitorGeo, monitorMat);
      monitor.position.set(-0.2, 1.45, 0);
      stationGroup.add(monitor);

      // 3D Clerk Avatar standing behind desk facing -X
      const clerkGroup = new THREE.Group();
      clerkGroup.position.set(0.85, 0, 0);
      clerkGroup.rotation.y = -Math.PI / 2;

      // Clerk Torso
      const cTorsoGeo = new THREE.BoxGeometry(0.36, 0.52, 0.20);
      const cTorsoMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
      const cTorso = new THREE.Mesh(cTorsoGeo, cTorsoMat);
      cTorso.position.y = 1.15;
      cTorso.castShadow = true;
      clerkGroup.add(cTorso);

      // Clerk Head
      const cHeadGeo = new THREE.BoxGeometry(0.22, 0.24, 0.22);
      const cHeadMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
      const cHead = new THREE.Mesh(cHeadGeo, cHeadMat);
      cHead.position.y = 1.55;
      cHead.castShadow = true;
      clerkGroup.add(cHead);

      // Clerk Legs
      const cLegGeo = new THREE.BoxGeometry(0.30, 0.85, 0.18);
      const cLegMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
      const cLegs = new THREE.Mesh(cLegGeo, cLegMat);
      cLegs.position.y = 0.45;
      clerkGroup.add(cLegs);

      stationGroup.add(clerkGroup);

      // Overhead Beacon Light Post
      const beaconPostGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.6, 12);
      const beaconPostMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      const beaconPost = new THREE.Mesh(beaconPostGeo, beaconPostMat);
      beaconPost.position.set(0, 2.0, -1.0);
      stationGroup.add(beaconPost);

      // Status Light Sphere
      const beaconGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const statusLightMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.85,
        roughness: 0.1
      });
      const beacon = new THREE.Mesh(beaconGeo, statusLightMat);
      beacon.position.set(0, 2.8, -1.0);
      stationGroup.add(beacon);

      const spotLight = new THREE.PointLight(0x10b981, 1.8, 6);
      spotLight.position.set(0, 2.8, -1.0);
      stationGroup.add(spotLight);

      // Service Counter Ground Runner
      const boothRunnerGeo = new THREE.PlaneGeometry(2.2, 1.8);
      const boothRunnerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
      const boothRunner = new THREE.Mesh(boothRunnerGeo, boothRunnerMat);
      boothRunner.rotation.x = -Math.PI / 2;
      boothRunner.position.set(-1.4, 0.014, 0);
      stationGroup.add(boothRunner);

      // Service Stand Ring Marker
      const ringGeo = new THREE.RingGeometry(0.35, 0.45, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(-1.6, 0.016, 0);
      stationGroup.add(ring);

      this.scene.add(stationGroup);

      this.serverStations.push({
        id: i + 1,
        busy: false,
        activeCustomer: null,
        serviceStartTime: 0,
        serviceDuration: 1,
        serviceCompletionTime: Infinity,
        deskGroup: stationGroup,
        clerkAvatar: clerkGroup,
        statusLightMat: statusLightMat,
        spotLight: spotLight,
        servicePos: new THREE.Vector3(this.SERVICE_X, 0, zOffset),
        deskPos: new THREE.Vector3(this.SERVER_X, 0, zOffset),
        exitWaypoint: new THREE.Vector3(this.SERVER_X + 2.5, 0, zOffset),
        servedCount: 0
      });
    }

    // Set exit portal location according to current server pool width
    this.updateExitPortal();
    this.renderServerBoothsUI();
  }

  updateExitPortal() {
    if (this.exitPortalArch && this.exitPortalArch.parent) {
      this.scene.remove(this.exitPortalArch);
    }

    const maxZ = Math.max(7.0, ((this.s - 1) / 2) * this.SERVER_SPACING + 3.0);
    const exitPos = new THREE.Vector3(6.0, 0, maxZ);

    const exitGroup = new THREE.Group();
    exitGroup.position.copy(exitPos);
    exitGroup.rotation.y = Math.PI / 2;

    const archGeo = new THREE.TorusGeometry(1.6, 0.1, 16, 32, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = Math.PI;
    arch.position.y = 1.6;
    exitGroup.add(arch);

    const signGeo = new THREE.BoxGeometry(1.8, 0.35, 0.06);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x059669 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.8, 0);
    exitGroup.add(sign);

    this.scene.add(exitGroup);
    this.exitPortalArch = exitGroup;
    this.FINAL_EXIT_POS = exitPos;
  }

  randomExp(rate) {
    if (rate <= 0) return Infinity;
    return -Math.log(1.0 - Math.random()) / rate;
  }

  scheduleNextArrival() {
    const interArrival = this.randomExp(this.lambda);
    this.nextArrivalTime = this.simTime + interArrival;
  }

  /**
   * Procedural 3D Humanoid Creation
   */
  createCustomerMesh(id) {
    const group = new THREE.Group();
    const style = this.clothingPalettes[(id - 1) % this.clothingPalettes.length];

    group.position.copy(this.SPAWN_POS);
    group.rotation.y = Math.PI / 2;

    // 1. Torso Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.82;

    const shirtGeo = new THREE.BoxGeometry(0.38, 0.48, 0.22);
    const shirtMat = new THREE.MeshStandardMaterial({ color: style.shirt, roughness: 0.5 });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.y = 0.24;
    shirt.castShadow = true;
    shirt.receiveShadow = true;
    torsoGroup.add(shirt);

    const headGeo = new THREE.BoxGeometry(0.24, 0.25, 0.24);
    const skinMat = new THREE.MeshStandardMaterial({ color: style.skin, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.68;
    head.castShadow = true;
    torsoGroup.add(head);

    const hairGeo = new THREE.BoxGeometry(0.26, 0.09, 0.26);
    const hairMat = new THREE.MeshStandardMaterial({ color: style.hair, roughness: 0.8 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.82;
    torsoGroup.add(hair);

    group.add(torsoGroup);

    // 2. Articulated Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.62, 0.13);
    const pantsMat = new THREE.MeshStandardMaterial({ color: style.pants, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const shoeGeo = new THREE.BoxGeometry(0.13, 0.10, 0.18);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.11, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.y = -0.31;
    leftLegMesh.castShadow = true;
    leftLegPivot.add(leftLegMesh);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.64, 0.03);
    leftLegPivot.add(leftShoe);
    group.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.11, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.y = -0.31;
    rightLegMesh.castShadow = true;
    rightLegPivot.add(rightLegMesh);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.64, 0.03);
    rightLegPivot.add(rightShoe);
    group.add(rightLegPivot);

    // 3. Articulated Arms
    const armGeo = new THREE.BoxGeometry(0.09, 0.44, 0.10);
    const armMat = new THREE.MeshStandardMaterial({ color: style.shirt, roughness: 0.6 });

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.24, 1.25, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.y = -0.22;
    leftArmMesh.castShadow = true;
    leftArmPivot.add(leftArmMesh);
    group.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.24, 1.25, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, armMat);
    rightArmMesh.position.y = -0.22;
    rightArmMesh.castShadow = true;
    rightArmPivot.add(rightArmMesh);
    group.add(rightArmPivot);

    // Overhead tag
    const tagGeo = new THREE.BoxGeometry(0.32, 0.12, 0.04);
    const tagMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const tag = new THREE.Mesh(tagGeo, tagMat);
    tag.position.y = 1.95;
    group.add(tag);

    this.scene.add(group);

    return {
      id: id,
      mesh: group,
      torsoGroup: torsoGroup,
      leftLegPivot: leftLegPivot,
      rightLegPivot: rightLegPivot,
      leftArmPivot: leftArmPivot,
      rightArmPivot: rightArmPivot,
      currentPos: this.SPAWN_POS.clone(),
      targetPos: this.SPAWN_POS.clone(),
      waypoints: [],
      walkPhase: Math.random() * Math.PI,
      isMoving: false,
      inService: false,
      isExiting: false,
      targetAngle: Math.PI / 2,
      arrivalTime: this.simTime,
      assignedServer: null,

      setPath: function(points) {
        this.waypoints = points.map(p => p.clone());
        if (this.waypoints.length > 0) {
          this.targetPos = this.waypoints.shift();
        }
      }
    };
  }

  updateParameters(newLambda, newMu, newS) {
    this.lambda = Math.max(0.001, parseFloat(newLambda) || 3.0);
    this.mu = Math.max(0.001, parseFloat(newMu) || 2.0);

    const sVal = parseInt(newS, 10);
    if (!isNaN(sVal) && sVal !== this.s && sVal >= 1) {
      this.rebuildServerStations(sVal);
    }

    if (this.nextArrivalTime <= this.simTime) {
      this.scheduleNextArrival();
    }
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0.05, Math.min(20.0, parseFloat(scale) || 1.0));
  }

  togglePlayPause() {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }

  resetSimulation() {
    for (let c of this.customersInSystem) {
      if (c.mesh && c.mesh.parent) {
        this.scene.remove(c.mesh);
      }
    }
    this.customersInSystem = [];
    this.queue = [];
    this.simTime = 0;
    this.completedCount = 0;
    this.arrivedCount = 0;

    const isOverloaded = (this.lambda >= this.s * this.mu);
    this.serverStations.forEach(st => {
      st.busy = false;
      st.activeCustomer = null;
      st.serviceStartTime = 0;
      st.serviceDuration = 1;
      st.serviceCompletionTime = Infinity;
      st.servedCount = 0;
      this.setServerBeacon(st, isOverloaded ? 'overloaded' : 'idle');
    });

    this.scheduleNextArrival();
    this.renderServerBoothsUI();
    this.updateHUD();
  }

  setServerBeacon(station, state) {
    if (!station || !station.statusLightMat || !station.spotLight) return;

    if (state === 'busy') {
      station.statusLightMat.color.setHex(0xf59e0b); // Amber
      station.statusLightMat.emissive.setHex(0xf59e0b);
      station.spotLight.color.setHex(0xf59e0b);
      station.spotLight.intensity = 2.4;
    } else if (state === 'overloaded') {
      station.statusLightMat.color.setHex(0xef4444); // Red
      station.statusLightMat.emissive.setHex(0xef4444);
      station.spotLight.color.setHex(0xef4444);
      station.spotLight.intensity = 3.2;
    } else {
      station.statusLightMat.color.setHex(0x10b981); // Emerald
      station.statusLightMat.emissive.setHex(0x10b981);
      station.spotLight.color.setHex(0x10b981);
      station.spotLight.intensity = 1.8;
    }
  }

  /**
   * Main discrete-event simulation step
   */
  stepSimulation(dt) {
    if (!this.isRunning || dt <= 0) return;

    const scaledDt = dt * this.timeScale;
    this.simTime += scaledDt;

    // 1. Process Arrivals
    if (this.simTime >= this.nextArrivalTime) {
      this.arrivedCount++;
      const cust = this.createCustomerMesh(this.arrivedCount);
      this.customersInSystem.push(cust);

      // Check if any parallel server is idle and queue is empty
      const freeServer = this.serverStations.find(st => !st.busy);
      if (freeServer && this.queue.length === 0) {
        this.dispatchCustomerToServer(freeServer, cust);
      } else {
        // Enqueue in central FIFO waiting line
        this.queue.push(cust);
        this.recalculateQueuePositions();
      }

      this.scheduleNextArrival();
      this.updateHUD();
    }

    // 2. Check Service Completions across all parallel servers
    this.serverStations.forEach(st => {
      if (st.busy && this.simTime >= st.serviceCompletionTime) {
        this.completeService(st);
      }
    });

    // 3. Update Humanoid Motion, Strides, and Turn Interpolations
    this.updateCustomerPositions(dt);

    // 4. Update Server Visual Beacons and Clerk animations
    const isOverloaded = (this.lambda >= this.s * this.mu) || (this.queue.length > this.s * 3);
    this.serverStations.forEach(st => {
      if (isOverloaded && st.busy) {
        this.setServerBeacon(st, 'overloaded');
      } else if (st.busy) {
        this.setServerBeacon(st, 'busy');
      } else {
        this.setServerBeacon(st, isOverloaded ? 'overloaded' : 'idle');
      }

      // Clerk idle or typing movement
      if (st.clerkAvatar) {
        if (st.busy) {
          st.clerkAvatar.position.y = Math.sin(this.simTime * 6 + st.id) * 0.02;
          st.clerkAvatar.rotation.z = Math.sin(this.simTime * 4 + st.id) * 0.03;
        } else {
          st.clerkAvatar.position.y = 0;
          st.clerkAvatar.rotation.z = 0;
        }
      }
    });
  }

  dispatchCustomerToServer(station, customer) {
    station.busy = true;
    station.activeCustomer = customer;
    customer.inService = true;
    customer.assignedServer = station;

    const serviceDuration = this.randomExp(this.mu);
    station.serviceDuration = serviceDuration;
    station.serviceStartTime = this.simTime;
    station.serviceCompletionTime = this.simTime + serviceDuration;

    // Route customer along waypoints to this server's specific counter
    customer.targetAngle = Math.PI / 2; // Face towards counter desk
    customer.setPath([
      new THREE.Vector3(-1.0, 0, 0),
      new THREE.Vector3(0.4, 0, station.servicePos.z),
      station.servicePos.clone()
    ]);
  }

  completeService(station) {
    if (!station.activeCustomer) return;

    const departing = station.activeCustomer;
    departing.isExiting = true;
    departing.inService = false;
    departing.assignedServer = null;

    // Customer walks from counter into exit corridor, then through exit portal
    const maxZ = this.FINAL_EXIT_POS ? this.FINAL_EXIT_POS.z : 8.0;
    departing.setPath([
      new THREE.Vector3(station.servicePos.x + 0.4, 0, station.servicePos.z + 1.2),
      station.exitWaypoint.clone(),
      new THREE.Vector3(station.exitWaypoint.x, 0, maxZ),
      this.FINAL_EXIT_POS.clone(),
      new THREE.Vector3(this.FINAL_EXIT_POS.x + 2.5, 0, this.FINAL_EXIT_POS.z)
    ]);

    station.servedCount++;
    this.completedCount++;
    station.activeCustomer = null;
    station.busy = false;
    station.serviceCompletionTime = Infinity;

    // If waiting customers exist in FIFO queue, dispatch head of line
    if (this.queue.length > 0) {
      const nextCustomer = this.queue.shift();
      this.dispatchCustomerToServer(station, nextCustomer);
      this.recalculateQueuePositions();
    }

    this.updateHUD();
  }

  recalculateQueuePositions() {
    for (let i = 0; i < this.queue.length; i++) {
      const cust = this.queue[i];
      const slotX = this.DISPATCH_POS.x - (i * this.SLOT_SPACING);
      cust.targetAngle = Math.PI / 2;

      if (Math.abs(cust.targetPos.x - slotX) > 0.05) {
        cust.setPath([ new THREE.Vector3(slotX, 0, 0) ]);
      }
    }
  }

  updateCustomerPositions(dt) {
    const moveSpeedFactor = Math.min(1.0, dt * 5.0 * Math.max(1, this.timeScale * 0.8));

    for (let i = this.customersInSystem.length - 1; i >= 0; i--) {
      const c = this.customersInSystem[i];

      const dx = c.targetPos.x - c.currentPos.x;
      const dz = c.targetPos.z - c.currentPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.08) {
        c.isMoving = true;
        c.currentPos.x += dx * moveSpeedFactor;
        c.currentPos.z += dz * moveSpeedFactor;
        c.mesh.position.set(c.currentPos.x, 0, c.currentPos.z);

        const moveAngle = Math.atan2(dx, dz);
        let angleDiff = moveAngle - c.mesh.rotation.y;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        c.mesh.rotation.y += angleDiff * 0.25;

        const strideSpeed = Math.max(4.0, 7.5 * this.timeScale);
        c.walkPhase += dt * strideSpeed;

        const legSwing = Math.sin(c.walkPhase) * 0.55;
        c.leftLegPivot.rotation.x = legSwing;
        c.rightLegPivot.rotation.x = -legSwing;

        const armSwing = Math.sin(c.walkPhase) * 0.40;
        c.leftArmPivot.rotation.x = -armSwing;
        c.rightArmPivot.rotation.x = armSwing;

        c.torsoGroup.position.y = 0.82 + Math.abs(Math.sin(c.walkPhase)) * 0.04;
      } else {
        c.currentPos.copy(c.targetPos);
        c.mesh.position.set(c.targetPos.x, 0, c.targetPos.z);

        if (c.waypoints.length > 0) {
          c.targetPos = c.waypoints.shift();
        } else {
          c.isMoving = false;

          let angleDiff = c.targetAngle - c.mesh.rotation.y;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          c.mesh.rotation.y += angleDiff * 0.15;

          c.leftLegPivot.rotation.x *= 0.8;
          c.rightLegPivot.rotation.x *= 0.8;
          c.leftArmPivot.rotation.x *= 0.8;
          c.rightArmPivot.rotation.x *= 0.8;

          c.torsoGroup.position.y = 0.82 + Math.sin(this.simTime * 2.5 + c.id) * 0.01;

          if (c.isExiting && this.FINAL_EXIT_POS && c.currentPos.distanceTo(this.FINAL_EXIT_POS) < 3.0) {
            this.scene.remove(c.mesh);
            this.customersInSystem.splice(i, 1);
          }
        }
      }
    }
  }

  updateHUD() {
    const hudInQueue = document.getElementById('hud-queue-count');
    const hudInSystem = document.getElementById('hud-system-count');
    const hudCompleted = document.getElementById('hud-completed-count');
    const hudServerState = document.getElementById('hud-server-state');
    const hudBusyServers = document.getElementById('hud-busy-servers');

    const busyCount = this.serverStations.filter(st => st.busy).length;
    const inQueue = this.queue.length;
    const inSystem = inQueue + busyCount;

    if (hudInQueue) hudInQueue.textContent = inQueue;
    if (hudInSystem) hudInSystem.textContent = inSystem;
    if (hudCompleted) hudCompleted.textContent = this.completedCount;
    if (hudBusyServers) hudBusyServers.textContent = `${busyCount}/${this.s}`;

    if (hudServerState) {
      if (this.lambda >= this.s * this.mu) {
        hudServerState.textContent = 'OVERLOADED';
        hudServerState.className = 'status-badge error';
      } else if (busyCount === this.s) {
        hudServerState.textContent = 'ALL BUSY';
        hudServerState.className = 'status-badge busy';
      } else if (busyCount > 0) {
        hudServerState.textContent = `${busyCount}/${this.s} SERVING`;
        hudServerState.className = 'status-badge busy';
      } else {
        hudServerState.textContent = 'ALL IDLE';
        hudServerState.className = 'status-badge idle';
      }
    }

    this.updateServerBoothsUI();
  }

  renderServerBoothsUI() {
    const container = document.getElementById('servers-grid-container');
    if (!container) return;

    container.innerHTML = '';
    this.serverStations.forEach(st => {
      const card = document.createElement('div');
      card.id = `server-booth-${st.id}`;
      card.className = `server-booth-card ${st.busy ? 'busy' : 'idle'}`;
      card.innerHTML = `
        <div class="server-booth-top">
          <span class="server-booth-title">
            <i data-lucide="monitor"></i> Server #${st.id}
          </span>
          <span class="server-status-pill ${st.busy ? 'busy' : 'idle'}">
            ${st.busy ? 'BUSY' : 'IDLE'}
          </span>
        </div>
        <div class="server-customer-slot">
          <i data-lucide="user"></i>
          <span class="customer-label">${st.busy && st.activeCustomer ? 'C-' + st.activeCustomer.id : 'No Customer'}</span>
        </div>
        <div class="server-progress-bar">
          <div class="server-progress-fill" style="width: 0%;"></div>
        </div>
        <div class="server-booth-footer">
          <span>Handled: <strong>${st.servedCount || 0}</strong></span>
          <span>Rate: <strong>${this.mu.toFixed(1)}/hr</strong></span>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateServerBoothsUI() {
    this.serverStations.forEach(st => {
      const card = document.getElementById(`server-booth-${st.id}`);
      if (!card) return;

      const isBusy = st.busy && st.activeCustomer;
      const desiredClass = `server-booth-card ${isBusy ? 'busy' : 'idle'}`;
      if (card.className !== desiredClass) {
        card.className = desiredClass;
      }

      const pill = card.querySelector('.server-status-pill');
      if (pill) {
        const text = isBusy ? 'BUSY' : 'IDLE';
        if (pill.textContent.trim() !== text) {
          pill.textContent = text;
          pill.className = `server-status-pill ${isBusy ? 'busy' : 'idle'}`;
        }
      }

      const label = card.querySelector('.customer-label');
      if (label) {
        const custText = isBusy ? `C-${st.activeCustomer.id}` : 'No Customer';
        if (label.textContent !== custText) {
          label.textContent = custText;
        }
      }

      const fill = card.querySelector('.server-progress-fill');
      if (fill) {
        let pct = 0;
        if (isBusy && st.serviceDuration > 0) {
          pct = Math.min(100, Math.max(0, ((this.simTime - st.serviceStartTime) / st.serviceDuration) * 100));
        }
        fill.style.width = `${pct.toFixed(1)}%`;
      }

      const countEl = card.querySelector('.server-booth-footer strong');
      if (countEl) {
        const countText = String(st.servedCount || 0);
        if (countEl.textContent !== countText) {
          countEl.textContent = countText;
        }
      }
    });
  }

  setCameraView(viewName) {
    if (!this.camera || !this.controls) return;

    if (viewName === 'isometric') {
      this.camera.position.set(-2, 18, 24);
      this.controls.target.set(0, 1.0, 1.0);
    } else if (viewName === 'top') {
      this.camera.position.set(0, 30, 1.0);
      this.controls.target.set(0, 0, 1.0);
    } else if (viewName === 'counter') {
      this.camera.position.set(8.5, 5.0, 4.0);
      this.controls.target.set(3.0, 1.2, 0.5);
    }
    this.controls.update();
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = now;

    this.stepSimulation(dt);
    this.updateHUD();

    const hudClock = document.getElementById('hud-sim-time');
    if (hudClock) {
      const totalSec = this.simTime;
      const mins = Math.floor(totalSec / 60);
      const secs = (totalSec % 60).toFixed(1);
      hudClock.textContent = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}s`;
    }

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

// Global Export
window.QueueSimulationMMS3D = QueueSimulationMMS3D;
