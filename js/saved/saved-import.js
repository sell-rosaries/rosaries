/*
    SAVED DESIGNS IMPORT MODULE
    Import/export operations, import mode toggle, and design importing
*/

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
 * Toggle delete mode - legacy function maintained for compatibility
 */
function setupDeleteMode() {
    // Legacy function maintained for compatibility
    console.log('🔧 Legacy setupDeleteMode called - using clean delete mode instead');
}

/**
 * Exit delete mode - legacy function maintained for compatibility
 */
function exitDeleteMode() {
    // Legacy function maintained for compatibility
    console.log('🔧 Legacy exitDeleteMode called - using clean delete mode instead');
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    if (type === 'success') {
        showSaveSuccess(message);
    } else if (type === 'warning') {
        showSaveError(message);
    } else {
        showSaveSuccess(message);
    }
}

// Global function exports
window.toggleImportMode = toggleImportMode;
window.importDesign = importDesign;
window.clearCurrentDesign = clearCurrentDesign;
window.setupDeleteMode = setupDeleteMode;
window.exitDeleteMode = exitDeleteMode;
window.showAlert = showAlert;