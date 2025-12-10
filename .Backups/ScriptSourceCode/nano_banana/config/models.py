"""Model configurations and definitions for Gemini Image Processing"""

# Supported image formats
IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'bmp']

# Supported models
MODELS = {
    'gemini_3_pro': {
        'name': 'Gemini 3 Pro Image (Nano Banana Pro)',
        'id': 'gemini-3-pro-image-preview',
        'description': 'State-of-the-art image generation and editing with advanced reasoning',
        'max_resolution': (4096, 4096),
        'max_input_images': 14,
        'max_people_consistency': 5,
        'supports_watermarking': True,
        'supports_text_rendering': True,
        'quality_tiers': ['standard', 'high', 'ultra']
    },
    'gemini_2_5_flash': {
        'name': 'Gemini 2.5 Flash Image (Nano Banana)',
        'id': 'gemini-2.5-flash-image',
        'description': 'Fast image generation and editing with good quality',
        'max_resolution': (2048, 2048),
        'max_input_images': 10,
        'max_people_consistency': 3,
        'supports_watermarking': True,
        'supports_text_rendering': True,
        'quality_tiers': ['standard', 'high']
    }
}

# Resolution options
RESOLUTIONS = {
    '4k': (4096, 4096),
    '2k': (2048, 2048),
    '1k': (1024, 1024),
    'custom': None
}

# Aspect ratio options
ASPECT_RATIOS = {
    '1:1': 'Square (1:1)',
    '9:16': 'Vertical (9:16)',
    '16:9': 'Widescreen (16:9)',
    '4:3': 'Standard (4:3)',
    '3:2': 'Photo (3:2)',
    '21:9': 'Ultrawide (21:9)',
    'custom': 'Custom ratio'
}

# Quality tiers
QUALITY_TIERS = ['standard', 'high', 'ultra']

# Output formats
OUTPUT_FORMATS = ['png', 'jpeg', 'webp']

# Lighting presets
LIGHTING_PRESETS = [
    'natural daylight',
    'golden hour',
    'blue hour',
    'studio lighting',
    'dramatic lighting',
    'soft lighting',
    'hard lighting',
    'overcast',
    'night scene',
    'candlelight'
]

# Camera angles
CAMERA_ANGLES = [
    'front view',
    'side view',
    'three-quarter view',
    'profile view',
    'top-down view',
    'low angle',
    'high angle',
    'bird\'s eye view',
    'worm\'s eye view',
    'close-up',
    'wide shot'
]

# Focus options
FOCUS_OPTIONS = [
    'sharp focus',
    'soft focus',
    'shallow depth of field',
    'deep depth of field',
    'bokeh effect',
    'tilt-shift',
    'motion blur',
    'selective focus'
]

# Color grading presets
COLOR_GRADING = [
    'cinematic',
    'vintage',
    'black and white',
    'sepia',
    'high contrast',
    'low contrast',
    'warm tones',
    'cool tones',
    'muted colors',
    'vibrant colors',
    'teal and orange',
    'monochromatic'
]

# Text positioning options
TEXT_POSITIONS = [
    'center',
    'top center',
    'bottom center',
    'top left',
    'top right',
    'bottom left',
    'bottom right',
    'middle left',
    'middle right',
    'custom position'
]

# Font styles
FONT_STYLES = [
    'serif',
    'sans-serif',
    'monospace',
    'handwritten',
    'script',
    'bold',
    'italic',
    'all caps',
    'small caps'
]

def get_model_config(model_id):
    """Get configuration for a specific model"""
    for model_key, model_config in MODELS.items():
        if model_config['id'] == model_id or model_key == model_id:
            return model_config
    return None

def validate_resolution(width, height, model_id):
    """Validate if resolution is supported by the model"""
    model_config = get_model_config(model_id)
    if not model_config:
        return False
    
    max_width, max_height = model_config['max_resolution']
    return width <= max_width and height <= max_height

def get_max_input_images(model_id):
    """Get maximum number of input images for a model"""
    model_config = get_model_config(model_id)
    return model_config['max_input_images'] if model_config else 0

def get_max_people_consistency(model_id):
    """Get maximum number of people for consistency"""
    model_config = get_model_config(model_id)
    return model_config['max_people_consistency'] if model_config else 0