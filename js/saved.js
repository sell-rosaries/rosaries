/*
    SAVED DESIGNS MODULE
    Save, import, and delete rosary designs with localStorage persistence
*/

// Storage key for saved designs
const SAVED_DESIGNS_KEY = 'rosary-saved-designs';

// Import mode flag
let importModeActive = false;

// ========================================
// CLEAN DELETE FUNCTIONALITY - REBUILT FROM SCRATCH
// ========================================

// Global variables for clean delete mode - DECLARED AT TOP TO AVOID HOISTING ISSUES
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
            const importText = currentLanguage === 'ar' ? 'استيراد' : 'Import Design';
            textSpan.textContent = importText;
        }
    }
}

// Make function globally available for language system
window.updateImportButtonText = updateImportButtonText;

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
                name: `${window.getTranslation('design-singular') || 'Design'} ${existingSaves.length + 1}`,
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
 * Helper function to determine which slot number a design belongs to (1-6)
 */
function getDesignSlotNumber(designId) {
    const savedDesigns = getSavedDesigns();
    const designIndex = savedDesigns.findIndex(design => design.id === designId);
    return designIndex >= 0 ? (designIndex + 1) : 1;
}

/**
 * Generate HTML for a saved design card
 */
function generateDesignCardHTML(design, isPopulated = false) {
    const thumbnailSrc = design.thumbnail || '';
    const cardClass = isPopulated ? "saved-design-card saved-design-populated clickable-design" : "saved-design-card";
    
    // Create localized design name based on current language setting
    const designSlotNumber = getDesignSlotNumber(design.id);
    const designLabel = window.getTranslation('design-singular') || 'Design';
    const localizedName = `${designLabel} ${designSlotNumber}`;
    
    console.log('🎯 Generated card for design:', localizedName, 'isPopulated:', isPopulated);
    
    return `
        <div class="${cardClass}" data-design-id="${design.id}" data-design-name="${design.name}">
            <div class="saved-design-preview">
                ${thumbnailSrc ? 
                    `<img src="${thumbnailSrc}" alt="Design preview" class="design-thumbnail" />` :
                    `<div class="no-preview">No preview available</div>`
                }
            </div>
            <div class="design-info-overlay">
                <div class="design-name">${localizedName}</div>
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
    // Get translation for "Empty Slot" 
    const emptySlotText = window.getTranslation ? 
        (window.getTranslation('empty-slot') || 'Empty Slot') : 
        'Empty Slot';
    
    return `
        <div class="saved-design-card saved-design-empty" data-slot="${slotNumber}">
            <div class="saved-design-preview">
                <div class="empty-slot-content">
                    <div class="empty-slot-main-text">${emptySlotText}</div>
                    <div class="empty-slot-number">${slotNumber}</div>
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
    cleanDeleteModeActive = !cleanDeleteModeActive;
    if (cleanDeleteModeActive) {
        // Entering delete mode
        console.log('🗑️ Clean delete button clicked! cleanDeleteModeActive:', cleanDeleteModeActive);
        setTimeout(() => {
            if (cleanDeleteModeActive) {
                console.log('✅ Activating delete mode...');
                setupDeleteMode();
            }
        }, 50);
    } else {
        // Exiting delete mode
        console.log('🔄 Exiting delete mode...');
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
function confirmBulkDelete() {
    const selectedCards = document.querySelectorAll('.clean-design-checkbox:checked');
    const count = selectedCards.length;
    
    if (count === 0) {
        showAlert('No designs selected for deletion', 'warning');
        return;
    }
    
    const message = `Are you sure you want to delete ${count} design${count > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (confirm(message)) {
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
        
        showAlert(`${count} design${count > 1 ? 's' : ''} deleted successfully`, 'success');
        
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
            <span class="btn-text">${window.getTranslation('delete-design') || 'Delete Design'}</span>
        `;
    }
}

/**
 * Show bulk delete confirmation dialog
 */
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
    
    if (importModeActive) {
        // Exit import mode
        importModeActive = false;
        console.log('❌ Import mode deactivated');
        
        // Reset import button styling
        const importBtn = document.getElementById('import-design-btn');
        if (importBtn) {
            importBtn.style.background = '';
            importBtn.style.color = '';
            importBtn.style.boxShadow = '';
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
                <span class="btn-text"></span>
            `;
            updateImportButtonText(); // Update text using the centralized function
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
                ">${window.getTranslation('confirm-import-cancel') || 'Cancel'}</button>
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
                        <span>${currentLanguage === 'ar' ? 'استيراد' : 'Import'}</span>
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
                background: var(--primary-500);
                color: white;
            }
            
            .preview-btn-import:hover {
                background: var(--primary-600);
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
 * Confirm delete function for individual designs
 */
function confirmDelete(designId) {
    console.log('🗑️ Confirming delete for design:', designId);
    
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
        
        console.log('🗑️ Deleted design:', designToDelete.name);
        
        // Refresh modal
        populateSavedModal();
        
        showSaveSuccess(`${designToDelete.name} deleted successfully.`);
        
    } catch (error) {
        console.error('❌ Failed to delete design:', error);
        showSaveError('Failed to delete design. Please try again.');
    }
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

/**
 * ========================================
 * CLEAN DELETE FUNCTIONALITY - REBUILT FROM SCRATCH
 * ========================================
 */

/**
 * CLEAN: Toggle delete mode on/off
 */
function cleanToggleDeleteMode() {
    console.log('🗑️ Clean delete button clicked! cleanDeleteModeActive:', cleanDeleteModeActive);
    
    const savedDesigns = getSavedDesigns();
    
    if (!cleanDeleteModeActive && savedDesigns.length === 0) {
        showSaveError(window.getTranslation('delete-error-no-designs') || 'No designs to delete!');
        return;
    }
    
    if (!cleanDeleteModeActive) {
        // First click: Enter delete mode
        console.log('✅ Activating delete mode...');
        cleanDeleteModeActive = true;
        cleanSelectedDesigns.clear();
        
        const deleteBtn = document.getElementById('delete-design-btn');
        if (deleteBtn) {
            deleteBtn.style.background = 'var(--error)';
            deleteBtn.style.color = 'white';
            console.log('🟢 Delete button styled to active state');
        }
        
        showSaveSuccess(window.getTranslation('delete-mode-instruction') || 'Delete mode: Click designs to select, then click "Delete" again to delete.');
        console.log('🔄 Setting up delete mode with checkboxes...');
        cleanSetupDeleteMode();
    } else {
        // Second click: Check selections and show confirmation
        console.log('🔄 Second click - checking selections...');
        if (cleanSelectedDesigns.size === 0) {
            // No designs selected - just exit delete mode
            console.log('🔄 No designs selected, exiting delete mode');
            cleanExitDeleteMode();
        } else {
            // Show confirmation for bulk delete
            console.log('🗑️ Deleting', cleanSelectedDesigns.size, 'designs');
            cleanShowBulkDeleteConfirmation();
        }
    }
}

/**
 * CLEAN: Setup delete mode - add checkboxes dynamically
 */
function cleanSetupDeleteMode() {
    console.log('🔄 Setting up delete mode - adding checkboxes...');
    
    // TEMPORARY FIX: Disable gallery checkbox styles if they might be causing fake squares
    console.log('🎨 TEMPORARY CSS FIX: Disabling gallery checkbox styles...');
    const galleryCheckboxCSS = Array.from(document.styleSheets).flatMap(sheet => {
        try {
            return Array.from(sheet.cssRules || []);
        } catch (e) {
            return [];
        }
    }).filter(rule => rule.selectorText && rule.selectorText.includes('.gallery-checkbox'));
    
    galleryCheckboxCSS.forEach(rule => {
        console.log('📋 Found gallery checkbox CSS rule:', rule.selectorText);
        rule.disabled = true; // Temporarily disable
    });
    
    // ENHANCED FIX: Check for any remaining gallery elements
    const allGalleryElements = document.querySelectorAll('[class*="gallery"], [class*="checkbox"], [class*="square"], [class*="check"]');
    console.log('🎯 COMPREHENSIVE CHECK: Found', allGalleryElements.length, 'elements with gallery/checkbox-related classes');
    
    allGalleryElements.forEach((element, index) => {
        const className = element.className || '';
        console.log(`🎯 POTENTIAL ARTIFACT ${index + 1}:`, {
            tagName: element.tagName,
            className: className,
            position: window.getComputedStyle(element).position,
            top: window.getComputedStyle(element).top,
            left: window.getComputedStyle(element).left,
            width: window.getComputedStyle(element).width,
            height: window.getComputedStyle(element).height,
            isVisible: element.offsetWidth > 0 && element.offsetHeight > 0
        });
        
        // Remove gallery-related elements EXCEPT clean design elements
        if (className.includes('gallery') && !className.includes('clean-')) {
            console.log('🧹 REMOVING GALLERY ARTIFACT:', className);
            element.remove();
        }
    });
    
    // Add body class to enable checkbox visibility
    document.body.classList.add('clean-delete-mode-active');
    
    // FIX: Hide design info overlays that create fake squares
    console.log('🧹 FIX: Hiding design info overlays that create fake squares...');
    const designInfoOverlays = document.querySelectorAll('.design-info-overlay');
    designInfoOverlays.forEach(overlay => {
        console.log('🧹 Hiding design info overlay:', overlay.className);
        overlay.style.display = 'none';
    });
    
    // Add checkboxes to all populated design cards
    const populatedCards = document.querySelectorAll('.saved-design-populated[data-design-id]');
    
    console.log('🔍 Found', populatedCards.length, 'populated design cards');
    
    // MUTATION OBSERVER: Monitor for any elements being added after cleanup
    console.log('📡 SETTING UP MUTATION OBSERVER for fake square detection...');
    window.cleanDeleteObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const style = window.getComputedStyle(node);
                    const className = node.className || '';
                    const isVisible = node.offsetWidth > 0 && node.offsetHeight > 0;
                    
                    // Enhanced detection for fake elements
                    const isPotentiallyProblematic = (
                        style.position === 'absolute' && 
                        (style.top || style.left) &&
                        isVisible &&
                        (style.width === style.height || parseFloat(style.width) <= 30 && parseFloat(style.height) <= 30) // Small square-like elements
                    );
                    
                    if (isPotentiallyProblematic || className.includes('overlay') || className.includes('checkbox')) {
                        console.log('🚨 ENHANCED DETECTION - NEW ELEMENT:', {
                            tagName: node.tagName,
                            className: className,
                            id: node.id || 'no-id',
                            position: style.position,
                            top: style.top,
                            left: style.left,
                            width: style.width,
                            height: style.height,
                            isVisible: isVisible,
                            isSquare: isPotentiallyProblematic,
                            computedBoxShadow: style.boxShadow,
                            computedBackground: style.background
                        });
                        
                        // More selective removal - only remove clearly problematic elements
                        const shouldRemove = (
                            // Remove overlay elements that might create visual artifacts
                            (className.includes('overlay') && !className.includes('clean-')) ||
                            // Remove checkbox elements EXCEPT our clean design checkboxes and legitimate gallery checkboxes
                            (className.includes('checkbox') && !className.includes('clean-') && !className.includes('gallery-')) ||
                            // Remove square-like positioned elements that are visible and small
                            (isPotentiallyProblematic && !className.includes('clean-'))
                        );
                        
                        if (shouldRemove) {
                            console.log('🧹 ENHANCED REMOVAL:', {
                                action: 'removing problematic element',
                                className: className,
                                reason: isPotentiallyProblematic ? 'square-like positioned element' : 'gallery/overlay artifact'
                            });
                            node.remove();
                        }
                    }
                }
            });
        });
    });
    
    // Observe the entire document for elements being added to saved design cards
    window.cleanDeleteObserver.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true
    });
    
    // CSS CASCADE DEBUGGING: Check if saved design cards inherit gallery styles
    populatedCards.forEach(card => {
        const cardStyle = window.getComputedStyle(card);
        console.log('🎨 CSS INHERITANCE CHECK for card:', {
            className: card.className,
            hasPosition: cardStyle.position,
            hasZIndex: cardStyle.zIndex,
            hasBackground: cardStyle.background,
            hasOverflow: cardStyle.overflow
        });
        
        // Check if card has any children that might be styled as squares
        const cardChildren = card.children;
        console.log('👶 Card children for CSS analysis:', {
            childCount: cardChildren.length,
            childClasses: Array.from(cardChildren).map(child => child.className)
        });
    });
    
    populatedCards.forEach(card => {
        // DEBUGGING: Log ALL elements on the card before ANY cleanup
        const allElements = card.querySelectorAll('*');
        console.log('🚨 COMPREHENSIVE ANALYSIS - Card has', allElements.length, 'total elements:');
        allElements.forEach((el, index) => {
            const computedStyle = window.getComputedStyle(el);
            console.log('  Element', index, ':', {
                tagName: el.tagName,
                className: el.className,
                id: el.id || 'no-id',
                position: computedStyle.position,
                opacity: computedStyle.opacity,
                display: computedStyle.display,
                zIndex: computedStyle.zIndex,
                width: computedStyle.width,
                height: computedStyle.height,
                backgroundColor: computedStyle.backgroundColor,
                hasContent: !!el.textContent.trim()
            });
        });
    });
    
    populatedCards.forEach(card => {
        const designId = card.getAttribute('data-design-id');
        
        console.log('🔍 DEBUGGING CARD:', designId);
        
        // COMPREHENSIVE CLEANUP: Remove ALL checkbox-related elements first
        const allInputs = card.querySelectorAll('input');
        const allLabels = card.querySelectorAll('label');
        const checkboxRelated = card.querySelectorAll('[class*="checkbox"], [class*="gallery"], [class*="clean"]');
        
        console.log('🔍 Card', designId, 'elements found:', {
            allInputs: allInputs.length,
            allLabels: allLabels.length,
            checkboxRelated: checkboxRelated.length
        });
        
        // Log details of all checkbox-related elements
        checkboxRelated.forEach((element, index) => {
            console.log('🔍 Element', index, ':', {
                tagName: element.tagName,
                className: element.className,
                id: element.id || 'no-id',
                outerHTML: element.outerHTML.substring(0, 200) + '...'
            });
        });
        
        // Remove ALL inputs first
        allInputs.forEach((input, index) => {
            console.log('🧹 Removing input', index, ':', {
                type: input.type,
                className: input.className,
                id: input.id || 'no-id'
            });
            input.remove();
        });
        
        // SPECIFIC FIX: Remove any leftover gallery checkbox elements
        const oldGalleryCheckboxes = card.querySelectorAll('.gallery-checkbox, .gallery-checkbox-label');
        if (oldGalleryCheckboxes.length > 0) {
            console.log('🎯 SPECIFIC FIX: Found', oldGalleryCheckboxes.length, 'leftover gallery checkbox elements');
            oldGalleryCheckboxes.forEach((element, index) => {
                console.log('🧹 Removing leftover gallery element', index, ':', {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id || 'no-id'
                });
                element.remove();
            });
        }
        
        // NUCLEAR OPTION: Remove ANY elements that could be fake squares
        console.log('💥 NUCLEAR OPTION: Removing ALL potential square elements on card', designId);
        
        const potentialSquares = card.querySelectorAll('div, span, label, input');
        potentialSquares.forEach((element, index) => {
            const style = window.getComputedStyle(element);
            const isSquare = (
                (style.position === 'absolute' && (style.top || style.left)) ||
                element.className.includes('overlay') ||
                element.className.includes('info') ||
                element.className.includes('design-info') ||  // More specific than 'info'
                element.id.includes('overlay') ||
                element.id.includes('info')
            );
            
            if (isSquare) {
                console.log('💥 NUCLEAR REMOVAL:', {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id || 'no-id',
                    reason: 'Potential fake square element'
                });
                
                // Keep only essential elements for functionality
                const essentialClasses = ['design-thumbnail', 'saved-design-preview'];
                const essentialTags = ['IMG'];
                
                const isEssential = essentialClasses.some(cls => element.className.includes(cls)) || 
                                  essentialTags.includes(element.tagName);
                
                if (!isEssential) {
                    console.log('🧹 NUCLEAR REMOVING element:', {
                        tagName: element.tagName,
                        className: element.className,
                        id: element.id || 'no-id'
                    });
                    element.remove();
                } else {
                    console.log('💎 KEEPING essential element:', {
                        tagName: element.tagName,
                        className: element.className,
                        id: element.id || 'no-id'
                    });
                }
            }
        });
        
        // ULTRA-AGGRESSIVE DEBUGGING: Find ANY elements that could be squares
        console.log('🔍 ULTRA-AGGRESSIVE SQUARE DETECTION for card', designId);
        
        // Check for ANY elements with specific characteristics that could create squares
        const allElements = card.querySelectorAll('*');
        allElements.forEach((el, index) => {
            const style = window.getComputedStyle(el);
            
            // Broad criteria for potential fake squares:
            // - Any absolute positioned elements
            // - Elements with specific positioning that could appear as squares
            // - Elements with opacity < 1 that might be semi-visible
            if (style.position === 'absolute' || 
                (style.opacity !== '1' && style.opacity !== '0') ||
                (style.display !== 'none' && style.visibility !== 'hidden')) {
                
                console.log('🚨 POTENTIAL SQUARE ELEMENT', index, ':', {
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id || 'no-id',
                    position: style.position,
                    top: style.top,
                    left: style.left,
                    opacity: style.opacity,
                    display: style.display,
                    visibility: style.visibility,
                    zIndex: style.zIndex,
                    width: style.width,
                    height: style.height,
                    backgroundColor: style.backgroundColor,
                    border: style.border,
                    borderRadius: style.borderRadius
                });
            }
        });
        
        // Check for elements being created AFTER our cleanup (setTimeout to catch late creation)
        setTimeout(() => {
            console.log('🔍 LATE CREATION CHECK for card', designId);
            const lateElements = card.querySelectorAll('*');
            if (lateElements.length > allElements.length) {
                console.log('🚨 LATE CREATION DETECTED! Elements increased from', allElements.length, 'to', lateElements.length);
                for (let i = allElements.length; i < lateElements.length; i++) {
                    const el = lateElements[i];
                    console.log('🚨 NEW ELEMENT CREATED:', {
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id || 'no-id',
                        outerHTML: el.outerHTML.substring(0, 300)
                    });
                }
            }
        }, 100);

        // Enhanced element cleanup for any absolute-positioned elements
        const elementCleanup = card.querySelectorAll('*');
        elementCleanup.forEach((element, index) => {
            const style = window.getComputedStyle(element);
            
            // Check for elements that could be fake squares:
            // - Absolute positioned elements
            // - Elements with specific z-index that might be visible
            // - Elements that could be styled as squares
            if (style.position === 'absolute' && 
                (style.display !== 'none' && style.visibility !== 'hidden') &&
                (element.className.includes('gallery') || element.className.includes('checkbox') ||
                 element.id.includes('checkbox') || element.id.includes('gallery'))) {
                
                console.log('🚨 POTENTIAL FAKE SQUARE:', index, ':', {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id || 'no-id',
                    position: style.position,
                    opacity: style.opacity,
                    display: style.display,
                    visibility: style.visibility,
                    zIndex: style.zIndex,
                    width: style.width,
                    height: style.height,
                    background: style.backgroundColor,
                    border: style.border
                });
                
                // For debugging, let's try removing potentially problematic elements
                if (element.className.includes('gallery') || element.className.includes('checkbox') || 
                    element.id.includes('gallery') || element.id.includes('checkbox')) {
                    console.log('🧹 REMOVING POTENTIAL FAKE SQUARE:', element.className || element.id);
                    element.remove();
                }
            }
        });
        
        // FINAL CLEANUP: Double-check for any remaining elements
        const remainingElements = card.querySelectorAll('*');
        let fakeElementsFound = 0;
        remainingElements.forEach(element => {
            const style = window.getComputedStyle(element);
            if (style.position === 'absolute' && element.className.includes('checkbox')) {
                fakeElementsFound++;
                console.log('🚨 REMAINING FAKE ELEMENT:', {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id || 'no-id',
                    style: style.position + ', opacity: ' + style.opacity
                });
                element.remove();
            }
        });
        
        console.log('🔍 Final cleanup found', fakeElementsFound, 'fake elements on card', designId);
        
        // Add fresh checkbox HTML
        if (!card.querySelector('.clean-design-checkbox')) {
            const checkboxHTML = `
                <input type="checkbox" 
                       class="clean-design-checkbox" 
                       id="clean-checkbox-${designId}" 
                       data-design-id="${designId}">
                <label for="clean-checkbox-${designId}" class="clean-checkbox-label"></label>
            `;
            
            console.log('✅ Adding clean checkbox to card', designId);
            
            // SPECIFIC CLEANUP: Remove any leftover gallery checkboxes
            const leftoverGalleryElements = card.querySelectorAll('.gallery-checkbox, .gallery-checkbox-label, [class*="gallery"], [class*="checkbox"]:not(.clean-design-checkbox)');
            console.log('🎯 SPECIFIC FIX: Found', leftoverGalleryElements.length, 'leftover gallery checkbox elements');
            
            leftoverGalleryElements.forEach(element => {
                console.log('🧹 Removing leftover gallery element:', {
                    tagName: element.tagName,
                    className: element.className,
                    position: window.getComputedStyle(element).position,
                    top: window.getComputedStyle(element).top,
                    left: window.getComputedStyle(element).left
                });
                element.remove();
            });
            
            card.insertAdjacentHTML('afterbegin', checkboxHTML);
        } else {
            console.log('⚠️ Clean checkbox already exists on card', designId);
        }
        
        // Verify the clean checkbox was added correctly
        const cleanCheckbox = card.querySelector('.clean-design-checkbox');
        const cleanLabel = card.querySelector('.clean-checkbox-label');
        console.log('✅ Verification for card', designId, ':', {
            cleanCheckbox: !!cleanCheckbox,
            cleanLabel: !!cleanLabel,
            cleanCheckboxVisible: cleanCheckbox ? window.getComputedStyle(cleanCheckbox).opacity : 'N/A',
            cleanLabelVisible: cleanLabel ? window.getComputedStyle(cleanLabel).opacity : 'N/A'
        });
        
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
                    console.log('✅ Selected designs:', Array.from(cleanSelectedDesigns));
                }
            });
        }
    });
    
    console.log('✅ Clean delete mode setup complete - all old elements cleaned, fresh checkboxes added');
}

/**
 * CLEAN: Exit delete mode - remove all checkboxes
 */
function cleanExitDeleteMode() {
    console.log('🔄 Exiting delete mode...');
    cleanDeleteModeActive = false;
    cleanSelectedDesigns.clear();
    
    // Remove body class to hide checkboxes
    document.body.classList.remove('clean-delete-mode-active');
    
    // CLEANUP: Disconnect MutationObserver
    if (window.cleanDeleteObserver) {
        console.log('🧹 Disconnecting MutationObserver...');
        window.cleanDeleteObserver.disconnect();
        window.cleanDeleteObserver = null;
    }
    
    // FIX: Restore design info overlays after delete mode cleanup
    console.log('🔄 FIX: Restoring design info overlays...');
    const designInfoOverlays = document.querySelectorAll('.design-info-overlay');
    designInfoOverlays.forEach(overlay => {
        console.log('🔄 Restoring design info overlay:', overlay.className);
        overlay.style.display = '';
        overlay.style.opacity = '';
    });
    
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
    
    // COMPREHENSIVE CLEANUP: Remove ALL checkbox elements from saved designs
    const populatedCards = document.querySelectorAll('.saved-design-populated[data-design-id]');
    console.log('🧹 Cleaning up', populatedCards.length, 'saved design cards');
    
    populatedCards.forEach(card => {
        // Remove ALL input elements
        const allInputs = card.querySelectorAll('input');
        allInputs.forEach(input => {
            console.log('🧹 Removing input:', input.className, input.type, input.id || 'no-id');
            input.remove();
        });
        
        // Remove ALL label elements that might be related to checkboxes
        const allLabels = card.querySelectorAll('label');
        allLabels.forEach(label => {
            // Only remove labels that look like checkboxes
            if (label.className.includes('checkbox') || label.className.includes('gallery') || label.className.includes('clean')) {
                console.log('🧹 Removing checkbox label:', label.className, label.htmlFor || 'no-for');
                label.remove();
            }
        });
    });
    
    // RESTORE: Re-enable gallery checkbox styles after cleanup
    console.log('🎨 RESTORING: Re-enabling gallery checkbox styles...');
    const allCSS = Array.from(document.styleSheets).flatMap(sheet => {
        try {
            return Array.from(sheet.cssRules || []);
        } catch (e) {
            return [];
        }
    }).filter(rule => rule.selectorText && rule.selectorText.includes('.gallery-checkbox'));
    
    allCSS.forEach(rule => {
        if (rule.disabled) {
            console.log('📋 Restoring gallery checkbox CSS rule:', rule.selectorText);
            rule.disabled = false; // Re-enable
        }
    });
    
    console.log('✅ Clean delete mode exited - comprehensive cleanup complete');
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
                    <button class="clean-btn-cancel" onclick="cleanCancelDeleteConfirm()">Cancel</button>
                    <button class="clean-btn-confirm" onclick="cleanConfirmBulkDelete()">Delete</button>
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
        
        // Get current saved designs
        const savedDesigns = getSavedDesigns();
        
        // Remove selected designs from localStorage
        const updatedDesigns = savedDesigns.filter(design => !window.cleanDeleteIds.includes(design.id));
        localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(updatedDesigns));
        
        console.log('🗑️ Deleted designs:', window.cleanDeleteIds);
        
        // Close confirmation dialog
        cleanCancelDeleteConfirm();
        
        // Exit delete mode first
        cleanExitDeleteMode();
        
        // Refresh modal
        populateSavedModal();
        
        const count = window.cleanDeleteIds.length;
        showSaveSuccess(`Successfully deleted ${count} design${count > 1 ? 's' : ''}.`);
        
        console.log('✅ Bulk delete completed:', count, 'designs');
        
    } catch (error) {
        console.warn('Could not delete designs:', error);
        showSaveError(window.getTranslation('delete-error-failed') || 'Failed to delete designs. Please try again.');
        cleanCancelDeleteConfirm();
    }
}

// Make clean functions globally available
window.cleanToggleDeleteMode = cleanToggleDeleteMode;
window.cleanCancelDeleteConfirm = cleanCancelDeleteConfirm;
window.cleanConfirmBulkDelete = cleanConfirmBulkDelete;
window.confirmDelete = confirmDelete;
window.openSavedModal = openSavedModal;

/**
 * CLEAN: Inject styles for delete mode
 */
function injectSavedStyles() {
    // Add styles if not present
    if (!document.querySelector('#clean-delete-dialog-styles')) {
        const style = document.createElement('style');
        style.id = 'clean-delete-dialog-styles';
        style.textContent = `
            .clean-delete-backdrop {
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
            }
            
            .clean-delete-modal {
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: cleanConfirmSlide 0.3s ease-out;
            }
            
            @keyframes cleanConfirmSlide {
                from { opacity: 0; transform: scale(0.9) translateY(-20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            
            .clean-delete-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .clean-btn-cancel {
                background: #f3f4f6;
                color: #374151;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
            }
            
            .clean-btn-cancel:hover {
                background: #e5e7eb;
            }
            
            .clean-btn-confirm {
                background: #dc2626;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
            }
            
            .clean-btn-confirm:hover {
                background: #b91c1c;
            }
            
            /* Clean checkbox styles - completely isolated */
            .clean-design-checkbox {
                display: none;
            }
            
            .clean-checkbox-label {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                background: rgba(255, 255, 255, 0.98);
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                cursor: pointer;
                z-index: 20;
                transition: all 0.2s ease;
                opacity: 0;
                pointer-events: none;
            }
            
            /* Show checkboxes ONLY when delete mode is active */
            body.clean-delete-mode-active .clean-checkbox-label {
                opacity: 1;
                pointer-events: auto;
            }
            
            body.clean-delete-mode-active .clean-design-checkbox {
                /* Make checkboxes functional when active */
            }
            
            /* HIDE design info overlays during delete mode */
            body.clean-delete-mode-active .design-info-overlay {
                display: none !important;
            }
            
            .clean-design-checkbox:checked + .clean-checkbox-label {
                background: #dc2626;
                border-color: #b91c1c;
            }
            
            .clean-design-checkbox:checked + .clean-checkbox-label::before {
                content: '✕';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 14px;
                font-weight: bold;
            }
            
            .saved-design-card {
                position: relative;
            }
        `;
        document.head.appendChild(style);
    }
}

window.injectSavedStyles = injectSavedStyles;

