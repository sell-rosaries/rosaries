/*
    SAVED DESIGNS IMPORT MODULE
    Import/export operations, import mode toggle, and design importing
*/

function toggleImportMode() {
    if (importModeActive) {
        importModeActive = false;
        const importBtn = document.getElementById('import-design-btn');
        if (importBtn) {
            importBtn.style.background = '';
            importBtn.style.color = '';
            importBtn.style.boxShadow = '';
            importBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="btn-text"></span>
            `;
            if (typeof updateImportButtonText === 'function') updateImportButtonText();
        }
        showSaveSuccess((typeof window.getTranslation === 'function' ? window.getTranslation('import-mode-deactivated') : null) || 'Import mode deactivated');
    } else {
        importModeActive = true;
        const importBtn = document.getElementById('import-design-btn');
        if (importBtn) {
            importBtn.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
            importBtn.style.color = 'white';
            importBtn.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            importBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="btn-text"></span>
            `;
            if (typeof updateImportButtonText === 'function') updateImportButtonText();
        }
        showSaveSuccess((typeof window.getTranslation === 'function' ? window.getTranslation('import-mode-activated') : null) || 'Click saved design to import!');
    }
}

function importDesign(designId) {
    const savedDesigns = getSavedDesigns();
    const design = savedDesigns.find(d => d.id === designId);
    if (!design) {
        showSaveError((typeof window.getTranslation === 'function' ? window.getTranslation('design-not-found') : null) || 'Design not found.');
        return;
    }
    clearCurrentDesign();
    requestAnimationFrame(() => requestAnimationFrame(() => startImportProcess(design)));
}

function startImportProcess(design) {
    if (typeof window.setStringType === 'function') {
        window.setStringType(design.stringType || 'preset');
    }

    // Import string - MUST use THREE.Vector3 for proper interaction
    if (design.stringPoints) {
        stringPoints.length = 0;
        design.stringPoints.forEach(point => {
            stringPoints.push(new THREE.Vector3(point.x || 0, point.y || 0, point.z || 0));
        });
        if (typeof updateStringLine === 'function') updateStringLine();
        if (typeof window.updateStringType === 'function') window.updateStringType();
    }

    // Import beads
    if (design.beads && design.beads.length > 0) {
        const promises = design.beads.map(beadData => createBeadFromData(beadData));
        Promise.all(promises).then((results) => {
            results.forEach((result) => {
                if (result) {
                    scene.add(result);
                    beads.push(result);
                }
            });
            if (typeof updateBeadCount === 'function') {
                updateBeadCount();
            }
            saveState();
            const fitMode = design.stringType === 'pen' ? 'pen-mode' : 'preset';
            if (typeof window.performBasicSmartFraming === 'function') window.performBasicSmartFraming({ mode: fitMode });
            completeImport(design);
        });
    } else {
        saveState();
        const fitMode = design.stringType === 'pen' ? 'pen-mode' : 'preset';
        if (typeof window.performBasicSmartFraming === 'function') window.performBasicSmartFraming({ mode: fitMode });
        completeImport(design);
    }
}

function completeImport(design) {
    // CRITICAL FIX: Initialize slider base with imported string geometry
    // This makes beads interactive immediately without triggering gravity
    if (typeof window.resetSliderBase === 'function') {
        window.resetSliderBase();
    }

    closeSavedModal();
    showSaveSuccess((typeof window.getTranslation === 'function' ? window.getTranslation('design-imported') : null) || 'Design imported!');
}

function clearCurrentDesign() {
    stringPoints.length = 0;
    beads.forEach(bead => {
        scene.remove(bead);
        if (bead.material) bead.material.dispose();
    });
    beads = [];
    if (stringLine) {
        scene.remove(stringLine);
        stringLine = null;
    }
    if (typeof resetStringTracking === 'function') resetStringTracking();
    renderer.render(scene, camera);
}

window.toggleImportMode = toggleImportMode;
window.importDesign = importDesign;
window.startImportProcess = startImportProcess;
window.clearCurrentDesign = clearCurrentDesign;
