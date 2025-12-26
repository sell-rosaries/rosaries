/*
    SAVED DESIGNS CORE MODULE
    Storage, modal lifecycle, and core functionality
*/

// Storage key for saved designs
const SAVED_DESIGNS_KEY = 'rosary-saved-designs';

// Import mode flag
let importModeActive = false;

// Global variables for clean delete mode
let cleanDeleteModeActive = false;
let cleanSelectedDesigns = new Set();

/**
 * Update import button text based on current language
 */
function updateImportButtonText() {
    const importBtn = document.getElementById('import-design-btn');
    if (importBtn) {
        const textSpan = importBtn.querySelector('.btn-text');
        if (textSpan) {
            const importText = currentLanguage === 'ar' ? 'استيراد' : 'Import';
            textSpan.textContent = importText;
        }
    }
}

/**
 * Open the saved designs modal
 */
function openSavedModal() {
    const modal = document.getElementById('saved-modal');
    if (modal) {
        populateSavedModal();
        modal.classList.add('active');
    }
}

/**
 * Close the saved designs modal - FULL CLEANUP
 */
function closeSavedModal() {


    // If import mode is active, fully exit it
    if (importModeActive) {
        importModeActive = false;

        // Reset import button
        const importBtn = document.getElementById('import-design-btn');
        if (importBtn) {
            importBtn.style.background = '';
            importBtn.style.color = '';
            importBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="btn-text"></span>
            `;
            updateImportButtonText(); // Update text using the centralized function
        }
    }

    // Remove any delete dialogs
    if (window.currentDeleteDialog) {
        window.currentDeleteDialog.remove();
        window.currentDeleteDialog = null;
    }
    if (window.bulkDeleteIds) {
        window.bulkDeleteIds = null;
    }

    // Close the modal
    const modal = document.getElementById('saved-modal');
    if (modal) {
        modal.classList.remove('active');
    }


}

/**
 * Save current design to storage
 * @param {Object} options - Save options
 * @param {boolean} options.silent - If true, suppresses success toast
 */
function saveCurrentDesign(options = {}) {
    // Check if design has content
    if (!hasDesignContent()) {
        if (!options.silent) {
            showSaveError(window.getTranslation('save-error-nothing') || 'Nothing to save - add some beads or draw a string first!');
        }
        return;
    }

    // Check if we have less than 6 saves
    const existingSaves = getSavedDesigns();
    if (existingSaves.length >= 6) {
        if (!options.silent) {
            showSaveError(window.getTranslation('save-error-max') || 'Maximum 6 saves allowed. Please delete some saves first.');
        }
        return;
    }

    try {
        // Capture screenshot first
        if (!options.silent) {
            showSaveSuccess(window.getTranslation('save-success-screenshot') || '📸 Auto-fitting + capturing preview...');
        }

        setTimeout(() => {




            const screenshot = captureCanvasScreenshot();

            if (!screenshot) {
                if (!options.silent) {
                    showSaveError(window.getTranslation('save-error-screenshot') || 'Failed to capture screenshot. Please try again.');
                }
                return;
            }




            const designData = {
                id: generateUniqueId(),
                name: `${window.getTranslation('design-singular') || 'Design'} ${existingSaves.length + 1}`,
                timestamp: new Date().toISOString(),
                stringType: window.getCurrentStringType ? window.getCurrentStringType() : 'preset',
                stringPaths: stringPaths.map(path => path.map(p => ({ x: p.x, y: p.y, z: p.z }))),
                stringPoints: stringPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
                stringScale: window.currentStringScale || 0, // Save current slider percentage
                beads: beads.map(bead => ({
                    position: { x: bead.position.x, y: bead.position.y, z: bead.position.z },
                    scale: { x: bead.scale.x, y: bead.scale.y, z: bead.scale.z },
                    rotation: bead.material.rotation || 0,
                    userData: bead.userData,
                    imageUrl: bead.material.map ? bead.material.map.image.src : null
                })),
                thumbnail: screenshot // Store the actual screenshot
            };

            // Add to saved designs array
            existingSaves.push(designData);

            // Save to localStorage
            localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(existingSaves));

            // Show success feedback
            if (!options.silent) {
                showSaveSuccess(window.getTranslation('save-success-saved') || 'Design saved successfully!');
            }

            // Refresh the modal
            populateSavedModal();



        }, 100); // Small delay to ensure renderer is ready

    } catch (e) {
        console.warn('Could not save design:', e);
        if (!options.silent) {
            showSaveError(window.getTranslation('save-error-failed') || 'Failed to save design. Please try again.');
        }
    }
}

/**
 * Check if current design has content to save
 */
function hasDesignContent() {
    return beads.length > 0 || (stringPaths && stringPaths.length > 0) || stringPoints.length > 0;
}

/**
 * Generate unique ID for saved design
 */
function generateUniqueId() {
    return 'saved_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get all saved designs from storage
 */
function getSavedDesigns() {
    try {
        return JSON.parse(localStorage.getItem(SAVED_DESIGNS_KEY) || '[]');
    } catch (e) {
        console.warn('Could not parse saved designs:', e);
        return [];
    }
}

/**
 * Populate the saved modal with saved designs and action buttons
 */
function populateSavedModal() {
    const modal = document.getElementById('saved-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    const savedDesigns = getSavedDesigns();

    // Always generate 6 static placeholder slots (2x3 grid)
    const designsHTML = generateStaticDesignGrid(savedDesigns);

    // Update modal content with new layout
    modalContent.innerHTML = `
        <div class="saved-modal-header">
            <h3>${window.getTranslation('saved-designs') || 'Saved Designs'}</h3>
            <button class="btn-close-modal" onclick="closeSavedModal()" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
        
        <p class="modal-subtitle">${window.getTranslation('saved-designs-subtitle') || 'Save, import, or delete your rosary designs'}</p>
        
        <!-- Saved Designs Grid -->
        <div class="saved-designs-grid" id="saved-designs-grid">
            ${designsHTML}
        </div>
        
        <!-- Action Buttons at Bottom -->
        <div class="saved-actions-bottom">
            <button class="saved-action-btn" id="save-design-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="btn-text">${window.getTranslation('save') || 'Save'}</span>
            </button>
            
            <button class="saved-action-btn" id="import-design-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="btn-text">${window.getTranslation('import') || 'Import'}</span>
            </button>
            
            <button class="saved-action-btn" id="delete-design-btn" data-disabled="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span class="btn-text">${window.getTranslation('delete') || 'Delete'}</span>
            </button>
        </div>
    `;

    // Add event listeners
    setupSavedModalEvents();

    // Generate thumbnails after DOM is ready
    setTimeout(generateThumbnailsForSavedDesigns, 100);
}

/**
 * Setup event listeners for the saved modal
 */
function setupSavedModalEvents() {
    // Save button
    const saveBtn = document.getElementById('save-design-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => saveCurrentDesign({ silent: false }));
    }

    // Import button (now fully functional)
    const importBtn = document.getElementById('import-design-btn');
    if (importBtn) {
        importBtn.addEventListener('click', toggleImportMode);
    }

    // Setup click listeners for saved design cards
    setupDesignCardClickListeners();

    // Clean Delete button
    const deleteBtn = document.getElementById('delete-design-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', cleanToggleDeleteMode);
    }
}

/**
 * Show save success message
 */
function showSaveSuccess(message) {
    // Create temporary success message
    const existingMessage = document.querySelector('.save-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'save-message';
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
        animation: save-message-slide 3s ease-in-out forwards;
        max-width: 90vw;
        text-align: center;
        border: 2px solid rgba(255, 255, 255, 0.3);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    `;
    messageEl.textContent = message;

    // Add animation keyframes
    if (!document.querySelector('#save-message-styles')) {
        const style = document.createElement('style');
        style.id = 'save-message-styles';
        style.textContent = `
            @keyframes save-message-slide {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(messageEl);

    // Remove after animation
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

/**
 * Show save error message
 */
function showSaveError(message) {
    const modal = document.getElementById('saved-modal');
    if (modal) {
        const existingAlert = modal.querySelector('.save-error-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertEl = document.createElement('div');
        alertEl.className = 'save-error-alert';
        alertEl.style.cssText = `
            background: var(--error);
            color: white;
            padding: var(--space-3);
            border-radius: var(--radius-md);
            font-size: var(--font-size-body-sm);
            margin-bottom: var(--space-4);
            text-align: center;
        `;
        alertEl.textContent = message;

        const modalContent = modal.querySelector('.modal-content');
        modalContent.insertBefore(alertEl, modalContent.children[4]);

        // Remove after 4 seconds
        setTimeout(() => {
            alertEl.remove();
        }, 4000);
    }
}

/**
 * Show "coming soon" placeholder message
 */
function showComingSoon(message) {
    showCustomAlert(message, 'info');
}

/**
 * Generate thumbnails for all saved designs after modal is populated
 */
function generateThumbnailsForSavedDesigns() {
    // No need for manual generation since we're using actual screenshots
    // This function can remain for future enhancements if needed

}

// Make function globally available for language system
window.updateImportButtonText = updateImportButtonText;

// Global function exports
window.openSavedModal = openSavedModal;
window.closeSavedModal = closeSavedModal;
window.saveCurrentDesign = saveCurrentDesign;
window.hasDesignContent = hasDesignContent;
window.generateUniqueId = generateUniqueId;
window.getSavedDesigns = getSavedDesigns;
window.populateSavedModal = populateSavedModal;
window.setupSavedModalEvents = setupSavedModalEvents;
window.showSaveSuccess = showSaveSuccess;
window.showSaveError = showSaveError;
window.showComingSoon = showComingSoon;
window.generateThumbnailsForSavedDesigns = generateThumbnailsForSavedDesigns;