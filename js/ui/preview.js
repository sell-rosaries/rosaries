/*
    UI PREVIEW MODULE
    Handles UI preview and icon management
*/

/**
 * Updates FAB icon based on current mode
 */
function updateFABIcon() {
    const fabIcon = document.getElementById('fab-icon');
    if (!fabIcon) return; // Exit if icon element doesn't exist
    
    if (isStringMode) {
        // String tool icon
        fabIcon.innerHTML = '<path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9z" stroke-dasharray="2 4"/>';
    } else if (selectedObjectId && selectedSize) {
        // Bead selected icon
        fabIcon.innerHTML = '<circle cx="12" cy="12" r="8" fill="none"/>';
    } else {
        // Default plus icon
        fabIcon.innerHTML = '<path d="M3 12h18M12 3v18"/>';
    }
}

/**
 * Updates the tool selection UI.
 */
function updateToolSelectionUI(selectedElement) {
    // Remove selected from all tool cards
    document.querySelectorAll('.tool-card').forEach(el => el.classList.remove('selected'));
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
}

/**
 * Updates the selected bead preview image
 */
function updateSelectedBeadPreview() {
    const preview = document.getElementById('selected-bead-preview');
    const previewImg = document.getElementById('selected-bead-img');
    
    if (selectedObjectId && selectedSize) {
        const obj = getObjectById(selectedObjectId);
        if (obj) {
            previewImg.src = obj.image;
            preview.classList.add('active');
        }
    } else {
        preview.classList.remove('active');
    }
}