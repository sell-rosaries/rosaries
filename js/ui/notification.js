/*
    NOTIFICATION MODAL MODULE
    Beautiful styled notifications for success/error/info messages
*/

/**
 * Show a styled notification modal
 * @param {Object} options - Notification options
 * @param {string} options.type - 'success', 'error', 'warning', 'info'
 * @param {string} options.title - The title text
 * @param {string} options.message - The message body
 * @param {string} options.buttonText - Optional custom button text
 * @param {function} options.onClose - Optional callback when closed
 */
function showNotification(options) {
    const { type = 'info', title, message, buttonText, onClose } = options;

    // Remove any existing notification
    const existing = document.getElementById('notification-modal');
    if (existing) existing.remove();

    // Icon SVGs for each type
    const icons = {
        success: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9 12l2 2 4-4"/>
        </svg>`,
        error: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>`,
        warning: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`,
        info: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>`
    };

    // Colors for each type
    const colors = {
        success: { bg: 'rgba(34, 197, 94, 0.1)', icon: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' },
        error: { bg: 'rgba(239, 68, 68, 0.1)', icon: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' },
        warning: { bg: 'rgba(245, 158, 11, 0.1)', icon: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
        info: { bg: 'rgba(59, 130, 246, 0.1)', icon: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' }
    };

    const color = colors[type] || colors.info;
    const icon = icons[type] || icons.info;

    // Get default button text based on current language
    const defaultButtonText = window.getTranslation ? window.getTranslation('notification-ok') || 'OK' : 'OK';
    const btnText = buttonText || defaultButtonText;

    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = 'notification-modal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeNotification()"></div>
        <div class="modal-content notification-modal-content">
            <div class="notification-icon" style="color: ${color.icon}; background: ${color.bg}; box-shadow: 0 0 40px ${color.glow};">
                ${icon}
            </div>
            <h3 class="notification-title">${title}</h3>
            <p class="notification-message">${message}</p>
            <button class="btn-primary notification-btn" onclick="closeNotification()">
                ${btnText}
            </button>
        </div>
    `;

    // Add to DOM
    document.body.appendChild(modal);

    // Store callback
    modal._onClose = onClose;

    // Focus the button for accessibility
    setTimeout(() => {
        const btn = modal.querySelector('.notification-btn');
        if (btn) btn.focus();
    }, 100);

    // Allow closing with Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeNotification();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Close the notification modal
 */
function closeNotification() {
    const modal = document.getElementById('notification-modal');
    if (modal) {
        // Add closing animation
        const content = modal.querySelector('.notification-modal-content');
        if (content) {
            content.style.animation = 'notification-slide-out 0.2s ease-out forwards';
        }

        // Remove after animation
        setTimeout(() => {
            if (modal._onClose) modal._onClose();
            modal.remove();
        }, 200);
    }
}

/**
 * Show success notification
 */
function showSuccessNotification(title, message, onClose) {
    showNotification({ type: 'success', title, message, onClose });
}

/**
 * Show error notification
 */
function showErrorNotification(title, message, onClose) {
    showNotification({ type: 'error', title, message, onClose });
}

/**
 * Show warning notification
 */
function showWarningNotification(title, message, onClose) {
    showNotification({ type: 'warning', title, message, onClose });
}

// Export functions
window.showNotification = showNotification;
window.closeNotification = closeNotification;
window.showSuccessNotification = showSuccessNotification;
window.showErrorNotification = showErrorNotification;
window.showWarningNotification = showWarningNotification;
