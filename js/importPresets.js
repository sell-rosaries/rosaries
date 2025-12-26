/*
    IMPORT PRESETS MODULE
    Handles importing SVG presets as drawable strings
*/

// SVG preset data embedded as strings
const PRESET_DATA = {
    'Bracelet': {
        name: 'Bracelet',
        path: 'M40,100 A90,50 0 1,0 220,100 A90,50 0 1,0 40,100',
        viewBox: [0, 0, 260, 200]
    },
    'Circle': {
        name: 'Circle',
        path: 'M120,20 A100,100 0 1,1 119.999,20',
        viewBox: [0, 0, 240, 240]
    },
    'Heart': {
        name: 'Heart',
        path: 'M120,200 C120,200 30,120 30,70 C30,40 55,20 80,20 C100,20 115,35 120,45 C125,35 140,20 160,20 C185,20 210,40 210,70 C210,120 120,200 120,200 Z',
        viewBox: [0, 0, 240, 220]
    },
    'Rosary': {
        name: 'Rosary',
        // Restructured as continuous path: top -> left side -> bottom -> tail -> bottom -> right side -> top
        path: 'M130 40 C 90 45 60 85 50 150 C 40 215 55 285 85 335 C 105 370 125 395 130 400 C 132 440 138 470 133 510 C 130 525 126 535 130 560 C 126 535 130 525 133 510 C 138 470 132 440 130 400 C 135 395 155 370 175 335 C 205 285 220 215 210 150 C 200 85 170 45 130 40',
        viewBox: [0, 0, 260, 560]
    }
};

/**
 * Parse SVG path data and convert to THREE.Vector3 points
 */
function parseSVGPath(pathData, viewBox) {
    const points = [];

    // Create a temporary SVG element to parse the path
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    svg.appendChild(path);

    // Get the total length of the path
    const totalLength = path.getTotalLength();

    // Sample points along the path
    const numPoints = Math.ceil(totalLength / 2); // Sample every ~2 units for smooth curves

    // ViewBox dimensions for scaling
    const [vbX, vbY, vbWidth, vbHeight] = viewBox;
    const maxDim = Math.max(vbWidth, vbHeight);
    const scale = 15 / maxDim; // Scale to fit in ~15 unit workspace

    // Center offset
    const centerX = vbX + vbWidth / 2;
    const centerY = vbY + vbHeight / 2;

    for (let i = 0; i <= numPoints; i++) {
        const distance = (i / numPoints) * totalLength;
        const point = path.getPointAtLength(distance);

        // Convert SVG coordinates to 3D world coordinates
        // SVG: +X right, +Y down
        // World: +X right, +Z up (using -Y as Z)
        // Flip both X and Z to rotate 180° (fix upside-down orientation)
        const worldX = -(point.x - centerX) * scale;
        const worldZ = (point.y - centerY) * scale;

        points.push(new THREE.Vector3(worldX, 0, worldZ));
    }

    return points;
}

/**
 * Open the import presets modal
 */
function openImportPresetsModal() {
    const modal = document.getElementById('import-presets-modal');
    if (modal) {
        // Populate the modal with latest content before showing
        populateImportPresetsModal();
        modal.classList.add('active');
    }
}

/**
 * Close the import presets modal
 */
function closeImportPresetsModal() {
    const modal = document.getElementById('import-presets-modal');
    if (modal) {
        modal.classList.remove('active');
    }

    // Also exit string mode and deselect the pen button when closing presets modal
    if (typeof exitStringMode === 'function') {
        exitStringMode();
    }
}

/**
 * Import a preset and replace current string
 */
function importPreset(presetKey) {
    const preset = PRESET_DATA[presetKey];
    if (!preset) {
        console.error('Preset not found:', presetKey);
        return;
    }

    // Show confirmation dialog
    showPresetImportConfirmation(preset);
}

/**
 * Show confirmation dialog before importing
 */
function showPresetImportConfirmation(preset) {
    // Create confirmation modal dynamically
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal active';
    confirmModal.id = 'import-confirm-modal';

    confirmModal.innerHTML = `
        <div class="modal-backdrop" onclick="closePresetImportConfirmation()"></div>
        <div class="modal-content modal-compact">
            <div class="modal-header-flex">
                <button class="btn-close-modal-flex" onclick="closePresetImportConfirmation()" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <h3>${getTranslation('import-confirm-title').replace('${preset}', getTranslation('preset-' + preset.name.toLowerCase()))}</h3>
            <p class="modal-subtitle">${getTranslation('import-confirm-message')}</p>
            
            <div class="modal-actions">
                <button class="btn-primary" id="confirm-import-btn">
                    ${getTranslation('import-confirm-btn')}
                </button>
                <button class="btn-secondary" onclick="closePresetImportConfirmation()">
                    ${getTranslation('cancel')}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);

    // Add event listener to confirm button
    document.getElementById('confirm-import-btn').addEventListener('click', () => {
        performImport(preset);
        closePresetImportConfirmation();
    });
}

/**
 * Close import confirmation dialog
 */
function closePresetImportConfirmation() {
    const confirmModal = document.getElementById('import-confirm-modal');
    if (confirmModal) {
        confirmModal.remove();
    }
}

/**
 * Perform the actual import - replace string with preset
 */
function performImport(preset) {

    // Clear everything first
    clearAllBeads();

    // Track that preset import has occurred
    if (typeof hasPresetImport !== 'undefined') {
        hasPresetImport = true;
    }

    // Set rosary mode flag for fit adjustments
    window.rosaryModeActive = (preset.name === 'Rosary');

    // Parse the SVG path and convert to 3D points
    const newPoints = parseSVGPath(preset.path, preset.viewBox);

    // Replace stringPoints with the new preset points
    // In new multi-string system, presets should be committed paths
    stringPoints.length = 0;

    // Commit to stringPaths
    if (typeof stringPaths !== 'undefined') {
        stringPaths.length = 0; // Ensure clean slate even if clearAllBeads missed it (safety)
        stringPaths.push(newPoints);
    } else {
        // Fallback if stringPaths not defined (shouldn't happen)
        stringPoints.push(...newPoints);
    }

    // Update the visual string line
    // This will now render stringPaths using stringMeshes
    updateStringLine();

    // Reset slider base to the new preset geometry
    if (typeof window.resetSliderBase === 'function') {
        window.resetSliderBase();
    }

    // Update string type tracking
    if (typeof updateStringType === 'function') {
        updateStringType();
    }

    // Save state for undo/redo
    saveState();

    // Close the import presets modal
    closeImportPresetsModal();

    // Exit string mode
    exitStringMode();

    // Automatically center the imported design in current viewport
    if (typeof window.performBasicSmartFraming === 'function') {
        window.performBasicSmartFraming();
    }
}

/**
 * Clear all beads and string from the scene
 */
function clearAllBeads() {
    // Remove all bead objects from the scene
    beads.forEach(bead => scene.remove(bead));
    beads.length = 0;

    // Remove string line if it exists
    if (stringLine) {
        scene.remove(stringLine);
        stringLine.geometry.dispose();
        stringLine.material.dispose();
        stringLine = null;
    }

    // Clear string points
    stringPoints.length = 0;

    // NEW: Clear multi-string paths and meshes
    if (typeof stringMeshes !== 'undefined') {
        stringMeshes.forEach(mesh => {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        stringMeshes.length = 0;
    }
    if (typeof stringPaths !== 'undefined') {
        stringPaths.length = 0;
    }

    // Reset tracking when everything is cleared
    if (typeof resetStringTracking === 'function') {
        resetStringTracking();
    }

    // Update bead count display
    updateBeadCount();

    // Hide rotation control if visible
    if (typeof hideRotationControl === 'function') {
        hideRotationControl();
    }
}

/**
 * Initialize import presets button
 */
function initImportPresets() {
    const importBtn = document.getElementById('import-presets-btn');
    if (importBtn) {
        importBtn.addEventListener('click', openImportPresetsModal);
    }

    // Populate the import presets modal with options
    populateImportPresetsModal();
}

/**
 * Populate the import presets modal with preset options
 */
function populateImportPresetsModal() {
    const modal = document.getElementById('import-presets-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    // Icon SVGs for each preset type
    const presetIcons = {
        'Bracelet': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9" ry="5"/></svg>',
        'Circle': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>',
        'Heart': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        'Rosary': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 2 5 5 5 9c0 4 3 7 7 7s7-3 7-7c0-4-3-7-7-7z"/><path d="M12 16v6"/><circle cx="12" cy="22" r="1" fill="currentColor"/></svg>'
    };

    // Create the preset options
    const presetsHTML = Object.keys(PRESET_DATA).map(key => {
        const preset = PRESET_DATA[key];
        const icon = presetIcons[key] || presetIcons['Circle']; // Fallback to circle

        // Get translation keys for this preset
        const titleKey = 'preset-' + key.toLowerCase();
        const descKey = 'preset-' + key.toLowerCase() + '-desc';

        const titleTranslation = getTranslation(titleKey);
        const descTranslation = getTranslation(descKey);

        return `
            <button class="reset-option-btn preset-option-btn" data-preset="${key}">
                <span class="option-icon">
                    ${icon}
                </span>
                <div class="option-text">
                    <div class="option-title">${titleTranslation}</div>
                    <div class="option-desc">${descTranslation}</div>
                </div>
            </button>
        `;
    }).join('');

    // Use the flexbox-based close button for RTL compatibility
    modalContent.innerHTML = `
        <div class="modal-header-flex">
            <button class="btn-close-modal-flex" onclick="closeImportPresetsModal()" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
        
        <h3>${getTranslation('import-presets-title')}</h3>
        <p class="modal-subtitle">${getTranslation('import-presets-subtitle')}</p>
        
        ${presetsHTML}
    `;

    // Add event listeners to preset buttons
    modal.querySelectorAll('.preset-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            importPreset(presetKey);
        });
    });
}

// Make functions globally accessible
window.openImportPresetsModal = openImportPresetsModal;
window.closeImportPresetsModal = closeImportPresetsModal;
window.closePresetImportConfirmation = closePresetImportConfirmation;
