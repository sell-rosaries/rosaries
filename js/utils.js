/*
    UTILITY FUNCTIONS
    Helper functions and miscellaneous utilities
*/

function updateBeadCount() {
    document.getElementById('header-bead-count').textContent = beads.length;
}

function updateSelectionIndicator() {
    const obj = getObjectById(selectedObjectId);
    if (obj && selectedSize) {
        
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
