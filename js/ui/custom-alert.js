/*
    CUSTOM ALERT MODULE
    Replaces native browser alert/confirm dialogs with styled modal components
    Uses existing project design language (colors, fonts, border-radius, shadows)
*/

// Modal state management
let customAlertModal = null;
let customAlertResolve = null;

/**
 * Initialize the custom alert system
 * Creates the modal structure in the DOM
 */
function initCustomAlert() {
    if (document.getElementById('custom-alert-modal')) return;

    const modalHTML = `
        <div id="custom-alert-modal" class="modal">
            <div class="modal-backdrop" onclick="handleCustomAlertBackdropClick(event)"></div>
            <div class="modal-content modal-compact custom-alert-content">
                <div class="custom-alert-icon" id="custom-alert-icon"></div>
                <h3 id="custom-alert-title"></h3>
                <p class="modal-subtitle" id="custom-alert-message"></p>
                <div class="modal-actions" id="custom-alert-actions"></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    customAlertModal = document.getElementById('custom-alert-modal');

    // Add custom styles for alert variants
    if (!document.getElementById('custom-alert-styles')) {
        const styles = document.createElement('style');
        styles.id = 'custom-alert-styles';
        styles.textContent = `
            .custom-alert-content {
                text-align: center;
                max-width: 400px;
            }
            
            .custom-alert-icon {
                font-size: 48px;
                margin-bottom: var(--space-4);
            }
            
            .custom-alert-icon.success { color: var(--success, #22c55e); }
            .custom-alert-icon.error { color: var(--error, #ef4444); }
            .custom-alert-icon.warning { color: var(--warning, #f59e0b); }
            .custom-alert-icon.info { color: var(--primary-500, #667eea); }
            
            #custom-alert-title {
                text-align: center;
                margin-bottom: var(--space-3);
            }
            
            #custom-alert-message {
                text-align: center;
                line-height: 1.6;
                white-space: pre-line;
            }
            
            #custom-alert-actions {
                display: flex;
                flex-direction: column;
                gap: var(--space-3);
                margin-top: var(--space-6);
            }
            
            #custom-alert-actions.confirm-actions {
                flex-direction: row;
                gap: var(--space-3);
            }
            
            #custom-alert-actions.confirm-actions button {
                flex: 1;
            }
            
            .custom-alert-btn-confirm {
                width: 100%;
                height: var(--button-height-mobile, 48px);
                background: var(--error, #ef4444);
                border: none;
                border-radius: var(--radius-md, 8px);
                color: white;
                font-size: var(--font-size-body, 16px);
                font-weight: var(--font-weight-semibold, 600);
                cursor: pointer;
                transition: all var(--duration-base, 0.2s);
            }
            
            .custom-alert-btn-confirm:active {
                transform: scale(0.98);
                opacity: 0.9;
            }
        `;
        document.head.appendChild(styles);
    }
}

/**
 * Get icon HTML for alert type
 */
function getAlertIcon(type) {
    switch (type) {
        case 'success':
            return '✅';
        case 'error':
            return '❌';
        case 'warning':
            return '⚠️';
        case 'info':
        default:
            return '💡';
    }
}

/**
 * Get title for alert type
 */
function getAlertTitle(type) {
    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en';

    const titles = {
        en: {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Notice'
        },
        ar: {
            success: 'نجاح',
            error: 'خطأ',
            warning: 'تحذير',
            info: 'ملاحظة'
        }
    };

    return (titles[lang] && titles[lang][type]) ? titles[lang][type] : titles.en[type] || 'Notice';
}

/**
 * Show a custom alert modal (replacement for window.alert)
 * @param {string} message - Message to display
 * @param {string} type - Alert type: 'success', 'error', 'warning', 'info'
 * @returns {Promise} Resolves when user closes the alert
 */
function showCustomAlert(message, type = 'info', customTitle = null) {
    return new Promise((resolve) => {
        initCustomAlert();

        const icon = document.getElementById('custom-alert-icon');
        const title = document.getElementById('custom-alert-title');
        const msg = document.getElementById('custom-alert-message');
        const actions = document.getElementById('custom-alert-actions');

        icon.textContent = getAlertIcon(type);
        icon.className = 'custom-alert-icon ' + type;
        title.textContent = customTitle || getAlertTitle(type);
        msg.textContent = message;

        const okText = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar') ? 'حسناً' : 'OK';

        actions.className = 'modal-actions';
        actions.innerHTML = `
            <button class="btn-primary" onclick="closeCustomAlert(true)">${okText}</button>
        `;

        customAlertModal.classList.add('active');
        customAlertResolve = resolve;
    });
}

/**
 * Show a custom confirm modal (replacement for window.confirm)
 * @param {string} message - Message to display
 * @param {Object} options - Optional configuration
 * @param {string} options.title - Custom title
 * @param {string} options.confirmText - Custom confirm button text
 * @param {string} options.cancelText - Custom cancel button text
 * @param {string} options.type - Alert type for styling
 * @returns {Promise<boolean>} Resolves with true (confirm) or false (cancel)
 */
function showCustomConfirm(message, options = {}) {
    return new Promise((resolve) => {
        initCustomAlert();

        const icon = document.getElementById('custom-alert-icon');
        const title = document.getElementById('custom-alert-title');
        const msg = document.getElementById('custom-alert-message');
        const actions = document.getElementById('custom-alert-actions');

        const type = options.type || 'warning';
        const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en';

        icon.textContent = getAlertIcon(type);
        icon.className = 'custom-alert-icon ' + type;
        title.textContent = options.title || getAlertTitle(type);
        msg.textContent = message;

        const confirmText = options.confirmText || (lang === 'ar' ? 'نعم' : 'Yes');
        const cancelText = options.cancelText || (lang === 'ar' ? 'إلغاء' : 'Cancel');

        actions.className = 'modal-actions confirm-actions';
        actions.innerHTML = `
            <button class="btn-secondary" onclick="closeCustomAlert(false)">${cancelText}</button>
            <button class="custom-alert-btn-confirm" onclick="closeCustomAlert(true)">${confirmText}</button>
        `;

        customAlertModal.classList.add('active');
        customAlertResolve = resolve;
    });
}

/**
 * Close the custom alert modal
 * @param {boolean} result - Result to pass back (true for confirm, false for cancel)
 */
function closeCustomAlert(result) {
    if (customAlertModal) {
        customAlertModal.classList.remove('active');
    }
    if (customAlertResolve) {
        customAlertResolve(result);
        customAlertResolve = null;
    }
}

/**
 * Handle backdrop click - close with false (like clicking cancel)
 */
function handleCustomAlertBackdropClick(event) {
    if (event.target.classList.contains('modal-backdrop')) {
        closeCustomAlert(false);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomAlert);
} else {
    initCustomAlert();
}

// Global exports
window.showCustomAlert = showCustomAlert;
window.showCustomConfirm = showCustomConfirm;
window.closeCustomAlert = closeCustomAlert;
window.handleCustomAlertBackdropClick = handleCustomAlertBackdropClick;
