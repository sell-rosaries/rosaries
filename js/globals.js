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
let stringPoints = []; // The currently active string being drawn/edited
let stringPaths = [];  // Array of all string paths (Array<Array<Vector3>>)
let stringLine = null; // The currently active line mesh
let stringMeshes = []; // Array of all line meshes
let isStringMode = false;
let isEraseMode = false;
let isSelectMode = false;
let draggedBeadPreviousPosition = null;
let selectedBeadForRotation = null;
let mouseDownPosition = null;
let hasDragged = false;
let isDeleteMode = false;
let deleteMarkers = [];

// Touch gesture tracking for delete mode
let touchGestureActive = false;
let touchCount = 0;
let twoFingerGestureTimestamp = 0;

// History for undo/redo
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 10;

// Size preferences - stores user's selected size for each bead image
let beadSizePreferences = {};
// Magic Correction
let isMagicEnabled = false;
let pendingSizeSelectionObjectId = null;
