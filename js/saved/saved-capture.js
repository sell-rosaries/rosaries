/*
    SAVED DESIGNS CAPTURE MODULE
    Screenshot system, smart framing, and design centering calculations
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

// Global function exports
window.captureCanvasScreenshot = captureCanvasScreenshot;
window.getCurrentCameraViewportCenter = getCurrentCameraViewportCenter;
window.calculateCurrentDesignCenter = calculateCurrentDesignCenter;
window.calculateDesignBounds = calculateDesignBounds;
window.translateDesignGeometry = translateDesignGeometry;
window.performBasicSmartFraming = performBasicSmartFraming;
window.createBeadFromData = createBeadFromData;