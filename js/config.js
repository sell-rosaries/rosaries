/*
    CONFIGURATION & DATA MANAGEMENT
    Loading inventory from GitHub
*/

/**
 * Loads inventory automatically from Jularies folder structure.
 */
async function loadConfig() {
    console.log('🔍 Loading inventory...');
    
    try {
        const response = await fetch('inventory-index.json?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const index = await response.json();
        console.log('✓ Loaded index:', index);
        
        categories = [];
        objects = [];
        
        for (const cat of index.categories) {
            const categoryId = `cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`;
            
            categories.push({
                id: categoryId,
                name: cat.name,
                createdAt: new Date().toISOString()
            });
            
            console.log(`📂 Category: ${cat.name} (${cat.objects.length} objects)`);
            
            for (const filename of cat.objects) {
                const match = filename.match(/^(.+?)_(.+)\.(png|jpg|jpeg|webp|gif)$/i);
                
                if (!match) {
                    console.warn(`⚠️ Skipping invalid filename: ${filename}`);
                    continue;
                }
                
                const objectName = match[1].replace(/_/g, ' ').trim();
                const sizesStr = match[2];
                const sizes = sizesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                
                if (sizes.length === 0) {
                    console.warn(`⚠️ No valid sizes for: ${filename}`);
                    continue;
                }
                
                const imagePath = `${cat.path}${filename}`;
                const objectId = `obj-${cat.name.toLowerCase()}-${objectName.toLowerCase().replace(/\s+/g, '-')}`;
                
                objects.push({
                    id: objectId,
                    name: objectName,
                    categoryId: categoryId,
                    thumbnail: imagePath,
                    image: imagePath,
                    sizes: sizes,
                    createdAt: new Date().toISOString()
                });
                
                console.log(`  ✓ ${objectName} (${sizes.join(', ')}mm) → ${imagePath}`);
            }
        }
        
        console.log(`✅ Loaded ${categories.length} categories, ${objects.length} objects`);
        
    } catch (error) {
        console.error("❌ Error loading inventory:", error);
        console.log('Trying fallback to beads-config.json...');
        
        try {
            const response = await fetch('beads-config.json?t=' + Date.now());
            const data = await response.json();
            categories = data.categories || [];
            objects = data.objects || [];
            console.log('✓ Loaded from beads-config.json:', categories.length, 'categories,', objects.length, 'objects');
        } catch (e) {
            console.error("❌ Fallback also failed:", e);
            categories = [];
            objects = [];
            alert('Could not load inventory!\n\nIf opening HTML directly, you need to:\n1. Run a local server, OR\n2. Upload to GitHub Pages\n\nBrowser blocks file:// access to JSON files for security.');
        }
    }
}

function getCategoryById(id) {
    return categories.find(c => c.id === id);
}

function getObjectById(id) {
    return objects.find(o => o.id === id);
}

function getObjectsByCategory(categoryId) {
    if (categoryId === 'all') return objects;
    return objects.filter(o => o.categoryId === categoryId);
}
