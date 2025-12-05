/*
    MANUAL FIT MODULE
    Mobile-style volume slider with fit button attachment
    Located on middle left side of screen
    
    This module handles the fit button functionality + gravity simulation
    After fit completes, beads fall naturally from highest to lowest points
*/

/**
 * Gravity simulation state
 */
let gravityActive = false;
let gravityAnimations = [];
let isGravityRunning = false;

// Global kinematic state
let kinematicState = {
    active: false,
    beads: [],
    path: null,
    targetDist: 0,
    isLoop: false,
    lastTime: 0,
    speed: 9.0, // Default speed
    saveOnComplete: false
};

// Slider save debounce timer
let sliderSaveTimer = null;
let sliderSavePending = false;

// Expose for interaction cancellation
window.gravityState = kinematicState;

/**
 * Initialize the custom size interface
 */
function initCustomSize() {
    
    addCustomSizeHTML();
    addCustomSizeStyles();
    setupFitButtonEvents();
    setupToggleEvents(); // Add toggle events
    // Slider events are now handled by stringSize.js via initStringSlider()
    
}

/**
 * Setup toggle button events
 */
function setupToggleEvents() {
    const container = document.getElementById('custom-size-control');
    const toggleBtn = document.getElementById('size-toggle-btn');
    
    if (toggleBtn && container) {
        toggleBtn.addEventListener('click', () => {
            container.classList.toggle('collapsed');
            
        });
    }
}

/**
 * Add custom size control HTML structure
 */
function addCustomSizeHTML() {
    const customSizeHTML = `
        <div id="custom-size-control" class="custom-size-container">
            <button id="size-toggle-btn" class="size-toggle-btn" aria-label="Toggle Size Controls">
                <svg class="toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <div class="custom-size-content">
                <div class="custom-size-control">
                    <div class="size-slider-tube">
                        <div class="size-slider-track"></div>
                        <div class="size-slider-liquid" style="height: 30%;"></div>
                        <div class="size-slider-level-indicator" style="bottom: 30%;"></div>
                    </div>
                    <button id="fit-button" class="fit-button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="20" rx="2"/>
                            <path d="M8 2v4M16 2v4M8 18v4M16 18v4M2 8h4M2 16h4M18 8h4M18 16h4"/>
                        </svg>
                        <span class="fit-button-text">FIT</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', customSizeHTML);
}

/**
 * Add custom size control styles
 */
function addCustomSizeStyles() {
    const style = document.createElement('style');
    style.id = 'custom-size-styles';
    style.textContent = `
        .custom-size-container {
            position: fixed;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 150;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* Toggle Button */
        .size-toggle-btn {
            pointer-events: auto;
            width: 32px;
            height: 32px;
            background: var(--glass-light);
            backdrop-filter: var(--backdrop-light);
            border: 1px solid var(--glass-border);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--neutral-600);
            cursor: pointer;
            margin-bottom: 12px;
            transition: all 0.3s ease;
            box-shadow: var(--shadow-sm);
            z-index: 151;
        }
        .size-toggle-btn:hover {
            background: var(--glass-medium);
            color: var(--primary-600);
            transform: scale(1.1);
        }
        .size-toggle-btn .toggle-icon {
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* Content Wrapper */
        .custom-size-content {
            transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease;
            transform-origin: top center;
        }

        /* Collapsed State */
        .custom-size-container.collapsed {
            transform: translateY(-50%) translateX(-16px); /* Move to screen edge */
        }
        .custom-size-container.collapsed .custom-size-content {
            transform: translateX(-200%) scale(0.8);
            opacity: 0;
            pointer-events: none;
        }
        .custom-size-container.collapsed .size-toggle-btn {
            border-radius: 0 50% 50% 0; /* Half circle attached to side */
            width: 24px;
            padding-left: 2px;
            background: var(--glass-medium);
            box-shadow: 2px 0 8px rgba(0,0,0,0.1);
        }
        .custom-size-container.collapsed .toggle-icon {
            transform: rotate(180deg);
        }

        .custom-size-control {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-3);
            pointer-events: all;
        }
        .size-slider-tube {
            position: relative;
            width: 12px;
            height: 180px;
            background: var(--glass-light);
            backdrop-filter: var(--backdrop-light);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-full);
            box-shadow: var(--shadow-glass);
            cursor: pointer;
            overflow: hidden;
        }
        .size-slider-track {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: var(--radius-full);
        }
        .size-slider-liquid {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(180deg, var(--primary-500) 0%, var(--primary-600) 100%);
            border-radius: var(--radius-full);
            transition: height var(--duration-smooth) var(--easing-smooth);
            box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);
        }
        .size-slider-liquid::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%);
            border-radius: var(--radius-full) var(--radius-full) 0 0;
        }
        .size-slider-level-indicator {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 2px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 1px;
            pointer-events: none;
            transition: bottom var(--duration-smooth) var(--easing-smooth);
            box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
        }
        .fit-button {
            width: 40px;
            height: 40px;
            background: var(--glass-light);
            backdrop-filter: var(--backdrop-light);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-full);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            cursor: pointer;
            color: var(--neutral-600);
            transition: all var(--duration-fast) var(--easing-smooth);
            box-shadow: var(--shadow-md);
            text-decoration: none;
            font-size: 10px;
            font-weight: var(--font-weight-semibold);
        }
        .fit-button:hover {
            background: var(--glass-medium);
            color: var(--primary-600);
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        .fit-button:active {
            transform: translateY(0) scale(0.95);
            box-shadow: var(--shadow-md);
        }
        .fit-button svg {
            width: 16px;
            height: 16px;
        }
        .fit-button-text {
            font-size: 8px;
            font-weight: var(--font-weight-bold);
            letter-spacing: 0.5px;
        }
        @media (max-width: 768px) {
            .custom-size-container { left: 12px; }
            .size-slider-tube { width: 10px; height: 160px; }
            .size-slider-level-indicator { width: 14px; }
            .fit-button { width: 36px; height: 36px; }
        }
        .size-slider-tube:active {
            transform: scale(1.05);
            transition: transform 0.1s ease;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Setup fit button event listeners
 */
function setupFitButtonEvents() {
    const fitButton = document.getElementById('fit-button');

    fitButton.addEventListener('click', async () => {
        
        fitButton.style.transform = 'translateY(-2px) scale(0.95)';
        setTimeout(() => fitButton.style.transform = '', 150);

        try {
            if (typeof window.performBasicSmartFraming === 'function') {
                if (typeof window.updateStringType === 'function') window.updateStringType();
                const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
                const mode = stringType === 'pen' ? 'pen-mode' : 'preset';

                window.performBasicSmartFraming({ mode });

                setTimeout(async () => {
                    if (window.gravityState) window.gravityState.active = false;

                    // Scale gravity speed based on slider position
                    // 0% = 9.0 (base speed), 100% = 45.0 (9.0 * 5.0)
                    const sliderPercentage = window.currentStringScale || 0;
                    const speedMultiplier = 1 + (sliderPercentage / 100) * 4.0; // 1.0x to 5.0x
                    const gravitySpeed = 9.0 * speedMultiplier;

                    

                    // Fit button uses scaled speed and saves on completion (auto-save)
                    await startGravitySimulation({ speed: gravitySpeed, saveOnComplete: true });
                }, 600);
            }
        } catch (error) {
            console.error('❌ Error during fit:', error);
        }
    });
}

/**
 * Calculate path data for 1D simulation
 */
function calculatePathData() {
    if (typeof stringPoints === 'undefined' || stringPoints.length < 2) return null;

    const segments = [];
    let totalLength = 0;

    for (let i = 0; i < stringPoints.length - 1; i++) {
        const p1 = stringPoints[i];
        const p2 = stringPoints[i + 1];
        const vec = new THREE.Vector3().subVectors(p2, p1);
        const len = vec.length();

        if (len < 0.0001) continue;

        segments.push({
            start: p1,
            end: p2,
            dir: vec.clone().normalize(),
            length: len,
            startDist: totalLength,
            endDist: totalLength + len
        });
        totalLength += len;
    }

    const first = stringPoints[0];
    const last = stringPoints[stringPoints.length - 1];
    const isClosed = first.distanceTo(last) < 0.5;

    return { segments, totalLength, isClosed };
}

/**
 * Update the gravity path data live (for use during slider interaction)
 */
function updateGravityPath() {
    if (!kinematicState.active) return;

    const path = calculatePathData();
    if (!path) return;

    kinematicState.path = path;
    kinematicState.isLoop = path.isClosed;

    // Recalculate target distance (Highest Z point)
    let maxZ = -Infinity;
    let targetDist = 0;

    const samples = 100;
    for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * path.totalLength;
        const pos = getPathPos(path, t);
        if (pos.z > maxZ) {
            maxZ = pos.z;
            targetDist = t;
        }
    }
    kinematicState.targetDist = targetDist;
}

/**
 * Start Kinematic Slide (Non-Physics Gravity)
 * @param {Object} options - Configuration options
 * @param {number} options.speed - Simulation speed (default: 9.0)
 * @param {boolean} options.saveOnComplete - Whether to save design when settled (default: false)
 */
async function startGravitySimulation(options = {}) {
    // If already active, just update options
    if (kinematicState.active) {
        if (options.speed !== undefined) kinematicState.speed = options.speed;
        if (options.saveOnComplete !== undefined) kinematicState.saveOnComplete = options.saveOnComplete;
        updateGravityPath(); // Refresh path just in case
        return;
    }

    

    const path = calculatePathData();
    if (!path) return;

    // Find target distance (Highest Z point)
    let maxZ = -Infinity;
    let targetDist = 0;

    const samples = 100;
    for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * path.totalLength;
        const pos = getPathPos(path, t);
        if (pos.z > maxZ) {
            maxZ = pos.z;
            targetDist = t;
        }
    }

    // Initialize beads
    const simBeads = [];
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach((bead, index) => {
            const dist = projectBeadToPath(bead.position, path);
            // scale.x is diameter
            const radius = (bead.scale.x * 0.5) || 0.1;

            simBeads.push({
                mesh: bead,
                distance: dist,
                radius: radius,
                index: index,
                collidedLastFrame: false,
                collidedThisFrame: false
            });
        });
    }

    kinematicState.active = true;
    kinematicState.beads = simBeads;
    kinematicState.path = path;
    kinematicState.targetDist = targetDist;
    kinematicState.isLoop = path.isClosed;
    kinematicState.lastTime = Date.now();
    kinematicState.speed = options.speed !== undefined ? options.speed : 9.0;
    kinematicState.saveOnComplete = options.saveOnComplete !== undefined ? options.saveOnComplete : false;

    // Failsafe timeout
    window.gravityStartTime = Date.now();
}

function getPathPos(path, dist) {
    if (path.isClosed) {
        dist = (dist % path.totalLength + path.totalLength) % path.totalLength;
    } else {
        dist = Math.max(0, Math.min(dist, path.totalLength));
    }

    let seg = path.segments.find(s => dist >= s.startDist && dist <= s.endDist);
    if (!seg) seg = dist <= 0 ? path.segments[0] : path.segments[path.segments.length - 1];

    const localT = dist - seg.startDist;
    return new THREE.Vector3().copy(seg.start).addScaledVector(seg.dir, localT);
}

function projectBeadToPath(pos, path) {
    let minDist = Infinity;
    let bestPathDist = 0;

    path.segments.forEach(seg => {
        const v = new THREE.Vector3().subVectors(pos, seg.start);
        const t = v.dot(seg.dir);
        const clampedT = Math.max(0, Math.min(t, seg.length));
        const closest = new THREE.Vector3().copy(seg.start).addScaledVector(seg.dir, clampedT);
        const d = closest.distanceTo(pos);

        if (d < minDist) {
            minDist = d;
            bestPathDist = seg.startDist + clampedT;
        }
    });
    return bestPathDist;
}

/**
 * Get 3D position and tangent from path distance
 */
function getPathState(path, dist) {
    // Handle wrapping for closed paths
    if (path.isClosed) {
        dist = (dist % path.totalLength + path.totalLength) % path.totalLength;
    } else {
        dist = Math.max(0, Math.min(dist, path.totalLength));
    }

    // Find segment
    let seg = path.segments.find(s => dist >= s.startDist && dist <= s.endDist);
    // Fallback for precision issues
    if (!seg) {
        if (dist <= 0) seg = path.segments[0];
        else seg = path.segments[path.segments.length - 1];
    }

    const localT = dist - seg.startDist;
    const pos = new THREE.Vector3().copy(seg.start).addScaledVector(seg.dir, localT);

    return { position: pos, tangent: seg.dir };
}

/**
 * Main Loop - Kinematic Movement with SAT Collision
 */
function updateGravitySimulation() {
    if (!kinematicState.active) return;

    const now = Date.now();
    const dt = Math.min((now - kinematicState.lastTime) / 1000, 0.05);
    kinematicState.lastTime = now;

    // Timeout check
    if (now - window.gravityStartTime > 10000) {
        kinematicState.active = false;
        if (kinematicState.saveOnComplete && typeof window.autoSaveDesign === 'function') {
            
            window.autoSaveDesign();
        }
        return;
    }

    const { beads, path, targetDist, isLoop, speed } = kinematicState;
    // Use configured speed
    const moveSpeed = speed * dt;

    let anyoneMoved = false;

    // 1. Pre-calculate distance to target for sorting
    beads.forEach(b => {
        let dist = targetDist - b.distance;
        if (isLoop) {
            if (dist > path.totalLength / 2) dist -= path.totalLength;
            if (dist < -path.totalLength / 2) dist += path.totalLength;
        }
        b._distToTargetSigned = dist;
        b._distToTargetAbs = Math.abs(dist);
    });

    // 2. Sort: Closest to target first (Leaders)
    // Improved Sort: Sort by "contact surface" distance, not center distance
    beads.sort((a, b) => {
        const rA = Math.max(a.mesh.scale.x, a.mesh.scale.y) / 2;
        const rB = Math.max(b.mesh.scale.x, b.mesh.scale.y) / 2;

        // Distance from target to the *leading edge* of the bead
        const distEdgeA = a._distToTargetAbs - rA;
        const distEdgeB = b._distToTargetAbs - rB;

        return distEdgeA - distEdgeB;
    });

    // 3. Move beads
    for (let i = 0; i < beads.length; i++) {
        const b = beads[i];
        const rB = Math.max(b.mesh.scale.x, b.mesh.scale.y) / 2;

        // If leading edge is at target, stop
        if (b._distToTargetAbs - rB < 0.01) continue;

        const dir = Math.sign(b._distToTargetSigned);
        let proposedMove = Math.min(moveSpeed, b._distToTargetAbs); // Still cap by center distance to avoid overshooting logic

        // ... rest of loop ...

        // Try moving full step
        let startDist = b.distance;
        let newDist = startDist + (dir * proposedMove);

        // Normalize loop
        if (isLoop) {
            newDist = (newDist % path.totalLength + path.totalLength) % path.totalLength;
        } else {
            newDist = Math.max(0, Math.min(newDist, path.totalLength));
        }

        // Check collision at new position
        if (validatePosition(b, newDist, beads, i)) {
            // Safe to move
            b.distance = newDist;
            anyoneMoved = true;
        } else {
            // Collision! Binary search for contact point
            // Try 0.5, 0.25, 0.125, 0.0625 of the proposed move
            let low = 0;
            let high = proposedMove;
            let validMove = 0;

            // 4 iterations of binary search gives 1/16th precision
            for (let k = 0; k < 4; k++) {
                let mid = (low + high) / 2;
                let testDist = startDist + (dir * mid);

                if (isLoop) {
                    testDist = (testDist % path.totalLength + path.totalLength) % path.totalLength;
                } else {
                    testDist = Math.max(0, Math.min(testDist, path.totalLength));
                }

                if (validatePosition(b, testDist, beads, i)) {
                    validMove = mid;
                    low = mid; // Try moving further
                } else {
                    high = mid; // Too far, back off
                }
            }

            if (validMove > 0.001) {
                b.distance = startDist + (dir * validMove);
                // Normalize loop again just in case
                if (isLoop) {
                    b.distance = (b.distance % path.totalLength + path.totalLength) % path.totalLength;
                } else {
                    b.distance = Math.max(0, Math.min(b.distance, path.totalLength));
                }
                anyoneMoved = true;
            }
        }

        // Update visual position/rotation permanently for this frame
        updateBeadVisuals(b, path);
    }

    // Stop if settled
    if (!anyoneMoved) {
        kinematicState.active = false;

        if (kinematicState.saveOnComplete && typeof window.autoSaveDesign === 'function') {
            // CRITICAL: Sync bead attachment data before saving
            // This ensures segmentIndex and t match actual bead positions
            if (typeof window.syncBeadAttachmentData === 'function') {
                window.syncBeadAttachmentData();
            }

            

            // Clear any existing timer
            if (sliderSaveTimer) {
                clearTimeout(sliderSaveTimer);
                
            }

            // Mark that we have a pending save from slider
            sliderSavePending = true;

            // Schedule save for 5 seconds from now
            sliderSaveTimer = setTimeout(() => {
                // Only save if still pending (not cancelled by other save)
                if (sliderSavePending) {
                    
                    window.autoSaveDesign();
                    sliderSavePending = false;
                }
                sliderSaveTimer = null;
            }, 5000);
        }
    }
}

/**
 * Validate if a bead at 'dist' collides with any closer beads (indices 0 to i-1)
 */
function validatePosition(bead, dist, sortedBeads, myIndex) {
    const path = kinematicState.path;
    const state = getPathState(path, dist);

    // Calculate dimensions
    const w1 = bead.mesh.scale.x;
    const h1 = bead.mesh.scale.y;

    // GENERATE HYPOTHETICAL CORNERS FOR BEAD 1
    // Based on path tangent at 'dist'
    let length1 = w1;
    let width1 = h1;
    if (h1 > w1) {
        length1 = h1;
        width1 = w1;
    }

    // Tangent is already in state
    const tangent1 = { x: state.tangent.x, y: state.tangent.z };
    const normal1 = { x: -tangent1.y, y: tangent1.x };
    
    const px1 = state.position.x;
    const pz1 = state.position.z;
    const halfL1 = length1 / 2;
    const halfW1 = width1 / 2;

    const corners1 = [
        { x: px1 + tangent1.x * halfL1 + normal1.x * halfW1, y: pz1 + tangent1.y * halfL1 + normal1.y * halfW1 },
        { x: px1 + tangent1.x * halfL1 - normal1.x * halfW1, y: pz1 + tangent1.y * halfL1 - normal1.y * halfW1 },
        { x: px1 - tangent1.x * halfL1 - normal1.x * halfW1, y: pz1 - tangent1.y * halfL1 - normal1.y * halfW1 },
        { x: px1 - tangent1.x * halfL1 + normal1.x * halfW1, y: pz1 - tangent1.y * halfL1 + normal1.y * halfW1 }
    ];

    // Check against all closer beads
    for (let j = 0; j < myIndex; j++) {
        const other = sortedBeads[j];

        // Get corners for the EXISTING bead
        // We can use the helper from beads.js if available, or recalculate
        // Since other bead is stationary on string, we can use getBeadCorners(other.mesh)
        // Ensure getBeadCorners is available (global)
        let corners2;
        if (typeof getBeadCorners === 'function') {
            corners2 = getBeadCorners(other.mesh);
        } else {
            // Fallback: Recalculate manually if helper not found
            // This duplicates logic but ensures safety
            const w2 = other.mesh.scale.x;
            const h2 = other.mesh.scale.y;
            let length2 = w2;
            let width2 = h2;
            if (h2 > w2) { length2 = h2; width2 = w2; }

            // Need tangent for other bead. It's at other.distance
            const otherState = getPathState(path, other.distance);
            const t2 = { x: otherState.tangent.x, y: otherState.tangent.z };
            const n2 = { x: -t2.y, y: t2.x };
            const px2 = otherState.position.x;
            const pz2 = otherState.position.z;
            const hl2 = length2 / 2;
            const hw2 = width2 / 2;

            corners2 = [
                { x: px2 + t2.x * hl2 + n2.x * hw2, y: pz2 + t2.y * hl2 + n2.y * hw2 },
                { x: px2 + t2.x * hl2 - n2.x * hw2, y: pz2 + t2.y * hl2 - n2.y * hw2 },
                { x: px2 - t2.x * hl2 - n2.x * hw2, y: pz2 - t2.y * hl2 - n2.y * hw2 },
                { x: px2 - t2.x * hl2 + n2.x * hw2, y: pz2 - t2.y * hl2 + n2.y * hw2 }
            ];
        }

        // Distance squared
        const x2 = other.mesh.position.x;
        const z2 = other.mesh.position.z;
        const dx = px1 - x2;
        const dz = pz1 - z2;
        const distSq = dx * dx + dz * dz;

        // 1. Hard Inner Core Check (Failsafe)
        const r1Min = Math.min(w1, h1) / 2;
        const w2 = other.mesh.scale.x;
        const h2 = other.mesh.scale.y;
        const r2Min = Math.min(w2, h2) / 2;
        const minSepSq = (r1Min + r2Min) * (r1Min + r2Min);

        if (distSq < minSepSq) return false; // Collision!

        // 2. Circular Optimization
        const ar1 = w1 / h1;
        const ar2 = w2 / h2;
        const isCircle1 = ar1 > 0.9 && ar1 < 1.1;
        const isCircle2 = ar2 > 0.9 && ar2 < 1.1;

        if (isCircle1 && isCircle2) {
            // Simple Circle-Circle Collision
            const r1 = w1 / 2;
            const r2 = w2 / 2;
            // EXACT radius check
            const minSep = (r1 + r2);

            if (distSq < minSep * minSep) {
                return false;
            }
        } else {
            // Use global SAT function for complex shapes
            if (typeof checkPolygonCollision === 'function') {
                if (checkPolygonCollision(corners1, corners2)) {
                    return false; // Collision detected
                }
            }
        }
    }
    return true;
}

function updateBeadVisuals(bead, path) {
    const state = getPathState(path, bead.distance);
    bead.mesh.position.copy(state.position);
    bead.mesh.position.y = 0.2;

    // Smart Rotation (Two-Point Secant Method)
    // We look ahead and behind to align the bead's body with the average string path
    // This handles curvature naturally (like a rigid tube on a curved wire)

    const w = bead.mesh.scale.x;
    const h = bead.mesh.scale.y;

    // Define "holes" distance from center. 
    // We use a fraction of the longest dimension to approximate the hole positions.
    // 0.4 means points are at 40% and -40% of the length (80% total span).
    const lookAhead = Math.max(w, h) * 0.4;

    // Sample points on string
    const posFront = getPathPos(path, bead.distance + lookAhead);
    const posBack = getPathPos(path, bead.distance - lookAhead);

    // Calculate vector from back to front
    const dx = posFront.x - posBack.x;
    const dz = posFront.z - posBack.z;

    // Base angle of the string chord
    // Use "Head Up" Logic: Closest to Rotation 0 (World Up)
    let rawAngle = -Math.atan2(dz, dx);

    // Two possible orientations
    let a1 = rawAngle;
    let a2 = rawAngle + Math.PI;

    // Check which one points "Up" (Closer to 0)
    let checkA1 = a1;
    let checkA2 = a2;
    if (h > w) {
        checkA1 -= Math.PI / 2;
        checkA2 -= Math.PI / 2;
    }

    const norm = (a) => {
        a = a % (2 * Math.PI);
        if (a > Math.PI) a -= 2 * Math.PI;
        if (a < -Math.PI) a += 2 * Math.PI;
        return a;
    };

    const dist1 = Math.abs(norm(checkA1));
    const dist2 = Math.abs(norm(checkA2));

    let finalAngle = (dist1 < dist2) ? a1 : a2;

    // Aspect Ratio Correction
    if (h > w) {
        finalAngle -= Math.PI / 2;
    }

    bead.mesh.material.rotation = finalAngle;
    // Save rotation to userData so history system can track it
    bead.mesh.userData.rotation = (finalAngle * 180) / Math.PI;
}

/**
 * Cancels any pending slider save timer
 * Called when save is triggered from elsewhere to prevent duplicate saves
 */
window.cancelSliderSave = function () {
    if (sliderSaveTimer) {
        clearTimeout(sliderSaveTimer);
        sliderSaveTimer = null;
        sliderSavePending = false;
        
    }
};

window.initCustomSize = initCustomSize;
window.updateGravitySimulation = updateGravitySimulation;
window.startGravitySimulation = startGravitySimulation;
window.updateGravityPath = updateGravityPath;