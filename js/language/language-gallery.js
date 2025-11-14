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
        'send-selected-btn': 'Send Selected'
    };
    
    window.translations.ar = {
        ...window.translations.ar,
        // Gallery
        'design-gallery': 'معرض التصاميم',
        'send-selected': 'إرسال المحدد',
        'send-selected-designs-title': 'أرسل التصاميم المحددة',
        'send-selected-designs-subtitle': 'املأ معلوماتك أدناه. سيتم إرسال التصاميم المحددة!',
        
        // Gallery Email Modal
        'send-selected-btn': 'إرسال المحدد'
    };
}

// Extend LanguageManager prototype for Gallery UI functionality
if (typeof LanguageManager !== 'undefined') {
    LanguageManager.prototype._updateGalleryUI = function() {
        const langData = translations[this.currentLanguage];
        
        // Update gallery UI elements
        const elements = {
            // Gallery
            '.gallery-panel h2': langData['design-gallery'],
            '#send-selected-btn .btn-text': langData['send-selected'],
            
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
    
    LanguageManager.prototype.updateGalleryRequiredFields = function() {
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