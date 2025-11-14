/*
    SAVED DESIGNS STYLES MODULE
    All CSS styles for saved designs functionality (delete mode, modals, checkboxes)
*/

/**
 * CLEAN: Inject styles for delete mode and modal functionality
 */
function injectSavedStyles() {
    // Add styles if not present
    if (!document.querySelector('#clean-delete-dialog-styles')) {
        const style = document.createElement('style');
        style.id = 'clean-delete-dialog-styles';
        style.textContent = `
            /* Save Message Styles */
            @keyframes save-message-slide {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }

            /* Clean Delete Dialog Styles */
            .clean-delete-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .clean-delete-modal {
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: cleanConfirmSlide 0.3s ease-out;
            }
            
            @keyframes cleanConfirmSlide {
                from { opacity: 0; transform: scale(0.9) translateY(-20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            
            .clean-delete-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .clean-btn-cancel {
                background: #f3f4f6;
                color: #374151;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
            }
            
            .clean-btn-cancel:hover {
                background: #e5e7eb;
            }
            
            .clean-btn-confirm {
                background: #dc2626;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
            }
            
            .clean-btn-confirm:hover {
                background: #b91c1c;
            }

            /* Preview Modal Styles */
            .design-preview-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: previewModalSlide 0.3s ease-out;
            }
            
            .preview-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .preview-content {
                position: relative;
                background: var(--background);
                border-radius: var(--radius-lg);
                width: 40%;
                max-width: 500px;
                min-width: 300px;
                max-height: 80vh;
                box-shadow: var(--shadow-xl);
                border: 2px solid var(--primary);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: previewContentSlide 0.3s ease-out;
            }
            
            @keyframes previewModalSlide {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            @keyframes previewContentSlide {
                from {
                    transform: scale(0.9) translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
            }
            
            .preview-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-4) var(--space-6);
                border-bottom: 1px solid var(--border);
                background: var(--surface);
            }
            
            .preview-header h3 {
                margin: 0;
                color: var(--text-primary);
                font-size: var(--font-size-heading-sm);
                font-weight: var(--weight-semibold);
            }
            
            .btn-close-preview {
                background: var(--error);
                border: none;
                color: white;
                cursor: pointer;
                padding: var(--space-2);
                border-radius: var(--radius-sm);
                transition: all 0.2s ease;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: var(--shadow-sm);
            }
            
            .btn-close-preview:hover {
                background: #dc2626;
                transform: scale(1.05);
                box-shadow: var(--shadow-md);
            }
            
            .btn-close-preview svg {
                width: 18px;
                height: 18px;
            }
            
            .preview-body {
                padding: var(--space-6);
                flex: 1;
                overflow-y: auto;
            }
            
            .preview-image-container {
                text-align: center;
                margin-bottom: var(--space-4);
            }
            
            .preview-image {
                max-width: 100%;
                height: auto;
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-md);
                border: 1px solid var(--border);
            }
            
            .no-preview {
                background: var(--neutral-100);
                color: var(--text-secondary);
                padding: var(--space-8);
                border-radius: var(--radius-md);
                font-style: italic;
                border: 1px dashed var(--border);
            }
            
            .preview-info {
                background: var(--surface);
                padding: var(--space-4);
                border-radius: var(--radius-md);
                border: 1px solid var(--border);
            }
            
            .preview-info p {
                margin: 0 0 var(--space-2) 0;
                color: var(--text-primary);
                font-size: var(--font-size-body-sm);
            }
            
            .preview-info p:last-child {
                margin-bottom: 0;
            }
            
            .preview-actions {
                display: flex;
                gap: var(--space-3);
                padding: var(--space-4) var(--space-6);
                border-top: 1px solid var(--border);
                background: var(--surface);
            }
            
            .preview-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-2);
                padding: var(--space-3) var(--space-4);
                border: none;
                border-radius: var(--radius-md);
                font-size: var(--font-size-body-sm);
                font-weight: var(--weight-medium);
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
            }
            
            .preview-btn-delete {
                background: var(--error);
                color: white;
            }
            
            .preview-btn-delete:hover {
                background: #dc2626;
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            
            .preview-btn-import {
                background: var(--primary-500);
                color: white;
            }
            
            .preview-btn-import:hover {
                background: var(--primary-600);
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }

            /* Clean checkbox styles - completely isolated */
            .clean-design-checkbox {
                display: none;
            }
            
            .clean-checkbox-label {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                background: rgba(255, 255, 255, 0.98);
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                cursor: pointer;
                z-index: 20;
                transition: all 0.2s ease;
                opacity: 0;
                pointer-events: none;
            }
            
            /* Show checkboxes ONLY when delete mode is active */
            body.clean-delete-mode-active .clean-checkbox-label {
                opacity: 1;
                pointer-events: auto;
            }
            
            body.clean-delete-mode-active .clean-design-checkbox {
                /* Make checkboxes functional when active */
            }
            
            /* HIDE design info overlays during delete mode */
            body.clean-delete-mode-active .design-info-overlay {
                display: none !important;
            }
            
            .clean-design-checkbox:checked + .clean-checkbox-label {
                background: #dc2626;
                border-color: #b91c1c;
            }
            
            .clean-design-checkbox:checked + .clean-checkbox-label::before {
                content: '✕';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 14px;
                font-weight: bold;
            }
            
            .saved-design-card {
                position: relative;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .preview-content {
                    width: 90%;
                    margin: var(--space-4);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize styles automatically
injectSavedStyles();

// Global function exports
window.injectSavedStyles = injectSavedStyles;