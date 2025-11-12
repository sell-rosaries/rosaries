/**
 * Language Management System
 * Handles English/Arabic text translation for visible UI elements
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
        
        // Bead Library Panel
        'bead-library': 'Bead Library',
        'draw-string': 'Draw String',
        'draw-string-desc': 'Click and drag to draw a path',
        
        // Email Modal
        'send-design-title': 'Send Your Design',
        'send-design-subtitle': 'Fill in your information below. Your design will be sent to us!',
        'name': 'Name',
        'name-placeholder': 'Your name (optional)',
        'email': 'Email Address',
        'email-placeholder': 'your@email.com',
        'email-required': '*',
        'phone': 'Phone',
        'phone-placeholder': '+1 (555) 123-4567',
        'phone-required': '*',
        'notes': 'Questions or Notes',
        'notes-placeholder': 'Any questions or special requests? (optional)',
        'form-note': '* Both Email and Phone Number are required',
        'send-design-btn': 'Send Design',
        'cancel': 'Cancel',
        
        // Reset Menu
        'reset-options': 'Reset Options',
        'reset-all': 'Reset All',
        'reset-all-desc': 'Delete everything (string and objects)',
        'clear-objects': 'Clear Objects',
        'clear-objects-desc': 'Delete all objects but keep string',
        'delete-individual': 'Delete Individually',
        'delete-individual-desc': 'Click X on objects to delete them',
        
        // Size Selection
        'select-bead-size': 'Select Bead Size',
        
        // Import Presets
        'import-presets-title': 'Import Presets',
        'import-presets-subtitle': 'Choose a preset pattern to import',
        'import-presets-empty': 'This feature will be available soon',
        
        // Import Confirmation
        'import-confirm-title': 'Import ${preset}?', // ${preset} will be replaced dynamically
        'import-confirm-message': 'This will replace everything in your sandbox. This action cannot be undone.',
        'import-confirm-btn': 'Yes, Import',
        'cancel': 'Cancel',
        
        // Preset Names
        'preset-bracelet': 'Bracelet',
        'preset-circle': 'Circle',
        'preset-heart': 'Heart',
        'preset-rosary': 'Rosary',
        
        // Preset Descriptions
        'preset-bracelet-desc': 'Import bracelet pattern',
        'preset-circle-desc': 'Import circle pattern',
        'preset-heart-desc': 'Import heart pattern',
        'preset-rosary-desc': 'Import rosary pattern',
        
        // Gallery
        'design-gallery': 'Design Gallery',
        'send-selected': 'Send Selected',
        'send-selected-designs-title': 'Send Selected Designs',
        'send-selected-designs-subtitle': 'Fill in your information below. Selected designs will be sent!',
        
        // Gallery Email Modal (same as regular email but with Selected)
        'send-selected-btn': 'Send Selected'
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
        
        // Bead Library Panel
        'bead-library': 'مكتبة الخرز',
        'draw-string': 'رسم خيط',
        'draw-string-desc': 'انقر واسحب لرسم مسار',
        
        // Email Modal
        'send-design-title': 'أرسل تصميمك',
        'send-design-subtitle': 'املأ معلوماتك أدناه. سيتم إرسال تصميمك إلينا!',
        'name': 'الاسم',
        'name-placeholder': 'اسمك (اختياري)',
        'email': 'عنوان البريد الإلكتروني',
        'email-placeholder': 'your@email.com',
        'email-required': '*',
        'phone': 'الهاتف',
        'phone-placeholder': '+1 (555) 123-4567',
        'phone-required': '*',
        'notes': 'أسئلة أو ملاحظات',
        'notes-placeholder': 'أي أسئلة أو طلبات خاصة؟ (اختياري)',
        'form-note': '* مطلوب كل من البريد الإلكتروني ورقم الهاتف',
        'send-design-btn': 'إرسال التصميم',
        'cancel': 'إلغاء',
        
        // Reset Menu
        'reset-options': 'خيارات إعادة التعيين',
        'reset-all': 'إعادة تعيين الكل',
        'reset-all-desc': 'حذف كل شيء (الخيط والاشياء)',
        'clear-objects': 'مسح الاشياء',
        'clear-objects-desc': 'حذف كل الاشياء مع الحفاظ على الخيط',
        'delete-individual': 'حذف فردي',
        'delete-individual-desc': 'انقر X على الاشياء لحذفها',
        
        // Size Selection
        'select-bead-size': 'اختيار حجم الخرزة',
        
        // Import Presets
        'import-presets-title': 'استيراد الإعدادات المسبقة',
        'import-presets-subtitle': 'اختر نمط الإعداد المسبق للاستيراد',
        'import-presets-empty': 'ستكون هذه الميزة متاحة قريباً',
        
        // Import Confirmation
        'import-confirm-title': 'استيراد ${preset}؟', // ${preset} will be replaced dynamically
        'import-confirm-message': 'سيتم استبدال كل شيء في صندوق الرمل الخاص بك. لا يمكن التراجع عن هذا الإجراء.',
        'import-confirm-btn': 'نعم، استيراد',
        'cancel': 'إلغاء',
        
        // Preset Names
        'preset-bracelet': 'سوار',
        'preset-circle': 'دائرة',
        'preset-heart': 'قلب',
        'preset-rosary': 'سلسلة صلاة',
        
        // Preset Descriptions
        'preset-bracelet-desc': 'استيراد نمط السوار',
        'preset-circle-desc': 'استيراد نمط الدائرة',
        'preset-heart-desc': 'استيراد نمط القلب',
        'preset-rosary-desc': 'استيراد نمط سلسلة الصلاة',
        
        // Gallery
        'design-gallery': 'معرض التصاميم',
        'send-selected': 'إرسال المحدد',
        'send-selected-designs-title': 'أرسل التصاميم المحددة',
        'send-selected-designs-subtitle': 'املأ معلوماتك أدناه. سيتم إرسال التصاميم المحددة!',
        
        // Gallery Email Modal
        'send-selected-btn': 'إرسال المحدد'
    }
};

// Current language state
let currentLanguage = 'en';

// Language Manager class
class LanguageManager {
    constructor() {
        this.currentLanguage = 'en';
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
        this.updateUI();
        this.updateLanguageToggle();
    }
    
    updateUI() {
        const langData = translations[this.currentLanguage];
        
        // Update all translatable elements
        const elements = {
            // Header
            'h1': langData['title'],
            '.import-presets-btn': langData['presets'],
            
            // Language Toggle
            '.lang-label': this.currentLanguage === 'en' ? 'EN' : 'AR',
            
            // Toolbar
            '#undo-btn .toolbar-label': langData['undo'],
            '#redo-btn .toolbar-label': langData['redo'],
            '#reset-button .toolbar-label': langData['reset'],
            '#draw-string-btn .toolbar-label': langData['draw'],
            '#library-btn .toolbar-label': langData['gallery'],
            '#email-btn .toolbar-label': langData['send'],
            
            // Bead Library Panel
            '.bead-library-panel h2': langData['bead-library'],
            '.bead-library-panel .tool-name': langData['draw-string'],
            '.bead-library-panel .tool-desc': langData['draw-string-desc'],
            
            // Email Modal
            '#email-modal h2': langData['send-design-title'],
            '#email-modal .modal-subtitle': langData['send-design-subtitle'],
            '#send-email-btn .btn-text': langData['send-design-btn'],
            '#email-modal .btn-secondary': langData['cancel'],
            
            // Reset Menu
            '#reset-menu h3': langData['reset-options'],
            '#reset-all-btn .option-title': langData['reset-all'],
            '#reset-all-btn .option-desc': langData['reset-all-desc'],
            '#delete-objects-btn .option-title': langData['clear-objects'],
            '#delete-objects-btn .option-desc': langData['clear-objects-desc'],
            '#delete-individual-btn .option-title': langData['delete-individual'],
            '#delete-individual-btn .option-desc': langData['delete-individual-desc'],
            
            // Size Selection Modal
            '#size-selection-modal h3': langData['select-bead-size'],
            
            // Import Presets
            '#import-presets-modal h3': langData['import-presets-title'],
            '#import-presets-modal .modal-subtitle': langData['import-presets-subtitle'],
            '#import-presets-modal p': langData['import-presets-empty'],
            
            // Import Confirmation Dialog
            '#import-confirm-modal h3': langData['import-confirm-title'], // Will be handled with preset replacement
            '#import-confirm-modal .modal-subtitle': langData['import-confirm-message'],
            '#confirm-import-btn': langData['import-confirm-btn'],
            '#import-confirm-modal .btn-secondary': langData['cancel'],
            
            // Preset Options (dynamic elements)
            '.preset-option-btn[data-preset="Bracelet"] .option-title': langData['preset-bracelet'],
            '.preset-option-btn[data-preset="Bracelet"] .option-desc': langData['preset-bracelet-desc'],
            '.preset-option-btn[data-preset="Circle"] .option-title': langData['preset-circle'],
            '.preset-option-btn[data-preset="Circle"] .option-desc': langData['preset-circle-desc'],
            '.preset-option-btn[data-preset="Heart"] .option-title': langData['preset-heart'],
            '.preset-option-btn[data-preset="Heart"] .option-desc': langData['preset-heart-desc'],
            '.preset-option-btn[data-preset="Rosary"] .option-title': langData['preset-rosary'],
            '.preset-option-btn[data-preset="Rosary"] .option-desc': langData['preset-rosary-desc'],
            
            // Gallery
            '.gallery-panel h2': langData['design-gallery'],
            '#send-selected-btn .btn-text': langData['send-selected'],
            
            // Gallery Email Modal
            '#gallery-email-modal h2': langData['send-selected-designs-title'],
            '#gallery-email-modal .modal-subtitle': langData['send-selected-designs-subtitle'],
            '#send-gallery-email-btn .btn-text': langData['send-selected-btn'],
            '#gallery-email-modal .btn-secondary': langData['cancel'],
            

            

            
            // Form labels
            'label[for="customer-name"]': langData['name'],
            'label[for="customer-email"]': langData['email'],
            'label[for="customer-phone"]': langData['phone'],
            'label[for="customer-notes"]': langData['notes'],
            
            // Gallery form labels
            'label[for="gallery-customer-name"]': langData['name'],
            'label[for="gallery-customer-email"]': langData['email'],
            'label[for="gallery-customer-phone"]': langData['phone'],
            'label[for="gallery-customer-notes"]': langData['notes'],
            
            // Form notes
            '.form-note': langData['form-note'],
            
            // Placeholders
            '#customer-name::placeholder': langData['name-placeholder'],
            '#customer-email::placeholder': langData['email-placeholder'],
            '#customer-phone::placeholder': langData['phone-placeholder'],
            '#customer-notes::placeholder': langData['notes-placeholder'],
            '#gallery-customer-name::placeholder': langData['name-placeholder'],
            '#gallery-customer-email::placeholder': langData['email-placeholder'],
            '#gallery-customer-phone::placeholder': langData['phone-placeholder'],
            '#gallery-customer-notes::placeholder': langData['notes-placeholder']
        };
        
        // Apply text translations
        Object.entries(elements).forEach(([selector, text]) => {
            this.updateElementText(selector, text);
        });
        
        // Update Arabic RTL support
        this.updateRTLSupport();
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
        

        
        // Handle required field indicators
        if (selector.includes('label[for="customer-email"]')) {
            const element = document.querySelector(selector);
            if (element) {
                const requiredSpan = element.querySelector('.required');
                if (requiredSpan) {
                    element.innerHTML = text + ' ' + `<span class="required">${translations[this.currentLanguage]['email-required']}</span>`;
                } else {
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector.includes('label[for="customer-phone"]')) {
            const element = document.querySelector(selector);
            if (element) {
                const requiredSpan = element.querySelector('.required');
                if (requiredSpan) {
                    element.innerHTML = text + ' ' + `<span class="required">${translations[this.currentLanguage]['phone-required']}</span>`;
                } else {
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector.includes('label[for="gallery-customer-email"]')) {
            const element = document.querySelector(selector);
            if (element) {
                const requiredSpan = element.querySelector('.required');
                if (requiredSpan) {
                    element.innerHTML = text + ' ' + `<span class="required">${translations[this.currentLanguage]['email-required']}</span>`;
                } else {
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector.includes('label[for="gallery-customer-phone"]')) {
            const element = document.querySelector(selector);
            if (element) {
                const requiredSpan = element.querySelector('.required');
                if (requiredSpan) {
                    element.innerHTML = text + ' ' + `<span class="required">${translations[this.currentLanguage]['phone-required']}</span>`;
                } else {
                    element.textContent = text;
                }
            }
            return;
        }
        
        // Handle form note
        if (selector === '.form-note') {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = text;
            });
            return;
        }
        
        // Handle buttons with specific text
        if (selector === '#send-email-btn') {
            const element = document.querySelector(selector);
            if (element) {
                const textSpan = element.querySelector('.btn-text');
                if (textSpan) {
                    textSpan.textContent = text;
                } else {
                    // If no text span, update the button text directly
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector === '#send-gallery-email-btn') {
            const element = document.querySelector(selector);
            if (element) {
                const textSpan = element.querySelector('.btn-text');
                if (textSpan) {
                    textSpan.textContent = text;
                } else {
                    // If no text span, update the button text directly
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector === '#gallery-email-modal .btn-secondary') {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        // Handle reset options
        if (selector === '.modal-compact h3') {
            // Update reset modal title
            const resetModal = document.getElementById('reset-menu');
            if (resetModal && resetModal.style.display !== 'none') {
                const title = resetModal.querySelector('h3');
                if (title) title.textContent = text;
            }
            return;
        }
        
        // Import Presets special handling
        if (selector === '#import-presets-modal .modal-subtitle') {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        if (selector === '#import-presets-modal p') {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        // Handle preset option updates when modal is open
        if (selector.startsWith('.preset-option-btn')) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = text;
            });
            return;
        }
        
        // Handle modal titles and subtitles with context awareness
        if (selector === '.modal h2') {
            const modals = document.querySelectorAll('.modal h2');
            modals.forEach(modal => {
                const parentModal = modal.closest('.modal');
                if (parentModal) {
                    const modalId = parentModal.id;
                    if (modalId === 'email-modal') {
                        modal.textContent = text;
                    }
                }
            });
            return;
        }
        
        if (selector === '.modal .modal-subtitle') {
            const modals = document.querySelectorAll('.modal .modal-subtitle');
            modals.forEach(modal => {
                const parentModal = modal.closest('.modal');
                if (parentModal) {
                    const modalId = parentModal.id;
                    if (modalId === 'email-modal') {
                        modal.textContent = text;
                    }
                }
            });
            return;
        }
        
        if (selector === '#gallery-email-modal h2') {
            const element = document.querySelector('#gallery-email-modal h2');
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        if (selector === '#gallery-email-modal .modal-subtitle') {
            const element = document.querySelector('#gallery-email-modal .modal-subtitle');
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        if (selector === '#send-selected-btn') {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
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
                // Handle option titles and descriptions
                else if (selector.includes('.option-title') || selector.includes('.option-desc')) {
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        languageManager = new LanguageManager();
    });
} else {
    languageManager = new LanguageManager();
}

// Global getTranslation function for use in other scripts
window.getTranslation = function(key) {
    if (languageManager) {
        return languageManager.getTranslation(key);
    }
    return key; // Fallback to key if manager not available
};