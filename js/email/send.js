/*
    EMAIL SEND MODULE
    Email sending logic and API integration
*/

async function sendDesignEmail() {
    // Check if Google Apps Script URL is configured
    if (GOOGLE_SCRIPT_URL === 'YOUR_SCRIPT_URL_HERE') {
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-script-not-configured') : null) || 'Google Apps Script is not configured yet!\n\nPlease update the GOOGLE_SCRIPT_URL in js/email.js with your Web App URL from Google Apps Script.', 'warning');
        return;
    }

    // Get form values
    const customerName = document.getElementById('customer-name').value.trim() || 'Anonymous';
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerNotes = document.getElementById('customer-notes').value.trim() || 'No additional notes';

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

        // Show error message
        showCustomAlert(validation.message, 'error');
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
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
        // Prepare data for FRESH Google Apps Script
        const emailData = {
            name: customerName,
            email: customerEmail || 'Not provided',
            phone: customerPhone || 'Not provided',
            notes: customerNotes + '\n\nDesign Details:\n' +
                `Total Objects: ${objectStats.total}\n` +
                `Breakdown: ${objectStats.breakdown}`,
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
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('email-send-success') : null) || 'Design sent successfully!\n\nYour design has been sent. We will contact you soon!', 'success');
        closeEmailModal();

    } catch (error) {
        console.error('Email send error:', error);
        showCustomAlert(((typeof window.getTranslation === 'function' ? window.getTranslation('email-send-failed') : null) || 'Failed to send design.\n\nPlease try again or contact us directly.') + '\n\nError: ' + error.message, 'error');

    } finally {
        // Restore button
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
    }
}
