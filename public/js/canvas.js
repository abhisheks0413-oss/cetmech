// Interactive 3D V6 Engine Block using Three.js
function initMechanicalAnimation() {
  const canvas = document.getElementById('mechanical-canvas');
  if (!canvas || !window.THREE) return;

  const container = canvas.parentElement;
  
  // Set up scene, camera, renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
  camera.position.set(0, 3, 20);
  
  // Use existing canvas
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Orbit Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false; // Prevent scrolling from zooming in, since we are in a hero section
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  
  window.addEventListener('resize', () => {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
  });
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);
  
  const pointLight1 = new THREE.PointLight(0xd4af37, 1.2, 50); // Gold light
  pointLight1.position.set(-5, 5, 5);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0xc62828, 0.8, 50); // Red light
  pointLight2.position.set(5, -5, -5);
  scene.add(pointLight2);
  
  // Engine Group
  const engineGroup = new THREE.Group();
  scene.add(engineGroup);
  
  // Materials
  const blockMat = new THREE.MeshStandardMaterial({ 
    color: 0x222222, 
    metalness: 0.8, 
    roughness: 0.4,
    wireframe: true 
  });
  const pistonMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.2
  });
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.7,
    roughness: 0.3
  });
  const crankMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // Engine Configuration (V6)
  const crankRadius = 1.0;
  const rodLength = 4.5;
  const vAngle = Math.PI / 3; // 60 degrees V
  
  const pistons = [];
  const rods = [];
  const crankPins = [];
  
  const crankshaft = new THREE.Group();
  engineGroup.add(crankshaft);
  
  // Main crank axis
  const mainAxisGeo = new THREE.CylinderGeometry(0.3, 0.3, 13, 16);
  mainAxisGeo.rotateZ(Math.PI / 2);
  const mainAxis = new THREE.Mesh(mainAxisGeo, crankMat);
  crankshaft.add(mainAxis);
  
  // Create 6 cylinders
  for(let i = 0; i < 6; i++) {
    const bank = i % 2 === 0 ? 1 : -1; // 1 for right bank, -1 for left bank
    const zPos = (i - 2.5) * 2.2; // Spread along Z axis
    
    // Crank pin (offset by phase)
    const phase = i * (Math.PI * 2 / 3);
    const pinGroup = new THREE.Group();
    pinGroup.position.z = zPos;
    crankshaft.add(pinGroup);
    
    // Crank web & pin
    const pinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16).rotateZ(Math.PI/2), crankMat);
    pinMesh.position.x = Math.cos(phase) * crankRadius;
    pinMesh.position.y = Math.sin(phase) * crankRadius;
    pinGroup.add(pinMesh);
    
    const webMesh = new THREE.Mesh(new THREE.BoxGeometry(crankRadius + 0.6, 0.8, 0.4), crankMat);
    webMesh.position.x = (Math.cos(phase) * crankRadius) / 2;
    webMesh.position.y = (Math.sin(phase) * crankRadius) / 2;
    webMesh.rotation.z = phase;
    pinGroup.add(webMesh);
    
    crankPins.push({ group: pinGroup, phase: phase, z: zPos });
    
    // Piston
    const pistonGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.4, 32);
    const piston = new THREE.Mesh(pistonGeo, pistonMat);
    
    // Cylinder Sleeve (Transparent wireframe)
    const sleeveGeo = new THREE.CylinderGeometry(1.0, 1.0, 5, 16);
    const sleeve = new THREE.Mesh(sleeveGeo, new THREE.MeshStandardMaterial({color: 0x555555, wireframe: true, transparent: true, opacity: 0.15}));
    
    // Bank orientation group
    const cylinderGroup = new THREE.Group();
    cylinderGroup.position.z = zPos;
    cylinderGroup.rotation.z = bank * (vAngle / 2);
    
    // Position sleeve up the axis
    sleeve.position.y = crankRadius + rodLength - 1;
    cylinderGroup.add(sleeve);
    cylinderGroup.add(piston);
    engineGroup.add(cylinderGroup);
    
    // Connecting Rod
    const rodGeo = new THREE.CylinderGeometry(0.18, 0.25, rodLength, 8);
    // Move origin of rod to one end (crank pin end) for easier rotation
    rodGeo.translate(0, rodLength/2, 0);
    const rod = new THREE.Mesh(rodGeo, rodMat);
    engineGroup.add(rod);
    
    pistons.push({ mesh: piston, bank: bank, cylinderGroup: cylinderGroup });
    rods.push(rod);
  }
  
  // Set initial engine rotation
  engineGroup.rotation.x = Math.PI / 8;
  engineGroup.rotation.y = -Math.PI / 6;
  
  let crankAngle = 0;
  
  function animate() {
    requestAnimationFrame(animate);
    
    // Animate crankshaft
    crankAngle -= 0.08; // engine speed
    crankshaft.rotation.z = crankAngle;
    
    // Animate pistons and rods
    for(let i = 0; i < 6; i++) {
      const pin = crankPins[i];
      const pistonObj = pistons[i];
      const rod = rods[i];
      
      // Global position of pin relative to crankshaft center
      const globalPinX = Math.cos(crankAngle + pin.phase) * crankRadius;
      const globalPinY = Math.sin(crankAngle + pin.phase) * crankRadius;
      
      const bankAngle = pistonObj.bank * (vAngle / 2);
      
      // Pin coordinates rotated to cylinder's local space
      const localPinX = globalPinX * Math.cos(-bankAngle) - globalPinY * Math.sin(-bankAngle);
      const localPinY = globalPinX * Math.sin(-bankAngle) + globalPinY * Math.cos(-bankAngle);
      
      // Calculate piston height
      const pistonY = localPinY + Math.sqrt(rodLength * rodLength - localPinX * localPinX);
      
      pistonObj.mesh.position.y = pistonY;
      
      // Position the rod at the pin
      rod.position.set(globalPinX, globalPinY, pin.z);
      
      // Rotate rod to point at the piston
      const globalPistonX = pistonY * Math.sin(bankAngle);
      const globalPistonY = pistonY * Math.cos(bankAngle);
      
      const dx = globalPistonX - globalPinX;
      const dy = globalPistonY - globalPinY;
      
      rod.rotation.z = Math.atan2(-dx, dy);
    }
    
    // Smooth camera orbit updating
    controls.update();
    
    renderer.render(scene, camera);
  }
  
  animate();
}

// Ensure the Three.js library is loaded before executing
window.addEventListener('load', () => {
  if (typeof THREE !== 'undefined') {
    initMechanicalAnimation();
  } else {
    // Retry once if loaded asynchronously
    setTimeout(() => {
      if (typeof THREE !== 'undefined') initMechanicalAnimation();
    }, 500);
  }
});
