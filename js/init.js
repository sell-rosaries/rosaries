/*
    APPLICATION INITIALIZATION MODULE
    Handles application startup and initialization logic
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

// Start the application
main();