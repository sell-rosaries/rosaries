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

/**
 * Mouse down event handler
 */
function onCanvasMouseDown(event) {
    const coords = getNormalizedCoords(event);
    mouse.x = coords.x;
    mouse.y = coords.y;
    mouseDownPosition = { x: coords.x, y: coords.y };
    hasDragged = false;
    raycaster.setFromCamera(mouse, camera);

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
            
            if (checkBeadCollision(draggedBead, [draggedBead])) {
                draggedBead.position.copy(draggedBeadPreviousPosition);
            } else {
                draggedBead.userData.stringAngle = stringInfo.angle;
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
                exitDeleteMode();
            } else {
                hideRotationSlider();
            }
        }
    }
    
    if (isDrawingString && stringPoints.length > 0) {
        shouldSave = true;
        // Automatically exit string mode after completing a drawing gesture
        exitStringMode();
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