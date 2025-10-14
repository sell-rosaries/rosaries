/*
    STRING DRAWING
    String path creation and rendering
*/

/**
 * Finds the closest point on the string to a given position.
 */
function findClosestPointOnString(clickPoint) {
    if (stringPoints.length < 2) return null;

    let closestPoint = null;
    let closestDistance = Infinity;
    let closestSegmentIndex = -1;
    let closestT = 0;

    const snapDistance = 0.5;

    for (let i = 0; i < stringPoints.length - 1; i++) {
        const p1 = stringPoints[i];
        const p2 = stringPoints[i + 1];
        
        const segmentVec = new THREE.Vector3().subVectors(p2, p1);
        const pointVec = new THREE.Vector3().subVectors(clickPoint, p1);
        
        const segmentLength = segmentVec.length();
        const t = Math.max(0, Math.min(1, pointVec.dot(segmentVec) / (segmentLength * segmentLength)));
        
        const closestOnSegment = new THREE.Vector3().addVectors(
            p1,
            segmentVec.clone().multiplyScalar(t)
        );
        
        const distance = clickPoint.distanceTo(closestOnSegment);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = closestOnSegment;
            closestSegmentIndex = i;
            closestT = t;
        }
    }

    if (closestDistance > snapDistance) return null;

    const p1 = stringPoints[closestSegmentIndex];
    const p2 = stringPoints[closestSegmentIndex + 1];
    const tangent = new THREE.Vector3().subVectors(p2, p1).normalize();
    const angle = Math.atan2(tangent.z, tangent.x);

    return {
        position: closestPoint,
        angle: angle,
        segmentIndex: closestSegmentIndex,
        t: closestT
    };
}

/**
 * Updates the visual representation of the string.
 */
function updateStringLine() {
    if (stringLine) {
        scene.remove(stringLine);
        stringLine.geometry.dispose();
        stringLine.material.dispose();
    }
    if (stringPoints.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(stringPoints);
        const material = new THREE.LineBasicMaterial({ color: 0x5d4037, linewidth: 2 });
        stringLine = new THREE.Line(geometry, material);
        stringLine.position.y = 0.05;
        scene.add(stringLine);
    }
}
