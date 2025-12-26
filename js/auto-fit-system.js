/*
Auto-Fit System
Core logic for smart framing and fitting designs to current sandbox view.
Restored & Adapted
*/
function getCurrentCameraViewportCenter() {
    const centerX = camera.position.x;
    const centerZ = camera.position.z;
    return { x: centerX, z: centerZ };
}

function calculateCurrentDesignCenter() {
    let sumX = 0, sumZ = 0;
    let totalPoints = 0;

    const add = (p) => { sumX += p.x; sumZ += p.z; totalPoints++; };

    if (typeof stringPaths !== 'undefined') stringPaths.forEach(path => path.forEach(add));
    if (typeof stringPoints !== 'undefined') stringPoints.forEach(add);

    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            sumX += bead.position.x;
            sumZ += bead.position.z;
            totalPoints++;
        });
    }

    if (totalPoints === 0) return { x: 0, z: 0 };
    return { x: sumX / totalPoints, z: sumZ / totalPoints };
}

function calculateDesignBounds() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const check = (p) => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    };

    if (typeof stringPaths !== 'undefined') stringPaths.forEach(path => path.forEach(check));
    if (typeof stringPoints !== 'undefined') stringPoints.forEach(check);
    if (typeof beads !== 'undefined') beads.forEach(b => check(b.position));

    if (minX === Infinity) return { minX: -5, maxX: 5, minY: 0, maxY: 0, minZ: -5, maxZ: 5 };
    return { minX, maxX, minY, maxY, minZ, maxZ };
}

function translateDesignGeometry(translation) {
    const apply = (p) => { p.x += translation.x; p.z += translation.z; };

    if (typeof stringPaths !== 'undefined') stringPaths.forEach(path => path.forEach(apply));
    if (typeof stringPoints !== 'undefined') stringPoints.forEach(apply);
    if (typeof baseStringPaths !== 'undefined') baseStringPaths.forEach(path => path.forEach(apply));

    if (typeof updateStringLine === 'function') updateStringLine();

    if (typeof beads !== 'undefined') {
        beads.forEach(bead => {
            bead.position.x += translation.x;
            bead.position.z += translation.z;
            if (bead.mesh) {
                bead.mesh.position.x += translation.x;
                bead.mesh.position.z += translation.z;
            }
        });
    }
}

function performBasicSmartFraming(options = {}) {
    let screenCoverage = 0.415;
    let verticalOffset = -1.2;

    if (options.mode === 'pen-mode') {
        screenCoverage = 0.415;
        verticalOffset = -0.15;
    }

    if (options.screenCoverage !== undefined) screenCoverage = options.screenCoverage;
    if (options.verticalOffset !== undefined) verticalOffset = options.verticalOffset;

    // Check availability
    const hasPaths = typeof stringPaths !== 'undefined' && stringPaths.length > 0;
    const hasPoints = typeof stringPoints !== 'undefined' && stringPoints.length > 0;
    const hasBeads = typeof beads !== 'undefined' && beads.length > 0;

    if (!hasPaths && !hasPoints && !hasBeads) return;

    const cameraCenter = getCurrentCameraViewportCenter();
    const designCenter = calculateCurrentDesignCenter();

    const sliderPercentage = window.currentStringScale || 0;
    const scaleMultiplier = 1 + (sliderPercentage / 100) * 4.0;
    const scaledVerticalOffset = verticalOffset * scaleMultiplier;

    const translation = {
        x: cameraCenter.x - designCenter.x,
        z: cameraCenter.z - designCenter.z + scaledVerticalOffset
    };

    if (Math.abs(translation.x) > 0.001 || Math.abs(translation.z) > 0.001) {
        translateDesignGeometry(translation);
    }

    const bounds = calculateDesignBounds();
    const maxScreenDim = Math.max(
        (bounds.maxX - bounds.minX) / (camera.right - camera.left) * (camera.zoom || 1),
        (bounds.maxZ - bounds.minZ) / (camera.top - camera.bottom) * (camera.zoom || 1)
    );

    const zoomRatio = screenCoverage / maxScreenDim;
    let optimalZoom = Math.min(Math.max(camera.zoom * zoomRatio * 2.0, 0.1), 5.0);

    camera.zoom = optimalZoom;
    camera.updateProjectionMatrix();
}

window.getCurrentCameraViewportCenter = getCurrentCameraViewportCenter;
window.calculateCurrentDesignCenter = calculateCurrentDesignCenter;
window.calculateDesignBounds = calculateDesignBounds;
window.translateDesignGeometry = translateDesignGeometry;
window.performBasicSmartFraming = performBasicSmartFraming;
