/**
 * Language Management System
 * Handles English/Arabic text translation for visible UI elements
 */



// Language translations object
const translations = {
    en: {
        // Header
        'title': 'Rosary Designer',
        'import': 'import',
        'presets': 'presets',
        
        // Language Toggle
        'lang-en': 'EN',
        'lang-ar': 'AR',
        
        // Toolbar Buttons
        'undo': 'Undo',
        'redo': 'Redo',
        'reset': 'Reset',
        'draw': 'Draw',
        'gallery': 'Gallery',
        'send': 'Send',
        
        // Bead Library Panel
        'bead-library': 'Bead Library',
        'draw-string': 'Draw String',
        'draw-string-desc': 'Click and drag to draw a path',
        
        // Email Modal
        'send-design-title': 'Send Your Design',
        'send-design-subtitle': 'Fill in your information below. Your design will be sent to us!',
        'name': 'Name',
        'name-placeholder': 'Your name (optional)',
        'email': 'Email Address',
        'email-placeholder': 'your@email.com',
        'email-required': '*',
        'phone': 'Phone',
        'phone-placeholder': '+1 (555) 123-4567',
        'phone-required': '*',
        'notes': 'Questions or Notes',
        'notes-placeholder': 'Any questions or special requests? (optional)',
        'form-note': '* Both Email and Phone Number are required',
        'send-design-btn': 'Send Design',
        'cancel': 'Cancel',
        
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
        
        // Gallery
        'design-gallery': 'Design Gallery',
        'send-selected': 'Send Selected',
        'send-selected-designs-title': 'Send Selected Designs',
        'send-selected-designs-subtitle': 'Fill in your information below. Selected designs will be sent!',
        
        // Gallery Email Modal (same as regular email but with Selected)
        'send-selected-btn': 'Send Selected',
        
        // ===== SAVED MENU TRANSLATIONS =====
        
        // Header & Modal Elements
        'saved-menu-btn': 'Saved',
        'saved-designs': 'Saved Designs',
        'save-design': 'Save Design',
        'import-design': 'Import Design',
        'delete-design': 'Delete Design',
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
        'saved-designs-empty': 'No saved designs found',
        
        // Dynamic Text with Variables
        'select-for-action': 'Select ${count} design${count > 1 ? "s" : ""} to ${action}',
        'selected-count': 'Selected: ${count}',
        'switching-mode': 'Switching to ${mode} mode'
    },
    ar: {
        // Header
        'title': 'مصمم سبحة',
        'import': 'استيراد',
        'presets': 'إعدادات مسبقة',
        
        // Language Toggle
        'lang-en': 'إن',
        'lang-ar': 'ع',
        
        // Toolbar Buttons
        'undo': 'تراجع',
        'redo': 'إعادة',
        'reset': 'إعادة تعيين',
        'draw': 'رسم',
        'gallery': 'المعرض',
        'send': 'إرسال',
        
        // Bead Library Panel
        'bead-library': 'مكتبة الخرز',
        'draw-string': 'رسم خيط',
        'draw-string-desc': 'انقر واسحب لرسم مسار',
        
        // Email Modal
        'send-design-title': 'أرسل تصميمك',
        'send-design-subtitle': 'املأ معلوماتك أدناه. سيتم إرسال تصميمك إلينا!',
        'name': 'الاسم',
        'name-placeholder': 'اسمك (اختياري)',
        'email': 'عنوان البريد الإلكتروني',
        'email-placeholder': 'your@email.com',
        'email-required': '*',
        'phone': 'الهاتف',
        'phone-placeholder': '+1 (555) 123-4567',
        'phone-required': '*',
        'notes': 'أسئلة أو ملاحظات',
        'notes-placeholder': 'أي أسئلة أو طلبات خاصة؟ (اختياري)',
        'form-note': '* مطلوب كل من البريد الإلكتروني ورقم الهاتف',
        'send-design-btn': 'إرسال التصميم',
        'cancel': 'إلغاء',
        
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
        
        // Gallery
        'design-gallery': 'معرض التصاميم',
        'send-selected': 'إرسال المحدد',
        'send-selected-designs-title': 'أرسل التصاميم المحددة',
        'send-selected-designs-subtitle': 'املأ معلوماتك أدناه. سيتم إرسال التصاميم المحددة!',
        
        // Gallery Email Modal
        'send-selected-btn': 'إرسال المحدد',
        
        // ===== SAVED MENU TRANSLATIONS =====
        
        // Header & Modal Elements
        'saved-menu-btn': 'محفوظ',
        'saved-designs': 'التصاميم المحفوظة',
        'save-design': 'حفظ',
        'import-design': 'استيراد',
        'delete-design': 'حذف',
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
        'saved-designs-empty': 'لم يتم العثور على تصاميم محفوظة',
        
        // Dynamic Text with Variables
        'select-for-action': 'حدد {} تصميم{} لل{}',
        'selected-count': 'محدد: {}',
        'switching-mode': 'التبديل إلى وضع {}'
    }
};

// Current language state
let currentLanguage = 'en';

// Language Manager class
class LanguageManager {
    constructor() {
        this.currentLanguage = 'en';
        this.rtlLanguages = ['ar']; // Arabic and other RTL languages
        this.init();
    }
    
    init() {
        // Initialize language toggle button
        this.setupLanguageToggle();
        
        // Set initial language to English
        this.setLanguage('en');
    }
    
    setupLanguageToggle() {
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }
    
    toggleLanguage() {
        const newLang = this.currentLanguage === 'en' ? 'ar' : 'en';
        this.setLanguage(newLang);
    }
    
    setLanguage(lang) {
        if (!translations[lang]) {
            console.warn(`Language ${lang} not supported`);
            return;
        }
        
        this.currentLanguage = lang;
        this.updateUI();
        this.updateLanguageToggle();
    }
    
    updateUI() {
        const langData = translations[this.currentLanguage];
        
        // Update all translatable elements
        const elements = {
            // Header
            'h1': langData['title'],
            '.import-presets-btn': langData['presets'],
            '.saved-label': langData['saved-menu-btn'],
            
            // Language Toggle
            '.lang-label': this.currentLanguage === 'en' ? 'EN' : 'AR',
            
            // Toolbar
            '#undo-btn .toolbar-label': langData['undo'],
            '#redo-btn .toolbar-label': langData['redo'],
            '#reset-button .toolbar-label': langData['reset'],
            '#draw-string-btn .toolbar-label': langData['draw'],
            '#library-btn .toolbar-label': langData['gallery'],
            '#email-btn .toolbar-label': langData['send'],
            
            // Bead Library Panel
            '.bead-library-panel h2': langData['bead-library'],
            '.bead-library-panel .tool-name': langData['draw-string'],
            '.bead-library-panel .tool-desc': langData['draw-string-desc'],
            
            // Email Modal
            '#email-modal h2': langData['send-design-title'],
            '#email-modal .modal-subtitle': langData['send-design-subtitle'],
            '#send-email-btn .btn-text': langData['send-design-btn'],
            '#email-modal .btn-secondary': langData['cancel'],
            
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
            '.preset-option-btn[data-preset="Rosary"] .option-desc': langData['preset-rosary-desc'],
            
            // Gallery
            '.gallery-panel h2': langData['design-gallery'],
            '#send-selected-btn .btn-text': langData['send-selected'],
            
            // Gallery Email Modal
            '#gallery-email-modal h2': langData['send-selected-designs-title'],
            '#gallery-email-modal .modal-subtitle': langData['send-selected-designs-subtitle'],
            '#send-gallery-email-btn .btn-text': langData['send-selected-btn'],
            '#gallery-email-modal .btn-secondary': langData['cancel'],
            
            // ===== SAVED MENU ELEMENTS =====
            
            // Modal Header
            '#saved-modal h3': langData['saved-designs'],
            '.modal-subtitle': langData['saved-designs-subtitle'],
            
            // Action Buttons
            '#save-design-btn .btn-text': langData['save-design'],
            '#import-design-btn .btn-text': langData['import-design'],
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
            '.import-mode-status': langData['import-mode-active'],
            
            // Form labels
            'label[for="customer-name"]': langData['name'],
            'label[for="customer-email"]': langData['email'],
            'label[for="customer-phone"]': langData['phone'],
            'label[for="customer-notes"]': langData['notes'],
            
            // Gallery form labels
            'label[for="gallery-customer-name"]': langData['name'],
            'label[for="gallery-customer-email"]': langData['email'],
            'label[for="gallery-customer-phone"]': langData['phone'],
            'label[for="gallery-customer-notes"]': langData['notes'],
            
            // Form notes
            '.form-note': langData['form-note'],
            
            // Placeholders
            '#customer-name::placeholder': langData['name-placeholder'],
            '#customer-email::placeholder': langData['email-placeholder'],
            '#customer-phone::placeholder': langData['phone-placeholder'],
            '#customer-notes::placeholder': langData['notes-placeholder'],
            '#gallery-customer-name::placeholder': langData['name-placeholder'],
            '#gallery-customer-email::placeholder': langData['email-placeholder'],
            '#gallery-customer-phone::placeholder': langData['phone-placeholder'],
            '#gallery-customer-notes::placeholder': langData['notes-placeholder']
        };
        
        // Apply text translations
        Object.entries(elements).forEach(([selector, text]) => {
            this.updateElementText(selector, text);
        });
        
        // Update Arabic RTL support
        this.updateRTLSupport();
    }
    
    updateElementText(selector, text) {
        // Handle special cases for input placeholders and other attributes
        if (selector.includes('::placeholder')) {
            const elementSelector = selector.replace('::placeholder', '');
            const elements = document.querySelectorAll(elementSelector);
            elements.forEach(element => {
                if (element && element.placeholder !== undefined) {
                    element.placeholder = text;
                }
            });
            return;
        }
        

        
        // Handle required field indicators
        if (selector.includes('label[for="customer-email"]')) {
            const element = document.querySelector(selector);
            if (element) {
                const requiredSpan = element.querySelector('.required');
                if (requiredSpan) {
                    element.innerHTML = text + ' ' + `<span class="required">${translations[this.currentLanguage]['email-required']}</span>`;
                } else {
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector.includes('label[for="customer-phone"]')) {
            const element = document.querySelector(selector);
            if (element) {
                const requiredSpan = element.querySelector('.required');
                if (requiredSpan) {
                    element.innerHTML = text + ' ' + `<span class="required">${translations[this.currentLanguage]['phone-required']}</span>`;
                } else {
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector.includes('label[for="gallery-customer-email"]')) {
            const element = document.querySelector(selector);
            if (element) {
                const requiredSpan = element.querySelector('.required');
                if (requiredSpan) {
                    element.innerHTML = text + ' ' + `<span class="required">${translations[this.currentLanguage]['email-required']}</span>`;
                } else {
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector.includes('label[for="gallery-customer-phone"]')) {
            const element = document.querySelector(selector);
            if (element) {
                const requiredSpan = element.querySelector('.required');
                if (requiredSpan) {
                    element.innerHTML = text + ' ' + `<span class="required">${translations[this.currentLanguage]['phone-required']}</span>`;
                } else {
                    element.textContent = text;
                }
            }
            return;
        }
        
        // Handle form note
        if (selector === '.form-note') {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = text;
            });
            return;
        }
        
        // Handle buttons with specific text
        if (selector === '#send-email-btn') {
            const element = document.querySelector(selector);
            if (element) {
                const textSpan = element.querySelector('.btn-text');
                if (textSpan) {
                    textSpan.textContent = text;
                } else {
                    // If no text span, update the button text directly
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector === '#send-gallery-email-btn') {
            const element = document.querySelector(selector);
            if (element) {
                const textSpan = element.querySelector('.btn-text');
                if (textSpan) {
                    textSpan.textContent = text;
                } else {
                    // If no text span, update the button text directly
                    element.textContent = text;
                }
            }
            return;
        }
        
        if (selector === '#gallery-email-modal .btn-secondary') {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        // Handle reset options
        if (selector === '.modal-compact h3') {
            // Update reset modal title
            const resetModal = document.getElementById('reset-menu');
            if (resetModal && resetModal.style.display !== 'none') {
                const title = resetModal.querySelector('h3');
                if (title) title.textContent = text;
            }
            return;
        }
        
        // Import Presets special handling
        if (selector === '#import-presets-modal .modal-subtitle') {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        if (selector === '#import-presets-modal p') {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        // Handle preset option updates when modal is open
        if (selector.startsWith('.preset-option-btn')) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = text;
            });
            return;
        }
        
        // Handle modal titles and subtitles with context awareness
        if (selector === '.modal h2') {
            const modals = document.querySelectorAll('.modal h2');
            modals.forEach(modal => {
                const parentModal = modal.closest('.modal');
                if (parentModal) {
                    const modalId = parentModal.id;
                    if (modalId === 'email-modal') {
                        modal.textContent = text;
                    }
                }
            });
            return;
        }
        
        if (selector === '.modal .modal-subtitle') {
            const modals = document.querySelectorAll('.modal .modal-subtitle');
            modals.forEach(modal => {
                const parentModal = modal.closest('.modal');
                if (parentModal) {
                    const modalId = parentModal.id;
                    if (modalId === 'email-modal') {
                        modal.textContent = text;
                    }
                }
            });
            return;
        }
        
        if (selector === '#gallery-email-modal h2') {
            const element = document.querySelector('#gallery-email-modal h2');
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        if (selector === '#gallery-email-modal .modal-subtitle') {
            const element = document.querySelector('#gallery-email-modal .modal-subtitle');
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        if (selector === '#send-selected-btn') {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
            return;
        }
        
        // Standard element selection
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element && element.textContent !== undefined) {
                // Special handling for tool labels that might be in spans
                if (selector.includes('.toolbar-label')) {
                    const label = element.querySelector('.toolbar-label');
                    if (label) {
                        label.textContent = text;
                    } else {
                        element.textContent = text;
                    }
                }
                // Handle button text spans
                else if (selector.includes('.btn-text')) {
                    element.textContent = text;
                }
                // Handle option titles and descriptions
                else if (selector.includes('.option-title') || selector.includes('.option-desc')) {
                    element.textContent = text;
                }
                // Standard text update
                else {
                    element.textContent = text;
                }
            }
        });
    }
    
    updateLanguageToggle() {
        const langToggle = document.getElementById('lang-toggle');
        const langLabel = langToggle?.querySelector('.lang-label');
        
        if (langLabel) {
            langLabel.textContent = this.currentLanguage === 'en' ? 'EN' : 'AR';
            langLabel.setAttribute('data-lang', this.currentLanguage);
        }
    }
    
    updateRTLSupport() {
        // Add RTL support for Arabic
        if (this.rtlLanguages.includes(this.currentLanguage)) {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');
            
            // Add RTL class for styling individual elements
            document.body.classList.add('rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'en');
            document.body.classList.remove('rtl');
        }
    }
    
    // Helper method to get translated text
    t(key) {
        return translations[this.currentLanguage][key] || key;
    }
    
    // Get translation method (same as t() but more explicit name)
    getTranslation(key) {
        return translations[this.currentLanguage][key] || key;
    }
    
    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Initialize language manager when DOM is ready
let languageManager;

function initLanguageManager() {
    languageManager = new LanguageManager();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLanguageManager();
    });
} else {
    initLanguageManager();
}

// Global getTranslation function
window.getTranslation = function(key) {
    try {
        if (languageManager && languageManager.getTranslation) {
            return languageManager.getTranslation(key);
        }
        // Fallback to English if manager not ready
        if (translations && translations.en && translations.en[key]) {
            return translations.en[key];
        }
        // Final fallback to key
        return key;
    } catch (error) {
        return key;
    }
};