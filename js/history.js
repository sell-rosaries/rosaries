/*
    UNDO/REDO SYSTEM
    State capture and history management
*/

function captureState() {
    return {
        stringScale: window.currentStringScale || 0, // Save current string scale
        stringPoints: stringPoints.map(p => {
            // Handle both THREE.Vector3 objects and plain objects
            if (p.clone && typeof p.clone === 'function') {
                return p.clone();
            } else {
                // For plain objects, create a new object with the same properties
                return { x: p.x || 0, y: p.y || 0, z: p.z || 0 };
            }
        }),
        beads: beads.map(bead => ({
            position: bead.position.clone(),
            scale: bead.scale.clone(),
            userData: JSON.parse(JSON.stringify(bead.userData)),
            configId: bead.userData.id,
            imageUrl: bead.material.map ? bead.material.map.image.src : null
        }))
    };
}

function saveState() {
    history = history.slice(0, historyIndex + 1);
    history.push(captureState());
    
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }
    
    updateUndoRedoButtons();
    
    // Auto-save the design after each state change
    autoSaveDesign();
}

function restoreState(state) {
    beads.forEach(bead => scene.remove(bead));
    beads = [];
    
    stringPoints = state.stringPoints.map(p => {
        // Handle both THREE.Vector3 objects and plain objects
        if (p.clone && typeof p.clone === 'function') {
            return p.clone();
        } else {
            // For plain objects, create a new object with the same properties
            return { x: p.x || 0, y: p.y || 0, z: p.z || 0 };
        }
    });
    updateStringLine();
    
    // Restore string scale and slider UI
    if (typeof window.restoreSliderState === 'function' && state.stringScale !== undefined) {
        window.restoreSliderState(state.stringScale);
    } else if (typeof window.resetSliderBase === 'function') {
        // Fallback for legacy history states
        window.resetSliderBase();
    }
    
    state.beads.forEach(beadData => {
        const obj = getObjectById(beadData.userData.objectId);
        if (obj) {
            createBead(obj, beadData.userData.size, (bead) => {
                bead.position.copy(beadData.position);
                bead.scale.copy(beadData.scale);
                bead.userData = JSON.parse(JSON.stringify(beadData.userData));
                
                if (beadData.userData.rotation) {
                    const radians = (beadData.userData.rotation * Math.PI) / 180;
                    bead.material.rotation = radians;
                }
                
                scene.add(bead);
                beads.push(bead);
            });
        }
    });
    
    updateBeadCount();
    
    if (isDeleteMode) {
        showDeleteMarkers();
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState(history[historyIndex]);
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreState(history[historyIndex]);
        updateUndoRedoButtons();
    }
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
}
