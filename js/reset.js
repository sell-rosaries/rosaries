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
    beads.forEach(bead => {
        if (bead.material) bead.material.dispose();
        if (bead.geometry) bead.geometry.dispose();
        scene.remove(bead);
    });
    beads = [];

    // Clear legacy stringLine
    if (stringLine) {
        if (stringLine.geometry) stringLine.geometry.dispose();
        if (stringLine.material) stringLine.material.dispose();
        scene.remove(stringLine);
        stringLine = null;
    }
    stringPoints = [];

    // NEW: Clear multi-string paths and meshes
    if (typeof stringMeshes !== 'undefined') {
        stringMeshes.forEach(mesh => {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        stringMeshes.length = 0;
    }
    if (typeof stringPaths !== 'undefined') {
        stringPaths.length = 0;
    }

    // Reset string tracking when everything is cleared
    if (typeof resetStringTracking === 'function') {
        resetStringTracking();
    }

    // Reset slider state
    if (typeof window.resetSliderBase === 'function') {
        window.resetSliderBase();
    } else {
        window.currentStringScale = 0;
    }

    updateBeadCount();
    hideRotationControl();
    exitDeleteMode();
    closeResetMenu();
    saveState();

    // Reset Camera and Controls to default state (Fix for zoom persistence)
    if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
        // Reset Camera Position (Default from scene.js)
        camera.position.set(0, 100, 0);
        camera.zoom = 1;
        camera.updateProjectionMatrix();

        // Reset Controls Target (Pan)
        controls.target.set(0, 0, 0);
        controls.update();


    }

    // Force render to flush state
    if (typeof renderer !== 'undefined' && renderer) {
        renderer.render(scene, camera);
    }
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

    // Show toast notification with instruction
    showDeleteModeToast();

    // Set up enhanced click and touch tracking for delete mode
    setupDeleteModeEventListeners();

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


    // Clean up delete mode event listeners
    cleanupDeleteModeEventListeners();

    // Reset touch tracking
    touchGestureActive = false;
    touchCount = 0;
    twoFingerGestureTimestamp = 0;


}

function showDeleteModeToast() {
    // Create temporary instruction message
    const existingMessage = document.querySelector('.delete-mode-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'delete-mode-message';
    messageEl.innerHTML = `
        <div style="text-align: center;">
            <div>${window.getTranslation('delete-mode-click-space') || 'Click on an empty space'}</div>
            <div style="font-size: 14px; opacity: 0.9;">${window.getTranslation('delete-mode-to-deactivate') || 'to deactivate!'}</div>
        </div>
    `;
    messageEl.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(34, 197, 94, 0.98);
        color: white;
        padding: var(--space-3) var(--space-6);
        border-radius: var(--radius-md);
        font-size: var(--font-size-body-sm);
        font-weight: var(--weight-semibold);
        z-index: 1000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        animation: delete-mode-message-slide 3s ease-in-out forwards;
        max-width: 90vw;
        text-align: center;
        border: 2px solid rgba(255, 255, 255, 0.3);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    `;

    // Add animation keyframes
    if (!document.querySelector('#delete-mode-message-styles')) {
        const style = document.createElement('style');
        style.id = 'delete-mode-message-styles';
        style.textContent = `
            @keyframes delete-mode-message-slide {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(messageEl);

    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
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

// Make the function globally available
window.showDeleteModeToast = showDeleteModeToast;

/**
 * TRACK TOUCH GESTURES TO PREVENT ACCIDENTAL DEACTIVATION
 * Updates touch tracking for multi-touch gestures
 */
function trackTouchGestures(event) {
    if (event.type === 'touchstart') {
        touchCount = event.touches.length;
        if (touchCount === 2) {
            touchGestureActive = true;
            twoFingerGestureTimestamp = Date.now(); // Track only 2-finger gestures
        }
    } else if (event.type === 'touchend' || event.type === 'touchcancel') {
        touchCount = Math.max(0, touchCount - event.changedTouches.length);
        if (touchCount < 2) {
            touchGestureActive = false;
            twoFingerGestureTimestamp = Date.now(); // Reset only after 2-finger gesture ends
        }
    }
}

/**
 * CHECK IF CLICK TARGET SHOULD DEACTIVATE DELETE MODE
 * Returns true if we should deactivate, false if we should not
 * User wants deactivation everywhere EXCEPT: beads, zoom buttons (+/-), zoom instruction text
 */
function shouldDeactivateDeleteMode(target, event) {
    // Don't deactivate during active 2-finger gestures
    if (typeof touchGestureActive !== 'undefined' && touchGestureActive) {

        return false;
    }

    // Never deactivate when clicking zoom buttons (+/-)
    if (target.closest('#zoom-in-btn') || target.closest('#zoom-out-btn')) {

        return false;
    }

    // Don't deactivate when clicking zoom controls container or nearby instruction areas
    if (target.closest('#canvas-zoom-controls') || target.closest('#canvas-info')) {

        return false;
    }

    // Check if this is a click within the canvas container
    if (target.closest('#canvas-container')) {
        const canvas = document.querySelector('#canvas-container canvas');

        if (canvas && typeof mouse !== 'undefined' && typeof raycaster !== 'undefined' && typeof beads !== 'undefined') {
            // This is a canvas click - check if it hit a bead using raycasting

            const coords = getNormalizedCoords(event);
            mouse.x = coords.x;
            mouse.y = coords.y;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(beads);


            if (intersects.length > 0) {

                return false;
            } else {
                // Additional protection for canvas clicks only: don't deactivate if a 2-finger gesture recently ended
                if (typeof twoFingerGestureTimestamp !== 'undefined') {
                    const timeSinceTwoFingerGesture = Date.now() - twoFingerGestureTimestamp;
                    const twoFingerGestureCooldown = 30; // 30ms cooldown

                    if (timeSinceTwoFingerGesture < twoFingerGestureCooldown) {

                        return false;
                    }
                }


                return true;
            }
        } else {
            // Clicked in canvas container but no canvas element found - deactivate

            return true;
        }
    }


    // For all other clicks (menus, toolbars, empty space, etc.) - DEACTIVATE
    return true;
}

/**
 * HANDLE DELETE MODE CLICK DETECTION
 * Enhanced click handler for delete mode that works properly
 */
function handleDeleteModeClick(event) {
    if (!isDeleteMode) {

        return;
    }

    const target = event.target;






    // Check if we should deactivate based on click target and event
    const shouldDeactivate = shouldDeactivateDeleteMode(target, event);


    if (shouldDeactivate) {


        exitDeleteMode();


        showDeleteModeDeactivatedToast();

    } else {

    }

}

/**
 * SHOW DELETE MODE DEACTIVATED TOAST
 * Toast message when delete mode is deactivated
 */
function showDeleteModeDeactivatedToast() {
    const existingMessage = document.querySelector('.delete-mode-deactivated-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'delete-mode-deactivated-message';
    messageEl.innerHTML = `
        <div style="text-align: center;">
            <div>${window.getTranslation('delete-mode-deactivated') || 'Delete mode deactivated'}</div>
        </div>
    `;
    messageEl.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(239, 68, 68, 0.98);
        color: white;
        padding: var(--space-3) var(--space-6);
        border-radius: var(--radius-md);
        font-size: var(--font-size-body-sm);
        font-weight: var(--weight-semibold);
        z-index: 1000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        animation: delete-mode-deactivated-slide 3s ease-in-out forwards;
        max-width: 90vw;
        text-align: center;
        border: 2px solid rgba(255, 255, 255, 0.3);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    `;

    // Add animation keyframes if not present
    if (!document.querySelector('#delete-mode-deactivated-styles')) {
        const style = document.createElement('style');
        style.id = 'delete-mode-deactivated-styles';
        style.textContent = `
            @keyframes delete-mode-deactivated-slide {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(messageEl);

    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}


/**
 * SET UP ENHANCED EVENT LISTENERS FOR DELETE MODE
 */
function setupDeleteModeEventListeners() {
    // Add document-level click detection for better target analysis
    document.addEventListener("click", handleDeleteModeClick, true);

    // Add touch tracking to prevent accidental deactivation during gestures
    document.addEventListener("touchstart", trackTouchGestures, { passive: false });
    document.addEventListener("touchend", trackTouchGestures, { passive: false });
    document.addEventListener("touchcancel", trackTouchGestures, { passive: false });
}

/**
 * CLEAN UP DELETE MODE EVENT LISTENERS
 */
function cleanupDeleteModeEventListeners() {
    // Remove document-level click detection
    document.removeEventListener("click", handleDeleteModeClick, true);

    // Remove touch tracking listeners
    document.removeEventListener("touchstart", trackTouchGestures, { passive: false });
    document.removeEventListener("touchend", trackTouchGestures, { passive: false });
    document.removeEventListener("touchcancel", trackTouchGestures, { passive: false });
}
