/*
    CUSTOM SIZE MODULE
    Mobile-style volume slider with fit button attachment
    Located on middle left side of screen
*/

/**
 * Initialize the custom size interface
 */
function initCustomSize() {
    console.log('🎛️ Initializing custom size control...');
    
    // Add the custom size control HTML to the page
    addCustomSizeHTML();
    
    // Style the custom size control
    addCustomSizeStyles();
    
    // Add event listeners for the fit button (placeholder for now)
    setupCustomSizeEvents();
    
    console.log('✅ Custom size control initialized');
}

/**
 * Add custom size control HTML structure
 */
function addCustomSizeHTML() {
    const customSizeHTML = `
        <div id="custom-size-control" class="custom-size-container">
            <div class="custom-size-control">
                <div class="size-slider-tube">
                    <div class="size-slider-track"></div>
                    <div class="size-slider-liquid" style="height: 30%;"></div>
                    <div class="size-slider-level-indicator" style="bottom: 30%;"></div>
                </div>
                <button id="fit-button" class="fit-button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="2" width="20" height="20" rx="2"/>
                        <path d="M8 2v4M16 2v4M8 18v4M16 18v4M2 8h4M2 16h4M18 8h4M18 16h4"/>
                    </svg>
                    <span class="fit-button-text">FIT</span>
                </button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', customSizeHTML);
}

/**
 * Add custom size control styles
 */
function addCustomSizeStyles() {
    const style = document.createElement('style');
    style.id = 'custom-size-styles';
    style.textContent = `
        .custom-size-container {
            position: fixed;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 150;
            pointer-events: none;
        }

        .custom-size-control {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-3);
            pointer-events: all;
        }

        .size-slider-tube {
            position: relative;
            width: 12px;
            height: 180px;
            background: var(--glass-light);
            backdrop-filter: var(--backdrop-light);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-full);
            box-shadow: var(--shadow-glass);
            cursor: pointer;
            overflow: hidden;
        }

        .size-slider-track {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: var(--radius-full);
        }

        .size-slider-liquid {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(180deg, var(--primary-500) 0%, var(--primary-600) 100%);
            border-radius: var(--radius-full);
            transition: height var(--duration-smooth) var(--easing-smooth);
            box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);
        }

        .size-slider-liquid::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%);
            border-radius: var(--radius-full) var(--radius-full) 0 0;
        }

        .size-slider-level-indicator {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 2px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 1px;
            pointer-events: none;
            transition: bottom var(--duration-smooth) var(--easing-smooth);
            box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
        }

        .fit-button {
            width: 40px;
            height: 40px;
            background: var(--glass-light);
            backdrop-filter: var(--backdrop-light);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-full);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            cursor: pointer;
            color: var(--neutral-600);
            transition: all var(--duration-fast) var(--easing-smooth);
            box-shadow: var(--shadow-md);
            text-decoration: none;
            font-size: 10px;
            font-weight: var(--font-weight-semibold);
        }

        .fit-button:hover {
            background: var(--glass-medium);
            color: var(--primary-600);
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }

        .fit-button:active {
            transform: translateY(0) scale(0.95);
            box-shadow: var(--shadow-md);
        }

        .fit-button svg {
            width: 16px;
            height: 16px;
        }

        .fit-button-text {
            font-size: 8px;
            font-weight: var(--font-weight-bold);
            letter-spacing: 0.5px;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .custom-size-container {
                left: 12px;
            }
            
            .size-slider-tube {
                width: 10px;
                height: 160px;
            }
            
            .size-slider-level-indicator {
                width: 14px;
            }
            
            .fit-button {
                width: 36px;
                height: 36px;
            }
        }

        /* Tap feedback animation */
        .size-slider-tube:active {
            transform: scale(1.05);
            transition: transform 0.1s ease;
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Setup custom size control event listeners
 */
function setupCustomSizeEvents() {
    const fitButton = document.getElementById('fit-button');
    
    // Fit button click event - connects to actual fit functionality
    fitButton.addEventListener('click', () => {
        console.log('🎯 Custom size FIT button clicked - calling performBasicSmartFraming...');
        
        // Call the actual fit function that works with all features
        if (typeof window.performBasicSmartFraming === 'function') {
            window.performBasicSmartFraming();
            console.log('✅ Design fitted successfully via custom size button');
        } else {
            console.error('❌ performBasicSmartFraming function not found');
        }
    });
    
    // Size slider tube interactions (tap + drag)
    const sliderTube = document.querySelector('.size-slider-tube');
    const sliderLiquid = document.querySelector('.size-slider-liquid');
    const sliderLevel = document.querySelector('.size-slider-level-indicator');
    
    let currentLevel = 30; // Start at 30%
    let isDragging = false;
    
    // Mouse events
    sliderTube.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);
    
    // Touch events
    sliderTube.addEventListener('touchstart', startDragging, { passive: false });
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', stopDragging);
    
    function startDragging(e) {
        e.preventDefault();
        isDragging = true;
        handleSizeChange(e);
        
        // Add visual feedback
        sliderTube.style.transform = 'scale(1.05)';
        sliderTube.style.transition = 'transform 0.1s ease';
    }
    
    function handleDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        handleSizeChange(e);
    }
    
    function stopDragging(e) {
        if (!isDragging) return;
        e.preventDefault();
        isDragging = false;
        
        // Remove visual feedback
        sliderTube.style.transform = '';
        sliderTube.style.transition = '';
    }
    
    function handleSizeChange(e) {
        const rect = sliderTube.getBoundingClientRect();
        let clientY;
        
        if (e.touches && e.touches[0]) {
            // Touch event
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches[0]) {
            // Touch end event
            clientY = e.changedTouches[0].clientY;
        } else {
            // Mouse event
            clientY = e.clientY;
        }
        
        // Calculate percentage (0% at bottom, 100% at top)
        const percentage = Math.max(0, Math.min(100, 
            ((rect.bottom - clientY) / rect.height) * 100
        ));
        
        // Update visual
        updateSliderLevel(percentage);
        currentLevel = percentage;
        
        // Log the new level
        console.log('🎛️ Custom size level set to:', Math.round(percentage) + '%');
    }
    
    function updateSliderLevel(percentage) {
        // Update liquid height
        sliderLiquid.style.height = percentage + '%';
        
        // Update level indicator position
        sliderLevel.style.bottom = percentage + '%';
        
        // Add pulse effect to show change
        sliderLiquid.style.animation = 'none';
        setTimeout(() => {
            sliderLiquid.style.animation = 'pulseFill 0.3s ease';
        }, 10);
    }
    
    // Add CSS animation for pulse effect
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        @keyframes pulseFill {
            0% { transform: scaleY(1); }
            50% { transform: scaleY(1.02); }
            100% { transform: scaleY(1); }
        }
    `;
    document.head.appendChild(animationStyle);
}

// Make function globally accessible
window.initCustomSize = initCustomSize;