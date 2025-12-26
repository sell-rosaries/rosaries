/**
 * Language Management System - UI Core Module
 * Handles header, toolbar, and language toggle translations
 */

// Add UI core translations to the translations object
if (typeof window.translations !== 'undefined') {
    window.translations.en = {
        ...window.translations.en,
        // Bead Library Panel
        'bead-library': 'Bead Library',
        'draw-string': 'Draw String',
        'draw-string-desc': 'Click and drag to draw a path'
    };
    
    window.translations.ar = {
        ...window.translations.ar,
        // Bead Library Panel
        'bead-library': 'مكتبة الخرز',
        'draw-string': 'رسم خيط',
        'draw-string-desc': 'انقر واسحب لرسم مسار'
    };
}

// Extend LanguageManager prototype for UI Core functionality
if (typeof LanguageManager !== 'undefined') {
    LanguageManager.prototype._updateUIContent = function() {
        const langData = translations[this.currentLanguage];
        
        // Update bead library panel elements
        const elements = {
            // Bead Library Panel
            '.bead-library-panel h2': langData['bead-library'],
            '.bead-library-panel .tool-name': langData['draw-string'],
            '.bead-library-panel .tool-desc': langData['draw-string-desc']
        };
        
        // Apply text translations
        Object.entries(elements).forEach(([selector, text]) => {
            this.updateElementText(selector, text);
        });
    };
}