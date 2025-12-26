/*
    UI & DOM MANIPULATION
    Bottom sheet panel, bead grid, category tabs, tool selection, size selection
*/

/**
 * Load size preferences from localStorage
 */
function loadSizePreferences() {
    try {
        const stored = localStorage.getItem('beadSizePreferences');
        if (stored) {
            beadSizePreferences = JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Could not load size preferences:', e);
        beadSizePreferences = {};
    }
}

/**
 * Save size preferences to localStorage
 */
function saveSizePreferences() {
    try {
        localStorage.setItem('beadSizePreferences', JSON.stringify(beadSizePreferences));
    } catch (e) {
        console.warn('Could not save size preferences:', e);
    }
}

/**
 * Dynamically creates the bead and tool selection UI in the panel.
 */
function createBeadSelection() {
    const container = document.getElementById('bead-selection');
    container.innerHTML = '';

    // Update tool card selection state
    const stringTool = document.getElementById('string-tool');
    if (stringTool) {
        if (isStringMode) {
            stringTool.classList.add('selected');
        } else {
            stringTool.classList.remove('selected');
        }
    }

    // Category tabs
    createCategoryTabs();

    // Object items based on selected category
    let filteredObjects = getObjectsByCategory(currentCategoryFilter);

    if (filteredObjects.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `<p>No beads in this category</p>`;
        container.appendChild(emptyState);
        return;
    }

    // Special handling for "All" category - show recent and favorites first
    if (currentCategoryFilter === 'all') {
        const recentIds = getRecentBeads();
        const favoriteIds = getFavoriteBeads();

        // Get recent bead objects (max 3)
        const recentBeads = recentIds
            .map(id => objects.find(obj => obj.id === id))
            .filter(obj => obj); // Remove null/undefined

        // Get favorite bead objects
        const favoriteBeads = favoriteIds
            .map(id => objects.find(obj => obj.id === id))
            .filter(obj => obj);

        // Get all other beads (excluding recent and favorites)
        const usedIds = new Set([...recentIds, ...favoriteIds]);
        const otherBeads = filteredObjects.filter(obj => !usedIds.has(obj.id));

        // Combine: recent + favorites + others
        filteredObjects = [...recentBeads, ...favoriteBeads, ...otherBeads];
    }

    filteredObjects.forEach((obj, index) => {
        const card = createBeadCard(obj);
        container.appendChild(card);
    });
}

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
        <div class="object-info">
            <div class="object-name">${obj.name}</div>
        </div>
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

/**
 * Selects an object and size for placement.
 */
function selectObjectSize(objectId, size) {
    isStringMode = false;
    isSelectMode = false;
    controls.enabled = false;
    selectedObjectId = objectId;
    selectedSize = size;
    hideRotationControl();
    createBeadSelection();
    updateFABIcon();
    updateSelectedBeadPreview();

    // Deactivate draw string button
    document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));

    // Update FAB to show active state
    document.getElementById('fab').classList.add('active');
}

/**
 * Updates FAB icon based on current mode
 */
function updateFABIcon() {
    const fabIcon = document.getElementById('fab-icon');
    if (!fabIcon) return; // Exit if icon element doesn't exist (e.g. new FAB design)

    if (isStringMode) {
        // String tool icon
        fabIcon.innerHTML = '<path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9z" stroke-dasharray="2 4"/>';
    } else if (selectedObjectId && selectedSize) {
        // Bead selected icon
        fabIcon.innerHTML = '<circle cx="12" cy="12" r="8" fill="none"/>';
    } else {
        // Default plus icon
        fabIcon.innerHTML = '<path d="M3 12h18M12 3v18"/>';
    }
}

/**
 * Updates the tool selection UI.
 */
function updateToolSelectionUI(selectedElement) {
    // Remove selected from all tool cards
    document.querySelectorAll('.tool-card').forEach(el => el.classList.remove('selected'));
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
}

/**
 * Opens the bead library panel
 */
function openBeadLibrary() {
    const panel = document.getElementById('bead-library-panel');
    panel.classList.add('open');
}

/**
 * Closes the bead library panel
 */
function closeBeadLibrary() {
    const panel = document.getElementById('bead-library-panel');
    panel.classList.remove('open');
}

/**
 * Updates the bead count display
 */
function updateBeadCount() {
    const count = beads.length;
    document.getElementById('header-bead-count').textContent = count;

    // Visibility update for Magic feature
    if (typeof updateMagicButtonVisibility === 'function') {
        updateMagicButtonVisibility();
    }
}


/**
 * Updates the selected bead preview image
 */
function updateSelectedBeadPreview() {
    const preview = document.getElementById('selected-bead-preview');
    const previewImg = document.getElementById('selected-bead-img');

    if (selectedObjectId && selectedSize) {
        const obj = getObjectById(selectedObjectId);
        if (obj) {
            previewImg.src = obj.image;
            preview.classList.add('active');
        }
    } else {
        preview.classList.remove('active');
    }
}
