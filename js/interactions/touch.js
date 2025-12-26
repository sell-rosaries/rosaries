/*
    TOUCH INTERACTIONS MODULE
    Handles touch input events (delegates to mouse handlers)
*/

/**
 * Touch start event handler
 */
function onCanvasTouchStart(event) {
    event.preventDefault();
    onCanvasMouseDown(event);
}

/**
 * Touch move event handler
 */
function onCanvasTouchMove(event) {
    event.preventDefault();
    onCanvasMouseMove(event);
}

/**
 * Touch end event handler
 */
function onCanvasTouchEnd(event) {
    onCanvasMouseUp(event);
}