/*
    TOOL SELECTION
    String tool (select mode is now automatic)
*/

function selectStringTool(event) {
    isStringMode = true;
    isSelectMode = false;
    controls.enabled = false;
    selectedObjectId = null;
    selectedSize = null;
    updateToolSelectionUI(event.currentTarget);
    hideRotationSlider();
}
