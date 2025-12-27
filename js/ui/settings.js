/*
    SETTINGS UI MODULE
    Handles settings modal, language toggle, and APK downloads
*/

// State
let apkIndex = null;
let saveTimeout = null;

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

    // Theme Toggle Button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', cycleTheme);
        // Initialize theme from storage
        const savedTheme = localStorage.getItem('app-theme') || '';
        if (savedTheme) {
            applyTheme(savedTheme);
        }
    }

    // Apply initial translations
    updateSettingsLanguage();
}

/**
 * Helper to get translation key for a theme ID
 */
function getThemeTranslationKey(themeId) {
    const map = {
        '': 'theme-light',
        'dark-classic': 'theme-dark-classic',
        'dark-oled': 'theme-dark-oled',
        'dark-blue': 'theme-dark-blue'
    };
    return map[themeId] || 'theme-light';
}

/**
 * Cycle through app themes
 */
function cycleTheme() {
    const themes = ['', 'dark-classic', 'dark-oled', 'dark-blue'];

    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || '';
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextThemeId = themes[nextIndex];

    applyTheme(nextThemeId);
}

/**
 * Apply a specific theme
 */
function applyTheme(themeId) {
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-toggle-btn');

    // Set attribute immediately for visual feedback
    if (themeId) {
        html.setAttribute('data-theme', themeId);
    } else {
        html.removeAttribute('data-theme');
    }

    // Debounce save to storage (5 seconds delay)
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem('app-theme', themeId);
    }, 5000);

    // Update button text
    if (themeBtn) {
        const key = getThemeTranslationKey(themeId);
        themeBtn.textContent = window.getTranslation ? window.getTranslation(key) : 'Theme';
    }

    // Update 3D string color
    if (typeof window.updateStringColor === 'function') {
        window.updateStringColor();
    }
}

/**
 * Update settings UI text based on current language
 */
function updateSettingsLanguage() {
    if (!window.getTranslation) return;

    // Generic update for all data-translate elements in settings modal
    const translateElements = document.querySelectorAll('#settings-modal [data-translate]');
    translateElements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (key) {
            const text = window.getTranslation(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        }
    });

    // Update Theme Button Text manually
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || '';
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        const key = getThemeTranslationKey(currentTheme);
        themeBtn.textContent = window.getTranslation(key);
    }

    // Handle Contact Modal translations as well
    const contactElements = document.querySelectorAll('#contact-modal [data-translate]');
    contactElements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (key) {
            const text = window.getTranslation(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder) {
                    el.placeholder = text;
                }
            } else {
                el.textContent = text;
            }
        }
    });

    // Explicit manual updates for things without data-translate in HTML or special cases
    const downloadBtn = document.getElementById('download-apk-btn');
    if (downloadBtn) {
        const textSpan = downloadBtn.querySelector('.btn-text');
        if (textSpan && !textSpan.hasAttribute('data-translate')) {
            textSpan.textContent = window.getTranslation('settings-download-btn');
        }
    }

    // Update Loading Option
    const select = document.getElementById('apk-version-select');
    if (select && select.options.length > 0 && select.options[0].disabled) {
        if (select.options[0].getAttribute('data-translate') === 'settings-loading') {
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
        select.innerHTML = '<option value="" disabled selected>No updates found</option>';
    }
}

/**
 * Populate APK dropdown
 */
function populateApkDropdown() {
    const select = document.getElementById('apk-version-select');
    const loadingState = document.getElementById('apk-loading-state');
    const downloadBtn = document.getElementById('download-apk-btn');
    const filenameDisplay = document.getElementById('apk-filename-display');

    if (!select || !apkIndex) return;

    select.innerHTML = '';

    let hasOptions = false;

    // Add Latest options
    if (apkIndex.latest && apkIndex.latest.length > 0) {
        apkIndex.latest.forEach(filename => {
            const option = document.createElement('option');
            option.value = `apk/latest/${filename}`;
            option.textContent = filename;
            option.setAttribute('data-filename', filename);
            select.appendChild(option);
            hasOptions = true;
        });
    }

    if (hasOptions) {
        select.selectedIndex = 0;
        if (loadingState) loadingState.style.display = 'none';
        if (downloadBtn) downloadBtn.style.display = 'flex';
        updateDownloadButton();
    } else {
        if (loadingState) {
            loadingState.textContent = window.getTranslation ? window.getTranslation('settings-no-updates') || 'No APKs available' : 'No APKs available';
        }
        if (downloadBtn) downloadBtn.style.display = 'none';
        if (filenameDisplay) filenameDisplay.textContent = '';
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
            filenameDisplay.textContent = `File: ${filename}`;
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

    btn.innerHTML = '<span class="btn-text">Downloading...</span>';

    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// SHARE FEATURES
// ==========================================

function handleInstagramInteraction() {
    const url = 'https://www.instagram.com/taleenaccesorios/';
    copyToClipboard(url, 'instagram');

    // Open in new tab (handles app intent on mobile)
    window.open(url, '_blank');
}

function copyWebsiteLink() {
    const url = 'https://sell-rosaries.github.io/rosaries/';
    copyToClipboard(url, 'website');
}

async function copyApkLink() {
    // Ensure index is loaded
    if (!apkIndex) {
        try {
            await loadApkIndex();
        } catch (e) {
            console.error('Failed to load APK index for sharing', e);
            showCustomAlert('Could not get latest APK link', 'error');
            return;
        }
    }

    if (apkIndex && apkIndex.latest && apkIndex.latest.length > 0) {
        const url = `https://sell-rosaries.github.io/rosaries/apk/latest/${apkIndex.latest[0]}`;
        copyToClipboard(url, 'app');
    } else {
        showCustomAlert('No APK version found to share', 'error');
    }
}

function copyToClipboard(text, type) {
    if (!navigator.clipboard) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showShareSuccess(type, text);
        } catch (err) {
            const isArabic = (typeof languageManager !== 'undefined' && languageManager.currentLanguage === 'ar') ||
                (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar');
            showCustomAlert(isArabic ? 'فشل نسخ الرابط' : 'Failed to copy link', 'error');
        }
        document.body.removeChild(textarea);
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showShareSuccess(type, text);
    }).catch(err => {
        const isArabic = (typeof languageManager !== 'undefined' && languageManager.currentLanguage === 'ar') ||
            (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar');
        showCustomAlert(isArabic ? 'فشل نسخ الرابط' : 'Failed to copy link', 'error');
    });
}

function showShareSuccess(type, url) {
    const isArabic = (typeof languageManager !== 'undefined' && languageManager.currentLanguage === 'ar') ||
        (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar');

    let msg = 'Link copied!';

    if (type === 'website') {
        msg = isArabic ? 'تم نسخ رابط الموقع!' : 'Website link copied!';
        if (!url) url = 'https://sell-rosaries.github.io/rosaries/';
    } else if (type === 'app') {
        msg = isArabic ? 'تم نسخ رابط التطبيق!' : 'App link copied!';
    } else if (type === 'instagram') {
        msg = isArabic ? 'تم نسخ رابط انستغرام!' : 'Instagram link copied!';
        if (!url) url = 'https://www.instagram.com/taleenaccesorios/';
    }

    // Use new Share Modal with QR Code
    openShareModal(url, msg);

    // Also show small alert for feedback if needed, but modal is better
    // showCustomAlert(msg, 'success'); 
}

function openShareModal(url, msg) {
    const modal = document.getElementById('share-modal');
    const container = document.getElementById('qrcode-container');
    const msgEl = document.getElementById('share-msg');

    if (!modal || !container) return;

    // Clear previous QR
    container.innerHTML = '';

    if (msgEl && msg) msgEl.textContent = msg;

    // Generate QR
    if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
            text: url,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Setup click to expand
        container.onclick = () => showFullscreenQR(url);
    } else {
        container.textContent = "QR Lib missing";
    }

    modal.classList.add('active');
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.remove('active');
}

function showFullscreenQR(text) {
    let overlay = document.getElementById('fullscreen-qr-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'fullscreen-qr-overlay';
        overlay.className = 'fullscreen-qr';
        overlay.innerHTML = `
            <div id="fs-qr-target"></div>
            <div class="fullscreen-close" onclick="document.getElementById('fullscreen-qr-overlay').style.display='none'">&times;</div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.style.display = 'none';
        });
    }

    const target = overlay.querySelector('#fs-qr-target');
    target.innerHTML = '';
    target.style.background = 'white';
    target.style.padding = '20px';
    target.style.borderRadius = '8px';

    if (typeof QRCode !== 'undefined') {
        new QRCode(target, {
            text: text,
            width: 300,
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    overlay.style.display = 'flex';
}

// Export functions
window.initSettings = initSettings;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.updateSettingsLanguage = updateSettingsLanguage;
window.copyWebsiteLink = copyWebsiteLink;
window.copyApkLink = copyApkLink;
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
window.sendContactEmail = sendContactEmail;
window.handleInstagramInteraction = handleInstagramInteraction;
window.closeShareModal = closeShareModal;

