/*
    TOOL SELECTION
    String tool and bead selection
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

    // Update FAB to show active state
    const fab = document.getElementById('fab');
    if (fab) {
        fab.classList.add('active');
    }

    // Show import presets button when string mode is active
    const importPresetsBtn = document.getElementById('import-presets-btn');
    if (importPresetsBtn) {
        importPresetsBtn.style.display = 'flex';
    }

    // Close library after selection
    closeBeadLibrary();

    if (typeof updateMagicButtonVisibility === 'function') {
        updateMagicButtonVisibility();
    }
    if (typeof updateGenerateButtonVisibility === 'function') {
        updateGenerateButtonVisibility();
    }
}

function activateEraserTool() {
    isEraseMode = true;
    isStringMode = true; // Eraser operates on the string
    isSelectMode = false;

    // Update UI
    const drawBtn = document.getElementById('draw-string-btn');
    const normalIcon = drawBtn.querySelector('.draw-icon-normal');
    const eraserIcon = drawBtn.querySelector('.draw-icon-eraser');
    const eraserBtn = document.getElementById('eraser-btn');

    if (normalIcon) normalIcon.style.display = 'none';
    if (eraserIcon) eraserIcon.style.display = 'block';
    if (eraserBtn) eraserBtn.classList.add('active');

    // Hide menu
    const menu = document.getElementById('pen-options-menu');
    if (menu) menu.classList.remove('active');

    // Show Wand - centered on current view
    if (typeof showEraserWand === 'function') {
        // Calculate starting position using controls.target for centered activation
        const startPosition = controls.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0);
        showEraserWand(startPosition);
    }

    // Cursor update (handled in mouse interactions and below)
    updateEraserCursor();

    // Hide magic button in eraser mode
    if (typeof updateMagicButtonVisibility === 'function') {
        updateMagicButtonVisibility();
    }
    // Update generate button
    if (typeof updateGenerateButtonVisibility === 'function') {
        updateGenerateButtonVisibility();
    }
}

function updateEraserCursor() {
    // Simple cursor update
    document.body.style.cursor = 'grab'; // Indicates draggable
}

function exitEraserMode() {
    isEraseMode = false;

    // User requested: "when i click on ereser button again to desable it... nothing sould get enabled."
    // This means we should exit string mode entirely and go back to default (select/pan).
    isStringMode = false;
    isSelectMode = true;
    controls.enabled = true;

    // Update UI
    const drawBtn = document.getElementById('draw-string-btn');
    const normalIcon = drawBtn.querySelector('.draw-icon-normal');
    const eraserIcon = drawBtn.querySelector('.draw-icon-eraser');
    const eraserBtn = document.getElementById('eraser-btn');

    if (normalIcon) normalIcon.style.display = 'block';
    if (eraserIcon) eraserIcon.style.display = 'none';
    if (eraserBtn) eraserBtn.classList.remove('active');

    // Also reset the main draw button state since we are exiting string mode
    if (drawBtn) drawBtn.classList.remove('active');
    const fab = document.getElementById('fab');
    if (fab) fab.classList.remove('active');

    // Force hide menu
    const menu = document.getElementById('pen-options-menu');
    if (menu) menu.classList.remove('active');

    // Hide import presets button
    const importPresetsBtn = document.getElementById('import-presets-btn');
    if (importPresetsBtn) {
        importPresetsBtn.style.display = 'none';
    }

    document.body.style.cursor = 'auto';

    // Hide marker / Wand
    if (typeof updateEraserMarker === 'function') {
        updateEraserMarker(null, false);
    }
    if (typeof hideEraserWand === 'function') {
        hideEraserWand();
    }

    // Update magic button visibility
    if (typeof updateMagicButtonVisibility === 'function') {
        updateMagicButtonVisibility();
    }
    // Update generate button visibility
    if (typeof updateGenerateButtonVisibility === 'function') {
        updateGenerateButtonVisibility();
    }
}

function exitStringMode() {
    // General exit function
    isStringMode = false;
    isSelectMode = true;
    controls.enabled = true;

    // Force reset icons to ensure Normal Pen is shown when deactivated
    const drawBtn = document.getElementById('draw-string-btn');
    if (drawBtn) {
        const normalIcon = drawBtn.querySelector('.draw-icon-normal');
        const eraserIcon = drawBtn.querySelector('.draw-icon-eraser');
        const eraserBtn = document.getElementById('eraser-btn');

        if (normalIcon) normalIcon.style.display = 'block';
        if (eraserIcon) eraserIcon.style.display = 'none';
        if (eraserBtn) eraserBtn.classList.remove('active');

        drawBtn.classList.remove('active');
        drawBtn.blur(); // Remove focus
    }

    if (isEraseMode) {
        exitEraserMode();
    }

    const menu = document.getElementById('pen-options-menu');
    if (menu) menu.classList.remove('active');

    // Update FAB
    const fab = document.getElementById('fab');
    if (fab) fab.classList.remove('active');

    // Hide import presets button
    const importPresetsBtn = document.getElementById('import-presets-btn');
    if (importPresetsBtn) {
        importPresetsBtn.style.display = 'none';
    }

    // Refresh bead selection UI
    createBeadSelection();

    // Update magic button visibility
    if (typeof updateMagicButtonVisibility === 'function') {
        updateMagicButtonVisibility();
    }
    // Update generate button visibility
    if (typeof updateGenerateButtonVisibility === 'function') {
        updateGenerateButtonVisibility();
    }
}
