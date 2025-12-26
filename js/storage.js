/*
    LOCAL STORAGE MANAGEMENT
    Auto-save, auto-restore, recent beads, and favorites
*/

// Storage keys
const STORAGE_KEYS = {
    AUTOSAVE: 'rosary-autosave',
    RECENT_BEADS: 'rosary-recent-beads',
    FAVORITES: 'rosary-favorites'
};

/**
 * Auto-saves the current workspace design
 */
function autoSaveDesign() {
    try {
        // Cancel any pending slider save timer since we're saving now
        if (window.cancelSliderSave && typeof window.cancelSliderSave === 'function') {
            window.cancelSliderSave();
        }

        const designData = {
            stringPaths: stringPaths.map(path => path.map(p => ({ x: p.x, y: p.y, z: p.z }))),
            stringPoints: stringPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
            beads: beads.map(bead => ({
                position: { x: bead.position.x, y: bead.position.y, z: bead.position.z },
                scale: { x: bead.scale.x, y: bead.scale.y, z: bead.scale.z },
                rotation: bead.material.rotation || 0,
                userData: bead.userData,
                imageUrl: bead.material.map ? bead.material.map.image.src : null
            })),
            stringScale: window.currentStringScale || 0, // Save current slider percentage
            rosaryModeActive: window.rosaryModeActive || false, // Save rosary mode flag
            savedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.AUTOSAVE, JSON.stringify(designData));

    } catch (e) {
        console.warn('Could not auto-save design:', e);
    }
}

/**
 * Restores the saved workspace design
 */
async function autoRestoreDesign() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.AUTOSAVE);
        if (!saved) {

            return false;
        }

        const designData = JSON.parse(saved);


        // Restore string points
        // Restore string paths
        if (designData.stringPaths) {
            stringPaths = designData.stringPaths.map(path => path.map(p => new THREE.Vector3(p.x, p.y, p.z)));
        } else if (designData.stringPoints && designData.stringPoints.length > 0) {
            // Legacy support: convert old single string to path
            stringPaths = [designData.stringPoints.map(p => new THREE.Vector3(p.x, p.y, p.z))];
        } else {
            stringPaths = [];
        }

        // Restore active string if any (usually empty on load, but for completeness)
        if (designData.stringPoints) {
            stringPoints = designData.stringPoints.map(p => new THREE.Vector3(p.x, p.y, p.z));
        }

        updateStringLine();

        // Restore slider state if available
        if (typeof window.restoreSliderState === 'function' && designData.stringScale !== undefined) {
            window.restoreSliderState(designData.stringScale);
        }

        // Restore rosary mode flag if available
        window.rosaryModeActive = designData.rosaryModeActive || false;


        // Clear existing beads before restoring to prevent duplication
        // We must do this because we are about to push new beads to the array
        if (typeof beads !== 'undefined') {
            beads.forEach(bead => scene.remove(bead));
            beads.length = 0;
        }

        // Restore beads - wait for all to load
        const beadPromises = designData.beads.map(beadData => {
            return new Promise((resolve) => {
                const obj = getObjectById(beadData.userData.objectId);
                if (obj) {
                    createBead(obj, beadData.userData.size, (bead) => {
                        bead.position.set(beadData.position.x, beadData.position.y, beadData.position.z);
                        bead.scale.set(beadData.scale.x, beadData.scale.y, beadData.scale.z);
                        bead.userData = beadData.userData;

                        if (beadData.rotation) {
                            bead.material.rotation = beadData.rotation;
                        }

                        scene.add(bead);
                        beads.push(bead);
                        resolve();
                    });
                } else {
                    resolve(); // Skip if object not found
                }
            });
        });

        // Wait for all beads to load
        await Promise.all(beadPromises);

        updateBeadCount();

        return true;

    } catch (e) {
        console.warn('Could not restore design:', e);
        return false;
    }
}

/**
 * Tracks a bead as recently used
 */
function trackRecentBead(objectId) {
    try {
        let recentBeads = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_BEADS) || '[]');

        // Remove if already exists
        recentBeads = recentBeads.filter(id => id !== objectId);

        // Add to front
        recentBeads.unshift(objectId);

        // Keep only last 3
        recentBeads = recentBeads.slice(0, 3);

        localStorage.setItem(STORAGE_KEYS.RECENT_BEADS, JSON.stringify(recentBeads));
    } catch (e) {
        console.warn('Could not track recent bead:', e);
    }
}

/**
 * Gets the list of recent bead IDs
 */
function getRecentBeads() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_BEADS) || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * Toggles a bead as favorite
 */
function toggleFavorite(objectId) {
    try {
        let favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');

        if (favorites.includes(objectId)) {
            // Remove from favorites
            favorites = favorites.filter(id => id !== objectId);
        } else {
            // Add to favorites
            favorites.push(objectId);
        }

        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        return favorites.includes(objectId);
    } catch (e) {
        console.warn('Could not toggle favorite:', e);
        return false;
    }
}

/**
 * Checks if a bead is favorited
 */
function isFavorite(objectId) {
    try {
        const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
        return favorites.includes(objectId);
    } catch (e) {
        return false;
    }
}

/**
 * Gets all favorited bead IDs
 */
function getFavoriteBeads() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * Clears the auto-saved design
 */
function clearAutoSave() {
    try {
        localStorage.removeItem(STORAGE_KEYS.AUTOSAVE);

    } catch (e) {
        console.warn('Could not clear auto-save:', e);
    }
}

// Global exports
window.autoSaveDesign = autoSaveDesign;
window.autoRestoreDesign = autoRestoreDesign;
window.clearAutoSave = clearAutoSave;
window.trackRecentBead = trackRecentBead;
window.getRecentBeads = getRecentBeads;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.getFavoriteBeads = getFavoriteBeads;
