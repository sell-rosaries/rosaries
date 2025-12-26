(function () {
    // --- Configuration ---
    const REPO = 'sell-rosaries/rosaries';
    const BRANCH = 'main';
    const LOCKOUT_KEY = 'admin_lockout';
    const FAILS_KEY = 'admin_fails';
    const MAX_ATTEMPTS = 3;

    let pat = '';
    let currentPath = '';
    let currentMode = ''; // 'beads' | 'gallery'

    // --- Styles ---
    const css = `
        /* Overlay */
        #admin-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.4);
            z-index: 9999;
            display: flex; justify-content: center; align-items: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
            backdrop-filter: blur(10px);
            font-family: 'Inter', sans-serif;
        }
        #admin-overlay.active { opacity: 1; pointer-events: all; }

        /* Modals */
        .admin-modal {
            background: var(--glass-light, rgba(255, 255, 255, 0.2));
            border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
            backdrop-filter: var(--backdrop-heavy, blur(40px));
            border-radius: var(--radius-xl, 24px);
            padding: 24px;
            width: 90%; max-width: 480px;
            display: none; flex-direction: column; gap: 16px;
            box-shadow: var(--shadow-glass, 0 8px 32px rgba(0, 0, 0, 0.1));
            color: var(--neutral-900, #111827);
            animation: modalFadeIn 0.3s ease-out;
        }
        
        @media (prefers-color-scheme: dark) {
             .admin-modal { color: #fff; }
        }
        
        @keyframes modalFadeIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        /* Login Input */
        .login-container { position: relative; width: 100%; height: 50px; }
        .tap-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; justify-content: space-between; align-items: center;
            padding: 0 20px; pointer-events: none;
            font-family: var(--font-family, sans-serif);
            font-weight: bold; font-size: 18px;
            color: var(--neutral-500, #6B7280); 
            z-index: 1;
            transition: opacity 0.2s;
        }
        #admin-pat-input {
            width: 100%; height: 100%;
            background: var(--glass-subtle, rgba(255,255,255,0.1));
            border: 1px solid var(--neutral-300, rgba(255,255,255,0.2));
            border-radius: var(--radius-md, 12px);
            color: inherit; 
            font-family: monospace; font-size: 16px;
            padding: 0 20px; outline: none;
            transition: border-color 0.3s;
            text-align: center;
            position: relative; z-index: 2;
            background: transparent; 
        }
        #admin-pat-input:focus { border-color: var(--primary-500, #667EEA); }
        
        /* Menu Buttons */
        .admin-menu-btn {
            padding: 24px;
            background: var(--glass-medium, rgba(255,255,255,0.2));
            border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
            border-radius: var(--radius-lg, 16px);
            color: inherit; 
            font-size: 18px; font-weight: 600;
            cursor: pointer; transition: all 0.2s;
            display: flex; align-items: center; justify-content: center;
            box-shadow: var(--shadow-sm);
        }
        .admin-menu-btn:active { transform: scale(0.98); background: var(--primary-500, #667EEA); color: white; }

        /* Manager View */
        #admin-manager {
            width: 95%; height: 80vh; max-width: 800px;
            display: flex; flex-direction: column;
            padding: 20px; 
        }
        
        .manager-header {
            display: flex; align-items: center;
            margin-bottom: 20px;
            position: relative;
            direction: ltr !important; /* Always keep Back on left, Close on right */
        }
        .btn-back {
            background: none; border: none; color: inherit; 
            font-size: 24px; cursor: pointer; padding: 0 10px 0 0;
            margin-right: auto;
        }
        .manager-title { font-size: 20px; font-weight: bold; position: absolute; left: 50%; transform: translateX(-50%); }
        .manager-close { background: none; border: none; color: inherit; font-size: 24px; cursor: pointer; margin-left: auto;}

        /* --- GRID SYSTEM --- */
        .admin-grid {
            display: grid; 
            gap: 10px;
            overflow-y: auto; padding-bottom: 60px;
            justify-content: center;
        }

        /* FOLDER VIEW (Flexible for both) */
        .admin-grid.view-folders.beads { grid-template-columns: repeat(3, 1fr); }
        .admin-grid.view-folders.gallery { grid-template-columns: repeat(2, 1fr); }

        /* --- BEADS IMAGE VIEW --- */
        /* Fixed 100px Grid (The "Perfect" revert) */
        .admin-grid.view-images.beads {
            grid-template-columns: repeat(3, 100px);
        }
        
        /* Beads Image Item */
        .admin-grid.view-images.beads .admin-grid-item {
            width: 100px; height: 100px;
            padding: 8px;
            background: var(--bg-card, #fff);
            border: 1px solid var(--neutral-200, #e5e7eb);
            border-radius: 12px;
            overflow: hidden;
            position: relative;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: transform 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .admin-grid.view-images.beads .admin-grid-item img {
            width: 100%; height: 100%;
            object-fit: contain;
        }

        /* --- GALLERY IMAGE VIEW (Matching Public Gallery CSS) --- */
        /* Replicating .gallery-grid logic */
        .admin-grid.view-images.gallery {
            grid-template-columns: repeat(2, minmax(160px, 1fr)); /* Matches Responsive CSS */
            gap: var(--space-3, 12px);
            justify-content: center;
            align-content: start;
        }

        /* Replicating .gallery-card logic */
        .admin-grid.view-images.gallery .admin-grid-item:not(.admin-add-tile) {
            /* Matches .gallery-card */
            width: 100%; 
            height: 220px; /* Matches responsive height */
            background: white;
            border: 1px solid var(--neutral-200);
            border-radius: var(--radius-md, 12px);
            overflow: hidden;
            cursor: pointer;
            transition: all var(--duration-base);
            position: relative;
            display: block; /* Reset flex from common styles */
            box-shadow: none; /* Reset common shadow */
        }
        
        .admin-grid.view-images.gallery .admin-grid-item:not(.admin-add-tile):hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }

        /* Replicating .gallery-image-wrapper logic */
        .admin-grid.view-images.gallery .admin-grid-item:not(.admin-add-tile) img {
            width: 100%;
            height: 100%;
            object-fit: contain; /* Matches public gallery */
            display: block;
            padding: 0;
        }

        /* Folder Item Common Style */
        .folder-item {
            display: flex;
            flex-direction: column; 
            align-items: center; 
            justify-content: center;
            padding: 10px;
            min-height: 80px;
            background: var(--bg-card, #fff);
            border: 1px solid var(--neutral-200, #e5e7eb);
            border-radius: 12px;
            color: var(--primary-500, #667EEA);
            cursor: pointer;
        }
        .folder-icon { font-size: 24px; margin-bottom: 5px; }
        .folder-name { font-size: 10px; text-align: center; width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 0 4px; }
        
        /* Add Button (Tile) */
        .admin-add-tile {
            display: flex; align-items: center; justify-content: center;
            background: rgba(16, 185, 129, 0.1);
            border: 1px dashed rgba(16, 185, 129, 0.5);
            color: #10B981; font-size: 32px;
            border-radius: 12px;
            cursor: pointer;
        }
        /* Match size for beads */
        .admin-grid.view-images.beads .admin-add-tile { width: 100px; height: 100px; }
        /* Match size for gallery */
        .admin-grid.view-images.gallery .admin-add-tile { height: 220px; }

        /* Edit Modal */
        #admin-edit-modal { text-align: center; }
        .edit-header {
            display: flex; justify-content: space-between; align-items: center;
            width: 100%; margin-bottom: 10px;
            direction: ltr !important; /* Always keep Back on left, Close on right */
        }
        #edit-preview-img {
            max-width: 100%; max-height: 250px;
            object-fit: contain;
            border-radius: 8px; margin-bottom: 16px;
        }
        .edit-input {
            width: 100%; padding: 12px;
            background: var(--glass-subtle, rgba(0,0,0,0.1)); 
            border: 1px solid var(--neutral-300, rgba(255,255,255,0.2));
            border-radius: 8px; color: inherit; margin-bottom: 16px;
        }
        .edit-actions { display: flex; gap: 10px; }
        .action-btn {
            flex: 1; padding: 12px; border: none; border-radius: 8px;
            font-weight: 600; cursor: pointer; color: white;
        }
        .btn-delete { background: var(--error, #EF4444); }
        .btn-save { background: var(--success, #10B981); }

        /* Fullscreen Preview */
        #admin-fullscreen-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 100000;
            display: none; justify-content: center; align-items: center;
        }
        #admin-fullscreen-overlay img { max-width: 95%; max-height: 95%; object-fit: contain; }
        .fullscreen-close {
            position: absolute; top: 20px; right: 20px;
            background: rgba(255,255,255,0.2); border: none; color: white;
            width: 44px; height: 44px; border-radius: 50%;
            font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }

        /* Lang Switcher */
        .admin-lang-row { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
        .admin-lang-btn {
            background: var(--glass-light, rgba(255, 255, 255, 0.1));
            border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
            padding: 8px 16px; border-radius: 8px; color: inherit; cursor: pointer;
            font-weight: bold;
        }
        .admin-lang-btn.active { background: var(--primary-500, #667EEA); border-color: transparent; color: white; }

        /* Login Button */
        #admin-login-btn {
            margin-top: 10px; width: 100%; padding: 12px; 
            background: var(--primary-500, #667EEA); color: white;
            border: none; border-radius: 12px; font-weight: bold; cursor: pointer;
        }

        /* Price Tag */
        .gallery-price-tag {
            position: absolute; bottom: 8px; left: 8px;
            background: linear-gradient(145deg, #ffffff, #e6e6e6);
            color: #111827;
            padding: 4px 8px; border-radius: 12px;
            font-size: 11px; font-weight: 700;
            font-family: monospace;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            z-index: 10; pointer-events: none;
        }
    `;

    const translations = {
        en: {
            beadLibrary: 'Bead Library',
            gallery: 'Gallery',
            edit: 'Edit',
            delete: 'Delete',
            rename: 'Rename',
            tap: 'TAP',
            loading: 'Loading...',
            root: 'Root',
            deleteConfirm: 'Delete?',
            login: 'Log In'
        },
        ar: {
            beadLibrary: 'مكتبة الخرز',
            gallery: 'المعرض',
            edit: 'تعديل',
            delete: 'حذف',
            rename: 'إعادة تسمية',
            tap: 'اضغط',
            loading: 'جاري التحميل...',
            root: 'الرئيسي',
            deleteConfirm: 'حذف؟',
            login: 'تسجيل الدخول'
        }
    };

    let currentLang = 'en';

    function t(key) {
        return translations[currentLang][key] || key;
    }

    function updateAdminTranslations() {
        const isRTL = currentLang === 'ar';
        document.getElementById('admin-overlay').dir = isRTL ? 'rtl' : 'ltr';

        const tapOverlay = document.querySelector('.tap-overlay');
        if (tapOverlay) {
            tapOverlay.innerHTML = t('tap').split('').map(c => `<span>${c}</span>`).join('');
        }
        document.getElementById('admin-login-btn').textContent = t('login');

        const menuBtns = document.querySelectorAll('#admin-menu-modal .admin-menu-btn span');
        if (menuBtns[0]) menuBtns[0].textContent = t('beadLibrary');
        if (menuBtns[1]) menuBtns[1].textContent = t('gallery');

        if (currentMode) {
            document.getElementById('manager-title-text').textContent = (currentPath.split('/').pop() || t('root'));
        }

        document.querySelector('#admin-edit-modal span[style*="font-weight:bold"]').textContent = t('edit');
        document.getElementById('btn-delete').textContent = t('delete');
        document.getElementById('btn-save').textContent = t('rename');

        document.querySelectorAll('.admin-lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    }

    // --- DOM Injection ---
    function injectUI() {
        const style = document.createElement('style');
        style.textContent = css + `
            #admin-trigger-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                z-index: 99999; cursor: pointer; background: transparent;
            }
        `;
        document.head.appendChild(style);

        const attachOverlay = () => {
            const wrapper = document.querySelector('.crt-wrapper');
            if (wrapper && !document.getElementById('admin-trigger-overlay')) {
                const trigger = document.createElement('div');
                trigger.id = 'admin-trigger-overlay';
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (isLocked()) return;
                    openAdmin();
                });
                wrapper.appendChild(trigger);
                wrapper.style.position = 'relative';
            }
        };
        attachOverlay();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachOverlay);
        }

        const overlay = document.createElement('div');
        overlay.id = 'admin-overlay';
        overlay.innerHTML = `
            <!-- Login Modal -->
            <div id="admin-login-modal" class="admin-modal">
                <div class="login-container">
                    <div class="tap-overlay">
                        <span>T</span><span>A</span><span>P</span>
                    </div>
                    <input type="password" id="admin-pat-input" placeholder="">
                </div>
                <button id="admin-login-btn">Log In</button>
            </div>

            <!-- Menu Modal -->
            <div id="admin-menu-modal" class="admin-modal">
                <div class="admin-lang-row">
                    <button class="admin-lang-btn" data-lang="en">EN</button>
                    <button class="admin-lang-btn" data-lang="ar">AR</button>
                </div>
                <button class="admin-menu-btn" onclick="window.adminOpenManager('beads')"><span>Bead Library</span></button>
                <button class="admin-menu-btn" onclick="window.adminOpenManager('gallery')"><span>Gallery</span></button>
            </div>

            <!-- Manager View -->
            <div id="admin-manager" class="admin-modal">
                <div class="manager-header">
                    <button class="btn-back" onclick="window.adminBackToMenu()">&lt;</button>
                    <span class="manager-title" id="manager-title-text">Library</span>
                    <button class="manager-close" onclick="window.adminQuit()">×</button>
                </div>
                <div id="admin-grid" class="admin-grid"></div>
                <input type="file" id="admin-file-upload" hidden multiple accept="image/*">
            </div>

            <!-- Edit Modal -->
            <div id="admin-edit-modal" class="admin-modal">
                <div class="edit-header">
                    <button class="btn-back" onclick="window.adminBackToManager()">&lt;</button>
                    <span style="font-weight:bold;">Edit</span>
                    <button class="manager-close" onclick="window.adminQuit()">×</button>
                </div>
                <img id="edit-preview-img" src="" style="cursor: pointer;">
                <div id="edit-filename-display" style="font-size: 12px; margin-bottom: 8px; opacity: 0.7; font-family: monospace;"></div>
                <input type="text" id="edit-basename-input" class="edit-input" placeholder="Base Name" style="margin-bottom: 8px;">
                <input type="text" id="edit-name-input" class="edit-input" placeholder="$Price">
                <div class="edit-actions">
                    <button class="action-btn btn-delete" id="btn-delete">Delete</button>
                    <button class="action-btn btn-save" id="btn-save">Rename</button>
                </div>
            </div>

            <!-- Fullscreen Overlay -->
            <div id="admin-fullscreen-overlay">
                <button class="fullscreen-close">×</button>
                <img src="">
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) quitAdmin();
            if (e.target.id === 'admin-fullscreen-overlay' || e.target.classList.contains('fullscreen-close')) {
                document.getElementById('admin-fullscreen-overlay').style.display = 'none';
            }
        });

        const patInput = document.getElementById('admin-pat-input');
        patInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptLogin(); });
        patInput.addEventListener('input', () => {
            const tapOverlay = document.querySelector('.tap-overlay');
            tapOverlay.style.opacity = patInput.value.length > 0 ? '0' : '1';
        });

        document.getElementById('admin-login-btn').addEventListener('click', attemptLogin);

        document.querySelectorAll('.admin-lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentLang = btn.dataset.lang;
                updateAdminTranslations();
            });
        });

        document.getElementById('edit-preview-img').addEventListener('click', (e) => {
            const fs = document.getElementById('admin-fullscreen-overlay');
            fs.querySelector('img').src = e.target.src;
            fs.style.display = 'flex';
        });

        document.getElementById('admin-file-upload').addEventListener('change', handleFileUpload);
        document.getElementById('btn-delete').addEventListener('click', deleteCurrentFile);
        document.getElementById('btn-save').addEventListener('click', renameCurrentFile);
    }

    // --- Core Logic ---
    function isLocked() { return localStorage.getItem(LOCKOUT_KEY) === 'true'; }
    function openAdmin() {
        document.getElementById('admin-overlay').classList.add('active');
        showModal('admin-login-modal');
        document.getElementById('admin-pat-input').value = '';
        document.getElementById('admin-pat-input').focus();
        document.querySelector('.tap-overlay').style.opacity = '1';
    }
    function quitAdmin() {
        document.getElementById('admin-overlay').classList.remove('active');
        document.querySelectorAll('.admin-modal').forEach(m => m.style.display = 'none');
        pat = '';
        currentLang = 'en'; // Reset language on exit
        updateAdminTranslations();
    }
    window.adminQuit = quitAdmin;

    function showModal(id) {
        document.querySelectorAll('.admin-modal').forEach(m => m.style.display = 'none');
        document.getElementById(id).style.display = 'flex';
    }

    window.adminBackToMenu = function () {
        const rootPath = (currentMode === 'beads') ? 'Jularies' : 'gallery';
        if (currentPath === rootPath) {
            showModal('admin-menu-modal');
        } else {
            const parts = currentPath.split('/');
            parts.pop();
            loadPath(parts.join('/'));
        }
    };

    window.adminBackToManager = function () {
        showModal('admin-manager');
    };

    async function attemptLogin() {
        const input = document.getElementById('admin-pat-input');
        const token = input.value.trim();
        if (!token) return;
        try {
            const res = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${token}` } });
            if (res.ok) {
                pat = token;
                localStorage.setItem(FAILS_KEY, '0');
                showModal('admin-menu-modal');
            } else { handleFail(); }
        } catch (e) { handleFail(); }
    }

    function handleFail() {
        let fails = parseInt(localStorage.getItem(FAILS_KEY) || '0') + 1;
        localStorage.setItem(FAILS_KEY, fails);
        const input = document.getElementById('admin-pat-input');
        input.value = ''; input.style.borderColor = 'red';
        setTimeout(() => input.style.borderColor = '', 500);
        if (fails >= MAX_ATTEMPTS) { localStorage.setItem(LOCKOUT_KEY, 'true'); quitAdmin(); }
    }

    window.adminOpenManager = function (mode) {
        currentMode = mode;
        showModal('admin-manager');
        const grid = document.getElementById('admin-grid');
        grid.className = `admin-grid ${mode}`;
        currentPath = (mode === 'beads') ? 'Jularies' : 'gallery';
        loadPath(currentPath);
    };

    async function loadPath(path) {
        currentPath = path;
        const grid = document.getElementById('admin-grid');
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center;">${t('loading')}</div>`;
        document.getElementById('manager-title-text').textContent = path.split('/').pop() || t('root');

        try {
            const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { headers: { 'Authorization': `token ${pat}` } });
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            renderGrid(data);
        } catch (e) {
            grid.innerHTML = `<div style="color:red; grid-column:1/-1;">Error: ${e.message}</div>`;
        }
    }

    function renderGrid(items) {
        const grid = document.getElementById('admin-grid');
        grid.innerHTML = '';

        // Detect content type for Grid View logic
        const hasImages = items.some(i => i.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));

        if (hasImages) {
            grid.classList.add('view-images');
            grid.classList.remove('view-folders');
        } else {
            grid.classList.add('view-folders');
            grid.classList.remove('view-images');
        }

        const addBtn = document.createElement('div');
        addBtn.className = 'admin-grid-item admin-add-tile';
        addBtn.innerHTML = '+';
        addBtn.onclick = () => document.getElementById('admin-file-upload').click();
        grid.appendChild(addBtn);

        items.sort((a, b) => (a.type === b.type) ? 0 : (a.type === 'dir' ? -1 : 1));

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'admin-grid-item';

            if (item.type === 'dir') {
                el.classList.add('folder-item');
                el.innerHTML = `<div class="folder-icon">📁</div><div class="folder-name">${item.name}</div>`;
                el.onclick = () => loadPath(item.path);
            } else if (item.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
                const priceMatch = item.name.match(/\$(\d+)/);
                const priceHtml = priceMatch ? `<div class="gallery-price-tag">AU$${priceMatch[1]}</div>` : '';
                el.innerHTML = `<img src="${item.download_url}" loading="lazy">${priceHtml}`;
                el.onclick = () => openEdit(item);
            } else { return; }
            grid.appendChild(el);
        });
    }

    // --- File Ops ---
    let selectedFile = null;
    function openEdit(file) {
        selectedFile = file;
        showModal('admin-edit-modal');
        document.getElementById('edit-preview-img').src = file.download_url;
        
        const name = file.name;
        const lastDot = name.lastIndexOf('.');
        const baseWithPrice = lastDot !== -1 ? name.substring(0, lastDot) : name;
        const ext = lastDot !== -1 ? name.substring(lastDot) : '';
        
        const priceIndex = baseWithPrice.lastIndexOf('$');
        let base = baseWithPrice;
        let price = '';
        if (priceIndex !== -1) {
            base = baseWithPrice.substring(0, priceIndex);
            price = baseWithPrice.substring(priceIndex);
        }
        
        document.getElementById('edit-filename-display').textContent = 'Original: ' + name;
        document.getElementById('edit-basename-input').value = base;
        document.getElementById('edit-name-input').value = price;
        document.getElementById('edit-name-input').placeholder = '$Price (Optional)';
        
        // Store for reconstruction
        selectedFile._extension = ext;
    }

    async function deleteCurrentFile() {
        if (!confirm(t('deleteConfirm'))) return;
        const btn = document.getElementById('btn-delete');
        btn.textContent = '...';
        try {
            await fetch(selectedFile.url, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${pat}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Delete ${selectedFile.name}`, sha: selectedFile.sha, branch: BRANCH })
            });
            showModal('admin-manager'); loadPath(currentPath);
        } catch (e) { alert(t('delete') + ' failed'); } finally { btn.textContent = t('delete'); }
    }

    async function renameCurrentFile() {
        const baseName = document.getElementById('edit-basename-input').value.trim();
        const priceTag = document.getElementById('edit-name-input').value.trim();
        const newName = baseName + priceTag + selectedFile._extension;
        
        if (!baseName || newName === selectedFile.name) return;
        const btn = document.getElementById('btn-save'); btn.textContent = '...';
        try {
            const blobRes = await fetch(selectedFile.download_url);
            const blob = await blobRes.blob();
            const base64 = await new Promise(r => {
                const reader = new FileReader();
                reader.onloadend = () => r(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });
            const newPath = currentPath + '/' + newName;
            const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${newPath}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${pat}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Rename to ${newName}`, content: base64, branch: BRANCH })
            });
            if (!putRes.ok) throw new Error('Upload failed');
            await fetch(selectedFile.url, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${pat}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Remove old ${selectedFile.name}`, sha: selectedFile.sha, branch: BRANCH })
            });
            showModal('admin-manager'); loadPath(currentPath);
        } catch (e) { alert(t('rename') + ' failed: ' + e.message); } finally { btn.textContent = t('rename'); }
    }

    async function handleFileUpload(e) {
        const files = e.target.files;
        if (!files.length) return;
        const grid = document.getElementById('admin-grid');
        grid.firstChild.textContent = '...';
        for (const file of files) {
            try {
                const base64 = await new Promise(r => {
                    const reader = new FileReader();
                    reader.onloadend = () => r(reader.result.split(',')[1]);
                    reader.readAsDataURL(file);
                });
                const newPath = currentPath + '/' + file.name;
                await fetch(`https://api.github.com/repos/${REPO}/contents/${newPath}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `token ${pat}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Upload ${file.name}`, content: base64, branch: BRANCH })
                });
            } catch (err) { console.error(err); }
        }
        loadPath(currentPath);
    }

    injectUI();
    document.addEventListener('click', (e) => {
        if (e.target.matches('#crt-text') || e.target.closest('.crt-title') || e.target.closest('.crt-wrapper') || e.target.matches('#admin-trigger-overlay')) {
            e.preventDefault(); e.stopPropagation();
            if (isLocked()) return;
            openAdmin();
        }
    }, true);
})();
