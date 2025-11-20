/*
Auto-Fit System
Core logic for smart framing and fitting designs to current sandbox view.
*/
function getCurrentCameraViewportCenter() {
    // For orthographic camera, viewport center is based on camera position and zoom
    // Camera is looking at (0, 0, 0), but may have panned via OrbitControls
    const viewWidth = (camera.right - camera.left) / camera.zoom;
    const viewHeight = (camera.top - camera.bottom) / camera.zoom;

    // Calculate center based on camera position (camera.position tells us where we are)
    // Since camera looks at (0, 0, 0) and is at (0, 100, 0), we need to understand the mapping
    // For orthographic camera, we can estimate center based on camera's pan offset

    // Use camera's position offset as the viewport center
    const centerX = camera.position.x; // X position tells us the pan offset
    const centerZ = camera.position.z; // Z position tells us the pan offset

    console.log('📊 Viewport dimensions:', { width: viewWidth, height: viewHeight });
    console.log('📊 Camera position (pan offset):', { x: centerX, z: centerZ });

    return {
        x: centerX,
        z: centerZ
    };
}

function calculateCurrentDesignCenter() {
    let sumX = 0, sumZ = 0;
    let totalPoints = 0;

    // Collect string points
    if (typeof stringPoints !== 'undefined' && stringPoints.length > 0) {
        stringPoints.forEach(point => {
            sumX += point.x;
            sumZ += point.z;
        });
        totalPoints += stringPoints.length;
    }

    // Collect bead positions
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            sumX += bead.position.x;
            sumZ += bead.position.z;
        });
        totalPoints += beads.length;
    }

    if (totalPoints === 0) {
        return { x: 0, z: 0 };
    }

    return {
        x: sumX / totalPoints,
        z: sumZ / totalPoints
    };
}

function calculateDesignBounds() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    // Collect string points
    if (typeof stringPoints !== 'undefined') {
        stringPoints.forEach(point => {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
            minZ = Math.min(minZ, point.z);
            maxZ = Math.max(maxZ, point.z);
        });
    }

    // Collect bead positions
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            minX = Math.min(minX, bead.position.x);
            maxX = Math.max(maxX, bead.position.x);
            minY = Math.min(minY, bead.position.y);
            maxY = Math.max(maxY, bead.position.y);
            minZ = Math.min(minZ, bead.position.z);
            maxZ = Math.max(maxZ, bead.position.z);
        });
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
}

function translateDesignGeometry(translation) {
    // Translate string points
    if (typeof stringPoints !== 'undefined') {
        stringPoints.forEach(point => {
            point.x += translation.x;
            point.z += translation.z;
        });

        // Update the visual string line
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
 * SMART FRAMING: Auto-fit design to current view
 * @param {Object} options - Optional configuration parameters
 * @param {number} options.screenCoverage - Target screen coverage (0.0-1.0, default: 0.415)
 * @param {number} options.verticalOffset - Z-axis offset to move design up/down (default: -1.2)
 */
function performBasicSmartFraming(options = {}) {
    console.log('🧪 TEST FIT: Smart framing with design repositioning to current view');

    // Mode-based defaults (preset/mix-mode default)
    let screenCoverage = 0.415;
    let verticalOffset = -1.2;

    if (options.mode === 'pen-mode') {
        screenCoverage = 0.415;
        verticalOffset = -0.15;
    }

    // Override with explicit options if provided
    if (options.screenCoverage !== undefined) screenCoverage = options.screenCoverage;
    if (options.verticalOffset !== undefined) verticalOffset = options.verticalOffset;

    console.log('⚙️ Fit options:', { screenCoverage, verticalOffset });

    // Check if we have any design elements
    const hasDesign = (typeof stringPoints !== 'undefined' && stringPoints.length > 0) ||
        (typeof beads !== 'undefined' && beads.length > 0);

    if (!hasDesign) {
        console.log('⚠️ No design elements to fit');
        alert(window.getTranslation('import-error-empty') || 'No design to fit! Add some beads or draw a string first.');
        return;
    }

    // STEP 1: Get current camera viewport center in world coordinates
    const cameraCenter = getCurrentCameraViewportCenter();
    console.log('📍 Camera viewport center:', cameraCenter);

    // STEP 2: Calculate current design center
    const designCenter = calculateCurrentDesignCenter();
    console.log('🎯 Current design center:', designCenter);

    // Calculate scale multiplier from slider
    const sliderPercentage = window.currentStringScale || 0;
    const scaleMultiplier = 1 + (sliderPercentage / 100) * 2.0; // 1.0x to 3.0x

    // Scale vertical offset to maintain relative framing
    // If the object is 3x bigger, we need 3x the offset to keep it in the same visual spot relative to center
    const scaledVerticalOffset = verticalOffset * scaleMultiplier;

    // STEP 3: Translate design geometry to center under camera view + vertical offset
    const translation = {
        x: cameraCenter.x - designCenter.x,
        z: cameraCenter.z - designCenter.z + scaledVerticalOffset
    };

    console.log('📐 Translation needed:', translation, `(Offset: ${verticalOffset} -> ${scaledVerticalOffset.toFixed(2)})`);

    if (translation.x !== 0 || translation.z !== 0) {
        translateDesignGeometry(translation);
        console.log('✅ Design geometry translated by:', translation);
    }

    // STEP 4: Calculate optimal zoom using configured screen coverage
    const bounds = calculateDesignBounds();
    const maxScreenDim = Math.max(
        (bounds.maxX - bounds.minX) / (camera.right - camera.left) * (camera.zoom || 1),
        (bounds.maxZ - bounds.minZ) / (camera.top - camera.bottom) * (camera.zoom || 1)
    );

    const targetScreenCoverage = screenCoverage;
    const zoomRatio = targetScreenCoverage / maxScreenDim;

    // FIX: Lowered min zoom from 0.5 to 0.1 to allow zooming out for large (100% scaled) designs.
    // Previously, the 0.5 limit caused large designs to be clamped and appear "too big".
    let optimalZoom = Math.min(Math.max(camera.zoom * zoomRatio * 2.0, 0.1), 5.0);

    // STEP 4.5: Compensate for slider scale
    // REMOVED: With the zoom clamp fixed (0.5 -> 0.1), the standard linear math works perfectly 
    // for all shapes (Heart, Rosary, Circle, Pen). 
    // The bounding box scales by X, so the zoom divides by X, resulting in identical visual size.

    console.log('📏 TEST FIT: Natural zoom:', optimalZoom.toFixed(2), `(slider: ${sliderPercentage.toFixed(0)}%)`);

    // STEP 5: Apply zoom adjustment
    camera.zoom = optimalZoom;
    camera.updateProjectionMatrix();

    console.log('✅ TEST FIT complete: Design positioned under camera view + zoom:', camera.zoom.toFixed(2));
    console.log('🔒 Design now appears in current viewport - users can still pan for detail exploration');
}

// Global function exports
window.getCurrentCameraViewportCenter = getCurrentCameraViewportCenter;
window.calculateCurrentDesignCenter = calculateCurrentDesignCenter;
window.calculateDesignBounds = calculateDesignBounds;
window.translateDesignGeometry = translateDesignGeometry;
window.performBasicSmartFraming = performBasicSmartFraming;
