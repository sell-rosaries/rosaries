/**
 * Language Management System - Gallery Module
 * Contains gallery interface translations and UI updates
 */

// Add gallery translations to the translations object
if (typeof window.translations !== 'undefined') {
    window.translations.en = {
        ...window.translations.en,
        // Gallery
        'design-gallery': 'Design Gallery',
        'send-selected': 'Send Selected',
        'send-selected-designs-title': 'Send Selected Designs',
        'send-selected-designs-subtitle': 'Fill in your information below. Selected designs will be sent!',

        // Gallery Email Modal (same as regular email but with Selected)
        'send-selected-btn': 'Send Selected',

        // Gallery Alert Messages
        'gallery-max-designs': 'You can only select up to 5 designs at a time.\n\nPlease deselect some designs before selecting more.',
        'gallery-select-at-least-one': 'Please select at least one design to send',
        'gallery-script-not-configured': 'Google Apps Script is not configured yet!\n\nPlease update the GOOGLE_SCRIPT_URL in js/email.js with your Web App URL from Google Apps Script.',
        'gallery-no-images-converted': 'Warning: None of the selected images could be converted for email sending.\n\nThe email will be sent but will not contain images.\n\nPlease check your internet connection and try again.',
        'gallery-send-success': 'Gallery request sent successfully!\n\nYour selected designs have been sent. We will contact you soon!',
        'gallery-send-failed': 'Failed to send gallery request.\n\nPlease try again or contact us directly.',
        'gallery-download-btn': 'Download Selected',
        'gallery-download-message': 'Starting downloads...',
        'gallery-download-started': 'Download started!',

        // Email Send Module
        'email-send-success': 'Design sent successfully!\n\nYour design has been sent. We will contact you soon!',
        'email-send-failed': 'Failed to send design.\n\nPlease try again or contact us directly.',

        // Application Errors
        'app-error-start': 'Error starting application. Please refresh the page.',
        'config-load-failed': 'Could not load inventory!\n\nIf opening HTML directly, you need to:\n1. Run a local server, OR\n2. Upload to GitHub Pages\n\nBrowser blocks file:// access to JSON files for security.'
    };

    window.translations.ar = {
        ...window.translations.ar,
        // Gallery
        'design-gallery': 'معرض التصاميم',
        'send-selected': 'إرسال المحدد',
        'send-selected-designs-title': 'أرسل التصاميم المحددة',
        'send-selected-designs-subtitle': 'املأ معلوماتك أدناه. سيتم إرسال التصاميم المحددة!',

        // Gallery Email Modal
        'send-selected-btn': 'إرسال المحدد',

        // Gallery Alert Messages
        'gallery-max-designs': 'يمكنك تحديد 5 تصاميم كحد أقصى في المرة الواحدة.\n\nيرجى إلغاء تحديد بعض التصاميم قبل تحديد المزيد.',
        'gallery-select-at-least-one': 'يرجى تحديد تصميم واحد على الأقل للإرسال',
        'gallery-script-not-configured': 'لم يتم تكوين Google Apps Script بعد!\n\nيرجى تحديث GOOGLE_SCRIPT_URL في js/email.js بعنوان URL الخاص بتطبيق الويب من Google Apps Script.',
        'gallery-no-images-converted': 'تحذير: لم يتم تحويل أي من الصور المحددة لإرسال البريد الإلكتروني.\n\nسيتم إرسال البريد الإلكتروني ولكن لن يحتوي على صور.\n\nيرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
        'gallery-send-success': 'تم إرسال طلب المعرض بنجاح!\n\nتم إرسال تصاميمك المحددة. سنتواصل معك قريباً!',
        'gallery-send-failed': 'فشل في إرسال طلب المعرض.\n\nيرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة.',
        'gallery-download-btn': 'تحميل المحدد',
        'gallery-download-message': 'جاري بدء التحميل...',
        'gallery-download-started': 'بدأ التحميل!',

        // Email Send Module
        'email-send-success': 'تم إرسال التصميم بنجاح!\n\nتم إرسال تصميمك. سنتواصل معك قريباً!',
        'email-send-failed': 'فشل في إرسال التصميم.\n\nيرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة.',

        // Application Errors
        'app-error-start': 'خطأ في بدء التطبيق. يرجى تحديث الصفحة.',
        'config-load-failed': 'تعذر تحميل المخزون!\n\nإذا كنت تفتح HTML مباشرة، تحتاج إلى:\n1. تشغيل خادم محلي، أو\n2. الرفع إلى GitHub Pages\n\nالمتصفح يحظر الوصول إلى ملفات JSON لأسباب أمنية.'
    };
}

// Extend LanguageManager prototype for Gallery UI functionality
if (typeof LanguageManager !== 'undefined') {
    LanguageManager.prototype._updateGalleryUI = function () {
        const langData = translations[this.currentLanguage];

        // Update gallery UI elements
        const elements = {
            // Gallery
            '.gallery-panel h2': langData['design-gallery'],
            '#send-selected-btn .btn-text': langData['send-selected'],
            '#download-selected-btn .btn-text': langData['gallery-download-btn'],

            // Gallery Email Modal
            '#gallery-email-modal h2': langData['send-selected-designs-title'],
            '#gallery-email-modal .modal-subtitle': langData['send-selected-designs-subtitle'],
            '#send-gallery-email-btn .btn-text': langData['send-selected-btn'],
            '#gallery-email-modal .btn-secondary': langData['cancel'],

            // Gallery form labels
            'label[for="gallery-customer-name"]': langData['name'],
            'label[for="gallery-customer-email"]': langData['email'],
            'label[for="gallery-customer-phone"]': langData['phone'],
            'label[for="gallery-customer-notes"]': langData['notes'],

            // Gallery placeholders
            '#gallery-customer-name::placeholder': langData['name-placeholder'],
            '#gallery-customer-email::placeholder': langData['email-placeholder'],
            '#gallery-customer-phone::placeholder': langData['phone-placeholder'],
            '#gallery-customer-notes::placeholder': langData['notes-placeholder']
        };

        // Apply text translations
        Object.entries(elements).forEach(([selector, text]) => {
            this.updateElementText(selector, text);
        });

        // Special handling for gallery required fields
        this.updateGalleryRequiredFields();
    };

    LanguageManager.prototype.updateGalleryRequiredFields = function () {
        const langData = translations[this.currentLanguage];

        // Handle gallery email required field
        const galleryEmailLabel = document.querySelector('label[for="gallery-customer-email"]');
        if (galleryEmailLabel) {
            const requiredSpan = galleryEmailLabel.querySelector('.required');
            if (requiredSpan) {
                galleryEmailLabel.innerHTML = langData['email'] + ' ' + `<span class="required">${langData['email-required']}</span>`;
            } else {
                galleryEmailLabel.textContent = langData['email'];
            }
        }

        // Handle gallery phone required field
        const galleryPhoneLabel = document.querySelector('label[for="gallery-customer-phone"]');
        if (galleryPhoneLabel) {
            const requiredSpan = galleryPhoneLabel.querySelector('.required');
            if (requiredSpan) {
                galleryPhoneLabel.innerHTML = langData['phone'] + ' ' + `<span class="required">${langData['phone-required']}</span>`;
            } else {
                galleryPhoneLabel.textContent = langData['phone'];
            }
        }
    };
}