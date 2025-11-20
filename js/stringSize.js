/*
    STRING SIZE SLIDER MODULE
    Handles resizing the rosary string loop while maintaining bead size and relative positions.
*/

let baseStringPoints = [];
let isInitialized = false;
window.currentStringScale = 0; // Global tracker for save/load
window.baseStringPoints = baseStringPoints; // Export for fit function

/**
 * Initialize the slider logic.
 * Exposed globally so it can be called on app init.
 */
window.initStringSlider = function () {
    setupSliderEvents();
    // Capture initial state if string exists
    if (typeof stringPoints !== 'undefined' && stringPoints.length > 0) {
        // If we have a saved scale, we need to reverse-engineer the base points
        // But typically resetSliderBase is called when a NEW string is drawn.
        // If restoring, restoreSliderState handles it.
        if (!window.currentStringScale) {
            window.resetSliderBase();
        }
    }
    isInitialized = true;
    console.log('📏 String size slider initialized');
};

/**
 * Resets the base geometry for scaling.
 * Should be called whenever the string is redrawn (new shape), imported, or restored.
 */
window.resetSliderBase = function () {
    if (typeof stringPoints === 'undefined' || stringPoints.length === 0) {
        baseStringPoints = [];
        return;
    }

    // Deep copy the current string points as the new base (0%)
    baseStringPoints = stringPoints.map(p => p.clone());
    window.baseStringPoints = baseStringPoints; // Update global reference

    // Reset UI to 0%
    window.currentStringScale = 0;
    updateSliderUI(0);

    console.log('📏 String size base reset. Points:', baseStringPoints.length);
};

/**
 * Restores the slider state from a saved percentage.
 * This is tricky: The saved 'stringPoints' are ALREADY scaled.
 * So we need to calculate what the 'base' (0%) points were.
 */
window.restoreSliderState = function (savedPercentage) {
    if (typeof stringPoints === 'undefined' || stringPoints.length === 0) return;

    console.log(`📏 Restoring slider state: ${savedPercentage}%`);
    window.currentStringScale = savedPercentage;

    // 1. Calculate the scale factor that was applied
    // Scale = 1 + (p/100)*4
    const appliedScale = 1 + (savedPercentage / 100) * 4.0;

    // 2. Reverse-engineer the base points
    // current = center + (base - center) * scale
    // (current - center) / scale = base - center
    // base = center + (current - center) / scale

    const center = new THREE.Vector3();
    stringPoints.forEach(p => center.add(p));
    center.divideScalar(stringPoints.length);

    baseStringPoints = stringPoints.map(p => {
        const vec = new THREE.Vector3().subVectors(p, center);
        vec.divideScalar(appliedScale);
        return new THREE.Vector3().copy(center).add(vec);
    });
    window.baseStringPoints = baseStringPoints; // Update global reference

    // 3. Update UI
    updateSliderUI(savedPercentage);
};

function updateSliderUI(percentage) {
    const sliderLiquid = document.querySelector('.size-slider-liquid');
    const sliderLevel = document.querySelector('.size-slider-level-indicator');

    if (sliderLiquid) {
        sliderLiquid.style.height = percentage + '%';
        // Remove animation temporarily to prevent jumping
        sliderLiquid.style.transition = 'none';
        setTimeout(() => sliderLiquid.style.transition = '', 50);
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
        console.warn('⚠️ String size slider elements not found in DOM');
        return;
    }

    let isDragging = false;

    // Mouse events
    sliderTube.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);

    // Touch events
    sliderTube.addEventListener('touchstart', startDragging, { passive: false });
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', stopDragging);

    async function startDragging(e) {
        e.preventDefault();
        isDragging = true;

        // 1. Load saved design (User Requirement)
        // We do this first to ensure we are working on the correct state
        if (typeof window.autoRestoreDesign === 'function') {
            // Note: This might be jarring if it takes time, but it's requested.
            // We await it to ensure base points are correct before scaling.
            await window.autoRestoreDesign();
        }

        // DO NOT reset base here. 
        // resetSliderBase() sets base = current. If we do this on every drag,
        // the scale accumulates (compound interest) -> infinite growth.
        // We only want to reset base when the SHAPE changes (new string/import),
        // not when we are just resizing the existing shape.

        // However, if we just loaded the design, restoreSliderState should have set the correct base.
        // If we didn't load, we assume the current base is valid.

        // Disable transitions for instant feedback (No Lag)
        sliderLiquid.style.transition = 'none';
        sliderLevel.style.transition = 'none';

        // Call Fit Function (Start of interaction)
        if (typeof window.performBasicSmartFraming === 'function') {
            const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
            const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
            window.performBasicSmartFraming({ mode });
        }

        // Start Live Gravity (High Speed, No Save)
        if (typeof window.startGravitySimulation === 'function') {
            // Force restart if needed, but mainly set high speed
            window.startGravitySimulation({ speed: 50.0, saveOnComplete: false });
        }

        handleSizeChange(e);

        // Visual feedback
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

        // Hide percentage text
        hidePercentage();

        // Restore transitions
        sliderLiquid.style.transition = '';
        sliderLevel.style.transition = '';

        sliderTube.style.transform = '';
        sliderTube.style.transition = '';

        // Call Fit Function (End of interaction)
        if (typeof window.performBasicSmartFraming === 'function') {
            const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
            const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
            window.performBasicSmartFraming({ mode });
        }

        // Settle Gravity (Normal Speed, Save on Complete)
        if (typeof window.startGravitySimulation === 'function') {
            window.startGravitySimulation({ speed: 9.0, saveOnComplete: true });
        }

        // 3. Save design (User Requirement)
        if (typeof window.autoSaveDesign === 'function') {
            window.autoSaveDesign();
        }
    }

    function handleSizeChange(e) {
        if (baseStringPoints.length < 2) return;

        const rect = sliderTube.getBoundingClientRect();
        let clientY;

        if (e.touches && e.touches[0]) {
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches[0]) {
            clientY = e.changedTouches[0].clientY;
        } else {
            clientY = e.clientY;
        }

        // Calculate percentage (0% at bottom, 100% at top)
        let percentage = Math.max(0, Math.min(100,
            ((rect.bottom - clientY) / rect.height) * 100
        ));

        // Calculate minimum allowed percentage based on beads
        const minScale = calculateMinScale();
        // scale = 1 + (p/100)*4  =>  p = (scale - 1)/4 * 100
        const minPercentage = Math.max(0, (minScale - 1) / 4.0 * 100);

        // Check if we are hitting the limit (trying to go smaller than allowed)
        // Add a small buffer (0.5%) to avoid flickering at the boundary
        if (percentage < minPercentage - 0.5) {
            showToast("Too many beads, can't make it smaller!");
        }

        // Clamp percentage
        percentage = Math.max(percentage, minPercentage);

        // Update Global State
        window.currentStringScale = percentage;

        // Update UI
        sliderLiquid.style.height = percentage + '%';
        sliderLevel.style.bottom = percentage + '%';

        // Show Percentage Indicator
        showPercentage(percentage, clientY, rect.right);

        // Apply Scaling
        applyStringScale(percentage);

        // 2. Live Fit (User Requirement)
        if (typeof window.performBasicSmartFraming === 'function') {
            const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
            const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
            // We might want to throttle this if it's too heavy, but let's try direct first.
            window.performBasicSmartFraming({ mode });
        }

        // Update Gravity Path Live
        // IMPORTANT: This must be called AFTER applyStringScale so the path is updated
        if (typeof window.updateGravityPath === 'function') {
            window.updateGravityPath();

            // Ensure simulation is active if it stopped
            if (window.gravityState && !window.gravityState.active) {
                window.startGravitySimulation({ speed: 50.0, saveOnComplete: false });
            }
        }
    }
}

let toastTimeout;
function showToast(message) {
    let toast = document.getElementById('slider-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'slider-toast';
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            pointer-events: none;
            font-family: var(--font-family, sans-serif);
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s ease;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}

let percentageIndicator;
function showPercentage(percentage, y, x) {
    if (!percentageIndicator) {
        percentageIndicator = document.createElement('div');
        percentageIndicator.id = 'slider-percentage';
        percentageIndicator.style.cssText = `
            position: fixed;
            background: rgba(255, 255, 255, 0.9);
            color: var(--neutral-900, #000);
            padding: 4px 8px;
            border-radius: 4px;
            z-index: 1000;
            pointer-events: none;
            font-family: var(--font-family, sans-serif);
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transform: translateY(-50%);
        `;
        document.body.appendChild(percentageIndicator);
    }

    percentageIndicator.textContent = Math.round(percentage) + '%';
    percentageIndicator.style.top = y + 'px';
    percentageIndicator.style.left = (x + 15) + 'px'; // 15px to the right of the slider
    percentageIndicator.style.display = 'block';
}

function hidePercentage() {
    if (percentageIndicator) {
        percentageIndicator.style.display = 'none';
    }
}

/**
 * Scales the string and updates bead positions
 * @param {number} percentage - 0 to 100
 */
function applyStringScale(percentage) {
    // Scale Factor: 0% -> 1.0x, 100% -> 5.0x (400% increase)
    const scale = 1 + (percentage / 100) * 4.0;

    // Calculate centroid of base string
    const center = new THREE.Vector3();
    baseStringPoints.forEach(p => center.add(p));
    center.divideScalar(baseStringPoints.length);

    // Apply scale to stringPoints
    for (let i = 0; i < baseStringPoints.length; i++) {
        const baseP = baseStringPoints[i];
        const vec = new THREE.Vector3().subVectors(baseP, center);
        vec.multiplyScalar(scale);

        // Update existing global stringPoints in place
        if (stringPoints[i]) {
            stringPoints[i].copy(center).add(vec);
        }
    }

    // Redraw string
    if (typeof updateStringLine === 'function') {
        updateStringLine();
    }

    // Update Beads
    updateBeadPositions();
}

/**
 * Updates all bead positions based on their segment attachment
 */
function updateBeadPositions() {
    if (typeof beads === 'undefined') return;

    beads.forEach(bead => {
        // Ensure bead has attachment data
        if (bead.userData.segmentIndex !== undefined && bead.userData.t !== undefined) {
            const idx = bead.userData.segmentIndex;
            const t = bead.userData.t;

            // Safety check
            if (idx >= 0 && idx < stringPoints.length - 1) {
                const p1 = stringPoints[idx];
                const p2 = stringPoints[idx + 1];

                // Linear interpolation for position
                bead.position.copy(p1).lerp(p2, t);
                bead.position.y = 0.1; // Maintain height

                // Note: We aren't updating rotation here. 
                // Uniform scaling preserves segment angles relative to the shape's local frame.
            }
        }
    });
}

/**
 * Calculates the minimum scale factor required to fit all beads without overlapping.
 * Uses the baseStringPoints as the reference (scale 1.0).
 */
function calculateMinScale() {
    if (!beads || beads.length < 2 || baseStringPoints.length < 2) return 1.0;

    // Helper to get distance along base string
    const getDist = (segIdx, t) => {
        let d = 0;
        for (let i = 0; i < segIdx; i++) {
            d += baseStringPoints[i].distanceTo(baseStringPoints[i + 1]);
        }
        d += baseStringPoints[segIdx].distanceTo(baseStringPoints[segIdx + 1]) * t;
        return d;
    };

    // Collect bead positions along base string
    const beadPositions = beads.map(bead => {
        const dist = getDist(bead.userData.segmentIndex, bead.userData.t);
        // Use max dimension as diameter approximation (safe bound)
        // Relax the radius slightly (0.85) to allow tighter packing and avoid blocking valid moves
        const radius = (Math.max(bead.scale.x, bead.scale.y) / 2) * 0.85;
        return { dist, radius };
    });

    // Sort by distance along string
    beadPositions.sort((a, b) => a.dist - b.dist);

    let maxRequiredScale = 1.0;

    // Check adjacent pairs
    for (let i = 0; i < beadPositions.length - 1; i++) {
        const b1 = beadPositions[i];
        const b2 = beadPositions[i + 1];
        const deltaBase = b2.dist - b1.dist;
        const requiredSep = b1.radius + b2.radius;

        if (deltaBase > 0.0001) {
            maxRequiredScale = Math.max(maxRequiredScale, requiredSep / deltaBase);
        }
    }

    // Check loop closure (Last to First)
    const isClosed = baseStringPoints[0].distanceTo(baseStringPoints[baseStringPoints.length - 1]) < 0.1;
    if (isClosed && beadPositions.length > 1) {
        const first = beadPositions[0];
        const last = beadPositions[beadPositions.length - 1];

        // Calculate total length of base string
        let totalLen = 0;
        for (let i = 0; i < baseStringPoints.length - 1; i++) {
            totalLen += baseStringPoints[i].distanceTo(baseStringPoints[i + 1]);
        }

        const deltaBase = (totalLen - last.dist) + first.dist;
        const requiredSep = last.radius + first.radius;

        if (deltaBase > 0.0001) {
            maxRequiredScale = Math.max(maxRequiredScale, requiredSep / deltaBase);
        }
    }

    return maxRequiredScale;
}
