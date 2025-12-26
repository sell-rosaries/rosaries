/*
    UI BEADS MODULE
    Handles bead UI components and interactions
*/

/**
 * Creates a single bead card with heart icon
 */
function createBeadCard(obj) {
    const card = document.createElement('div');
    card.className = 'object-card';
    card.dataset.objectId = obj.id;

    // Check if this bead has a selected size
    const selectedSizeForBead = beadSizePreferences[obj.id];
    const sizeBadge = selectedSizeForBead ?
        `<div class="size-badge" data-object-id="${obj.id}" data-size="${selectedSizeForBead}">${selectedSizeForBead}mm</div>` : '';

    // Heart icon for favorites
    const isFav = isFavorite(obj.id);
    const heartIcon = `
        <button class="favorite-btn ${isFav ? 'active' : ''}" data-object-id="${obj.id}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? '#e53935' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        </button>
    `;

    card.innerHTML = `
        ${heartIcon}
        <img src="${obj.thumbnail}" alt="${obj.name}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'">
        ${sizeBadge}
    `;

    // Heart button click handler (prevent card click)
    const heartBtn = card.querySelector('.favorite-btn');
    heartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isFavorited = toggleFavorite(obj.id);
        heartBtn.classList.toggle('active', isFavorited);

        // Update heart fill
        const svg = heartBtn.querySelector('svg');
        svg.setAttribute('fill', isFavorited ? '#e53935' : 'none');

        // Refresh the grid to reorder
        createBeadSelection();
    });

    // Size badge click handler (open size selection modal)
    const sizeBadgeEl = card.querySelector('.size-badge');
    if (sizeBadgeEl) {
        sizeBadgeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            // Size badge always opens the size selection modal
            openSizeSelectionModal(obj.id, obj.name);
        });
    }

    // Card click handler with smart logic:
    // - If bead has selected size: directly select it and close library
    // - If no selection yet: open size selection modal
    card.addEventListener('click', () => {
        if (selectedSizeForBead) {
            // Smart workflow: directly select and close library
            selectObjectSize(obj.id, selectedSizeForBead);
            closeBeadLibrary();
        } else {
            // Fresh start: open modal for initial selection
            openSizeSelectionModal(obj.id, obj.name);
        }
    });

    return card;
}

/**
 * Opens the size selection modal for a bead
 */
function openSizeSelectionModal(objectId, objectName) {
    pendingSizeSelectionObjectId = objectId;

    const modal = document.getElementById('size-selection-modal');
    const nameEl = document.getElementById('size-modal-bead-name');
    const gridEl = document.getElementById('size-selection-grid');

    nameEl.textContent = objectName;

    // Create size buttons (4, 6, 8, 10, 12, 14)
    gridEl.innerHTML = '';
    const sizes = [4, 6, 8, 10, 12, 14];

    sizes.forEach(size => {
        const btn = document.createElement('button');
        btn.className = 'size-selection-btn';
        btn.innerHTML = `
            <span class="size-value">${size}</span>
            <span class="size-label">mm</span>
        `;

        btn.addEventListener('click', () => {
            confirmSizeSelection(objectId, size);
        });

        gridEl.appendChild(btn);
    });

    modal.classList.add('active');
}

/**
 * Closes the size selection modal
 */
function closeSizeSelectionModal() {
    const modal = document.getElementById('size-selection-modal');
    modal.classList.remove('active');
    pendingSizeSelectionObjectId = null;
}

/**
 * Confirms the size selection and updates the UI
 */
function confirmSizeSelection(objectId, size) {
    // Store the preference
    beadSizePreferences[objectId] = size;
    saveSizePreferences();

    // Track as recently used
    trackRecentBead(objectId);

    // Set as selected for placement
    selectObjectSize(objectId, size);

    // Close modal
    closeSizeSelectionModal();

    // Auto-close bead library panel for better UX
    closeBeadLibrary();

    // Refresh the bead grid to show the size badge
    createBeadSelection();
}

/**
 * Creates category tabs for filtering objects.
 */
function createCategoryTabs() {
    const tabsContainer = document.getElementById('category-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    const allTab = document.createElement('button');
    allTab.className = 'category-tab' + (currentCategoryFilter === 'all' ? ' active' : '');
    allTab.textContent = 'All';
    allTab.addEventListener('click', () => filterByCategory('all'));
    tabsContainer.appendChild(allTab);

    categories.forEach(cat => {
        const tab = document.createElement('button');
        tab.className = 'category-tab' + (currentCategoryFilter === cat.id ? ' active' : '');
        tab.textContent = cat.name;
        tab.addEventListener('click', () => filterByCategory(cat.id));
        tabsContainer.appendChild(tab);
    });
}

/**
 * Filters objects by category and refreshes the panel.
 */
function filterByCategory(categoryId) {
    currentCategoryFilter = categoryId;
    createBeadSelection();
}