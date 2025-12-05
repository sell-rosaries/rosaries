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
    
};

/**
 * Resets the base geometry for scaling.
 * Should be called whenever the string is redrawn (new shape), imported, or restored.
 */
window.resetSliderBase = function () {
    // ALWAYS reset the scale and UI first to prevent inheritance bugs
    window.currentStringScale = 0;
    updateSliderUI(0);

    if (typeof stringPoints === 'undefined' || stringPoints.length === 0) {
        baseStringPoints = [];
        return;
    }

    // Deep copy the current string points as the new base (0%)
    baseStringPoints = stringPoints.map(p => p.clone());
    window.baseStringPoints = baseStringPoints; // Update global reference

    
};

/**
 * Restores the slider state from a saved percentage.
 * This is tricky: The saved 'stringPoints' are ALREADY scaled.
 * So we need to calculate what the 'base' (0%) points were.
 */
window.restoreSliderState = function (savedPercentage) {
    if (typeof stringPoints === 'undefined' || stringPoints.length === 0) return;

    
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
        // setTimeout(() => sliderLiquid.style.transition = '', 50);
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
    let lastPercentage = window.currentStringScale || 0; // Track last percentage to determine drag direction
    let currentMinPercentage = 0; // Track current minimum limit

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
        e.stopPropagation(); // Prevent canvas interaction
        isDragging = true;

        // Initialize last percentage to current value
        lastPercentage = window.currentStringScale || 0;

        // Exit Eraser Mode if active
        if (typeof exitEraserMode === 'function') {
            exitEraserMode();
        } else if (typeof exitStringMode === 'function') {
            exitStringMode();
        }

        // 1. Load saved design (User Requirement)
        if (typeof window.autoRestoreDesign === 'function') {
            await window.autoRestoreDesign();
        }

        // Disable transitions for instant feedback
        sliderLiquid.style.transition = 'none';
        sliderLevel.style.transition = 'none';

        // Call Fit Function (Start of interaction)
        if (typeof window.performBasicSmartFraming === 'function') {
            const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
            const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
            window.performBasicSmartFraming({ mode });
        }

        // CRITICAL: Stop Gravity Immediately
        // We want manual control over bead positions during drag
        if (window.gravityState) {
            window.gravityState.active = false;
        }
        if (window.stopGravitySimulation) {
            window.stopGravitySimulation();
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

        // Restart Gravity to settle beads
        if (window.gravityState) {
            window.gravityState.active = false;
        }

        // Settle Gravity (Dynamic Speed based on Size)
        // Match manualFit.js logic: Larger size = Faster speed
        // 0% = 9.0 (base speed), 100% = 45.0 (9.0 * 5.0)
        const currentPercentage = window.currentStringScale || 0;
        const speedMultiplier = 1 + (currentPercentage / 100) * 4.0; // 1.0x to 5.0x
        const gravitySpeed = 9.0 * speedMultiplier;

        

        if (typeof window.startGravitySimulation === 'function') {
            window.startGravitySimulation({ speed: gravitySpeed, saveOnComplete: true });
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

        // Calculate total string length at target scale
        const testScale = 1 + (percentage / 100) * 4.0;

        // Calculate base length
        let baseLength = 0;
        for (let i = 0; i < baseStringPoints.length - 1; i++) {
            baseLength += baseStringPoints[i].distanceTo(baseStringPoints[i + 1]);
        }
        const targetStringLength = baseLength * testScale;

        // Calculate total space needed by beads
        let totalBeadSpace = 0;
        if (typeof beads !== 'undefined') {
            beads.forEach(bead => {
                const beadSize = Math.max(bead.scale.x, bead.scale.y);
                // Add a small buffer (e.g. 1%) to ensure they don't overlap due to float errors
                totalBeadSpace += beadSize * 1.01;
            });
        }

        // Check constraints
        // We allow up to 98% utilization to prevent extreme edge cases
        const maxUtilization = 0.98;

        if (totalBeadSpace > targetStringLength * maxUtilization) {
            // Calculate max allowed percentage
            // totalBeadSpace = baseLength * (1 + p/100 * 4) * 0.98
            // (totalBeadSpace / (baseLength * 0.98)) = 1 + p/100 * 4
            // p = ((totalBeadSpace / (baseLength * 0.98)) - 1) / 4 * 100

            const minScale = totalBeadSpace / (baseLength * maxUtilization);
            const minPercentage = Math.max(0, ((minScale - 1) / 4.0) * 100);

            if (percentage < minPercentage) {
                percentage = minPercentage;
                showToast("Too many beads!");
            }

            // Update red limit line
            if (minLimitLine) {
                minLimitLine.style.bottom = Math.min(minPercentage, 100) + '%';
                minLimitLine.style.opacity = '1';
            }
        } else {
            if (minLimitLine) minLimitLine.style.opacity = '0';
        }

        // Update Global State
        window.currentStringScale = percentage;
        lastPercentage = percentage;

        // Update UI
        sliderLiquid.style.height = percentage + '%';
        sliderLevel.style.bottom = percentage + '%';

        // Show Percentage Indicator
        showPercentage(percentage, clientY, rect.right);

        // Apply Scaling
        applyStringScale(percentage);

        // PACK BEADS (The new logic)
        packBeadsOnString();

        // Live Fit
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
    if (now - lastToastTime < 3000) {
        return;
    }
    lastToastTime = now;

    // Remove any existing toast
    const existingToast = document.querySelector('.slider-limit-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const title = window.getTranslation ? window.getTranslation('slider-limit-toast-title') : 'Too many beads!';
    const subtext = window.getTranslation ? window.getTranslation('slider-limit-toast-message') : "Can't make it smaller";

    const toast = document.createElement('div');
    toast.className = 'slider-limit-toast';
    toast.innerHTML = `
        <div style="text-align: center;">
            <div>${title}</div>
            <div style="font-size: 14px; opacity: 0.9;">${subtext}</div>
        </div>
    `;
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(34, 197, 94, 0.98);
        color: white;
        padding: var(--space-3) var(--space-6);
        border-radius: var(--radius-md);
        font-size: var(--font-size-body-sm);
        font-weight: var(--font-weight-semibold);
        z-index: 1000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        animation: slider-limit-toast-slide 3s ease-in-out forwards;
        max-width: 90vw;
        text-align: center;
        border: 2px solid rgba(255, 255, 255, 0.3);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    `;

    // Add animation keyframes if not present
    if (!document.querySelector('#slider-limit-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'slider-limit-toast-styles';
        style.textContent = `
            @keyframes slider-limit-toast-slide {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
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
 * Now calculates based on CURRENT string configuration and current scale.
 */
function calculateMinScale() {
    if (!beads || beads.length < 2 || baseStringPoints.length < 2) return 1.0;

    // Get the current scale from the global state
    const currentScale = 1 + (window.currentStringScale / 100) * 4.0;

    // Helper to get distance along CURRENT string
    const getDist = (segIdx, t) => {
        let d = 0;
        for (let i = 0; i < segIdx; i++) {
            d += stringPoints[i].distanceTo(stringPoints[i + 1]);
        }
        d += stringPoints[segIdx].distanceTo(stringPoints[segIdx + 1]) * t;
        return d;
    };

    // Collect bead positions along CURRENT string
    const beadPositions = beads.map(bead => {
        const dist = getDist(bead.userData.segmentIndex, bead.userData.t);
        // Use max dimension as diameter approximation (safe bound)
        // Relax the radius slightly (0.85) to allow tighter packing and avoid blocking valid moves
        const radius = (Math.max(bead.scale.x, bead.scale.y) / 2) * 0.85;
        return { dist, radius };
    });

    // Sort by distance along string
    beadPositions.sort((a, b) => a.dist - b.dist);

    let maxRequiredRatio = 1.0;
    let criticalPair = null;

    // Check adjacent pairs
    for (let i = 0; i < beadPositions.length - 1; i++) {
        const b1 = beadPositions[i];
        const b2 = beadPositions[i + 1];
        const deltaCurrent = b2.dist - b1.dist;
        const requiredSep = b1.radius + b2.radius;

        if (deltaCurrent > 0.0001) {
            // If current separation is less than required, we need to scale up
            const requiredRatio = requiredSep / deltaCurrent;
            if (requiredRatio > maxRequiredRatio) {
                maxRequiredRatio = requiredRatio;
                criticalPair = { pair: `${i} to ${i + 1}`, deltaCurrent, requiredSep, requiredRatio };
            }
        }
    }

    // Check loop closure (Last to First)
    const isClosed = stringPoints[0].distanceTo(stringPoints[stringPoints.length - 1]) < 0.1;
    if (isClosed && beadPositions.length > 1) {
        const first = beadPositions[0];
        const last = beadPositions[beadPositions.length - 1];

        // Calculate total length of CURRENT string
        let totalLen = 0;
        for (let i = 0; i < stringPoints.length - 1; i++) {
            totalLen += stringPoints[i].distanceTo(stringPoints[i + 1]);
        }

        const deltaCurrent = (totalLen - last.dist) + first.dist;
        const requiredSep = last.radius + first.radius;

        if (deltaCurrent > 0.0001) {
            const requiredRatio = requiredSep / deltaCurrent;
            if (requiredRatio > maxRequiredRatio) {
                maxRequiredRatio = requiredRatio;
                criticalPair = { pair: 'loop closure', deltaCurrent, requiredSep, requiredRatio };
            }
        }
    }

    // The minimum scale is current scale * ratio
    // e.g., if we're at 2.0x and need 1.5x more space, minimum is 3.0x
    const minScale = currentScale * maxRequiredRatio;

    if (criticalPair && maxRequiredRatio > 1.1) {
        
    }

    return minScale;
}

/**
 * Syncs bead attachment data (segmentIndex, t) with their current 3D positions
 * Called after gravity settles to ensure saved positions match visual positions
 * Uses gravity's distance calculations to preserve non-overlapping spacing
 */
window.syncBeadAttachmentData = function () {
    if (typeof beads === 'undefined' || !beads || beads.length === 0) return;
    if (typeof stringPoints === 'undefined' || !stringPoints || stringPoints.length < 2) return;

    

    // Check if gravity state has distance info (preferred method)
    const hasGravityData = window.gravityState && window.gravityState.beads && window.gravityState.beads.length > 0;

    if (hasGravityData) {
        // Use gravity's distance values which already account for non-overlapping positions
        

        // Calculate total string length
        let totalLength = 0;
        for (let i = 0; i < stringPoints.length - 1; i++) {
            totalLength += stringPoints[i].distanceTo(stringPoints[i + 1]);
        }

        // Map each gravity bead to actual bead and update userData
        window.gravityState.beads.forEach(gravityBead => {
            const bead = gravityBead.mesh;
            const distance = gravityBead.distance;

            // Convert distance along path to segmentIndex and t
            let remainingDist = distance;
            let segmentIndex = 0;
            let t = 0;

            for (let i = 0; i < stringPoints.length - 1; i++) {
                const segmentLength = stringPoints[i].distanceTo(stringPoints[i + 1]);

                if (remainingDist <= segmentLength) {
                    segmentIndex = i;
                    t = segmentLength > 0.0001 ? remainingDist / segmentLength : 0;
                    break;
                }

                remainingDist -= segmentLength;
            }

            // Handle edge case: if we're past the end, clamp to last segment
            if (segmentIndex >= stringPoints.length - 1) {
                segmentIndex = Math.max(0, stringPoints.length - 2);
                t = 1.0;
            }

            bead.userData.segmentIndex = segmentIndex;
            bead.userData.t = t;
        });
    } else {
        // Fallback: Calculate from current positions (less accurate)
        

        beads.forEach(bead => {
            const beadPos = bead.position;
            let closestDist = Infinity;
            let closestSegmentIndex = 0;
            let closestT = 0;

            for (let i = 0; i < stringPoints.length - 1; i++) {
                const p1 = stringPoints[i];
                const p2 = stringPoints[i + 1];

                const v = new THREE.Vector3().subVectors(p2, p1);
                const len = v.length();

                if (len < 0.0001) continue;

                const w = new THREE.Vector3().subVectors(beadPos, p1);
                const t = Math.max(0, Math.min(1, w.dot(v) / (len * len)));

                const closestPoint = new THREE.Vector3().copy(p1).lerp(p2, t);
                const dist = beadPos.distanceTo(closestPoint);

                if (dist < closestDist) {
                    closestDist = dist;
                    closestSegmentIndex = i;
                    closestT = t;
                }
            }

            bead.userData.segmentIndex = closestSegmentIndex;
            bead.userData.t = closestT;
        });
    }

    
};

/**
 * Packs beads together on the string, centered around the median bead.
 * Ensures they touch but don't overlap, maintaining order.
 */
function packBeadsOnString() {
    if (typeof beads === 'undefined' || beads.length === 0) return;
    if (typeof stringPoints === 'undefined' || stringPoints.length < 2) return;

    // 1. Calculate total string length
    let totalStringLength = 0;
    const segmentLengths = [];
    for (let i = 0; i < stringPoints.length - 1; i++) {
        const len = stringPoints[i].distanceTo(stringPoints[i + 1]);
        segmentLengths.push(len);
        totalStringLength += len;
    }

    // 2. Get current bead positions and sort
    const beadData = beads.map(bead => {
        // Calculate distance based on current segment/t
        // We use the current values as the "desired" order
        let dist = 0;
        const segIdx = bead.userData.segmentIndex || 0;
        const t = bead.userData.t || 0;

        for (let i = 0; i < segIdx; i++) {
            dist += segmentLengths[i];
        }
        dist += segmentLengths[segIdx] * t;

        // Get radius (use max dimension for safety)
        // We use a slightly smaller radius for packing to ensure they touch visually
        // but don't overlap "physically" in a way that breaks things.
        // The user asked for "hitbox touch".
        const radius = Math.max(bead.scale.x, bead.scale.y) / 2;

        return {
            bead: bead,
            currentDist: dist,
            radius: radius
        };
    });

    // Sort by current distance to maintain order
    beadData.sort((a, b) => a.currentDist - b.currentDist);

    // 3. Find Median Bead (Anchor)
    const medianIndex = Math.floor(beadData.length / 2);
    const medianBead = beadData[medianIndex];

    // The median bead tries to stay at its relative position
    // But we must clamp it so it doesn't push others off the string

    // Calculate total span of beads
    let totalSpan = 0;
    beadData.forEach(b => totalSpan += b.radius * 2);

    // Calculate offsets from median
    // We want: [ ... -r1-r2 -r0-r1 (median) +r0+r1 +r1+r2 ... ]
    // Actually simpler: Place median, then stack outwards.

    // Assign target distances
    // Start with median at its current relative position
    // But since we just scaled the string, "currentDist" is based on the NEW string geometry 
    // (because stringPoints are already updated in applyStringScale).
    // So medianBead.currentDist is already where it "wants" to be roughly.

    // We need to refine the positions.

    // Let's define the center position for the bead chain.
    // We can use the median bead's current position as the anchor.
    let anchorDist = medianBead.currentDist;

    // Calculate ideal positions relative to anchor
    // We'll store "offset from anchor center"
    const offsets = new Array(beadData.length).fill(0);

    // Go backwards from median
    let currentOffset = -medianBead.radius;
    for (let i = medianIndex - 1; i >= 0; i--) {
        const bead = beadData[i];
        const nextBead = beadData[i + 1]; // The one to the right (closer to median)

        // They should touch: center_dist = radius_current + radius_next
        currentOffset -= bead.radius; // Move to center of current bead
        offsets[i] = currentOffset;

        // Prepare for next
        currentOffset -= bead.radius;
    }

    // Go forwards from median
    currentOffset = medianBead.radius;
    for (let i = medianIndex + 1; i < beadData.length; i++) {
        const bead = beadData[i];

        currentOffset += bead.radius;
        offsets[i] = currentOffset;

        currentOffset += bead.radius;
    }

    // Now apply offsets to anchor
    // Check bounds: If the chain hits the start or end of string, shift the whole chain
    let minChainDist = anchorDist + offsets[0];
    let maxChainDist = anchorDist + offsets[beadData.length - 1];

    // Shift if out of bounds
    if (minChainDist < 0) {
        const shift = -minChainDist;
        anchorDist += shift;
    } else if (maxChainDist > totalStringLength) {
        const shift = totalStringLength - maxChainDist;
        anchorDist += shift;

        // Double check start again (in case string is too short for beads)
        // If string is too short, we just center the whole blob
        if (anchorDist + offsets[0] < 0) {
            anchorDist = totalStringLength / 2 - (offsets[0] + offsets[beadData.length - 1]) / 2;
        }
    }

    // 4. Apply new positions
    beadData.forEach((item, i) => {
        const targetDist = anchorDist + offsets[i];

        // Clamp to valid range (should be handled by shift above, but safety first)
        const clampedDist = Math.max(0, Math.min(totalStringLength, targetDist));

        // Convert distance back to segment/t
        let remaining = clampedDist;
        let newSegIdx = 0;
        let newT = 0;

        for (let s = 0; s < segmentLengths.length; s++) {
            if (remaining <= segmentLengths[s] + 0.0001) { // Tolerance
                newSegIdx = s;
                newT = segmentLengths[s] > 0 ? remaining / segmentLengths[s] : 0;
                break;
            }
            remaining -= segmentLengths[s];
        }

        // Handle end of string case
        if (remaining > 0 && newSegIdx === 0 && segmentLengths.length > 0) {
            newSegIdx = segmentLengths.length - 1;
            newT = 1;
        }

        // Update Bead
        item.bead.userData.segmentIndex = newSegIdx;
        item.bead.userData.t = newT;

        // Update Visual Position
        const p1 = stringPoints[newSegIdx];
        const p2 = stringPoints[newSegIdx + 1];
        if (p1 && p2) {
            item.bead.position.copy(p1).lerp(p2, newT);
            item.bead.position.y = 0.1;

            // Update rotation (tangent)
            // We can reuse the logic from beads.js or just simple lookAt if needed
            // But usually rotation is handled by a separate update loop or shader
            // For now, we just place them.
        }
    });
}
