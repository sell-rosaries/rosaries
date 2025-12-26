/*
    EMAIL CAPTURE MODULE
    Image and design data capture functionality
*/

function captureDesignImage() {
    const originalBackgroundColor = scene.background ? scene.background.clone() : null;
    const originalCameraPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };
    const originalCameraLookAt = {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z
    };

    // Change background to white for clean screenshots
    scene.background = new THREE.Color(0xffffff);

    // Save original camera state
    const originalUp = camera.up.clone();
    const originalTarget = controls.target.clone();
    const originalRotation = camera.rotation.clone(); // Save rotation too
    const originalControlsEnabled = controls.enabled;

    // DISABLE CONTROLS to prevent interference
    controls.enabled = false;

    // FORCE TOP-DOWN VIEW for perfect screenshot
    // 1. Reset Up vector to default Y-axis for standard rotation math
    camera.up.set(0, 1, 0);
    // 2. Position camera straight up
    camera.position.set(0, 100, 0);
    // 3. Look at center - BUT we will force rotation manually to be sure
    camera.lookAt(0, 0, 0);
    // 4. FORCE ROTATION: -90 degrees around X axis is looking straight down
    camera.rotation.set(-Math.PI / 2, 0, 0);

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true); // Force update

    // Get smart frame for the design (if there's a string, frame it perfectly)
    let appliedTranslation = { x: 0, z: 0 };
    const hasDesign = stringPoints.length > 0 || beads.length > 0;
    if (hasDesign) {
        // This will move the design to (0,0) since camera is at (0,0)
        appliedTranslation = frameDesignForCapture() || { x: 0, z: 0 };
    }

    // Render the scene
    renderer.render(scene, camera);

    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Get original canvas dimensions
    const originalCanvas = renderer.domElement;
    const originalWidth = originalCanvas.width;
    const originalHeight = originalCanvas.height;

    // FIX: Preserve ORIGINAL aspect ratio to prevent distortion on mobile (Portrait)
    // Previously forced 4:3 which squashed portrait views
    const originalAspect = originalWidth / originalHeight;
    const maxSize = 1200;
    const quality = 0.95; // Restored missing variable

    let newWidth, newHeight;

    if (originalWidth > originalHeight) {
        // Landscape
        newWidth = Math.min(originalWidth, maxSize);
        newHeight = Math.round(newWidth / originalAspect);
    } else {
        // Portrait
        newHeight = Math.min(originalHeight, maxSize);
        newWidth = Math.round(newHeight * originalAspect);
    }

    // Set temp canvas size
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    // Draw resized image with proper scaling to prevent distortion
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(originalCanvas, 0, 0, newWidth, newHeight);

    // Convert to JPEG with high quality
    const imageData = tempCanvas.toDataURL('image/jpeg', quality);

    // Restore original background
    scene.background = originalBackgroundColor;

    // Restore original camera position and lookAt target
    camera.position.set(originalCameraPosition.x, originalCameraPosition.y, originalCameraPosition.z);
    camera.up.copy(originalUp); // Restore Up vector
    camera.rotation.copy(originalRotation); // Restore rotation

    controls.target.copy(originalTarget);
    controls.enabled = originalControlsEnabled; // Restore controls state
    controls.update();

    // RESTORE DESIGN POSITION
    // We must reverse the translation so the design goes back to where the user had it
    if (appliedTranslation.x !== 0 || appliedTranslation.z !== 0) {
        translateDesignGeometry({
            x: -appliedTranslation.x,
            z: -appliedTranslation.z
        });

    }

    renderer.render(scene, camera);

    // Log size for debugging
    const imageSizeKB = (imageData.length * 0.75) / 1024;


    return imageData;
}

/**
 * Smart framing function - positions camera to perfectly frame the string and beads
 */

/**
 * Get current camera viewport center in world coordinates
 * For orthographic camera, this is based on camera position and zoom
 */
function getCurrentCameraViewportCenter() {
    // For orthographic camera, viewport center is based on camera.position and current zoom
    // Camera is looking at (0, 0, 0), but may have panned via OrbitControls
    const viewWidth = (camera.right - camera.left) / camera.zoom;
    const viewHeight = (camera.top - camera.bottom) / camera.zoom;

    // Calculate center based on camera position (camera.position tells us where we are)
    // Since camera looks at (0, 0, 0) and is at (0, 100, 0), we need to understand the mapping
    // For orthographic camera, we can estimate center based on camera's pan offset

    // Use camera's position offset as the viewport center
    const centerX = camera.position.x; // X position tells us the pan offset
    const centerZ = camera.position.z; // Z position tells us the pan offset




    return {
        x: centerX,
        z: centerZ
    };
}

/**
 * Calculate current design center from stringPaths, stringPoints and beads
 */
function calculateCurrentDesignCenter() {
    let sumX = 0, sumZ = 0;
    let totalPoints = 0;

    const addPoint = (point) => {
        sumX += point.x;
        sumZ += point.z;
        totalPoints++;
    };

    // Collect string points (committed paths)
    if (typeof stringPaths !== 'undefined') {
        stringPaths.forEach(path => {
            path.forEach(addPoint);
        });
    }

    // Collect active string points
    if (typeof stringPoints !== 'undefined' && stringPoints.length > 0) {
        stringPoints.forEach(addPoint);
    }

    // Collect bead positions
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            sumX += bead.position.x;
            sumZ += bead.position.z;
            totalPoints++;
        });
    }

    if (totalPoints === 0) {
        return { x: 0, z: 0 };
    }

    return {
        x: sumX / totalPoints,
        z: sumZ / totalPoints
    };
}

/**
 * Calculate current design bounds (min/max X, Y, Z)
 */
function calculateDesignBounds() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const updateBounds = (point) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
        minZ = Math.min(minZ, point.z);
        maxZ = Math.max(maxZ, point.z);
    };

    // Collect string points (committed paths)
    if (typeof stringPaths !== 'undefined') {
        stringPaths.forEach(path => {
            path.forEach(updateBounds);
        });
    }

    // Collect active string points
    if (typeof stringPoints !== 'undefined') {
        stringPoints.forEach(updateBounds);
    }

    // Collect bead positions
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            updateBounds(bead.position);
        });
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
}

/**
 * Translate all design geometry by the given offset
 * Updates stringPaths, stringPoints and beads positions
 */
function translateDesignGeometry(translation) {
    // Translate string paths (committed)
    if (typeof stringPaths !== 'undefined') {
        stringPaths.forEach(path => {
            path.forEach(point => {
                point.x += translation.x;
                point.z += translation.z;
            });
        });
    }

    // Translate active string points
    if (typeof stringPoints !== 'undefined') {
        stringPoints.forEach(point => {
            point.x += translation.x;
            point.z += translation.z;
        });
    }

    // Update the visual string line
    if (typeof updateStringLine === 'function') {
        updateStringLine();
    }

    // Translate beads
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            bead.position.x += translation.x;
            bead.position.z += translation.z;

            // Update the bead mesh position
            if (bead.mesh) {
                bead.mesh.position.x += translation.x;
                bead.mesh.position.z += translation.z;
            }
        });
    }
}

/**
 * Smart framing function - TWO-MODE APPROACH for email capture
 * Mode 1: Keep camera panning for detail exploration
 * Mode 2: Move design geometry to center under current camera view
 * Safe like preset imports - no rotation, no corruption
 */
function frameDesignForCapture() {
    // Check if we have any design elements
    const hasDesign = (typeof stringPaths !== 'undefined' && stringPaths.length > 0) ||
        (typeof stringPoints !== 'undefined' && stringPoints.length > 0) ||
        (typeof beads !== 'undefined' && beads.length > 0);

    if (!hasDesign) {
        return;
    }

    // STEP 1: Get current camera viewport center in world coordinates
    const cameraCenter = getCurrentCameraViewportCenter();

    // STEP 2: Calculate current design center
    const designCenter = calculateCurrentDesignCenter();

    // STEP 3: Translate design geometry to center under camera view
    const translation = {
        x: cameraCenter.x - designCenter.x,
        z: cameraCenter.z - designCenter.z
    };

    if (translation.x !== 0 || translation.z !== 0) {
        translateDesignGeometry(translation);
    }

    // STEP 4: Calculate optimal zoom (20% screen coverage for "zoomed out" look) using new bounds
    const bounds = calculateDesignBounds();
    const maxScreenDim = Math.max(
        (bounds.maxX - bounds.minX) / (camera.right - camera.left) * (camera.zoom || 1),
        (bounds.maxZ - bounds.minZ) / (camera.top - camera.bottom) * (camera.zoom || 1)
    );

    // User requested "zoomed out by 2x". 
    // Standard fit is ~0.4 coverage. We'll use 0.2 to make it look smaller in the frame.
    const targetScreenCoverage = 0.2;
    const zoomRatio = targetScreenCoverage / maxScreenDim;

    // FIX: Lowered min zoom from 0.5 to 0.1 to allow zooming out for large (5x) designs.
    const optimalZoom = Math.min(Math.max(camera.zoom * zoomRatio * 2.0, 0.1), 5.0);

    // STEP 5: Apply zoom adjustment
    camera.zoom = optimalZoom;
    camera.updateProjectionMatrix();

    return translation; // Return translation so it can be reversed if needed
}

/**
 * Captures complete design data for export
 */
function captureDesignData() {
    const designData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        stringPaths: (typeof stringPaths !== 'undefined') ? stringPaths.map(path => path.map(p => ({ x: p.x, y: p.y, z: p.z }))) : [],
        stringPoints: stringPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
        beads: beads.map(bead => {
            const obj = getObjectById(bead.userData.objectId);
            return {
                objectId: bead.userData.objectId,
                objectName: obj ? obj.name : 'Unknown',
                imagePath: obj ? obj.image : '',
                size: bead.userData.size,
                position: { x: bead.position.x, y: bead.position.y, z: bead.position.z },
                rotation: bead.material.rotation || 0,
                scale: { x: bead.scale.x, y: bead.scale.y },
                stringAngle: bead.userData.stringAngle,
                pathIndex: bead.userData.pathIndex,
                segmentIndex: bead.userData.segmentIndex,
                t: bead.userData.t
            };
        })
    };
    return designData;
}

/**
 * Generates a standalone HTML file with interactive 3D viewer
 */
function generateDesignHTML() {
    const designData = captureDesignData();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bead Design Viewer - ${new Date().toLocaleDateString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #f0f0f0;
            overflow-x: hidden;
        }
        #header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #header h1 { font-size: 28px; margin-bottom: 5px; }
        #header p { font-size: 14px; opacity: 0.9; }
        #viewer-container {
            width: 100%;
            height: 70vh;
            background: #fff;
            position: relative;
            border-bottom: 3px solid #667eea;
        }
        #canvas-3d { width: 100%; height: 100%; display: block; }
        #info-panel {
            padding: 20px;
            background: white;
            margin: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number { font-size: 32px; font-weight: bold; }
        .stat-label { font-size: 14px; opacity: 0.9; margin-top: 5px; }
        .button {
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            transition: all 0.3s;
        }
        .button:hover { background: #764ba2; transform: translateY(-2px); }
        .controls {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 15px 0;
        }
        .help-text {
            text-align: center;
            color: #666;
            font-size: 14px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
            margin: 10px 0;
        }
        #data-section {
            max-height: 400px;
            overflow-y: auto;
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div id="header">
        <h1>🎨 Interactive Bead Design Viewer</h1>
        <p>Created: ${new Date(designData.timestamp).toLocaleString()} | ${designData.beads.length} Beads | ${designData.stringPoints.length} String Points</p>
    </div>

    <div id="viewer-container">
        <canvas id="canvas-3d"></canvas>
    </div>

    <div id="info-panel">
        <div class="help-text">
            🖱️ <strong>Controls:</strong> Drag to rotate • Scroll to zoom • Right-click drag to pan<br>
            <small style="opacity: 0.8;">Note: Images load from your GitHub Pages site. If beads appear as colored spheres, update the baseURL in the code below.</small>
        </div>

        <div class="stats">
            <div class="stat-box">
                <div class="stat-number">${designData.beads.length}</div>
                <div class="stat-label">Total Beads</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${designData.stringPoints.length}</div>
                <div class="stat-label">String Points</div>
            </div>
        </div>

        <div class="controls">
            <button class="button" onclick="resetCamera()">🔄 Reset View</button>
            <button class="button" onclick="toggleData()">📋 View Data</button>
            <button class="button" onclick="downloadJSON()">💾 Download JSON</button>
        </div>

        <div id="data-section" style="display: none;">
            <pre>${JSON.stringify(designData, null, 2)}</pre>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    
    <script>
        const designData = ${JSON.stringify(designData)};
        let scene, camera, renderer, controls;

        // Initialize 3D scene
        function init() {
            const container = document.getElementById('canvas-3d');
            
            // Scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            
            // Camera
            camera = new THREE.PerspectiveCamera(
                45,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );
            camera.position.set(0, 5, 10);
            camera.lookAt(0, 0, 0);
            
            // Renderer
            renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            
            // Controls
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 7.5);
            scene.add(directionalLight);
            
            // Grid
            const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
            scene.add(gridHelper);
            
            // Load design
            loadDesign();
            
            // Animation loop
            animate();
            
            // Handle resize
            window.addEventListener('resize', onWindowResize);
        }

        function loadDesign() {
            // Get base URL (for loading images from GitHub Pages)
            // Will use current page's origin, or you can set a fixed GitHub Pages URL
            const baseURL = window.location.origin.includes('github.io') 
                ? window.location.origin + '/' 
                : 'https://sell-rosaries.github.io/rosaries/';
            
            // Draw string
            if (designData.stringPoints && designData.stringPoints.length >= 2) {
                const stringGeometry = new THREE.BufferGeometry();
                const positions = [];
                designData.stringPoints.forEach(p => {
                    positions.push(p.x, p.y, p.z);
                });
                stringGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                const stringMaterial = new THREE.LineBasicMaterial({ color: 0x5d4037, linewidth: 2 });
                const stringLine = new THREE.Line(stringGeometry, stringMaterial);
                scene.add(stringLine);
            }
            
            // Draw beads with actual images
            if (designData.beads && designData.beads.length > 0) {
                const textureLoader = new THREE.TextureLoader();
                
                designData.beads.forEach(beadData => {
                    const imageURL = baseURL + beadData.imagePath;
                    
                    textureLoader.load(
                        imageURL,
                        (texture) => {
                            // Success - create sprite with actual image
                            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
                            material.rotation = beadData.rotation || 0;
                            const sprite = new THREE.Sprite(material);
                            sprite.scale.set(beadData.scale.x, beadData.scale.y, 1);
                            sprite.position.set(beadData.position.x, beadData.position.y, beadData.position.z);
                            scene.add(sprite);
                        },
                        undefined,
                        (error) => {
                            // Fallback to colored sphere if image fails to load
                            console.warn('Failed to load image:', imageURL, '- using fallback sphere');
                            const geometry = new THREE.SphereGeometry(beadData.size / 20, 16, 16);
                            const material = new THREE.MeshStandardMaterial({ 
                                color: Math.random() * 0xffffff,
                                roughness: 0.5,
                                metalness: 0.2
                            });
                            const bead = new THREE.Mesh(geometry, material);
                            bead.position.set(beadData.position.x, beadData.position.y, beadData.position.z);
                            bead.rotation.z = beadData.rotation || 0;
                            scene.add(bead);
                        }
                    );
                });
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        function onWindowResize() {
            const container = document.getElementById('canvas-3d');
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }

        function resetCamera() {
            camera.position.set(0, 5, 10);
            camera.lookAt(0, 0, 0);
            controls.reset();
        }

        function toggleData() {
            const dataSection = document.getElementById('data-section');
            dataSection.style.display = dataSection.style.display === 'none' ? 'block' : 'none';
        }

        function downloadJSON() {
            const blob = new Blob([JSON.stringify(designData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bead-design-' + new Date().getTime() + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Start the viewer
        init();
    </script>
</body>
</html>`;

    return html;
}

// Make function globally accessible for save functionality
window.frameDesignForCapture = frameDesignForCapture;
