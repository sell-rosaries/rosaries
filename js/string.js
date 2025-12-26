/*
    STRING DRAWING
    String path creation and rendering
*/

/**
 * Finds the closest point on the string to a given position.
 * @param {THREE.Vector3} clickPoint - The point to check against
 * @param {number} maxDistance - Maximum distance to consider (default: 0.5)
 */
function findClosestPointOnString(clickPoint, maxDistance = 0.5) {
    if (stringPaths.length === 0 && stringPoints.length < 2) return null;

    let bestMatch = null;
    let minDistance = Infinity;

    // Helper to check a specific path
    const checkPath = (points, pathIdx) => {
        if (points.length < 2) return;

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            const segmentVec = new THREE.Vector3().subVectors(p2, p1);
            const pointVec = new THREE.Vector3().subVectors(clickPoint, p1);

            const segmentLength = segmentVec.length();
            if (segmentLength < 0.0001) continue;

            const t = Math.max(0, Math.min(1, pointVec.dot(segmentVec) / (segmentLength * segmentLength)));

            const closestOnSegment = new THREE.Vector3().addVectors(
                p1,
                segmentVec.clone().multiplyScalar(t)
            );

            const distance = clickPoint.distanceTo(closestOnSegment);

            if (distance < minDistance) {
                minDistance = distance;

                // Calculate angle for this segment
                const tangent = segmentVec.clone().normalize();
                const angle = Math.atan2(tangent.z, tangent.x);

                bestMatch = {
                    position: closestOnSegment,
                    angle: angle,
                    pathIndex: pathIdx, // -1 for active stringPoints
                    segmentIndex: i,
                    t: t
                };
            }
        }
    };

    // 1. Check all committed paths
    for (let i = 0; i < stringPaths.length; i++) {
        checkPath(stringPaths[i], i);
    }

    // 2. Check active path (if any)
    if (stringPoints.length > 1) {
        checkPath(stringPoints, -1);
    }

    if (minDistance > maxDistance) return null;

    return bestMatch;
}

/**
 * Updates the visual representation of the string.
 */
/**
 * Updates the visual representation of all string paths.
 */
function updateStringLine() {
    // 1. Handle the active string (being drawn)
    if (stringPoints.length > 1) {
        if (!stringLine) {
            const geometry = new THREE.BufferGeometry().setFromPoints(stringPoints);
            const isDarkMode = document.documentElement.hasAttribute('data-theme');
            const stringColor = isDarkMode ? 0x000000 : 0x5d4037;
            const material = new THREE.LineBasicMaterial({ color: stringColor, linewidth: 2 });

            stringLine = new THREE.Line(geometry, material);
            stringLine.position.y = 0.09;
            stringLine.frustumCulled = false;
            scene.add(stringLine);
        } else {
            stringLine.geometry.setFromPoints(stringPoints);
        }
    } else if (stringLine && stringPoints.length < 2) {
        // Clean up if it became too short
        scene.remove(stringLine);
        stringLine.geometry.dispose();
        stringLine.material.dispose();
        stringLine = null;
    }

    // 2. Handle committed paths (stringPaths)
    // Synchronize meshes with paths

    // Ensure we have enough meshes
    while (stringMeshes.length < stringPaths.length) {
        const geometry = new THREE.BufferGeometry();
        const isDarkMode = document.documentElement.hasAttribute('data-theme');
        const stringColor = isDarkMode ? 0x000000 : 0x5d4037;
        const material = new THREE.LineBasicMaterial({ color: stringColor, linewidth: 2 });

        const mesh = new THREE.Line(geometry, material);
        mesh.position.y = 0.09;
        mesh.frustumCulled = false;

        scene.add(mesh);
        stringMeshes.push(mesh);
    }

    // Remove excess meshes
    while (stringMeshes.length > stringPaths.length) {
        const mesh = stringMeshes.pop();
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    // Update geometries
    for (let i = 0; i < stringPaths.length; i++) {
        stringMeshes[i].geometry.setFromPoints(stringPaths[i]);
    }

    // Trigger string type update if we have pen drawing
    if (typeof updateStringType === 'function') {
        updateStringType();
    }
}

/**
 * Updates just the string color based on current theme.
 * Called when theme changes.
 */
/**
 * Updates just the string color based on current theme.
 * Called when theme changes.
 */
function updateStringColor() {
    const isDarkMode = document.documentElement.hasAttribute('data-theme');
    const stringColor = isDarkMode ? 0x000000 : 0x5d4037;

    if (stringLine) {
        stringLine.material.color.setHex(stringColor);
    }

    // Update all committed paths
    if (stringMeshes && stringMeshes.length > 0) {
        stringMeshes.forEach(mesh => {
            if (mesh && mesh.material) {
                mesh.material.color.setHex(stringColor);
            }
        });
    }
}

// Make globally accessible
window.updateStringColor = updateStringColor;
