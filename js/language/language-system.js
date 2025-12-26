/**
 * Language Management System - System Module
 * Contains system messages, error handling, and dynamic text templates
 */

// Extend LanguageManager prototype for System UI functionality
if (typeof LanguageManager !== 'undefined') {
    LanguageManager.prototype._updateSystemUI = function() {
        // System UI updates are handled through dynamic text replacement
        // This method can be extended for any system-level text updates
    };
    
    // Enhanced updateElementText method with system-level special handling
    const originalUpdateElementText = LanguageManager.prototype.updateElementText;
    LanguageManager.prototype.updateElementText = function(selector, text) {
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
        
        // Handle form note
        if (selector === '.form-note') {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = text;
            });
            return;
        }
        
        // Handle option titles and descriptions
        if (selector.includes('.option-title') || selector.includes('.option-desc')) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = text;
            });
            return;
        }
        
        // Call the original method for standard handling
        if (originalUpdateElementText) {
            originalUpdateElementText.call(this, selector, text);
        }
    };
}