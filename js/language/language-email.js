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
        'cancel': 'Cancel',

        // Validation Error Messages
        'validation-email-domain': 'Invalid email domain.\n\nOnly Gmail (@gmail.com), Yahoo (@yahoo.com), Hotmail (@hotmail.com), and Proton (@proton.me) are allowed.',
        'validation-email-username-length': 'Username too long.\n\nUsername must be maximum 20 characters before the @ symbol.',
        'validation-email-username-format': 'Invalid username format.\n\nUsername can only contain English letters with optional dot (.), dash (-), or underscore (_) - maximum one of each symbol.',
        'validation-phone-format': 'Invalid phone number format.\n\nOnly numbers are required (7-13 digits). Optional formatting: spaces, dashes (-), parentheses (), and plus sign (+). Plain numbers like "0410930309" are perfectly fine.',
        'validation-phone-length': 'Invalid phone number length.\n\nPhone number must contain 7-13 digits.',
        'validation-both-required': 'Both Email Address and Phone Number are required.\n\nPlease fill in both fields to send your email.',
        'validation-invalid-fields': 'Invalid ${fields} field${plural}.\n\nPlease check the highlighted field${plural} and try again.'
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
        'cancel': 'إلغاء',

        // Validation Error Messages
        'validation-email-domain': 'نطاق البريد الإلكتروني غير صالح.\n\nيُسمح فقط بـ Gmail (@gmail.com) و Yahoo (@yahoo.com) و Hotmail (@hotmail.com) و Proton (@proton.me).',
        'validation-email-username-length': 'اسم المستخدم طويل جداً.\n\nيجب أن يكون اسم المستخدم 20 حرفاً كحد أقصى قبل علامة @.',
        'validation-email-username-format': 'تنسيق اسم المستخدم غير صالح.\n\nيمكن أن يحتوي اسم المستخدم على أحرف إنجليزية فقط مع نقطة (.) أو شرطة (-) أو شرطة سفلية (_) اختيارية - واحدة كحد أقصى من كل رمز.',
        'validation-phone-format': 'تنسيق رقم الهاتف غير صالح.\n\nالأرقام فقط مطلوبة (7-13 رقم). التنسيق الاختياري: المسافات والشرطات (-) والأقواس () وعلامة الجمع (+). الأرقام البسيطة مثل "0410930309" مقبولة تماماً.',
        'validation-phone-length': 'طول رقم الهاتف غير صالح.\n\nيجب أن يحتوي رقم الهاتف على 7-13 رقم.',
        'validation-both-required': 'مطلوب كل من عنوان البريد الإلكتروني ورقم الهاتف.\n\nيرجى ملء كلا الحقلين لإرسال بريدك الإلكتروني.',
        'validation-invalid-fields': 'حقل ${fields} غير صالح.\n\nيرجى التحقق من الحقل المميز والمحاولة مرة أخرى.'
    };
}

// Extend LanguageManager prototype for Email UI functionality
if (typeof LanguageManager !== 'undefined') {
    LanguageManager.prototype._updateEmailUI = function () {
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

    LanguageManager.prototype.updateRequiredFields = function () {
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