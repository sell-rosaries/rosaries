/*
    ROTATION CONTROLS
    Circular dial for rotating beads
*/

let isDraggingRotation = false;
let rotationDialCenter = { x: 0, y: 0 };

function showRotationControl(bead) {
    selectedBeadForRotation = bead;
    const container = document.getElementById('rotation-control');
    const handle = document.getElementById('rotation-handle');
    const valueDisplay = document.getElementById('rotation-value');
    
    const currentRotation = bead.userData.rotation || 0;
    valueDisplay.textContent = currentRotation + '°';
    
    // Position the handle based on rotation
    updateRotationHandlePosition(currentRotation);
    
    container.style.display = 'flex';
    
    // Add rotation handle event listeners
    handle.addEventListener('mousedown', startRotationDrag);
    handle.addEventListener('touchstart', startRotationDrag, { passive: false });
}

function hideRotationControl() {
    if (selectedBeadForRotation) {
        saveState();
    }
    document.getElementById('rotation-control').style.display = 'none';
    selectedBeadForRotation = null;
    isDraggingRotation = false;
}

function startRotationDrag(event) {
    event.preventDefault();
    event.stopPropagation();
    isDraggingRotation = true;
    
    // Calculate dial center
    const dial = document.querySelector('.rotation-dial');
    const rect = dial.getBoundingClientRect();
    rotationDialCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    
    document.addEventListener('mousemove', handleRotationDrag);
    document.addEventListener('touchmove', handleRotationDrag, { passive: false });
    document.addEventListener('mouseup', stopRotationDrag);
    document.addEventListener('touchend', stopRotationDrag);
}

function handleRotationDrag(event) {
    if (!isDraggingRotation || !selectedBeadForRotation) return;
    
    event.preventDefault();
    
    const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;
    
    // Calculate angle from dial center
    const dx = clientX - rotationDialCenter.x;
    const dy = clientY - rotationDialCenter.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Convert to 0-360 range and adjust for top being 0°
    angle = (angle + 90 + 360) % 360;
    const degrees = Math.round(angle);
    
    // Apply rotation
    const radians = (degrees * Math.PI) / 180;
    const originalRotation = selectedBeadForRotation.material.rotation;
    
    selectedBeadForRotation.material.rotation = radians;
    selectedBeadForRotation.userData.rotation = degrees;
    
    // Check for collisions
    if (checkBeadCollision && checkBeadCollision(selectedBeadForRotation, [selectedBeadForRotation])) {
        selectedBeadForRotation.material.rotation = originalRotation;
        selectedBeadForRotation.userData.rotation = Math.round((originalRotation * 180) / Math.PI);
    }
    
    // Update UI
    const currentDegrees = selectedBeadForRotation.userData.rotation;
    document.getElementById('rotation-value').textContent = currentDegrees + '°';
    updateRotationHandlePosition(currentDegrees);
}

function stopRotationDrag() {
    isDraggingRotation = false;
    document.removeEventListener('mousemove', handleRotationDrag);
    document.removeEventListener('touchmove', handleRotationDrag);
    document.removeEventListener('mouseup', stopRotationDrag);
    document.removeEventListener('touchend', stopRotationDrag);
    
    if (selectedBeadForRotation) {
        saveState();
    }
}

function updateRotationHandlePosition(degrees) {
    const handle = document.getElementById('rotation-handle');
    const dial = document.querySelector('.rotation-dial');
    if (!handle || !dial) return;
    
    const radius = 60 - 8 - 6; // dial radius - padding - handle radius
    const radians = ((degrees - 90) * Math.PI) / 180; // -90 to start at top
    
    const x = 60 + radius * Math.cos(radians) - 6; // 60 = dial center, 6 = handle radius
    const y = 60 + radius * Math.sin(radians) - 6;
    
    handle.style.left = x + 'px';
    handle.style.top = y + 'px';
}

function onDocumentClick(event) {
    const rotationControl = document.getElementById('rotation-control');
    const canvas = renderer.domElement;
    
    if (rotationControl && !rotationControl.contains(event.target) && !canvas.contains(event.target)) {
        hideRotationControl();
    }
}

// Legacy function names for compatibility
function showRotationSlider(bead) {
    showRotationControl(bead);
}

function hideRotationSlider() {
    hideRotationControl();
}
