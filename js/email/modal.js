/*
    EMAIL MODAL MODULE
    Email modal management and configuration
*/

// ============================================
// Google Apps Script Configuration
// ============================================
// IMPORTANT: Replace this with your actual Google Apps Script Web App URL
// Get it from: script.google.com after deploying your script
// It should look like: https://script.google.com/macros/s/ABC...xyz/exec

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx-8kVZ1EWwbl-rJ8I0AqihudzD1aaS3pN0rtIQhR5ttE4DqG5Jp_X0y5mbYnGDEoTg/exec';  // Fresh Email System URL

// ============================================

/**
 * Opens the email modal
 */
function openEmailModal() {
    document.getElementById('email-modal').classList.add('active');
    // Clear previous input
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-notes').value = '';

    // Remove any error highlights
    document.getElementById('customer-email').classList.remove('error-highlight');
    document.getElementById('customer-phone').classList.remove('error-highlight');

    // Setup real-time validation
    setupRealTimeValidation();
}

/**
 * Sets up real-time validation for email and phone inputs
 */
function setupRealTimeValidation() {
    const emailInput = document.getElementById('customer-email');
    const phoneInput = document.getElementById('customer-phone');

    // Combined validation function that considers OR logic
    function validateFieldsWithOrLogic() {
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';

        // Clear both fields first
        if (emailInput) clearFieldError(emailInput);
        if (phoneInput) clearFieldError(phoneInput);

        // Check if at least one field has content
        if (!email && !phone) {
            // Both empty - no validation needed
            return;
        }

        // Check each field independently
        let emailValid = false;
        let phoneValid = false;

        if (email && email !== 'Not provided') {
            const emailValidation = validateEmail(email);
            emailValid = emailValidation.valid;
        }

        if (phone && phone !== 'Not provided') {
            const phoneValidation = validatePhone(phone);
            phoneValid = phoneValidation.valid;
        }

        // Apply validation with OR logic:
        // If one field is valid and filled, the other becomes optional
        if (email && email !== 'Not provided') {
            if (emailValid) {
                setFieldSuccess(emailInput);
                // Email is valid, so phone becomes optional - clear any phone errors
                if (phoneInput && phone && !phoneValid) {
                    // Phone has content but invalid, but since email is valid, this is okay
                    clearFieldError(phoneInput);
                }
            } else {
                setFieldError(emailInput, validateEmail(email).message);
            }
        }

        if (phone && phone !== 'Not provided') {
            if (phoneValid) {
                setFieldSuccess(phoneInput);
                // Phone is valid, so email becomes optional - clear any email errors
                if (emailInput && email && !emailValid) {
                    // Email has content but invalid, but since phone is valid, this is okay
                    clearFieldError(emailInput);
                }
            } else {
                setFieldError(phoneInput, validatePhone(phone).message);
            }
        }
    }

    // Real-time email validation
    if (emailInput) {
        emailInput.addEventListener('input', validateFieldsWithOrLogic);
        emailInput.addEventListener('blur', validateFieldsWithOrLogic);
    }

    // Real-time phone validation
    if (phoneInput) {
        phoneInput.addEventListener('input', validateFieldsWithOrLogic);
        phoneInput.addEventListener('blur', validateFieldsWithOrLogic);
    }
}

/**
 * Sets error state on input field
 */
function setFieldError(input, message) {
    input.classList.remove('success-highlight');
    input.classList.add('error-highlight');

    // Remove existing error message
    removeFieldErrorMessage(input);

    // Add error message below input
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error-message';
    errorDiv.textContent = message.replace(/⚠️ /g, '').replace(/\n/g, ' ');
    input.parentNode.appendChild(errorDiv);
}

/**
 * Sets success state on input field
 */
function setFieldSuccess(input) {
    input.classList.remove('error-highlight');
    input.classList.add('success-highlight');
    removeFieldErrorMessage(input);
}

/**
 * Clears error state from input field
 */
function clearFieldError(input) {
    input.classList.remove('error-highlight', 'success-highlight');
    removeFieldErrorMessage(input);
}

/**
 * Removes error message from input field
 */
function removeFieldErrorMessage(input) {
    const existingError = input.parentNode.querySelector('.field-error-message');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Closes the email modal
 */
function closeEmailModal() {
    document.getElementById('email-modal').classList.remove('active');
}

/**
 * Closes modal when clicking backdrop
 */
function closeEmailModalOnBackdrop(event) {
    if (event.target.id === 'email-modal') {
        closeEmailModal();
    }
}

// Make GOOGLE_SCRIPT_URL globally available for other modules
window.GOOGLE_SCRIPT_URL = GOOGLE_SCRIPT_URL;
