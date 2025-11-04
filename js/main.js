/*
    MAIN APPLICATION
    Initialization and event listener setup
*/

/**
 * Main initialization function
 */
async function main() {
    try {
        init3DScene();
        
        try {
            await loadConfig();
            loadSizePreferences(); // Load saved size preferences
            await loadGalleryConfig(); // Load gallery configuration
        } catch (configError) {
            console.error('Config load error, starting with empty data:', configError);
            categories = [];
            objects = [];
        }
        
        createBeadSelection();
        addEventListeners();
        initGalleryEventListeners(); // Initialize gallery event listeners
        updateBeadCount();
        
        // Auto-restore saved design (must be after config is loaded, BEFORE saveState)
        await autoRestoreDesign();
        
        // Save initial state (or restored state if exists)
        saveState();
        
        animate();
    } catch (error) {
        console.error('Critical error during initialization:', error);
        alert('Error starting application. Please refresh the page.\n\nError: ' + error.message);
        
        try {
            categories = [];
            objects = [];
            createBeadSelection();
            addEventListeners();
            animate();
        } catch (e) {
            document.body.innerHTML = '<div style="padding: 40px; text-align: center;"><h1>Application Error</h1><p>Please refresh the page.</p><pre>' + error.stack + '</pre></div>';
        }
    }
}

/**
 * Adds all event listeners
 */
function addEventListeners() {
    const canvas = renderer.domElement;
    
    // Canvas interactions
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', onCanvasTouchEnd);

    // Window resize
    window.addEventListener('resize', onWindowResize);

    // Bottom toolbar buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
    
    document.getElementById('email-btn').addEventListener('click', openEmailModal);
    document.getElementById('reset-button').addEventListener('click', openResetMenu);
    document.getElementById('draw-string-btn').addEventListener('click', activateDrawStringTool);

    // FAB button
    document.getElementById('fab').addEventListener('click', toggleFAB);

    // Bead library panel
    document.getElementById('close-library-btn').addEventListener('click', closeBeadLibrary);
    document.getElementById('panel-backdrop').addEventListener('click', closeBeadLibrary);
    
    // String tool selection
    const stringTool = document.getElementById('string-tool');
    if (stringTool) {
        stringTool.addEventListener('click', selectStringTool);
    }

    // Rotation control
    const closeRotationBtn = document.getElementById('close-rotation-btn');
    if (closeRotationBtn) {
        closeRotationBtn.addEventListener('click', hideRotationControl);
    }

    // Document clicks for closing rotation control
    document.addEventListener('click', onDocumentClick);

    // Reset menu options
    document.getElementById('reset-all-btn').addEventListener('click', resetAll);
    document.getElementById('delete-objects-btn').addEventListener('click', deleteAllObjects);
    document.getElementById('delete-individual-btn').addEventListener('click', enterDeleteMode);
    
    // Email form
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendDesignEmail();
        });
    }
    
    // Language toggle (placeholder)
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const label = langToggle.querySelector('.lang-label');
            if (label.textContent === 'EN') {
                label.textContent = 'AR';
                console.log('🌐 Language changed to Arabic (functionality to be implemented)');
            } else {
                label.textContent = 'EN';
                console.log('🌐 Language changed to English (functionality to be implemented)');
            }
        });
    }
}

/**
 * Toggle FAB menu (currently just opens library)
 */
function toggleFAB() {
    openBeadLibrary();
}

/**
 * Select string tool from panel
 */
function selectStringTool(event) {
    isStringMode = true;
    isSelectMode = false;
    controls.enabled = false;
    selectedObjectId = null;
    selectedSize = null;
    updateToolSelectionUI(event.currentTarget);
    updateFABIcon();
    hideRotationControl();
    updateSelectedBeadPreview();
    
    // Update FAB to show active state
    document.getElementById('fab').classList.add('active');
    
    // Update toolbar button state
    document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('draw-string-btn').classList.add('active');
    
    // Close library after selection
    closeBeadLibrary();
}

/**
 * Activate draw string tool from toolbar button
 */
function activateDrawStringTool() {
    const drawBtn = document.getElementById('draw-string-btn');
    
    // Toggle off if already active
    if (isStringMode) {
        isStringMode = false;
        controls.enabled = true;
        drawBtn.classList.remove('active');
        document.getElementById('fab').classList.remove('active');
        updateFABIcon();
        return;
    }
    
    // Toggle on
    isStringMode = true;
    isSelectMode = false;
    controls.enabled = false;
    selectedObjectId = null;
    selectedSize = null;
    hideRotationControl();
    updateFABIcon();
    updateSelectedBeadPreview();
    
    // Update button state
    document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
    drawBtn.classList.add('active');
    
    // Update FAB to show active state
    document.getElementById('fab').classList.add('active');
}

/**
 * Window resize handler
 */
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const aspect = container.clientWidth / container.clientHeight;
    
    camera.left = -10 * aspect;
    camera.right = 10 * aspect;
    camera.top = 10;
    camera.bottom = -10;
    camera.updateProjectionMatrix();
    
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Start the application
main();
