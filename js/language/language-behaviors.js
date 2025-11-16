/**
 * Language Management System - Behaviors Module
 * Contains reset menu, size selection, and import presets translations
 */

// Add behaviors translations to the translations object
if (typeof window.translations !== 'undefined') {
    window.translations.en = {
        ...window.translations.en,
        // Reset Menu
        'reset-options': 'Reset Options',
        'reset-all': 'Reset All',
        'reset-all-desc': 'Delete everything (string and objects)',
        'clear-objects': 'Clear Objects',
        'clear-objects-desc': 'Delete all objects but keep string',
        'delete-individual': 'Delete Individually',
        'delete-individual-desc': 'Click X on objects to delete them',
        
        // Size Selection
        'select-bead-size': 'Select Bead Size',
        
        // Import Presets
        'import-presets-title': 'Import Presets',
        'import-presets-subtitle': 'Choose a preset pattern to import',
        'import-presets-empty': 'This feature will be available soon',
        
        // Import Confirmation
        'import-confirm-title': 'Import ${preset}?', // ${preset} will be replaced dynamically
        'import-confirm-message': 'This will replace everything in your sandbox. This action cannot be undone.',
        'import-confirm-btn': 'Yes, Import',
        'cancel': 'Cancel',
        
        // Preset Names
        'preset-bracelet': 'Bracelet',
        'preset-circle': 'Circle',
        'preset-heart': 'Heart',
        'preset-rosary': 'Rosary',
        
        // Preset Descriptions
        'preset-bracelet-desc': 'Import bracelet pattern',
        'preset-circle-desc': 'Import circle pattern',
        'preset-heart-desc': 'Import heart pattern',
        'preset-rosary-desc': 'Import rosary pattern',
        
        // Delete Mode Toast
        'delete-mode-click-space': 'Click on an empty space',
        'delete-mode-to-deactivate': 'to deactivate!',
        'delete-mode-deactivated': 'Delete mode deactivated'
    };
    
    window.translations.ar = {
        ...window.translations.ar,
        // Reset Menu
        'reset-options': 'خيارات إعادة التعيين',
        'reset-all': 'إعادة تعيين الكل',
        'reset-all-desc': 'حذف كل شيء (الخيط والاشياء)',
        'clear-objects': 'مسح الاشياء',
        'clear-objects-desc': 'حذف كل الاشياء مع الحفاظ على الخيط',
        'delete-individual': 'حذف فردي',
        'delete-individual-desc': 'انقر X على الاشياء لحذفها',
        
        // Size Selection
        'select-bead-size': 'اختيار حجم الخرزة',
        
        // Import Presets
        'import-presets-title': 'استيراد الإعدادات المسبقة',
        'import-presets-subtitle': 'اختر نمط الإعداد المسبق للاستيراد',
        'import-presets-empty': 'ستكون هذه الميزة متاحة قريباً',
        
        // Import Confirmation
        'import-confirm-title': 'استيراد ${preset}؟', // ${preset} will be replaced dynamically
        'import-confirm-message': 'سيتم استبدال كل شيء في صندوق الرمل الخاص بك. لا يمكن التراجع عن هذا الإجراء.',
        'import-confirm-btn': 'نعم، استيراد',
        'cancel': 'إلغاء',
        
        // Preset Names
        'preset-bracelet': 'سوار',
        'preset-circle': 'دائرة',
        'preset-heart': 'قلب',
        'preset-rosary': 'سلسلة صلاة',
        
        // Preset Descriptions
        'preset-bracelet-desc': 'استيراد نمط السوار',
        'preset-circle-desc': 'استيراد نمط الدائرة',
        'preset-heart-desc': 'استيراد نمط القلب',
        'preset-rosary-desc': 'استيراد نمط سلسلة الصلاة',
        
        // Delete Mode Toast
        'delete-mode-click-space': 'انقر على مساحة فارغة',
        'delete-mode-to-deactivate': 'لإلغاء التفعيل!',
        'delete-mode-deactivated': 'تم إلغاء تفعيل وضع الحذف'
    };
}

// Extend LanguageManager prototype for Behaviors UI functionality
if (typeof LanguageManager !== 'undefined') {
    LanguageManager.prototype._updateBehaviorsUI = function() {
        const langData = translations[this.currentLanguage];
        
        // Update behaviors UI elements
        const elements = {
            // Reset Menu
            '#reset-menu h3': langData['reset-options'],
            '#reset-all-btn .option-title': langData['reset-all'],
            '#reset-all-btn .option-desc': langData['reset-all-desc'],
            '#delete-objects-btn .option-title': langData['clear-objects'],
            '#delete-objects-btn .option-desc': langData['clear-objects-desc'],
            '#delete-individual-btn .option-title': langData['delete-individual'],
            '#delete-individual-btn .option-desc': langData['delete-individual-desc'],
            
            // Size Selection Modal
            '#size-selection-modal h3': langData['select-bead-size'],
            
            // Import Presets
            '#import-presets-modal h3': langData['import-presets-title'],
            '#import-presets-modal .modal-subtitle': langData['import-presets-subtitle'],
            '#import-presets-modal p': langData['import-presets-empty'],
            
            // Import Confirmation Dialog
            '#import-confirm-modal h3': langData['import-confirm-title'], // Will be handled with preset replacement
            '#import-confirm-modal .modal-subtitle': langData['import-confirm-message'],
            '#confirm-import-btn': langData['import-confirm-btn'],
            '#import-confirm-modal .btn-secondary': langData['cancel'],
            
            // Preset Options (dynamic elements)
            '.preset-option-btn[data-preset="Bracelet"] .option-title': langData['preset-bracelet'],
            '.preset-option-btn[data-preset="Bracelet"] .option-desc': langData['preset-bracelet-desc'],
            '.preset-option-btn[data-preset="Circle"] .option-title': langData['preset-circle'],
            '.preset-option-btn[data-preset="Circle"] .option-desc': langData['preset-circle-desc'],
            '.preset-option-btn[data-preset="Heart"] .option-title': langData['preset-heart'],
            '.preset-option-btn[data-preset="Heart"] .option-desc': langData['preset-heart-desc'],
            '.preset-option-btn[data-preset="Rosary"] .option-title': langData['preset-rosary'],
            '.preset-option-btn[data-preset="Rosary"] .option-desc': langData['preset-rosary-desc']
        };
        
        // Apply text translations
        Object.entries(elements).forEach(([selector, text]) => {
            this.updateElementText(selector, text);
        });
    };
}