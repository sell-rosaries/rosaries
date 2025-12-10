"""Model capability validation utilities"""

from typing import Dict, Any, List, Tuple, Optional
from rich.console import Console
from config.models import MODELS, RESOLUTIONS, QUALITY_TIERS

console = Console()

class ModelCapabilityValidator:
    """Validate settings against model capabilities"""
    
    @staticmethod
    def get_supported_resolutions(model_key: str) -> Dict[str, Tuple[int, int]]:
        """Get resolutions supported by the model"""
        if model_key not in MODELS:
            return {}
        
        max_res = MODELS[model_key]['max_resolution']
        supported = {}
        
        for res_key, res_value in RESOLUTIONS.items():
            if res_key == 'custom':
                # Custom resolution - always supported but limited by max
                supported[res_key] = None  # Will be validated dynamically
            elif res_value and res_value[0] <= max_res[0] and res_value[1] <= max_res[1]:
                supported[res_key] = res_value
        
        return supported
    
    @staticmethod
    def get_supported_quality_tiers(model_key: str) -> List[str]:
        """Get quality tiers supported by the model"""
        if model_key not in MODELS:
            return []
        
        return MODELS[model_key]['quality_tiers']
    
    @staticmethod
    def get_max_input_images(model_key: str) -> int:
        """Get maximum number of input images supported by the model"""
        if model_key not in MODELS:
            return 0
        
        return MODELS[model_key]['max_input_images']
    
    @staticmethod
    def validate_resolution(model_key: str, resolution: Tuple[int, int]) -> Tuple[bool, str]:
        """Validate if resolution is supported by model"""
        if model_key not in MODELS:
            return False, "Unknown model"
        
        max_res = MODELS[model_key]['max_resolution']
        
        if resolution[0] > max_res[0] or resolution[1] > max_res[1]:
            return False, f"Resolution {resolution[0]}x{resolution[1]} exceeds model limit {max_res[0]}x{max_res[1]}"
        
        return True, "Resolution supported"
    
    @staticmethod
    def validate_quality(model_key: str, quality: str) -> Tuple[bool, str]:
        """Validate if quality tier is supported by model"""
        if model_key not in MODELS:
            return False, "Unknown model"
        
        supported_qualities = MODELS[model_key]['quality_tiers']
        
        if quality not in supported_qualities:
            return False, f"Quality '{quality}' not supported. Available: {', '.join(supported_qualities)}"
        
        return True, "Quality supported"
    
    @staticmethod
    def validate_input_images(model_key: str, num_images: int) -> Tuple[bool, str]:
        """Validate if number of input images is supported by model"""
        if model_key not in MODELS:
            return False, "Unknown model"
        
        max_images = MODELS[model_key]['max_input_images']
        
        if num_images > max_images:
            return False, f"Model supports maximum {max_images} input images, but {num_images} selected"
        
        return True, "Input images count supported"
    
    @staticmethod
    def get_compatibility_warnings(settings: Dict[str, Any]) -> List[str]:
        """Get list of compatibility warnings for current settings"""
        warnings = []
        
        if 'model' not in settings:
            return warnings
        
        model_key = settings['model']
        
        # Check resolution
        if 'resolution' in settings:
            is_valid, message = ModelCapabilityValidator.validate_resolution(
                model_key, settings['resolution']
            )
            if not is_valid:
                warnings.append(f"Resolution: {message}")
        
        # Check quality
        if 'quality' in settings:
            is_valid, message = ModelCapabilityValidator.validate_quality(
                model_key, settings['quality']
            )
            if not is_valid:
                warnings.append(f"Quality: {message}")
        
        return warnings
    
    @staticmethod
    def get_recommended_settings(model_key: str) -> Dict[str, Any]:
        """Get recommended default settings for a model"""
        if model_key not in MODELS:
            return {}
        
        max_res = MODELS[model_key]['max_resolution']
        supported_qualities = MODELS[model_key]['quality_tiers']
        
        # Find highest quality supported
        quality_hierarchy = ['standard', 'high', 'ultra']
        recommended_quality = 'standard'
        for quality in reversed(quality_hierarchy):
            if quality in supported_qualities:
                recommended_quality = quality
                break
        
        # Find best resolution supported
        recommended_resolution = '1k'  # Default
        if max_res[0] >= 4096 and max_res[1] >= 4096:
            recommended_resolution = '4k'
        elif max_res[0] >= 2048 and max_res[1] >= 2048:
            recommended_resolution = '2k'
        
        return {
            'resolution': recommended_resolution,
            'quality': recommended_quality,
            'max_input_images': MODELS[model_key]['max_input_images']
        }