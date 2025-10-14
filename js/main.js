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
        } catch (configError) {
            console.error('Config load error, starting with empty data:', configError);
            categories = [];
            objects = [];
        }
        
        createBeadSelection();
        addEventListeners();
        
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
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', onCanvasTouchEnd);

    window.addEventListener('resize', onWindowResize);

    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
    document.getElementById('email-btn').addEventListener('click', openEmailModal);
    document.getElementById('reset-button').addEventListener('click', openResetMenu);

    document.getElementById('rotation-slider').addEventListener('input', onRotationSliderChange);
    document.addEventListener('click', onDocumentClick);

    document.getElementById('reset-all-btn').addEventListener('click', resetAll);
    document.getElementById('delete-objects-btn').addEventListener('click', deleteAllObjects);
    document.getElementById('delete-individual-btn').addEventListener('click', enterDeleteMode);
    
    document.getElementById('send-email-btn').addEventListener('click', sendDesignEmail);
}

// Start the application
main();
