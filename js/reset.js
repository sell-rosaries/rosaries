/*
    RESET & DELETE FUNCTIONALITY
    Reset menu and delete modes
*/

function openResetMenu() {
    document.getElementById('reset-menu').classList.add('active');
}

function closeResetMenu() {
    document.getElementById('reset-menu').classList.remove('active');
}

function closeResetMenuOnBackdrop(event) {
    if (event.target.id === 'reset-menu') {
        closeResetMenu();
    }
}

function resetAll() {
    beads.forEach(bead => scene.remove(bead));
    beads = [];
    if (stringLine) {
        scene.remove(stringLine);
        stringLine = null;
    }
    stringPoints = [];
    updateBeadCount();
    hideRotationControl();
    exitDeleteMode();
    closeResetMenu();
    saveState();
}

function deleteAllObjects() {
    beads.forEach(bead => scene.remove(bead));
    beads = [];
    updateBeadCount();
    hideRotationControl();
    exitDeleteMode();
    closeResetMenu();
    saveState();
}

function createDeleteMarkerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(98, 98);
    ctx.moveTo(98, 30);
    ctx.lineTo(30, 98);
    ctx.stroke();
    
    return new THREE.CanvasTexture(canvas);
}

function showDeleteMarkers() {
    removeDeleteMarkers();
    
    const xTexture = createDeleteMarkerTexture();
    
    beads.forEach(bead => {
        const markerSize = Math.min(bead.scale.x, bead.scale.y) * 0.25;
        const material = new THREE.SpriteMaterial({ 
            map: xTexture, 
            transparent: true,
            depthTest: false
        });
        const marker = new THREE.Sprite(material);
        marker.scale.set(markerSize, markerSize, 1);
        marker.position.copy(bead.position);
        marker.position.y = 0.2;
        marker.userData.parentBead = bead;
        
        scene.add(marker);
        deleteMarkers.push(marker);
    });
}

function removeDeleteMarkers() {
    deleteMarkers.forEach(marker => {
        scene.remove(marker);
        if (marker.material.map) {
            marker.material.map.dispose();
        }
        marker.material.dispose();
    });
    deleteMarkers = [];
}

function enterDeleteMode() {
    isDeleteMode = true;
    document.body.classList.add('delete-mode');
    closeResetMenu();
    hideRotationControl();
    
    showDeleteMarkers();
    
    // Ensure we're in select mode for clicking beads
    if (!isSelectMode) {
        isSelectMode = true;
        isStringMode = false;
        controls.enabled = true;
        selectedObjectId = null;
        selectedSize = null;
        updateSelectedBeadPreview(); // Clear preview
    }
}

function exitDeleteMode() {
    isDeleteMode = false;
    document.body.classList.remove('delete-mode');
    removeDeleteMarkers();
}

function deleteIndividualBead(bead) {
    const index = beads.indexOf(bead);
    if (index > -1) {
        beads.splice(index, 1);
        scene.remove(bead);
        
        const markerIndex = deleteMarkers.findIndex(m => m.userData.parentBead === bead);
        if (markerIndex > -1) {
            const marker = deleteMarkers[markerIndex];
            scene.remove(marker);
            if (marker.material.map) {
                marker.material.map.dispose();
            }
            marker.material.dispose();
            deleteMarkers.splice(markerIndex, 1);
        }
        
        updateBeadCount();
        
        if (beads.length === 0) {
            exitDeleteMode();
        }
    }
}
