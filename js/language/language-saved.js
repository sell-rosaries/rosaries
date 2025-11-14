/**
 * Language Management System - Saved Module
 * Contains all saved menu translations and UI updates
 */

// Add saved menu translations to the translations object
if (typeof window.translations !== 'undefined') {
    window.translations.en = {
        ...window.translations.en,
        // ===== SAVED MENU TRANSLATIONS =====
        
        // Header & Modal Elements
        'saved-menu-btn': 'Saved',
        'saved-designs': 'Saved Designs',
        'save-design': 'Save Design',
        'import-design': 'Import Design',
        'delete-design': 'Delete Design',
        'design-singular': 'Design',
        'saved-designs-subtitle': 'Save, import, or delete your rosary designs',
        'no-saved-designs': 'No designs saved yet',
        'saved-designs-placeholder': 'Saved designs will appear here',
        
        // Error Messages
        'save-error-nothing': 'Nothing to save - add some beads or draw a string first!',
        'save-error-max': 'Maximum 6 saves allowed. Please delete some saves first.',
        'save-error-screenshot': 'Failed to capture screenshot. Please try again.',
        'save-error-failed': 'Failed to save design. Please try again.',
        'delete-error-no-designs': 'No designs to delete!',
        'delete-error-failed': 'Failed to delete designs. Please try again.',
        'import-error-not-found': 'Design not found or may have been deleted.',
        'import-error-failed': 'Failed to import design. Please try again.',
        'import-error-empty': 'No design to fit! Add some beads or draw a string first.',
        
        // Success Messages
        'save-success-screenshot': '📸 Auto-fitting + capturing preview...',
        'save-success-saved': 'Design saved successfully!',
        'delete-success-bulk': '${count} design${count > 1 ? "s" : ""} deleted successfully!',
        'delete-success-single': 'Design deleted successfully!',
        'delete-mode-success': 'Delete mode deactivated.',
        'import-success-activated': 'Import mode deactivated',
        'import-success-instruction': 'Click on any saved design to import it!',
        'import-success-imported': 'Design "${designName}" imported successfully!',
        
        // Dialog & Confirmation Elements
        'warning-title': '⚠️ Warning',
        'confirm-delete-single': 'Are you sure you want to delete this design?',
        'confirm-delete-single-desc': 'This action cannot be undone.',
        'confirm-delete-bulk': 'Are you sure you want to delete these designs?',
        'confirm-bulk-desc': 'This action cannot be undone.',
        'confirm-cancel': 'No, Cancel',
        'confirm-delete-yes': 'Yes, Delete',
        'confirm-delete-title': 'Delete Design?',
        'confirm-import-title': 'Import Design?',
        'confirm-import-desc': 'This will replace everything in your sandbox. This action cannot be undone.',
        'confirm-import-yes': 'Yes, Import',
        'confirm-import-cancel': 'Cancel',
        'confirm-switch-mode': 'Switching modes will clear current selections.',
        
        // Mode-Specific Text
        'delete-mode-active': 'Delete Mode Active',
        'import-mode-active': 'Import Mode Active',
        'delete-mode-instruction': 'Delete mode: Click designs to select, then click "Delete" again to delete.',
        
        // Preview Modal Elements
        'preview-title': 'Design Preview',
        'preview-created': 'Created: ',
        'preview-modified': 'Modified: ',
        'preview-close': 'Close',
        'preview-delete': 'Delete',
        
        // Grid & Placeholder Elements
        'no-preview-available': 'No preview available',
        'slot-text': 'Slot ${slotNumber}',
        'empty-slot': 'Empty Slot',
        'saved-designs-empty': 'No saved designs found',
        
        // Dynamic Text with Variables
        'select-for-action': 'Select ${count} design${count > 1 ? "s" : ""} to ${action}',
        'selected-count': 'Selected: ${count}',
        'switching-mode': 'Switching to ${mode} mode'
    };
    
    window.translations.ar = {
        ...window.translations.ar,
        // ===== SAVED MENU TRANSLATIONS =====
        
        // Header & Modal Elements
        'saved-menu-btn': 'محفوظ',
        'saved-designs': 'التصاميم المحفوظة',
        'save-design': 'حفظ',
        'import-design': 'استيراد',
        'delete-design': 'حذف',
        'design-singular': 'تصميم',
        'saved-designs-subtitle': 'احفظ، استورد أو احذف تصاميم السبحة الخاصة بك',
        'no-saved-designs': 'لم يتم حفظ أي تصاميم بعد',
        'saved-designs-placeholder': 'ستظهر التصاميم المحفوظة هنا',
        
        // Error Messages
        'save-error-nothing': 'لا يوجد شيء للحفظ - أضف بعض الخرز أو ارسم خيطاً أولاً!',
        'save-error-max': 'مسموح بحفظ 6 تصاميم كحد أقصى. يرجى حذف بعض التصاميم أولاً.',
        'save-error-screenshot': 'فشل في أخذ لقطة شاشة. يرجى المحاولة مرة أخرى.',
        'save-error-failed': 'فشل في حفظ التصميم. يرجى المحاولة مرة أخرى.',
        'delete-error-no-designs': 'لا توجد تصاميم للحذف!',
        'delete-error-failed': 'فشل في حذف التصاميم. يرجى المحاولة مرة أخرى.',
        'import-error-not-found': 'التصميم غير موجود أو ربما تم حذفه.',
        'import-error-failed': 'فشل في استيراد التصميم. يرجى المحاولة مرة أخرى.',
        'import-error-empty': 'لا يوجد تصميم للملاءمة! أضف بعض الخرز أو ارسم خيطاً أولاً.',
        
        // Success Messages
        'save-success-screenshot': '📸 الملاءمة التلقائية + التقاط المعاينة...',
        'save-success-saved': 'تم حفظ التصميم بنجاح!',
        'delete-success-bulk': 'تم حذف ${count} تصميم${count > 1 ? "s" : ""} بنجاح!',
        'delete-success-single': 'تم حذف التصميم بنجاح!',
        'delete-mode-success': 'تم إلغاء تفعيل وضع الحذف.',
        'import-success-activated': 'تم إلغاء تفعيل وضع الاستيراد',
        'import-success-instruction': 'انقر على أي تصميم محفوظ لاستيراده!',
        'import-success-imported': 'تم استيراد التصميم "${designName}" بنجاح!',
        
        // Dialog & Confirmation Elements
        'warning-title': '⚠️ تحذير',
        'confirm-delete-single': 'هل أنت متأكد من أنك تريد حذف هذا التصميم؟',
        'confirm-delete-single-desc': 'لا يمكن التراجع عن هذا الإجراء.',
        'confirm-delete-bulk': 'هل أنت متأكد من أنك تريد حذف هذه التصاميم؟',
        'confirm-bulk-desc': 'لا يمكن التراجع عن هذا الإجراء.',
        'confirm-cancel': 'لا، إلغاء',
        'confirm-delete-yes': 'نعم، احذف',
        'confirm-delete-title': 'حذف التصميم؟',
        'confirm-import-title': 'استيراد التصميم؟',
        'confirm-import-desc': 'سيتم استبدال كل شيء في صندوق الرمل الخاص بك. هذا الإجراء لا يمكن التراجع عنه.',
        'confirm-import-yes': 'نعم، استيراد',
        'confirm-import-cancel': 'إلغاء',
        'confirm-switch-mode': 'التبديل بين الأوضاع سيمسح التحديدات الحالية.',
        
        // Mode-Specific Text
        'delete-mode-active': 'وضع الحذف نشط',
        'import-mode-active': 'وضع الاستيراد نشط',
        'delete-mode-instruction': 'وضع الحذف: انقر على التصاميم للتحديد، ثم انقر على "حذف" مرة أخرى للحذف.',
        
        // Preview Modal Elements
        'preview-title': 'معاينة التصميم',
        'preview-created': 'تم الإنشاء: ',
        'preview-modified': 'تم التعديل: ',
        'preview-close': 'إغلاق',
        'preview-delete': 'حذف',
        
        // Grid & Placeholder Elements
        'no-preview-available': 'لا توجد معاينة متاحة',
        'slot-text': 'فتحة ${slotNumber}',
        'empty-slot': 'الخانة الفارغة',
        'saved-designs-empty': 'لم يتم العثور على تصاميم محفوظة',
        
        // Dynamic Text with Variables
        'select-for-action': 'حدد {} تصميم{} لل{}',
        'selected-count': 'محدد: {}',
        'switching-mode': 'التبديل إلى وضع {}'
    };
}

// Extend LanguageManager prototype for Saved UI functionality
if (typeof LanguageManager !== 'undefined') {
    LanguageManager.prototype._updateSavedUI = function() {
        const langData = translations[this.currentLanguage];
        
        // Update saved modal UI elements
        const elements = {
            // Modal Header
            '#saved-modal h3': langData['saved-designs'],
            '.modal-subtitle': langData['saved-designs-subtitle'],
            
            // Action Buttons
            '#save-design-btn .btn-text': langData['save-design'],
            // '#import-design-btn .btn-text': langData['import-design'], // Managed dynamically by saved.js
            '#delete-design-btn .btn-text': langData['delete-design'],
            
            // Placeholders and Empty States
            '.saved-designs-empty': langData['no-saved-designs'],
            '.saved-designs-placeholder': langData['saved-designs-placeholder'],
            
            // Confirmation Dialogs
            '.delete-confirm-header h4': langData['warning-title'],
            
            // Preview Modal
            '.design-preview-modal h2': langData['preview-title'],
            '.preview-btn-delete': langData['preview-delete'],
            '.preview-btn-import': langData['import-design'],
            '.preview-close-btn': langData['preview-close'],
            
            // Import Confirmation
            '.confirm-import-header': langData['confirm-import-title'],
            '.confirm-import-desc': langData['confirm-import-desc'],
            '#confirm-import-btn': langData['confirm-import-yes'],
            '#cancel-import-btn': langData['confirm-import-cancel'],
            
            // Mode Status Text
            '.delete-mode-status': langData['delete-mode-active'],
            '.import-mode-status': langData['import-mode-active']
        };
        
        // Apply text translations
        Object.entries(elements).forEach(([selector, text]) => {
            this.updateElementText(selector, text);
        });
    };
}