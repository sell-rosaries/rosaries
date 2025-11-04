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
    
    // Close library after selection
    closeBeadLibrary();
}
