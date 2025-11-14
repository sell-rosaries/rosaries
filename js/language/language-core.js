/**
 * Language Management System - Core Module
 * Contains LanguageManager class, RTL support, and utility functions
 */

// Language translations object
const translations = {
    en: {
        // Header
        'title': 'Rosary Designer',
        'import': 'import',
        'presets': 'presets',
        
        // Language Toggle
        'lang-en': 'EN',
        'lang-ar': 'AR',
        
        // Toolbar Buttons
        'undo': 'Undo',
        'redo': 'Redo',
        'reset': 'Reset',
        'draw': 'Draw',
        'gallery': 'Gallery',
        'send': 'Send',
        
        // Reset Confirmation Dialog
        'reset-all-confirm-title': 'Reset Everything?',
        'reset-all-confirm-message-1': 'This will delete all beads and string.',
        'reset-all-confirm-message-2': 'This action cannot be undone.',
        'confirm-reset': 'Reset All',
        'cancel': 'Cancel'
    },
    ar: {
        // Header
        'title': 'مصمم سبحة',
        'import': 'استيراد',
        'presets': 'إعدادات مسبقة',
        
        // Language Toggle
        'lang-en': 'إن',
        'lang-ar': 'ع',
        
        // Toolbar Buttons
        'undo': 'تراجع',
        'redo': 'إعادة',
        'reset': 'إعادة تعيين',
        'draw': 'رسم',
        'gallery': 'المعرض',
        'send': 'إرسال',
        
        // Reset Confirmation Dialog
        'reset-all-confirm-title': 'إعادة تعيين كل شيء؟',
        'reset-all-confirm-message-1': 'سيتم حذف جميع الخرزات والخيط.',
        'reset-all-confirm-message-2': 'لا يمكن التراجع عن هذا الإجراء.',
        'confirm-reset': 'إعادة تعيين الكل',
        'cancel': 'إلغاء'
    }
};

// Current language state
let currentLanguage = 'en';

// Language Manager class
class LanguageManager {
    constructor() {
        this.currentLanguage = 'en';
        currentLanguage = 'en'; // Initialize global variable too
        this.rtlLanguages = ['ar']; // Arabic and other RTL languages
        this.init();
    }
    
    init() {
        // Initialize language toggle button
        this.setupLanguageToggle();
        
        // Set initial language to English
        this.setLanguage('en');
    }
    
    setupLanguageToggle() {
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }
    
    toggleLanguage() {
        const newLang = this.currentLanguage === 'en' ? 'ar' : 'en';
        this.setLanguage(newLang);
    }
    
    setLanguage(lang) {
        if (!translations[lang]) {
            console.warn(`Language ${lang} not supported`);
            return;
        }
        
        this.currentLanguage = lang;
        currentLanguage = lang; // Update global variable too!
        
        this.updateUI();
        this.updateLanguageToggle();
        
        // Update import button text if it exists (managed by saved.js)
        if (typeof window.updateImportButtonText === 'function') {
            window.updateImportButtonText();
        }
    }
    
    updateUI() {
        // This will be implemented by other modules
        // Call all language-specific UI update methods
        this.updateUICore();
        this.updateUIContent();
        this.updateSavedUI();
        this.updateEmailUI();
        this.updateGalleryUI();
        this.updateBehaviorsUI();
        this.updateSystemUI();
        
        // Update Arabic RTL support
        this.updateRTLSupport();
    }
    
    updateUICore() {
        const langData = translations[this.currentLanguage];
        
        // Update core UI elements
        const elements = {
            // Header
            'h1': langData['title'],
            '.import-presets-btn': langData['presets'],
            '.saved-label': langData['saved-menu-btn'], // This will be defined in saved module
            
            // Language Toggle
            '.lang-label': this.currentLanguage === 'en' ? 'EN' : 'AR',
            
            // Toolbar
            '#undo-btn .toolbar-label': langData['undo'],
            '#redo-btn .toolbar-label': langData['redo'],
            '#reset-button .toolbar-label': langData['reset'],
            '#draw-string-btn .toolbar-label': langData['draw'],
            '#library-btn .toolbar-label': langData['gallery'],
            '#email-btn .toolbar-label': langData['send']
        };
        
        // Apply text translations
        Object.entries(elements).forEach(([selector, text]) => {
            this.updateElementText(selector, text);
        });
    }
    
    updateUIContent() {
        // Implemented by UI Core module
        if (typeof this._updateUIContent === 'function') {
            this._updateUIContent();
        }
    }
    
    updateSavedUI() {
        // Implemented by Saved module
        if (typeof this._updateSavedUI === 'function') {
            this._updateSavedUI();
        }
    }
    
    updateEmailUI() {
        // Implemented by Email module
        if (typeof this._updateEmailUI === 'function') {
            this._updateEmailUI();
        }
    }
    
    updateGalleryUI() {
        // Implemented by Gallery module
        if (typeof this._updateGalleryUI === 'function') {
            this._updateGalleryUI();
        }
    }
    
    updateBehaviorsUI() {
        // Implemented by Behaviors module
        if (typeof this._updateBehaviorsUI === 'function') {
            this._updateBehaviorsUI();
        }
    }
    
    updateSystemUI() {
        // Implemented by System module
        if (typeof this._updateSystemUI === 'function') {
            this._updateSystemUI();
        }
    }
    
    updateElementText(selector, text) {
        // Handle special cases for input placeholders and other attributes
        if (selector.includes('::placeholder')) {
            const elementSelector = selector.replace('::placeholder', '');
            const elements = document.querySelectorAll(elementSelector);
            elements.forEach(element => {
                if (element && element.placeholder !== undefined) {
                    element.placeholder = text;
                }
            });
            return;
        }
        
        // Standard element selection
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element && element.textContent !== undefined) {
                // Special handling for tool labels that might be in spans
                if (selector.includes('.toolbar-label')) {
                    const label = element.querySelector('.toolbar-label');
                    if (label) {
                        label.textContent = text;
                    } else {
                        element.textContent = text;
                    }
                }
                // Handle button text spans
                else if (selector.includes('.btn-text')) {
                    element.textContent = text;
                }
                // Standard text update
                else {
                    element.textContent = text;
                }
            }
        });
    }
    
    updateLanguageToggle() {
        const langToggle = document.getElementById('lang-toggle');
        const langLabel = langToggle?.querySelector('.lang-label');
        
        if (langLabel) {
            langLabel.textContent = this.currentLanguage === 'en' ? 'EN' : 'AR';
            langLabel.setAttribute('data-lang', this.currentLanguage);
        }
    }
    
    updateRTLSupport() {
        // Add RTL support for Arabic
        if (this.rtlLanguages.includes(this.currentLanguage)) {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');
            
            // Add RTL class for styling individual elements
            document.body.classList.add('rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'en');
            document.body.classList.remove('rtl');
        }
    }
    
    // Helper method to get translated text
    t(key) {
        return translations[this.currentLanguage][key] || key;
    }
    
    // Get translation method (same as t() but more explicit name)
    getTranslation(key) {
        return translations[this.currentLanguage][key] || key;
    }
    
    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Initialize language manager when DOM is ready
let languageManager;

function initLanguageManager() {
    languageManager = new LanguageManager();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLanguageManager();
    });
} else {
    initLanguageManager();
}

// Global getTranslation function
window.getTranslation = function(key) {
    try {
        if (languageManager && languageManager.getTranslation) {
            return languageManager.getTranslation(key);
        }
        // Fallback to English if manager not ready
        if (translations && translations.en && translations.en[key]) {
            return translations.en[key];
        }
        // Final fallback to key
        return key;
    } catch (error) {
        return key;
    }
};

// Export for other modules
window.translations = translations;