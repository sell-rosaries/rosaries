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
 * Open library modal
 */
function openLibraryModal() {
    const modal = document.getElementById('library-modal');
    modal.classList.add('active');
}

/**
 * Close library modal
 */
function closeLibraryModal() {
    const modal = document.getElementById('library-modal');
    modal.classList.remove('active');
}

/**
 * Open gallery modal
 */
function openGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    modal.classList.add('active');
    closeLibraryModal();
    createGalleryView();
}

/**
 * Close gallery modal
 */
function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    modal.classList.remove('active');
    selectedGalleryImages.clear();
    updateSendButton();
}

/**
 * Create gallery category tabs
 */
function createGalleryCategoryTabs() {
    const tabsContainer = document.getElementById('gallery-category-tabs');
    tabsContainer.innerHTML = '';

    // Add "All" tab
    const allTab = document.createElement('button');
    allTab.className = `gallery-category-tab ${currentGalleryCategory === 'all' ? 'active' : ''}`;
    allTab.textContent = 'All';
    allTab.onclick = () => {
        currentGalleryCategory = 'all';
        createGalleryView();
    };
    tabsContainer.appendChild(allTab);

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
            tabsContainer.appendChild(tab);
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

    if (categoryFilter === 'all') {
        // Return all items from all categories
        return galleryData.categories.reduce((all, category) => {
            return all.concat(category.items || []);
        }, []);
    } else {
        // Return items from specific category
        const category = galleryData.categories.find(cat => cat.id === categoryFilter);
        return category ? (category.items || []) : [];
    }
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
        
        card.innerHTML = `
            <div class="gallery-image-wrapper">
                <input type="checkbox" 
                       class="gallery-checkbox" 
                       id="checkbox-${item.id}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleGallerySelection('${item.id}')">
                <label for="checkbox-${item.id}" class="gallery-checkbox-label"></label>
                <img src="${item.image}" 
                     alt="${item.name}" 
                     onclick="openFullscreenImage('${item.image}', '${item.name}')">
            </div>
            <div class="gallery-card-info">
                <div class="gallery-card-name">${item.name}</div>
                <div class="gallery-card-desc">${item.description || ''}</div>
            </div>
        `;
        
        gridContainer.appendChild(card);
    });
}

/**
 * Toggle gallery image selection
 */
function toggleGallerySelection(itemId) {
    if (selectedGalleryImages.has(itemId)) {
        selectedGalleryImages.delete(itemId);
    } else {
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
 * Open gallery email modal
 */
function openGalleryEmailModal() {
    if (selectedGalleryImages.size === 0) {
        alert('Please select at least one design to send');
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
    sendBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Sending...';
    
    try {
        // Prepare data for Google Apps Script
        const emailData = {
            customer_name: customerName,
            customer_email: customerEmail || 'Not provided',
            customer_phone: customerPhone || 'Not provided',
            customer_notes: customerNotes,
            is_gallery_request: true,
            selected_designs: selectedItems.map(item => ({
                name: item.name,
                description: item.description,
                image_path: item.image
            })),
            total_selections: selectedItems.length,
            gallery_items_html: galleryItemsHTML,
            timestamp: new Date().toLocaleString()
        };
        
        // Send to Google Apps Script
        console.log('📧 Sending gallery request to:', GOOGLE_SCRIPT_URL);
        console.log('🖼️ Selected designs:', selectedItems.length);
        
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
        
        // Success!
        alert('✅ Gallery request sent successfully!\n\nYour selected designs have been sent. We will contact you soon!');
        
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
    // Library button
    const libraryBtn = document.getElementById('library-btn');
    if (libraryBtn) {
        libraryBtn.addEventListener('click', openLibraryModal);
    }
    
    // Import design button (placeholder)
    const importBtn = document.getElementById('import-design-btn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            alert('📥 Import Design feature coming soon!');
        });
    }
    
    // Open gallery button
    const openGalleryBtn = document.getElementById('open-gallery-btn');
    if (openGalleryBtn) {
        openGalleryBtn.addEventListener('click', openGalleryModal);
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
