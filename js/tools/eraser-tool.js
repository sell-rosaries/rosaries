/*
    ERASER TOOL MODULE
    Handles the Eraser Wand visualization and logic.
    Uses User's Custom "Perfect" SVG.
    Fixed: Orientation set to flat (parallel to ground) to prevent visual compression from top-down view.
*/

let eraserWand = null;
let eraserTip = null;
let iconMesh = null;
const ERASER_BASE_SCALE = 2.1;

// User's Perfect SVG (Mechanical Crystal Eraser)
const ERASER_SVG = `<svg width="512" height="512" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
      <feOffset dy="2"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.6"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="gradMetal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#111"/>
      <stop offset="0.2" stop-color="#444"/> 
      <stop offset="0.5" stop-color="#222"/>
      <stop offset="0.8" stop-color="#333"/>
      <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <linearGradient id="gradCrystal" x1="16" y1="2" x2="16" y2="14" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.3" stop-color="#D500F9"/>
      <stop offset="1" stop-color="#4A148C"/>
    </linearGradient>
  </defs>
  <g filter="url(#shadow)">
    <path d="M11 16 H21 L20 30 C20 31 19 32 16 32 C13 32 12 31 12 30 L11 16 Z" fill="url(#gradMetal)"/>
    <path d="M12 20 H20 M12 23 H20 M12 26 H20" stroke="black" stroke-opacity="0.6"/>
    <path d="M16 16 V32" stroke="black" stroke-opacity="0.4"/>
    <path d="M9 11 L11 16 H14 L13 12 L10 10 L9 11 Z" fill="#555"/>
    <path d="M23 11 L21 16 H18 L19 12 L22 10 L23 11 Z" fill="#555"/>
    <path d="M10 10 L13 12" stroke="#AAA" stroke-width="0.5"/>
    <path d="M22 10 L19 12" stroke="#AAA" stroke-width="0.5"/>
    <g filter="url(#glow)">
      <path d="M16 2 L12 8 L16 14 L20 8 L16 2 Z" fill="url(#gradCrystal)"/>
      <path d="M16 2 L16 14 M16 8 L12 8 M16 8 L20 8" stroke="white" stroke-opacity="0.3" stroke-width="0.5"/>
    </g>
    <path d="M10 10 L12 8 M22 10 L20 8" stroke="#D500F9" stroke-opacity="0.8" stroke-dasharray="1 1"/>
    <circle cx="16" cy="28" r="1" fill="#FF3333"/>
  </g>
</svg>`;

function initEraserWand() {
  if (eraserWand) return;

  eraserWand = new THREE.Group();

  // Load Texture
  const img = new Image();
  const svgBlob = new Blob([ERASER_SVG], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  img.src = url;
  const texture = new THREE.TextureLoader().load(url);

  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Geometry: 1 x 1
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false
  });

  iconMesh = new THREE.Mesh(geometry, material);

  // VISUAL CORRECTION:
  // Rotate -90 degrees on X axis to lay flat on the ground.
  // Since the camera is Top-Down (looking down Y axis), this makes the SVG appear full size (uncompressed).
  iconMesh.rotation.x = -Math.PI / 2;

  iconMesh.renderOrder = 999;

  // Adjust pivot point (handle grabbing)
  iconMesh.position.set(0, 0, -0.75);

  eraserWand.add(iconMesh);

  // Hitbox Positioning
  // SVG Tip is at Y=2. Center=16.
  // Offset = 14px / 32px = 0.4375.
  // We nudge it slightly to 0.45 to be at the very "sharp" point of the crystal.

  const tipGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const tipMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    visible: false, // Debug
    wireframe: true
  });
  eraserTip = new THREE.Mesh(tipGeo, tipMat);
  eraserTip.position.set(0, 0.45, 0.1);

  iconMesh.add(eraserTip);

  eraserWand.visible = false;
  scene.add(eraserWand);
}

function showEraserWand(position) {
  if (!eraserWand) initEraserWand();
  eraserWand.visible = true;

  if (position) {
    eraserWand.position.copy(position);
  } else {
    eraserWand.position.set(0, 0, 0);
  }

  eraserWand.position.y = 2.0;
}

function hideEraserWand() {
  if (eraserWand) eraserWand.visible = false;
}

function updateEraserWandScale(camera) {
  if (!eraserWand || !eraserWand.visible || !iconMesh) return;

  // Update Scale (Distance based)
  let scale = ERASER_BASE_SCALE;
  if (camera.isOrthographicCamera) {
    if (camera.zoom > 0) scale = ERASER_BASE_SCALE / camera.zoom;
  } else {
    const distance = camera.position.distanceTo(eraserWand.position);
    scale = (distance / 10.0) * ERASER_BASE_SCALE;
  }
  eraserWand.scale.setScalar(scale);
}

function checkEraserCollisionWithString(startPoint, endPoint) {

  if (!eraserWand || !eraserWand.visible || !eraserTip) return null;



  const tipPos = new THREE.Vector3();

  eraserTip.getWorldPosition(tipPos);



  // ADAPTIVE PRECISION UPDATE:

  // User reported "hard to erase" when string is large.

  // Base threshold: 0.5 (generous starting point, ~ bead radius)

  // Scaling: Add 0.015 per percent.

  // At 0%: 0.5

  // At 50%: 0.5 + 0.75 = 1.25

  // At 100%: 0.5 + 1.5 = 2.0

  // This ensures the hitbox grows significantly with the string scale.



  const currentScale = (typeof window.currentStringScale !== 'undefined') ? window.currentStringScale : 0;

  const threshold = 0.5 + (currentScale * 0.015);



  const dist2D = (p1, p2) => {

    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.z - p2.z, 2));

  };



  if (startPoint) {

    const dist = dist2D(tipPos, startPoint);

    if (dist < threshold) return 'start';

  }

  if (endPoint) {

    const dist = dist2D(tipPos, endPoint);

    if (dist < threshold) return 'end';

  }

  return null;

}

// Smart Rotation Logic
function updateEraserOrientation(targetPoint) {
  if (!eraserWand || !iconMesh || !targetPoint) return;

  // Calculate angle required for eraser tip to point towards target
  // The tip is offset in -Z direction (due to iconMesh.position.set(0, 0, -0.75))
  // So we need to point the -Z axis towards the target
  const dx = targetPoint.x - eraserWand.position.x;
  const dz = targetPoint.z - eraserWand.position.z;

  // atan2(dz, dx) gives us the angle to point +X towards target
  // Since our tip is in -Z direction when rotation.y = 0, we need to add PI/2
  // to rotate so that -Z points towards the target
  let targetAngle = Math.atan2(dz, dx) + Math.PI / 2;

  // Current angle
  const currentAngle = eraserWand.rotation.y;

  // Linear interpolation (damping) for smooth rotation
  const damping = 0.15;
  let angleDiff = targetAngle - currentAngle;

  // Normalize angle difference to [-PI, PI]
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  const newAngle = currentAngle + angleDiff * damping;
  eraserWand.rotation.y = newAngle;
}

function getEraserWandObject() {
  return eraserWand;
}

