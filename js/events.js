/*
    APPLICATION EVENTS MODULE
    Handles event listeners and event handlers
*/

// Global click handler for auto-exiting string/eraser mode
document.addEventListener('click', (event) => {
    if (!isStringMode && !isEraseMode) return;

    const target = event.target;

    // List of elements that SHOULD NOT trigger exit
    // 1. The canvas (drawing)
    if (target.tagName === 'CANVAS') return;

    // 2. The Draw String Button and its children
    if (target.closest('#draw-string-btn')) return;

    // 3. The Pen Options Menu and its children
    if (target.closest('#pen-options-menu')) return;

    // 4. The Import Presets Button (part of string mode)
    if (target.closest('#import-presets-btn')) return;

    // If we clicked anywhere else (e.g., other toolbar buttons, empty space outside canvas, etc.)
    // Exit String Mode (which also exits Eraser Mode)

    exitStringMode();
}, true); // Use capture phase to handle it before other specific handlers if needed

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

    // Pen Options
    const eraserBtn = document.getElementById('eraser-btn');
    if (eraserBtn) {
        eraserBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering other clicks
            activateEraserTool();
        });
    }

    // Smart Pen (Placeholder) - Removed


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

    // Language toggle is handled by language.js

    // Saved toggle
    const savedToggle = document.getElementById('saved-toggle');
    if (savedToggle) {
        savedToggle.addEventListener('click', () => {

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

        zoomInBtn.addEventListener('click', (e) => {

            e.preventDefault();
            e.stopPropagation();
            zoomIn();
        });
    } else {
        console.error('Zoom in button not found!');
    }

    if (zoomOutBtn) {

        zoomOutBtn.addEventListener('click', (e) => {

            e.preventDefault();
            e.stopPropagation();
            zoomOut();
        });
    } else {
        console.error('Zoom out button not found!');
    }

    // Magic button
    const magicBtn = document.getElementById('magic-btn');
    if (magicBtn) {
        magicBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            activateMagicCorrection();
        });
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

    // Refresh bead selection UI
    createBeadSelection();

    // Hide magic button
    if (typeof updateMagicButtonVisibility === 'function') {
        updateMagicButtonVisibility();
    }
    // Update generate button
    if (typeof updateGenerateButtonVisibility === 'function') {
        updateGenerateButtonVisibility();
    }
}

/**
 * Activate draw string tool from toolbar button (toggle on/off)
 */
function activateDrawStringTool() {
    const drawBtn = document.getElementById('draw-string-btn');
    const menu = document.getElementById('pen-options-menu');

    // Trigger Pulse Animation
    drawBtn.classList.remove('btn-pulse');
    void drawBtn.offsetWidth; // Trigger reflow
    drawBtn.classList.add('btn-pulse');
    setTimeout(() => drawBtn.classList.remove('btn-pulse'), 400);

    // If in Eraser Mode, clicking the button exits Eraser Mode
    if (isEraseMode) {
        exitEraserMode();
        // We are now in normal String Mode
        return;
    }

    // Logic for Normal Pen Button Click
    if (isStringMode) {
        // Toggle OFF if already on. 
        // We ignore the menu state here to ensure consistent "Click -> Off" behavior.
        exitStringMode();
        // Explicitly remove active class and blur to fix persistent visual state
        drawBtn.classList.remove('active');
        drawBtn.blur();
        return;
    }

    // Turn on string mode
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

    // Show Menu
    if (menu) menu.classList.add('active');

    // Update FAB to show active state
    document.getElementById('fab').classList.add('active');

    // Show import presets button when string mode is active
    const importPresetsBtn = document.getElementById('import-presets-btn');
    if (importPresetsBtn) {
        importPresetsBtn.style.display = 'flex';
        // Add event listener for import presets button
        importPresetsBtn.addEventListener('click', () => {

            openImportPresetsModal();
        });
    }

    // Show magic button if enabled
    if (typeof updateMagicButtonVisibility === 'function') {
        updateMagicButtonVisibility();
    }
    // Show generate button if enabled
    if (typeof updateGenerateButtonVisibility === 'function') {
        updateGenerateButtonVisibility();
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

            controls.dollyIn(1.2);
        } else {
            // Method 2: Direct camera zoom modification for OrthographicCamera

            camera.zoom = Math.min(camera.zoom * 1.2, 500); // Zoom in by 20%, max zoom 500x
            camera.updateProjectionMatrix();
        }

        controls.update();
        controls.enabled = wasEnabled; // Restore original state


    } catch (error) {
        console.error('Zoom in error:', error);
    }
}

/**
 * Zoom out - moves camera farther from the scene  
 */
function zoomOut() {


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

            controls.dollyOut(1.2);
        } else {
            // Method 2: Direct camera zoom modification for OrthographicCamera

            camera.zoom = Math.max(camera.zoom / 1.2, 0.001); // Zoom out by 20%, min zoom 0.001x
            camera.updateProjectionMatrix();
        }

        controls.update();
        controls.enabled = wasEnabled; // Restore original state


    } catch (error) {
        console.error('Zoom out error:', error);
    }
}