/*
    SAVED DESIGNS DELETE MODULE
    Delete operations, clean delete mode, and bulk delete functionality
*/

/**
 * Toggle delete mode on/off
 */
function toggleDeleteMode() {
    cleanDeleteModeActive = !cleanDeleteModeActive;
    if (cleanDeleteModeActive) {
        // Entering delete mode

        setTimeout(() => {
            if (cleanDeleteModeActive) {

                setupDeleteMode();
            }
        }, 50);
    } else {
        // Exiting delete mode

        exitDeleteMode();
    }
}

/**
 * Toggle design selection for deletion (like gallery system)
 */
function toggleDesignSelection(checkboxId, cardId) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        updateDeleteButtonText();

        const card = document.getElementById(cardId);
        if (card) {
            if (checkbox.checked) {
                card.classList.add('selected-for-deletion');
            } else {
                card.classList.remove('selected-for-deletion');
            }
        }
    }
}

/**
 * Show bulk delete confirmation dialog
 */
async function confirmBulkDelete() {
    const selectedCards = document.querySelectorAll('.clean-design-checkbox:checked');
    const count = selectedCards.length;

    if (count === 0) {
        const noSelectionText = (typeof window.getTranslation === 'function' ? window.getTranslation('no-designs-selected') : null) || 'No designs selected for deletion';
        showAlert(noSelectionText, 'warning');
        return;
    }

    const confirmTitle = (typeof window.getTranslation === 'function' ? window.getTranslation('confirm-delete-title') : null) || 'Delete Designs?';
    const confirmText = (typeof window.getTranslation === 'function' ? window.getTranslation('confirm-delete-yes') : null) || 'Delete';
    const cancelText = (typeof window.getTranslation === 'function' ? window.getTranslation('cancel') : null) || 'Cancel';
    const messageTemplate = (typeof window.getTranslation === 'function' ? window.getTranslation('confirm-delete-bulk') : null) || `Are you sure you want to delete ${count} design${count > 1 ? 's' : ''}?`;
    const descText = (typeof window.getTranslation === 'function' ? window.getTranslation('confirm-delete-single-desc') : null) || 'This action cannot be undone.';
    const message = messageTemplate + '\n\n' + descText;

    const confirmed = await showCustomConfirm(message, {
        title: confirmTitle,
        type: 'warning',
        confirmText: confirmText,
        cancelText: cancelText
    });

    if (confirmed) {
        selectedCards.forEach(checkbox => {
            const cardId = checkbox.dataset.cardId;
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (card) {
                card.remove();
            }

            // Also remove from storage
            if (typeof window.removeSavedDesign === 'function') {
                window.removeSavedDesign(cardId);
            }
        });

        const successTemplate = (typeof window.getTranslation === 'function' ? window.getTranslation('designs-deleted-count') : null) || 'Successfully deleted ${count} design${count > 1 ? "s" : ""}.';
        const successMsg = successTemplate.replace('${count}', count).replace('${count > 1 ? "s" : ""}', count > 1 ? 's' : '');
        showAlert(successMsg, 'success');

        // Exit delete mode
        if (cleanDeleteModeActive) {
            toggleDeleteMode();
        }
    }
}

/**
 * Update delete button text with selection count
 */
function updateDeleteButtonText() {
    const deleteBtn = document.getElementById('delete-design-btn');
    if (deleteBtn) {
        deleteBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span class="btn-text">${window.getTranslation('delete') || 'Delete'}</span>
        `;
    }
}

/**
 * CLEAN: Toggle delete mode on/off
 */
function cleanToggleDeleteMode() {


    const savedDesigns = getSavedDesigns();

    if (!cleanDeleteModeActive && savedDesigns.length === 0) {
        showSaveError(window.getTranslation('delete-error-no-designs') || 'No designs to delete!');
        return;
    }

    if (!cleanDeleteModeActive) {
        // First click: Enter delete mode

        cleanDeleteModeActive = true;
        cleanSelectedDesigns.clear();

        const deleteBtn = document.getElementById('delete-design-btn');
        if (deleteBtn) {
            deleteBtn.style.background = 'var(--error)';
            deleteBtn.style.color = 'white';

        }

        showSaveSuccess(window.getTranslation('delete-mode-instruction') || 'Delete mode: Click designs to select, then click "Delete" again to delete.');

        cleanSetupDeleteMode();
    } else {
        // Second click: Check selections and show confirmation

        if (cleanSelectedDesigns.size === 0) {
            // No designs selected - just exit delete mode

            cleanExitDeleteMode();
        } else {
            // Show confirmation for bulk delete

            cleanShowBulkDeleteConfirmation();
        }
    }
}

/**
 * CLEAN: Setup delete mode - add checkboxes dynamically
 */
function cleanSetupDeleteMode() {
    // TEMPORARY FIX: Disable gallery checkbox styles if they might be causing fake squares
    const galleryCheckboxCSS = Array.from(document.styleSheets).flatMap(sheet => {
        try {
            return Array.from(sheet.cssRules || []);
        } catch (e) {
            return [];
        }
    }).filter(rule => rule.selectorText && rule.selectorText.includes('.gallery-checkbox'));

    galleryCheckboxCSS.forEach(rule => {

        rule.disabled = true; // Temporarily disable
    });

    // ENHANCED FIX: Check for any remaining gallery elements
    const allGalleryElements = document.querySelectorAll('[class*="gallery"], [class*="checkbox"], [class*="square"], [class*="check"]');


    allGalleryElements.forEach((element, index) => {
        const className = element.className || '';


        // Remove gallery-related elements EXCEPT clean design elements
        if (className.includes('gallery') && !className.includes('clean-')) {

            element.remove();
        }
    });

    // Add body class to enable checkbox visibility
    document.body.classList.add('clean-delete-mode-active');

    // FIX: Hide design info overlays that create fake squares

    const designInfoOverlays = document.querySelectorAll('.design-info-overlay');
    designInfoOverlays.forEach(overlay => {

        overlay.style.display = 'none';
    });

    // Add checkboxes to all populated design cards
    const populatedCards = document.querySelectorAll('.saved-design-populated[data-design-id]');



    populatedCards.forEach(card => {
        const designId = card.getAttribute('data-design-id');

        // DEBUGGING: Log individual design object for inspection

        // COMPREHENSIVE CLEANUP: Remove ALL checkbox-related elements first
        const allInputs = card.querySelectorAll('input');
        const allLabels = card.querySelectorAll('label');
        const checkboxRelated = card.querySelectorAll('[class*="checkbox"], [class*="gallery"], [class*="clean"]');

        // Remove ALL inputs first
        allInputs.forEach((input, index) => {

            input.remove();
        });

        // SPECIFIC FIX: Remove any leftover gallery checkbox elements
        const oldGalleryCheckboxes = card.querySelectorAll('.gallery-checkbox, .gallery-checkbox-label');
        if (oldGalleryCheckboxes.length > 0) {

            oldGalleryCheckboxes.forEach((element, index) => {

                element.remove();
            });
        }

        // Add fresh checkbox HTML
        if (!card.querySelector('.clean-design-checkbox')) {
            const checkboxHTML = `
                <input type="checkbox" 
                       class="clean-design-checkbox" 
                       id="clean-checkbox-${designId}" 
                       data-design-id="${designId}">
                <label for="clean-checkbox-${designId}" class="clean-checkbox-label"></label>
            `;



            card.insertAdjacentHTML('afterbegin', checkboxHTML);
        }

        // Add event listener
        const label = card.querySelector('.clean-checkbox-label');
        if (label) {
            label.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const checkbox = card.querySelector('.clean-design-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    const designId = checkbox.getAttribute('data-design-id');
                    if (checkbox.checked) {
                        cleanSelectedDesigns.add(designId);
                    } else {
                        cleanSelectedDesigns.delete(designId);
                    }

                }
            });
        }
    });


}

/**
 * CLEAN: Exit delete mode - remove all checkboxes
 */
function cleanExitDeleteMode() {

    cleanDeleteModeActive = false;
    cleanSelectedDesigns.clear();

    // Remove body class to hide checkboxes
    document.body.classList.remove('clean-delete-mode-active');

    // Reset delete button
    const deleteBtn = document.getElementById('delete-design-btn');
    if (deleteBtn) {
        deleteBtn.style.background = '';
        deleteBtn.style.color = '';
        deleteBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span class="btn-text">${window.getTranslation('delete') || 'Delete'}</span>
        `;
    }

    // COMPREHENSIVE CLEANUP: Remove ALL checkbox elements from saved designs
    const populatedCards = document.querySelectorAll('.saved-design-populated[data-design-id]');


    populatedCards.forEach(card => {
        // Remove ALL input elements
        const allInputs = card.querySelectorAll('input');
        allInputs.forEach(input => {

            input.remove();
        });

        // Remove ALL label elements that might be related to checkboxes
        const allLabels = card.querySelectorAll('label');
        allLabels.forEach(label => {
            // Only remove labels that look like checkboxes
            if (label.className.includes('checkbox') || label.className.includes('gallery') || label.className.includes('clean')) {

                label.remove();
            }
        });
    });

    // RESTORE: Re-enable gallery checkbox styles after cleanup

    const allCSS = Array.from(document.styleSheets).flatMap(sheet => {
        try {
            return Array.from(sheet.cssRules || []);
        } catch (e) {
            return [];
        }
    }).filter(rule => rule.selectorText && rule.selectorText.includes('.gallery-checkbox'));

    allCSS.forEach(rule => {
        if (rule.disabled) {

            rule.disabled = false; // Re-enable
        }
    });

    // FIX: Restore design info overlays after delete mode cleanup

    const designInfoOverlays = document.querySelectorAll('.design-info-overlay');
    designInfoOverlays.forEach(overlay => {

        overlay.style.display = '';
        overlay.style.opacity = '';
    });


    showSaveSuccess('Delete mode deactivated.');
}

/**
 * CLEAN: Show bulk delete confirmation
 */
function cleanShowBulkDeleteConfirmation() {
    const count = cleanSelectedDesigns.size;

    const confirmDialog = document.createElement('div');
    confirmDialog.innerHTML = `
        <div class="clean-delete-backdrop" onclick="cleanCancelDeleteConfirm(event)">
            <div class="clean-delete-modal" onclick="event.stopPropagation()">
                <h3 style="margin: 0 0 15px 0; color: #333;">${window.getTranslation('confirm-delete-title') || 'Delete Design?'}</h3>
                <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                    ${window.getTranslation('confirm-delete-bulk') || `Are you sure you want to delete ${count} design${count > 1 ? 's' : ''}?`}
                </p>
                <div class="clean-delete-actions">
                    <button class="clean-btn-cancel" onclick="cleanCancelDeleteConfirm()">${window.getTranslation('cancel') || 'Cancel'}</button>
                    <button class="clean-btn-confirm" onclick="cleanConfirmBulkDelete()">${window.getTranslation('confirm-delete-yes') || 'Delete'}</button>
                </div>
            </div>
        </div>
    `;

    // Store references
    window.currentCleanDeleteDialog = confirmDialog;
    window.cleanDeleteIds = Array.from(cleanSelectedDesigns);

    document.body.appendChild(confirmDialog);
}

/**
 * CLEAN: Cancel delete confirmation
 */
function cleanCancelDeleteConfirm() {
    if (window.currentCleanDeleteDialog) {
        window.currentCleanDeleteDialog.remove();
        window.currentCleanDeleteDialog = null;
    }
    if (window.cleanDeleteIds) {
        window.cleanDeleteIds = null;
    }
}

/**
 * CLEAN: Confirm and execute bulk delete
 */
function cleanConfirmBulkDelete() {
    try {
        if (!window.cleanDeleteIds || window.cleanDeleteIds.length === 0) {
            showSaveError('No designs selected for deletion.');
            cleanCancelDeleteConfirm();
            return;
        }

        const count = window.cleanDeleteIds.length; // Store the count here

        // Get current saved designs
        const savedDesigns = getSavedDesigns();

        // Remove selected designs from localStorage
        const updatedDesigns = savedDesigns.filter(design => !window.cleanDeleteIds.includes(design.id));
        localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(updatedDesigns));



        // Close confirmation dialog
        cleanCancelDeleteConfirm();

        // Exit delete mode first
        cleanExitDeleteMode();

        // Refresh modal
        populateSavedModal();

        const successTemplate = (typeof window.getTranslation === 'function' ? window.getTranslation('designs-deleted-count') : null) || 'Successfully deleted ${count} design${count > 1 ? "s" : ""}.';
        const successMsg = successTemplate.replace('${count}', count).replace('${count > 1 ? "s" : ""}', count > 1 ? 's' : '');
        showSaveSuccess(successMsg);



    } catch (error) {
        console.warn('Could not delete designs:', error);
        showSaveError(window.getTranslation('delete-error-failed') || 'Failed to delete designs. Please try again.');
        cleanCancelDeleteConfirm();
    }
}

/**
 * Confirm delete function for individual designs
 */
function confirmDelete(designId) {


    try {
        // Get current saved designs
        const savedDesigns = getSavedDesigns();

        // Find the design to delete
        const designToDelete = savedDesigns.find(design => design.id === designId);

        if (!designToDelete) {
            showSaveError('Design not found or may have been deleted.');
            return;
        }

        // Remove the design from the array
        const updatedDesigns = savedDesigns.filter(design => design.id !== designId);
        localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(updatedDesigns));



        // Refresh modal
        populateSavedModal();

        showSaveSuccess(`${designToDelete.name} deleted successfully.`);

    } catch (error) {
        console.error('❌ Failed to delete design:', error);
        showSaveError('Failed to delete design. Please try again.');
    }
}

/**
 * Delete design from preview modal
 */
function deleteFromPreview(designId) {


    // Get design info for confirmation
    const savedDesigns = getSavedDesigns();
    const design = savedDesigns.find(d => d.id === designId);

    if (design) {
        // Close the preview modal first
        closeDesignPreviewModal();

        // Show delete confirmation
        showDeleteConfirmation(designId, design.name);
    } else {
        showSaveError(window.getTranslation('import-error-not-found') || 'Design not found or may have been deleted.');
        closeDesignPreviewModal();
    }
}

// Global function exports
window.toggleDeleteMode = toggleDeleteMode;
window.toggleDesignSelection = toggleDesignSelection;
window.confirmBulkDelete = confirmBulkDelete;
window.updateDeleteButtonText = updateDeleteButtonText;
window.cleanToggleDeleteMode = cleanToggleDeleteMode;
window.cleanSetupDeleteMode = cleanSetupDeleteMode;
window.cleanExitDeleteMode = cleanExitDeleteMode;
window.cleanShowBulkDeleteConfirmation = cleanShowBulkDeleteConfirmation;
window.cleanCancelDeleteConfirm = cleanCancelDeleteConfirm;
window.cleanConfirmBulkDelete = cleanConfirmBulkDelete;
window.confirmDelete = confirmDelete;
window.deleteFromPreview = deleteFromPreview;