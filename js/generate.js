/*
    GENERATE FEATURE
    Creates string paths from text inputs (Letters, Numbers, Shapes)
    Uses Canvas API for built-ins and Gemini API for complex prompts.
*/

function initGenerate() {
    updateGenerateButtonVisibility();

    document.getElementById('generate-btn')?.addEventListener('click', openGenerateModal);
    document.getElementById('generate-form')?.addEventListener('submit', handleGenerateSubmit);

    // Info toggle logic
    document.getElementById('generate-info-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mainView = document.getElementById('generate-main-view');
        const infoView = document.getElementById('generate-info-view');
        if (mainView && infoView) {
            mainView.style.display = 'none';
            infoView.style.display = 'block';
            
            // Hide AI mentions if API is offline
            const isApiActive = typeof isMagicEnabled !== 'undefined' && isMagicEnabled;
            const aiMentions = infoView.querySelectorAll('.generate-ai-mention');
            aiMentions.forEach(el => el.style.display = isApiActive ? 'block' : 'none');
        }
    });

    document.getElementById('generate-back-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mainView = document.getElementById('generate-main-view');
        const infoView = document.getElementById('generate-info-view');
        if (mainView && infoView) {
            mainView.style.display = 'block';
            infoView.style.display = 'none';
        }
    });

    // Add close handlers
    window.closeGenerateModal = function () {
        const modal = document.getElementById('generate-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    };
}

function updateGenerateButtonVisibility() {
    const btn = document.getElementById('generate-btn');
    if (!btn) return;

    // Always show in string mode, regardless of API status
    const hasBeads = typeof beads !== 'undefined' && beads.length > 0;
    const shouldShow = isStringMode && !isEraseMode && !hasBeads;

    btn.style.display = shouldShow ? 'flex' : 'none';
}

function openGenerateModal() {
    const modal = document.getElementById('generate-modal');
    if (!modal) return;

    // Reset views
    const mainView = document.getElementById('generate-main-view');
    const infoView = document.getElementById('generate-info-view');
    if (mainView && infoView) {
        mainView.style.display = 'block';
        infoView.style.display = 'none';
    }

    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('active');

    const inputText = document.getElementById('generate-input-text');
    const inputShapes = document.getElementById('generate-input-shapes');
    if (inputText) inputText.value = '';
    if (inputShapes) inputShapes.value = '';
}

async function handleGenerateSubmit(e) {
    e.preventDefault();
    const textInput = document.getElementById('generate-input-text').value.trim();
    const shapeInput = document.getElementById('generate-input-shapes').value.trim();
    
    if (!textInput && !shapeInput) return;

    closeGenerateModal();

    try {
        let paths = null;

        // 1. Prioritize Word/Letters (Always Offline)
        if (textInput) {
            paths = generateTextPaths(textInput);
        } 
        // 2. Shapes/Concepts Field
        else if (shapeInput) {
            const lowerShape = shapeInput.toLowerCase();
            
            // Check for Built-in Geometrics first (Always Offline)
            if (lowerShape === 'circle') paths = [generatePolygon(64)];
            else if (lowerShape === 'triangle') paths = [generatePolygon(3)];
            else if (lowerShape === 'square') paths = [generatePolygon(4)];
            else if (lowerShape === 'pentagon') paths = [generatePolygon(5)];
            else if (lowerShape === 'hexagon') paths = [generatePolygon(6)];
            else if (lowerShape === 'octagon') paths = [generatePolygon(8)];
            else if (lowerShape === 'diamond') paths = [generateDiamond()];
            else if (lowerShape === 'star') paths = [generateStar(5)];
            else if (lowerShape === 'heart') paths = [generateHeart()];
            else if (lowerShape === 'cross' || lowerShape === 'plus') paths = [generateCross()];
            else if (lowerShape === 'crescent' || lowerShape === 'moon') paths = [generateCrescent()];
            
            // AI Fallback or Error
            if (!paths) {
                const isApiActive = typeof isMagicEnabled !== 'undefined' && isMagicEnabled;
                if (isApiActive) {
                    await generateWithAI(shapeInput);
                    return; // AI function handles applyGeneratedPaths
                } else {
                    showCustomAlert(window.getTranslation('generate-offline-only'), 'info');
                    return;
                }
            }
        }

        if (paths && paths.length > 0) {
            // Flip Z for offline paths to counteract the flip in applyGeneratedPaths
            paths.forEach(path => path.forEach(p => p.z = -p.z));
            applyGeneratedPaths(paths);
        }
    } catch (err) {
        showCustomAlert(window.getTranslation('generate-failed'), 'error');
    }
}

/**
 * Applies multiple paths to the scene
 */
function applyGeneratedPaths(paths) {
    if (!paths || paths.length === 0) return;

    const allPoints = paths.flat();
    const box = new THREE.Box3().setFromPoints(allPoints);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.z) || 1;
    const TARGET_SIZE = 12;
    const scale = TARGET_SIZE / maxDim;

    const transformedPaths = paths.map(path => {
        return path.map(p => {
            const transformed = p.clone().sub(center).multiplyScalar(scale);
            transformed.z = -transformed.z; // FLIP Z: Corrects upside-down orientation in this app's context
            return transformed;
        });
    });

    stringPaths = transformedPaths;
    updateStringLine();
    saveState();

    if (camera && controls) {
        controls.target.set(0, 0, 0);
        camera.position.set(0, 40, 0);
        camera.zoom = 1;
        camera.updateProjectionMatrix();
        controls.update();
    }
}

// --- GEOMETRIC GENERATORS ---

function generatePolygon(sides, radius = 1) {
    const points = [];
    for (let i = 0; i <= sides; i++) {
        const theta = (i / sides) * Math.PI * 2 - (Math.PI / 2);
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return points;
}

function generateDiamond() {
    return [
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0.7, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(-0.7, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ];
}

function generateStar(pts = 5) {
    const vertices = [];
    const outer = 1, inner = 0.4, total = pts * 2;
    for (let i = 0; i <= total; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i / total) * Math.PI * 2 - (Math.PI / 2);
        vertices.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return vertices;
}

function generateHeart() {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const z = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push(new THREE.Vector3(x / 16, 0, z / 16));
    }
    return pts;
}

function generateCross() {
    const s = 0.3, l = 1.0;
    return [
        new THREE.Vector3(-s, 0, -l), new THREE.Vector3(s, 0, -l), new THREE.Vector3(s, 0, -s),
        new THREE.Vector3(l, 0, -s), new THREE.Vector3(l, 0, s), new THREE.Vector3(s, 0, s),
        new THREE.Vector3(s, 0, l), new THREE.Vector3(-s, 0, l), new THREE.Vector3(-s, 0, s),
        new THREE.Vector3(-l, 0, s), new THREE.Vector3(-l, 0, -s), new THREE.Vector3(-s, 0, -s),
        new THREE.Vector3(-s, 0, -l)
    ];
}

function generateCrescent() {
    const points = [];
    // Outer arc
    for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 1.5 - (Math.PI * 0.75);
        points.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    // Inner arc
    for (let i = 32; i >= 0; i--) {
        const a = (i / 32) * Math.PI * 1.5 - (Math.PI * 0.75);
        points.push(new THREE.Vector3(Math.cos(a) * 0.7 + 0.3, 0, Math.sin(a) * 0.7));
    }
    return points;
}

// --- ROBUST TEXT GENERATOR (Multiple Paths) ---

function generateTextPaths(text) {
    const W = 512, H = 256;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white';
    const fontSize = text.length > 6 ? 80 : 140;
    ctx.font = `bold ${fontSize}px "Inter", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2);

    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;
    const visited = new Uint8Array(W * H);
    const paths = [];

    for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
            const idx = y * W + x;
            if (data[idx * 4] > 128 && !visited[idx]) {
                const path = traceOuterContour(data, W, H, x, y, visited);
                if (path && path.length > 5) {
                    paths.push(path);
                }
            }
        }
    }
    return paths;
}

function traceOuterContour(data, w, h, startX, startY, visitedGlobal) {
    const points = [];
    let x = startX, y = startY;
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, 1, 1, 1, 0, -1, -1, -1];
    let dir = 0;
    let iterations = 0;
    const MAX_ITER = 2000;

    while (iterations < MAX_ITER) {
        iterations++;
        points.push(new THREE.Vector3((x - w/2) / w, 0, (y - h/2) / h));
        visitedGlobal[y * w + x] = 1;

        let foundNext = false;
        for (let i = 0; i < 8; i++) {
            const nextDir = (dir + i + 5) % 8;
            const nx = x + dx[nextDir];
            const ny = y + dy[nextDir];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (data[(ny * w + nx) * 4] > 128) {
                    x = nx; y = ny; dir = nextDir; foundNext = true;
                    break;
                }
            }
        }
        if (!foundNext) break;
        if (x === startX && y === startY && points.length > 2) break;
    }
    if (points.length > 0) points.push(points[0].clone());
    const smoothed = [];
    for (let i = 0; i < points.length; i += 2) smoothed.push(points[i]);
    return smoothed;
}

// --- AI GENERATION ---

async function generateWithAI(promptText) {
    const PROXY_URL = 'https://magic.sell-rosaries.workers.dev';

    const toast = document.createElement('div');
    toast.id = 'magic-loading-toast';
    const msg = window.getTranslation('generate-creating').replace('{word}', promptText);
    toast.innerHTML = `
        <div class="toast-content">
            <span class="magic-sparkle">✨</span>
            <span class="toast-text">${msg}</span>
            <div class="toast-loader"></div>
        </div>
    `;
    document.body.appendChild(toast);

    try {
        const fullPrompt = window.AI_CONFIG.GENERATE_PROMPT.replace(/{PROMPT_TEXT}/g, promptText);

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 }
            })
        });

        if (!response.ok) throw new Error('API Error');
        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        const json = JSON.parse(text.substring(firstOpen, lastClose + 1));

        if (json.paths && json.paths.length > 0) {
            const paths = json.paths.map(path => 
                path.map(p => new THREE.Vector3(p.x, 0, p.z))
            );
            applyGeneratedPaths(paths);
        }
    } catch (err) {
        showCustomAlert(window.getTranslation('generate-ai-failed'), 'error');
    } finally {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }
}

window.initGenerate = initGenerate;
window.updateGenerateButtonVisibility = updateGenerateButtonVisibility;