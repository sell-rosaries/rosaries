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
        'cancel': 'Cancel',

        // Slider Limit Toast
        'slider-limit-toast-title': 'Too many beads!',
        'slider-limit-toast-message': "Can't make it smaller",

        // Settings Menu
        'settings-title': 'Settings',
        'settings-general': 'General',
        'settings-language': 'Language',
        'settings-downloads': 'App Downloads',
        'settings-downloads-desc': 'Download the Android app to use offline.',
        'settings-select-version': 'Select Version',
        'settings-download-btn': 'Download APK',
        'settings-loading': 'Loading versions...',
        'settings-no-updates': 'No updates found',
        'settings-latest-version': 'Latest Version',
        'settings-previous-versions': 'Previous Versions',
        'settings-no-apks': 'No APKs available',
        'settings-file': 'File',
        'settings-downloading': 'Downloading...',

        // Bead Details Modal
        'bead-details': 'Bead Details',
        'bead-details-subtitle': 'Total beads in your design',
        'bead-details-no-beads': 'No beads in your design',
        'bead-details-total': 'Total',
        'bead-details-bead': 'bead',
        'bead-details-beads': 'beads',
        'bead-details-empty': 'No beads added yet',
        'bead-details-empty-hint': 'Add beads to your string to see them here',

        // Email Send Messages
        'email-sending': 'Sending...',
        'email-success': 'Design sent successfully!',
        'email-success-message': 'Your design has been sent. We will contact you soon!',
        'email-failed': 'Failed to send design.',
        'email-failed-message': 'Please try again or contact us directly.',
        'email-anonymous': 'Anonymous',
        'email-no-notes': 'No additional notes',
        'email-total-objects': 'Total Objects',
        'email-breakdown': 'Breakdown',
        'email-no-objects': 'No objects placed in design',

        // Validation Messages
        'validation-both-required': 'Both Email Address and Phone Number are required.',
        'validation-fill-both': 'Please fill in both fields to send your email.',
        'validation-invalid-domain': 'Invalid email domain.',
        'validation-allowed-domains': 'Only Gmail (@gmail.com), Yahoo (@yahoo.com), Hotmail (@hotmail.com), and Proton (@proton.me) are allowed.',
        'validation-username-long': 'Username too long.',
        'validation-username-max': 'Username must be maximum 20 characters before the @ symbol.',
        'validation-username-format': 'Invalid username format.',
        'validation-username-chars': 'Username can only contain English letters with optional dot (.), dash (-), or underscore (_) - maximum one of each symbol.',
        'validation-phone-format': 'Invalid phone number format.',
        'validation-phone-hint': 'Only numbers are required (7-13 digits). Optional formatting: spaces, dashes (-), parentheses (), and plus sign (+). Plain numbers like "0410930309" are perfectly fine.',
        'validation-phone-length': 'Invalid phone number length.',
        'validation-phone-digits': 'Phone number must contain 7-13 digits.',
        'validation-invalid-fields': 'Invalid field(s).',
        'validation-check-fields': 'Please check the highlighted field(s) and try again.',
        'validation-error-title': 'Validation Error',

        // Notification Modal
        'notification-ok': 'OK'
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
        'cancel': 'إلغاء',

        // Slider Limit Toast
        'slider-limit-toast-title': 'عدد الخرز كبير!',
        'slider-limit-toast-message': 'لا يمكن تقليل الحجم',

        // Settings Menu
        'settings-title': 'الإعدادات',
        'settings-general': 'عام',
        'settings-language': 'اللغة',
        'settings-downloads': 'تنزيل التطبيق',
        'settings-downloads-desc': 'قم بتنزيل تطبيق الأندرويد للاستخدام دون اتصال.',
        'settings-select-version': 'اختر الإصدار',
        'settings-download-btn': 'تحميل APK',
        'settings-loading': 'جاري تحميل الإصدارات...',
        'settings-no-updates': 'لا توجد تحديثات',
        'settings-latest-version': 'أحدث إصدار',
        'settings-previous-versions': 'الإصدارات السابقة',
        'settings-no-apks': 'لا تتوفر ملفات APK',
        'settings-file': 'ملف',
        'settings-downloading': 'جاري التحميل...',

        // Bead Details Modal
        'bead-details': 'تفاصيل الخرز',
        'bead-details-subtitle': 'إجمالي الخرز في تصميمك',
        'bead-details-no-beads': 'لا يوجد خرز في تصميمك',
        'bead-details-total': 'المجموع',
        'bead-details-bead': 'خرزة',
        'bead-details-beads': 'خرزات',
        'bead-details-empty': 'لم يتم إضافة خرز بعد',
        'bead-details-empty-hint': 'أضف الخرز إلى الخيط لرؤيتها هنا',

        // Email Send Messages
        'email-sending': 'جاري الإرسال...',
        'email-success': 'تم إرسال التصميم بنجاح!',
        'email-success-message': 'تم إرسال تصميمك. سنتواصل معك قريباً!',
        'email-failed': 'فشل إرسال التصميم.',
        'email-failed-message': 'يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.',
        'email-anonymous': 'مجهول',
        'email-no-notes': 'لا توجد ملاحظات إضافية',
        'email-total-objects': 'إجمالي العناصر',
        'email-breakdown': 'التفاصيل',
        'email-no-objects': 'لم يتم وضع عناصر في التصميم',

        // Validation Messages
        'validation-both-required': 'مطلوب كل من عنوان البريد الإلكتروني ورقم الهاتف.',
        'validation-fill-both': 'يرجى ملء كلا الحقلين لإرسال بريدك الإلكتروني.',
        'validation-invalid-domain': 'نطاق البريد الإلكتروني غير صالح.',
        'validation-allowed-domains': 'يُسمح فقط بـ Gmail (@gmail.com) و Yahoo (@yahoo.com) و Hotmail (@hotmail.com) و Proton (@proton.me).',
        'validation-username-long': 'اسم المستخدم طويل جداً.',
        'validation-username-max': 'يجب أن يكون اسم المستخدم 20 حرفاً كحد أقصى قبل علامة @.',
        'validation-username-format': 'تنسيق اسم المستخدم غير صالح.',
        'validation-username-chars': 'يمكن أن يحتوي اسم المستخدم على أحرف إنجليزية فقط مع نقطة (.) أو شرطة (-) أو شرطة سفلية (_) اختيارية - حد أقصى واحد من كل رمز.',
        'validation-phone-format': 'تنسيق رقم الهاتف غير صالح.',
        'validation-phone-hint': 'الأرقام فقط مطلوبة (7-13 رقم). التنسيق الاختياري: مسافات، شرطات (-)، أقواس ()، وعلامة الجمع (+). الأرقام العادية مثل "0410930309" مقبولة تماماً.',
        'validation-phone-length': 'طول رقم الهاتف غير صالح.',
        'validation-phone-digits': 'يجب أن يحتوي رقم الهاتف على 7-13 رقم.',
        'validation-invalid-fields': 'حقل (حقول) غير صالح.',
        'validation-check-fields': 'يرجى التحقق من الحقل (الحقول) المميزة والمحاولة مرة أخرى.',
        'validation-error-title': 'خطأ في التحقق',

        // Notification Modal
        'notification-ok': 'حسناً'
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

    setLanguage(lang) {
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