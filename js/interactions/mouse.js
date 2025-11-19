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

/**
 * Mouse down event handler
 */
function onCanvasMouseDown(event) {
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
    if (!isDragging && !isDrawingString) return;

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

    if (isDrawingString) {
        if (stringPoints.length > 0 && stringPoints[stringPoints.length - 1].distanceTo(intersectPoint) > 0.1) {
            stringPoints.push(intersectPoint.clone());
            updateStringLine();
        }
    } else if (isDragging && draggedBead) {
        const stringInfo = findClosestPointOnString(intersectPoint);
        if (stringInfo) {
            draggedBead.position.copy(stringInfo.position);
            draggedBead.position.y = 0.1;
            
            // SMART ROTATION (Manual Drag - Exact Path Match)
            // Lazily generate path data if missing
            if (!currentPathData) {
                currentPathData = calculatePathDataLocal();
            }
            
            let newAngle = 0;
            let rotationCalculated = false;
            
            if (currentPathData) {
                const w = draggedBead.scale.x;
                const h = draggedBead.scale.y;
                const lookAhead = Math.max(w, h) * 0.4;
                
                // 1. Find where we are on the path (Project position to path distance)
                const dist = projectBeadToPathLocal(draggedBead.position, currentPathData);
                
                // 2. Sample ahead/behind
                const posFront = getPathPosLocal(currentPathData, dist + lookAhead);
                const posBack = getPathPosLocal(currentPathData, dist - lookAhead);
                
                const rdx = posFront.x - posBack.x;
                const rdz = posFront.z - posBack.z;
                
                // 3. Calc Angle
                // Use "Head Up" Logic: Closest to Rotation 0 (World Up)
                if (rdx*rdx + rdz*rdz > 0.000001) {
                    let rawAngle = -Math.atan2(rdz, rdx);
                    
                    // Two possible orientations (180 apart)
                    let a1 = rawAngle;
                    let a2 = rawAngle + Math.PI;
                    
                    // Apply Tube Fix temp to find actual visual rotation
                    let checkA1 = a1;
                    let checkA2 = a2;
                    if (h > w) {
                         checkA1 -= Math.PI / 2;
                         checkA2 -= Math.PI / 2;
                    }
                    
                    // Normalize angles to -PI..PI
                    const norm = (a) => {
                        a = a % (2 * Math.PI);
                        if (a > Math.PI) a -= 2 * Math.PI;
                        if (a < -Math.PI) a += 2 * Math.PI;
                        return a;
                    };
                    
                    // Check distance to 0 (Up)
                    // We want the rotation that keeps the bead most "Upright"
                    const dist1 = Math.abs(norm(checkA1));
                    const dist2 = Math.abs(norm(checkA2));
                    
                    // Pick the one closer to 0
                    let finalAngle = (dist1 < dist2) ? a1 : a2;
                    
                    // Apply Tube Fix permanently
                    if (h > w) {
                        finalAngle -= Math.PI / 2;
                    }
                    
                    draggedBead.material.rotation = finalAngle;
                    // Sync userData for UI consistency
                    draggedBead.userData.rotation = Math.round((finalAngle * 180) / Math.PI) % 360;
                }
            }
            
            if (checkBeadCollision(draggedBead, [draggedBead])) {
                draggedBead.position.copy(draggedBeadPreviousPosition);
            } else {
                // userData.stringAngle is legacy? Keep it just in case other systems read it.
                if (rotationCalculated) draggedBead.userData.stringAngle = newAngle; 
                draggedBead.userData.segmentIndex = stringInfo.segmentIndex;
                draggedBead.userData.t = stringInfo.t;
                draggedBeadPreviousPosition.copy(draggedBead.position);
            }
        } else {
            draggedBead.position.copy(draggedBeadPreviousPosition);
        }
    }
}

/**
 * Mouse up event handler
 */
function onCanvasMouseUp(event) {
    currentPathData = null; // Clear temp data

    let shouldSave = false;
    
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
        const p2 = stringPoints[i+1];
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