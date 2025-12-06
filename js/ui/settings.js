/*
    SETTINGS UI MODULE
    Handles settings modal, language toggle, and APK downloads
*/

// State
let apkIndex = null;

/**
 * Initialize settings module
 */
function initSettings() {
    // Settings toggle button
    const settingsBtn = document.getElementById('settings-toggle');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }

    // APK Version Select
    const versionSelect = document.getElementById('apk-version-select');
    if (versionSelect) {
        versionSelect.addEventListener('change', updateDownloadButton);
    }

    // Download Button
    const downloadBtn = document.getElementById('download-apk-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleApkDownload);
    }

    // Apply initial translations
    updateSettingsLanguage();


}

/**
 * Update settings UI text based on current language
 */
function updateSettingsLanguage() {
    if (!window.getTranslation) return;

    // Helper to safe update
    const updateText = (selector, key) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = window.getTranslation(key);
    };

    // Update Title
    updateText('#settings-modal h3', 'settings-title');

    // Update Section Titles
    const sections = document.querySelectorAll('.settings-section');
    if (sections.length >= 2) {
        // Assume first is General, second is Downloads based on order
        const generalTitle = sections[0].querySelector('.settings-section-title');
        if (generalTitle) generalTitle.textContent = window.getTranslation('settings-general');

        const downloadsTitle = sections[1].querySelector('.settings-section-title');
        if (downloadsTitle) downloadsTitle.textContent = window.getTranslation('settings-downloads');
    }

    // Update Labels & Descriptions
    updateText('.settings-label', 'settings-language');
    updateText('.settings-desc', 'settings-downloads-desc');
    updateText('label[for="apk-version-select"]', 'settings-select-version');

    // Update Download Button
    const downloadBtn = document.getElementById('download-apk-btn');
    if (downloadBtn) {
        // Keep the icon, update only the text span
        const textSpan = downloadBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = window.getTranslation('settings-download-btn');
    }

    // Update Loading Option if present
    const select = document.getElementById('apk-version-select');
    if (select && select.options.length > 0 && select.options[0].disabled) {
        // Only update if it's the placeholder
        if (select.options[0].value === "") {
            select.options[0].textContent = window.getTranslation('settings-loading');
        }
    }
}

/**
 * Open settings modal
 */
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    modal.classList.add('active');

    // Load APK index if not loaded yet
    if (!apkIndex) {
        loadApkIndex();
    }
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Load APK index from JSON
 */
async function loadApkIndex() {
    const select = document.getElementById('apk-version-select');
    if (!select) return;

    try {
        // Add cache buster to ensure fresh data
        const response = await fetch('apk-index.json?t=' + Date.now());

        if (!response.ok) {
            throw new Error('Failed to load APK index');
        }

        apkIndex = await response.json();
        populateApkDropdown();

    } catch (error) {
        console.warn('⚠️ Could not load APK index:', error);

        // Fallback UI
        const noUpdatesText = window.getTranslation ? window.getTranslation('settings-no-updates') : 'No updates found';
        select.innerHTML = `<option value="" disabled selected>${noUpdatesText}</option>`;

        // Check if directories exist by trying to fetch known files (blind guess)
        // or just show empty state.
        // For now, we assume if index fails, we can't reliably offer downloads.
    }
}

/**
 * Populate APK dropdown
 */
function populateApkDropdown() {
    const select = document.getElementById('apk-version-select');
    if (!select || !apkIndex) return;

    select.innerHTML = ''; // Clear loading state

    let hasOptions = false;

    // Add Latest options
    if (apkIndex.latest && apkIndex.latest.length > 0) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = window.getTranslation ? window.getTranslation('settings-latest-version') : 'Latest Version';

        apkIndex.latest.forEach(filename => {
            const option = document.createElement('option');
            option.value = `apk/latest/${filename}`;
            option.textContent = filename; // Allow custom naming
            option.setAttribute('data-filename', filename);
            optGroup.appendChild(option);
            hasOptions = true;
        });

        select.appendChild(optGroup);
    }

    // Add Old options
    if (apkIndex.old && apkIndex.old.length > 0) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = window.getTranslation ? window.getTranslation('settings-previous-versions') : 'Previous Versions';

        apkIndex.old.forEach(filename => {
            const option = document.createElement('option');
            option.value = `apk/old/${filename}`;
            option.textContent = filename;
            option.setAttribute('data-filename', filename);
            optGroup.appendChild(option);
            hasOptions = true;
        });

        select.appendChild(optGroup);
    }

    if (hasOptions) {
        select.selectedIndex = 0; // Select first option
        updateDownloadButton(); // Update button state
    } else {
        const noApksText = window.getTranslation ? window.getTranslation('settings-no-apks') : 'No APKs available';
        select.innerHTML = `<option value="" disabled selected>${noApksText}</option>`;
        document.getElementById('download-apk-btn').disabled = true;
    }
}

/**
 * Update download button based on selection
 */
function updateDownloadButton() {
    const select = document.getElementById('apk-version-select');
    const btn = document.getElementById('download-apk-btn');
    const filenameDisplay = document.getElementById('apk-filename-display');

    if (select && btn && select.value) {
        btn.disabled = false;

        // Get selected option
        const option = select.options[select.selectedIndex];
        const filename = option.getAttribute('data-filename');

        if (filenameDisplay) {
            const fileText = window.getTranslation ? window.getTranslation('settings-file') : 'File';
            filenameDisplay.textContent = `${fileText}: ${filename}`;
        }
    } else {
        btn.disabled = true;
        if (filenameDisplay) filenameDisplay.textContent = '';
    }
}

/**
 * Handle download button click
 */
function handleApkDownload() {
    const select = document.getElementById('apk-version-select');
    if (!select || !select.value) return;

    const filePath = select.value;
    const link = document.createElement('a');
    link.href = filePath;
    link.download = ''; // Browser will auto-detect filename from URL usually

    // For visual feedback
    const btn = document.getElementById('download-apk-btn');
    const originalText = btn.innerHTML;

    const downloadingText = window.getTranslation ? window.getTranslation('settings-downloading') : 'Downloading...';
    btn.innerHTML = `<span class="btn-text">${downloadingText}</span>`;

    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export functions
window.initSettings = initSettings;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.updateSettingsLanguage = updateSettingsLanguage;

