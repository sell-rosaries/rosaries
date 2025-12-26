/*
    STRING SIZE SLIDER MODULE
    Handles resizing the rosary string loop while maintaining bead size and relative positions.
    Restored & Adapted for Multi-String Support
*/

let baseStringPaths = []; // Array of arrays of Vector3
let isInitialized = false;
window.currentStringScale = 0; // Global tracker for save/load
window.baseStringPaths = baseStringPaths; // Export for fit function

/**
 * Initialize the slider logic.
 * Exposed globally so it can be called on app init.
 */
window.initStringSlider = function () {
    setupSliderEvents();
    // Capture initial state if string exists
    const hasString = (typeof stringPaths !== 'undefined' && stringPaths.length > 0) || (typeof stringPoints !== 'undefined' && stringPoints.length > 0);

    if (hasString) {
        if (!window.currentStringScale) {
            window.resetSliderBase();
        }
    }
    isInitialized = true;
};

/**
 * Resets the base geometry for scaling.
 * Should be called whenever the string is redrawn (new shape), imported, or restored.
 */
window.resetSliderBase = function () {
    // ALWAYS reset the scale and UI first to prevent inheritance bugs
    window.currentStringScale = 0;
    updateSliderUI(0);

    baseStringPaths = [];

    // 1. Capture Committed Paths
    if (typeof stringPaths !== 'undefined' && stringPaths.length > 0) {
        stringPaths.forEach(path => {
            baseStringPaths.push(path.map(p => p.clone()));
        });
    }

    // 2. Capture Active String (if any, though rare during scale)
    if (typeof stringPoints !== 'undefined' && stringPoints.length > 0) {
        baseStringPaths.push(stringPoints.map(p => p.clone()));
    }

    window.baseStringPaths = baseStringPaths; // Update global reference
};

/**
 * Restores the slider state from a saved percentage.
 */
window.restoreSliderState = function (savedPercentage) {
    // Check if we have any string data
    const hasData = (typeof stringPaths !== 'undefined' && stringPaths.length > 0) || (typeof stringPoints !== 'undefined' && stringPoints.length > 0);
    if (!hasData) return;

    window.currentStringScale = savedPercentage;

    // 1. Calculate the scale factor that was applied
    const appliedScale = 1 + (savedPercentage / 100) * 4.0;

    // 2. Reverse-engineer the base points
    // Center calculation must match applyStringScale
    const center = new THREE.Vector3();
    let totalPoints = 0;

    const collectPoints = (path) => {
        path.forEach(p => {
            center.add(p);
            totalPoints++;
        });
    };

    if (stringPaths) stringPaths.forEach(collectPoints);
    if (stringPoints) collectPoints(stringPoints);

    if (totalPoints > 0) center.divideScalar(totalPoints);

    // Reconstruct base paths
    baseStringPaths = [];

    // Helper to unscale
    const unscalePath = (path) => {
        return path.map(p => {
            const vec = new THREE.Vector3().subVectors(p, center);
            vec.divideScalar(appliedScale);
            return new THREE.Vector3().copy(center).add(vec);
        });
    };

    if (stringPaths) stringPaths.forEach(path => baseStringPaths.push(unscalePath(path)));
    if (stringPoints && stringPoints.length > 0) baseStringPaths.push(unscalePath(stringPoints));

    window.baseStringPaths = baseStringPaths; // Update global reference

    // 3. Update UI
    updateSliderUI(savedPercentage);
};

function updateSliderUI(percentage) {
    const sliderLiquid = document.querySelector('.size-slider-liquid');
    const sliderLevel = document.querySelector('.size-slider-level-indicator');

    if (sliderLiquid) {
        sliderLiquid.style.height = percentage + '%';
        sliderLiquid.style.transition = 'none';
    }
    if (sliderLevel) sliderLevel.style.bottom = percentage + '%';
}

/**
 * Setup slider event listeners and interactions
 */
function setupSliderEvents() {
    const sliderTube = document.querySelector('.size-slider-tube');
    const sliderLiquid = document.querySelector('.size-slider-liquid');
    const sliderLevel = document.querySelector('.size-slider-level-indicator');

    if (!sliderTube || !sliderLiquid || !sliderLevel) {
        return;
    }

    // Create red minimum limit line indicator
    let minLimitLine = document.querySelector('.size-slider-min-limit');
    if (!minLimitLine) {
        minLimitLine = document.createElement('div');
        minLimitLine.className = 'size-slider-min-limit';
        minLimitLine.style.cssText = `
            position: absolute;
            left: -4px;
            right: -4px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #ff3b5c 20%, #ff3b5c 80%, transparent);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease, bottom 0.15s ease;
            z-index: 5;
            box-shadow: 0 0 8px rgba(255, 59, 92, 0.6);
        `;
        sliderTube.appendChild(minLimitLine);
    }

    let isDragging = false;
    let lastPercentage = window.currentStringScale || 0;
    let currentMinPercentage = 0;

    // Mouse events
    sliderTube.addEventListener('mousedown', startDragging);
    if (sliderLiquid) sliderLiquid.addEventListener('mousedown', startDragging);
    if (sliderLevel) sliderLevel.addEventListener('mousedown', startDragging);

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);

    // Touch events
    sliderTube.addEventListener('touchstart', startDragging, { passive: false });
    if (sliderLiquid) sliderLiquid.addEventListener('touchstart', startDragging, { passive: false });
    if (sliderLevel) sliderLevel.addEventListener('touchstart', startDragging, { passive: false });

    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', stopDragging);

    async function startDragging(e) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;

        lastPercentage = window.currentStringScale || 0;

        if (typeof exitEraserMode === 'function') {
            exitEraserMode();
        } else if (typeof exitStringMode === 'function') {
            exitStringMode();
        }

        sliderLiquid.style.transition = 'none';
        sliderLevel.style.transition = 'none';

        if (typeof window.performBasicSmartFraming === 'function') {
            const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
            const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
            window.performBasicSmartFraming({ mode });
        }

        if (window.gravityState) {
            window.gravityState.active = false;
        }
        if (window.stopGravitySimulation) {
            window.stopGravitySimulation();
        }

        handleSizeChange(e);

        sliderTube.style.transform = 'scale(1.05)';
        sliderTube.style.transition = 'transform 0.1s ease';
    }

    function handleDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        handleSizeChange(e);
    }

    function stopDragging(e) {
        if (!isDragging) return;
        e.preventDefault();
        isDragging = false;

        hidePercentage();

        sliderLiquid.style.transition = '';
        sliderLevel.style.transition = '';

        sliderTube.style.transform = '';
        sliderTube.style.transition = '';

        if (typeof window.performBasicSmartFraming === 'function') {
            const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
            const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
            window.performBasicSmartFraming({ mode });
        }

        if (window.gravityState) {
            window.gravityState.active = false;
        }

        const currentPercentage = window.currentStringScale || 0;
        const speedMultiplier = 1 + (currentPercentage / 100) * 4.0;
        const gravitySpeed = 9.0 * speedMultiplier;

        if (typeof window.startGravitySimulation === 'function') {
            window.startGravitySimulation({ speed: gravitySpeed, saveOnComplete: true });
        }
    }

    function handleSizeChange(e) {
        if (baseStringPaths.length === 0) return;

        const rect = sliderTube.getBoundingClientRect();
        let clientY;

        if (e.touches && e.touches[0]) {
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches[0]) {
            clientY = e.changedTouches[0].clientY;
        } else {
            clientY = e.clientY;
        }

        let percentage = Math.max(0, Math.min(100,
            ((rect.bottom - clientY) / rect.height) * 100
        ));

        // Simplified constraint check for multi-string 
        // We're essentially disabling the complex minScale check for multi-string 
        // to ensure robustness, relying on visual feedback.
        // For Single String (Presets), we could re-enable it, but let's keep it simple.

        // Update Global State
        window.currentStringScale = percentage;
        lastPercentage = percentage;

        sliderLiquid.style.height = percentage + '%';
        sliderLevel.style.bottom = percentage + '%';

        showPercentage(percentage, clientY, rect.right);

        applyStringScale(percentage);
        packBeadsOnString();

        if (typeof window.performBasicSmartFraming === 'function') {
            const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
            const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
            window.performBasicSmartFraming({ mode });
        }
    }
}

let toastTimeout;
let lastToastTime = 0;

function showToast(message) {
    const now = Date.now();
    if (now - lastToastTime < 3000) return;
    lastToastTime = now;

    const existingToast = document.querySelector('.slider-limit-toast');
    if (existingToast) existingToast.remove();

    const title = window.getTranslation ? window.getTranslation('slider-limit-toast-title') : 'Too many beads!';
    const subtext = window.getTranslation ? window.getTranslation('slider-limit-toast-message') : "Can't make it smaller";

    const toast = document.createElement('div');
    toast.className = 'slider-limit-toast';
    toast.innerHTML = `<div style="text-align: center;"><div>${title}</div><div style="font-size: 14px; opacity: 0.9;">${subtext}</div></div>`;
    toast.style.cssText = `position: fixed; top: 100px; left: 50%; transform: translateX(-50%); background: rgba(34, 197, 94, 0.98); color: white; padding: 12px 24px; border-radius: 8px; z-index: 1000; pointer-events: none;`;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

let percentageIndicator;
function showPercentage(percentage, y, x) {
    if (!percentageIndicator) {
        percentageIndicator = document.createElement('div');
        percentageIndicator.id = 'slider-percentage';
        percentageIndicator.style.cssText = `position: fixed; background: rgba(255, 255, 255, 0.9); color: #000; padding: 4px 8px; border-radius: 4px; z-index: 1000; pointer-events: none; font-size: 12px; font-weight: bold; transform: translateY(-50%);`;
        document.body.appendChild(percentageIndicator);
    }
    percentageIndicator.textContent = Math.round(percentage) + '%';
    percentageIndicator.style.top = y + 'px';
    percentageIndicator.style.left = (x + 15) + 'px';
    percentageIndicator.style.display = 'block';
}

function hidePercentage() {
    if (percentageIndicator) percentageIndicator.style.display = 'none';
}

/**
 * Scales the string and updates bead positions
 * @param {number} percentage - 0 to 100
 */
function applyStringScale(percentage) {
    const scale = 1 + (percentage / 100) * 4.0;

    // Calculate Global Centroid
    const center = new THREE.Vector3();
    let totalPoints = 0;

    baseStringPaths.forEach(path => {
        path.forEach(p => {
            center.add(p);
            totalPoints++;
        });
    });

    if (totalPoints > 0) center.divideScalar(totalPoints);

    // Apply scale to ALL stringPaths
    let pathIdx = 0;
    // Commited Paths
    if (typeof stringPaths !== 'undefined') {
        for (let i = 0; i < stringPaths.length; i++) {
            if (pathIdx < baseStringPaths.length) {
                const basePath = baseStringPaths[pathIdx];
                const targetPath = stringPaths[i];
                if (basePath.length === targetPath.length) {
                    for (let j = 0; j < basePath.length; j++) {
                        const baseP = basePath[j];
                        const vec = new THREE.Vector3().subVectors(baseP, center);
                        vec.multiplyScalar(scale);
                        targetPath[j].copy(center).add(vec);
                    }
                }
                pathIdx++;
            }
        }
    }
    // Active Path
    if (typeof stringPoints !== 'undefined' && stringPoints.length > 0) {
        if (pathIdx < baseStringPaths.length) {
            const basePath = baseStringPaths[pathIdx];
            if (basePath.length === stringPoints.length) {
                for (let j = 0; j < basePath.length; j++) {
                    const baseP = basePath[j];
                    const vec = new THREE.Vector3().subVectors(baseP, center);
                    vec.multiplyScalar(scale);
                    stringPoints[j].copy(center).add(vec);
                }
            }
        }
    }

    if (typeof updateStringLine === 'function') updateStringLine();
    updateBeadPositions();
}

/**
 * Updates all bead positions based on their segment attachment
 */
function updateBeadPositions() {
    if (typeof beads === 'undefined') return;

    beads.forEach(bead => {
        const segIdx = bead.userData.segmentIndex;
        const t = bead.userData.t;
        const pIdx = bead.userData.pathIndex !== undefined ? bead.userData.pathIndex : 0; // Default to 0 for single string

        // Find correct path
        let path = null;
        if (pIdx === -1 && stringPoints.length > 0) path = stringPoints; // Legacy/Active
        else if (stringPaths && stringPaths[pIdx]) path = stringPaths[pIdx];

        if (path && segIdx >= 0 && segIdx < path.length - 1) {
            const p1 = path[segIdx];
            const p2 = path[segIdx + 1];
            bead.position.copy(p1).lerp(p2, t);
            bead.position.y = 0.1;
        }
    });
}

function calculateMinScale() {
    return 1.0;
}

window.syncBeadAttachmentData = function () { };

/**
 * Packs beads together on the string.
 * ADAPTED BACKUP LOGIC: Packs beads around median, but PER PATH.
 */
function packBeadsOnString() {
    if (typeof beads === 'undefined' || beads.length === 0) return;

    // Group beads by path to apply packing logic independently
    const beadsByPath = new Map();
    beads.forEach(bead => {
        const pIdx = bead.userData.pathIndex !== undefined ? bead.userData.pathIndex : 0;
        if (!beadsByPath.has(pIdx)) beadsByPath.set(pIdx, []);
        beadsByPath.get(pIdx).push(bead);
    });

    beadsByPath.forEach((pathBeads, pIdx) => {
        // Find path
        let path = null;
        if (pIdx === -1) path = stringPoints;
        else if (stringPaths && stringPaths[pIdx]) path = stringPaths[pIdx];

        if (!path || path.length < 2) return;

        // --- BACKUP LOGIC APPLIED PER PATH ---

        // 1. Calculate length
        let totalStringLength = 0;
        const segmentLengths = [];
        for (let i = 0; i < path.length - 1; i++) {
            const len = path[i].distanceTo(path[i + 1]);
            segmentLengths.push(len);
            totalStringLength += len;
        }

        // 2. Sort beads
        const beadData = pathBeads.map(bead => {
            let dist = 0;
            const segIdx = bead.userData.segmentIndex || 0;
            const t = bead.userData.t || 0;
            for (let i = 0; i < segIdx; i++) dist += segmentLengths[i];
            dist += segmentLengths[segIdx] * t;

            const radius = Math.max(bead.scale.x, bead.scale.y) / 2;
            return { bead, currentDist: dist, radius };
        });

        beadData.sort((a, b) => a.currentDist - b.currentDist);
        if (beadData.length === 0) return;

        // 3. Median Anchor
        const medianIndex = Math.floor(beadData.length / 2);
        const medianBead = beadData[medianIndex];
        let anchorDist = medianBead.currentDist;

        // 4. Spread
        const offsets = new Array(beadData.length).fill(0);

        // Backward
        let currentOffset = -medianBead.radius;
        for (let i = medianIndex - 1; i >= 0; i--) {
            const b = beadData[i];
            currentOffset -= b.radius;
            offsets[i] = currentOffset;
            currentOffset -= b.radius;
        }

        // Forward
        currentOffset = medianBead.radius;
        for (let i = medianIndex + 1; i < beadData.length; i++) {
            const b = beadData[i];
            currentOffset += b.radius;
            offsets[i] = currentOffset;
            currentOffset += b.radius;
        }

        // 5. Shift if bounds hit
        let minD = anchorDist + offsets[0];
        let maxD = anchorDist + offsets[beadData.length - 1];

        if (minD < 0) anchorDist += -minD;
        else if (maxD > totalStringLength) anchorDist -= (maxD - totalStringLength);

        // 6. Apply
        beadData.forEach((d, i) => {
            let targetDist = anchorDist + offsets[i];
            targetDist = Math.max(0, Math.min(totalStringLength, targetDist));

            // Map back to segment/t
            let remaining = targetDist;
            let newSeg = 0;
            let newT = 0;
            for (let s = 0; s < segmentLengths.length; s++) {
                if (remaining <= segmentLengths[s] || s === segmentLengths.length - 1) {
                    newSeg = s;
                    newT = segmentLengths[s] > 0.0001 ? remaining / segmentLengths[s] : 0;
                    break;
                }
                remaining -= segmentLengths[s];
            }

            d.bead.userData.segmentIndex = newSeg;
            d.bead.userData.t = newT;
        });
    });
}
