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
        return {
            valid: false,
            message: (typeof window.getTranslation === 'function' ? window.getTranslation('validation-email-domain') : null) || 'Invalid email domain.\n\nOnly Gmail (@gmail.com), Yahoo (@yahoo.com), Hotmail (@hotmail.com), and Proton (@proton.me) are allowed.'
        };
    }

    // Extract username part (before @)
    const username = emailLower.split('@')[0];

    // Check username length (max 20 characters)
    if (username.length > 20) {
        return {
            valid: false,
            message: (typeof window.getTranslation === 'function' ? window.getTranslation('validation-email-username-length') : null) || 'Username too long.\n\nUsername must be maximum 20 characters before the @ symbol.'
        };
    }

    // Check username contains only allowed characters
    // Allowed: English letters (a-z, A-Z), dot (.), dash (-), underscore (_)
    // Max one of each symbol
    const usernameRegex = /^[a-zA-Z]+([.\-_][a-zA-Z]+)*$/;

    if (!usernameRegex.test(username)) {
        return {
            valid: false,
            message: (typeof window.getTranslation === 'function' ? window.getTranslation('validation-email-username-format') : null) || 'Invalid username format.\n\nUsername can only contain English letters with optional dot (.), dash (-), or underscore (_) - maximum one of each symbol.'
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
        return {
            valid: false,
            message: (typeof window.getTranslation === 'function' ? window.getTranslation('validation-phone-format') : null) || 'Invalid phone number format.\n\nOnly numbers are required (7-13 digits). Optional formatting: spaces, dashes (-), parentheses (), and plus sign (+). Plain numbers like "0410930309" are perfectly fine.'
        };
    }

    // Extract only numbers to count digit count
    const digitsOnly = cleanPhone.replace(/[^\d]/g, '');

    // Check digit count (minimum 7, maximum 13)
    if (digitsOnly.length < 7 || digitsOnly.length > 13) {
        return {
            valid: false,
            message: (typeof window.getTranslation === 'function' ? window.getTranslation('validation-phone-length') : null) || 'Invalid phone number length.\n\nPhone number must contain 7-13 digits.'
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
        return {
            valid: false,
            message: (typeof window.getTranslation === 'function' ? window.getTranslation('validation-both-required') : null) || 'Both Email Address and Phone Number are required.\n\nPlease fill in both fields to send your email.',
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
    return {
        valid: false,
        message: `⚠️ Invalid ${invalidFields.join(' and ')} field${invalidFields.length > 1 ? 's' : ''}.\n\nPlease check the highlighted field${invalidFields.length > 1 ? 's' : ''} and try again.`,
        fieldsToHighlight: fieldsToHighlight.length > 0 ? fieldsToHighlight : []
    };
}

/**
 * Calculates object statistics from placed beads
 */
function calculateObjectStatistics() {
    const total = beads.length;

    if (total === 0) {
        return {
            total: 0,
            breakdown: '<p style="color: #999;">No objects placed in design</p>'
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
