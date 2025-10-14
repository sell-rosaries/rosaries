/*
    UI & DOM MANIPULATION
    Sidebar, category tabs, bead cards, tool selection
*/

/**
 * Dynamically creates the bead and tool selection UI in the sidebar.
 */
function createBeadSelection() {
    const container = document.getElementById('bead-selection');
    container.innerHTML = '';

    // Tool: Draw String (Select mode is now automatic)
    const stringCard = createToolCard('string-tool', '~', 'Draw String', 'Click and drag to draw a path', selectStringTool);
    container.appendChild(stringCard);

    // Category tabs
    createCategoryTabs(container);

    // Object items based on selected category
    const filteredObjects = getObjectsByCategory(currentCategoryFilter);
    
    if (filteredObjects.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `<p>No objects in this category</p>`;
        container.appendChild(emptyState);
        return;
    }

    filteredObjects.forEach(obj => {
        const card = document.createElement('div');
        card.className = 'object-card';
        card.dataset.objectId = obj.id;

        card.innerHTML = `
            <img src="${obj.thumbnail}" alt="${obj.name}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'">
            <div class="object-info">
                <div class="object-name">${obj.name}</div>
                <div class="size-buttons"></div>
            </div>
        `;
        
        const sizeButtonsContainer = card.querySelector('.size-buttons');
        obj.sizes.forEach(size => {
            const sizeBtn = document.createElement('button');
            sizeBtn.className = 'size-btn';
            sizeBtn.textContent = size + 'mm';
            sizeBtn.dataset.size = size;
            sizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectObjectSize(obj.id, size);
            });
            
            if (selectedObjectId === obj.id && selectedSize === size) {
                sizeBtn.classList.add('selected');
            }
            
            sizeButtonsContainer.appendChild(sizeBtn);
        });
        
        container.appendChild(card);
    });
}

/**
 * Creates category tabs for filtering objects.
 */
function createCategoryTabs(container) {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs';
    tabsContainer.id = 'category-tabs';

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

    container.appendChild(tabsContainer);
}

/**
 * Filters objects by category and refreshes the sidebar.
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
    hideRotationSlider();
    createBeadSelection();
    updateSelectionIndicator();
}

/**
 * Helper to create a tool card element.
 */
function createToolCard(id, icon, name, desc, onClick) {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.id = id;
    card.addEventListener('click', onClick);
    card.innerHTML = `
        <div class="tool-icon">${icon}</div>
        <div class="tool-name">${name}</div>
        <div class="tool-desc">${desc}</div>
    `;
    return card;
}

/**
 * Updates tool selection UI.
 */
function updateToolSelectionUI(selectedElement) {
    document.querySelectorAll('.tool-card').forEach(el => el.classList.remove('selected'));
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
}
