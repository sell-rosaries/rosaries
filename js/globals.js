/*
    GLOBAL VARIABLES
    All shared variables used across modules
*/

// Three.js scene objects
let scene, camera, renderer, controls;
let raycaster, mouse, plane;

// Data arrays
let beads = [];
let categories = [];
let objects = [];

// State variables
let selectedObjectId = null;
let selectedSize = null;
let currentCategoryFilter = 'all';
let draggedBead = null;
let isDragging = false;
let isDrawingString = false;
let stringPoints = [];
let stringLine = null;
let isStringMode = false;
let isSelectMode = false;
let draggedBeadPreviousPosition = null;
let selectedBeadForRotation = null;
let mouseDownPosition = null;
let hasDragged = false;
let isDeleteMode = false;
let deleteMarkers = [];

// History for undo/redo
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 10;

// Size preferences - stores user's selected size for each bead image
let beadSizePreferences = {};
let pendingSizeSelectionObjectId = null;
