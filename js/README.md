# JavaScript Module Structure

The application is split into 13 organized modules for easier maintenance and debugging.

## Module Loading Order

Scripts must load in this specific order (defined in `index.html`):

1. **globals.js** - Global variables (must be first)
2. **config.js** - Inventory loading from GitHub
3. **scene.js** - Three.js scene setup
4. **string.js** - String path functions
5. **beads.js** - Bead creation and collision detection
6. **history.js** - Undo/redo system
7. **rotation.js** - Rotation slider controls
8. **tools.js** - Tool selection (string tool)
9. **reset.js** - Reset menu and delete modes
10. **email.js** - Email functionality via EmailJS
11. **ui.js** - Sidebar and UI creation
12. **interactions.js** - Mouse and touch events
13. **utils.js** - Helper utilities
14. **main.js** - Initialization (must be last)

## Quick Reference

### Finding Specific Features:

- **Collision detection issues?** → `beads.js` (lines with `checkRotatedRectCollision`, `SAT`)
- **String drawing problems?** → `string.js` (lines with `findClosestPointOnString`)
- **Rotation not working?** → `rotation.js` (lines with `onRotationSliderChange`)
- **Mouse/touch bugs?** → `interactions.js` (lines with `onCanvasMouseDown/Move/Up`)
- **Undo/redo issues?** → `history.js` (lines with `saveState`, `restoreState`)
- **UI not updating?** → `ui.js` (lines with `createBeadSelection`)
- **Loading inventory fails?** → `config.js` (lines with `loadConfig`)
- **3D rendering problems?** → `scene.js` (lines with `init3DScene`)
- **Reset/delete issues?** → `reset.js` (lines with `deleteIndividualBead`, `resetAll`)
- **Email not sending?** → `email.js` (check EmailJS credentials, lines 11-13)

## Key Functions by Module

### globals.js
- All shared variables (scene, camera, beads, categories, etc.)

### config.js
- `loadConfig()` - Loads inventory from GitHub
- `getCategoryById(id)` - Get category by ID
- `getObjectById(id)` - Get object by ID
- `getObjectsByCategory(categoryId)` - Filter objects

### scene.js
- `init3DScene()` - Sets up Three.js scene
- `animate()` - Render loop

### string.js
- `findClosestPointOnString(clickPoint)` - Snap to string
- `updateStringLine()` - Render string path

### beads.js
- `createBead(obj, size, callback)` - Create bead sprite
- `placeBead()` - Place bead on string
- `checkBeadCollision(newBead, ignoreBeads)` - Collision detection
- `checkRotatedRectCollision()` - SAT collision algorithm
- `getRotatedRectCorners()` - Get rectangle corners
- `projectOntoAxis()` - SAT projection

### history.js
- `captureState()` - Save current state
- `saveState()` - Add to history
- `restoreState(state)` - Restore state
- `undo()` - Undo last action
- `redo()` - Redo action

### rotation.js
- `showRotationSlider(bead)` - Show rotation UI
- `hideRotationSlider()` - Hide rotation UI
- `onRotationSliderChange(event)` - Handle rotation with collision check

### tools.js
- `selectStringTool(event)` - Activate string drawing mode

### email.js
- `openEmailModal()` - Show email form
- `closeEmailModal()` - Hide email form
- `sendDesignEmail()` - Send design + customer info via EmailJS
- `captureDesignImage()` - Capture canvas as base64 image

### reset.js
- `openResetMenu()` - Show reset menu
- `resetAll()` - Delete everything
- `deleteAllObjects()` - Delete all beads (keep string)
- `enterDeleteMode()` - Individual delete mode
- `exitDeleteMode()` - Exit delete mode
- `deleteIndividualBead(bead)` - Delete specific bead

### ui.js
- `createBeadSelection()` - Build sidebar UI
- `createCategoryTabs(container)` - Create category filters
- `filterByCategory(categoryId)` - Filter objects by category
- `selectObjectSize(objectId, size)` - Select object for placement
- `createToolCard()` - Create tool button

### interactions.js
- `onCanvasMouseDown(event)` - Mouse/touch start
- `onCanvasMouseMove(event)` - Mouse/touch drag
- `onCanvasMouseUp(event)` - Mouse/touch end
- `getNormalizedCoords(event)` - Convert to canvas coords

### utils.js
- `updateBeadCount()` - Update bead counter
- `updateSelectionIndicator()` - Log selected object info
- `onWindowResize()` - Handle window resize

### main.js
- `main()` - Application initialization
- `addEventListeners()` - Set up all event handlers

## Benefits of This Structure

1. **Easy debugging**: Know exactly which file to open for specific issues
2. **Faster loading**: Browser can cache individual modules
3. **Better organization**: Related functions grouped together
4. **Easier collaboration**: Multiple developers can work on different modules
5. **Cleaner git diffs**: Changes are isolated to specific modules
