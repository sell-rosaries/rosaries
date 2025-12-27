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
        'lang-en': 'English',
        'lang-ar': 'العربية',

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
        'cancel': 'Cancel',

        // Slider Limit Toast
        'slider-limit-toast-title': 'Too many beads!',
        'slider-limit-toast-message': "Can't make it smaller",

        // Settings Menu
        'settings-title': 'Settings',
        'settings-general': 'General',
        'settings-language': 'Language',
        'settings-theme': 'Theme',
        'theme-light': '☀️ Light Mode',
        'theme-dark-classic': '🌑 Dark (Classic)',
        'theme-dark-oled': '🖤 Dark (OLED)',
        'theme-dark-blue': '🌌 Dark (Blue)',
        'settings-downloads': 'App Downloads',
        'settings-downloads-desc': 'Download the Android app to use offline.',
        'settings-download-btn': 'Download APK',
        'settings-loading': 'Checking for updates...',
        'settings-no-updates': 'No APKs available',

        // Share
        'share-title': 'Share',
        'settings-socials': 'Socials',
        'social-instagram': 'Instagram',
        'share-website': 'Share Website',
        'share-app': 'Share App',
        'share-click-hint': 'Click QR code to expand',

        // Contact
        'contact-title': 'Contact',
        'contact-desc': 'Have feedback or questions? Let us know!',
        'contact-us-btn': 'Contact Us',
        'contact-modal-title': 'Contact Us',
        'contact-modal-desc': 'Send us your feedback or questions',
        'contact-email-label': 'Email Address',
        'contact-message-label': 'Message',
        'send-message': 'Send Message',
        'contact-sent-success': 'Message sent successfully! We will get back to you soon.',
        'contact-sent-failed': 'Failed to send message. Please try again later.',

        // Size Control Help
        'help-title': 'Size Controls',
        'help-message': '📍 Slider: Allows to increase the string size of the rosary whitch will allow to include more beads on the string.\n\n✨ Fit Button: Automatically fits the current design to the current view box without changing the actual size of the rosary.',

        // Magic & Generate
        'magic-perfecting': 'Perfecting shape... Please wait',
        'magic-low-confidence': 'Could not clearly understand the shape. Try drawing more precisely.',
        'generate-label-text': 'Word/Letters:',
        'generate-label-shapes': 'Shapes/Concepts:',
        'generate-placeholder-text': 'e.g. "You", "10"...',
        'generate-placeholder-shapes': 'e.g. "Star", "Heart"...',
        'generate-btn-text': 'Generate',
        'generate-creating': 'Creating your "{word}" string design...',
        'generate-info-title': 'Supported Offline',
        'generate-info-common': 'Common: Circle, Triangle, Square, Pentagon, Hexagon, Octagon, Diamond, Star, Heart, Cross, Crescent.',
        'generate-info-text': 'Text: Any letters, numbers, or symbols (up to 12 chars) like "You", "10", "A&B", "❤️".',
        'generate-info-ai': 'Anything else uses AI fallback.',
        'generate-back': 'Back',
        'generate-failed': 'Failed to generate.',
        'generate-api-missing': 'API Key missing',
        'generate-offline-only': 'AI features are currently unavailable. Please use built-in shapes.',
        'generate-ai-failed': 'AI could not generate that shape.'
    },
    ar: {
        // Header
        'title': 'مصمم سبحة',
        'import': 'استيراد',
        'presets': 'إعدادات مسبقة',

        // Language Toggle
        'lang-en': 'English',
        'lang-ar': 'العربية',

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
        'cancel': 'إلغاء',

        // Slider Limit Toast
        'slider-limit-toast-title': 'عدد الخرز كبير!',
        'slider-limit-toast-message': 'لا يمكن تقليل الحجم',

        // Settings Menu
        'settings-title': 'الإعدادات',
        'settings-general': 'عام',
        'settings-language': 'اللغة',
        'settings-theme': 'السمة',
        'theme-light': '☀️ الوضع الفاتح',
        'theme-dark-classic': '🌑 داكن (كلاسيكي)',
        'theme-dark-oled': '🖤 داكن (OLED)',
        'theme-dark-blue': '🌌 داكن (أزرق)',
        'settings-downloads': 'تنزيلات التطبيق',
        'settings-downloads-desc': 'قم بتنزيل تطبيق الأندرويد للاستخدام دون اتصال.',
        'settings-download-btn': 'تحميل APK',
        'settings-loading': 'جاري التحقق من وجود تحديثات...',
        'settings-no-updates': 'لا توجد تحديثات متاحة',

        // Share
        'share-title': 'مشاركة',
        'settings-socials': 'منصات التواصل',
        'social-instagram': 'إنستغرام',
        'share-website': 'مشاركة الموقع',
        'share-app': 'مشاركة التطبيق',
        'share-click-hint': 'انقر على الرمز للتكبير',

        // Contact
        'contact-title': 'تواصل معنا',
        'contact-desc': 'لديك ملاحظات أو أسئلة؟ أخبرنا!',
        'contact-us-btn': 'تواصل معنا',
        'contact-modal-title': 'تواصل معنا',
        'contact-modal-desc': 'أرسل لنا ملاحظاتك أو أسئلتك',
        'contact-email-label': 'البريد الإلكتروني',
        'contact-message-label': 'الرسالة',
        'send-message': 'إرسال الرسالة',
        'contact-sent-success': 'تم إرسال الرسالة بنجاح! سنتواصل معك قريباً.',
        'contact-sent-failed': 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقاً.',

        // Size Control Help
        'help-title': 'التحكم في الحجم',
        'help-message': '📍 الشريط: يسمح بزيادة حجم الخيط، مما يسمح بإضافة المزيد من الخرز على الخيط.\n\n✨ الزر "fit": يسمح بملاءمة وترتيب الخرز تلقائياً على الخيط بدون تغيير حجم التصميم.',

        // Magic & Generate
        'magic-perfecting': 'جاري تجميل الشكل... يرجى الانتظار',
        'magic-low-confidence': 'لم أستطع فهم الشكل بوضوح. حاول الرسم بدقة أكبر.',
        'generate-label-text': 'كلمات/أحرف:',
        'generate-label-shapes': 'أشكال/تصاميم:',
        'generate-placeholder-text': 'مثلاً: "سبحان", "10"...',
        'generate-placeholder-shapes': 'مثلاً: "نجمة", "قلب"...',
        'generate-btn-text': 'إنشاء',
        'generate-creating': 'جاري إنشاء تصميم "{word}"...',
        'generate-info-title': 'مدعوم بدون إنترنت',
        'generate-info-common': 'الأشكال: دائرة، مثلث، مربع، خماسي، سداسي، ثماني، ماسة، نجمة، قلب، صليب، هلال.',
        'generate-info-text': 'النصوص: أي أحرف، أرقام أو رموز (حتى 12 حرف) مثل "You", "10", "A&B", "❤️".',
        'generate-info-ai': 'أي شيء آخر يستخدم الذكاء الاصطناعي.',
        'generate-back': 'رجوع',
        'generate-failed': 'فشل الإنشاء.',
        'generate-api-missing': 'مفتاح API مفقود',
        'generate-offline-only': 'ميزات الذكاء الاصطناعي غير متوفرة حالياً. يرجى استخدام الأشكال المدمجة.',
        'generate-ai-failed': 'لم يستطع الذكاء الاصطناعي إنشاء هذا الشكل.'
    }
};

// Current language state
let currentLanguage = 'ar';

// Language Manager class
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('app-language') || 'ar'; // Load from storage
        currentLanguage = this.currentLanguage; // Initialize global variable too
        this.rtlLanguages = ['ar']; // Arabic and other RTL languages
        this.saveTimeout = null; // Timeout for debounced saving
        this.init();
    }

    init() {
        // Initialize language toggle button
        this.setupLanguageToggle();

        // Set initial language (UI update only, no save needed)
        this.setLanguage(this.currentLanguage, true);
    }

    setupLanguageToggle() {
        // Use event delegation for robust handling of dynamic/modal elements
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('#lang-en')) {
                this.setLanguage('en');
            } else if (e.target.closest('#lang-ar')) {
                this.setLanguage('ar');
            }
        });
    }

    toggleLanguage() {
        const newLang = this.currentLanguage === 'en' ? 'ar' : 'en';
        this.setLanguage(newLang);
    }

    setLanguage(lang, skipSave = false) {
        if (!translations[lang]) {
            console.warn(`Language ${lang} not supported`);
            return;
        }

        this.currentLanguage = lang;
        currentLanguage = lang; // Update global variable too!

        this.updateUI();
        this.updateLanguageButtons();

        // Update import button text if it exists (managed by saved.js)
        if (typeof window.updateImportButtonText === 'function') {
            window.updateImportButtonText();
        }

        // Debounce save to storage (5 seconds delay)
        if (!skipSave) {
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                localStorage.setItem('app-language', lang);
            }, 5000);
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
        this.updateSettingsUI();

        // Update elements with data-translate attributes
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation && translation !== key) {
                el.textContent = translation;
            }
        });

        // Update elements with data-translate-placeholder attributes
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            const translation = this.getTranslation(key);
            if (translation && translation !== key) {
                el.placeholder = translation;
            }
        });

        // Update Arabic RTL support
        this.updateRTLSupport();
    }

    updateSettingsUI() {
        if (typeof window.updateSettingsLanguage === 'function') {
            window.updateSettingsLanguage();
        }
    }

    updateUICore() {
        const langData = translations[this.currentLanguage];

        // Update core UI elements
        const elements = {
            // Header
            'h1': langData['title'],
            '.import-presets-btn': langData['presets'],
            '.saved-label': langData['saved-menu-btn'], // This will be defined in saved module

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

    updateLanguageButtons() {
        const btnEn = document.getElementById('lang-en');
        const btnAr = document.getElementById('lang-ar');

        if (btnEn && btnAr) {
            if (this.currentLanguage === 'en') {
                btnEn.classList.add('active');
                btnAr.classList.remove('active');
            } else {
                btnEn.classList.remove('active');
                btnAr.classList.add('active');
            }

            // Ensure text is always correct explicitly
            btnEn.textContent = 'English';
            btnAr.textContent = 'العربية';
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
window.getTranslation = function (key) {
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