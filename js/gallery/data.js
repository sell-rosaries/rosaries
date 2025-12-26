/*
    GALLERY DATA MODULE
    Handles gallery data management and configuration
*/

// Gallery state
let galleryData = null;
let currentGalleryCategory = 'all';
let selectedGalleryImages = new Set();

// Google Apps Script Configuration - imported from email/modal.js

/**
 * Load gallery configuration
 */
async function loadGalleryConfig() {
    try {
        const response = await fetch('gallery-index.json');
        galleryData = await response.json();

    } catch (error) {
        console.warn('⚠️ Could not load gallery config:', error);
        galleryData = { categories: [] };
    }
}

/**
 * Get gallery items by category
 */
function getGalleryItemsByCategory(categoryFilter) {
    if (!galleryData || !galleryData.categories) {
        return [];
    }

    let items = [];

    if (categoryFilter === 'all') {
        // Return all items from all categories
        items = galleryData.categories.reduce((all, category) => {
            return all.concat(category.items || []);
        }, []);
    } else {
        // Return items from specific category
        const category = galleryData.categories.find(cat => cat.id === categoryFilter);
        items = category ? (category.items || []) : [];
    }

    // Sort to show favorites first (when in "all" category)
    if (categoryFilter === 'all' && items.length > 0) {
        const favoriteIds = JSON.parse(localStorage.getItem('rosary-favorites') || '[]');

        // Separate favorite and non-favorite items
        const favoriteItems = items.filter(item => favoriteIds.includes(item.id));
        const nonFavoriteItems = items.filter(item => !favoriteIds.includes(item.id));

        // Combine: favorites first, then others
        items = [...favoriteItems, ...nonFavoriteItems];
    }

    return items;
}

/**
 * Initialize gallery event listeners
 */
function initGalleryEventListeners() {
    // Library button - now directly opens gallery panel
    const libraryBtn = document.getElementById('library-btn');
    if (libraryBtn) {
        libraryBtn.addEventListener('click', openGalleryModal);
    }

    // Gallery close buttons - use correct IDs from HTML
    const closeGalleryBtn = document.getElementById('close-gallery-btn');
    const galleryPanelBackdrop = document.getElementById('gallery-panel-backdrop');

    if (closeGalleryBtn) {
        closeGalleryBtn.addEventListener('click', closeGalleryModal);
    }

    if (galleryPanelBackdrop) {
        galleryPanelBackdrop.addEventListener('click', closeGalleryModal);
    }

    // Gallery overlay click to close
    const galleryOverlay = document.getElementById('gallery-modal-overlay');
    if (galleryOverlay) {
        galleryOverlay.addEventListener('click', function (e) {
            if (e.target === galleryOverlay) {
                closeGalleryModal();
            }
        });
    }

    // Keyboard shortcuts for gallery
    document.addEventListener('keydown', function (e) {
        const galleryPanel = document.getElementById('gallery-panel');
        if (galleryPanel && galleryPanel.classList.contains('open')) {
            if (e.key === 'Escape') {
                closeGalleryModal();
            }
        }
    });

    // Send selected button - setup email functionality
    const sendSelectedBtn = document.getElementById('send-selected-btn');
    if (sendSelectedBtn) {
        sendSelectedBtn.addEventListener('click', openGalleryEmailModal);
    }

    // Download selected button
    const downloadSelectedBtn = document.getElementById('download-selected-btn');
    if (downloadSelectedBtn) {
        downloadSelectedBtn.addEventListener('click', downloadGalleryImages);
    }

    // Gallery email form submission
    const galleryEmailForm = document.getElementById('gallery-email-form');
    if (galleryEmailForm) {
        galleryEmailForm.addEventListener('submit', sendGalleryEmail);
    }


}

/**
 * Open gallery panel
 */
function openGalleryModal() {
    const panel = document.getElementById('gallery-panel');
    panel.classList.add('open');
    createGalleryView();
}

/**
 * Close gallery panel
 */
function closeGalleryModal() {
    const panel = document.getElementById('gallery-panel');
    panel.classList.remove('open');
    selectedGalleryImages.clear();
    updateSendButton();
}

/**
 * Toggle gallery image selection with 5-image limit
 */
function toggleGallerySelection(itemId) {
    if (selectedGalleryImages.has(itemId)) {
        selectedGalleryImages.delete(itemId);
    } else {
        if (selectedGalleryImages.size >= 5) {
            // Prevent the checkbox from being checked
            const checkbox = document.getElementById(`checkbox-${itemId}`);
            if (checkbox) {
                checkbox.checked = false;
            }
            showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-max-designs') : null) || 'You can only select up to 5 designs at a time.\n\nPlease deselect some designs before selecting more.', 'error');
            return;
        }
        selectedGalleryImages.add(itemId);
    }
    updateSendButton();
}

/**
 * Open gallery email modal
 */
function openGalleryEmailModal() {
    if (selectedGalleryImages.size === 0) {
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-select-at-least-one') : null) || 'Please select at least one design to send', 'warning');
        return;
    }

    if (selectedGalleryImages.size > 5) {
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-max-designs') : null) || 'You can only select up to 5 designs at a time.\n\nPlease deselect some designs before sending.', 'error');
        return;
    }

    const modal = document.getElementById('gallery-email-modal');
    modal.classList.add('active');

    // Setup real-time validation for gallery inputs
    setupGalleryRealTimeValidation();
}

/**
 * Close gallery email modal
 */
function closeGalleryEmailModal() {
    const modal = document.getElementById('gallery-email-modal');
    modal.classList.remove('active');
}

/**
 * Sets up real-time validation for gallery email and phone inputs
 */
function setupGalleryRealTimeValidation() {
    const emailInput = document.getElementById('gallery-customer-email');
    const phoneInput = document.getElementById('gallery-customer-phone');

    // Combined validation function that considers OR logic
    function validateGalleryFieldsWithOrLogic() {
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
        emailInput.addEventListener('input', validateGalleryFieldsWithOrLogic);
        emailInput.addEventListener('blur', validateGalleryFieldsWithOrLogic);
    }

    // Real-time phone validation
    if (phoneInput) {
        phoneInput.addEventListener('input', validateGalleryFieldsWithOrLogic);
        phoneInput.addEventListener('blur', validateGalleryFieldsWithOrLogic);
    }
}

/**
 * Send gallery email using Google Apps Script
 */
async function sendGalleryEmail(event) {
    event.preventDefault();

    // Check if Google Apps Script URL is configured
    if (window.GOOGLE_SCRIPT_URL === 'YOUR_SCRIPT_URL_HERE') {
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-script-not-configured') : null) || 'Google Apps Script is not configured yet!\n\nPlease update the GOOGLE_SCRIPT_URL in js/email.js with your Web App URL from Google Apps Script.', 'warning');
        return;
    }

    const customerName = document.getElementById('gallery-customer-name').value.trim() || 'Anonymous';
    const customerEmail = document.getElementById('gallery-customer-email').value.trim();
    const customerPhone = document.getElementById('gallery-customer-phone').value.trim();
    const customerNotes = document.getElementById('gallery-customer-notes').value.trim() || 'No additional notes';

    // Validate contact info using the same function as sandbox email
    const validation = validateContactInfo(customerEmail, customerPhone);
    if (!validation.valid) {
        // Highlight error fields
        validation.fieldsToHighlight.forEach(fieldId => {
            const field = document.getElementById('gallery-' + fieldId);
            if (field) {
                field.classList.add('error-highlight');
                setTimeout(() => field.classList.remove('error-highlight'), 3000);
            }
        });

        showCustomAlert(validation.message, 'error');
        return;
    }

    if (selectedGalleryImages.size === 0) {
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-select-at-least-one') : null) || 'Please select at least one design', 'warning');
        return;
    }

    // Check 5-image limit
    if (selectedGalleryImages.size > 5) {
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-max-designs') : null) || 'You can only select up to 5 designs at a time.', 'error');
        return;
    }

    // Get selected items
    const allItems = getGalleryItemsByCategory('all');
    const selectedItems = allItems.filter(item => selectedGalleryImages.has(item.id));

    // Create gallery items HTML for email
    let galleryItemsHTML = '<div style="line-height: 1.8;">';
    galleryItemsHTML += '<p><b>Selected Designs:</b></p>';
    galleryItemsHTML += '<ul style="margin: 10px 0 10px 20px;">';
    selectedItems.forEach((item, index) => {
        galleryItemsHTML += `<li><b>${item.name}</b> - ${item.description || 'No description'}</li>`;
    });
    galleryItemsHTML += '</ul>';
    galleryItemsHTML += '</div>';

    // Show loading state
    const sendBtn = document.getElementById('send-gallery-email-btn');
    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Processing images...';

    try {
        // Convert gallery images to base64 format

        const imagePaths = selectedItems.map(item => item.image);


        const galleryImages = await convertImagesToBase64(imagePaths);

        // Debug image conversion results

        const successfulImages = galleryImages.filter(img => img.imageData);
        const failedImages = galleryImages.filter(img => img.error);




        if (failedImages.length > 0) {
            console.error('Failed image conversions:', failedImages);
            console.warn('⚠️ Some images failed to convert. Email will be sent but images may be missing.');
        }

        // Warn user if no images could be converted
        if (successfulImages.length === 0) {
            showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-no-images-converted') : null) || 'Warning: None of the selected images could be converted for email sending.\n\nThe email will be sent but will not contain images.\n\nPlease check your internet connection and try again.', 'warning');
        }

        // Update loading text
        sendBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Sending email...';

        // **ENHANCED SCRIPT SUPPORT**: Send multiple images in gallery format
        // Prepare data for enhanced Google Apps Script that supports multiple attachments

        // Prepare data for FRESH Google Apps Script
        const emailData = {
            name: customerName,
            email: customerEmail || 'Not provided',
            phone: customerPhone || 'Not provided',
            notes: customerNotes,

            // Send gallery designs with image data
            selected_designs: successfulImages.map((img, index) => ({
                id: selectedItems[index].id,
                title: selectedItems[index].name,
                image_data: img.imageData
            }))
        };

        // Send to Google Apps Script




        const response = await fetch(window.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
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

        // Success! Provide detailed feedback about images - use translations
        const isArabic = (typeof languageManager !== 'undefined' && languageManager.currentLanguage === 'ar') || (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar');
        const gallerySuccessBase = (typeof window.getTranslation === 'function' ? window.getTranslation('gallery-send-success') : null) || 'Gallery request sent successfully!\n\nYour selected designs have been sent. We will contact you soon!';
        let successMessage = '✅ ' + gallerySuccessBase.split('\n')[0] + '\n\n';
        successMessage += `${isArabic ? 'تم إرسال تصاميمك المحددة' : 'Your selected designs have been sent'} (${selectedItems.length} ${isArabic ? 'تصاميم' : 'designs'}).\n\n`;

        if (successfulImages.length > 0) {
            successMessage += `✅ ${isArabic ? `تم تضمين جميع ${successfulImages.length} صور محددة في البريد الإلكتروني` : `All ${successfulImages.length} selected images included in email`}.\n`;
        } else {
            successMessage += `⚠️ ${isArabic ? 'لم يتم تضمين أي صور في البريد الإلكتروني' : 'No images could be included in the email'}.\n`;
        }

        successMessage += isArabic ? 'سنتواصل معك قريباً!' : 'We will contact you soon!';

        showCustomAlert(successMessage, 'success');

        // Close modals and reset
        closeGalleryEmailModal();
        closeGalleryModal();
        selectedGalleryImages.clear();

        // Reset form
        document.getElementById('gallery-email-form').reset();

    } catch (error) {
        console.error('Gallery email send error:', error);
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-send-failed') : null) || 'Failed to send gallery request.\n\nPlease try again or contact us directly.\n\nError: ' + error.message, 'error');

    } finally {
        // Restore button
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
    }
}

/**
 * Update send button visibility
 */
/**
 * Update send/download button visibility
 */
function updateSendButton() {
    const sendBtn = document.getElementById('send-selected-btn');
    const downloadBtn = document.getElementById('download-selected-btn');

    // Get translations for button text
    const sendText = (typeof window.getTranslation === 'function' ? window.getTranslation('send-selected') : 'Send Selected');
    const downloadText = (typeof window.getTranslation === 'function' ? window.getTranslation('gallery-download-btn') : 'Download Selected');

    if (selectedGalleryImages.size > 0) {
        // Update Send Button
        if (sendBtn) {
            sendBtn.style.display = 'flex';
            // Find text span if it exists to preserve icon
            const textSpan = sendBtn.querySelector('.btn-text');
            if (textSpan) {
                textSpan.textContent = `${sendText} (${selectedGalleryImages.size})`;
            } else {
                sendBtn.textContent = `${sendText} (${selectedGalleryImages.size})`;
            }
        }

        // Update Download Button
        if (downloadBtn) {
            downloadBtn.style.display = 'flex';
            // Find text span if it exists to preserve icon
            const textSpan = downloadBtn.querySelector('.btn-text');
            if (textSpan) {
                textSpan.textContent = `${downloadText} (${selectedGalleryImages.size})`;
            } else {
                downloadBtn.textContent = `${downloadText} (${selectedGalleryImages.size})`;
            }
        }
    } else {
        if (sendBtn) sendBtn.style.display = 'none';
        if (downloadBtn) downloadBtn.style.display = 'none';
    }
}

/**
 * Validates email and phone fields
 * Returns {valid: boolean, message: string, fieldsToHighlight: array}
 */
function validateContactInfo(email, phone) {
    // Check if both fields are filled
    if (!email || !phone) {
        return {
            valid: false,
            message: '⚠️ Both Email Address and Phone Number are required.\n\nPlease fill in both fields to send your email.',
            fieldsToHighlight: ['customer-email', 'customer-phone']
        };
    }

    // Validate email format
    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailLower)) {
        return {
            valid: false,
            message: '⚠️ Invalid Email Format\n\nPlease enter a valid email address.',
            fieldsToHighlight: ['customer-email']
        };
    }

    // Validate phone format
    const phoneRegex = /^[\d\s\-\(\)\+]{7,20}$/;
    const digitCount = (phone.match(/\d/g) || []).length;

    if (!phoneRegex.test(phone) || digitCount < 7 || digitCount > 13) {
        return {
            valid: false,
            message: '⚠️ Invalid Phone Number\n\nOnly numbers are required (7-13 digits). Optional formatting: spaces, dashes (-), parentheses (), and plus sign (+). Plain numbers like \'0410930309\' are perfectly fine.',
            fieldsToHighlight: ['customer-phone']
        };
    }

    return { valid: true, message: '', fieldsToHighlight: [] };
}

/**
 * Convert gallery images to base64 format
 */
function convertImagesToBase64(imagePaths) {
    return new Promise((resolve, reject) => {
        const results = [];
        let processed = 0;
        const total = imagePaths.length;



        if (total === 0) {

            resolve(results);
            return;
        }

        imagePaths.forEach((imagePath, index) => {


            const img = new Image();
            img.crossOrigin = 'anonymous'; // Handle CORS issues

            img.onload = () => {
                // Clear timeout on successful load
                if (img.loadTimeout) {
                    clearTimeout(img.loadTimeout);
                }
                try {


                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Set canvas size to image size
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0);

                    // Convert to base64 with high quality
                    const base64Data = canvas.toDataURL('image/jpeg', 0.9);

                    // Log base64 data length for debugging
                    const base64Size = base64Data.length;


                    results[index] = {
                        name: imagePath.split('/').pop(),
                        imageData: base64Data,
                        originalPath: imagePath,
                        width: img.width,
                        height: img.height,
                        base64Size: Math.round(base64Size / 1024) + 'KB'
                    };

                    processed++;


                    if (processed === total) {

                        resolve(results);
                    }
                } catch (error) {
                    console.error(`❌ Error processing image ${index + 1}:`, imagePath, error);
                    results[index] = {
                        name: imagePath.split('/').pop(),
                        imageData: null,
                        originalPath: imagePath,
                        error: error.message,
                        errorType: 'conversion_error'
                    };
                    processed++;
                    if (processed === total) {

                        resolve(results);
                    }
                }
            };

            img.onerror = (error) => {
                console.error(`❌ Failed to load image ${index + 1}:`, imagePath, error);
                results[index] = {
                    name: imagePath.split('/').pop(),
                    imageData: null,
                    originalPath: imagePath,
                    error: 'Failed to load image',
                    errorType: 'load_error'
                };
                processed++;
                if (processed === total) {

                    resolve(results);
                }
            };

            // Set a timeout for image loading
            img.loadTimeout = setTimeout(() => {
                console.error(`⏰ Timeout loading image ${index + 1}:`, imagePath);
                img.onerror('Timeout loading image');
            }, 10000); // 10 second timeout

            img.src = imagePath;
        });
    });
}

/**
 * Clean filename by removing price part ($XX pattern)
 * @param {string} filename - The filename to clean
 * @returns {string} - Cleaned filename without price
 */
function cleanFilename(filename) {
    if (!filename) return filename;

    // Remove $ followed by numbers along with any preceding punctuation
    // This handles cases like "file.$25" -> "file.png" and "file,$25" -> "file.png"
    return filename.replace(/([.,!_]?)\$\d+/g, '');
}

/**
 * Download selected gallery images
 * Supports both Website (browser download) and APK (Android DownloadManager)
 */
function downloadGalleryImages() {
    if (selectedGalleryImages.size === 0) {
        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-select-at-least-one') : null) || 'Please select at least one design to download', 'warning');
        return;
    }

    // Get selected items
    const allItems = getGalleryItemsByCategory('all');
    const selectedItems = allItems.filter(item => selectedGalleryImages.has(item.id));

    // Check if running in APK
    const isApk = typeof window.Android !== 'undefined' && typeof window.Android.downloadUrl === 'function';

    if (isApk) {
        // APK Download Logic
        selectedItems.forEach(item => {
            // Construct full URL using current location as base
            try {
                // Determine base URL - if we are in file:// android asset, this works relative to it
                // If we are on website, this works too.
                const fullUrl = new URL(item.image, window.location.href).href;

                // Create filename with just the original name, price removed, extension preserved
                const originalFilename = item.image.split('/').pop(); // Get just the filename
                const cleanFilenameOnly = cleanFilename(originalFilename); // Remove price part

                // Trigger Android native download
                window.Android.downloadUrl(fullUrl, cleanFilenameOnly);
            } catch (e) {
                console.error('Error constructing download URL:', e);
                // Fallback to original path if URL construction fails
                window.Android.downloadUrl(item.image, cleanFilename(item.image.split('/').pop()));
            }
        });

        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-download-message') : null) || 'Starting downloads...', 'success');

    } else {
        // Website Browser Download Logic
        // Use fetch + blob to ensure browser downloads the image instead of opening it
        selectedItems.forEach((item, index) => {
            setTimeout(async () => {
                try {
                    const response = await fetch(item.image);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.style.display = 'none';
                    link.href = url;

                    // Use original filename with just price removed, extension preserved
                    const originalFilename = item.image.split('/').pop(); // Get just the filename
                    const cleanFilenameOnly = cleanFilename(originalFilename); // Remove price part
                    link.download = cleanFilenameOnly;

                    document.body.appendChild(link);
                    link.click();

                    // Cleanup
                    setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(link);
                    }, 100);

                } catch (e) {
                    console.error('Download failed, using fallback:', e);
                    // Fallback to simple link click if fetch fails (e.g. cross-origin)
                    const link = document.createElement('a');
                    link.href = item.image;
                    link.download = cleanFilename(item.image.split('/').pop());
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }, index * 500); // Stagger downloads
        });

        showCustomAlert((typeof window.getTranslation === 'function' ? window.getTranslation('gallery-download-started') : null) || 'Download started!', 'success');
    }
}

// Make all gallery functions globally available
window.initGalleryEventListeners = initGalleryEventListeners;
window.toggleGallerySelection = toggleGallerySelection;
window.openGalleryEmailModal = openGalleryEmailModal;
window.closeGalleryEmailModal = closeGalleryEmailModal;
window.sendGalleryEmail = sendGalleryEmail;
window.downloadGalleryImages = downloadGalleryImages;
window.cleanFilename = cleanFilename;
