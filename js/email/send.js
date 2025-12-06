/*
    EMAIL SEND MODULE
    Email sending logic and API integration
*/

async function sendDesignEmail() {
    // Check if Google Apps Script URL is configured
    if (GOOGLE_SCRIPT_URL === 'YOUR_SCRIPT_URL_HERE') {
        alert('⚠️ Google Apps Script is not configured yet!\n\nPlease update the GOOGLE_SCRIPT_URL in js/email.js with your Web App URL from Google Apps Script.');
        return;
    }

    // Get form values
    const anonymousText = window.getTranslation ? window.getTranslation('email-anonymous') : 'Anonymous';
    const noNotesText = window.getTranslation ? window.getTranslation('email-no-notes') : 'No additional notes';
    const customerName = document.getElementById('customer-name').value.trim() || anonymousText;
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerNotes = document.getElementById('customer-notes').value.trim() || noNotesText;

    // Validate contact info
    const validation = validateContactInfo(customerEmail, customerPhone);
    if (!validation.valid) {
        // Highlight error fields
        validation.fieldsToHighlight.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.classList.add('error-highlight');
            setTimeout(() => field.classList.remove('error-highlight'), 3000);
        });

        // Shake modal
        const modal = document.querySelector('.email-modal-content');
        modal.classList.add('shake');
        setTimeout(() => modal.classList.remove('shake'), 500);

        // Show error message using styled notification
        const validationTitle = window.getTranslation ? window.getTranslation('validation-error-title') || 'Validation Error' : 'Validation Error';
        showWarningNotification(validationTitle, validation.message.replace('⚠️ ', ''));
        return;
    }

    // Calculate object statistics
    const objectStats = calculateObjectStatistics();

    // Capture design image (high quality, no size limits!)
    const designImage = captureDesignImage();

    // Generate HTML export file
    const designHTML = generateDesignHTML();

    // Show loading state
    const sendBtn = document.getElementById('send-email-btn');
    const originalText = sendBtn.textContent;
    const sendingText = window.getTranslation ? window.getTranslation('email-sending') : 'Sending...';
    sendBtn.disabled = true;
    sendBtn.textContent = sendingText;

    try {
        // Prepare data for FRESH Google Apps Script
        const totalObjectsText = window.getTranslation ? window.getTranslation('email-total-objects') : 'Total Objects';
        const breakdownText = window.getTranslation ? window.getTranslation('email-breakdown') : 'Breakdown';
        const emailData = {
            name: customerName,
            email: customerEmail || 'Not provided',
            phone: customerPhone || 'Not provided',
            notes: customerNotes + '\n\nDesign Details:\n' +
                `${totalObjectsText}: ${objectStats.total}\n` +
                `${breakdownText}: ${objectStats.breakdown}`,
            design_image: designImage
        };

        // Send to Google Apps Script



        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain', // Use text/plain to avoid CORS preflight
            },
            body: JSON.stringify(emailData)
        });



        // Read and parse response
        const resultText = await response.text();


        // Try to parse as JSON
        let resultData;
        try {
            resultData = JSON.parse(resultText);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            throw new Error('Invalid response from server');
        }

        // Check if email actually sent
        if (!resultData.success) {
            throw new Error(resultData.message || 'Failed to send email');
        }

        // Success!
        const successTitle = window.getTranslation ? window.getTranslation('email-success') : 'Design sent successfully!';
        const successMsg = window.getTranslation ? window.getTranslation('email-success-message') : 'Your design has been sent. We will contact you soon!';
        showSuccessNotification(successTitle, successMsg, () => {
            closeEmailModal();
        });

    } catch (error) {
        console.error('Email send error:', error);
        const failTitle = window.getTranslation ? window.getTranslation('email-failed') : 'Failed to send design.';
        const failMsg = window.getTranslation ? window.getTranslation('email-failed-message') : 'Please try again or contact us directly.';
        showErrorNotification(failTitle, failMsg + '\n\nError: ' + error.message);

    } finally {
        // Restore button
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
    }
}


