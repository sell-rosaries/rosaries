/*
    GALLERY MODULE
    Handles gallery display, image selection, and email functionality
*/

// Gallery state
let galleryData = null;
let currentGalleryCategory = 'all';
let selectedGalleryImages = new Set();

/**
 * Load gallery configuration
 */
async function loadGalleryConfig() {
    try {
        const response = await fetch('gallery-index.json');
        galleryData = await response.json();
        console.log('✅ Gallery config loaded:', galleryData);
    } catch (error) {
        console.warn('⚠️ Could not load gallery config:', error);
        galleryData = { categories: [] };
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
 * Create gallery category grid
 */
function createGalleryCategoryTabs() {
    const gridContainer = document.getElementById('gallery-category-grid');
    gridContainer.innerHTML = '';

    // Add "All" tab
    const allTab = document.createElement('button');
    allTab.className = `gallery-category-tab ${currentGalleryCategory === 'all' ? 'active' : ''}`;
    allTab.textContent = 'All';
    allTab.onclick = () => {
        currentGalleryCategory = 'all';
        createGalleryView();
    };
    gridContainer.appendChild(allTab);

    // Add category tabs
    if (galleryData && galleryData.categories) {
        galleryData.categories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = `gallery-category-tab ${currentGalleryCategory === category.id ? 'active' : ''}`;
            tab.textContent = category.name;
            tab.onclick = () => {
                currentGalleryCategory = category.id;
                createGalleryView();
            };
            gridContainer.appendChild(tab);
        });
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
 * Create gallery view
 */
function createGalleryView() {
    createGalleryCategoryTabs();
    
    const gridContainer = document.getElementById('gallery-grid');
    gridContainer.innerHTML = '';

    const items = getGalleryItemsByCategory(currentGalleryCategory);

    if (items.length === 0) {
        gridContainer.innerHTML = '<p class="gallery-empty">No designs available yet</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        
        const isSelected = selectedGalleryImages.has(item.id);
        const isFavorited = isFavorite(item.id);
        
        card.innerHTML = `
            <div class="gallery-image-wrapper">
                <input type="checkbox" 
                       class="gallery-checkbox" 
                       id="checkbox-${item.id}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleGallerySelection('${item.id}')">
                <label for="checkbox-${item.id}" class="gallery-checkbox-label"></label>
                <button class="gallery-favorite-btn ${isFavorited ? 'active' : ''}" 
                        data-item-id="${item.id}"
                        title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                    <svg width="28" height="28" viewBox="0 0 24 24" 
                         fill="${isFavorited ? '#e53935' : 'none'}" 
                         stroke="currentColor" 
                         stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
                <img src="${item.image}" 
                     alt="${item.name}" 
                     onclick="openFullscreenImage('${item.image}', '${item.name}')">
            </div>
        `;
        
        gridContainer.appendChild(card);
    });

    // Add event listeners for favorite buttons
    addFavoriteButtonListeners();
}

/**
 * Add event listeners to favorite buttons
 */
function addFavoriteButtonListeners() {
    const favoriteButtons = document.querySelectorAll('.gallery-favorite-btn');
    
    favoriteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const itemId = button.getAttribute('data-item-id');
            const isFavorited = toggleFavorite(itemId);
            
            // Update button state
            button.classList.toggle('active', isFavorited);
            
            // Update heart icon fill
            const svg = button.querySelector('svg');
            svg.setAttribute('fill', isFavorited ? '#e53935' : 'none');
            
            // Update title
            button.setAttribute('title', isFavorited ? 'Remove from favorites' : 'Add to favorites');
            
            // Refresh the gallery view to reorder items
            createGalleryView();
        });
    });
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
            alert('❌ You can only select up to 5 designs at a time.\n\nPlease deselect some designs before selecting more.');
            return;
        }
        selectedGalleryImages.add(itemId);
    }
    updateSendButton();
}

/**
 * Update send button visibility
 */
function updateSendButton() {
    const sendBtn = document.getElementById('send-selected-btn');
    if (selectedGalleryImages.size > 0) {
        sendBtn.style.display = 'flex';
        sendBtn.textContent = `Send Selected (${selectedGalleryImages.size})`;
    } else {
        sendBtn.style.display = 'none';
    }
}

/**
 * Open fullscreen image view
 */
function openFullscreenImage(imagePath, imageName) {
    const modal = document.getElementById('fullscreen-modal');
    const img = document.getElementById('fullscreen-image');
    img.src = imagePath;
    img.alt = imageName;
    modal.classList.add('active');
}

/**
 * Close fullscreen image view
 */
function closeFullscreenModal() {
    const modal = document.getElementById('fullscreen-modal');
    modal.classList.remove('active');
}

/**
 * Convert gallery images to base64 format
 */
function convertImagesToBase64(imagePaths) {
    return new Promise((resolve, reject) => {
        const results = [];
        let processed = 0;
        const total = imagePaths.length;
        
        console.log('🖼️ Starting image conversion for', total, 'images');
        
        if (total === 0) {
            console.log('🖼️ No images to convert');
            resolve(results);
            return;
        }
        
        imagePaths.forEach((imagePath, index) => {
            console.log(`🖼️ Converting image ${index + 1}/${total}:`, imagePath);
            
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Handle CORS issues
            
            img.onload = () => {
                try {
                    console.log(`🖼️ Image ${index + 1} loaded successfully, size: ${img.width}x${img.height}`);
                    
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
                    console.log(`🖼️ Image ${index + 1} converted to base64, size: ${Math.round(base64Size / 1024)}KB`);
                    
                    results[index] = {
                        name: imagePath.split('/').pop(),
                        imageData: base64Data,
                        originalPath: imagePath,
                        width: img.width,
                        height: img.height,
                        base64Size: Math.round(base64Size / 1024) + 'KB'
                    };
                    
                    processed++;
                    console.log(`🖼️ Processed ${processed}/${total} images`);
                    
                    if (processed === total) {
                        console.log('✅ All images converted successfully');
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
                        console.log('⚠️ Image conversion completed with errors');
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
                    console.log('⚠️ Image conversion completed with load errors');
                    resolve(results);
                }
            };
            
            // Set a timeout for image loading
            img.onloadTimeout = setTimeout(() => {
                console.error(`⏰ Timeout loading image ${index + 1}:`, imagePath);
                img.onerror('Timeout loading image');
            }, 10000); // 10 second timeout
            
            img.src = imagePath;
        });
    });
}

/**
 * Open gallery email modal
 */
function openGalleryEmailModal() {
    if (selectedGalleryImages.size === 0) {
        alert('Please select at least one design to send');
        return;
    }
    
    if (selectedGalleryImages.size > 5) {
        alert('❌ You can only select up to 5 designs at a time.\n\nPlease deselect some designs before sending.');
        return;
    }
    
    const modal = document.getElementById('gallery-email-modal');
    modal.classList.add('active');
}

/**
 * Close gallery email modal
 */
function closeGalleryEmailModal() {
    const modal = document.getElementById('gallery-email-modal');
    modal.classList.remove('active');
}

/**
 * Send gallery email using Google Apps Script
 */
async function sendGalleryEmail(event) {
    event.preventDefault();
    
    // Check if Google Apps Script URL is configured
    if (GOOGLE_SCRIPT_URL === 'YOUR_SCRIPT_URL_HERE') {
        alert('⚠️ Google Apps Script is not configured yet!\n\nPlease update the GOOGLE_SCRIPT_URL in js/email.js with your Web App URL from Google Apps Script.');
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
        
        alert(validation.message);
        return;
    }
    
    if (selectedGalleryImages.size === 0) {
        alert('Please select at least one design');
        return;
    }
    
    // Check 5-image limit
    if (selectedGalleryImages.size > 5) {
        alert('❌ You can only select up to 5 designs at a time.');
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
        console.log('🖼️ Converting gallery images to base64...');
        const imagePaths = selectedItems.map(item => item.image);
        console.log('📁 Image paths to convert:', imagePaths);
        
        const galleryImages = await convertImagesToBase64(imagePaths);
        
        // Debug image conversion results
        console.log('🔍 Image conversion results:', galleryImages);
        const successfulImages = galleryImages.filter(img => img.imageData);
        const failedImages = galleryImages.filter(img => img.error);
        
        console.log('✅ Successfully converted images:', successfulImages.length);
        console.log('❌ Failed to convert images:', failedImages.length);
        
        if (failedImages.length > 0) {
            console.error('Failed image conversions:', failedImages);
            console.warn('⚠️ Some images failed to convert. Email will be sent but images may be missing.');
        }
        
        // Warn user if no images could be converted
        if (successfulImages.length === 0) {
            alert('⚠️ Warning: None of the selected images could be converted for email sending.\n\nThe email will be sent but will not contain images.\n\nPlease check your internet connection and try again.');
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
        console.log('📧 Sending gallery request to:', GOOGLE_SCRIPT_URL);
        console.log('🖼️ Selected designs:', selectedItems.length);
        console.log('🖼️ Images with data:', successfulImages.length);
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(emailData)
        });
        
        console.log('Response status:', response.status);
        
        // Read and parse response
        const resultText = await response.text();
        console.log('Response from Google Apps Script:', resultText);
        
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
        
        // Success! Provide detailed feedback about images
        let successMessage = '✅ Gallery request sent successfully!\n\n';
        successMessage += `Your selected designs have been sent (${selectedItems.length} designs).\n\n`;
        
        if (successfulImages.length > 0) {
            successMessage += `✅ All ${successfulImages.length} selected images included in email.\n`;
        } else {
            successMessage += `⚠️ No images could be included in the email.\n`;
        }
        
        successMessage += 'We will contact you soon!';
        
        alert(successMessage);
        
        // Close modals and reset
        closeGalleryEmailModal();
        closeGalleryModal();
        selectedGalleryImages.clear();
        
        // Reset form
        document.getElementById('gallery-email-form').reset();
        
    } catch (error) {
        console.error('Gallery email send error:', error);
        alert('❌ Failed to send gallery request.\n\nPlease try again or contact us directly.\n\nError: ' + error.message);
        
    } finally {
        // Restore button
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
    }
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
    
    // Import presets button (shown only in string mode)
    const importPresetsBtn = document.getElementById('import-presets-btn');
    if (importPresetsBtn) {
        importPresetsBtn.addEventListener('click', openImportPresetsModal);
    }
    
    // Gallery panel close button
    const closeGalleryBtn = document.getElementById('close-gallery-btn');
    if (closeGalleryBtn) {
        closeGalleryBtn.addEventListener('click', closeGalleryModal);
    }
    
    // Gallery panel backdrop
    const galleryPanelBackdrop = document.getElementById('gallery-panel-backdrop');
    if (galleryPanelBackdrop) {
        galleryPanelBackdrop.addEventListener('click', closeGalleryModal);
    }
    
    // Send selected button
    const sendSelectedBtn = document.getElementById('send-selected-btn');
    if (sendSelectedBtn) {
        sendSelectedBtn.addEventListener('click', openGalleryEmailModal);
    }
    
    // Gallery email form
    const galleryEmailForm = document.getElementById('gallery-email-form');
    if (galleryEmailForm) {
        galleryEmailForm.addEventListener('submit', sendGalleryEmail);
    }
}

/**
 * Open Import Presets Modal (empty for now)
 */
function openImportPresetsModal() {
    const modal = document.getElementById('import-presets-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close Import Presets Modal
 */
function closeImportPresetsModal() {
    const modal = document.getElementById('import-presets-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}
