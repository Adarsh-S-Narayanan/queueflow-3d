/**
 * QueueFlow 3D - Three.js Interactive M/M/1 Queue Simulation
 * Light Theme Edition with 3D Procedural Walking Humans,
 * Fixed Waypoint Navigation Paths, 90-Degree Side Departure Corridor,
 * Real-Time Engine, and Interactive Time Accelerator.
 */

class QueueSimulation3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationFrameId = null;

    // Simulation Parameters
    this.lambda = 2.0;       // arrival rate (cust / time unit)
    this.mu = 4.0;           // service rate (cust / time unit)
    this.timeScale = 1.0;    // 1.0 = Real-Time (1 sec real = 1 sec sim)
    this.isRunning = true;

    // Discrete simulation state
    this.simTime = 0;
    this.nextArrivalTime = 0;
    this.serviceCompletionTime = Infinity;
    this.serverBusy = false;
    this.activeCustomer = null;

    // Queue storage
    this.queue = [];             // FIFO waiting queue
    this.customersInSystem = []; // all active human entities in scene
    this.completedCount = 0;
    this.arrivedCount = 0;

    // Visual assets
    this.serverBooth = null;
    this.clerkAvatar = null;
    this.statusLightMat = null;
    this.serverSpot = null;
    this.queueLaneMarkers = [];

    // Path Waypoints & Coordinates
    // 1. Arrival Corridor: along Z = 0 from X = -14 to X = 0.6
    this.SPAWN_POS = new THREE.Vector3(-14, 0, 0);
    this.SERVICE_POS = new THREE.Vector3(0.6, 0, 0);
    this.DESK_POS = new THREE.Vector3(2.0, 0, 0);
    this.SLOT_SPACING = 1.5;

    // 2. Fixed Exit Path Waypoints (Customers ALWAYS traverse these exact points after service)
    // Counter (0.6, 0, 0) -> Step out to (0.6, 0, 2.0) -> Turn 90° right to (2.8, 0, 2.0)
    // -> Turn 90° left into exit corridor to (2.8, 0, 6.0) -> Reach exit arch at (2.8, 0, 9.5)
    // -> Pass through exit portal to (2.8, 0, 11.5)
    this.FIXED_EXIT_WAYPOINTS = [
      new THREE.Vector3(0.6, 0, 2.0),
      new THREE.Vector3(2.8, 0, 2.0),
      new THREE.Vector3(2.8, 0, 6.0),
      new THREE.Vector3(2.8, 0, 9.5),
      new THREE.Vector3(2.8, 0, 11.5)
    ];
    this.FINAL_EXIT_POS = new THREE.Vector3(2.8, 0, 9.5);

    // Humanoid materials palette (modern light-theme friendly colors)
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

    // 1. Scene with Light Studio Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc); // Clean light slate-50
    this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.016);

    // 2. Camera Setup (Positioned to clearly capture arrival line and exit corridor)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(-1, 16, 22);

    // 3. Renderer with Soft Shadows
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
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above ground
      this.controls.minDistance = 6;
      this.controls.maxDistance = 50;
      this.controls.target.set(0, 1.0, 3.0);
    }

    // 5. Studio Lighting
    this.setupLighting();

    // 6. Platform Architecture & Stanchion Guides
    this.setupEnvironment();

    // 7. Service Desk & Queue Lane
    this.setupServerStation();
    this.setupQueueLane();

    // 8. Resize Listener
    window.addEventListener('resize', () => this.onWindowResize());

    // Schedule first arrival
    this.scheduleNextArrival();

    // Start Animation Loop
    this.lastTimestamp = performance.now();
    this.animate();
  }

  setupLighting() {
    // Ambient soft daylight
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    // Main studio key light casting soft shadows
    const dirLight = new THREE.DirectionalLight(0xfffaf0, 1.55);
    dirLight.position.set(12, 24, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 75;
    dirLight.shadow.camera.left = -22;
    dirLight.shadow.camera.right = 22;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.bias = -0.0004;
    this.scene.add(dirLight);

    // Soft sky fill light
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.7);
    fillLight.position.set(-15, 12, -10);
    this.scene.add(fillLight);

    // Counter accent spotlight
    const counterAccent = new THREE.PointLight(0x38bdf8, 1.2, 16);
    counterAccent.position.set(2, 4.5, 0);
    this.scene.add(counterAccent);
  }

  setupEnvironment() {
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05
    });

    // 1. Main Queue Platform Floor (covers arrival lane and desk)
    const mainPlatformGeo = new THREE.BoxGeometry(26, 0.4, 9);
    const mainPlatform = new THREE.Mesh(mainPlatformGeo, platformMat);
    mainPlatform.position.set(-3.5, -0.2, 0.5);
    mainPlatform.receiveShadow = true;
    this.scene.add(mainPlatform);

    // 2. 90-Degree Side Departure Platform Floor (covers the full fixed exit corridor)
    const sidePlatformGeo = new THREE.BoxGeometry(7, 0.4, 13);
    const sidePlatform = new THREE.Mesh(sidePlatformGeo, platformMat);
    sidePlatform.position.set(2.8, -0.2, 6.5);
    sidePlatform.receiveShadow = true;
    this.scene.add(sidePlatform);

    // 3. Crisp Ground Grid Overlay
    const gridHelper = new THREE.GridHelper(38, 38, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.set(0, 0.005, 3);
    this.scene.add(gridHelper);

    // 4. Stanchions and Retractable Belt Barrier along Queue and Exit
    this.setupStanchionsAndBarriers();
  }

  setupStanchionsAndBarriers() {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });

    const createPost = (x, z) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Chrome post cylinder
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12);
      const pole = new THREE.Mesh(poleGeo, postMat);
      pole.position.y = 0.45;
      pole.castShadow = true;
      group.add(pole);

      // Weighted round base
      const baseGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16);
      const base = new THREE.Mesh(baseGeo, postMat);
      base.position.y = 0.02;
      group.add(base);

      // Top cap sphere
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

    // Stanchions along Entrance Queue Lane (top side at Z = -1.0)
    for (let x = -13; x <= 0; x += 2.6) {
      createPost(x, -1.0);
    }
    createBelt(-13, -1.0, 0, -1.0);

    // Stanchions along Entrance Queue Lane (bottom side at Z = 1.0)
    for (let x = -13; x <= -1.5; x += 2.6) {
      createPost(x, 1.0);
    }
    createBelt(-13, 1.0, -1.5, 1.0);

    // Corner divider post between counter and exit path
    createPost(0.6, 1.0);

    // Stanchions along Exit Corridor (Left side barrier: separates counter from exit walkway)
    const exitPostsLeft = [
      { x: 1.6, z: 2.8 },
      { x: 1.6, z: 5.5 },
      { x: 1.6, z: 8.5 }
    ];
    exitPostsLeft.forEach(p => createPost(p.x, p.z));
    createBelt(1.6, 2.8, 1.6, 8.5);

    // Stanchions along Exit Corridor (Right side outer barrier)
    const exitPostsRight = [
      { x: 4.0, z: 2.0 },
      { x: 4.0, z: 5.5 },
      { x: 4.0, z: 8.5 }
    ];
    exitPostsRight.forEach(p => createPost(p.x, p.z));
    createBelt(4.0, 2.0, 4.0, 8.5);
  }

  setupServerStation() {
    const stationGroup = new THREE.Group();
    stationGroup.position.copy(this.DESK_POS);

    // Modern Executive Service Desk
    const deskGeo = new THREE.BoxGeometry(1.6, 1.1, 3.2);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Deep elegant slate
      roughness: 0.4,
      metalness: 0.2
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.55, 0);
    desk.castShadow = true;
    desk.receiveShadow = true;
    stationGroup.add(desk);

    // Oak wooden desktop trim
    const topTrimGeo = new THREE.BoxGeometry(1.7, 0.08, 3.3);
    const topTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Warm oak accent
      roughness: 0.6
    });
    const topTrim = new THREE.Mesh(topTrimGeo, topTrimMat);
    topTrim.position.set(0, 1.14, 0);
    topTrim.castShadow = true;
    stationGroup.add(topTrim);

    // Receptionist Workstation Screen
    const monitorGeo = new THREE.BoxGeometry(0.08, 0.6, 1.0);
    const monitorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.2
    });
    const monitor = new THREE.Mesh(monitorGeo, monitorMat);
    monitor.position.set(-0.2, 1.48, 0);
    stationGroup.add(monitor);

    // 3D Service Agent (Clerk standing behind desk facing customer at -X)
    const clerkGroup = new THREE.Group();
    clerkGroup.position.set(0.9, 0, 0);
    clerkGroup.rotation.y = -Math.PI / 2; // Facing the customer

    // Clerk Torso
    const cTorsoGeo = new THREE.BoxGeometry(0.38, 0.55, 0.22);
    const cTorsoMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
    const cTorso = new THREE.Mesh(cTorsoGeo, cTorsoMat);
    cTorso.position.y = 1.15;
    cTorso.castShadow = true;
    clerkGroup.add(cTorso);

    // Clerk Head
    const cHeadGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    const cHeadMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
    const cHead = new THREE.Mesh(cHeadGeo, cHeadMat);
    cHead.position.y = 1.58;
    cHead.castShadow = true;
    clerkGroup.add(cHead);

    // Clerk Hair
    const cHairGeo = new THREE.BoxGeometry(0.26, 0.10, 0.26);
    const cHairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const cHair = new THREE.Mesh(cHairGeo, cHairMat);
    cHair.position.y = 1.72;
    clerkGroup.add(cHair);

    // Clerk Legs
    const cLegGeo = new THREE.BoxGeometry(0.32, 0.85, 0.20);
    const cLegMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const cLegs = new THREE.Mesh(cLegGeo, cLegMat);
    cLegs.position.y = 0.45;
    clerkGroup.add(cLegs);

    this.clerkAvatar = clerkGroup;
    stationGroup.add(clerkGroup);

    // Overhead Status Beacon Post
    const beaconPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 12);
    const beaconPostMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const beaconPost = new THREE.Mesh(beaconPostGeo, beaconPostMat);
    beaconPost.position.set(0, 2.1, -1.5);
    stationGroup.add(beaconPost);

    const beaconGeo = new THREE.SphereGeometry(0.2, 16, 16);
    this.statusLightMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    const beacon = new THREE.Mesh(beaconGeo, this.statusLightMat);
    beacon.position.set(0, 3.0, -1.5);
    stationGroup.add(beacon);

    this.serverSpot = new THREE.PointLight(0x10b981, 2.0, 8);
    this.serverSpot.position.set(0, 3.0, -1.5);
    stationGroup.add(this.serverSpot);

    this.serverBooth = stationGroup;
    this.scene.add(this.serverBooth);

    // 1. Entrance Portal Arch (Arrival Zone on -X)
    const entranceArchGroup = new THREE.Group();
    entranceArchGroup.position.copy(this.SPAWN_POS);

    const archGeo = new THREE.TorusGeometry(1.6, 0.1, 16, 32, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    const entranceArch = new THREE.Mesh(archGeo, archMat);
    entranceArch.rotation.z = Math.PI;
    entranceArch.position.y = 1.6;
    entranceArchGroup.add(entranceArch);

    const signGeo = new THREE.BoxGeometry(1.8, 0.35, 0.06);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x0369a1 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.8, 0);
    entranceArchGroup.add(sign);

    this.scene.add(entranceArchGroup);

    // 2. Fixed Exit Portal Arch (At the end of the dedicated 90-degree exit corridor)
    const exitArchGroup = new THREE.Group();
    exitArchGroup.position.copy(this.FINAL_EXIT_POS);
    exitArchGroup.rotation.y = Math.PI / 2; // Facing the incoming exit corridor

    const exitArchMesh = new THREE.Mesh(archGeo, new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 }));
    exitArchMesh.rotation.z = Math.PI;
    exitArchMesh.position.y = 1.6;
    exitArchGroup.add(exitArchMesh);

    const exitSignMesh = new THREE.Mesh(signGeo, new THREE.MeshStandardMaterial({ color: 0x059669 }));
    exitSignMesh.position.set(0, 1.8, 0);
    exitArchGroup.add(exitSignMesh);

    this.scene.add(exitArchGroup);
  }

  setupQueueLane() {
    // 1. Arrival Floor Runner
    const runnerGeo = new THREE.PlaneGeometry(14.5, 1.6);
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8
    });
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(-6.5, 0.012, 0);
    runner.receiveShadow = true;
    this.scene.add(runner);

    // 2. Fixed Exit Corridor Floor Runner (L-shaped path visual guide)
    // First turn connector segment: from (0.6, 2.0) to (2.8, 2.0)
    const turnSegmentGeo = new THREE.PlaneGeometry(2.8, 1.6);
    const turnSegment = new THREE.Mesh(turnSegmentGeo, runnerMat);
    turnSegment.rotation.x = -Math.PI / 2;
    turnSegment.position.set(1.7, 0.012, 2.0);
    turnSegment.receiveShadow = true;
    this.scene.add(turnSegment);

    // Side exit corridor runner segment: along Z = 2.0 to 10.5 at X = 2.8
    const exitRunnerGeo = new THREE.PlaneGeometry(1.8, 9.5);
    const exitRunner = new THREE.Mesh(exitRunnerGeo, runnerMat);
    exitRunner.rotation.x = -Math.PI / 2;
    exitRunner.position.set(2.8, 0.012, 6.2);
    exitRunner.receiveShadow = true;
    this.scene.add(exitRunner);

    // 3. Stanchion floor slot rings for queue positions
    for (let i = 0; i < 9; i++) {
      const slotX = -1.0 - (i * this.SLOT_SPACING);
      const ringGeo = new THREE.RingGeometry(0.38, 0.46, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(slotX, 0.018, 0);
      this.scene.add(ring);
      this.queueLaneMarkers.push(ring);
    }

    // 4. Directional Floor Decal Arrows along the Fixed Pathway
    const createFloorArrow = (x, z, angleRad) => {
      const arrowShape = new THREE.Shape();
      arrowShape.moveTo(0, 0);
      arrowShape.lineTo(0.35, 0.6);
      arrowShape.lineTo(0.15, 0.6);
      arrowShape.lineTo(0.15, 1.1);
      arrowShape.lineTo(-0.15, 1.1);
      arrowShape.lineTo(-0.15, 0.6);
      arrowShape.lineTo(-0.35, 0.6);
      arrowShape.closePath();

      const arrowGeo = new THREE.ShapeGeometry(arrowShape);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.55 });
      const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
      arrowMesh.rotation.x = -Math.PI / 2;
      arrowMesh.rotation.z = angleRad;
      arrowMesh.position.set(x, 0.019, z);
      this.scene.add(arrowMesh);
    };

    // Queue arrival arrows
    createFloorArrow(-9.0, 0, -Math.PI / 2); // Pointing +X
    createFloorArrow(-4.5, 0, -Math.PI / 2); // Pointing +X

    // Fixed Exit Path Guidance Arrows
    createFloorArrow(0.6, 1.0, Math.PI);      // Step 1: Pointing +Z away from desk
    createFloorArrow(1.7, 2.0, -Math.PI / 2); // Step 2: Pointing +X into side lane
    createFloorArrow(2.8, 4.0, Math.PI);      // Step 3: Pointing +Z down exit corridor
    createFloorArrow(2.8, 7.5, Math.PI);      // Step 4: Pointing +Z towards exit gate
  }

  // Exponential random variate
  randomExp(rate) {
    if (rate <= 0) return Infinity;
    return -Math.log(1.0 - Math.random()) / rate;
  }

  scheduleNextArrival() {
    const interArrival = this.randomExp(this.lambda);
    this.nextArrivalTime = this.simTime + interArrival;
  }

  /**
   * Build a procedural 3D Humanoid walking figure with Waypoint Navigation
   */
  createCustomerMesh(id) {
    const group = new THREE.Group();
    const style = this.clothingPalettes[(id - 1) % this.clothingPalettes.length];

    // Spawn at entrance
    group.position.copy(this.SPAWN_POS);
    group.rotation.y = Math.PI / 2; // Facing +X initially

    // 1. Torso & Head Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.82; // Pelvis height

    // Shirt / Jacket
    const shirtGeo = new THREE.BoxGeometry(0.38, 0.48, 0.22);
    const shirtMat = new THREE.MeshStandardMaterial({
      color: style.shirt,
      roughness: 0.5,
      metalness: 0.05
    });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.y = 0.24;
    shirt.castShadow = true;
    shirt.receiveShadow = true;
    torsoGroup.add(shirt);

    // Neck & Head
    const neckGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8);
    const skinMat = new THREE.MeshStandardMaterial({ color: style.skin, roughness: 0.6 });
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.52;
    torsoGroup.add(neck);

    const headGeo = new THREE.BoxGeometry(0.24, 0.25, 0.24);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.68;
    head.castShadow = true;
    torsoGroup.add(head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.26, 0.09, 0.26);
    const hairMat = new THREE.MeshStandardMaterial({ color: style.hair, roughness: 0.8 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.82;
    torsoGroup.add(hair);

    group.add(torsoGroup);

    // 2. Articulated Legs (Pivoted at hips for walking swing)
    const legGeo = new THREE.BoxGeometry(0.12, 0.62, 0.13);
    const pantsMat = new THREE.MeshStandardMaterial({ color: style.pants, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const shoeGeo = new THREE.BoxGeometry(0.13, 0.10, 0.18);

    // Left Leg Pivot
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.11, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.y = -0.31;
    leftLegMesh.castShadow = true;
    leftLegPivot.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.64, 0.03);
    leftShoe.castShadow = true;
    leftLegPivot.add(leftShoe);
    group.add(leftLegPivot);

    // Right Leg Pivot
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.11, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.y = -0.31;
    rightLegMesh.castShadow = true;
    rightLegPivot.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.64, 0.03);
    rightShoe.castShadow = true;
    rightLegPivot.add(rightShoe);
    group.add(rightLegPivot);

    // 3. Articulated Arms (Pivoted at shoulders for swinging in opposition to legs)
    const armGeo = new THREE.BoxGeometry(0.09, 0.44, 0.10);
    const armMat = new THREE.MeshStandardMaterial({ color: style.shirt, roughness: 0.6 });

    // Left Arm Pivot
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.24, 1.25, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.y = -0.22;
    leftArmMesh.castShadow = true;
    leftArmPivot.add(leftArmMesh);
    group.add(leftArmPivot);

    // Right Arm Pivot
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.24, 1.25, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, armMat);
    rightArmMesh.position.y = -0.22;
    rightArmMesh.castShadow = true;
    rightArmPivot.add(rightArmMesh);
    group.add(rightArmPivot);

    // Floating Customer Indicator Tag
    const tagGeo = new THREE.BoxGeometry(0.32, 0.12, 0.04);
    const tagMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const tag = new THREE.Mesh(tagGeo, tagMat);
    tag.position.y = 1.95;
    group.add(tag);

    this.scene.add(group);

    // Customer Navigation State
    const customer = {
      id: id,
      mesh: group,
      torsoGroup: torsoGroup,
      leftLegPivot: leftLegPivot,
      rightLegPivot: rightLegPivot,
      leftArmPivot: leftArmPivot,
      rightArmPivot: rightArmPivot,
      currentPos: this.SPAWN_POS.clone(),
      targetPos: this.SPAWN_POS.clone(),
      waypoints: [], // Fixed Path waypoint queue
      walkPhase: Math.random() * Math.PI,
      isMoving: false,
      inService: false,
      isExiting: false,
      targetAngle: Math.PI / 2, // Facing +X initially
      arrivalTime: this.simTime,
      serviceStartTime: 0,
      completionTime: 0,

      // Method to assign a fixed path of waypoints
      setPath: function(points) {
        this.waypoints = points.map(p => p.clone());
        if (this.waypoints.length > 0) {
          this.targetPos = this.waypoints.shift();
        }
      }
    };

    return customer;
  }

  updateParameters(newLambda, newMu) {
    this.lambda = Math.max(0.001, parseFloat(newLambda) || 2.0);
    this.mu = Math.max(0.001, parseFloat(newMu) || 4.0);
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
    // Remove all human entities
    for (let c of this.customersInSystem) {
      if (c.mesh && c.mesh.parent) {
        this.scene.remove(c.mesh);
      }
    }
    this.customersInSystem = [];
    this.queue = [];
    this.activeCustomer = null;
    this.serverBusy = false;
    this.simTime = 0;
    this.completedCount = 0;
    this.arrivedCount = 0;
    this.nextArrivalTime = 0;
    this.serviceCompletionTime = Infinity;

    this.setServerVisualState('idle');
    this.scheduleNextArrival();
    this.updateHUD();
  }

  setServerVisualState(state) {
    if (!this.statusLightMat || !this.serverSpot) return;

    if (state === 'busy') {
      this.statusLightMat.color.setHex(0xf59e0b); // Amber
      this.statusLightMat.emissive.setHex(0xf59e0b);
      this.serverSpot.color.setHex(0xf59e0b);
      this.serverSpot.intensity = 2.5;
    } else if (state === 'overloaded') {
      this.statusLightMat.color.setHex(0xef4444); // Crimson
      this.statusLightMat.emissive.setHex(0xef4444);
      this.serverSpot.color.setHex(0xef4444);
      this.serverSpot.intensity = 3.5;
    } else {
      this.statusLightMat.color.setHex(0x10b981); // Emerald
      this.statusLightMat.emissive.setHex(0x10b981);
      this.serverSpot.color.setHex(0x10b981);
      this.serverSpot.intensity = 2.0;
    }
  }

  // Main discrete-event simulation step
  stepSimulation(dt) {
    if (!this.isRunning || dt <= 0) return;

    const scaledDt = dt * this.timeScale;
    this.simTime += scaledDt;

    // Check Arrivals
    if (this.simTime >= this.nextArrivalTime) {
      this.arrivedCount++;
      const cust = this.createCustomerMesh(this.arrivedCount);
      this.customersInSystem.push(cust);

      if (!this.serverBusy) {
        this.startService(cust);
      } else {
        this.queue.push(cust);
        this.recalculateQueuePositions();
      }

      this.scheduleNextArrival();
      this.updateHUD();
    }

    // Check Service Completion
    if (this.serverBusy && this.simTime >= this.serviceCompletionTime) {
      this.completeService();
    }

    // Update humanoid positions, strides, and waypoint transitions
    this.updateCustomerPositions(dt);

    // Update Server Visuals
    if (this.queue.length > 6) {
      this.setServerVisualState('overloaded');
    } else if (this.serverBusy) {
      this.setServerVisualState('busy');
    } else {
      this.setServerVisualState('idle');
    }

    // Clerk subtle breathing/typing animation
    if (this.clerkAvatar) {
      if (this.serverBusy) {
        this.clerkAvatar.position.y = Math.sin(this.simTime * 6) * 0.02;
        this.clerkAvatar.rotation.z = Math.sin(this.simTime * 4) * 0.03;
      } else {
        this.clerkAvatar.position.y = 0;
        this.clerkAvatar.rotation.z = 0;
      }
    }
  }

  startService(customer) {
    this.serverBusy = true;
    this.activeCustomer = customer;
    customer.inService = true;
    customer.serviceStartTime = this.simTime;

    const serviceDuration = this.randomExp(this.mu);
    this.serviceCompletionTime = this.simTime + serviceDuration;

    // Customer walks along the queue line directly to the service counter spot
    customer.targetAngle = Math.PI / 2; // Face +X towards desk
    customer.setPath([
      new THREE.Vector3(-1.0, 0, 0),
      this.SERVICE_POS.clone()
    ]);
  }

  completeService() {
    if (!this.activeCustomer) return;

    const departing = this.activeCustomer;
    departing.isExiting = true;
    departing.inService = false;
    departing.completionTime = this.simTime;

    // CRITICAL: Customer ALWAYS traverses the FIXED PATH waypoints!
    // Never walks straight to the exit!
    // Path: Counter -> Step out (0.6, 2.0) -> Turn 90° to side lane (2.8, 2.0)
    // -> Turn 90° into corridor (2.8, 6.0) -> Arch (2.8, 9.5) -> Exit out (2.8, 11.5)
    departing.setPath(this.FIXED_EXIT_WAYPOINTS);

    this.completedCount++;
    this.activeCustomer = null;
    this.serverBusy = false;
    this.serviceCompletionTime = Infinity;

    // Dispatch next customer from FIFO queue
    if (this.queue.length > 0) {
      const nextCustomer = this.queue.shift();
      this.startService(nextCustomer);
      this.recalculateQueuePositions();
    }

    this.updateHUD();
  }

  recalculateQueuePositions() {
    for (let i = 0; i < this.queue.length; i++) {
      const cust = this.queue[i];
      const slotX = -1.0 - (i * this.SLOT_SPACING);
      cust.targetAngle = Math.PI / 2; // Face forward in line

      // Only re-route if not already targeting this slot
      if (Math.abs(cust.targetPos.x - slotX) > 0.05) {
        cust.setPath([ new THREE.Vector3(slotX, 0, 0) ]);
      }
    }
  }

  /**
   * Update Humanoid positions along their FIXED WAYPOINT PATHS,
   * stride animations, and smooth directional turning.
   */
  updateCustomerPositions(dt) {
    const moveSpeedFactor = Math.min(1.0, dt * 5.0 * Math.max(1, this.timeScale * 0.8));

    for (let i = this.customersInSystem.length - 1; i >= 0; i--) {
      const c = this.customersInSystem[i];

      const dx = c.targetPos.x - c.currentPos.x;
      const dz = c.targetPos.z - c.currentPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.08) {
        c.isMoving = true;
        // Interpolate position along the current waypoint vector
        c.currentPos.x += dx * moveSpeedFactor;
        c.currentPos.z += dz * moveSpeedFactor;
        c.mesh.position.set(c.currentPos.x, 0, c.currentPos.z);

        // Smoothly rotate body to face movement direction
        const moveAngle = Math.atan2(dx, dz);
        let angleDiff = moveAngle - c.mesh.rotation.y;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        c.mesh.rotation.y += angleDiff * 0.25;

        // Advance walking animation stride
        const strideSpeed = Math.max(4.0, 7.5 * this.timeScale);
        c.walkPhase += dt * strideSpeed;

        // Swing legs back and forth
        const legSwing = Math.sin(c.walkPhase) * 0.55;
        c.leftLegPivot.rotation.x = legSwing;
        c.rightLegPivot.rotation.x = -legSwing;

        // Swing arms in opposition to legs
        const armSwing = Math.sin(c.walkPhase) * 0.40;
        c.leftArmPivot.rotation.x = -armSwing;
        c.rightArmPivot.rotation.x = armSwing;

        // Subtle torso bounce while walking
        c.torsoGroup.position.y = 0.82 + Math.abs(Math.sin(c.walkPhase)) * 0.04;
      } else {
        // Person reached current waypoint!
        c.currentPos.copy(c.targetPos);
        c.mesh.position.set(c.targetPos.x, 0, c.targetPos.z);

        // Check if there are subsequent waypoints in the fixed path
        if (c.waypoints.length > 0) {
          // Advance to the next waypoint seamlessly!
          c.targetPos = c.waypoints.shift();
        } else {
          // Person has arrived at their final destination in the path
          c.isMoving = false;

          // Smoothly rotate to resting angle (facing desk or queue forward)
          let angleDiff = c.targetAngle - c.mesh.rotation.y;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          c.mesh.rotation.y += angleDiff * 0.15;

          // Ease limbs back to standing idle pose
          c.leftLegPivot.rotation.x *= 0.8;
          c.rightLegPivot.rotation.x *= 0.8;
          c.leftArmPivot.rotation.x *= 0.8;
          c.rightArmPivot.rotation.x *= 0.8;

          // Subtle idle breathing
          c.torsoGroup.position.y = 0.82 + Math.sin(this.simTime * 2.5 + c.id) * 0.01;

          // If departing customer has traversed ALL waypoints through the exit arch, despawn
          if (c.isExiting && c.currentPos.distanceTo(this.FINAL_EXIT_POS) < 2.5) {
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
    const hudClock = document.getElementById('hud-sim-time');

    const inQueue = this.queue.length;
    const inSystem = inQueue + (this.serverBusy ? 1 : 0);

    if (hudInQueue) hudInQueue.textContent = inQueue;
    if (hudInSystem) hudInSystem.textContent = inSystem;
    if (hudCompleted) hudCompleted.textContent = this.completedCount;

    if (hudServerState) {
      if (this.serverBusy) {
        hudServerState.textContent = 'BUSY';
        hudServerState.className = 'status-badge busy';
      } else {
        hudServerState.textContent = 'IDLE';
        hudServerState.className = 'status-badge idle';
      }
    }

    if (hudClock) {
      const totalSec = this.simTime;
      const mins = Math.floor(totalSec / 60);
      const secs = (totalSec % 60).toFixed(1);
      hudClock.textContent = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}s`;
    }
  }

  setCameraView(viewName) {
    if (!this.camera || !this.controls) return;

    if (viewName === 'isometric') {
      this.camera.position.set(-1, 16, 22);
      this.controls.target.set(0, 1.0, 3.0);
    } else if (viewName === 'top') {
      this.camera.position.set(0, 26, 3.0);
      this.controls.target.set(0, 0, 3.0);
    } else if (viewName === 'counter') {
      this.camera.position.set(5.5, 4.0, 5.0);
      this.controls.target.set(1.5, 1.2, 1.5);
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

    // Simulation logic step
    this.stepSimulation(dt);

    // Update real-time clock on HUD
    const hudClock = document.getElementById('hud-sim-time');
    if (hudClock) {
      const totalSec = this.simTime;
      const mins = Math.floor(totalSec / 60);
      const secs = (totalSec % 60).toFixed(1);
      hudClock.textContent = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}s`;
    }

    // Controls update
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

// Expose globally
window.QueueSimulation3D = QueueSimulation3D;
