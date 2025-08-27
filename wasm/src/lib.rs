use wasm_bindgen::prelude::*;
use rayon::prelude::*;

// Import the `console.log` function from the `console` object
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Result structure for Mandelbrot computation with min/max iteration tracking
#[wasm_bindgen]
pub struct MandelbrotResult {
    data: Box<[u8]>,
    min_iter: i32,
    max_iter: i32,
}

#[wasm_bindgen]
impl MandelbrotResult {
    #[wasm_bindgen(getter)]
    pub fn data(&self) -> Box<[u8]> {
        self.data.clone()
    }
    
    #[wasm_bindgen(getter)]
    pub fn min_iter(&self) -> i32 {
        self.min_iter
    }
    
    #[wasm_bindgen(getter)]
    pub fn max_iter(&self) -> i32 {
        self.max_iter
    }
}

/// Single unified function for Mandelbrot image generation
/// Uses center coordinates in the complex plane, zoom level, max iterations and image dimensions  
/// start_line parameter defines the vertical offset for this image segment
/// width is the canvas width, height is the segment height
/// Returns result with data and min/max iteration values for dynamic color mapping
#[wasm_bindgen]
pub fn mandel_generate_image(
    center_x: f64,
    center_y: f64,
    zoom: f64,
    max_iterations: i32,
    width: i32,
    height: i32,
    start_line: i32,
) -> MandelbrotResult {
    let escape_squared = 4.0f64;
    let total_pixels = (width * height) as usize;
    
    // Debug logging for the first call
    log(&format!("WASM: center_x={}, center_y={}, zoom={}, start_line={}, width={}, height={}", 
                 center_x, center_y, zoom, start_line, width, height));
    
    // Fast sampling approach: sample a subset of points to estimate iteration range
    let sample_step = if width > 64 { 8 } else { 4 }; // Adaptive sampling density
    let mut min_iter = max_iterations;
    let mut max_iter = 0;
    
    // Sample points across the image to estimate iteration range
    for y in (0..height).step_by(sample_step as usize) {
        for x in (0..width).step_by(sample_step as usize) {
            let canvas_x = x as f64;
            let canvas_y = (y + start_line) as f64;
            
            let x_norm = center_x + (canvas_x - width as f64 / 2.0) / zoom;
            let y_norm = center_y + (canvas_y - width as f64 / 2.0) / zoom;
            
            let iteration = mandel_point_optimized(x_norm, y_norm, max_iterations, escape_squared);
            
            if iteration < max_iterations {
                min_iter = min_iter.min(iteration);
                max_iter = max_iter.max(iteration);
            }
        }
    }
    
    // Handle edge case where all sampled points are interior
    if min_iter == max_iterations {
        min_iter = 0;
        max_iter = max_iterations;
    }
    
    log(&format!("WASM: Sampled iteration range: {} to {} (max_iterations: {})", min_iter, max_iter, max_iterations));
    
    // Single-pass computation with immediate dynamic color mapping using sampled range
    let mut buf = vec![0u8; total_pixels];
    
    // Parallelize the computation across rows using Rayon
    buf.par_chunks_mut(width as usize)
        .enumerate()
        .for_each(|(y, row_chunk)| {
            for x in 0..width {
                let canvas_x = x as f64;
                let canvas_y = (y as i32 + start_line) as f64;
                
                let x_norm = center_x + (canvas_x - width as f64 / 2.0) / zoom;
                let y_norm = center_y + (canvas_y - width as f64 / 2.0) / zoom;
                
                let iteration = mandel_point_optimized(x_norm, y_norm, max_iterations, escape_squared);
                
                let result_value = if iteration == max_iterations {
                    0  // Interior points are black (0)
                } else if max_iter == min_iter {
                    128  // Single iteration value case - use middle gray
                } else {
                    // Map iteration count to grayscale using dynamic range from sampling
                    let normalized = ((iteration - min_iter) as f64 / (max_iter - min_iter) as f64 * 255.0) as u8;
                    255 - normalized  // Invert so that slower escape = darker
                };
                
                row_chunk[x as usize] = result_value;
            }
        });
        
    // Return result with data and min/max values
    MandelbrotResult {
        data: buf.into_boxed_slice(),
        min_iter,
        max_iter,
    }
}

/// WASM function for direct RGBA image generation (for rendering pipeline)
/// Produces RGBA pixel data ready for ImageBitmap creation with dynamic color mapping
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
    
    // Fast sampling approach: sample a subset of points to estimate iteration range
    let sample_step = if width > 64 { 8 } else { 4 }; // Adaptive sampling density
    let mut min_iter = max_iterations;
    let mut max_iter = 0;
    
    // Sample points across the image to estimate iteration range
    for y in (0..height).step_by(sample_step as usize) {
        for x in (0..width).step_by(sample_step as usize) {
            let canvas_x = x as f64;
            let canvas_y = (y + start_line) as f64;
            
            let x_norm = center_x + (canvas_x - width as f64 / 2.0) / zoom;
            let y_norm = center_y + (canvas_y - width as f64 / 2.0) / zoom;
            
            let iteration = mandel_point_optimized(x_norm, y_norm, max_iterations, escape_squared);
            
            if iteration < max_iterations {
                min_iter = min_iter.min(iteration);
                max_iter = max_iter.max(iteration);
            }
        }
    }
    
    // Handle edge case where all sampled points are interior
    if min_iter == max_iterations {
        min_iter = 0;
        max_iter = max_iterations;
    }

    // RGBA buffer: 4 bytes per pixel
    let mut buf = vec![0u8; total_pixels * 4];

    // Single-pass computation with immediate dynamic color mapping using sampled range
    buf.par_chunks_mut((width * 4) as usize)
        .enumerate()
        .for_each(|(y, row_chunk)| {
            for x in 0..width {
                let canvas_x = x as f64;
                let canvas_y = (y as i32 + start_line) as f64;
                
                let x_norm = center_x + (canvas_x - width as f64 / 2.0) / zoom;
                let y_norm = center_y + (canvas_y - width as f64 / 2.0) / zoom;
                
                let iteration = mandel_point_optimized(x_norm, y_norm, max_iterations, escape_squared);
                
                // Map iteration count to grayscale values using dynamic range from sampling
                let grayscale_value = if iteration == max_iterations {
                    0  // Interior points are black
                } else if max_iter == min_iter {
                    128  // Single iteration value case - use middle gray
                } else {
                    // Map iteration count to grayscale using dynamic range
                    let normalized = ((iteration - min_iter) as f64 / (max_iter - min_iter) as f64 * 255.0) as u8;
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
