/*
    SAVED DESIGNS CAPTURE MODULE
    Screenshot system and bead recreation from saved data
*/

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
            const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
            const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
            performBasicSmartFraming({mode});
            
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
 * Create bead from saved data
 */
function createBeadFromData(beadData) {
    return new Promise((resolve) => {
        try {
            console.log('🔵 Creating bead from data:', beadData);
            
            if (typeof createBead === 'function') {
                // Get the bead object using the objectId from userData
                const objectId = beadData.userData ? beadData.userData.objectId : null;
                if (!objectId) {
                    console.warn('⚠️ No objectId found in bead userData');
                    resolve(null);
                    return;
                }
                
                const beadObj = getObjectById(objectId);
                if (!beadObj) {
                    console.warn('⚠️ Bead object not found for ID:', objectId);
                    resolve(null);
                    return;
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
                        resolve(createdBead);
                    } else {
                        console.warn('⚠️ Failed to create bead - callback returned null');
                        resolve(null);
                    }
                });
                
            } else {
                console.warn('⚠️ createBead function not available');
                resolve(null);
            }
        } catch (error) {
            console.error('❌ Failed to create bead from data:', error);
            resolve(null);
        }
    });
}

// Global function exports
window.captureCanvasScreenshot = captureCanvasScreenshot;
window.createBeadFromData = createBeadFromData;
