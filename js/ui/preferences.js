/*
    UI PREFERENCES MODULE
    Handles user preferences and utility functions
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
 * Updates the bead count display
 */
function updateBeadCount() {
    const count = beads.length;
    document.getElementById('header-bead-count').textContent = count;
}