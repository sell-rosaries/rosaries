/*
    MANUAL FIT MODULE
    Restored & Adapted
*/

let gravityActive = false;
let gravityAnimations = [];
let isGravityRunning = false;

let kinematicState = {
    active: false,
    beads: [],
    path: null,
    targetDist: 0,
    isLoop: false,
    lastTime: 0,
    speed: 9.0,
    saveOnComplete: false
};

let sliderSaveTimer = null;
let sliderSavePending = false;
window.gravityState = kinematicState;

function initCustomSize() {
    addCustomSizeHTML();
    addCustomSizeStyles();
    setupFitButtonEvents();
    setupToggleEvents();
}

function setupToggleEvents() {
    const container = document.getElementById('custom-size-control');
    const toggleBtn = document.getElementById('size-toggle-btn');
    const zoomControls = document.getElementById('canvas-zoom-controls');
    const fab = document.getElementById('fab');

    if (toggleBtn && container) {
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = container.classList.toggle('collapsed');
            
            // Handle Zoom Controls
            if (zoomControls) {
                if (isCollapsed) {
                    zoomControls.classList.add('collapsed');
                } else {
                    zoomControls.classList.remove('collapsed');
                }
            }

            // Handle FAB
            if (fab) {
                if (isCollapsed) {
                    fab.classList.add('collapsed');
                } else {
                    fab.classList.remove('collapsed');
                }
            }
        });
    }
    const helpBtn = document.getElementById('size-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            const title = window.getTranslation ? window.getTranslation('help-title') : 'Size Controls';
            const message = window.getTranslation ? window.getTranslation('help-message') : '📍 Slider: Allows to increase the string size of the rosary whitch will allow to include more beads on the string.\n\n✨ Fit Button: Automatically fits the current design to the current view box without changing the actual size of the rosary.';
            if (typeof showCustomAlert === 'function') {
                showCustomAlert(message, 'info', title);
            } else {
                alert(`${title}\n\n${message}`);
            }
        });
    }
}
function addCustomSizeHTML() {
    const customSizeHTML = `
        <div id="custom-size-control" class="custom-size-container">
            <button id="size-toggle-btn" class="size-toggle-btn" aria-label="Toggle Size Controls">
                <svg class="toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div class="custom-size-content">
                <button id="size-help-btn" class="size-help-btn" aria-label="Size Help"><span style="font-size: 16px; font-weight: bold;">!</span></button>
                <div class="custom-size-control">
                    <div class="size-slider-tube"><div class="size-slider-track"></div><div class="size-slider-liquid" style="height: 30%;"></div><div class="size-slider-level-indicator" style="bottom: 30%;"></div></div>
                    <button id="fit-button" class="fit-button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M8 2v4M16 2v4M8 18v4M16 18v4M2 8h4M2 16h4M18 8h4M18 16h4"/></svg><span class="fit-button-text">FIT</span></button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', customSizeHTML);
}
function addCustomSizeStyles() {
    const style = document.createElement('style');
    style.id = 'custom-size-styles';
    style.textContent = `
        .custom-size-container { position: fixed; left: 16px; top: 50%; transform: translateY(-50%); z-index: 150; pointer-events: none; display: flex; flex-direction: column; align-items: center; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .size-toggle-btn, .size-help-btn { pointer-events: auto; width: 32px; height: 32px; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #333; cursor: pointer; margin-bottom: 12px; transition: all 0.3s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 151; }
        .size-toggle-btn:hover, .size-help-btn:hover { background: #fff; transform: scale(1.1); }
        .custom-size-content { display: flex; flex-direction: column; align-items: center; transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease; transform-origin: top center; }
        .custom-size-container.collapsed { transform: translateY(-50%) translateX(-16px); }
        .custom-size-container.collapsed .custom-size-content { transform: translateX(-200%) scale(0.8); opacity: 0; pointer-events: none; }
        .custom-size-container.collapsed .size-toggle-btn { border-radius: 0 50% 50% 0; width: 24px; padding-left: 2px; }
        .custom-size-container.collapsed .toggle-icon { transform: rotate(180deg); }
        .custom-size-control { display: flex; flex-direction: column; align-items: center; gap: 12px; pointer-events: all; }
        .size-slider-tube { position: relative; width: 12px; height: 180px; background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; overflow: hidden; backdrop-filter: blur(5px); }
        .size-slider-liquid { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); border-radius: 999px; transition: height 0.2s ease; }
        .size-slider-level-indicator { position: absolute; left: 50%; transform: translateX(-50%); width: 16px; height: 2px; background: rgba(255,255,255,0.8); border-radius: 1px; pointer-events: none; transition: bottom 0.2s ease; }
        .fit-button { width: 40px; height: 40px; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; color: #4b5563; transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .fit-button:hover { background: #fff; color: #2563eb; transform: translateY(-2px); }
        .fit-button svg { width: 16px; height: 16px; }
        .fit-button-text { font-size: 8px; font-weight: bold; }
    `;
    document.head.appendChild(style);
}

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
                    const sliderPercentage = window.currentStringScale || 0;
                    const speedMultiplier = 1 + (sliderPercentage / 100) * 4.0;
                    const gravitySpeed = 9.0 * speedMultiplier;
                    await startGravitySimulation({ speed: gravitySpeed, saveOnComplete: true });
                }, 600);
            }
        } catch (error) { console.error('Error during fit:', error); }
    });
}

/**
 * Calculate path data for a set of points (for gravity simulation)
 */
function calculatePathForPoints(points) {
    if (!points || points.length < 2) return null;
    const segments = [];
    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
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
    const isClosed = points[0].distanceTo(points[points.length - 1]) < 0.5;
    return { segments, totalLength, isClosed };
}

/**
 * Update the gravity path data live
 */
function updateGravityPath() {
    if (!kinematicState.active) return;
    // We update the pathInfo for each bead based on their assigned pathIndex
    kinematicState.beads.forEach(b => {
        const pIdx = b.pathIndex;
        const pts = (pIdx === -1) ? stringPoints : stringPaths[pIdx];
        if (pts && pts.length >= 2) {
            b.pathInfo = calculatePathForPoints(pts);
            // Re-find target (Highest Z)
            let maxZ = -Infinity;
            let targetDist = 0;
            const samples = 50;
            for (let i = 0; i <= samples; i++) {
                const t = (i / samples) * b.pathInfo.totalLength;
                const pos = getPathPos(b.pathInfo, t);
                if (pos.z > maxZ) { maxZ = pos.z; targetDist = t; }
            }
            b.targetDist = targetDist;
        }
    });
}

/**
 * Start Kinematic Slide (Non-Physics Gravity)
 */
async function startGravitySimulation(options = {}) {
    if (kinematicState.active) {
        if (options.speed !== undefined) kinematicState.speed = options.speed;
        if (options.saveOnComplete !== undefined) kinematicState.saveOnComplete = options.saveOnComplete;
        updateGravityPath();
        return;
    }

    const simBeads = [];
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach((bead, index) => {
            const pIdx = bead.userData.pathIndex;
            const pts = (pIdx === -1) ? stringPoints : stringPaths[pIdx];
            if (!pts || pts.length < 2) return;

            const pathInfo = calculatePathForPoints(pts);
            const dist = projectBeadToPath(bead.position, pathInfo);

            // Highest Z on THIS path
            let maxZ = -Infinity;
            let targetDist = 0;
            const samples = 50;
            for (let i = 0; i <= samples; i++) {
                const t = (i / samples) * pathInfo.totalLength;
                const pos = getPathPos(pathInfo, t);
                if (pos.z > maxZ) { maxZ = pos.z; targetDist = t; }
            }

            simBeads.push({
                mesh: bead,
                distance: dist,
                radius: (Math.max(bead.scale.x, bead.scale.y) * 0.5) || 0.1,
                pathInfo: pathInfo,
                targetDist: targetDist,
                pathIndex: pIdx
            });
        });
    }

    kinematicState.active = true;
    kinematicState.beads = simBeads;
    kinematicState.lastTime = Date.now();
    kinematicState.speed = options.speed !== undefined ? options.speed : 9.0;
    kinematicState.saveOnComplete = options.saveOnComplete !== undefined ? options.saveOnComplete : false;
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
        const t = Math.max(0, Math.min(v.dot(seg.dir), seg.length));
        const closest = new THREE.Vector3().copy(seg.start).addScaledVector(seg.dir, t);
        const d = closest.distanceTo(pos);
        if (d < minDist) { minDist = d; bestPathDist = seg.startDist + t; }
    });
    return bestPathDist;
}

function getPathState(path, dist) {
    if (path.isClosed) dist = (dist % path.totalLength + path.totalLength) % path.totalLength;
    else dist = Math.max(0, Math.min(dist, path.totalLength));

    let seg = path.segments.find(s => dist >= s.startDist && dist <= s.endDist);
    if (!seg) seg = dist <= 0 ? path.segments[0] : path.segments[path.segments.length - 1];

    const localT = dist - seg.startDist;
    const pos = new THREE.Vector3().copy(seg.start).addScaledVector(seg.dir, localT);
    return { position: pos, tangent: seg.dir };
}

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

    const { beads: simBeads, speed } = kinematicState;
    const moveSpeed = speed * dt;
    let anyoneMoved = false;

    // Calculate signed distance to target for sorting within each path
    simBeads.forEach(b => {
        let diff = b.targetDist - b.distance;
        if (b.pathInfo.isClosed) {
            if (diff > b.pathInfo.totalLength / 2) diff -= b.pathInfo.totalLength;
            if (diff < -b.pathInfo.totalLength / 2) diff += b.pathInfo.totalLength;
        }
        b._diff = diff;
        b._absDiff = Math.abs(diff);
    });

    // Leaders (closest to target) move first
    simBeads.sort((a, b) => a._absDiff - b._absDiff);

    for (let i = 0; i < simBeads.length; i++) {
        const b = simBeads[i];
        if (b._absDiff < 0.01) continue;

        const dir = Math.sign(b._diff);
        const step = Math.min(moveSpeed, b._absDiff);
        const startDist = b.distance;
        let newDist = startDist + (dir * step);

        if (b.pathInfo.isClosed) newDist = (newDist % b.pathInfo.totalLength + b.pathInfo.totalLength) % b.pathInfo.totalLength;
        else newDist = Math.max(0, Math.min(newDist, b.pathInfo.totalLength));

        if (validatePositionMulti(b, newDist, simBeads, i)) {
            b.distance = newDist;
            anyoneMoved = true;
        } else {
            // Binary search for contact point
            let low = 0; let high = step; let valid = 0;
            for (let k = 0; k < 3; k++) {
                let mid = (low + high) / 2;
                let test = startDist + (dir * mid);
                if (b.pathInfo.isClosed) test = (test % b.pathInfo.totalLength + b.pathInfo.totalLength) % b.pathInfo.totalLength;
                else test = Math.max(0, Math.min(test, b.pathInfo.totalLength));

                if (validatePositionMulti(b, test, simBeads, i)) { valid = mid; low = mid; }
                else high = mid;
            }
            if (valid > 0.001) { b.distance = startDist + (dir * valid); anyoneMoved = true; }
        }
        updateBeadVisuals(b, b.pathInfo);
    }

    if (!anyoneMoved) {
        kinematicState.active = false;
        if (kinematicState.saveOnComplete) {
            if (typeof window.syncBeadAttachmentData === 'function') window.syncBeadAttachmentData();
            if (typeof window.autoSaveDesign === 'function') window.autoSaveDesign();
        }
    }
}

/**
 * Validate if a bead at 'dist' collides with any closer beads ON THE SAME PATH
 */
function validatePositionMulti(bead, dist, allBeads, myIndex) {
    const state = getPathState(bead.pathInfo, dist);
    const corners1 = getCornersFromState(state, bead.mesh.scale.x, bead.mesh.scale.y);

    for (let j = 0; j < allBeads.length; j++) {
        if (j === myIndex) continue;
        const other = allBeads[j];

        // IMPORTANT: Only collide with beads on the same path
        if (other.pathIndex !== bead.pathIndex) continue;

        const otherState = getPathState(other.pathInfo, other.distance);
        const corners2 = getCornersFromState(otherState, other.mesh.scale.x, other.mesh.scale.y);

        // Standard SAT check
        if (checkPolygonOverlap(corners1, corners2)) return false;
    }
    return true;
}

function getCornersFromState(state, w, h) {
    let L = w, W = h; if (h > w) { L = h; W = w; }
    const t = { x: state.tangent.x, y: state.tangent.z };
    const n = { x: -t.y, y: t.x };
    const px = state.position.x, pz = state.position.z;
    const hL = L / 2, hW = W / 2;
    return [
        { x: px + t.x * hL + n.x * hW, y: pz + t.y * hL + n.y * hW },
        { x: px + t.x * hL - n.x * hW, y: pz + t.y * hL - n.y * hW },
        { x: px - t.x * hL - n.x * hW, y: pz - t.y * hL - n.y * hW },
        { x: px - t.x * hL + n.x * hW, y: pz - t.y * hL + n.y * hW }
    ];
}

function checkPolygonOverlap(c1, c2) {
    const getAxes = (c) => {
        const axes = [];
        for (let i = 0; i < c.length; i++) {
            const p1 = c[i], p2 = c[(i + 1) % c.length];
            axes.push({ x: -(p2.y - p1.y), y: p2.x - p1.x });
        }
        return axes;
    };
    const axes = [...getAxes(c1), ...getAxes(c2)];
    for (let axis of axes) {
        let min1 = Infinity, max1 = -Infinity;
        c1.forEach(p => { const dot = p.x * axis.x + p.y * axis.y; min1 = Math.min(min1, dot); max1 = Math.max(max1, dot); });
        let min2 = Infinity, max2 = -Infinity;
        c2.forEach(p => { const dot = p.x * axis.x + p.y * axis.y; min2 = Math.min(min2, dot); max2 = Math.max(max2, dot); });
        if (max1 < min2 || max2 < min1) return false;
    }
    return true;
}

function updateBeadVisuals(b, path) {
    const state = getPathState(path, b.distance);
    b.mesh.position.copy(state.position);
    b.mesh.position.y = 0.1;
    const angle = Math.atan2(state.tangent.z, state.tangent.x);
    b.mesh.material.rotation = angle;
}
