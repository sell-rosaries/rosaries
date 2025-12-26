/*
    UI PANEL MODULE
    Handles UI panel management and bead selection
*/

/**
 * Dynamically creates the bead and tool selection UI in the panel.
 */
let beadPage = 1;
const BEAD_ITEMS_PER_PAGE = 20;

function createBeadSelection(resetPage = true) {
    const container = document.getElementById('bead-selection');

    if (resetPage) {
        beadPage = 1;
        container.innerHTML = '';
        createCategoryTabs(); // Only recreate tabs on full reset
    }


    // Update tool card selection state
    const stringTool = document.getElementById('string-tool');
    if (stringTool) {
        if (isStringMode) {
            stringTool.classList.add('selected');
        } else {
            stringTool.classList.remove('selected');
        }
    }

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

    // Pagination logic
    const startIndex = (beadPage - 1) * BEAD_ITEMS_PER_PAGE;
    const endIndex = startIndex + BEAD_ITEMS_PER_PAGE;
    const itemsToRender = filteredObjects.slice(startIndex, endIndex);

    itemsToRender.forEach((obj, index) => {
        const card = createBeadCard(obj);
        container.appendChild(card);
    });

    // Add Sentinel for Infinite Scroll if more items exist
    const existingSentinel = document.getElementById('bead-loader-sentinel');
    if (existingSentinel) existingSentinel.remove();

    if (endIndex < filteredObjects.length) {
        const sentinel = document.createElement('div');
        sentinel.id = 'bead-loader-sentinel';
        sentinel.style.height = '10px';
        sentinel.style.width = '100%';
        sentinel.style.marginTop = '10px';
        container.appendChild(sentinel);

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.disconnect();
                sentinel.remove();
                beadPage++;
                createBeadSelection(false);
            }
        }, { rootMargin: '200px' });

        observer.observe(sentinel);
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