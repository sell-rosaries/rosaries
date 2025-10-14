/*
    ROTATION CONTROLS
    Rotation slider for beads
*/

function showRotationSlider(bead) {
    selectedBeadForRotation = bead;
    const slider = document.getElementById('rotation-slider');
    const container = document.getElementById('rotation-slider-container');
    const valueDisplay = document.querySelector('.rotation-value');
    
    const currentRotation = bead.userData.rotation || 0;
    slider.value = currentRotation;
    valueDisplay.textContent = currentRotation + '°';
    
    container.style.display = 'flex';
}

function hideRotationSlider() {
    if (selectedBeadForRotation) {
        saveState();
    }
    document.getElementById('rotation-slider-container').style.display = 'none';
    selectedBeadForRotation = null;
}

function onRotationSliderChange(event) {
    if (!selectedBeadForRotation) return;
    
    const degrees = parseInt(event.target.value);
    const radians = (degrees * Math.PI) / 180;
    
    const originalRotation = selectedBeadForRotation.material.rotation;
    
    selectedBeadForRotation.material.rotation = radians;
    selectedBeadForRotation.userData.rotation = degrees;
    
    if (checkBeadCollision(selectedBeadForRotation, [selectedBeadForRotation])) {
        selectedBeadForRotation.material.rotation = originalRotation;
        selectedBeadForRotation.userData.rotation = Math.round((originalRotation * 180) / Math.PI);
        event.target.value = selectedBeadForRotation.userData.rotation;
        document.querySelector('.rotation-value').textContent = selectedBeadForRotation.userData.rotation + '°';
        return;
    }
    
    document.querySelector('.rotation-value').textContent = degrees + '°';
}

function onDocumentClick(event) {
    const sliderContainer = document.getElementById('rotation-slider-container');
    const canvas = renderer.domElement;
    
    if (!sliderContainer.contains(event.target) && !canvas.contains(event.target)) {
        hideRotationSlider();
    }
}
