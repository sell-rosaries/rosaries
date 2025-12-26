/*
    MAGIC SHAPE CORRECTION
    Uses Cloudflare Worker Proxy to reach Gemini-3-pro-preview
*/

const PROXY_URL = 'https://magic.sell-rosaries.workers.dev';
let magicLoadingToast = null;

/**
 * Initialize Magic feature
 */
async function initMagic() {
    try {
        // Test ping (Strict) via Proxy
        const pingSuccess = await testGeminiAPI();

        // Enable ONLY if ping succeeded
        isMagicEnabled = pingSuccess;

        // Initial button check
        updateMagicButtonVisibility();
    } catch (error) {
        isMagicEnabled = false;
    }
}

/**
 * Test Gemini API connectivity
 */
async function testGeminiAPI() {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'p' }] }],
                generationConfig: { maxOutputTokens: 1 }
            })
        });

        return response.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Show/Hide Magic button based on state
 */
function updateMagicButtonVisibility() {
    const magicBtn = document.getElementById('magic-btn');
    if (!magicBtn) return;

    const hasBeads = typeof beads !== 'undefined' && beads.length > 0;
    const shouldShow = isMagicEnabled && isStringMode && !isEraseMode && !hasBeads;

    magicBtn.style.display = shouldShow ? 'flex' : 'none';
}

/**
 * Main function to activate shape correction
 */
async function activateMagicCorrection() {
    if (!isMagicEnabled || stringPaths.length === 0) return;

    showMagicLoadingToast();

    try {
        const originalZoom = camera.zoom;
        const originalPos = camera.position.clone();

        const CAPTURE_SIZE = 512;
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = CAPTURE_SIZE;
        offscreenCanvas.height = CAPTURE_SIZE;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        if (typeof calculateDesignBounds === 'function') {
            const bounds = calculateDesignBounds();
            const width = bounds.maxX - bounds.minX;
            const depth = bounds.maxZ - bounds.minZ;
            const size = Math.max(width, depth, 0.1);
            const center = {
                x: (bounds.maxX + bounds.minX) / 2,
                z: (bounds.maxZ + bounds.minZ) / 2
            };

            const padding = 1.2;
            const framedSize = size * padding;

            camera.position.set(center.x, camera.position.y, center.z);
            camera.zoom = 20 / framedSize;
            camera.updateProjectionMatrix();
        }

        const originalBg = scene.background;
        scene.background = new THREE.Color(0xffffff);
        renderer.render(scene, camera);

        offscreenCtx.fillStyle = '#ffffff';
        offscreenCtx.fillRect(0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
        offscreenCtx.drawImage(renderer.domElement, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
        const imageData = offscreenCanvas.toDataURL('image/jpeg', 0.5).split(',')[1];

        scene.background = originalBg;
        camera.zoom = originalZoom;
        camera.position.copy(originalPos);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        const MAX_TOTAL_POINTS = 50;
        const totalPointsInDesign = stringPaths.reduce((acc, path) => acc + path.length, 0);
        const ratio = Math.min(1, MAX_TOTAL_POINTS / totalPointsInDesign);

        const pathsData = stringPaths.map(path => {
            const step = Math.max(1, Math.round(1 / ratio));
            const downsampled = [];
            for (let i = 0; i < path.length; i += step) {
                downsampled.push({ x: parseFloat(path[i].x.toFixed(1)), z: parseFloat(path[i].z.toFixed(1)) });
            }
            if (path.length > 1 && (path.length - 1) % step !== 0) {
                const last = path[path.length - 1];
                downsampled.push({ x: parseFloat(last.x.toFixed(1)), z: parseFloat(last.z.toFixed(1)) });
            }
            return downsampled;
        });

        const prompt = window.AI_CONFIG.MAGIC_PROMPT.replace('{POINTS_DATA}', JSON.stringify(pathsData));

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'image/jpeg', data: imageData } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json',
                    thinkingConfig: { thinking_level: 'low' }
                }
            })
        });

        if (!response.ok) throw new Error('API Request Failed');

        const result = await response.json();

        try {
            if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
                throw new Error('AI failed to generate a response');
            }

            const parts = result.candidates[0].content.parts;
            let rawText = parts.filter(p => p.text && !p.thought).map(p => p.text).join('');

            const firstOpen = rawText.indexOf('{');
            const lastClose = rawText.lastIndexOf('}');
            if (firstOpen === -1 || lastClose === -1) throw new Error('No JSON found');
            rawText = rawText.substring(firstOpen, lastClose + 1);

            const content = JSON.parse(rawText);

            if (content.confidence >= 0.6 && content.paths && Array.isArray(content.paths) && content.paths.length > 0) {
                const newPaths = [];
                for (const path of content.paths) {
                    if (!Array.isArray(path)) continue;
                    const validPoints = path
                        .map(p => {
                            const x = parseFloat(p.x);
                            const z = parseFloat(p.z);
                            return (isNaN(x) || isNaN(z)) ? null : new THREE.Vector3(x, 0, z);
                        })
                        .filter(p => p !== null);

                    if (validPoints.length > 1) newPaths.push(validPoints);
                }

                if (newPaths.length > 0) {
                    const DENSITY = 0.05;
                    const resampledPaths = newPaths.map(path => {
                        const resampled = [path[0]];
                        for (let i = 0; i < path.length - 1; i++) {
                            const p1 = path[i];
                            const p2 = path[i + 1];
                            const dist = p1.distanceTo(p2);
                            if (dist > DENSITY) {
                                const steps = Math.floor(dist / DENSITY);
                                for (let s = 1; s <= steps; s++) {
                                    const t = s / (steps + 1);
                                    resampled.push(new THREE.Vector3().lerpVectors(p1, p2, t));
                                }
                            }
                            resampled.push(p2);
                        }
                        return resampled;
                    });

                    stringPaths = resampledPaths;
                    updateStringLine();
                    saveState();
                }
            } else {
                showCustomAlert(window.getTranslation('magic-low-confidence'), 'info');
            }
        } catch (parseError) {
            // Error handled silently for polish
        }

    } catch (error) {
        // Error handled silently for polish
    } finally {
        hideMagicLoadingToast();
    }
}

function showMagicLoadingToast() {
    if (magicLoadingToast) return;
    magicLoadingToast = document.createElement('div');
    magicLoadingToast.id = 'magic-loading-toast';
    const message = window.getTranslation('magic-perfecting');
    magicLoadingToast.innerHTML = `<div class="toast-content"><span class="magic-sparkle">✨</span><span class="toast-text">${message}</span><div class="toast-loader"></div></div>`;
    document.body.appendChild(magicLoadingToast);
}

function hideMagicLoadingToast() {
    if (magicLoadingToast) {
        magicLoadingToast.classList.add('fade-out');
        setTimeout(() => {
            if (magicLoadingToast && magicLoadingToast.parentNode) {
                magicLoadingToast.parentNode.removeChild(magicLoadingToast);
            }
            magicLoadingToast = null;
        }, 500);
    }
}

window.initMagic = initMagic;
window.activateMagicCorrection = activateMagicCorrection;
window.updateMagicButtonVisibility = updateMagicButtonVisibility;