/*
    3D SCENE SETUP
    Three.js scene, camera, renderer, lights
*/

/**
 * Sets up the core Three.js scene, including camera, renderer, lights, and plane.
 */
function init3DScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim());

    const container = document.getElementById('canvas-container');
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.OrthographicCamera(-10 * aspect, 10 * aspect, 10, -10, 0.1, 1000);
    camera.position.set(0, 100, 0);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
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
    controls.enableRotate = false;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.enabled = false;
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
