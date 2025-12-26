/*
    SAVED DESIGNS UI MODULE
    Design card generation, grid layout, and UI components
*/

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
 * Setup click listeners for saved design cards
 */
function setupDesignCardClickListeners() {
    const designCards = document.querySelectorAll('.clickable-design');
    designCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const designId = card.getAttribute('data-design-id');
            const designName = card.getAttribute('data-design-name');
            
            
            
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

// Global function exports
window.getDesignSlotNumber = getDesignSlotNumber;
window.generateDesignCardHTML = generateDesignCardHTML;
window.generateStaticDesignGrid = generateStaticDesignGrid;
window.generateEmptySlotHTML = generateEmptySlotHTML;
window.setupDesignCardClickListeners = setupDesignCardClickListeners;