/**
 * Language Management System - Email Module
 * Contains email form translations and UI updates
 */

// Add email translations to the translations object
if (typeof window.translations !== 'undefined') {
    window.translations.en = {
        ...window.translations.en,
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
        'cancel': 'Cancel'
    };
    
    window.translations.ar = {
        ...window.translations.ar,
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
        'cancel': 'إلغاء'
    };
}

// Extend LanguageManager prototype for Email UI functionality
if (typeof LanguageManager !== 'undefined') {
    LanguageManager.prototype._updateEmailUI = function() {
        const langData = translations[this.currentLanguage];
        
        // Update email modal UI elements
        const elements = {
            // Email Modal
            '#email-modal h2': langData['send-design-title'],
            '#email-modal .modal-subtitle': langData['send-design-subtitle'],
            '#send-email-btn .btn-text': langData['send-design-btn'],
            '#email-modal .btn-secondary': langData['cancel'],
            
            // Form labels
            'label[for="customer-name"]': langData['name'],
            'label[for="customer-email"]': langData['email'],
            'label[for="customer-phone"]': langData['phone'],
            'label[for="customer-notes"]': langData['notes'],
            
            // Form notes
            '.form-note': langData['form-note'],
            
            // Placeholders
            '#customer-name::placeholder': langData['name-placeholder'],
            '#customer-email::placeholder': langData['email-placeholder'],
            '#customer-phone::placeholder': langData['phone-placeholder'],
            '#customer-notes::placeholder': langData['notes-placeholder']
        };
        
        // Apply text translations
        Object.entries(elements).forEach(([selector, text]) => {
            this.updateElementText(selector, text);
        });
        
        // Special handling for required field indicators
        this.updateRequiredFields();
    };
    
    LanguageManager.prototype.updateRequiredFields = function() {
        const langData = translations[this.currentLanguage];
        
        // Handle email required field
        const emailLabel = document.querySelector('label[for="customer-email"]');
        if (emailLabel) {
            const requiredSpan = emailLabel.querySelector('.required');
            if (requiredSpan) {
                emailLabel.innerHTML = langData['email'] + ' ' + `<span class="required">${langData['email-required']}</span>`;
            } else {
                emailLabel.textContent = langData['email'];
            }
        }
        
        // Handle phone required field
        const phoneLabel = document.querySelector('label[for="customer-phone"]');
        if (phoneLabel) {
            const requiredSpan = phoneLabel.querySelector('.required');
            if (requiredSpan) {
                phoneLabel.innerHTML = langData['phone'] + ' ' + `<span class="required">${langData['phone-required']}</span>`;
            } else {
                phoneLabel.textContent = langData['phone'];
            }
        }
    };
}