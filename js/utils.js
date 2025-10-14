/*
    UTILITY FUNCTIONS
    Helper functions and miscellaneous utilities
*/

function updateBeadCount() {
    document.getElementById('bead-count').textContent = beads.length;
}

function updateSelectionIndicator() {
    const obj = getObjectById(selectedObjectId);
    if (obj && selectedSize) {
        console.log(`Selected: ${obj.name} ${selectedSize}mm`);
    }
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const aspect = container.clientWidth / container.clientHeight;
    camera.left = -10 * aspect;
    camera.right = 10 * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}
