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
        console.log('🛑 Gravity interrupted by user interaction');
    }

    const coords = getNormalizedCoords(event);
    mouse.x = coords.x;
    mouse.y = coords.y;
    mouseDownPosition = { x: coords.x, y: coords.y };
    hasDragged = false;
    raycaster.setFromCamera(mouse, camera);

    // Eraser Mode Logic
    if (isEraseMode) {
        const intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
            isErasing = true;
            // Marker update handled in move
        }
        return;
    }

    // Pre-calculate path data for smooth rotation during drag
    if (!isStringMode && stringPoints && stringPoints.length > 1) {
        currentPathData = calculatePathDataLocal();
    }

    if (isStringMode) {
        // String drawing mode
        isDrawingString = true;

        const intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
            const clickPoint = intersects[0].point.clone();

            if (stringPoints.length >= 2) {
                const startPoint = stringPoints[0];
                const endPoint = stringPoints[stringPoints.length - 1];
                const snapDistance = 2.0;

                const distanceToStart = clickPoint.distanceTo(startPoint);
                const distanceToEnd = clickPoint.distanceTo(endPoint);

                if (distanceToStart < distanceToEnd && distanceToStart < snapDistance) {
                    stringPoints.reverse();
                    updateStringLine();
                }
            }

            stringPoints.push(clickPoint);

            // Track that pen drawing has started AFTER adding the point
            if (typeof hasPenDrawing !== 'undefined') {
                hasPenDrawing = true;
                console.log('✏️ Pen drawing started - tracking as pen activity');
                if (typeof updateStringType === 'function') {
                    updateStringType();
                }
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
                const stringInfo = findClosestPointOnString(clickPoint);

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
    if (!isDragging && !isDrawingString && !isErasing) return;

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

    // Update Eraser Marker Preview (Snap to Tip)
    if (isEraseMode && stringPoints && stringPoints.length > 0) {
        const startPoint = stringPoints[0];
        const endPoint = stringPoints[stringPoints.length - 1];

        const distStart = intersectPoint.distanceTo(startPoint);
        const distEnd = intersectPoint.distanceTo(endPoint);

        const eraserThreshold = 3.0; // Detection range (generous)

        let targetPos = null;

        if (distStart < eraserThreshold && distStart <= distEnd) {
            targetPos = startPoint;
        } else if (distEnd < eraserThreshold && distEnd < distStart) {
            targetPos = endPoint;
        }

        if (targetPos) {
            updateEraserMarker(targetPos, true);
        } else {
            updateEraserMarker(null, false);
        }
    } else {
        updateEraserMarker(null, false);
    }

    if (isErasing) {
        // ERASER LOGIC
        if (!stringPoints || stringPoints.length === 0) return;

        const activeEraserThreshold = 1.5; // Distance to actually erase

        // HITBOX CHECK: Stop if eraser hits ANY bead directly
        let hitBead = false;

        if (beads && beads.length > 0) {
            for (const bead of beads) {
                if (bead) {
                    // Check distance from cursor (intersectPoint) to bead center
                    const beadPos = bead.position;
                    const dist = Math.sqrt(
                        Math.pow(intersectPoint.x - beadPos.x, 2) +
                        Math.pow(intersectPoint.z - beadPos.z, 2)
                    );

                    const beadSize = Math.max(bead.scale.x, bead.scale.y);

                    // If cursor is INSIDE the bead's footprint (with small margin)
                    if (dist < (beadSize / 2 + 0.2)) {
                        hitBead = true;
                        break;
                    }
                }
            }
        }

        if (hitBead) {
            // Eraser hit a bead -> STOP erasing
            return;
        }

        // Check Start
        if (stringPoints.length > 0) {
            const startDist = intersectPoint.distanceTo(stringPoints[0]);
            if (startDist < activeEraserThreshold) {
                // BEAD PROTECTION CHECK (Proximity to tip)
                const tip = stringPoints[0];
                let isSafeToErase = true;
                const protectionRadius = 0.8;

                if (beads && beads.length > 0) {
                    for (const bead of beads) {
                        if (bead) {
                            const beadSize = Math.max(bead.scale.x, bead.scale.y);
                            const dist = tip.distanceTo(bead.position);
                            if (dist < (beadSize / 2 + protectionRadius)) {
                                isSafeToErase = false;
                                break;
                            }
                        }
                    }
                }

                if (isSafeToErase) {
                    stringPoints.shift();
                    updateStringLine();
                }
            }
        }

        // Check End
        if (stringPoints.length > 0) {
            const endDist = intersectPoint.distanceTo(stringPoints[stringPoints.length - 1]);
            if (endDist < activeEraserThreshold) {
                // BEAD PROTECTION CHECK:
                const tip = stringPoints[stringPoints.length - 1];
                let isSafeToErase = true;
                const protectionRadius = 0.8;

                if (beads && beads.length > 0) {
                    for (const bead of beads) {
                        if (bead) {
                            const beadSize = Math.max(bead.scale.x, bead.scale.y);
                            const dist = tip.distanceTo(bead.position);
                            if (dist < (beadSize / 2 + protectionRadius)) {
                                isSafeToErase = false;
                                break;
                            }
                        }
                    }
                }

                if (isSafeToErase) {
                    stringPoints.pop();
                    updateStringLine();
                }
            }
        }
    } else if (isDrawingString) {

        // Normal Drawing Logic
        // We only add points if we are far enough from the last point to avoid clumping
        if (stringPoints.length > 0 && stringPoints[stringPoints.length - 1].distanceTo(intersectPoint) > 0.1) {
            stringPoints.push(intersectPoint.clone());
            updateStringLine();
        }

    } else if (isDragging && draggedBead) {
        // SMART DRAG (Walker Algorithm + Ghost Mode)

        // 1. Ensure we have path data
        if (!currentPathData) {
            currentPathData = calculatePathDataLocal();
        }

        if (currentPathData) {
            // 2. Find where the bead currently is on the path
            // We use the bead's CURRENT position as the starting point for the search
            // This ensures we "walk" from where we are, preventing teleports
            const currentDist = projectBeadToPathLocal(draggedBead.position, currentPathData);

            // 3. Solve for the new best position using local search (Hill Climbing)
            // This finds the point on the string closest to the mouse, but by walking along the string
            const newDist = solveClosestPointOnPathLocal(intersectPoint, currentDist, currentPathData);

            // 4. Update Bead Position
            const newPos = getPathPosLocal(currentPathData, newDist);
            draggedBead.position.copy(newPos);
            draggedBead.position.y = 0.1;

            // 5. Update Rotation (Existing Logic)
            const w = draggedBead.scale.x;
            const h = draggedBead.scale.y;
            const lookAhead = Math.max(w, h) * 0.4;

            const posFront = getPathPosLocal(currentPathData, newDist + lookAhead);
            const posBack = getPathPosLocal(currentPathData, newDist - lookAhead);

            const rdx = posFront.x - posBack.x;
            const rdz = posFront.z - posBack.z;

            if (rdx * rdx + rdz * rdz > 0.000001) {
                let rawAngle = -Math.atan2(rdz, rdx);
                let a1 = rawAngle;
                let a2 = rawAngle + Math.PI;

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

                if (h > w) {
                    finalAngle -= Math.PI / 2;
                }

                draggedBead.material.rotation = finalAngle;
                draggedBead.userData.rotation = Math.round((finalAngle * 180) / Math.PI) % 360;
            }

            // 6. GHOST MODE: Disable collision check during drag
            // if (checkBeadCollision(draggedBead, [draggedBead])) {
            //     draggedBead.position.copy(draggedBeadPreviousPosition);
            // } else {
            // Update metadata
            // We need to find the segment index for the new position to keep data consistent
            // projectBeadToPathLocal doesn't return segment index, but we can approximate or ignore it for now
            // since we re-calculate everything on save/load.
            // For now, just update position.
            draggedBeadPreviousPosition.copy(draggedBead.position);
            // }
        }
    }
}

/**
 * Mouse up event handler
 */
function onCanvasMouseUp(event) {
    currentPathData = null; // Clear temp data

    isErasing = false;
    // Keep marker visible if we are still in erase mode (just stopped clicking)
    // But if we exit mode, it will be hidden by loop or tool change logic
    // updateEraserMarker handled in move or tool exit

    let shouldSave = false;

    if (isEraseMode) {
        shouldSave = true;
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
                    console.log('❌ Click was not on canvas - letting document handlers handle it');
                    return;
                }

                console.log('🧠 No bead clicked in delete mode - checking if should deactivate...');

                // Don't deactivate during active 2-finger gestures OR recently ended gestures
                if (typeof touchGestureActive !== 'undefined' && touchGestureActive) {
                    console.log('❌ No deactivation - touch gesture active (pinch/zoom)');
                    return;
                }

                // Additional protection: don't deactivate if a 2-finger gesture recently ended
                if (typeof twoFingerGestureTimestamp !== 'undefined') {
                    const timeSinceTwoFingerGesture = Date.now() - twoFingerGestureTimestamp;
                    const twoFingerGestureCooldown = 30; // 30ms cooldown

                    if (timeSinceTwoFingerGesture < twoFingerGestureCooldown) {
                        console.log('❌ No deactivation - recent 2-finger gesture ended ' + timeSinceTwoFingerGesture + 'ms ago');
                        return;
                    }
                }

                // Raycast to check if click was on empty canvas space
                const planeIntersects = raycaster.intersectObject(plane);
                console.log('Canvas empty space check - plane intersects:', planeIntersects.length);

                if (planeIntersects.length > 0) {
                    // Clicked on empty canvas space - should deactivate
                    console.log('✅ CLICKED ON EMPTY CANVAS - DEACTIVATING DELETE MODE');
                    exitDeleteMode();
                    showDeleteModeDeactivatedToast();
                    console.log('🎉 Delete mode deactivated via canvas click');
                } else {
                    console.log('❌ Clicked outside canvas view - no action');
                }
            } else {
                hideRotationSlider();
            }
        }
    }

    if (isDrawingString && stringPoints.length > 0) {
        shouldSave = true;

        // Reset slider base to the new string geometry
        if (typeof window.resetSliderBase === 'function') {
            window.resetSliderBase();
        }

        // Automatically exit string mode after completing a drawing gesture
        exitStringMode();

        // Ensure string type is updated after drawing complete
        if (typeof updateStringType === 'function') {
            updateStringType();
        }
    }

    if (isDragging && hasDragged && draggedBead) {
        // SNAP ON RELEASE: Resolve collisions
        if (checkBeadCollision(draggedBead, [draggedBead])) {
            console.log('💥 Collision detected on release - finding nearest free space...');

            if (!currentPathData) {
                currentPathData = calculatePathDataLocal();
            }

            if (currentPathData) {
                const startDist = projectBeadToPathLocal(draggedBead.position, currentPathData);
                let searchDist = 0.1; // Start small
                const maxSearch = currentPathData.totalLength / 2;
                let found = false;

                while (searchDist < maxSearch) {
                    // Check forward
                    const fwdDist = startDist + searchDist;
                    const fwdPos = getPathPosLocal(currentPathData, fwdDist);
                    draggedBead.position.copy(fwdPos);
                    draggedBead.position.y = 0.1; // FIX: Ensure bead is above string
                    if (!checkBeadCollision(draggedBead, [draggedBead])) {
                        found = true;
                        break;
                    }

                    // Check backward
                    const bwdDist = startDist - searchDist;
                    const bwdPos = getPathPosLocal(currentPathData, bwdDist);
                    draggedBead.position.copy(bwdPos);
                    draggedBead.position.y = 0.1; // FIX: Ensure bead is above string
                    if (!checkBeadCollision(draggedBead, [draggedBead])) {
                        found = true;
                        break;
                    }

                    searchDist += 0.1;
                }

                if (found) {
                    console.log('✅ Found free space!');
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

// --- LOCAL HELPER FUNCTIONS (Ported from manualFit.js for isolation) ---

function calculatePathDataLocal() {
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

function getPathPosLocal(path, dist) {
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

function projectBeadToPathLocal(pos, path) {
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
 * Solves for the closest point on the path using local search (Hill Climbing).
 * This prevents teleporting across the center of loops.
 * @param {THREE.Vector3} targetPos - The mouse/finger position
 * @param {number} currentDist - Current distance along the path
 * @param {object} path - Path data object
 * @returns {number} - The new best distance along the path
 */
function solveClosestPointOnPathLocal(targetPos, currentDist, path) {
    let bestDist = currentDist;
    let bestScore = getPathPosLocal(path, currentDist).distanceTo(targetPos);

    // Step size for search (approx 1% of length to start)
    let step = path.totalLength * 0.01;
    const minStep = 0.001;
    const maxIter = 50;

    for (let i = 0; i < maxIter; i++) {
        // Check forward and backward
        const distFwd = bestDist + step;
        const distBwd = bestDist - step;

        const posFwd = getPathPosLocal(path, distFwd);
        const posBwd = getPathPosLocal(path, distBwd);

        const scoreFwd = posFwd.distanceTo(targetPos);
        const scoreBwd = posBwd.distanceTo(targetPos);

        if (scoreFwd < bestScore) {
            bestDist = distFwd;
            bestScore = scoreFwd;
        } else if (scoreBwd < bestScore) {
            bestDist = distBwd;
            bestScore = scoreBwd;
        } else {
            // If neither direction improves, reduce step size
            step *= 0.5;
            if (step < minStep) break;
        }
    }

    // Normalize result for closed paths
    if (path.isClosed) {
        bestDist = (bestDist % path.totalLength + path.totalLength) % path.totalLength;
    } else {
        bestDist = Math.max(0, Math.min(bestDist, path.totalLength));
    }

    return bestDist;
}