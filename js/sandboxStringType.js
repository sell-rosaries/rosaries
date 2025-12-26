/*
    SANDBOX STRING TYPE TRACKER
    Tracks and manages the current string type in the sandbox
*/

// String type constants
const STRING_TYPES = {
    NONE: 'none',
    PEN: 'pen',
    PRESET: 'preset',
    MIXED: 'mixed'
};

// Current string type state
let currentStringType = STRING_TYPES.NONE;

/**
 * Get the current string type
 */
function getCurrentStringType() {
    return currentStringType;
}

/**
 * Set the string type and save to localStorage
 */
function setStringType(type) {


    currentStringType = type;

    // Save to localStorage for persistence
    try {
        localStorage.setItem('sandboxStringType', type);

    } catch (e) {
        console.warn('⚠️ Could not save to localStorage:', e);
    }
}

/**
 * Update string type based on current state
 * This is the main logic that determines what type the string is
 */
function updateStringType() {
    // Check both active and committed paths
    const hasString = stringPoints.length > 0 || (typeof stringPaths !== 'undefined' && stringPaths.length > 0);

    if (!hasString) {
        setStringType(STRING_TYPES.NONE);
        return;
    }

    // Determine the type based on current state and tracking flags
    let detectedType = STRING_TYPES.PEN; // Default assumption

    if (hasPenDrawing && hasPresetImport) {
        detectedType = STRING_TYPES.MIXED;
    } else if (hasPresetImport) {
        detectedType = STRING_TYPES.PRESET;
    } else if (hasPenDrawing) {
        detectedType = STRING_TYPES.PEN;
    } else {
        // Fallback: determine by string characteristics
        detectedType = determineStringTypeByPoints();
    }

    setStringType(detectedType);
}

/**
 * Determine string type by analyzing the string points
 * This is a fallback method to analyze the geometry
 */
function determineStringTypeByPoints() {
    let pointsToCheck = stringPoints;
    if (pointsToCheck.length === 0 && typeof stringPaths !== 'undefined' && stringPaths.length > 0) {
        pointsToCheck = stringPaths[0]; // Check first committed path
    }

    if (pointsToCheck.length === 0) {
        return STRING_TYPES.NONE;
    }

    // Preset patterns typically have smoother, more regular curves
    // Pen drawings are more organic and irregular

    // Check if string has preset-like characteristics
    if (isStringPatternPreset(pointsToCheck)) {
        return STRING_TYPES.PRESET;
    } else {
        return STRING_TYPES.PEN;
    }
}

/**
 * Check if the string points match a preset pattern
 */
function isStringPatternPreset(points) {
    if (points.length < 10) return false;

    // Calculate point spacing regularity
    const spacings = [];
    for (let i = 1; i < Math.min(points.length, 50); i++) {
        // Manual distance calculation for plain objects or Vector3
        const dx = points[i].x - points[i - 1].x;
        const dz = points[i].z - points[i - 1].z;
        const spacing = Math.sqrt(dx * dx + dz * dz);
        spacings.push(spacing);
    }

    if (spacings.length === 0) return false;

    // Check if spacing is relatively uniform (preset characteristic)
    const avgSpacing = spacings.reduce((a, b) => a + b) / spacings.length;
    const variance = spacings.reduce((sum, spacing) => sum + Math.pow(spacing - avgSpacing, 2), 0) / spacings.length;
    const coefficientOfVariation = Math.sqrt(variance) / avgSpacing;

    // Low coefficient of variation indicates regular spacing (preset)
    return coefficientOfVariation < 0.3;
}

/**
 * Reset tracking flags when string is cleared
 */
function resetStringTracking() {
    hasPenDrawing = false;
    hasPresetImport = false;
    localStorage.removeItem('sandboxStringType');
    currentStringType = STRING_TYPES.NONE;

    updateStringType();
}

/**
 * Initialize the sandbox string type system
 */
function initSandboxStringType() {
    // Load from localStorage
    try {
        const savedType = localStorage.getItem('sandboxStringType');
        if (savedType && Object.values(STRING_TYPES).includes(savedType)) {
            currentStringType = savedType;

        } else {
            currentStringType = STRING_TYPES.NONE;
        }
    } catch (e) {
        console.warn('⚠️ Could not load from localStorage:', e);
        currentStringType = STRING_TYPES.NONE;
    }

    // Update UI
    updateStringType();

}

/**
 * Get human-readable description of current string type
 */
function getStringTypeDescription(type = null) {
    const currentType = type || currentStringType;

    switch (currentType) {
        case STRING_TYPES.NONE:
            return 'No string in sandbox';
        case STRING_TYPES.PEN:
            return 'Pen-drawn string';
        case STRING_TYPES.PRESET:
            return 'Preset template string';
        case STRING_TYPES.MIXED:
            return 'Mixed: preset + pen drawn';
        default:
            return 'Unknown string type';
    }
}



// Tracking flags
let hasPenDrawing = false;
let hasPresetImport = false;

// Make functions globally accessible
window.getCurrentStringType = getCurrentStringType;
window.setStringType = setStringType;
window.updateStringType = updateStringType;
window.resetStringTracking = resetStringTracking;
window.initSandboxStringType = initSandboxStringType;
window.getStringTypeDescription = getStringTypeDescription;