/*
    CONFIGURATION & DATA MANAGEMENT
    Loading inventory from GitHub
*/

/**
 * Loads inventory automatically from Jularies folder structure.
 */
async function loadConfig() {


    try {
        const url = 'inventory-index.json?t=' + Date.now();


        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const index = await response.json();


        categories = [];
        objects = [];

        for (const cat of index.categories) {
            const categoryId = `cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`;

            categories.push({
                id: categoryId,
                name: cat.name,
                createdAt: new Date().toISOString()
            });



            for (const filename of cat.objects) {
                // Try to parse filename with sizes (e.g., "gem_2,4,6.png")
                const matchWithSizes = filename.match(/^(.+?)_([0-9,]+)\.(png|jpg|jpeg|webp|gif)$/i);

                let objectName, sizes;

                if (matchWithSizes) {
                    // Has sizes in filename
                    objectName = matchWithSizes[1].replace(/_/g, ' ').trim();
                } else {
                    // No sizes - just extract name without extension
                    const matchNoSizes = filename.match(/^(.+)\.(png|jpg|jpeg|webp|gif)$/i);
                    if (!matchNoSizes) {
                        console.warn(`⚠️ Skipping invalid filename: ${filename}`);
                        continue;
                    }
                    objectName = matchNoSizes[1].replace(/_/g, ' ').trim();
                }

                // All beads get standard sizes 4, 6, 8, 10, 12, 14
                sizes = [4, 6, 8, 10, 12, 14];

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


            }
        }



    } catch (error) {
        console.error("❌ Error loading inventory:", error);


        try {
            const response = await fetch('beads-config.json?t=' + Date.now());
            const data = await response.json();
            categories = data.categories || [];
            objects = data.objects || [];

        } catch (e) {
            console.error("❌ Fallback also failed:", e);
            categories = [];
            objects = [];
            // Alert removed - handled by sync UI in APK, not needed for website
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
