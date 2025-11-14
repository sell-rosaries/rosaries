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
    // Show confirmation dialog before reset
    showResetConfirmation();
}

function showResetConfirmation() {
    // Create confirmation modal dynamically
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal active';
    confirmModal.id = 'reset-confirm-modal';
    
    confirmModal.innerHTML = `
        <div class="modal-backdrop" onclick="closeResetConfirmation()"></div>
        <div class="modal-content modal-compact">
            <div class="modal-header-flex">
                <button class="btn-close-modal-flex" onclick="closeResetConfirmation()" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <div class="modal-icon" style="text-align: center; margin-bottom: var(--space-4);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--error);">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
            
            <h3 style="text-align: center; color: var(--error);">${getTranslation('reset-all-confirm-title')}</h3>
            <p class="modal-subtitle">${getTranslation('reset-all-confirm-message-1')}<br>${getTranslation('reset-all-confirm-message-2')}</p>
            
            <div class="modal-actions">
                <button class="btn-primary" id="confirm-reset-btn" style="background: var(--error);">
                    ${getTranslation('confirm-reset')}
                </button>
                <button class="btn-secondary" onclick="closeResetConfirmation()">
                    ${getTranslation('cancel')}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
    
    // Add event listener to confirm button
    document.getElementById('confirm-reset-btn').addEventListener('click', () => {
        performResetAll();
        closeResetConfirmation();
    });
}

function closeResetConfirmation() {
    const confirmModal = document.getElementById('reset-confirm-modal');
    if (confirmModal) {
        confirmModal.remove();
    }
}

function performResetAll() {
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
