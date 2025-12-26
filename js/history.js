/*
    UNDO/REDO SYSTEM
    State capture and history management
*/

function captureState() {
    return {
        stringScale: window.currentStringScale || 0, // Save current string scale
        stringPaths: stringPaths.map(path => path.map(p => ({ x: p.x, y: p.y, z: p.z }))),
        stringPoints: stringPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
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

    // Restore string paths
    if (state.stringPaths) {
        stringPaths = state.stringPaths.map(path => path.map(p => new THREE.Vector3(p.x, p.y, p.z)));
    } else if (state.stringPoints) {
        // Legacy support
        stringPaths = [state.stringPoints.map(p => new THREE.Vector3(p.x, p.y, p.z))];
    }

    stringPoints = (state.stringPoints || []).map(p => new THREE.Vector3(p.x, p.y, p.z));

    updateStringLine();

    // Restore string scale and slider UI
    if (typeof window.restoreSliderState === 'function' && state.stringScale !== undefined) {
        window.restoreSliderState(state.stringScale);
    } else if (typeof window.resetSliderBase === 'function') {
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
