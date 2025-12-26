// Dynamic Crazy Rubber Typewriter Title

let crtText = "Rosary Designer"; // Default
let crtTarget, crtEraser, crtMeasure;

let crtIndex = 0;
let crtDeleting = false;
let crtTimer = null; // To handle clearing timeouts when text changes
const crtTypeSpeed = 130;
const crtDeleteSpeed = 200;
const crtPauseAfterType = 1100;

function updateCrtEraserPosition() {
    if (!crtMeasure || !crtTarget || !crtEraser) return;
    
    // Check direction
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    
    crtMeasure.textContent = crtTarget.textContent;
    const width = crtMeasure.offsetWidth;
    
    // Adjust eraser position
    // In LTR: left = width - offset
    // In RTL: right = width - offset (because we want it at the 'end' of the text which is on the left side?)
    // Wait, in RTL:
    // Container aligned Right. Text grows to Left.
    // Start (Right) -> End (Left).
    // Eraser should be at the End (Left).
    // If container is relative, Right edge is 0.
    // Position = right: width
    
    if (isRTL) {
        crtEraser.style.left = 'auto';
        crtEraser.style.right = (width - 1) + "px";
    } else {
        crtEraser.style.right = 'auto';
        crtEraser.style.left = (width - 1) + "px";
    }
}

function crtLoop() {
    if (!crtMeasure || !crtTarget || !crtEraser) return;

    if (!crtDeleting) {
        crtTarget.textContent = crtText.slice(0, crtIndex++);
        updateCrtEraserPosition();
        if (crtIndex > crtText.length) {
            // Pause loop completely
            crtTimer = setTimeout(() => {
                crtDeleting = true;
                crtEraser.classList.add("active"); 
                crtDeleteLoop();
            }, crtPauseAfterType);
        } else {
            crtTimer = setTimeout(crtLoop, crtTypeSpeed);
        }
    } else {
        crtTimer = setTimeout(crtLoop, crtTypeSpeed);
    }
}

function crtDeleteLoop() {
    if (!crtMeasure || !crtTarget || !crtEraser) return;

    crtTarget.textContent = crtText.slice(0, crtIndex--);
    updateCrtEraserPosition();
    if (crtIndex < 0) {
        crtDeleting = false;
        crtEraser.classList.remove("active");
        crtIndex = 0;
        crtTimer = setTimeout(crtLoop, crtTypeSpeed); 
    } else {
        crtTimer = setTimeout(crtDeleteLoop, crtDeleteSpeed);
    }
}

function restartCrtAnimation(newText) {
    if (crtText === newText) return; // No change
    
    crtText = newText;
    
    // Reset state
    clearTimeout(crtTimer);
    crtIndex = 0;
    crtDeleting = false;
    
    if (crtTarget && crtEraser) {
        crtTarget.textContent = "";
        crtEraser.classList.remove("active");
        updateCrtEraserPosition(); // Reset position
    }
    
    // Start loop
    crtLoop();
}

function updateTitleLanguage() {
    if (typeof window.getTranslation === 'function') {
        const translatedTitle = window.getTranslation('title');
        if (translatedTitle && translatedTitle !== crtText) {
            restartCrtAnimation(translatedTitle);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    crtTarget = document.getElementById("crt-text");
    crtEraser = document.getElementById("crt-eraser");
    crtMeasure = document.getElementById("crt-measure");
    
    // Initial start
    updateTitleLanguage();
    if(crtTarget && crtEraser && crtMeasure) {
         if (!crtTimer) crtLoop(); // Only start if updateTitleLanguage didn't already start it
    }

    // Observer for language changes (simplest way without hooking deep into LanguageManager)
    // We observe the 'lang' attribute on html or body
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && (mutation.attributeName === 'lang' || mutation.attributeName === 'dir')) {
                updateTitleLanguage();
            }
        });
    });

    observer.observe(document.documentElement, { attributes: true });
});