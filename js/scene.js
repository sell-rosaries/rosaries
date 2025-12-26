/*
    3D SCENE SETUP
    Three.js scene, camera, renderer, lights
*/

/**
 * Sets up the core Three.js scene, including camera, renderer, lights, and plane.
 */
function init3DScene() {
    const container = document.getElementById('canvas-container');
    
    // Safety check for container dimensions
    if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn('⚠️ Container has 0 dimensions, retrying initialization in 100ms...');
        setTimeout(init3DScene, 100);
        return;
    }

    scene = new THREE.Scene();
    // Background handled by CSS for theme support (transparent canvas)
    // scene.background = new THREE.Color(0xf5f7fa); 

    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.OrthographicCamera(-10 * aspect, 10 * aspect, 10, -10, 0.1, 1000);
    camera.position.set(0, 100, 0);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1; // Initialize zoom level for OrthographicCamera
    camera.updateProjectionMatrix();

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimize for mobile
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;  // Disable rotation - mobile doesn't need it
    controls.enablePan = true;      // Enable pan for finger drag
    controls.enableZoom = true;     // Enable zoom for pinch gestures
    controls.enabled = true;        // Start with controls enabled
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Update gravity simulation if active
    if (typeof window.updateGravitySimulation === 'function') {
        window.updateGravitySimulation();
    }
    
    // Update Eraser Wand Scale (to keep constant size)
    if (typeof updateEraserWandScale === 'function') {
        updateEraserWandScale(camera);
    }

    renderer.render(scene, camera);
}
