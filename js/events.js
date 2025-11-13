/*
    APPLICATION EVENTS MODULE
    Handles event listeners and event handlers
*/

/**
 * Adds all event listeners
 */
function addEventListeners() {
    const canvas = renderer.domElement;
    
    // Canvas interactions
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', onCanvasTouchEnd);

    // Window resize
    window.addEventListener('resize', onWindowResize);

    // Bottom toolbar buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
    
    document.getElementById('email-btn').addEventListener('click', openEmailModal);
    document.getElementById('reset-button').addEventListener('click', openResetMenu);
    document.getElementById('draw-string-btn').addEventListener('click', activateDrawStringTool);

    // FAB button
    document.getElementById('fab').addEventListener('click', toggleFAB);

    // Bead library panel
    document.getElementById('close-library-btn').addEventListener('click', closeBeadLibrary);
    document.getElementById('panel-backdrop').addEventListener('click', closeBeadLibrary);
    
    // String tool selection
    const stringTool = document.getElementById('string-tool');
    if (stringTool) {
        stringTool.addEventListener('click', selectStringTool);
    }

    // Rotation control
    const closeRotationBtn = document.getElementById('close-rotation-btn');
    if (closeRotationBtn) {
        closeRotationBtn.addEventListener('click', hideRotationControl);
    }

    // Document clicks for closing rotation control
    document.addEventListener('click', onDocumentClick);

    // Reset menu options
    document.getElementById('reset-all-btn').addEventListener('click', resetAll);
    document.getElementById('delete-objects-btn').addEventListener('click', deleteAllObjects);
    document.getElementById('delete-individual-btn').addEventListener('click', enterDeleteMode);
    
    // Email form
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendDesignEmail();
        });
    }
    
    // Language toggle (placeholder)
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const label = langToggle.querySelector('.lang-label');
            if (label.textContent === 'EN') {
                label.textContent = 'AR';
                console.log('🌐 Language changed to Arabic (functionality to be implemented)');
            } else {
                label.textContent = 'EN';
                console.log('🌐 Language changed to English (functionality to be implemented)');
            }
        });
    }
    
    // Saved toggle
    const savedToggle = document.getElementById('saved-toggle');
    if (savedToggle) {
        savedToggle.addEventListener('click', () => {
            console.log('💾 Saved button clicked - opening saved modal');
            openSavedModal();
            // Add visual feedback
            savedToggle.style.background = 'rgba(255, 255, 255, 0.4)';
            setTimeout(() => {
                savedToggle.style.background = 'rgba(255, 255, 255, 0.2)';
            }, 200);
        });
    }
    
    // Zoom controls
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    
    if (zoomInBtn) {
        console.log('Zoom in button found, setting up event listener');
        zoomInBtn.addEventListener('click', (e) => {
            console.log('Zoom in button clicked');
            e.preventDefault();
            e.stopPropagation();
            zoomIn();
        });
    } else {
        console.error('Zoom in button not found!');
    }
    
    if (zoomOutBtn) {
        console.log('Zoom out button found, setting up event listener');
        zoomOutBtn.addEventListener('click', (e) => {
            console.log('Zoom out button clicked');
            e.preventDefault();
            e.stopPropagation();
            zoomOut();
        });
    } else {
        console.error('Zoom out button not found!');
    }
}

/**
 * Toggle FAB menu (currently just opens library)
 */
function toggleFAB() {
    openBeadLibrary();
}

/**
 * Select string tool from panel
 */
function selectStringTool(event) {
    isStringMode = true;
    isSelectMode = false;
    controls.enabled = false;
    selectedObjectId = null;
    selectedSize = null;
    updateToolSelectionUI(event.currentTarget);
    updateFABIcon();
    hideRotationControl();
    updateSelectedBeadPreview();
    
    // Update FAB to show active state
    document.getElementById('fab').classList.add('active');
    
    // Update toolbar button state
    document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('draw-string-btn').classList.add('active');
    
    // Close library after selection
    closeBeadLibrary();
}

/**
 * Activate draw string tool from toolbar button (toggle on/off)
 */
function activateDrawStringTool() {
    const drawBtn = document.getElementById('draw-string-btn');
    
    if (isStringMode) {
        // If already in string mode, turn it off
        exitStringMode();
        return;
    }
    
    // Turn on string mode (auto-turns off after drawing gesture)
    isStringMode = true;
    isSelectMode = false;
    controls.enabled = false;
    selectedObjectId = null;
    selectedSize = null;
    hideRotationControl();
    updateFABIcon();
    updateSelectedBeadPreview();
    
    // Update button state
    document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
    drawBtn.classList.add('active');
    
    // Update FAB to show active state
    document.getElementById('fab').classList.add('active');
    
    // Show import presets button when string mode is active
    const importPresetsBtn = document.getElementById('import-presets-btn');
    if (importPresetsBtn) {
        importPresetsBtn.style.display = 'flex';
        // Add event listener for import presets button
        importPresetsBtn.addEventListener('click', () => {
            console.log('🎨 Import presets button clicked');
            openImportPresetsModal();
        });
    }
}

/**
 * Window resize handler
 */
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const aspect = container.clientWidth / container.clientHeight;
    const currentZoom = camera.zoom; // Preserve zoom level
    
    camera.left = -10 * aspect;
    camera.right = 10 * aspect;
    camera.top = 10;
    camera.bottom = -10;
    camera.zoom = currentZoom; // Restore zoom level
    camera.updateProjectionMatrix();
    
    renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Zoom in - moves camera closer to the scene
 */
function zoomIn() {
    console.log('Zoom in function called');
    
    if (typeof camera === 'undefined' || camera === null) {
        console.error('Camera not available');
        return;
    }
    
    if (typeof controls === 'undefined' || controls === null) {
        console.error('Controls not available');
        return;
    }
    
    try {
        // Enable controls temporarily for zoom operation
        const wasEnabled = controls.enabled;
        controls.enabled = true;
        
        // Method 1: Try dollyIn if available
        if (typeof controls.dollyIn === 'function') {
            console.log('Using dollyIn method');
            controls.dollyIn(1.2);
        } else {
            // Method 2: Direct camera zoom modification for OrthographicCamera
            console.log('Using direct camera zoom modification');
            camera.zoom = Math.min(camera.zoom * 1.2, 5); // Zoom in by 20%, max zoom 5x
            camera.updateProjectionMatrix();
        }
        
        controls.update();
        controls.enabled = wasEnabled; // Restore original state
        
        console.log('Zoom in completed successfully, camera.zoom:', camera.zoom);
    } catch (error) {
        console.error('Zoom in error:', error);
    }
}

/**
 * Zoom out - moves camera farther from the scene  
 */
function zoomOut() {
    console.log('Zoom out function called');
    
    if (typeof camera === 'undefined' || camera === null) {
        console.error('Camera not available');
        return;
    }
    
    if (typeof controls === 'undefined' || controls === null) {
        console.error('Controls not available');
        return;
    }
    
    try {
        // Enable controls temporarily for zoom operation
        const wasEnabled = controls.enabled;
        controls.enabled = true;
        
        // Method 1: Try dollyOut if available
        if (typeof controls.dollyOut === 'function') {
            console.log('Using dollyOut method');
            controls.dollyOut(1.2);
        } else {
            // Method 2: Direct camera zoom modification for OrthographicCamera
            console.log('Using direct camera zoom modification');
            camera.zoom = Math.max(camera.zoom / 1.2, 0.5); // Zoom out by 20%, min zoom 0.5x
            camera.updateProjectionMatrix();
        }
        
        controls.update();
        controls.enabled = wasEnabled; // Restore original state
        
        console.log('Zoom out completed successfully, camera.zoom:', camera.zoom);
    } catch (error) {
        console.error('Zoom out error:', error);
    }
}