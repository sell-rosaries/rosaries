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
}

function exitStringMode() {
    isStringMode = false;
    isSelectMode = true;
    controls.enabled = true;
    
    // Update UI to reflect the change
    updateToolSelectionUI(null);
    updateFABIcon();
    
    // Remove active state from FAB
    const fab = document.getElementById('fab');
    if (fab) {
        fab.classList.remove('active');
    }
    
    // Remove active state from draw string button
    const drawStringBtn = document.getElementById('draw-string-btn');
    if (drawStringBtn) {
        drawStringBtn.classList.remove('active');
    }
    
    // Hide import presets button when string mode is deactivated
    const importPresetsBtn = document.getElementById('import-presets-btn');
    if (importPresetsBtn) {
        importPresetsBtn.style.display = 'none';
    }
    
    // Refresh bead selection UI to update tool states
    createBeadSelection();
}
