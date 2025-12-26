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
        initSettings(); // Initialize settings module (new)
        initGalleryEventListeners(); // Initialize gallery event listeners
        injectSavedStyles(); // Inject styles for saved designs delete mode


        // Wait for language manager to be initialized before initializing import presets
        if (typeof languageManager !== 'undefined') {
            initImportPresets(); // Initialize import presets functionality
        } else {
            // Wait for language manager to be available
            const checkLanguageManager = setInterval(() => {
                if (typeof languageManager !== 'undefined') {
                    clearInterval(checkLanguageManager);
                    initImportPresets();
                }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkLanguageManager);
                console.warn('Language manager not available, initializing import presets anyway');
                initImportPresets();
            }, 5000);
        }

        // Initialize custom size control (new feature)
        if (typeof initCustomSize === 'function') {
            initCustomSize();
        }

        // Initialize string size slider logic
        if (typeof window.initStringSlider === 'function') {
            window.initStringSlider();
        }

        // Initialize sandbox string type tracker
        initSandboxStringType();

        // Initialize Generate Feature
        if (typeof initGenerate === 'function') {
            initGenerate();
        }

        // Initialize Magic Feature
        if (typeof initMagic === 'function') {
            await initMagic();
        }

        updateBeadCount();

        // Auto-restore saved design (must be after config is loaded, BEFORE saveState)
        const restored = await autoRestoreDesign();

        // Auto-fit design if one was restored
        if (restored && typeof window.performBasicSmartFraming === 'function') {

            setTimeout(() => {
                const stringType = window.getCurrentStringType ? window.getCurrentStringType() : 'preset';
                const mode = stringType === 'pen' ? 'pen-mode' : 'preset';
                window.performBasicSmartFraming({ mode });
            }, 100); // Small delay to ensure all elements are loaded
        }

        // Save initial state (or restored state if exists)
        saveState();

        animate();
    } catch (error) {
        console.error('Critical error during initialization:', error);
        showCustomAlert(((typeof window.getTranslation === 'function' ? window.getTranslation('app-error-start') : null) || 'Error starting application. Please refresh the page.') + '\n\nError: ' + error.message, 'error');

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

// Start the application when the DOM is fully loaded

document.addEventListener('DOMContentLoaded', () => {

    main();

});
