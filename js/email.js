/*
    EMAIL FUNCTIONALITY
    Send designs to email via Google Apps Script
*/

// ============================================
// Google Apps Script Configuration
// ============================================
// IMPORTANT: Replace this with your actual Google Apps Script Web App URL
// Get it from: script.google.com after deploying your script
// It should look like: https://script.google.com/macros/s/ABC...xyz/exec

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3nWmLCReAoEz22tCzmPdpXkYfjB2oW7hCyapdFLI8VQsKkoOZMhS9PLFCk1y1duzp/exec';  // Fresh Email System URL

// ============================================

/**
 * Opens the email modal
 */
function openEmailModal() {
    document.getElementById('email-modal').classList.add('active');
    // Clear previous input
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-notes').value = '';
    
    // Remove any error highlights
    document.getElementById('customer-email').classList.remove('error-highlight');
    document.getElementById('customer-phone').classList.remove('error-highlight');
}

/**
 * Closes the email modal
 */
function closeEmailModal() {
    document.getElementById('email-modal').classList.remove('active');
}

/**
 * Closes modal when clicking backdrop
 */
function closeEmailModalOnBackdrop(event) {
    if (event.target.id === 'email-modal') {
        closeEmailModal();
    }
}

/**
 * Captures the canvas as high-quality base64 image
 * No size restrictions - Google Apps Script supports up to 25MB
 */
function captureDesignImage() {
    const originalBackgroundColor = scene.background.clone();
    scene.background = new THREE.Color(0xffffff);
    renderer.render(scene, camera);
    
    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Get original canvas dimensions
    const originalCanvas = renderer.domElement;
    const originalWidth = originalCanvas.width;
    const originalHeight = originalCanvas.height;
    
    // Use maximum quality - max 2400px, 0.95 quality (no size limits!)
    const maxSize = 2400;
    const quality = 0.95;
    
    let newWidth, newHeight;
    if (originalWidth > originalHeight) {
        newWidth = Math.min(maxSize, originalWidth);
        newHeight = Math.round((originalHeight * newWidth) / originalWidth);
    } else {
        newHeight = Math.min(maxSize, originalHeight);
        newWidth = Math.round((originalWidth * newHeight) / originalHeight);
    }
    
    // Set temp canvas size
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    
    // Draw resized image
    tempCtx.drawImage(originalCanvas, 0, 0, newWidth, newHeight);
    
    // Convert to JPEG with high quality
    const imageData = tempCanvas.toDataURL('image/jpeg', quality);
    
    // Log size for debugging
    const imageSizeKB = (imageData.length * 0.75) / 1024;
    console.log(`Image captured: ${imageSizeKB.toFixed(1)}KB at ${quality} quality`);
    
    // Restore original background
    scene.background = originalBackgroundColor;
    renderer.render(scene, camera);
    
    return imageData;
}

/**
 * Captures complete design data for export
 */
function captureDesignData() {
    const designData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        stringPoints: stringPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
        beads: beads.map(bead => {
            const obj = getObjectById(bead.userData.objectId);
            return {
                objectId: bead.userData.objectId,
                objectName: obj ? obj.name : 'Unknown',
                imagePath: obj ? obj.image : '',
                size: bead.userData.size,
                position: { x: bead.position.x, y: bead.position.y, z: bead.position.z },
                rotation: bead.material.rotation || 0,
                scale: { x: bead.scale.x, y: bead.scale.y },
                stringAngle: bead.userData.stringAngle,
                segmentIndex: bead.userData.segmentIndex,
                t: bead.userData.t
            };
        })
    };
    return designData;
}

/**
 * Generates a standalone HTML file with interactive 3D viewer
 */
function generateDesignHTML() {
    const designData = captureDesignData();
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bead Design Viewer - ${new Date().toLocaleDateString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #f0f0f0;
            overflow-x: hidden;
        }
        #header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #header h1 { font-size: 28px; margin-bottom: 5px; }
        #header p { font-size: 14px; opacity: 0.9; }
        #viewer-container {
            width: 100%;
            height: 70vh;
            background: #fff;
            position: relative;
            border-bottom: 3px solid #667eea;
        }
        #canvas-3d { width: 100%; height: 100%; display: block; }
        #info-panel {
            padding: 20px;
            background: white;
            margin: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number { font-size: 32px; font-weight: bold; }
        .stat-label { font-size: 14px; opacity: 0.9; margin-top: 5px; }
        .button {
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            transition: all 0.3s;
        }
        .button:hover { background: #764ba2; transform: translateY(-2px); }
        .controls {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 15px 0;
        }
        .help-text {
            text-align: center;
            color: #666;
            font-size: 14px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
            margin: 10px 0;
        }
        #data-section {
            max-height: 400px;
            overflow-y: auto;
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div id="header">
        <h1>🎨 Interactive Bead Design Viewer</h1>
        <p>Created: ${new Date(designData.timestamp).toLocaleString()} | ${designData.beads.length} Beads | ${designData.stringPoints.length} String Points</p>
    </div>

    <div id="viewer-container">
        <canvas id="canvas-3d"></canvas>
    </div>

    <div id="info-panel">
        <div class="help-text">
            🖱️ <strong>Controls:</strong> Drag to rotate • Scroll to zoom • Right-click drag to pan<br>
            <small style="opacity: 0.8;">Note: Images load from your GitHub Pages site. If beads appear as colored spheres, update the baseURL in the code below.</small>
        </div>

        <div class="stats">
            <div class="stat-box">
                <div class="stat-number">${designData.beads.length}</div>
                <div class="stat-label">Total Beads</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${designData.stringPoints.length}</div>
                <div class="stat-label">String Points</div>
            </div>
        </div>

        <div class="controls">
            <button class="button" onclick="resetCamera()">🔄 Reset View</button>
            <button class="button" onclick="toggleData()">📋 View Data</button>
            <button class="button" onclick="downloadJSON()">💾 Download JSON</button>
        </div>

        <div id="data-section" style="display: none;">
            <pre>${JSON.stringify(designData, null, 2)}</pre>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    
    <script>
        const designData = ${JSON.stringify(designData)};
        let scene, camera, renderer, controls;

        // Initialize 3D scene
        function init() {
            const container = document.getElementById('canvas-3d');
            
            // Scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            
            // Camera
            camera = new THREE.PerspectiveCamera(
                45,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );
            camera.position.set(0, 5, 10);
            camera.lookAt(0, 0, 0);
            
            // Renderer
            renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            
            // Controls
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 7.5);
            scene.add(directionalLight);
            
            // Grid
            const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
            scene.add(gridHelper);
            
            // Load design
            loadDesign();
            
            // Animation loop
            animate();
            
            // Handle resize
            window.addEventListener('resize', onWindowResize);
        }

        function loadDesign() {
            // Get base URL (for loading images from GitHub Pages)
            // Will use current page's origin, or you can set a fixed GitHub Pages URL
            const baseURL = window.location.origin.includes('github.io') 
                ? window.location.origin + '/' 
                : 'https://sell-rosaries.github.io/rosaries/';
            
            // Draw string
            if (designData.stringPoints && designData.stringPoints.length >= 2) {
                const stringGeometry = new THREE.BufferGeometry();
                const positions = [];
                designData.stringPoints.forEach(p => {
                    positions.push(p.x, p.y, p.z);
                });
                stringGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                const stringMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });
                const stringLine = new THREE.Line(stringGeometry, stringMaterial);
                scene.add(stringLine);
            }
            
            // Draw beads with actual images
            if (designData.beads && designData.beads.length > 0) {
                const textureLoader = new THREE.TextureLoader();
                
                designData.beads.forEach(beadData => {
                    const imageURL = baseURL + beadData.imagePath;
                    
                    textureLoader.load(
                        imageURL,
                        (texture) => {
                            // Success - create sprite with actual image
                            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
                            material.rotation = beadData.rotation || 0;
                            const sprite = new THREE.Sprite(material);
                            sprite.scale.set(beadData.scale.x, beadData.scale.y, 1);
                            sprite.position.set(beadData.position.x, beadData.position.y, beadData.position.z);
                            scene.add(sprite);
                        },
                        undefined,
                        (error) => {
                            // Fallback to colored sphere if image fails to load
                            console.warn('Failed to load image:', imageURL, '- using fallback sphere');
                            const geometry = new THREE.SphereGeometry(beadData.size / 20, 16, 16);
                            const material = new THREE.MeshStandardMaterial({ 
                                color: Math.random() * 0xffffff,
                                roughness: 0.5,
                                metalness: 0.2
                            });
                            const bead = new THREE.Mesh(geometry, material);
                            bead.position.set(beadData.position.x, beadData.position.y, beadData.position.z);
                            bead.rotation.z = beadData.rotation || 0;
                            scene.add(bead);
                        }
                    );
                });
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        function onWindowResize() {
            const container = document.getElementById('canvas-3d');
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }

        function resetCamera() {
            camera.position.set(0, 5, 10);
            camera.lookAt(0, 0, 0);
            controls.reset();
        }

        function toggleData() {
            const dataSection = document.getElementById('data-section');
            dataSection.style.display = dataSection.style.display === 'none' ? 'block' : 'none';
        }

        function downloadJSON() {
            const blob = new Blob([JSON.stringify(designData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bead-design-' + new Date().getTime() + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Start the viewer
        init();
    </script>
</body>
</html>`;
    
    return html;
}

/**
 * Validates email and phone fields
 * Returns {valid: boolean, message: string, fieldsToHighlight: array}
 */
function validateContactInfo(email, phone) {
    // Check if at least one field is filled
    if (!email && !phone) {
        return {
            valid: false,
            message: '⚠️ Please provide either an Email Address or Phone Number.\n\nAt least one contact method is required.',
            fieldsToHighlight: ['customer-email', 'customer-phone']
        };
    }
    
    // If email is provided, validate basic email format (domain-agnostic)
    if (email && email !== 'Not provided') {
        const emailLower = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(emailLower)) {
            return {
                valid: false,
                message: '⚠️ Invalid Email Format\n\nPlease enter a valid email address.',
                fieldsToHighlight: ['customer-email']
            };
        }
    }
    
    return { valid: true, message: '', fieldsToHighlight: [] };
}

/**
 * Calculates object statistics from placed beads
 */
function calculateObjectStatistics() {
    const total = beads.length;
    
    if (total === 0) {
        return {
            total: 0,
            breakdown: '<p style="color: #999;">No objects placed in design</p>'
        };
    }
    
    // Count objects by name and size
    const objectCounts = {};
    const categoryCounts = {};
    
    beads.forEach(bead => {
        if (bead.userData && bead.userData.objectId) {
            const obj = getObjectById(bead.userData.objectId);
            
            if (obj) {
                const size = bead.userData.size;
                const key = `${obj.name} (${size}mm)`;
                
                // Count individual objects
                if (!objectCounts[key]) {
                    objectCounts[key] = {
                        count: 0,
                        categoryId: obj.categoryId
                    };
                }
                objectCounts[key].count++;
                
                // Count by category
                const category = getCategoryById(obj.categoryId);
                const categoryName = category ? category.name : 'Unknown';
                if (!categoryCounts[categoryName]) {
                    categoryCounts[categoryName] = 0;
                }
                categoryCounts[categoryName]++;
            }
        }
    });
    
    // Format breakdown grouped by category with nice formatting
    let breakdown = '<div style="line-height: 1.6;">';
    
    // Group objects by category
    const objectsByCategory = {};
    for (const [objectName, data] of Object.entries(objectCounts)) {
        const category = getCategoryById(data.categoryId);
        const categoryName = category ? category.name : 'Unknown';
        
        if (!objectsByCategory[categoryName]) {
            objectsByCategory[categoryName] = [];
        }
        objectsByCategory[categoryName].push({ name: objectName, count: data.count });
    }
    
    // Display each category with its objects
    for (const [categoryName, count] of Object.entries(categoryCounts)) {
        breakdown += `<p style="margin: 10px 0 5px 0;"><b>${categoryName}:</b> ${count} total</p>`;
        breakdown += '<ul style="margin: 0 0 10px 20px;">';
        
        const items = objectsByCategory[categoryName] || [];
        for (const item of items) {
            breakdown += `<li>${item.name} × ${item.count}</li>`;
        }
        
        breakdown += '</ul>';
    }
    
    breakdown += '</div>';
    
    return {
        total: total,
        breakdown: breakdown
    };
}

/**
 * Sends the design via Google Apps Script
 */
async function sendDesignEmail() {
    // Check if Google Apps Script URL is configured
    if (GOOGLE_SCRIPT_URL === 'YOUR_SCRIPT_URL_HERE') {
        alert('⚠️ Google Apps Script is not configured yet!\n\nPlease update the GOOGLE_SCRIPT_URL in js/email.js with your Web App URL from Google Apps Script.');
        return;
    }
    
    // Get form values
    const customerName = document.getElementById('customer-name').value.trim() || 'Anonymous';
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerNotes = document.getElementById('customer-notes').value.trim() || 'No additional notes';
    
    // Validate contact info
    const validation = validateContactInfo(customerEmail, customerPhone);
    if (!validation.valid) {
        // Highlight error fields
        validation.fieldsToHighlight.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.classList.add('error-highlight');
            setTimeout(() => field.classList.remove('error-highlight'), 3000);
        });
        
        // Shake modal
        const modal = document.querySelector('.email-modal-content');
        modal.classList.add('shake');
        setTimeout(() => modal.classList.remove('shake'), 500);
        
        // Show error message
        alert(validation.message);
        return;
    }
    
    // Calculate object statistics
    const objectStats = calculateObjectStatistics();
    
    // Capture design image (high quality, no size limits!)
    const designImage = captureDesignImage();
    
    // Generate HTML export file
    const designHTML = generateDesignHTML();
    
    // Show loading state
    const sendBtn = document.getElementById('send-email-btn');
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    
    try {
        // Prepare data for FRESH Google Apps Script
        const emailData = {
            name: customerName,
            email: customerEmail || 'Not provided',
            phone: customerPhone || 'Not provided',
            notes: customerNotes + '\n\nDesign Details:\n' + 
                   `Total Objects: ${objectStats.total}\n` +
                   `Breakdown: ${objectStats.breakdown}`,
            design_image: designImage
        };
        
        // Send to Google Apps Script
        console.log('Sending to:', GOOGLE_SCRIPT_URL);
        console.log('Data size:', JSON.stringify(emailData).length, 'bytes');
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain', // Use text/plain to avoid CORS preflight
            },
            body: JSON.stringify(emailData)
        });
        
        console.log('Response status:', response.status);
        
        // Read and parse response
        const resultText = await response.text();
        console.log('Response from Google Apps Script:', resultText);
        
        // Try to parse as JSON
        let resultData;
        try {
            resultData = JSON.parse(resultText);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            throw new Error('Invalid response from server');
        }
        
        // Check if email actually sent
        if (!resultData.success) {
            throw new Error(resultData.message || 'Failed to send email');
        }
        
        // Success!
        alert('✅ Design sent successfully!\n\nYour design has been sent. We will contact you soon!');
        closeEmailModal();
        
    } catch (error) {
        console.error('Email send error:', error);
        alert('❌ Failed to send design.\n\nPlease try again or contact us directly.\n\nError: ' + error.message);
        
    } finally {
        // Restore button
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
    }
}
