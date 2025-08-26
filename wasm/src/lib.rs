use wasm_bindgen::prelude::*;
use rayon::prelude::*;

// Import the `console.log` function from the `console` object
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Single unified function for Mandelbrot image generation
/// Uses center coordinates in the complex plane, zoom level, max iterations and image dimensions  
/// start_line parameter defines the vertical offset for this image segment
/// width is the canvas width, height is the segment height
#[wasm_bindgen]
pub fn mandel_generate_image(
    center_x: f64,
    center_y: f64,
    zoom: f64,
    max_iterations: i32,
    width: i32,
    height: i32,
    start_line: i32,
) -> Box<[u8]> {
    let escape_squared = 4.0f64;
    let total_pixels = (width * height) as usize;
    
    // Debug logging for the first call
    log(&format!("WASM: center_x={}, center_y={}, zoom={}, start_line={}, width={}, height={}", 
                 center_x, center_y, zoom, start_line, width, height));
    
    // Create a vector to hold the results - we'll fill this in parallel
    let mut buf = vec![0u8; total_pixels];

    // Parallelize the computation across rows using Rayon
    buf.par_chunks_mut(width as usize)
        .enumerate()
        .for_each(|(y, row_chunk)| {
            for x in 0..width {
                // Convert pixel coordinates to complex plane coordinates
                // The full canvas coordinates for this pixel are (x, y + start_line)
                let canvas_x = x as f64;
                let canvas_y = (y as i32 + start_line) as f64;
                
                // Convert to complex plane coordinates centered on center_x, center_y
                let x_norm = center_x + (canvas_x - width as f64 / 2.0) / zoom;
                let y_norm = center_y + (canvas_y - width as f64 / 2.0) / zoom; // Use width for canvas height (square canvas)
                
                // Debug first pixel
                if x == 0 && y == 0 {
                    log(&format!("First pixel: canvas_pos=({}, {}), x_norm={}, y_norm={}", canvas_x, canvas_y, x_norm, y_norm));
                }
                
                let iteration = mandel_point_optimized(x_norm, y_norm, max_iterations, escape_squared);
                
                // Map iteration count to grayscale values for direct image display
                let result_value = if iteration == max_iterations {
                    0  // Interior points are black (0)
                } else {
                    // Map iteration count to grayscale: faster escape = brighter
                    let normalized = (iteration as f64 / max_iterations as f64 * 255.0) as u8;
                    255 - normalized  // Invert so that slower escape = darker
                };
                
                // Debug first few pixels
                if x < 3 && y == 0 {
                    log(&format!("Pixel ({}, {}): iteration={}, result_value={}", x, y, iteration, result_value));
                }
                
                row_chunk[x as usize] = result_value;
            }
        });
        
    // Return as boxed slice for transfer to JS
    buf.into_boxed_slice()
}

/// WASM function for direct RGBA image generation (for rendering pipeline)
/// Produces RGBA pixel data ready for ImageBitmap creation
#[wasm_bindgen]
pub fn mandel_generate_rgba_image(
    center_x: f64,
    center_y: f64,
    zoom: f64,
    max_iterations: i32,
    width: i32,
    height: i32,
    start_line: i32,
) -> Box<[u8]> {
    let escape_squared = 4.0f64;
    let total_pixels = (width * height) as usize;
    
    // RGBA buffer: 4 bytes per pixel
    let mut buf = vec![0u8; total_pixels * 4];

    // Parallelize the computation across rows using Rayon
    buf.par_chunks_mut((width * 4) as usize)
        .enumerate()
        .for_each(|(y, row_chunk)| {
            for x in 0..width {
                // Convert pixel coordinates to complex plane coordinates
                let canvas_x = x as f64;
                let canvas_y = (y as i32 + start_line) as f64;
                
                // Convert to complex plane coordinates centered on center_x, center_y
                let x_norm = center_x + (canvas_x - width as f64 / 2.0) / zoom;
                let y_norm = center_y + (canvas_y - width as f64 / 2.0) / zoom;
                
                let iteration = mandel_point_optimized(x_norm, y_norm, max_iterations, escape_squared);
                
                // Map iteration count to grayscale values
                let grayscale_value = if iteration == max_iterations {
                    0  // Interior points are black
                } else {
                    // Map iteration count to grayscale: faster escape = brighter
                    let normalized = (iteration as f64 / max_iterations as f64 * 255.0) as u8;
                    255 - normalized  // Invert so that slower escape = darker
                };
                
                // Set RGBA values (grayscale + full alpha)
                let pixel_index = (x * 4) as usize;
                row_chunk[pixel_index] = grayscale_value;     // R
                row_chunk[pixel_index + 1] = grayscale_value; // G
                row_chunk[pixel_index + 2] = grayscale_value; // B
                row_chunk[pixel_index + 3] = 255;             // A (full opacity)
            }
        });
        
    buf.into_boxed_slice()
}

#[inline(always)]
fn mandel_point_optimized(x_norm: f64, y_norm: f64, iter_max: i32, escape_squared: f64) -> i32 {

    let mut zr = 0.0f64;
    let mut zi = 0.0f64;
    let mut iteration = 0;
    
    // Optimized iteration loop with manual unrolling for better performance
    while iteration < iter_max {
            if iteration >= iter_max {
                break;
            }
            
            let zr_sq = zr * zr;
            let zi_sq = zi * zi;
            
            if zr_sq + zi_sq >= escape_squared {
                return iteration;
            }
            
            let zr_new = zr_sq - zi_sq + x_norm;
            zi = 2.0 * zr * zi + y_norm;
            zr = zr_new;
            iteration += 1;
    }
    
    iteration
}
