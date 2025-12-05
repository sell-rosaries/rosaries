/*
    SAVED DESIGNS PREVIEW MODULE
    Preview modal, import from preview, and design viewing functionality
*/

/**
 * Show confirmation dialog for importing a design
 */
function showImportConfirmation(designId, designName) {
    
    
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
        
        document.body.removeChild(dialog);
        importDesign(designId);
    });
    
    dialog.querySelector('#cancel-import-btn').addEventListener('click', () => {
        
        document.body.removeChild(dialog);
    });
    
    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            
            document.body.removeChild(dialog);
        }
    });
}

/**
 * Show confirmation dialog for deleting a design
 */
function showDeleteConfirmation(designId, designName) {
    
    
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
            <h3 style="margin: 0 0 15px 0; color: #333;">${window.getTranslation('confirm-delete-title') || 'Delete Design?'}</h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                ${window.getTranslation('confirm-delete-single-desc') || 'This action cannot be undone.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="confirm-delete-btn" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                ">${window.getTranslation('confirm-delete-yes') || 'Yes, Delete'}</button>
                <button id="cancel-delete-btn" style="
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                ">${window.getTranslation('confirm-cancel') || 'Cancel'}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Handle button clicks
    dialog.querySelector('#confirm-delete-btn').addEventListener('click', () => {
        
        document.body.removeChild(dialog);
        confirmDelete(designId);
    });
    
    dialog.querySelector('#cancel-delete-btn').addEventListener('click', () => {
        
        document.body.removeChild(dialog);
    });
    
    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            
            document.body.removeChild(dialog);
        }
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
    
    
}

/**
 * Close design preview modal
 */
function closeDesignPreviewModal() {
    const modal = document.getElementById('design-preview-modal');
    if (modal) {
        modal.remove();
        window.currentPreviewDesign = null;
        
    }
}

/**
 * Import design from preview modal
 */
function importFromPreview(designId) {
    
    
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

// Global function exports
window.showImportConfirmation = showImportConfirmation;
window.showDeleteConfirmation = showDeleteConfirmation;
window.showDesignPreviewModal = showDesignPreviewModal;
window.closeDesignPreviewModal = closeDesignPreviewModal;
window.importFromPreview = importFromPreview;