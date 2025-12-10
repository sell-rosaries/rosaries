import os
import json
import time
import threading
from pathlib import Path
from typing import List, Dict, Optional, Callable, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from rich.console import Console
from rich.progress import Progress, BarColumn, TextColumn, TimeRemainingColumn
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

console = Console()

@dataclass
class ProcessingResult:
    """Data class for processing results"""
    image_info: Dict[str, Any]
    success: bool
    output_path: Optional[str] = None
    error_message: Optional[str] = None
    processing_time: float = 0.0
    retry_count: int = 0

class BatchProcessor:
    """Handles batch processing of images with Gemini API"""
    
    def __init__(self, api_handler, image_processor):
        self.api_handler = api_handler
        self.image_processor = image_processor
        self.processing_stats = {
            'total': 0,
            'completed': 0,
            'failed': 0,
            'retries': 0,
            'start_time': None,
            'end_time': None
        }
        self.pause_event = threading.Event()
        self.pause_event.set()  # Start unpaused
        self.cancel_event = threading.Event()
    
    def process_images(self, 
                      images: List[Dict[str, Any]],
                      prompt: str,
                      output_folder: str,
                      model_config: Dict[str, Any],
                      reference_images: List[Dict[str, str]] = None,
                      max_workers: int = 3,
                      enable_retry: bool = True,
                      max_retries: int = 3,
                      progress_callback: Callable = None) -> List[ProcessingResult]:
        """
        Process multiple images with Gemini API
        
        Args:
            images: List of image information dictionaries
            prompt: Text prompt for generation
            output_folder: Output directory path
            model_config: Model configuration
            reference_images: Reference images for context
            max_workers: Maximum concurrent workers
            enable_retry: Enable automatic retry on failure
            max_retries: Maximum retry attempts
            progress_callback: Callback function for progress updates
        
        Returns:
            List of ProcessingResult objects
        """
        self.processing_stats = {
            'total': len(images),
            'completed': 0,
            'failed': 0,
            'retries': 0,
            'start_time': time.time(),
            'end_time': None
        }
        
        console.print(f"[bold blue]Starting batch processing of {len(images)} images[/bold blue]")
        console.print(f"[dim]Output folder: {output_folder}[/dim]")
        
        results = []
        temp_files = []  # Track temporary files for cleanup
        
        try:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all tasks
                future_to_image = {
                    executor.submit(
                        self._process_single_image,
                        img,
                        prompt,
                        output_folder,
                        model_config,
                        reference_images,
                        enable_retry,
                        max_retries,
                        temp_files
                    ): img
                    for img in images
                }
                
                # Process completed tasks with progress tracking
                with Progress(
                    TextColumn("[progress.description]{task.description}"),
                    BarColumn(),
                    TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                    TimeRemainingColumn(),
                    console=console
                ) as progress:
                    
                    main_task = progress.add_task(
                        "Processing images...", 
                        total=len(images)
                    )
                    
                    for future in as_completed(future_to_image):
                        # Check for cancellation
                        if self.cancel_event.is_set():
                            console.print("[red]Processing cancelled by user[/red]")
                            break
                        
                        # Wait for pause
                        self.pause_event.wait()
                        
                        try:
                            result = future.result()
                            results.append(result)
                            
                            if result.success:
                                self.processing_stats['completed'] += 1
                                status = "✓"
                                status_style = "green"
                            else:
                                self.processing_stats['failed'] += 1
                                status = "✗"
                                status_style = "red"
                            
                            # Update progress
                            progress.update(
                                main_task,
                                description=f"Processed {result.image_info['name']} {status}",
                                completed=self.processing_stats['completed'] + self.processing_stats['failed']
                            )
                            
                            # Call progress callback if provided
                            if progress_callback:
                                progress_callback(result, self.processing_stats)
                            
                        except Exception as e:
                            console.print(f"[red]Error processing image: {e}[/red]")
                            img_info = future_to_image[future]
                            results.append(ProcessingResult(
                                image_info=img_info,
                                success=False,
                                error_message=str(e)
                            ))
                            self.processing_stats['failed'] += 1
        
        finally:
            self.processing_stats['end_time'] = time.time()
            
            # Clean up temporary files
            if temp_files:
                self.image_processor.cleanup_temp_files(temp_files)
        
        self._display_final_results(results)
        return results
    
    def _process_single_image(self,
                            image_info: Dict[str, Any],
                            prompt: str,
                            output_folder: str,
                            model_config: Dict[str, Any],
                            reference_images: List[Dict[str, str]],
                            enable_retry: bool,
                            max_retries: int,
                            temp_files: List[str]) -> ProcessingResult:
        """Process a single image with retry logic"""
        
        start_time = time.time()
        retry_count = 0
        
        while retry_count <= max_retries:
            try:
                # Check for pause/cancel
                if self.cancel_event.is_set():
                    break
                
                self.pause_event.wait()
                
                # Generate output filename
                output_filename = self.image_processor.generate_output_filename(
                    original_name=image_info['name'],
                    extension='.png',  # Default to PNG for generated images
                    output_folder=output_folder,
                    index=retry_count
                )
                
                # Prepare generation arguments
                generation_args = {
                    'prompt': prompt,
                    'main_image_path': image_info['path'] if image_info.get('use_as_main', False) else None,
                    'reference_images': reference_images,
                    'model_config': model_config
                }
                
                # Generate image
                generated_image = self.api_handler.generate_image(**generation_args)
                
                if generated_image:
                    # Save the generated image
                    with open(output_filename, 'wb') as f:
                        f.write(generated_image)
                    
                    processing_time = time.time() - start_time
                    
                    return ProcessingResult(
                        image_info=image_info,
                        success=True,
                        output_path=output_filename,
                        processing_time=processing_time,
                        retry_count=retry_count
                    )
                else:
                    raise Exception("No image generated")
                    
            except Exception as e:
                retry_count += 1
                self.processing_stats['retries'] += 1
                
                if retry_count > max_retries:
                    processing_time = time.time() - start_time
                    return ProcessingResult(
                        image_info=image_info,
                        success=False,
                        error_message=str(e),
                        processing_time=processing_time,
                        retry_count=retry_count - 1
                    )
                
                # Wait before retry with exponential backoff
                if enable_retry and retry_count <= max_retries:
                    wait_time = min(2 ** retry_count, 30)  # Max 30 seconds
                    console.print(f"[yellow]Retrying {image_info['name']} in {wait_time}s (attempt {retry_count}/{max_retries})[/yellow]")
                    time.sleep(wait_time)
        
        # Should not reach here
        processing_time = time.time() - start_time
        return ProcessingResult(
            image_info=image_info,
            success=False,
            error_message="Max retries exceeded",
            processing_time=processing_time,
            retry_count=max_retries
        )
    
    def pause_processing(self):
        """Pause the batch processing"""
        self.pause_event.clear()
        console.print("[yellow]Processing paused[/yellow]")
    
    def resume_processing(self):
        """Resume the batch processing"""
        self.pause_event.set()
        console.print("[green]Processing resumed[/green]")
    
    def cancel_processing(self):
        """Cancel the batch processing"""
        self.cancel_event.set()
        self.pause_event.set()  # Ensure thread can check cancel flag
        console.print("[red]Processing cancelled[/red]")
    
    def _display_final_results(self, results: List[ProcessingResult]):
        """Display final processing results"""
        self.processing_stats['end_time'] = time.time()
        total_time = self.processing_stats['end_time'] - self.processing_stats['start_time']
        
        # Create results table
        table = Table(title="Processing Results")
        table.add_column("Image", style="cyan")
        table.add_column("Status", style="magenta")
        table.add_column("Output", style="green")
        table.add_column("Time", style="yellow")
        table.add_column("Retries", style="blue")
        
        successful_results = []
        failed_results = []
        
        for result in results:
            status = "✓ Success" if result.success else "✗ Failed"
            status_style = "green" if result.success else "red"
            
            output_info = Path(result.output_path).name if result.output_path else "N/A"
            time_info = f"{result.processing_time:.1f}s"
            retry_info = str(result.retry_count)
            
            table.add_row(
                result.image_info['name'] + result.image_info['extension'],
                status,
                output_info,
                time_info,
                retry_info,
                style=status_style
            )
            
            if result.success:
                successful_results.append(result)
            else:
                failed_results.append(result)
        
        console.print(table)
        
        # Display summary statistics
        summary = Panel.fit(
            f"[bold]Processing Complete[/bold]\n"
            f"Total Images: {self.processing_stats['total']}\n"
            f"Successful: [green]{self.processing_stats['completed']}[/green]\n"
            f"Failed: [red]{self.processing_stats['failed']}[/red]\n"
            f"Total Retries: {self.processing_stats['retries']}\n"
            f"Total Time: {total_time:.1f}s\n"
            f"Average per image: {total_time/max(1, self.processing_stats['total']):.1f}s",
            title="Summary"
        )
        console.print(summary)
        
        # Show failed results if any
        if failed_results:
            console.print("\n[red]Failed images:[/red]")
            for result in failed_results:
                console.print(f"  • {result.image_info['name']}: {result.error_message}")
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """Get current processing statistics"""
        return self.processing_stats.copy()
    
    def export_results(self, results: List[ProcessingResult], output_file: str):
        """Export processing results to JSON file"""
        try:
            export_data = {
                'processing_stats': self.processing_stats,
                'results': [
                    {
                        'image_name': r.image_info['name'],
                        'image_path': r.image_info['path'],
                        'success': r.success,
                        'output_path': r.output_path,
                        'error_message': r.error_message,
                        'processing_time': r.processing_time,
                        'retry_count': r.retry_count
                    }
                    for r in results
                ]
            }
            
            with open(output_file, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            console.print(f"[green]✓[/green] Results exported to: {output_file}")
            
        except Exception as e:
            console.print(f"[red]Error exporting results: {e}[/red]")