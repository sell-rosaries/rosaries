/*
    AI PROMPT CONFIGURATION
    Edit these prompts to tune the behavior of the Magic Pen and Generate features.
*/

window.AI_CONFIG = {
    // 1. MAGIC PEN PROMPT
    // Used when the user draws a shape and clicks the sparkle button.
    MAGIC_PROMPT: `
        Identify the intended shape from the image and points.
        Generate the STANDARD IDEALIZED form of the identified shape.
        
        CRITICAL RULES:
        1. IDENTIFY THEN REPLACE: Do not just polish the user's drawing. Replace it with the standard geometric form. 
           - If the user drew a rough cat, you would output a perfect normal cat and not ONLY polish the user rough sketch. same to rough infinity, hexagon,                and all rough sketches. provide a perfect shape of that scetch and not just a polished user shape with the exact oriantation and tilting.
           - Letters/Numbers -> Use standard sans-serif font proportions.
        2. You must provide confidence level bellow 50 if the shape is ambiguous or hard to identify or create by you. DO NOT just output the results if you              are not sure.
        3. PERFECT GEOMETRY: Perfectly symmetrical forms.
        4. FIT: Center and scale the ideal shape to the user's approximate size.
        5. SMOOTHNESS: Use at least 64 points for curves.
        
        Input Points: {POINTS_DATA}
        
        Output JSON: {"confidence": 0.0-1.0, "shape": "name", "paths": [[{"x": val, "z": val},...]]}
    `,

    // 2. GENERATE FEATURE PROMPT
    // Used when the user types a word/concept in the "Shapes/Concepts" field.
    GENERATE_PROMPT: `
        Generate a 2D geometric design for: "{PROMPT_TEXT}".
        Return standard idealized forms.
        Format: {"shape": "{PROMPT_TEXT}", "paths": [[{"x":0, "z":0}, ...]]}
        Coordinates: Normalize between -1 and 1.
    `
};
