/*
    BEAD DETAILS MODAL
    Displays detailed breakdown of beads in the sandbox
*/

/**
 * Opens the bead details modal and populates it with current bead data
 */
function openBeadDetailsModal() {
    const modal = document.getElementById('bead-details-modal');
    if (!modal) return;

    // Fetch bead data fresh when modal opens
    const beadData = aggregateBeadsByName();

    // Update modal content
    populateBeadList(beadData);

    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; //Prevent scrolling
}

/**
 * Closes the bead details modal
 */
function closeBeadDetailsModal() {
    const modal = document.getElementById('bead-details-modal');
    if (!modal) return;

    modal.classList.remove('show');
    document.body.style.overflow = '';
}

/**
 * Aggregates beads by name (not size)
 * Groups beads with same name but shows size breakdown
 * 
 * @returns {Array} Array of bead objects with name, total count, size breakdown, and image
 */
function aggregateBeadsByName() {
    if (typeof beads === 'undefined' || !beads) {
        return [];
    }

    const beadGroups = {};

    // Loop through all beads
    beads.forEach(bead => {
        if (!bead.userData || !bead.userData.objectId) return;

        const objectId = bead.userData.objectId;
        const size = bead.userData.size || 'unknown';
        const obj = getObjectById(objectId);

        if (!obj) return;

        // Group by object name only
        const beadName = obj.name;

        if (!beadGroups[beadName]) {
            beadGroups[beadName] = {
                name: beadName,
                imagePath: obj.image,
                totalCount: 0,
                sizes: {} // Track count per size
            };
        }

        // Increment total count
        beadGroups[beadName].totalCount++;

        // Track size breakdown
        if (!beadGroups[beadName].sizes[size]) {
            beadGroups[beadName].sizes[size] = 0;
        }
        beadGroups[beadName].sizes[size]++;
    });

    // Convert to array and sort by name
    return Object.values(beadGroups).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Populates the bead list in the modal
 * @param {Array} beadData - Array of aggregated bead data
 */
function populateBeadList(beadData) {
    const listContainer = document.getElementById('bead-details-list');
    const subtitleElement = document.getElementById('bead-details-subtitle');

    if (!listContainer) return;

    // Clear existing content
    listContainer.innerHTML = '';

    // Update subtitle with total count
    const totalBeads = beadData.reduce((sum, item) => sum + item.totalCount, 0);
    if (subtitleElement) {
        const emptyText = (typeof window.getTranslation === 'function' ? window.getTranslation('bead-details-no-beads') : null) || 'No beads in your design';
        const totalText = (typeof window.getTranslation === 'function' ? window.getTranslation('bead-details-total') : null) || 'Total: ${count} bead${count !== 1 ? "s" : ""}';
        subtitleElement.textContent = totalBeads === 0
            ? emptyText
            : totalText.replace('${count}', totalBeads).replace('${count !== 1 ? "s" : ""}', totalBeads !== 1 ? 's' : '');
    }

    // Show empty state if no beads
    if (beadData.length === 0) {
        const emptyTitle = (typeof window.getTranslation === 'function' ? window.getTranslation('bead-details-empty-title') : null) || 'No beads added yet';
        const emptyHint = (typeof window.getTranslation === 'function' ? window.getTranslation('bead-details-empty-hint') : null) || 'Add beads to your string to see them here';
        listContainer.innerHTML = `
            <div class="bead-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
                <p>${emptyTitle}</p>
                <p class="empty-hint">${emptyHint}</p>
            </div>
        `;
        return;
    }

    // Generate bead items
    beadData.forEach(beadItem => {
        const item = document.createElement('div');
        item.className = 'bead-detail-item';

        // Format size breakdown (e.g., "3×8mm, 2×10mm")
        const sizeBreakdown = Object.entries(beadItem.sizes)
            .map(([size, count]) => `${count}×${size}mm`)
            .join(', ');

        item.innerHTML = `
            <div class="bead-detail-image">
                <img src="${beadItem.imagePath}" alt="${beadItem.name}" onerror="this.style.display='none'">
            </div>
            <div class="bead-detail-info">
                <div class="bead-detail-name">${beadItem.name}</div>
                <div class="bead-detail-sizes">${sizeBreakdown}</div>
            </div>
            <div class="bead-detail-count">${beadItem.totalCount}</div>
        `;

        listContainer.appendChild(item);
    });
}

// Initialize the bead counter click handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const beadCountBadge = document.getElementById('bead-count-badge');

    if (beadCountBadge) {
        beadCountBadge.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBeadDetailsModal();
        });
    }
});
