import os
import base64
import mimetypes
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from io import BytesIO
from PIL import Image
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from google import genai
from google.genai import types

console = Console()

class GeminiAPIHandler:
    """Handles all interactions with Google's Gemini API using the latest API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = None
        self._setup_api()
    
    def _setup_api(self):
        """Initialize the Gemini API using the latest API"""
        try:
            self.client = genai.Client(api_key=self.api_key)
            console.print("[green]✓[/green] Gemini API client configured successfully")
        except Exception as e:
            console.print(f"[red]Error configuring Gemini API: {e}[/red]")
            raise
    
    def test_connection(self) -> bool:
        """Test the API connection"""
        try:
            # Simple test to verify API key works
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents="Say 'Connection test successful' in exactly 4 words"
            )
            if response and response.text:
                console.print(f"[green]✓[/green] API connection test passed: {response.text}")
                return True
        except Exception as e:
            console.print(f"[red]API connection test failed: {e}[/red]")
            return False
        return False
    
    def generate_image(self, 
                      prompt: str,
                      model_name: str,
                      image_size: str = "1K",
                      aspect_ratio: str = "1:1",
                      input_images: List[str] = None,
                      number_of_images: int = 1,
                      enable_grounding: bool = False) -> List[Tuple[Image.Image, str]]:
        """
        Generate image using the latest Gemini API
        
        Args:
            prompt: Text prompt for image generation
            model_name: Model to use (gemini-2.5-flash-image or gemini-3-pro-image-preview)
            image_size: Image size (1K, 2K, 4K) - only for Gemini 3 Pro
            aspect_ratio: Aspect ratio (1:1, 16:9, etc.)
            input_images: List of input image paths for editing
            number_of_images: Number of images to generate
            enable_grounding: Whether to enable Google Search Grounding
            
        Returns:
            List of tuples (Image, filename) or empty list if failed
        """
        try:
            if not self.client:
                raise ValueError("API client not initialized")
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TimeElapsedColumn(),
                console=console
            ) as progress:
                
                task = progress.add_task("🎨 Generating images...", total=None)
                
                # Prepare content for the request
                contents = []
                
                # Add prompt
                contents.append(prompt)
                
                # Add input images if provided
                if input_images:
                    for img_path in input_images:
                        if os.path.exists(img_path):
                            img = Image.open(img_path)
                            contents.append(img)
                        else:
                            console.print(f"[yellow]Warning: Image {img_path} not found, skipping[/yellow]")
                
                # Prepare image config
                image_config = types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                    image_size=image_size if model_name == "gemini-3-pro-image-preview" else None
                )

                # Prepare tools (Grounding)
                tools = []
                if enable_grounding:
                    # Using the appropriate Tool definition for google-genai SDK
                    tools.append(types.Tool(google_search=types.GoogleSearch()))
                
                # Prepare generation config
                generation_config = types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=image_config,
                    tools=tools if tools else None
                )
                
                # Generate the image
                progress.update(task, description="🔄 Calling Gemini API...")
                
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=generation_config
                )
                
                progress.update(task, description="✅ Processing response...")
                
                # Extract images from response
                return self._extract_images_from_response(response, number_of_images)
                
        except Exception as e:
            console.print(f"[red]Error generating image: {e}[/red]")
            return []
    
    def _extract_images_from_response(self, response, expected_count: int = 1) -> List[Tuple[Image.Image, str]]:
        """Extract image data from API response"""
        try:
            images = []
            
            if not response or not hasattr(response, 'candidates') or not response.candidates:
                console.print("[red]No response candidates found[/red]")
                return images
            
            candidate = response.candidates[0]
            if not hasattr(candidate, 'content') or not hasattr(candidate.content, 'parts'):
                console.print("[red]No content parts found in response[/red]")
                return images
            
            for i, part in enumerate(candidate.content.parts):
                if hasattr(part, 'inline_data') and part.inline_data:
                    # Convert the image data to PIL Image
                    image_data = part.inline_data.data
                    image = Image.open(BytesIO(image_data))
                    
                    # Generate filename
                    filename = f"generated_image_{i+1}.png"
                    
                    images.append((image, filename))
                    
                    if len(images) >= expected_count:
                        break
            
            if images:
                console.print(f"[green]✓[/green] Successfully extracted {len(images)} image(s) from response")
            else:
                console.print("[red]No images found in response[/red]")
            
            return images
            
        except Exception as e:
            console.print(f"[red]Error extracting images from response: {e}[/red]")
            return []
    
    def save_images(self, images: List[Tuple[Image.Image, str]], output_dir: str, format: str = "png") -> List[str]:
        """Save generated images to disk"""
        try:
            os.makedirs(output_dir, exist_ok=True)
            saved_files = []
            
            # Map simplified format to PIL format
            format_map = {
                'png': 'PNG',
                'jpeg': 'JPEG',
                'jpg': 'JPEG',
                'webp': 'WEBP'
            }
            pil_format = format_map.get(format.lower(), 'PNG')
            ext = format.lower() if format.lower() != 'jpeg' else 'jpg'
            
            for image, _ in images: # Ignore original filename extension
                # Generate timestamped filename
                import time
                timestamp = int(time.time())
                filename = f"gemini_image_{timestamp}_{len(saved_files)+1}.{ext}"
                
                filepath = os.path.join(output_dir, filename)
                image.save(filepath, pil_format)
                saved_files.append(filepath)
                console.print(f"[green]✓[/green] Saved: {filepath}")
            
            return saved_files
            
        except Exception as e:
            console.print(f"[red]Error saving images: {e}[/red]")
            return []
    
    def get_supported_resolutions(self, model_name: str) -> Dict[str, Tuple[int, int]]:
        """Get supported resolutions for the model"""
        if model_name == "gemini-3-pro-image-preview":
            return {
                "1K": (1024, 1024),
                "2K": (2048, 2048), 
                "4K": (4096, 4096)
            }
        elif model_name == "gemini-2.5-flash-image":
            return {
                "1K": (1024, 1024)  # Fixed resolution for Gemini 2.5 Flash
            }
        return {}
    
    def get_supported_aspect_ratios(self) -> List[str]:
        """Get supported aspect ratios"""
        return [
            "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4",
            "9:16", "16:9", "21:9"
        ]
    
    def validate_api_key(self) -> bool:
        """Validate API key format and test connection"""
        if not self.api_key:
            console.print(f"[red]API key not provided[/red]")
            return False
        
        # Simple format check - Google API keys start with 'AIza' and are typically 39 chars
        if not self.api_key.startswith('AIza') or len(self.api_key) < 30:
            console.print(f"[red]Invalid API key format[/red]")
            return False
        
        try:
            # Initialize client and test connection
            self.client = genai.Client(api_key=self.api_key)
            console.print(f"[green]✓[/green] API key format is valid")
            
            # Test the connection with a simple request
            if self.test_connection():
                return True
            else:
                console.print(f"[red]API key validation failed - could not connect to Gemini API[/red]")
                return False
                
        except Exception as e:
            console.print(f"[red]API key validation failed: {e}[/red]")
            return False
    
    def cleanup(self):
        """Clean up resources"""
        try:
            # Close client if needed
            if self.client:
                # The new API doesn't require explicit cleanup
                pass
        except Exception as e:
            console.print(f"[yellow]Warning: Could not clean up resources: {e}[/yellow]")