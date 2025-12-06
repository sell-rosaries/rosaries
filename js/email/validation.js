/*
    EMAIL VALIDATION MODULE
    Contact validation and design statistics
*/

/**
 * Validates email address with strict domain and username constraints
 */
function validateEmail(email) {
    if (!email || email === 'Not provided') {
        return { valid: true, message: '' };
    }

    const emailLower = email.toLowerCase().trim();

    // Check allowed domains
    const allowedDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@proton.me'];
    const domainMatch = allowedDomains.find(domain => emailLower.endsWith(domain));

    if (!domainMatch) {
        const title = window.getTranslation ? window.getTranslation('validation-invalid-domain') : 'Invalid email domain.';
        const desc = window.getTranslation ? window.getTranslation('validation-allowed-domains') : 'Only Gmail (@gmail.com), Yahoo (@yahoo.com), Hotmail (@hotmail.com), and Proton (@proton.me) are allowed.';
        return {
            valid: false,
            message: `⚠️ ${title}\n\n${desc}`
        };
    }

    // Extract username part (before @)
    const username = emailLower.split('@')[0];

    // Check username length (max 20 characters)
    if (username.length > 20) {
        const title = window.getTranslation ? window.getTranslation('validation-username-long') : 'Username too long.';
        const desc = window.getTranslation ? window.getTranslation('validation-username-max') : 'Username must be maximum 20 characters before the @ symbol.';
        return {
            valid: false,
            message: `⚠️ ${title}\n\n${desc}`
        };
    }

    // Check username contains only allowed characters
    // Allowed: English letters (a-z, A-Z), dot (.), dash (-), underscore (_)
    // Max one of each symbol
    const usernameRegex = /^[a-zA-Z]+([.\-_][a-zA-Z]+)*$/;

    if (!usernameRegex.test(username)) {
        const title = window.getTranslation ? window.getTranslation('validation-username-format') : 'Invalid username format.';
        const desc = window.getTranslation ? window.getTranslation('validation-username-chars') : 'Username can only contain English letters with optional dot (.), dash (-), or underscore (_) - maximum one of each symbol.';
        return {
            valid: false,
            message: `⚠️ ${title}\n\n${desc}`
        };
    }

    return { valid: true, message: '' };
}

/**
 * Validates phone number with strict constraints
 */
function validatePhone(phone) {
    if (!phone || phone === 'Not provided') {
        return { valid: true, message: '' };
    }

    // Remove whitespace for validation
    const cleanPhone = phone.trim();

    // Check if contains only allowed characters: numbers, parentheses, plus sign
    const allowedCharsRegex = /^[0-9()+\-\s]+$/;

    if (!allowedCharsRegex.test(cleanPhone)) {
        const title = window.getTranslation ? window.getTranslation('validation-phone-format') : 'Invalid phone number format.';
        const desc = window.getTranslation ? window.getTranslation('validation-phone-hint') : 'Only numbers are required (7-13 digits). Optional formatting: spaces, dashes (-), parentheses (), and plus sign (+). Plain numbers like "0410930309" are perfectly fine.';
        return {
            valid: false,
            message: `⚠️ ${title}\n\n${desc}`
        };
    }

    // Extract only numbers to count digit count
    const digitsOnly = cleanPhone.replace(/[^\d]/g, '');

    // Check digit count (minimum 7, maximum 13)
    if (digitsOnly.length < 7 || digitsOnly.length > 13) {
        const title = window.getTranslation ? window.getTranslation('validation-phone-length') : 'Invalid phone number length.';
        const desc = window.getTranslation ? window.getTranslation('validation-phone-digits') : 'Phone number must contain 7-13 digits.';
        return {
            valid: false,
            message: `⚠️ ${title}\n\n${desc}`
        };
    }

    return { valid: true, message: '' };
}

function validateContactInfo(email, phone) {
    // Remove whitespace for validation
    const cleanEmail = email ? email.trim() : '';
    const cleanPhone = phone ? phone.trim() : '';

    // Check if both fields are filled
    if (!cleanEmail || !cleanPhone) {
        const title = window.getTranslation ? window.getTranslation('validation-both-required') : 'Both Email Address and Phone Number are required.';
        const desc = window.getTranslation ? window.getTranslation('validation-fill-both') : 'Please fill in both fields to send your email.';
        return {
            valid: false,
            message: `⚠️ ${title}\n\n${desc}`,
            fieldsToHighlight: ['customer-email', 'customer-phone', 'gallery-customer-email', 'gallery-customer-phone']
        };
    }

    // Check if fields are filled and validate them
    const emailIsFilled = cleanEmail && cleanEmail !== 'Not provided';
    const phoneIsFilled = cleanPhone && cleanPhone !== 'Not provided';

    let emailValid = false;
    let phoneValid = false;
    const invalidFields = [];
    const fieldsToHighlight = [];

    // Validate email if provided
    if (emailIsFilled) {
        const emailValidation = validateEmail(cleanEmail);
        if (emailValidation.valid) {
            emailValid = true;
        } else {
            invalidFields.push('email');
            // Find which email field has this value and highlight it
            if (document.getElementById('customer-email')?.value.trim() === cleanEmail) {
                fieldsToHighlight.push('customer-email');
            }
            if (document.getElementById('gallery-customer-email')?.value.trim() === cleanEmail) {
                fieldsToHighlight.push('gallery-customer-email');
            }
        }
    }

    // Validate phone if provided
    if (phoneIsFilled) {
        const phoneValidation = validatePhone(cleanPhone);
        if (phoneValidation.valid) {
            phoneValid = true;
        } else {
            invalidFields.push('phone');
            // Find which phone field has this value and highlight it
            if (document.getElementById('customer-phone')?.value.trim() === cleanPhone) {
                fieldsToHighlight.push('customer-phone');
            }
            if (document.getElementById('gallery-customer-phone')?.value.trim() === cleanPhone) {
                fieldsToHighlight.push('gallery-customer-phone');
            }
        }
    }

    // SUCCESS: Both fields are valid and filled
    if ((emailIsFilled && emailValid) && (phoneIsFilled && phoneValid)) {
        return { valid: true, message: '', fieldsToHighlight: [] };
    }

    // FAILURE: No valid filled fields
    const invalidTitle = window.getTranslation ? window.getTranslation('validation-invalid-fields') : 'Invalid field(s).';
    const invalidDesc = window.getTranslation ? window.getTranslation('validation-check-fields') : 'Please check the highlighted field(s) and try again.';
    return {
        valid: false,
        message: `⚠️ ${invalidTitle}\n\n${invalidDesc}`,
        fieldsToHighlight: fieldsToHighlight.length > 0 ? fieldsToHighlight : []
    };
}

/**
 * Calculates object statistics from placed beads
 */
function calculateObjectStatistics() {
    const total = beads.length;

    if (total === 0) {
        const noObjectsText = window.getTranslation ? window.getTranslation('email-no-objects') : 'No objects placed in design';
        return {
            total: 0,
            breakdown: `<p style="color: #999;">${noObjectsText}</p>`
        };
    }

    // Count objects by name and size
    const objectCounts = {};
    const categoryCounts = {};

    beads.forEach(bead => {
        if (bead.userData && bead.userData.objectId) {
            const obj = getObjectById(bead.userData.objectId);

            if (obj) {
                const size = bead.userData.size;
                const key = `${obj.name} (${size}mm)`;

                // Count individual objects
                if (!objectCounts[key]) {
                    objectCounts[key] = {
                        count: 0,
                        categoryId: obj.categoryId
                    };
                }
                objectCounts[key].count++;

                // Count by category
                const category = getCategoryById(obj.categoryId);
                const categoryName = category ? category.name : 'Unknown';
                if (!categoryCounts[categoryName]) {
                    categoryCounts[categoryName] = 0;
                }
                categoryCounts[categoryName]++;
            }
        }
    });

    // Format breakdown grouped by category with nice formatting
    let breakdown = '<div style="line-height: 1.6;">';

    // Group objects by category
    const objectsByCategory = {};
    for (const [objectName, data] of Object.entries(objectCounts)) {
        const category = getCategoryById(data.categoryId);
        const categoryName = category ? category.name : 'Unknown';

        if (!objectsByCategory[categoryName]) {
            objectsByCategory[categoryName] = [];
        }
        objectsByCategory[categoryName].push({ name: objectName, count: data.count });
    }

    // Display each category with its objects
    for (const [categoryName, count] of Object.entries(categoryCounts)) {
        breakdown += `<p style="margin: 10px 0 5px 0;"><b>${categoryName}:</b> ${count} total</p>`;
        breakdown += '<ul style="margin: 0 0 10px 20px;">';

        const items = objectsByCategory[categoryName] || [];
        for (const item of items) {
            breakdown += `<li>${item.name} × ${item.count}</li>`;
        }

        breakdown += '</ul>';
    }

    breakdown += '</div>';

    return {
        total: total,
        breakdown: breakdown
    };
}
