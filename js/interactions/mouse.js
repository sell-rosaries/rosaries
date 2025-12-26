/*
    MOUSE INTERACTIONS MODULE
    Handles mouse input and coordinate processing
*/

/**
 * Get normalized coordinates from mouse/touch event
 */
function getNormalizedCoords(event) {
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const pointer = event.changedTouches ? event.changedTouches[0] : event;
    return {
        x: ((pointer.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((pointer.clientY - rect.top) / rect.height) * 2 + 1
    };
}

let currentPathData = null;
let isErasing = false;
let eraserMarker = null;
// New Eraser Wand Variables
let isDraggingEraser = false;
let eraserDragOffset = new THREE.Vector3();
let hasErasedInThisStroke = false;

function createEraserTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Scale and center the path (Original viewbox 0 0 24 24)
    const scale = 2.0;
    const offsetX = 8;
    const offsetY = 8;

    const path = new Path2D("M18 13.5L20.5 16L16 20.5L13.5 18M7 21H12M13.5 18L4 8.5C3.17157 7.67157 3.17157 6.32843 4 5.5L6.5 3C7.32843 2.17157 8.67157 2.17157 9.5 3L19 12.5");

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw white outline first (for visibility against any background)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);

    // Draw black main icon
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke(path);

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function updateEraserMarker(position, visible) {
    if (!eraserMarker) {
        // Create sprite marker
        const texture = createEraserTexture();
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            depthTest: false // Always visible on top
        });
        eraserMarker = new THREE.Sprite(material);
        eraserMarker.scale.set(1.5, 1.5, 1.5); // Adjust size
        eraserMarker.renderOrder = 999;
        scene.add(eraserMarker);
    }

    if (visible && position) {
        eraserMarker.visible = true;
        eraserMarker.position.copy(position);
        eraserMarker.position.y += 0.8; // Float above the tip
    } else {
        if (eraserMarker) eraserMarker.visible = false;
    }
}

/**
 * Mouse down event handler
 */
function onCanvasMouseDown(event) {
    // Hide Pen Menu if open
    const penMenu = document.getElementById('pen-options-menu');
    if (penMenu) penMenu.classList.remove('active');

    // Stop gravity if active
    if (window.gravityState && window.gravityState.active) {
        window.gravityState.active = false;
    }

    const coords = getNormalizedCoords(event);
    mouse.x = coords.x;
    mouse.y = coords.y;
    mouseDownPosition = { x: coords.x, y: coords.y };
    hasDragged = false;
    raycaster.setFromCamera(mouse, camera);

    // Eraser Mode Logic
    if (isEraseMode) {
        const wand = typeof getEraserWandObject === 'function' ? getEraserWandObject() : null;
        if (wand && wand.visible) {
            // Raycast against the wand group
            const intersects = raycaster.intersectObjects([wand], true);
            if (intersects.length > 0) {
                isDraggingEraser = true;
                controls.enabled = false;

                // Calculate offset to keep relative position during drag
                const hitPoint = intersects[0].point;
                eraserDragOffset.subVectors(wand.position, hitPoint);
                // We only care about XZ plane dragging, keep Y separate
                eraserDragOffset.y = 0;

                hasErasedInThisStroke = false;
            }
        }
        return;
    }

    // Pre-calculate path data for smooth rotation during drag
    // We check stringPaths now as well
    if (!isStringMode && (stringPaths.length > 0 || stringPoints.length > 1)) {
        currentPathData = calculatePathDataLocal();
    }

    if (isStringMode) {
        isDrawingString = true;
        const intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
            const clickPoint = intersects[0].point.clone();

            // NEW: Check for collision with existing committed paths to Fuse
            let startPoint = clickPoint;
            const fuseInfo = findClosestPointOnAnyPath(clickPoint, 1.0); // 1.0 units snap radius

            if (fuseInfo) {
                // FUSE!
                startPoint = fuseInfo.point; // Visual snap to existing point

                // Do NOT modify the existing stringPaths here (no splice).
                // We just want to visually start from that point.
                // If we need to physically split the segment for graph logic, 
                // we should do it when the stroke is completed or validated.
                // For now, visual snap is sufficient and safer.
            }

            // Always start FRESH stringPoints for a new stroke
            // Note: If we fused, the first point is the fused point
            stringPoints = [startPoint];
            updateStringLine();

            // Track that pen drawing has started
            if (typeof hasPenDrawing !== 'undefined') {
                hasPenDrawing = true;
            }
            if (typeof updateStringType === 'function') {
                updateStringType();
            }
        }
    } else if (selectedObjectId && selectedSize) {
        // Placement mode - but check if clicking on existing bead first
        const beadIntersects = raycaster.intersectObjects(beads);

        if (beadIntersects.length > 0) {
            // Clicked on existing bead - auto-switch to select mode
            isSelectMode = true;
            controls.enabled = true;
            draggedBead = beadIntersects[0].object;
            if (!isDeleteMode) {
                draggedBeadPreviousPosition = draggedBead.position.clone();
                isDragging = true;
                controls.enabled = false;
            }
        } else {
            // Check if clicking near string to place bead
            const planeIntersects = raycaster.intersectObject(plane);
            if (planeIntersects.length > 0) {
                const clickPoint = planeIntersects[0].point;

                // Use the new helper that checks ALL paths
                // IMPORTANT: Use 0.5 threshold to match placeBead logic
                const stringInfo = findClosestPointOnAnyPath(clickPoint, 0.5);

                if (stringInfo) {
                    // Near string - place bead
                    placeBead();
                } else {
                    // Not near string - auto-switch to select/pan mode
                    isSelectMode = true;
                    controls.enabled = true;
                    selectedObjectId = null;
                    selectedSize = null;
                    createBeadSelection(); // Refresh UI to remove selection highlight
                    updateSelectedBeadPreview(); // Clear preview
                }
            }
        }
    } else {
        // Default: select/pan mode
        isSelectMode = true;
        controls.enabled = true;

        const intersects = raycaster.intersectObjects(beads);
        if (intersects.length > 0) {
            draggedBead = intersects[0].object;
            if (!isDeleteMode) {
                draggedBeadPreviousPosition = draggedBead.position.clone();
                isDragging = true;
                controls.enabled = false;
            }
        }
    }
}

/**
 * Mouse move event handler
 */
function onCanvasMouseMove(event) {
    if (!isDragging && !isDrawingString && !isErasing && !isDraggingEraser) return;

    const coords = getNormalizedCoords(event);

    if (mouseDownPosition && isDragging) {
        const dx = coords.x - mouseDownPosition.x;
        const dy = coords.y - mouseDownPosition.y;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
            hasDragged = true;
        }
    }
    mouse.x = coords.x;
    mouse.y = coords.y;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(plane);
    if (intersects.length === 0) return;
    const intersectPoint = intersects[0].point;

    // --- NEW ERASER LOGIC (Multi-String Edition) ---
    if (isDraggingEraser) {
        const wand = typeof getEraserWandObject === 'function' ? getEraserWandObject() : null;
        if (wand) {
            // Snap eraser body directly to mouse/touch position
            wand.position.x = intersectPoint.x;
            wand.position.z = intersectPoint.z;
            wand.position.y = 1.0; // Keep hovering

            // 1. Gather all available tips (start/end for each path)
            const tips = [];
            if (stringPoints && stringPoints.length > 0) {
                tips.push({ pos: stringPoints[0], type: 'start', pathIdx: -1 });
                tips.push({ pos: stringPoints[stringPoints.length - 1], type: 'end', pathIdx: -1 });
            }
            if (typeof stringPaths !== 'undefined') {
                stringPaths.forEach((path, idx) => {
                    if (path.length > 0) {
                        tips.push({ pos: path[0], type: 'start', pathIdx: idx });
                        tips.push({ pos: path[path.length - 1], type: 'end', pathIdx: idx });
                    }
                });
            }

            // 2. Find closest tip to orient eraser
            let closestTip = null;
            let minDist = Infinity;
            tips.forEach(t => {
                const d = wand.position.distanceTo(t.pos);
                if (d < minDist) {
                    minDist = d;
                    closestTip = t;
                }
            });

            if (closestTip && typeof updateEraserOrientation === 'function') {
                updateEraserOrientation(closestTip.pos);
            }

            // 3. Collision and Erasing
            if (closestTip) {
                if (typeof checkEraserCollisionWithString === 'function') {
                    // We check specifically against the closest tip for precision
                    const collision = checkEraserCollisionWithString(closestTip.pos, null);

                    // Helper for safety check
                    const isSafeToErase = (tipPosition) => {
                        const protectionRadius = 0.8;
                        if (beads && beads.length > 0) {
                            for (const bead of beads) {
                                if (bead) {
                                    const beadSize = Math.max(bead.scale.x, bead.scale.y);
                                    const dist = tipPosition.distanceTo(bead.position);
                                    if (dist < (beadSize / 2 + protectionRadius)) {
                                        return false;
                                    }
                                }
                            }
                        }
                        return true;
                    };

                    if (collision === 'start' && isSafeToErase(closestTip.pos)) {
                        const targetPath = (closestTip.pathIdx === -1) ? stringPoints : stringPaths[closestTip.pathIdx];
                        if (closestTip.type === 'start') {
                            targetPath.shift();
                        } else {
                            targetPath.pop();
                        }

                        // Clean up empty paths
                        if (closestTip.pathIdx !== -1 && targetPath.length < 2) {
                            stringPaths.splice(closestTip.pathIdx, 1);
                        }

                        updateStringLine();
                        hasErasedInThisStroke = true;
                    }
                }
            }
        }
        return;
    }

    // Update Eraser Marker Preview (Legacy - keeping just in case, but likely unused now)
    if (isEraseMode && !isDraggingEraser) {
        // Don't update legacy marker if we are using Wand
        if (typeof getEraserWandObject === 'function') return;
    }

    if (isErasing) {
        // LEGACY ERASER LOGIC (Keeping if isErasing is triggered somehow, but shouldn't be)
        // ... (We can effectively disable this or leave it as fallback)
    } else if (isDrawingString) {

        // Smooth String Drawing (High Density)
        // Use linear interpolation to ensure consistent density of 0.05 units
        // Smooth String Drawing (High Density)
        // Use linear interpolation to ensure consistent density of 0.05 units
        if (stringPoints.length > 0) {
            const lastPoint = stringPoints[stringPoints.length - 1];

            // NEW: Visual feedback for potential fuse, but DO NOT STOP dragging
            const fuseInfo = findClosestPointOnAnyPath(intersectPoint, 0.5);

            let targetPoint = intersectPoint;

            // Just snap visually but continue drawing
            // We do NOT modify the committed paths here yet.
            // We wait for MouseUp to commit the fuse.
            if (fuseInfo) {
                // targetPoint = fuseInfo.point; // Optional: auto-snap visual guide? 
                // For now, let's keep freehand drawing to avoid "sticky" feel when crossing
            }

            const distance = lastPoint.distanceTo(targetPoint);
            const density = 0.05;

            // START TRIM: If we are just starting (length=1) and the mouse is still inside the snap radius of the start,
            // DO NOT add points yet. This prevents the "hook" at the start.
            if (stringPoints.length === 1) {
                const startP = stringPoints[0];
                // If dragging away from start, wait until we cover some distance (e.g. 0.5)
                // This ensures the first segment drawn is deliberate and clean.
                if (targetPoint.distanceTo(startP) < 0.5) {
                    updateStringLine(); // Just update visual (dot at start)
                    return;
                }
            }

            if (distance > density) {
                // Calculate number of points needed
                const numPoints = Math.floor(distance / density);

                // Add interpolated points
                for (let i = 1; i <= numPoints; i++) {
                    const t = i / (numPoints + 1);
                    const interpolatedPoint = new THREE.Vector3(
                        lastPoint.x + (targetPoint.x - lastPoint.x) * t,
                        lastPoint.y + (targetPoint.y - lastPoint.y) * t,
                        lastPoint.z + (targetPoint.z - lastPoint.z) * t
                    );
                    stringPoints.push(interpolatedPoint);
                }

                // Add the actual target point if we aren't interpolating to it already
                // stringPoints.push(targetPoint); // We usually wait for next move or MouseUp

                updateStringLine();
            }
        }

    } else if (isDragging && draggedBead) {
        // SMART DRAG (Global Snap Mode)
        // Instead of traversing the graph, we find the absolute closest point on ANY path directly.
        // This allows jumping between crossed strings (visual intersections) without explicit graph connections.

        // 1. Find closest point on ALL paths
        // We use a slightly larger threshold (e.g. 5.0) to ensure we always snap to something if close
        const bestMatch = findClosestPointOnAnyPath(intersectPoint, 10.0);

        if (bestMatch) {
            // 2. Update Bead Position
            draggedBead.position.copy(bestMatch.point);
            draggedBead.position.y = 0.1;

            // 3. Update Bead Internal State
            // We must update pathIndex so sizing/rendering works correctly
            draggedBead.userData.pathIndex = bestMatch.pathIndex;
            draggedBead.userData.segmentIndex = bestMatch.segmentIndex !== undefined ? bestMatch.segmentIndex : bestMatch.vertexIndex;
            // t calculation for vertex vs segment
            if (bestMatch.type === 'vertex') {
                // Vertex is t=0 of next segment or t=1 of pervious. 
                // Let's normalize to t=0 of the segment starting at this vertex.
                draggedBead.userData.segmentIndex = bestMatch.vertexIndex;
                draggedBead.userData.t = 0;

                // Edge case: End of string, use last segment t=1
                const path = stringPaths[bestMatch.pathIndex];
                if (bestMatch.vertexIndex === path.length - 1) {
                    draggedBead.userData.segmentIndex = bestMatch.vertexIndex - 1;
                    draggedBead.userData.t = 1;
                }
            } else {
                draggedBead.userData.t = bestMatch.t;
            }

            // 4. Update Rotation (Tangent based)
            // Recalculate tangent for the new position/path
            let tangent = new THREE.Vector3(1, 0, 0); // Default

            const pIdx = draggedBead.userData.pathIndex;
            const sIdx = draggedBead.userData.segmentIndex;
            const path = stringPaths[pIdx];

            if (path && sIdx >= 0 && sIdx < path.length - 1) {
                const p1 = path[sIdx];
                const p2 = path[sIdx + 1];
                tangent.subVectors(p2, p1).normalize();
            } else if (path && path.length > 1) {
                // Fallback for end of path
                const p1 = path[path.length - 2];
                const p2 = path[path.length - 1];
                tangent.subVectors(p2, p1).normalize();
            }

            // Align bead
            const angle = Math.atan2(tangent.z, tangent.x);
            draggedBead.material.rotation = angle;
            draggedBead.userData.rotation = Math.round((angle * 180) / Math.PI) % 360;

            // 5. GHOST MODE: Disable collision check during drag
            draggedBeadPreviousPosition.copy(draggedBead.position);
        }
    }
}

/**
 * Mouse up event handler
 */
function onCanvasMouseUp(event) {
    currentPathData = null; // Clear temp data

    isErasing = false;

    let shouldSave = false;

    // Handle Eraser Wand Drop
    if (isDraggingEraser) {
        isDraggingEraser = false;
        controls.enabled = true;

        if (hasErasedInThisStroke) {
            shouldSave = true;
        }
        hasErasedInThisStroke = false;
    }

    if (isSelectMode && !hasDragged && mouseDownPosition) {
        if (draggedBead) {
            if (isDeleteMode) {
                deleteIndividualBead(draggedBead);
                shouldSave = true;
            } else if (selectedBeadForRotation === draggedBead) {
                hideRotationSlider();
            } else {
                showRotationSlider(draggedBead);
            }
        } else {
            if (isDeleteMode) {
                // Check if this is a canvas-only click (not UI elements)
                const eventTarget = event.target;
                const canvas = renderer?.domElement;

                // If click was NOT on canvas, let document handlers handle it
                if (eventTarget !== canvas) {

                    return;
                }



                // Don't deactivate during active 2-finger gestures OR recently ended gestures
                if (typeof touchGestureActive !== 'undefined' && touchGestureActive) {

                    return;
                }

                // Additional protection: don't deactivate if a 2-finger gesture recently ended
                if (typeof twoFingerGestureTimestamp !== 'undefined') {
                    const timeSinceTwoFingerGesture = Date.now() - twoFingerGestureTimestamp;
                    const twoFingerGestureCooldown = 30; // 30ms cooldown

                    if (timeSinceTwoFingerGesture < twoFingerGestureCooldown) {

                        return;
                    }
                }

                // Raycast to check if click was on empty canvas space
                const planeIntersects = raycaster.intersectObject(plane);


                if (planeIntersects.length > 0) {
                    // Clicked on empty canvas space - should deactivate

                    exitDeleteMode();
                    showDeleteModeDeactivatedToast();

                } else {

                }
            } else {
                hideRotationSlider();
            }
        }
    }

    if (stringPoints.length > 0) { // was isDrawingString
        shouldSave = true;

        // NEW: Snap-to-Fuse Logic on Lift
        // Check Start Point (already handled in MouseDown, but double check?)
        // The start point was handled in MouseDown (snapped to existing).

        // Check End Point
        const lastPoint = stringPoints[stringPoints.length - 1];
        const fuseInfo = findClosestPointOnAnyPath(lastPoint, 1.0); // 1.0 snap radius on lift

        if (fuseInfo) {
            // TRIM LOGIC: Aggressively remove points from the end that are near the fuse point.
            // This prevents "overshoot" or "jitter" points (\/\/\/) from remaining.
            const fusePoint = fuseInfo.point;

            // We want to connect the "main body" of the line directly to the fuse point.
            // So we strip off the "tail" that is close to the intersection.
            const snapRadius = 1.0;

            // Keep popping points until we find one that is far enough away to form a clean segment
            // Or until we run out of points (don't delete the whole line)
            while (stringPoints.length > 1) {
                const lastIdx = stringPoints.length - 1;
                const p = stringPoints[lastIdx];

                // If point is within snap radius, it's part of the potentially messy tail
                if (p.distanceTo(fusePoint) < snapRadius) {
                    stringPoints.pop();
                } else {
                    // Check for "backtracking" or sharpness?
                    // For now, distance check is usually sufficient if robust.
                    break;
                }
            }

            // Add the EXACT fuse point
            stringPoints.push(fusePoint.clone());

            // If we hit a segment, we MUST split that segment so the graph is connected
            if (fuseInfo.type === 'segment') {
                const path = stringPaths[fuseInfo.pathIndex];
                // Insert the split point
                path.splice(fuseInfo.segmentIndex + 1, 0, fusePoint.clone());
            }
        }

        // Reset slider base to the new string geometry
        if (typeof window.resetSliderBase === 'function') {
            window.resetSliderBase();
        }

        // Commit the string path
        if (stringPoints.length > 1) { // Only commit if it has length
            stringPaths.push([...stringPoints]);
        }
        stringPoints = []; // Clear active string
        updateStringLine();

        // REMOVED: exitStringMode(); -> User wants continuous drawing

        // Ensure string type is updated after drawing complete
        if (typeof updateStringType === 'function') {
            updateStringType();
        }
    }

    if (isDragging && hasDragged && draggedBead) {
        // SNAP ON RELEASE: Resolve collisions
        if (checkBeadCollision(draggedBead, [draggedBead])) {


            if (!currentPathData) {
                currentPathData = calculatePathDataLocal();
            }

            if (currentPathData) {
                const startInfo = projectBeadToPathLocal(draggedBead.position, currentPathData);
                let searchDist = 0.1; // Start small
                // Use total length of the SPECIFIC path the bead is on
                const pathLength = currentPathData.paths[startInfo.pathIndex].totalLength;
                const maxSearch = pathLength / 2;
                let found = false;

                while (searchDist < maxSearch) {
                    // Check forward
                    const fwdDist = startInfo.dist + searchDist;
                    const fwdPos = getPathPosLocal(currentPathData, startInfo.pathIndex, fwdDist);
                    draggedBead.position.copy(fwdPos);
                    draggedBead.position.y = 0.1;
                    if (!checkBeadCollision(draggedBead, [draggedBead])) {
                        found = true;
                        break;
                    }

                    // Check backward
                    const bwdDist = startInfo.dist - searchDist;
                    const bwdPos = getPathPosLocal(currentPathData, startInfo.pathIndex, bwdDist);
                    draggedBead.position.copy(bwdPos);
                    draggedBead.position.y = 0.1;
                    if (!checkBeadCollision(draggedBead, [draggedBead])) {
                        found = true;
                        break;
                    }

                    searchDist += 0.1;
                }

                if (found) {

                } else {
                    console.warn('⚠️ Could not find free space, reverting to previous position');
                    if (draggedBeadPreviousPosition) {
                        draggedBead.position.copy(draggedBeadPreviousPosition);
                    }
                }
            }
        }

        shouldSave = true;
    }

    isDrawingString = false;
    isDragging = false;
    draggedBead = null;
    draggedBeadPreviousPosition = null;
    mouseDownPosition = null;
    hasDragged = false;
    if (isSelectMode) {
        controls.enabled = true;
    }

    if (shouldSave) {
        saveState();
    }
}

// --- LOCAL HELPER FUNCTIONS (Refactored for Multi-String Graph) ---

function calculatePathDataLocal() {
    // Combine active string (if any) with committed paths for movement
    const allPaths = [...stringPaths];
    if (stringPoints && stringPoints.length > 1) {
        allPaths.push(stringPoints);
    }

    if (allPaths.length === 0) return null;

    const pathsData = [];
    const junctionMap = new Map(); // "x,y,z" -> [{ pathIndex, atStart: bool }]

    allPaths.forEach((points, pIndex) => {
        if (points.length < 2) return;

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

        const first = points[0];
        const last = points[points.length - 1];
        const isClosed = first.distanceTo(last) < 0.5;

        // Register endpoints for junctions
        const startKey = `${first.x.toFixed(3)},${first.y.toFixed(3)},${first.z.toFixed(3)}`;
        const endKey = `${last.x.toFixed(3)},${last.y.toFixed(3)},${last.z.toFixed(3)}`;

        if (!junctionMap.has(startKey)) junctionMap.set(startKey, []);
        if (!junctionMap.has(endKey)) junctionMap.set(endKey, []);

        junctionMap.get(startKey).push({ pathIndex: pIndex, location: 'start', dist: 0 });
        junctionMap.get(endKey).push({ pathIndex: pIndex, location: 'end', dist: totalLength });

        pathsData.push({
            segments,
            totalLength,
            isClosed,
            points: points
        });
    });

    return { paths: pathsData, junctions: junctionMap };
}

function getPathPosLocal(pathData, pathIndex, dist) {
    const path = pathData.paths[pathIndex];
    if (!path) return new THREE.Vector3();

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

function projectBeadToPathLocal(pos, pathData) {
    let minDist = Infinity;
    let bestResult = { pathIndex: 0, dist: 0 };

    pathData.paths.forEach((path, pIndex) => {
        path.segments.forEach(seg => {
            const v = new THREE.Vector3().subVectors(pos, seg.start);
            const t = v.dot(seg.dir);
            const clampedT = Math.max(0, Math.min(t, seg.length));
            const closest = new THREE.Vector3().copy(seg.start).addScaledVector(seg.dir, clampedT);
            const d = closest.distanceTo(pos);

            if (d < minDist) {
                minDist = d;
                bestResult = { pathIndex: pIndex, dist: seg.startDist + clampedT };
            }
        });
    });

    return bestResult;
}

/**
 * Solves using graph walker (Hill Climbing across paths)
 */
function solveClosestPointOnPathLocal(targetPos, currentInfo, pathData) {
    // currentInfo = { pathIndex, dist }
    let bestInfo = { ...currentInfo };
    let bestScore = getPathPosLocal(pathData, bestInfo.pathIndex, bestInfo.dist).distanceTo(targetPos);

    const path = pathData.paths[bestInfo.pathIndex];
    let step = path.totalLength * 0.01;
    const minStep = 0.001;
    const maxIter = 50;

    for (let i = 0; i < maxIter; i++) {
        const potentialMoves = [];

        // 1. Move Forward/Backward on current path
        potentialMoves.push({
            pathIndex: bestInfo.pathIndex,
            dist: bestInfo.dist + step
        });
        potentialMoves.push({
            pathIndex: bestInfo.pathIndex,
            dist: bestInfo.dist - step
        });

        // 2. Check Junctions
        // Determine current position 3D
        const currentPos3D = getPathPosLocal(pathData, bestInfo.pathIndex, bestInfo.dist);
        const key = `${currentPos3D.x.toFixed(3)},${currentPos3D.y.toFixed(3)},${currentPos3D.z.toFixed(3)}`;

        // If we are near a junction (threshold?), switch paths
        // Ideally we check if 'dist' is near 0 or totalLength
        const distEpsilon = 0.1;
        const currentPath = pathData.paths[bestInfo.pathIndex];

        let atJunction = false;
        if (bestInfo.dist < distEpsilon) {
            // At Start
            const startKey = `${currentPath.points[0].x.toFixed(3)},${currentPath.points[0].y.toFixed(3)},${currentPath.points[0].z.toFixed(3)}`;
            const connections = pathData.junctions.get(startKey);
            if (connections) connections.forEach(c => {
                if (c.pathIndex !== bestInfo.pathIndex) {
                    // Try moving into this path
                    potentialMoves.push({ pathIndex: c.pathIndex, dist: c.dist + (c.location === 'start' ? step : -step) });
                }
            });
        }
        if (bestInfo.dist > currentPath.totalLength - distEpsilon) {
            // At End
            const endKey = `${currentPath.points[currentPath.points.length - 1].x.toFixed(3)},${currentPath.points[currentPath.points.length - 1].y.toFixed(3)},${currentPath.points[currentPath.points.length - 1].z.toFixed(3)}`;
            const connections = pathData.junctions.get(endKey);
            if (connections) connections.forEach(c => {
                if (c.pathIndex !== bestInfo.pathIndex) {
                    potentialMoves.push({ pathIndex: c.pathIndex, dist: c.dist + (c.location === 'start' ? step : -step) });
                }
            });
        }

        // Evaluate moves
        let improved = false;
        for (const move of potentialMoves) {
            // Normalize
            const movePath = pathData.paths[move.pathIndex];
            if (movePath.isClosed) {
                move.dist = (move.dist % movePath.totalLength + movePath.totalLength) % movePath.totalLength;
            } else {
                move.dist = Math.max(0, Math.min(move.dist, movePath.totalLength));
            }

            const pos = getPathPosLocal(pathData, move.pathIndex, move.dist);
            const score = pos.distanceTo(targetPos);

            if (score < bestScore) {
                bestScore = score;
                bestInfo = move;
                improved = true;
            }
        }

        if (!improved) {
            step *= 0.5;
            if (step < minStep) break;
        }
    }

    return bestInfo;
}

/**
 * Helper to find closest point on ANY committed string path
 */
function findClosestPointOnAnyPath(point, threshold = 0.5) {
    let bestMatch = null;
    let minDist = threshold;

    for (let pIndex = 0; pIndex < stringPaths.length; pIndex++) {
        const path = stringPaths[pIndex];
        if (path.length < 2) continue;

        // Check Points (Vertices)
        for (let i = 0; i < path.length; i++) {
            const dist = point.distanceTo(path[i]);
            if (dist < minDist) {
                minDist = dist;
                bestMatch = {
                    type: 'vertex',
                    point: path[i].clone(),
                    pathIndex: pIndex,
                    vertexIndex: i
                };
            }
        }

        // Check Segments
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];

            const segmentVec = new THREE.Vector3().subVectors(p2, p1);
            const pointVec = new THREE.Vector3().subVectors(point, p1);
            const segmentLength = segmentVec.length();

            if (segmentLength <= 0.0001) continue;

            const t = Math.max(0, Math.min(1, pointVec.dot(segmentVec) / (segmentLength * segmentLength)));

            // If closest point is effectively a vertex, ignore (handled above)
            if (t < 0.05 || t > 0.95) continue;

            const closest = new THREE.Vector3().addVectors(p1, segmentVec.multiplyScalar(t));
            const dist = point.distanceTo(closest);

            if (dist < minDist) {
                minDist = dist;
                bestMatch = {
                    type: 'segment',
                    point: closest,
                    pathIndex: pIndex,
                    segmentIndex: i,
                    t: t
                };
            }
        }
    }

    return bestMatch;
}