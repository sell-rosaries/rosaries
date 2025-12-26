/*
    BEAD LOGIC
    Bead creation, placement, and collision detection
*/

/**
 * Creates a bead sprite and adds it to the scene.
 */
function createBead(obj, size, callback) {
    const radius = size / 10;
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(obj.image, (texture) => {
        const imgWidth = texture.image.width;
        const imgHeight = texture.image.height;
        const aspectRatio = imgWidth / imgHeight;

        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);

        if (aspectRatio >= 1) {
            sprite.scale.set(radius * 2, (radius * 2) / aspectRatio, 1);
        } else {
            sprite.scale.set((radius * 2) * aspectRatio, radius * 2, 1);
        }

        sprite.position.y = 0.1;
        sprite.userData = {
            objectId: obj.id,
            size: size,
            rotation: 0,
            aspectRatio: aspectRatio
        };
        callback(sprite);
    }, undefined, () => {
        const fallbackMaterial = new THREE.SpriteMaterial({ color: 0xcccccc, transparent: true });
        const sprite = new THREE.Sprite(fallbackMaterial);
        sprite.scale.set(radius * 2, radius * 2, 1);
        sprite.position.y = 0.1;
        sprite.userData = {
            objectId: obj.id,
            size: size,
            rotation: 0,
            aspectRatio: 1
        };
        callback(sprite);
    });
}

/**
 * Places a selected bead onto the canvas (only on the string).
 */
function placeBead() {
    if (!selectedObjectId || !selectedSize) return;

    const obj = getObjectById(selectedObjectId);
    if (!obj) return;

    if (stringPoints.length < 2 && stringPaths.length === 0) {

        return;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0) {
        const clickPoint = intersects[0].point;
        const stringInfo = findClosestPointOnString(clickPoint);

        if (!stringInfo) {

            return;
        }

        createBead(obj, selectedSize, (bead) => {
            bead.position.copy(stringInfo.position);
            bead.position.y = 0.1;
            bead.userData.stringAngle = stringInfo.angle;
            bead.userData.pathIndex = stringInfo.pathIndex;
            bead.userData.segmentIndex = stringInfo.segmentIndex;
            bead.userData.t = stringInfo.t;

            if (!checkBeadCollision(bead)) {
                scene.add(bead);
                beads.push(bead);
                updateBeadCount();
                saveState();
            } else {

            }
        });
    }
}

/**
 * Checks if a new bead collides with existing ones using current rotation.
 */
function checkBeadCollision(newBead, ignoreBeads = []) {
    const x1 = newBead.position.x;
    const z1 = newBead.position.z;
    const w1 = newBead.scale.x;
    const h1 = newBead.scale.y;
    const rot1 = newBead.material.rotation || 0;

    for (const existingBead of beads) {
        if (newBead === existingBead || ignoreBeads.includes(existingBead)) continue;

        const x2 = existingBead.position.x;
        const z2 = existingBead.position.z;
        const w2 = existingBead.scale.x;
        const h2 = existingBead.scale.y;
        const rot2 = existingBead.material.rotation || 0;

        // 1. Fast Broadphase: Bounding Circle Check (Max Radius)
        // Use max dimension for safe radius - if outside this, definitely no collision
        const r1Max = Math.max(w1, h1) / 2;
        const r2Max = Math.max(w2, h2) / 2;
        const dx = x1 - x2;
        const dz = z1 - z2;
        const distSq = dx * dx + dz * dz;

        if (distSq > (r1Max + r2Max) * (r1Max + r2Max)) continue;

        // 2. Hard Inner Core Check (Min Radius) - FAILSAFE
        // If the "inner circles" touch, it's a collision regardless of rotation.
        // This prevents thin objects from tunneling through each other if SAT fails.
        const r1Min = Math.min(w1, h1) / 2;
        const r2Min = Math.min(w2, h2) / 2;
        const minSepSq = (r1Min + r2Min) * (r1Min + r2Min);
        if (distSq < minSepSq) return true;

        // 3. Circular Optimization (if both are round-ish)
        const ar1 = w1 / h1;
        const ar2 = w2 / h2;
        if (ar1 > 0.9 && ar1 < 1.1 && ar2 > 0.9 && ar2 < 1.1) {
            const rad1 = (w1 + h1) / 4;
            const rad2 = (w2 + h2) / 4;
            if (distSq < (rad1 + rad2) * (rad1 + rad2)) return true;
            continue;
        }

        // 4. Narrowphase: SAT (Separating Axis Theorem)
        // Calculate corners based on STRING TANGENT, not visual rotation
        const corners1 = getBeadCorners(newBead);
        const corners2 = getBeadCorners(existingBead);

        if (checkPolygonCollision(corners1, corners2)) {
            return true;
        }
    }
    return false;
}

/**
 * Calculates the 4 corners of a bead based on string alignment
 * Handles 'Tube' beads (Height > Width) by aligning Height with string
 */
function getBeadCorners(bead) {
    // 1. Get dimensions
    const w = bead.scale.x;
    const h = bead.scale.y;

    // Determine physical orientation
    // If Tube (h > w), Length is along string. Width is perpendicular.
    let length = w;
    let width = h;

    if (h > w) {
        length = h;
        width = w;
    }

    // 2. Get Tangent Vector from String
    let tangent = { x: 1, y: 0 }; // Default Horizontal

    // FIXED: Use correct path from stringPaths or stringPoints
    if (typeof stringPaths !== 'undefined' && bead.userData) {
        const pathIdx = bead.userData.pathIndex;
        const segIdx = bead.userData.segmentIndex;

        let pathPoints = null;

        if (pathIdx === -1 && typeof stringPoints !== 'undefined') {
            pathPoints = stringPoints;
        } else if (pathIdx >= 0 && typeof stringPaths !== 'undefined' && stringPaths[pathIdx]) {
            pathPoints = stringPaths[pathIdx];
        }

        if (pathPoints && segIdx >= 0 && segIdx < pathPoints.length - 1) {
            const p1 = pathPoints[segIdx];
            const p2 = pathPoints[segIdx + 1];
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len > 0.0001) {
                tangent = { x: dx / len, y: dz / len };
            }
        }
    }

    // 3. Calculate Normal (Perpendicular to Tangent in 2D)
    // (x, y) -> (-y, x) is 90 deg rotation
    const normal = { x: -tangent.y, y: tangent.x };

    // 4. Calculate Corners
    const px = bead.position.x;
    const pz = bead.position.z;
    const halfL = length / 2;
    const halfW = width / 2;

    // Corner = Pos + Tangent*L_offset + Normal*W_offset
    return [
        {
            x: px + tangent.x * halfL + normal.x * halfW,
            y: pz + tangent.y * halfL + normal.y * halfW
        },
        {
            x: px + tangent.x * halfL - normal.x * halfW,
            y: pz + tangent.y * halfL - normal.y * halfW
        },
        {
            x: px - tangent.x * halfL - normal.x * halfW,
            y: pz - tangent.y * halfL - normal.y * halfW
        },
        {
            x: px - tangent.x * halfL + normal.x * halfW,
            y: pz - tangent.y * halfL + normal.y * halfW
        }
    ];
}

/**
 * Checks collision between two polygons using Separating Axis Theorem (SAT).
 * Accepts arrays of corner points {x, y}.
 */
function checkPolygonCollision(corners1, corners2) {
    // Helper to get axes from corners (normals of edges)
    const getAxes = (corners) => {
        const axes = [];
        for (let i = 0; i < corners.length; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % corners.length];
            const edge = { x: p1.x - p2.x, y: p1.y - p2.y };
            const normal = { x: -edge.y, y: edge.x };

            // Normalize (optional for SAT but good for stability)
            const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            if (len > 0.00001) {
                axes.push({ x: normal.x / len, y: normal.y / len });
            }
        }
        return axes;
    };

    const axes1 = getAxes(corners1);
    const axes2 = getAxes(corners2);
    const axes = [...axes1, ...axes2];

    for (const axis of axes) {
        const proj1 = projectOntoAxis(corners1, axis);
        const proj2 = projectOntoAxis(corners2, axis);

        if (proj1.max < proj2.min || proj2.max < proj1.min) {
            return false; // Separating axis found
        }
    }

    return true;
}

// Removed getRotatedRectCorners in favor of getBeadCorners

/**
 * Projects corners onto an axis and returns min/max values.
 */
function projectOntoAxis(corners, axis) {
    let min = Infinity;
    let max = -Infinity;

    for (const corner of corners) {
        const projection = corner.x * axis.x + corner.y * axis.y;
        min = Math.min(min, projection);
        max = Math.max(max, projection);
    }

    return { min, max };
}
