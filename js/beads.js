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

    if (stringPoints.length < 2) {
        console.log("No string drawn. Please draw a string first.");
        return;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0) {
        const clickPoint = intersects[0].point;
        const stringInfo = findClosestPointOnString(clickPoint);

        if (!stringInfo) {
            console.log("Click point is too far from string. Click closer to the string.");
            return;
        }

        createBead(obj, selectedSize, (bead) => {
            bead.position.copy(stringInfo.position);
            bead.position.y = 0.1;
            bead.userData.stringAngle = stringInfo.angle;
            bead.userData.segmentIndex = stringInfo.segmentIndex;
            bead.userData.t = stringInfo.t;

            if (!checkBeadCollision(bead)) {
                scene.add(bead);
                beads.push(bead);
                updateBeadCount();
                saveState();
            } else {
                console.log("Collision detected, bead not placed.");
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
        const distSq = dx*dx + dz*dz;
        
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
        if (checkRotatedRectCollision(x1, z1, w1, h1, rot1, x2, z2, w2, h2, rot2)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks collision between two rotated rectangles using Separating Axis Theorem (SAT).
 */
function checkRotatedRectCollision(x1, z1, w1, h1, rot1, x2, z2, w2, h2, rot2) {
    const corners1 = getRotatedRectCorners(x1, z1, w1, h1, rot1);
    const corners2 = getRotatedRectCorners(x2, z2, w2, h2, rot2);
    
    const axes = [
        { x: Math.cos(rot1), y: Math.sin(rot1) },
        { x: -Math.sin(rot1), y: Math.cos(rot1) },
        { x: Math.cos(rot2), y: Math.sin(rot2) },
        { x: -Math.sin(rot2), y: Math.cos(rot2) }
    ];
    
    for (const axis of axes) {
        const proj1 = projectOntoAxis(corners1, axis);
        const proj2 = projectOntoAxis(corners2, axis);
        
        if (proj1.max < proj2.min || proj2.max < proj1.min) {
            return false;
        }
    }
    
    return true;
}

/**
 * Gets the 4 corners of a rotated rectangle.
 */
function getRotatedRectCorners(x, z, width, height, rotation) {
    const halfW = width / 2;
    const halfH = height / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const localCorners = [
        { x: -halfW, y: -halfH },
        { x: halfW, y: -halfH },
        { x: halfW, y: halfH },
        { x: -halfW, y: halfH }
    ];
    
    return localCorners.map(corner => ({
        x: x + (corner.x * cos - corner.y * sin),
        y: z + (corner.x * sin + corner.y * cos)
    }));
}

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
