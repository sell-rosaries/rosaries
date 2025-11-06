/*
    GALLERY UI MODULE
    Handles gallery UI components and display
*/

// Note: galleryData, currentGalleryCategory, and selectedGalleryImages are global variables

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