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
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);

    // Touch events
    sliderTube.addEventListener('touchstart', startDragging, { passive: false });
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', stopDragging);

    async function startDragging(e) {
        e.preventDefault();
        isDragging = true;

        // Initialize last percentage to current value
        lastPercentage = window.currentStringScale || 0;

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

        // CRITICAL: Stop gravity completely before restarting
        // This ensures beads are re-projected from their current positions
        // rather than just updating speed on active simulation
        if (window.gravityState) {
            window.gravityState.active = false;
        }

        // Settle Gravity (Normal Speed, Save on Complete)
        // Use higher speed at smaller sizes where beads are more tightly packed
        // and need more iterations to properly redistribute
        const currentPercentage = window.currentStringScale || 0;
        let gravitySpeed = 9.0; // Default for medium/large sizes

        if (currentPercentage <= 20) {
            // At very small sizes, use much higher speed for more iterations
            gravitySpeed = 25.0;
            console.log('⚡ Using high gravity speed for small size:', currentPercentage.toFixed(0) + '%');
        } else if (currentPercentage <= 40) {
            // At small-medium sizes, use moderately higher speed
            gravitySpeed = 15.0;
        }

        // Now it will properly restart and re-project beads
        if (typeof window.startGravitySimulation === 'function') {
            window.startGravitySimulation({ speed: gravitySpeed, saveOnComplete: true });
        }

        // NOTE: We don't save here - gravity will save when it settles
        // This prevents saving unstable mid-animation states
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

        // Determine drag direction
        const isDecreasing = percentage < lastPercentage;

        // Only check space constraints when DECREASING size
        if (isDecreasing && beads && beads.length > 0) {
            // Calculate test scale
            const testScale = 1 + (percentage / 100) * 4.0;

            // Calculate total string length at target scale
            const center = new THREE.Vector3();
            baseStringPoints.forEach(p => center.add(p));
            center.divideScalar(baseStringPoints.length);

            let totalStringLength = 0;
            for (let i = 0; i < baseStringPoints.length - 1; i++) {
                const p1 = baseStringPoints[i];
                const p2 = baseStringPoints[i + 1];
                const dist = p1.distanceTo(p2);
                totalStringLength += dist * testScale;
            }

            // Calculate total space needed by beads
            // Use the larger dimension (width or height) as the "占用空间" for each bead
            let totalBeadSpace = 0;
            beads.forEach(bead => {
                const beadSize = Math.max(bead.scale.x, bead.scale.y);
                totalBeadSpace += beadSize;
            });

            // Calculate what percentage would give exactly enough space
            // totalBeadSpace / stringLength = 0.95 (95% utilization)
            // stringLength = baseLength * testScale
            // testScale = 1 + (percentage / 100) * 4
            // Solve for minimum percentage
            let baseLength = 0;
            for (let i = 0; i < baseStringPoints.length - 1; i++) {
                baseLength += baseStringPoints[i].distanceTo(baseStringPoints[i + 1]);
            }

            // totalBeadSpace / (baseLength * (1 + p/100 * 4)) = 0.95
            // Solve for p: p = ((totalBeadSpace / (0.95 * baseLength)) - 1) / 4 * 100
            const minScale = totalBeadSpace / (0.95 * baseLength);
            const calculatedMinPercentage = Math.max(0, ((minScale - 1) / 4.0) * 100);

            // Update current minimum for red line display
            currentMinPercentage = calculatedMinPercentage;

            // Update red limit line position and visibility
            if (calculatedMinPercentage > 0 && beads.length > 0) {
                minLimitLine.style.bottom = Math.min(calculatedMinPercentage, 100) + '%';
                minLimitLine.style.opacity = '1';
            } else {
                minLimitLine.style.opacity = '0';
            }

            // Calculate space utilization percentage at current drag position
            const spaceUtilization = (totalBeadSpace / totalStringLength) * 100;

            // Allow decrease if beads use less than 95% of string length
            // This 5% buffer accounts for spacing between beads
            const maxUtilization = 95;

            console.log('🔍 Space check:', {
                stringLength: totalStringLength.toFixed(2),
                beadSpace: totalBeadSpace.toFixed(2),
                utilization: spaceUtilization.toFixed(1) + '%',
                maxAllowed: maxUtilization + '%',
                minPercentage: calculatedMinPercentage.toFixed(1) + '%',
                testScale: testScale.toFixed(2),
                percentage: percentage.toFixed(1) + '%'
            });

            if (spaceUtilization > maxUtilization) {
                showToast("Too many beads, can't make it smaller!");
                // Block decrease - stay at current size
                percentage = lastPercentage;
                console.log('🔴 Space exceeded! Staying at', percentage.toFixed(2) + '%');
            } else {
                console.log('✅ Space OK (', spaceUtilization.toFixed(1) + '%), allowing decrease to', percentage.toFixed(1) + '%');
            }
        } else if (!isDecreasing) {
            // When increasing, allow any value up to 100%
            console.log('🔍 Slider Debug (INCREASING):', {
                draggedPercentage: percentage.toFixed(2),
                lastPercentage: lastPercentage.toFixed(2)
            });
        }

        // Update last percentage for next comparison
        lastPercentage = percentage;

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
    // Remove any existing toast
    const existingToast = document.querySelector('.slider-limit-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'slider-limit-toast';
    toast.innerHTML = `
        <div style="text-align: center;">
            <div>Too many beads!</div>
            <div style="font-size: 14px; opacity: 0.9;">Can't make it smaller</div>
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
        console.log('🔴 Critical constraint:', {
            ...criticalPair,
            currentScale: currentScale.toFixed(3),
            requiredRatio: maxRequiredRatio.toFixed(3),
            minScale: minScale.toFixed(3)
        });
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

    console.log('🔄 Syncing bead attachment data for', beads.length, 'beads');

    // Check if gravity state has distance info (preferred method)
    const hasGravityData = window.gravityState && window.gravityState.beads && window.gravityState.beads.length > 0;

    if (hasGravityData) {
        // Use gravity's distance values which already account for non-overlapping positions
        console.log('Using gravity distance data for accurate positioning');

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
        console.log('Using position-based calculation (gravity data not available)');

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

    console.log('✅ Bead attachment data synced');
};
