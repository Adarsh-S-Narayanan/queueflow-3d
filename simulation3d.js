/**
 * QueueFlow 3D - Three.js Interactive M/M/1 Queue Simulation
 * Visualizes Poisson arrival stream, FIFO queue buffer, single service station,
 * and departure flow with interactive 3D camera controls and event simulation.
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
    this.lambda = 2.0; // arrival rate (cust/time unit)
    this.mu = 4.0;     // service rate (cust/time unit)
    this.timeScale = 1.0; // speed multiplier
    this.isRunning = true;

    // Discrete simulation state
    this.simTime = 0;
    this.nextArrivalTime = 0;
    this.serviceCompletionTime = Infinity;
    this.serverBusy = false;
    this.activeCustomer = null;

    // Queue storage
    this.queue = []; // array of customer objects
    this.customersInSystem = []; // all customers currently visible
    this.completedCount = 0;
    this.arrivedCount = 0;

    // Visual assets
    this.serverBooth = null;
    this.statusLight = null;
    this.queueLaneMarkers = [];
    this.particles = null;

    // Grid coordinates
    this.SPAWN_POS = new THREE.Vector3(-14, 0.7, 0);
    this.QUEUE_START_POS = new THREE.Vector3(-10, 0.7, 0);
    this.SERVICE_POS = new THREE.Vector3(2, 0.7, 0);
    this.EXIT_POS = new THREE.Vector3(14, 0.7, 0);
    this.SLOT_SPACING = 1.6;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 450;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c101c);
    this.scene.fog = new THREE.FogExp2(0x0c101c, 0.025);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 14, 22);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below floor
      this.controls.minDistance = 8;
      this.controls.maxDistance = 45;
      this.controls.target.set(0, 0.5, 0);
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Environment & Platform
    this.setupEnvironment();

    // 7. Queue Lane & Server Station
    this.setupServerStation();
    this.setupQueueLane();

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());

    // Schedule first arrival
    this.scheduleNextArrival();

    // Start Loop
    this.lastTimestamp = performance.now();
    this.animate();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x2a3650, 1.2);
    this.scene.add(ambientLight);

    // Main directional light with soft shadows
    const dirLight = new THREE.DirectionalLight(0xe2f1ff, 1.4);
    dirLight.position.set(12, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Accent Point Lights
    const bluePoint = new THREE.PointLight(0x00f2fe, 2.5, 25);
    bluePoint.position.set(-10, 4, 3);
    this.scene.add(bluePoint);

    const purplePoint = new THREE.PointLight(0x9d4edd, 2.8, 25);
    purplePoint.position.set(2, 5, 2);
    this.scene.add(purplePoint);

    const exitPoint = new THREE.PointLight(0x10b981, 2.0, 20);
    exitPoint.position.set(12, 3, 2);
    this.scene.add(exitPoint);
  }

  setupEnvironment() {
    // Platform Floor
    const floorGeo = new THREE.BoxGeometry(34, 0.4, 14);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.6,
      metalness: 0.3
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.2, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Subtle Grid Overlay
    const gridHelper = new THREE.GridHelper(32, 32, 0x38bdf8, 0x1f293d);
    gridHelper.position.set(0, 0.01, 0);
    this.scene.add(gridHelper);

    // Glowing border edges
    const edgeGeo = new THREE.BoxGeometry(34.2, 0.1, 14.2);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true });
    const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
    edgeMesh.position.set(0, 0, 0);
    this.scene.add(edgeMesh);

    // Background floating particle dust
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pCoords = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pCoords[i] = (Math.random() - 0.5) * 50;
      pCoords[i + 1] = Math.random() * 20;
      pCoords[i + 2] = (Math.random() - 0.5) * 30;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pCoords, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.5
    });
    this.particles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.particles);
  }

  setupServerStation() {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(2, 0, 0);

    // Counter Base Desk
    const deskGeo = new THREE.BoxGeometry(2.4, 1.4, 3.6);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.7, 0);
    desk.castShadow = true;
    desk.receiveShadow = true;
    stationGroup.add(desk);

    // Holographic screen top
    const screenGeo = new THREE.BoxGeometry(0.1, 0.8, 1.4);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0.4, 1.6, 0);
    stationGroup.add(screen);

    // Server Agent / Robot Stylized Avatar
    const serverBodyGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.3, 16);
    const serverMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.8,
      roughness: 0.2
    });
    const serverBody = new THREE.Mesh(serverBodyGeo, serverMat);
    serverBody.position.set(1.5, 0.8, 0);
    serverBody.castShadow = true;
    stationGroup.add(serverBody);

    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      metalness: 0.9,
      roughness: 0.1
    });
    const serverHead = new THREE.Mesh(headGeo, headMat);
    serverHead.position.set(1.5, 1.7, 0);
    serverHead.castShadow = true;
    stationGroup.add(serverHead);

    // Overhead Status Indicator Ring / Light
    const haloGeo = new THREE.TorusGeometry(0.7, 0.08, 12, 32);
    this.statusLightMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const halo = new THREE.Mesh(haloGeo, this.statusLightMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 2.8, 0);
    stationGroup.add(halo);

    // Point light radiating from halo
    this.serverSpot = new THREE.PointLight(0x10b981, 2.5, 6);
    this.serverSpot.position.set(0, 2.9, 0);
    stationGroup.add(this.serverSpot);

    this.serverBooth = stationGroup;
    this.scene.add(this.serverBooth);

    // Entrance Portal Gate (Arrival zone)
    const portalGroup = new THREE.Group();
    portalGroup.position.copy(this.SPAWN_POS);
    portalGroup.position.y = 0;

    const portalFrameGeo = new THREE.TorusGeometry(1.6, 0.12, 16, 32, Math.PI);
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.5
    });
    const portalArch = new THREE.Mesh(portalFrameGeo, portalMat);
    portalArch.rotation.z = Math.PI;
    portalArch.position.set(0, 1.6, 0);
    portalGroup.add(portalArch);

    this.scene.add(portalGroup);

    // Exit Gate (Departure zone)
    const exitGroup = new THREE.Group();
    exitGroup.position.copy(this.EXIT_POS);
    exitGroup.position.y = 0;

    const exitArchGeo = new THREE.TorusGeometry(1.6, 0.12, 16, 32, Math.PI);
    const exitArchMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.5
    });
    const exitArch = new THREE.Mesh(exitArchGeo, exitArchMat);
    exitArch.rotation.z = Math.PI;
    exitArch.position.set(0, 1.6, 0);
    exitGroup.add(exitArch);

    this.scene.add(exitGroup);
  }

  setupQueueLane() {
    // Queue lane floor runner
    const runnerGeo = new THREE.PlaneGeometry(16, 1.8);
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0x172554,
      roughness: 0.4,
      metalness: 0.2
    });
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(-6, 0.015, 0);
    runner.receiveShadow = true;
    this.scene.add(runner);

    // Floor slot markers for queue positions
    for (let i = 0; i < 8; i++) {
      const slotX = 0 - (i * this.SLOT_SPACING);
      const ringGeo = new THREE.RingGeometry(0.45, 0.52, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(slotX, 0.02, 0);
      this.scene.add(ring);
      this.queueLaneMarkers.push(ring);
    }
  }

  // Generate exponential random variate with parameter rate
  randomExp(rate) {
    if (rate <= 0) return Infinity;
    return -Math.log(1.0 - Math.random()) / rate;
  }

  scheduleNextArrival() {
    const interArrival = this.randomExp(this.lambda);
    this.nextArrivalTime = this.simTime + interArrival;
  }

  createCustomerMesh(id) {
    const group = new THREE.Group();

    // Vibrant avatar sphere with glowing core
    const sphereGeo = new THREE.SphereGeometry(0.55, 24, 24);
    const hue = (id * 47) % 360;
    const color = new THREE.Color(`hsl(${hue}, 85%, 60%)`);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.4,
      emissive: color,
      emissiveIntensity: 0.25
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.y = 0.65;
    sphere.castShadow = true;
    group.add(sphere);

    // Orbiting mini-ring
    const ringGeo = new THREE.TorusGeometry(0.7, 0.03, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.65;
    group.add(ring);

    group.position.copy(this.SPAWN_POS);
    this.scene.add(group);

    return {
      id: id,
      mesh: group,
      sphere: sphere,
      targetPos: this.SPAWN_POS.clone(),
      currentPos: this.SPAWN_POS.clone(),
      inService: false,
      isExiting: false,
      arrivalTime: this.simTime,
      serviceStartTime: 0,
      completionTime: 0
    };
  }

  updateParameters(newLambda, newMu) {
    this.lambda = Math.max(0.001, parseFloat(newLambda) || 2.0);
    this.mu = Math.max(0.001, parseFloat(newMu) || 4.0);
    // If the server was idle, reschedule next arrival with updated lambda
    if (this.nextArrivalTime <= this.simTime) {
      this.scheduleNextArrival();
    }
  }

  setTimeScale(scale) {
    this.timeScale = scale;
  }

  togglePlayPause() {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }

  resetSimulation() {
    // Clear all customers
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
      this.statusLightMat.color.setHex(0xf59e0b); // Amber / Busy
      this.serverSpot.color.setHex(0xf59e0b);
      this.serverSpot.intensity = 3.0;
    } else if (state === 'overloaded') {
      this.statusLightMat.color.setHex(0xef4444); // Crimson / Overloaded
      this.serverSpot.color.setHex(0xef4444);
      this.serverSpot.intensity = 4.0;
    } else {
      this.statusLightMat.color.setHex(0x10b981); // Emerald / Ready
      this.serverSpot.color.setHex(0x10b981);
      this.serverSpot.intensity = 2.0;
    }
  }

  // Discrete simulation step
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
        // Direct to service
        this.startService(cust);
      } else {
        // Enqueue
        this.queue.push(cust);
      }

      this.scheduleNextArrival();
      this.recalculateQueuePositions();
      this.updateHUD();
    }

    // Check Service Completion
    if (this.serverBusy && this.simTime >= this.serviceCompletionTime) {
      this.completeService();
    }

    // Update customer visual positions with smooth lerp
    this.updateCustomerPositions(dt);

    // Update visual server state based on congestion
    if (this.queue.length > 6) {
      this.setServerVisualState('overloaded');
    } else if (this.serverBusy) {
      this.setServerVisualState('busy');
    } else {
      this.setServerVisualState('idle');
    }
  }

  startService(customer) {
    this.serverBusy = true;
    this.activeCustomer = customer;
    customer.inService = true;
    customer.serviceStartTime = this.simTime;

    const serviceDuration = this.randomExp(this.mu);
    this.serviceCompletionTime = this.simTime + serviceDuration;

    // Target service spot right next to the counter
    customer.targetPos = new THREE.Vector3(0.5, 0.7, 0);
  }

  completeService() {
    if (!this.activeCustomer) return;

    const departingCustomer = this.activeCustomer;
    departingCustomer.isExiting = true;
    departingCustomer.inService = false;
    departingCustomer.completionTime = this.simTime;
    departingCustomer.targetPos = this.EXIT_POS.clone();

    this.completedCount++;
    this.activeCustomer = null;
    this.serverBusy = false;
    this.serviceCompletionTime = Infinity;

    // Dequeue next if available
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
      // FIFO queue lines up to the left of the service counter
      const slotX = -1.2 - (i * this.SLOT_SPACING);
      cust.targetPos = new THREE.Vector3(slotX, 0.7, 0);
    }
  }

  updateCustomerPositions(dt) {
    const lerpSpeed = Math.min(1.0, dt * 5.0 * Math.max(1, this.timeScale * 0.8));

    for (let i = this.customersInSystem.length - 1; i >= 0; i--) {
      const c = this.customersInSystem[i];

      // Smooth position interpolation
      c.currentPos.lerp(c.targetPos, lerpSpeed);
      c.mesh.position.copy(c.currentPos);

      // Gentle floating hover & rotation
      c.mesh.position.y = 0.7 + Math.sin(this.simTime * 3 + c.id) * 0.08;
      c.mesh.rotation.y += dt * 1.5;

      // Clean up exited customers when they reach exit gate
      if (c.isExiting && c.currentPos.distanceTo(this.EXIT_POS) < 0.8) {
        this.scene.remove(c.mesh);
        this.customersInSystem.splice(i, 1);
      }
    }
  }

  updateHUD() {
    const hudInQueue = document.getElementById('hud-queue-count');
    const hudInSystem = document.getElementById('hud-system-count');
    const hudCompleted = document.getElementById('hud-completed-count');
    const hudServerState = document.getElementById('hud-server-state');

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
  }

  setCameraView(viewName) {
    if (!this.camera || !this.controls) return;

    if (viewName === 'isometric') {
      this.camera.position.set(0, 14, 22);
      this.controls.target.set(0, 0.5, 0);
    } else if (viewName === 'top') {
      this.camera.position.set(0, 24, 0.1);
      this.controls.target.set(0, 0, 0);
    } else if (viewName === 'counter') {
      this.camera.position.set(4, 3, 5);
      this.controls.target.set(1.5, 1, 0);
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
    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.1); // clamp delta
    this.lastTimestamp = now;

    // Simulation logic step
    this.stepSimulation(dt);

    // Subtle background particles rotation
    if (this.particles) {
      this.particles.rotation.y += 0.0008;
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
