/*
    SAVED DESIGNS MODULE
    Save, import, and delete rosary designs with localStorage persistence
*/

// Storage key for saved designs
const SAVED_DESIGNS_KEY = 'rosary-saved-designs';

// Delete mode flag
let deleteModeActive = false;
let designsToDelete = new Set(); // Track selected designs for deletion

// Import mode flag
let importModeActive = false;

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
    console.log('🔄 Closing saved modal - cleaning up all delete mode state...');
    
    // If delete mode is active, fully exit it
    if (deleteModeActive) {
        deleteModeActive = false;
        designsToDelete.clear();
        
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
                <span class="btn-text">${window.getTranslation('delete-design') || 'Delete Design'}</span>
            `;
        }
    }
    
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
                <span class="btn-text">${window.getTranslation('import-design') || 'Import Design'}</span>
            `;
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
    
    console.log('✅ Saved modal closed and fully cleaned up');
}

/**
 * Hidden smart fitting + simple capture + instant restore
 * User sees their view unchanged, but gets perfect fitted preview
 */
function captureCanvasScreenshot() {
    if (typeof renderer === 'undefined' || !renderer.domElement) {
        console.warn('Renderer or canvas not available');
        return null;
    }
    
    try {
        console.log('📸 Smart fitting + capture...');
        
        // Hidden operation: auto-fit design (user doesn't see this)
        const hasDesign = stringPoints.length > 0 || beads.length > 0;
        if (hasDesign) {
            // Use the same updated logic as TEST FIT - center design under current view
            console.log('🎯 Screenshot: Centering design geometry...');
            performBasicSmartFraming();
            
            console.log('📊 Design centered - positions:', {
                stringPoints: stringPoints.length,
                beads: beads.length,
                samplePoint: stringPoints.length > 0 ? { x: stringPoints[0].x, z: stringPoints[0].z } : 'none'
            });
        }
        
        // Force render to ensure geometry changes are visible
        renderer.render(scene, camera);
        
        // Small additional delay for rendering
        const startTime = Date.now();
        while (Date.now() - startTime < 50) {
            // Brief wait for rendering to complete
        }
        
        // Capture the fitted view
        const canvas = renderer.domElement;
        const result = canvas.toDataURL('image/jpeg', 0.9);
        
        console.log('✅ Screenshot captured with properly centered design');
        
        return result;
    } catch (e) {
        console.warn('Could not capture screenshot:', e);
        return null;
    }
}

/**
 * Save current design to storage
 */
function saveCurrentDesign() {
    // Check if design has content
    if (!hasDesignContent()) {
        showSaveError(window.getTranslation('save-error-nothing') || 'Nothing to save - add some beads or draw a string first!');
        return;
    }
    
    // Check if we have less than 6 saves
    const existingSaves = getSavedDesigns();
    if (existingSaves.length >= 6) {
        showSaveError(window.getTranslation('save-error-max') || 'Maximum 6 saves allowed. Please delete some saves first.');
        return;
    }
    
    try {
        // Capture screenshot first
        showSaveSuccess(window.getTranslation('save-success-screenshot') || '📸 Auto-fitting + capturing preview...');
        
        setTimeout(() => {
            console.log('🔍 Save: Starting capture process...');
            console.log('📊 Save: Design has', stringPoints.length, 'string points,', beads.length, 'beads');
            console.log('📍 Save: Current camera position:', { x: camera.position.x, z: camera.position.z });
            
            const screenshot = captureCanvasScreenshot();
            
            if (!screenshot) {
                showSaveError(window.getTranslation('save-error-screenshot') || 'Failed to capture screenshot. Please try again.');
                return;
            }
            
            console.log('✅ Save: Screenshot captured successfully');
            console.log('📊 Save: Current design positions after centering:', {
                stringPoint0: stringPoints.length > 0 ? { x: stringPoints[0].x, z: stringPoints[0].z } : 'none',
                bead0: beads.length > 0 ? { x: beads[0].position.x, z: beads[0].position.z } : 'none'
            });
            
            const designData = {
                id: generateUniqueId(),
                name: `Design ${existingSaves.length + 1}`,
                timestamp: new Date().toISOString(),
                stringPoints: stringPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
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
            showSaveSuccess(window.getTranslation('save-success-saved') || 'Design saved successfully!');
            
            // Refresh the modal
            populateSavedModal();
            
            console.log('✅ Design saved:', designData.name);
            
        }, 100); // Small delay to ensure renderer is ready
        
    } catch (e) {
        console.warn('Could not save design:', e);
        showSaveError(window.getTranslation('save-error-failed') || 'Failed to save design. Please try again.');
    }
}

/**
 * Check if current design has content to save
 */
function hasDesignContent() {
    return beads.length > 0 || stringPoints.length > 0;
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
                <span class="btn-text">${window.getTranslation('save-design') || 'Save Design'}</span>
            </button>
            
            <button class="saved-action-btn" id="import-design-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="btn-text">${window.getTranslation('import-design') || 'Import Design'}</span>
            </button>
            
            <button class="saved-action-btn" id="delete-design-btn" data-disabled="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span class="btn-text">${window.getTranslation('delete-design') || 'Delete Design'}</span>
            </button>
        </div>
    `;
    
    // Add event listeners
    setupSavedModalEvents();
    
    // Generate thumbnails after DOM is ready
    setTimeout(generateThumbnailsForSavedDesigns, 100);
}

/**
 * Generate HTML for a saved design card
 */
function generateDesignCardHTML(design, isPopulated = false) {
    const thumbnailSrc = design.thumbnail || '';
    const cardClass = isPopulated ? "saved-design-card saved-design-populated clickable-design" : "saved-design-card";
    const isSelected = designsToDelete.has(design.id);
    
    // Always generate checkboxes but hide them by default - they'll be shown when delete mode is activated
    const checkboxHTML = isPopulated ? `
                <input type="checkbox" 
                       class="saved-design-checkbox" 
                       id="design-checkbox-${design.id}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleDesignSelection('${design.id}')">
                <label for="design-checkbox-${design.id}" class="saved-design-checkbox-label"></label>
            ` : '';
    
    console.log('🎯 Generated card for design:', design.name, 'isPopulated:', isPopulated, 'hasCheckbox:', isPopulated);
    
    return `
        <div class="${cardClass}" data-design-id="${design.id}" data-design-name="${design.name}">
            ${checkboxHTML}
            <div class="saved-design-preview">
                ${thumbnailSrc ? 
                    `<img src="${thumbnailSrc}" alt="Design preview" class="design-thumbnail" />` :
                    `<div class="no-preview">No preview available</div>`
                }
            </div>
            <div class="design-info-overlay">
                <div class="design-name">${design.name}</div>
                <div class="design-date">${new Date(design.timestamp).toLocaleDateString()}</div>
            </div>
        </div>
    `;
}

/**
 * Generate static 6-slot grid (2x3) with placeholders and actual designs
 */
function generateStaticDesignGrid(savedDesigns) {
    let html = '';
    
    // Always create 6 slots (2 rows, 3 columns)
    for (let i = 0; i < 6; i++) {
        const design = savedDesigns[i]; // Get design for this slot if it exists
        
        if (design) {
            // Populate with actual saved design
            html += generateDesignCardHTML(design, true);
        } else {
            // Show empty placeholder slot
            html += generateEmptySlotHTML(i + 1);
        }
    }
    
    return html;
}

/**
 * Generate HTML for an empty slot placeholder
 */
function generateEmptySlotHTML(slotNumber) {
    return `
        <div class="saved-design-card saved-design-empty" data-slot="${slotNumber}">
            <div class="saved-design-preview">
                <div class="empty-slot-content">
                    <div class="empty-slot-icon">+</div>
                    <div class="empty-slot-text">${window.getTranslation ? window.getTranslation('slot-text') || 'Slot ' + slotNumber : 'Slot ' + slotNumber}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup event listeners for the saved modal
 */
function setupSavedModalEvents() {
    // Save button
    const saveBtn = document.getElementById('save-design-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCurrentDesign);
    }
    
    // Import button (now fully functional)
    const importBtn = document.getElementById('import-design-btn');
    if (importBtn) {
        importBtn.addEventListener('click', toggleImportMode);
    }
    
    // Setup click listeners for saved design cards
    setupDesignCardClickListeners();
    
    // Delete button
    const deleteBtn = document.getElementById('delete-design-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', toggleDeleteMode);
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
    alert(message);
}

/**
 * Generate thumbnails for all saved designs after modal is populated
 */
function generateThumbnailsForSavedDesigns() {
    // No need for manual generation since we're using actual screenshots
    // This function can remain for future enhancements if needed
    console.log('✅ Thumbnail generation complete - using actual screenshots');
}

/**
 * Toggle delete mode on/off
 */
function toggleDeleteMode() {
    const savedDesigns = getSavedDesigns();
    
    // Check if there are designs to delete when activating delete mode
    if (!deleteModeActive && savedDesigns.length === 0) {
        showSaveError(window.getTranslation('delete-error-no-designs') || 'No designs to delete!');
        return;
    }
    
    // Handle delete mode logic
    if (!deleteModeActive) {
        // First click: Enter delete mode
        deleteModeActive = true;
        designsToDelete.clear();
        
        const deleteBtn = document.getElementById('delete-design-btn');
        
        // Visual feedback on button
        if (deleteBtn) {
            deleteBtn.style.background = 'var(--error)';
            deleteBtn.style.color = 'white';
        }
        
        showSaveSuccess(window.getTranslation('delete-mode-instruction') || 'Delete mode: Click designs to select, then click "Delete" again to delete.');
        setupDeleteSelectionMode();
        
    } else {
        // Second click: Delete selected designs
        if (designsToDelete.size === 0) {
            // No designs selected - just exit delete mode
            console.log('🔄 No designs selected, exiting delete mode');
            exitDeleteMode();
        } else {
            // Show confirmation for bulk delete
            console.log('🗑️ Deleting', designsToDelete.size, 'designs');
            showBulkDeleteConfirmation();
        }
    }
}

/**
 * Exit delete mode completely - RESTORE NORMAL FUNCTIONALITY
 */
function exitDeleteMode() {
    console.log('🔄 Exiting delete mode completely...');
    
    deleteModeActive = false;
    designsToDelete.clear();
    
    const deleteBtn = document.getElementById('delete-design-btn');
    
    // Reset button appearance and text
    if (deleteBtn) {
        deleteBtn.style.background = '';
        deleteBtn.style.color = '';
        deleteBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span class="btn-text">Delete Design</span>
        `;
    }
    
    // Remove delete-mode-active class from all cards to restore normal clicking
    const allCards = document.querySelectorAll('.saved-design-populated[data-design-id]');
    allCards.forEach(card => {
        card.classList.remove('delete-mode-active');
    });
    
    // Refresh modal to remove checkboxes and restore normal event listeners
    populateSavedModal();
    
    console.log('✅ Delete mode exited - normal card clicking restored');
    showSaveSuccess('Delete mode deactivated.');
}

/**
 * Add checkbox styles for saved designs
 */
function addSavedDesignCheckboxStyles() {
    if (!document.querySelector('#saved-design-checkbox-styles')) {
        const style = document.createElement('style');
        style.id = 'saved-design-checkbox-styles';
        style.textContent = `
            /* Hide the actual checkbox input but keep it functional */
            .saved-design-checkbox {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                margin: 0;
                cursor: pointer;
                z-index: 15;
                opacity: 0;
                transform: scale(1);
                transition: all 0.2s ease;
                /* Hidden by default - only shown in delete mode */
                display: none;
            }
            
            /* Show checkboxes only when delete mode is active */
            .delete-mode-active .saved-design-checkbox {
                display: block;
            }
            
            /* Visual checkbox representation - hidden by default */
            .saved-design-checkbox-label {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                background: rgba(255, 255, 255, 0.98);
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                cursor: pointer;
                z-index: 10;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
                /* Hidden by default - only shown in delete mode */
                display: none;
            }
            
            /* Show checkbox labels only when delete mode is active */
            .delete-mode-active .saved-design-checkbox-label {
                display: block;
            }
            
            .saved-design-checkbox-label:hover {
                border-color: #dc2626;
                background: rgba(255, 255, 255, 1);
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15);
                transform: scale(1.08);
            }
            
            /* Selected state - show red background with X */
            .saved-design-checkbox:checked + .saved-design-checkbox-label {
                background: #dc2626;
                border-color: #b91c1c;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
                transform: scale(1.05);
            }
            
            /* X symbol - ensure it appears and is visible */
            .saved-design-checkbox:checked + .saved-design-checkbox-label::before {
                content: '✕';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 16px;
                font-weight: 900;
                line-height: 1;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
                z-index: 20;
                animation: checkbox-select 0.2s ease-out;
            }
            
            @keyframes checkbox-select {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                100% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            /* CRITICAL: Complete CSS isolation to prevent ANY gallery checkbox interference */
            
            /* Target all potential gallery checkbox conflicts with maximum specificity */
            .saved-design-populated .saved-design-checkbox,
            .saved-design-populated .saved-design-checkbox-label {
                position: absolute !important;
                top: 8px !important;
                right: 8px !important;
                left: auto !important;
                bottom: auto !important;
                z-index: 15 !important;
            }
            
            /* Target all checkbox elements inside saved modal with highest specificity */
            #saved-modal .saved-design-checkbox,
            #saved-modal .saved-design-checkbox-label,
            #saved-modal [data-design-id] .saved-design-checkbox,
            #saved-modal [data-design-id] .saved-design-checkbox-label {
                position: absolute !important;
                top: 8px !important;
                right: 8px !important;
                left: auto !important;
                bottom: auto !important;
                width: 24px !important;
                height: 24px !important;
                z-index: 15 !important;
            }
            
            /* Override ALL gallery checkbox styles that might leak */
            .saved-design-card input[type="checkbox"][class*="checkbox"],
            .saved-design-card label[class*="checkbox-label"] {
                position: absolute !important;
                top: 8px !important;
                right: 8px !important;
                left: auto !important;
                width: 24px !important;
                height: 24px !important;
            }
            
            /* Specifically target gallery checkbox positions that cause interference */
            .saved-design-card .saved-design-checkbox-label {
                top: 8px !important;
                right: 8px !important;
                left: auto !important;
                bottom: auto !important;
            }
            
            /* Prevent ANY left positioning from gallery styles */
            .saved-design-card [class*="checkbox"]:not(.saved-design-checkbox),
            .saved-design-card [class*="checkbox-label"]:not(.saved-design-checkbox-label) {
                left: auto !important;
            }
            
            /* Additional isolation for pseudo-elements */
            .saved-design-checkbox:checked + .saved-design-checkbox-label::before {
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
            }
            
            .saved-design-populated {
                position: relative;
                transition: all 0.2s ease;
            }
            
            /* Only prevent card interactions during actual selection process */
            .saved-design-populated[data-design-id].delete-mode-active {
                pointer-events: none;
                cursor: default;
            }
            
            /* Ensure checkboxes are clickable only when delete mode is active */
            .delete-mode-active .saved-design-checkbox,
            .delete-mode-active .saved-design-checkbox-label {
                pointer-events: auto !important;
                cursor: pointer;
            }
            
            /* Remove all visual feedback from cards - only checkboxes show selection */
            .saved-design-populated[data-design-id].selected {
                filter: none;
                border: none;
                box-shadow: none;
            }
            
            /* Override any blue highlighting from other sources */
            .saved-design-populated[data-design-id].selected,
            .saved-design-populated[data-design-id]:focus,
            .saved-design-populated[data-design-id]:active {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
                filter: none !important;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Fixed checkbox styles with X symbol and removed card highlighting');
    }
}

/**
 * Toggle design selection for deletion (like gallery system)
 */
function toggleDesignSelection(designId) {
    console.log('🎯 toggleDesignSelection called for design:', designId);
    
    if (designsToDelete.has(designId)) {
        designsToDelete.delete(designId);
        console.log('🗑️ Deselected design:', designId);
    } else {
        designsToDelete.add(designId);
        console.log('✅ Selected design:', designId);
    }
    
    // Update checkbox visual state immediately - NO DOM REFRESH NEEDED
    updateCheckboxVisualStateImmediate(designId);
    
    // Update delete button text
    updateDeleteButtonText();
    
    console.log('🎯 Design selection updated:', {
        designId,
        selectedCount: designsToDelete.size,
        selectedDesigns: Array.from(designsToDelete)
    });
}

/**
 * Update checkbox visual state IMMEDIATELY without relying on DOM refresh
 */
function updateCheckboxVisualStateImmediate(designId = null) {
    console.log('🎯 Updating checkbox visual state IMMEDIATELY for:', designId);
    
    if (designId) {
        // Update specific checkbox
        const targetCheckbox = document.getElementById(`design-checkbox-${designId}`);
        if (targetCheckbox) {
            const isSelected = designsToDelete.has(designId);
            targetCheckbox.checked = isSelected;
            console.log('✅ Specific checkbox updated:', { designId, isSelected });
        } else {
            console.warn('⚠️ Specific checkbox not found:', designId);
        }
    } else {
        // Update all checkboxes
        const allCheckboxes = document.querySelectorAll('.saved-design-checkbox');
        allCheckboxes.forEach(checkbox => {
            const checkboxDesignId = checkbox.id.replace('design-checkbox-', '');
            const isSelected = designsToDelete.has(checkboxDesignId);
            checkbox.checked = isSelected;
        });
        console.log('✅ All checkboxes updated:', allCheckboxes.length);
    }
}

/**
 * Setup delete selection mode
 */
function setupDeleteSelectionMode() {
    console.log('🔧 Setting up delete selection mode...');
    
    // Add checkbox styles
    addSavedDesignCheckboxStyles();
    
    // Add delete-mode-active class to prevent card clicking during selection
    const populatedCards = document.querySelectorAll('.saved-design-populated[data-design-id]');
    populatedCards.forEach(card => {
        card.classList.add('delete-mode-active');
    });
    
    // Update all checkbox visual states immediately to show current selections
    updateCheckboxVisualStateImmediate();
    
    // Setup checkbox event handlers
    setTimeout(() => {
        setupCheckboxEventHandlers();
    }, 100);
    
    console.log('✅ Delete selection mode setup complete');
}

/**
 * Setup event handlers for checkboxes after DOM is ready
 */
function setupCheckboxEventHandlers() {
    console.log('🔧 Setting up checkbox event handlers...');
    
    const populatedCards = document.querySelectorAll('.saved-design-populated[data-design-id].delete-mode-active');
    populatedCards.forEach(card => {
        // Setup checkbox event handlers WITHOUT breaking normal card functionality
        const checkbox = card.querySelector('.saved-design-checkbox');
        const checkboxLabel = card.querySelector('.saved-design-checkbox-label');
        
        if (checkbox) {
            // Handle checkbox clicks - stop propagation to prevent card clicking
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const designId = card.getAttribute('data-design-id');
                if (designId) {
                    console.log('🎯 Checkbox clicked for design:', designId);
                    toggleDesignSelection(designId);
                }
            });
            
            // Also handle change event for better compatibility
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const designId = card.getAttribute('data-design-id');
                if (designId) {
                    toggleDesignSelection(designId);
                }
            });
        }
        
        if (checkboxLabel) {
            checkboxLabel.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const designId = card.getAttribute('data-design-id');
                if (designId) {
                    console.log('🎯 Checkbox label clicked for design:', designId);
                    toggleDesignSelection(designId);
                }
            });
        }
    });
    
    console.log('✅ Checkbox event handlers setup complete');
}



/**
 * Update delete button text with selection count
 */
function updateDeleteButtonText() {
    const deleteBtn = document.getElementById('delete-design-btn');
    if (deleteBtn) {
        const count = designsToDelete.size;
        if (count === 0) {
            deleteBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span class="btn-text">Delete Design</span>
            `;
        } else {
            deleteBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span class="btn-text">Delete (${count})</span>
            `;
        }
    }
}

/**
 * Show bulk delete confirmation dialog
 */
function showBulkDeleteConfirmation() {
    const count = designsToDelete.size;
    
    // Add CSS styles if not already present
    if (!document.querySelector('#delete-dialog-styles')) {
        const style = document.createElement('style');
        style.id = 'delete-dialog-styles';
        style.textContent = `
            .delete-confirm-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .delete-confirm-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .delete-confirm-modal {
                position: relative;
                background: var(--background);
                border-radius: var(--radius-lg);
                padding: var(--space-6);
                max-width: 400px;
                width: 90%;
                box-shadow: var(--shadow-xl);
                border: 2px solid var(--error);
                animation: confirmDialogSlide 0.3s ease-out;
            }
            
            @keyframes confirmDialogSlide {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            .delete-confirm-header {
                text-align: center;
                margin-bottom: var(--space-4);
            }
            
            .delete-confirm-content {
                text-align: center;
                margin-bottom: var(--space-6);
            }
            
            .delete-confirm-actions {
                display: flex;
                gap: var(--space-3);
                justify-content: center;
            }
            
            .btn-cancel-delete {
                padding: var(--space-3) var(--space-6);
                background: var(--neutral-200);
                color: var(--neutral-700);
                border: none;
                border-radius: var(--radius-md);
                cursor: pointer;
                font-weight: var(--font-weight-medium);
                transition: all 0.2s ease;
            }
            
            .btn-cancel-delete:hover {
                background: var(--neutral-300);
            }
            
            .btn-confirm-delete {
                padding: var(--space-3) var(--space-6);
                background: var(--error);
                color: white;
                border: none;
                border-radius: var(--radius-md);
                cursor: pointer;
                font-weight: var(--font-weight-semibold);
                transition: all 0.2s ease;
            }
            
            .btn-confirm-delete:hover {
                background: #dc2626;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }
    
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'delete-confirm-dialog';
    confirmDialog.innerHTML = `
        <div class="delete-confirm-backdrop"></div>
        <div class="delete-confirm-modal">
            <div class="delete-confirm-header">
                <h4 style="color: var(--error); margin: 0;">${window.getTranslation('warning-title') || '⚠️ Warning'}</h4>
            </div>
            <div class="delete-confirm-content">
                <p>${window.getTranslation('confirm-delete-bulk') || 'Are you sure you want to delete these designs?'}</p>
                <p style="font-size: var(--font-size-body-sm); color: var(--neutral-600); margin-top: var(--space-2);">
                    ${window.getTranslation('confirm-delete-single-desc') || 'This action cannot be undone.'}
                </p>
            </div>
            <div class="delete-confirm-actions">
                <button class="btn-cancel-delete" onclick="cancelDeleteConfirm()">${window.getTranslation('confirm-cancel') || 'No, Cancel'}</button>
                <button class="btn-confirm-delete" onclick="confirmBulkDelete()">${window.getTranslation('confirm-delete-yes') || 'Yes, Delete'}</button>
            </div>
        </div>
    `;
    
    // Store references globally
    window.currentDeleteDialog = confirmDialog;
    window.bulkDeleteIds = Array.from(designsToDelete);
    
    document.body.appendChild(confirmDialog);
}

/**
 * Confirm and execute bulk delete
 */
function confirmBulkDelete() {
    try {
        // Store count for success message
        const count = window.bulkDeleteIds.length;
        
        // Get current saved designs
        const savedDesigns = getSavedDesigns();
        
        // Remove selected designs from localStorage
        const updatedDesigns = savedDesigns.filter(design => !designsToDelete.has(design.id));
        localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(updatedDesigns));
        
        console.log('🗑️ Deleted designs:', Array.from(designsToDelete));
        
        // Close confirmation dialog
        cancelDeleteConfirm();
        
        // Exit delete mode first
        deleteModeActive = false;
        designsToDelete.clear();
        
        // Reset delete button appearance
        const deleteBtn = document.getElementById('delete-design-btn');
        if (deleteBtn) {
            deleteBtn.style.background = '';
            deleteBtn.style.color = '';
        }
        
        // Force refresh the modal to show updated design grid and reset all visual states
        console.log('🔄 Refreshing modal after deletion...');
        populateSavedModal();
        
        // Show success message
        const successText = window.getTranslation('delete-success-bulk');
        let message = successText ? successText : '${count} design${count > 1 ? \'s\' : \'\'} deleted successfully!';
        // Replace the variables manually for backward compatibility
        if (message.includes('${count}')) {
            message = message.replace('${count}', count);
        }
        if (message.includes('${count > 1 ? \'s\' : \'\'}')) {
            message = message.replace('${count > 1 ? \'s\' : \'\'}', count > 1 ? 's' : '');
        }
        showSaveSuccess(message);
        
        console.log('✅ Bulk delete completed:', count, 'designs');
        window.bulkDeleteIds = null;
        
    } catch (e) {
        console.warn('Could not delete designs:', e);
        showSaveError(window.getTranslation('delete-error-failed') || 'Failed to delete designs. Please try again.');
        cancelDeleteConfirm();
    }
}

/**
 * Confirm delete with user
 */
function confirmDeleteDesign(designId, cardElement) {
    // Create custom confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'delete-confirm-dialog';
    confirmDialog.innerHTML = `
        <div class="delete-confirm-backdrop"></div>
        <div class="delete-confirm-modal">
            <div class="delete-confirm-header">
                <h4 style="color: var(--error); margin: 0;">${window.getTranslation('warning-title') || '⚠️ Warning'}</h4>
            </div>
            <div class="delete-confirm-content">
                <p>${window.getTranslation('confirm-delete-single') || 'Are you sure you want to delete this design?'}</p>
                <p style="font-size: var(--font-size-body-sm); color: var(--neutral-600); margin-top: var(--space-2);">
                    ${window.getTranslation('confirm-delete-single-desc') || 'This action cannot be undone.'}
                </p>
            </div>
            <div class="delete-confirm-actions">
                <button class="btn-cancel-delete" onclick="cancelDeleteConfirm()">${window.getTranslation('confirm-cancel') || 'No, Cancel'}</button>
                <button class="btn-confirm-delete" onclick="confirmDelete('${designId}')">${window.getTranslation('confirm-delete-yes') || 'Yes, Delete'}</button>
            </div>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#delete-dialog-styles')) {
        const style = document.createElement('style');
        style.id = 'delete-dialog-styles';
        style.textContent = `
            .delete-confirm-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .delete-confirm-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .delete-confirm-modal {
                position: relative;
                background: var(--background);
                border-radius: var(--radius-lg);
                padding: var(--space-6);
                max-width: 400px;
                width: 90%;
                box-shadow: var(--shadow-xl);
                border: 2px solid var(--error);
                animation: confirmDialogSlide 0.3s ease-out;
            }
            
            @keyframes confirmDialogSlide {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            .delete-confirm-header {
                text-align: center;
                margin-bottom: var(--space-4);
            }
            
            .delete-confirm-content {
                text-align: center;
                margin-bottom: var(--space-6);
            }
            
            .delete-confirm-actions {
                display: flex;
                gap: var(--space-3);
                justify-content: center;
            }
            
            .btn-cancel-delete {
                padding: var(--space-3) var(--space-6);
                background: var(--neutral-200);
                color: var(--neutral-700);
                border: none;
                border-radius: var(--radius-md);
                cursor: pointer;
                font-weight: var(--font-weight-medium);
                transition: all 0.2s ease;
            }
            
            .btn-cancel-delete:hover {
                background: var(--neutral-300);
            }
            
            .btn-confirm-delete {
                padding: var(--space-3) var(--space-6);
                background: var(--error);
                color: white;
                border: none;
                border-radius: var(--radius-md);
                cursor: pointer;
                font-weight: var(--font-weight-semibold);
                transition: all 0.2s ease;
            }
            
            .btn-confirm-delete:hover {
                background: #dc2626;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Store references globally for the callback functions
    window.currentDeleteDialog = confirmDialog;
    window.currentDeleteCard = cardElement;
    window.currentDeleteDesignId = designId;
    
    document.body.appendChild(confirmDialog);
}

/**
 * Cancel delete confirmation - FULL RESET INCLUDING EXIT DELETE MODE
 */
function cancelDeleteConfirm() {
    console.log('❌ Canceling delete confirmation...');
    
    // Remove any delete dialog
    if (window.currentDeleteDialog) {
        window.currentDeleteDialog.remove();
        window.currentDeleteDialog = null;
    }
    
    // Clear any bulk delete references
    if (window.bulkDeleteIds) {
        window.bulkDeleteIds = null;
    }
    
    // Clear single delete references
    window.currentDeleteCard = null;
    window.currentDeleteDesignId = null;
    
    // FULL RESET: Exit delete mode, clear selections, reset button
    deleteModeActive = false;
    designsToDelete.clear();
    
    // Reset delete button appearance and text
    const deleteBtn = document.getElementById('delete-design-btn');
    if (deleteBtn) {
        deleteBtn.style.background = '';
        deleteBtn.style.color = '';
        deleteBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span class="btn-text">Delete Design</span>
        `;
    }
    
    // Remove delete-mode-active class from all cards to restore normal clicking
    const allCards = document.querySelectorAll('.saved-design-populated[data-design-id]');
    allCards.forEach(card => {
        card.classList.remove('delete-mode-active');
    });
    
    // Refresh modal to remove checkboxes and reset all visual states
    console.log('🔄 Refreshing modal after cancel...');
    populateSavedModal();
    
    console.log('✅ Delete mode fully exited and reset - user can now use other features');
}

/**
 * Confirm and execute delete
 */
function confirmDelete(designId) {
    try {
        // Remove from localStorage
        const savedDesigns = getSavedDesigns();
        const updatedDesigns = savedDesigns.filter(design => design.id !== designId);
        localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(updatedDesigns));
        
        // Show success message
        showSaveSuccess(window.getTranslation('delete-success-single') || 'Design deleted successfully!');
        
        // Close confirmation dialog
        cancelDeleteConfirm();
        
        // Refresh the modal
        populateSavedModal();
        
        console.log('✅ Design deleted:', designId);
        
    } catch (e) {
        console.warn('Could not delete design:', e);
        showSaveError(window.getTranslation('delete-error-failed') || 'Failed to delete design. Please try again.');
        cancelDeleteConfirm();
    }
}

// Make functions globally accessible
window.openSavedModal = openSavedModal;
window.closeSavedModal = closeSavedModal;
window.closeDesignPreviewModal = closeDesignPreviewModal;
window.deleteFromPreview = deleteFromPreview;
window.importFromPreview = importFromPreview;
window.saveCurrentDesign = saveCurrentDesign;
window.cancelDeleteConfirm = cancelDeleteConfirm;
window.confirmDelete = confirmDelete;
window.confirmBulkDelete = confirmBulkDelete;
window.performBasicSmartFraming = performBasicSmartFraming;
window.toggleDesignSelection = toggleDesignSelection;



/**
 * Get current camera viewport center in world coordinates
 * For orthographic camera, this is based on camera position and zoom
 */
function getCurrentCameraViewportCenter() {
    // For orthographic camera, viewport center is based on camera.position and current zoom
    // Camera is looking at (0, 0, 0), but may have panned via OrbitControls
    const viewWidth = (camera.right - camera.left) / camera.zoom;
    const viewHeight = (camera.top - camera.bottom) / camera.zoom;
    
    // Calculate center based on camera position (camera.position tells us where we are)
    // Since camera looks at (0, 0, 0) and is at (0, 100, 0), we need to understand the mapping
    // For orthographic camera, we can estimate center based on camera's pan offset
    
    // Use camera's position offset as the viewport center
    const centerX = camera.position.x; // X position tells us the pan offset
    const centerZ = camera.position.z; // Z position tells us the pan offset
    
    console.log('📊 Viewport dimensions:', { width: viewWidth, height: viewHeight });
    console.log('📊 Camera position (pan offset):', { x: centerX, z: centerZ });
    
    return {
        x: centerX,
        z: centerZ
    };
}

/**
 * Calculate current design center from stringPoints and beads
 */
function calculateCurrentDesignCenter() {
    let sumX = 0, sumZ = 0;
    let totalPoints = 0;
    
    // Collect string points
    if (typeof stringPoints !== 'undefined' && stringPoints.length > 0) {
        stringPoints.forEach(point => {
            sumX += point.x;
            sumZ += point.z;
        });
        totalPoints += stringPoints.length;
    }
    
    // Collect bead positions
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            sumX += bead.position.x;
            sumZ += bead.position.z;
        });
        totalPoints += beads.length;
    }
    
    if (totalPoints === 0) {
        return { x: 0, z: 0 };
    }
    
    return {
        x: sumX / totalPoints,
        z: sumZ / totalPoints
    };
}

/**
 * Calculate current design bounds (min/max X, Y, Z)
 */
function calculateDesignBounds() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    // Collect string points
    if (typeof stringPoints !== 'undefined') {
        stringPoints.forEach(point => {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
            minZ = Math.min(minZ, point.z);
            maxZ = Math.max(maxZ, point.z);
        });
    }
    
    // Collect bead positions
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            minX = Math.min(minX, bead.position.x);
            maxX = Math.max(maxX, bead.position.x);
            minY = Math.min(minY, bead.position.y);
            maxY = Math.max(maxY, bead.position.y);
            minZ = Math.min(minZ, bead.position.z);
            maxZ = Math.max(maxZ, bead.position.z);
        });
    }
    
    return { minX, maxX, minY, maxY, minZ, maxZ };
}

/**
 * Translate all design geometry by the given offset
 * Updates both stringPoints and beads positions
 */
function translateDesignGeometry(translation) {
    // Translate string points
    if (typeof stringPoints !== 'undefined') {
        stringPoints.forEach(point => {
            point.x += translation.x;
            point.z += translation.z;
        });
        
        // Update the visual string line
        updateStringLine();
    }
    
    // Translate beads
    if (typeof beads !== 'undefined' && beads.length > 0) {
        beads.forEach(bead => {
            bead.position.x += translation.x;
            bead.position.z += translation.z;
            
            // Update the bead mesh position
            if (bead.mesh) {
                bead.mesh.position.x += translation.x;
                bead.mesh.position.z += translation.z;
            }
        });
    }
}

/**
 * SMART FRAMING: Auto-fit design to current view - TWO-MODE APPROACH
 * Mode 1: Keep camera panning for detail exploration
 * Mode 2: Move design geometry to center under current camera view
 * Safe like preset imports - no rotation, no corruption
 */
function performBasicSmartFraming() {
    console.log('🧪 TEST FIT: Smart framing with design repositioning to current view');
    
    // Check if we have any design elements
    const hasDesign = (typeof stringPoints !== 'undefined' && stringPoints.length > 0) || 
                     (typeof beads !== 'undefined' && beads.length > 0);
    
    if (!hasDesign) {
        console.log('⚠️ No design elements to fit');
        alert(window.getTranslation('import-error-empty') || 'No design to fit! Add some beads or draw a string first.');
        return;
    }
    
    // STEP 1: Get current camera viewport center in world coordinates
    const cameraCenter = getCurrentCameraViewportCenter();
    console.log('📍 Camera viewport center:', cameraCenter);
    
    // STEP 2: Calculate current design center
    const designCenter = calculateCurrentDesignCenter();
    console.log('🎯 Current design center:', designCenter);
    
    // STEP 3: Translate design geometry to center under camera view
    const translation = {
        x: cameraCenter.x - designCenter.x,
        z: cameraCenter.z - designCenter.z
    };
    
    console.log('📐 Translation needed:', translation);
    
    if (translation.x !== 0 || translation.z !== 0) {
        translateDesignGeometry(translation);
        console.log('✅ Design geometry translated by:', translation);
    }
    
    // STEP 4: Calculate optimal zoom (37.5% screen coverage) using new bounds
    const bounds = calculateDesignBounds();
    const maxScreenDim = Math.max(
        (bounds.maxX - bounds.minX) / (camera.right - camera.left) * (camera.zoom || 1),
        (bounds.maxZ - bounds.minZ) / (camera.top - camera.bottom) * (camera.zoom || 1)
    );
    
    const targetScreenCoverage = 0.375;
    const zoomRatio = targetScreenCoverage / maxScreenDim;
    const optimalZoom = Math.min(Math.max(camera.zoom * zoomRatio * 2.0, 0.5), 5.0);
    
    console.log('📏 TEST FIT: Calculated optimal zoom:', optimalZoom.toFixed(2));
    
    // STEP 5: Apply zoom adjustment
    camera.zoom = optimalZoom;
    camera.updateProjectionMatrix();
    
    console.log('✅ TEST FIT complete: Design positioned under camera view + zoom:', camera.zoom.toFixed(2));
    console.log('🔒 Design now appears in current viewport - users can still pan for detail exploration');
}

/**
 * Toggle import mode on/off
 */
function toggleImportMode() {
    console.log('🔄 Toggling import mode...');
    
    if (importModeActive) {
        // Exit import mode
        importModeActive = false;
        console.log('❌ Import mode deactivated');
        
        // Reset import button styling
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
                <span class="btn-text">Import Design</span>
            `;
        }
        
        showSaveSuccess(window.getTranslation('import-success-activated') || 'Import mode deactivated');
    } else {
        // Enter import mode
        importModeActive = true;
        console.log('✅ Import mode activated');
        
        // Style import button to show it's active
        const importBtn = document.getElementById('import-design-btn');
        if (importBtn) {
            importBtn.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
            importBtn.style.color = 'white';
            importBtn.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            importBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="btn-text">Cancel Import</span>
            `;
        }
        
        showSaveSuccess(window.getTranslation('import-success-instruction') || 'Click on any saved design to import it!');
    }
}

/**
 * Show confirmation dialog for importing a design
 */
function showImportConfirmation(designId, designName) {
    console.log('🗋️ Show import confirmation for:', designName);
    
    // Create confirmation dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    dialog.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        ">
            <h3 style="margin: 0 0 15px 0; color: #333;">${window.getTranslation('confirm-import-title') || 'Import Design?'}</h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                ${window.getTranslation('confirm-import-desc') || 'This will replace everything in your sandbox. This action cannot be undone.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="confirm-import-btn" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                ">${window.getTranslation('confirm-import-yes') || 'Yes, Import'}</button>
                <button id="cancel-import-btn" style="
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                ">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Handle button clicks
    dialog.querySelector('#confirm-import-btn').addEventListener('click', () => {
        console.log('✅ Confirmed import of design:', designName);
        document.body.removeChild(dialog);
        importDesign(designId);
    });
    
    dialog.querySelector('#cancel-import-btn').addEventListener('click', () => {
        console.log('❌ Cancelled import of design:', designName);
        document.body.removeChild(dialog);
    });
    
    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            console.log('❌ Cancelled import (backdrop click)');
            document.body.removeChild(dialog);
        }
    });
}

/**
 * Setup click listeners for saved design cards
 */
function setupDesignCardClickListeners() {
    const designCards = document.querySelectorAll('.clickable-design');
    designCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const designId = card.getAttribute('data-design-id');
            const designName = card.getAttribute('data-design-name');
            
            console.log('🎯 Design card clicked:', designId, designName);
            
            // Handle different modes
            if (importModeActive) {
                // In import mode, show confirmation dialog
                showImportConfirmation(designId, designName);
            } else if (deleteModeActive) {
                // In delete mode, handled by checkbox logic
                return;
            } else {
                // Normal mode, show preview modal
                showDesignPreviewModal(designId, designName);
            }
        });
    });
}

/**
 * Show design preview modal (40% screen) with delete and import buttons
 */
function showDesignPreviewModal(designId, designName) {
    const savedDesigns = getSavedDesigns();
    const design = savedDesigns.find(d => d.id === designId);
    
    if (!design) {
        console.error('❌ Design not found:', designId);
        showSaveError(window.getTranslation('import-error-not-found') || 'Design not found or may have been deleted.');
        return;
    }
    
    // Create preview modal HTML
    const modalHTML = `
        <div id="design-preview-modal" class="design-preview-modal">
            <div class="preview-backdrop" onclick="closeDesignPreviewModal()"></div>
            <div class="preview-content">
                <div class="preview-header">
                    <h3>${design.name}</h3>
                    <button class="btn-close-preview" onclick="closeDesignPreviewModal()" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="preview-body">
                    <div class="preview-image-container">
                        ${design.thumbnail ? 
                            `<img src="${design.thumbnail}" alt="Design preview" class="preview-image" />` :
                            `<div class="no-preview">${window.getTranslation('no-preview-available') || 'No preview available'}</div>`
                        }
                    </div>
                    
                    <div class="preview-info">
                        <p><strong>${window.getTranslation('preview-created') || 'Created: '}</strong> ${new Date(design.timestamp).toLocaleString()}</p>
                        <p><strong>Beads:</strong> ${design.beads ? design.beads.length : 0}</p>
                        <p><strong>String Points:</strong> ${design.stringPoints ? design.stringPoints.length : 0}</p>
                    </div>
                </div>
                
                <div class="preview-actions">
                    <button class="preview-btn preview-btn-delete" onclick="deleteFromPreview('${designId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        <span>${window.getTranslation('preview-delete') || 'Delete'}</span>
                    </button>
                    
                    <button class="preview-btn preview-btn-import" onclick="importFromPreview('${designId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>${window.getTranslation('import-design') || 'Import'}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles if not already present
    if (!document.querySelector('#preview-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'preview-modal-styles';
        style.textContent = `
            .design-preview-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: previewModalSlide 0.3s ease-out;
            }
            
            .preview-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .preview-content {
                position: relative;
                background: var(--background);
                border-radius: var(--radius-lg);
                width: 40%;
                max-width: 500px;
                min-width: 300px;
                max-height: 80vh;
                box-shadow: var(--shadow-xl);
                border: 2px solid var(--primary);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: previewContentSlide 0.3s ease-out;
            }
            
            @keyframes previewModalSlide {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            @keyframes previewContentSlide {
                from {
                    transform: scale(0.9) translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
            }
            
            .preview-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-4) var(--space-6);
                border-bottom: 1px solid var(--border);
                background: var(--surface);
            }
            
            .preview-header h3 {
                margin: 0;
                color: var(--text-primary);
                font-size: var(--font-size-heading-sm);
                font-weight: var(--weight-semibold);
            }
            
            .btn-close-preview {
                background: var(--error);
                border: none;
                color: white;
                cursor: pointer;
                padding: var(--space-2);
                border-radius: var(--radius-sm);
                transition: all 0.2s ease;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: var(--shadow-sm);
            }
            
            .btn-close-preview:hover {
                background: #dc2626;
                transform: scale(1.05);
                box-shadow: var(--shadow-md);
            }
            
            .btn-close-preview svg {
                width: 18px;
                height: 18px;
            }
            
            .preview-body {
                padding: var(--space-6);
                flex: 1;
                overflow-y: auto;
            }
            
            .preview-image-container {
                text-align: center;
                margin-bottom: var(--space-4);
            }
            
            .preview-image {
                max-width: 100%;
                height: auto;
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-md);
                border: 1px solid var(--border);
            }
            
            .no-preview {
                background: var(--neutral-100);
                color: var(--text-secondary);
                padding: var(--space-8);
                border-radius: var(--radius-md);
                font-style: italic;
                border: 1px dashed var(--border);
            }
            
            .preview-info {
                background: var(--surface);
                padding: var(--space-4);
                border-radius: var(--radius-md);
                border: 1px solid var(--border);
            }
            
            .preview-info p {
                margin: 0 0 var(--space-2) 0;
                color: var(--text-primary);
                font-size: var(--font-size-body-sm);
            }
            
            .preview-info p:last-child {
                margin-bottom: 0;
            }
            
            .preview-actions {
                display: flex;
                gap: var(--space-3);
                padding: var(--space-4) var(--space-6);
                border-top: 1px solid var(--border);
                background: var(--surface);
            }
            
            .preview-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-2);
                padding: var(--space-3) var(--space-4);
                border: none;
                border-radius: var(--radius-md);
                font-size: var(--font-size-body-sm);
                font-weight: var(--weight-medium);
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
            }
            
            .preview-btn-delete {
                background: var(--error);
                color: white;
            }
            
            .preview-btn-delete:hover {
                background: #dc2626;
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            
            .preview-btn-import {
                background: var(--primary);
                color: white;
            }
            
            .preview-btn-import:hover {
                background: var(--primary-dark);
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            
            @media (max-width: 768px) {
                .preview-content {
                    width: 90%;
                    margin: var(--space-4);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Store current preview data globally
    window.currentPreviewDesign = { id: designId, name: designName };
    
    console.log('🎯 Preview modal opened for design:', designId);
}

/**
 * Close design preview modal
 */
function closeDesignPreviewModal() {
    const modal = document.getElementById('design-preview-modal');
    if (modal) {
        modal.remove();
        window.currentPreviewDesign = null;
        console.log('🔒 Preview modal closed');
    }
}

/**
 * Delete design from preview modal
 */
function deleteFromPreview(designId) {
    console.log('🗑️ Delete from preview:', designId);
    
    // Close preview modal first
    closeDesignPreviewModal();
    
    // Use existing confirmDelete function with single parameter
    confirmDelete(designId);
}

/**
 * Import design from preview modal
 */
function importFromPreview(designId) {
    console.log('📥 Import from preview clicked:', designId);
    
    // Get design info for confirmation
    const savedDesigns = getSavedDesigns();
    const design = savedDesigns.find(d => d.id === designId);
    
    if (design) {
        // Close the preview modal first
        closeDesignPreviewModal();
        
        // Show import confirmation
        showImportConfirmation(designId, design.name);
    } else {
        showSaveError(window.getTranslation('import-error-not-found') || 'Design not found or may have been deleted.');
        closeDesignPreviewModal();
    }
}

/**
 * Import a saved design by ID
 */
function importDesign(designId) {
    console.log('📥 Importing design:', designId);
    
    const savedDesigns = getSavedDesigns();
    const design = savedDesigns.find(d => d.id === designId);
    
    if (!design) {
        console.error('❌ Design not found:', designId);
        showSaveError(window.getTranslation('import-error-not-found') || 'Design not found or may have been deleted.');
        return;
    }
    
    try {
        // Clear current design
        clearCurrentDesign();
        
        // Import string points
        if (design.stringPoints && design.stringPoints.length > 0) {
            console.log('📍 Importing string points:', design.stringPoints.length);
            design.stringPoints.forEach(point => {
                const stringPoint = { x: point.x, y: point.y, z: point.z };
                stringPoints.push(stringPoint);
            });
            // Update the string line after importing points
            if (typeof updateStringLine === 'function') {
                updateStringLine();
            }
        }
        
        // Import beads - create them directly and track completion
        let beadsImported = 0;
        const totalBeads = design.beads ? design.beads.length : 0;
        
        if (totalBeads > 0) {
            console.log('🔴 Importing beads:', totalBeads);
            
            design.beads.forEach(beadData => {
                try {
                    // Create sprite directly from saved imageUrl
                    if (beadData.imageUrl) {
                        const textureLoader = new THREE.TextureLoader();
                        textureLoader.load(beadData.imageUrl, (texture) => {
                            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
                            const sprite = new THREE.Sprite(material);
                            
                            // Set position
                            if (beadData.position) {
                                sprite.position.set(
                                    beadData.position.x || 0,
                                    beadData.position.y || 0.1,
                                    beadData.position.z || 0
                                );
                            }
                            
                            // Set scale
                            if (beadData.scale) {
                                sprite.scale.set(
                                    beadData.scale.x || 1,
                                    beadData.scale.y || 1,
                                    beadData.scale.z || 1
                                );
                            }
                            
                            // Set rotation
                            if (beadData.rotation !== undefined) {
                                sprite.material.rotation = beadData.rotation;
                            }
                            
                            // Restore userData
                            if (beadData.userData) {
                                sprite.userData = beadData.userData;
                            }
                            
                            // Add to scene and beads array
                            beads.push(sprite);
                            scene.add(sprite);
                            
                            beadsImported++;
                            console.log(`✅ Bead imported successfully (${beadsImported}/${totalBeads})`);
                            
                            // Call saveState when all beads are loaded
                            if (beadsImported === totalBeads) {
                                console.log('📦 All beads loaded, saving state...');
                                saveState();
                            }
                        }, undefined, (error) => {
                            console.error('❌ Failed to load bead texture:', error);
                            beadsImported++;
                            // Still call saveState even if some beads failed to load
                            if (beadsImported === totalBeads) {
                                console.log('📦 Bead loading complete (with errors), saving state...');
                                saveState();
                            }
                        });
                    } else {
                        console.warn('⚠️ No imageUrl found for bead, skipping');
                        beadsImported++;
                        if (beadsImported === totalBeads) {
                            console.log('📦 Bead loading complete, saving state...');
                            saveState();
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to import bead:', error);
                    beadsImported++;
                    if (beadsImported === totalBeads) {
                        console.log('📦 Bead loading complete (with errors), saving state...');
                        saveState();
                    }
                }
            });
        } else {
            // No beads to import, save state immediately
            saveState();
        }
        
        // Auto-fit the imported design
        if (typeof window.performBasicSmartFraming === 'function') {
            console.log('🎯 Auto-fitting imported design...');
            window.performBasicSmartFraming();
        }
        
        // Function to complete the import process
        function completeImport() {
            // Close the modal
            closeSavedModal();
            
            // Show success message
            const importSuccessText = window.getTranslation('import-success-imported') || 'Design "${designName}" imported successfully!';
            showSaveSuccess(importSuccessText.replace('${designName}', design.name));
            
            console.log('✅ Design imported and saved successfully:', design.name);
        }
        
        // If there are beads being loaded asynchronously, wait for saveState to be called
        // Otherwise, complete immediately
        if (totalBeads > 0) {
            // Delay completion slightly to ensure saveState has been called
            setTimeout(completeImport, 100);
        } else {
            completeImport();
        }
        
    } catch (error) {
        console.error('❌ Failed to import design:', error);
        showSaveError(window.getTranslation('import-error-failed') || 'Failed to import design. Please try again.');
    }
}

/**
 * Clear current design (string and beads)
 */
function clearCurrentDesign() {
    // Clear string points
    if (typeof stringPoints !== 'undefined') {
        stringPoints.length = 0;
    }
    
    // Clear beads
    if (typeof beads !== 'undefined') {
        beads.forEach(bead => {
            if (bead && bead.parentNode) {
                scene.remove(bead);
            }
        });
        beads.length = 0;
    }
    
    // Redraw scene
    if (typeof updateStringLine === 'function') {
        updateStringLine();
    }
    
    console.log('🧹 Current design cleared');
}

/**
 * Create bead from saved data
 */
function createBeadFromData(beadData) {
    try {
        console.log('🔵 Creating bead from data:', beadData);
        
        if (typeof createBead === 'function') {
            // Get the bead object using the objectId from userData
            const objectId = beadData.userData ? beadData.userData.objectId : null;
            if (!objectId) {
                console.warn('⚠️ No objectId found in bead userData');
                return null;
            }
            
            const beadObj = getObjectById(objectId);
            if (!beadObj) {
                console.warn('⚠️ Bead object not found for ID:', objectId);
                return null;
            }
            
            // Get the size from userData or use default
            const size = (beadData.userData && beadData.userData.size) || 10;
            
            // Create the bead - createBead expects (obj, size, callback)
            createBead(beadObj, size, (createdBead) => {
                if (createdBead) {
                    // Set the position from saved data
                    if (beadData.position) {
                        createdBead.position.set(
                            beadData.position.x || 0,
                            beadData.position.y || 0.1, // Default height
                            beadData.position.z || 0
                        );
                    }
                    
                    // Set the scale from saved data
                    if (beadData.scale) {
                        createdBead.scale.set(
                            beadData.scale.x || 1,
                            beadData.scale.y || 1,
                            beadData.scale.z || 1
                        );
                    }
                    
                    // Set rotation if available
                    if (beadData.rotation !== undefined) {
                        createdBead.material.rotation = beadData.rotation;
                    }
                    
                    // Restore full user data
                    if (beadData.userData) {
                        createdBead.userData = { ...createdBead.userData, ...beadData.userData };
                    }
                    
                    console.log('✅ Bead recreated successfully at position:', createdBead.position);
                    return createdBead;
                } else {
                    console.warn('⚠️ Failed to create bead - callback returned null');
                    return null;
                }
            });
            
        } else {
            console.warn('⚠️ createBead function not available');
            return null;
        }
    } catch (error) {
        console.error('❌ Failed to create bead from data:', error);
        return null;
    }
}

