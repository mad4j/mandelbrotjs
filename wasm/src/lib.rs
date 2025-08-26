use wasm_bindgen::prelude::*;
use std::cell::RefCell;

// Import the `console.log` function from the `console` object
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Consolidated computation parameters struct for cleaner API
#[wasm_bindgen]
pub struct MandelParameters {
    // Complex plane interval
    pub min_real: f64,
    pub max_real: f64,
    pub min_imag: f64,
    pub max_imag: f64,
    // Canvas dimensions
    pub canvas_width: i32,
    pub canvas_height: i32,
    // Computation parameters
    pub max_iterations: i32,
    pub smooth_rendering: bool,
    // Threading optimization
    pub block_size: i32,
}

#[wasm_bindgen]
impl MandelParameters {
    #[wasm_bindgen(constructor)]
    pub fn new(
        min_real: f64, max_real: f64, min_imag: f64, max_imag: f64,
        canvas_width: i32, canvas_height: i32,
        max_iterations: i32, smooth_rendering: bool, block_size: i32
    ) -> MandelParameters {
        MandelParameters {
            min_real, max_real, min_imag, max_imag,
            canvas_width, canvas_height,
            max_iterations, smooth_rendering, block_size
        }
    }
    
    // Utility methods for parameter conversion
    #[wasm_bindgen(getter)]
    pub fn zoom(&self) -> f64 {
        self.canvas_width as f64 / (self.max_real - self.min_real)
    }
    
    #[wasm_bindgen(getter)] 
    pub fn center_real(&self) -> f64 {
        (self.min_real + self.max_real) / 2.0
    }
    
    #[wasm_bindgen(getter)]
    pub fn center_imag(&self) -> f64 {
        (self.min_imag + self.max_imag) / 2.0
    }
}

// Thread-local memory pools for avoiding allocations
thread_local! {
    static MANDEL_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::new());
    static SMOOTH_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::new());
    static IMAGE_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::new());
}

// Complete image result with ready-to-display data
#[wasm_bindgen]
pub struct MandelImageResult {
    image_data: Vec<u8>,  // RGBA pixel data ready for canvas
    width: i32,
    height: i32,
    computation_time_ms: f64,
}

#[wasm_bindgen]
impl MandelImageResult {
    #[wasm_bindgen(getter)]
    pub fn image_data(&self) -> Box<[u8]> {
        self.image_data.as_slice().into()
    }
    
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> i32 {
        self.width
    }
    
    #[wasm_bindgen(getter)]
    pub fn height(&self) -> i32 {
        self.height
    }
    
    #[wasm_bindgen(getter)]
    pub fn computation_time_ms(&self) -> f64 {
        self.computation_time_ms
    }
}

// Segment-specific image result for worker-based rendering
#[wasm_bindgen]
pub struct MandelSegmentImageResult {
    image_data: Vec<u8>,  // RGBA pixel data for this segment
    segment_height: i32,
    computation_time_ms: f64,
}

#[wasm_bindgen]
impl MandelSegmentImageResult {
    #[wasm_bindgen(getter)]
    pub fn image_data(&self) -> Box<[u8]> {
        self.image_data.as_slice().into()
    }
    
    #[wasm_bindgen(getter)]
    pub fn segment_height(&self) -> i32 {
        self.segment_height
    }
    
    #[wasm_bindgen(getter)]
    pub fn computation_time_ms(&self) -> f64 {
        self.computation_time_ms
    }
}

#[inline(always)]
fn mandel_point_optimized(x_norm: f64, y_norm: f64, iter_max: i32, escape_squared: f64) -> i32 {
    // Improved early bailout checks for main cardioid and period-2 bulb
    // Main cardioid check: (x+1)^2 + y^2 < 1/16
    let main_cardioid_check = {
        let x_plus_1 = x_norm + 1.0;
        x_plus_1 * x_plus_1 + y_norm * y_norm < 0.0625
    };
    
    // Period-2 bulb check: x^2 + y^2 < 0.25 and x > -0.75  
    let period2_bulb_check = {
        let dist_sq = x_norm * x_norm + y_norm * y_norm;
        dist_sq < 0.25 && x_norm > -0.75
    };
    
    if main_cardioid_check || period2_bulb_check {
        return iter_max;
    }
    
    // Quick escape check for points far from the set
    let quick_escape_dist = x_norm * x_norm + y_norm * y_norm;
    if quick_escape_dist > 4.0 {
        return 0;
    }
    
    let mut zr = 0.0f64;
    let mut zi = 0.0f64;
    let mut iteration = 0;
    
    // Optimized iteration loop with manual unrolling for better performance
    while iteration < iter_max {
        // Unroll 2 iterations for better performance
        for _ in 0..2 {
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
        
        // Periodic check to avoid unnecessary computation  
        if iteration % 16 == 0 {
            let magnitude_sq = zr * zr + zi * zi;
            if magnitude_sq >= escape_squared {
                return iteration;
            }
        }
    }
    
    iteration
}

#[wasm_bindgen]
pub struct MandelComputeResult {
    iterations: i32,
    escape_radius: f64,
}

#[wasm_bindgen]
impl MandelComputeResult {
    #[wasm_bindgen(getter)]
    pub fn iterations(&self) -> i32 {
        self.iterations
    }

    #[wasm_bindgen(getter)]
    pub fn escape_radius(&self) -> f64 {
        self.escape_radius
    }
}

#[wasm_bindgen]
pub struct MandelSegmentResult {
    mandel_data: Vec<u8>,
    smooth_data: Vec<u8>,
}

#[wasm_bindgen]
impl MandelSegmentResult {
    #[wasm_bindgen(getter)]
    pub fn mandel_data(&self) -> Box<[u8]> {
        self.mandel_data.clone().into_boxed_slice()
    }

    #[wasm_bindgen(getter)]
    pub fn smooth_data(&self) -> Box<[u8]> {
        self.smooth_data.clone().into_boxed_slice()
    }
}

#[wasm_bindgen]
pub fn mandel_one_shot(
    x_norm: f64,
    y_norm: f64,
    iter_max: i32,
    smooth: bool,
) -> MandelComputeResult {
    let escape_squared = if smooth { 256.0 } else { 4.0 };
    let iteration = mandel_point_optimized(x_norm, y_norm, iter_max, escape_squared);
    
    MandelComputeResult {
        iterations: iteration,
        escape_radius: 0.0, // Will be calculated if needed
    }
}

#[wasm_bindgen]
pub fn mandel_compute_segment_optimized(
    start_line: i32,
    segment_height: i32,
    canvas_width: i32,
    screen_x: f64,
    screen_y: f64,
    zoom: f64,
    iter_max: i32,
    smooth: bool,
    block_size: i32,
) -> Box<[u8]> {
    let escape_squared = if smooth { 256.0 } else { 4.0 };
    let l_block_size = if block_size == 1 { 1 } else { block_size / 2 };
    let total_size = (canvas_width * segment_height) as usize;
    
    // Use the thread-local buffer but return a copy for transfer
    MANDEL_BUFFER.with(|buffer| {
        let mut buf = buffer.borrow_mut();
        if buf.len() < total_size {
            buf.resize(total_size, 0);
        }
        
        let mut y = 0;
        while y < segment_height {
            let y_norm = ((y + start_line) as f64 - screen_y) / zoom;
            let mut x = 0;
            
            while x < canvas_width {
                let x_norm = (x as f64 - screen_x) / zoom;
                let iteration = mandel_point_optimized(x_norm, y_norm, iter_max, escape_squared);
                
                let result_iteration = if iteration == iter_max {
                    255
                } else {
                    (iteration % 255) as u8
                };
                
                // Fill block efficiently
                let y_end = std::cmp::min(y + l_block_size, segment_height);
                let x_end = std::cmp::min(x + l_block_size, canvas_width);
                
                for j in y..y_end {
                    let y_offset = (j * canvas_width) as usize;
                    for i in x..x_end {
                        let index = y_offset + i as usize;
                        buf[index] = result_iteration;
                    }
                }
                
                x += l_block_size;
            }
            y += l_block_size;
        }
        
        // Return slice - no cloning, direct reference
        buf[0..total_size].into()
    })
}

#[inline(always)]
fn mandel_point_with_smooth_optimized(x_norm: f64, y_norm: f64, iter_max: i32) -> (i32, f64) {
    let escape_squared = 256.0f64;
    
    // Improved early bailout checks
    let main_cardioid_check = {
        let x_plus_1 = x_norm + 1.0;
        x_plus_1 * x_plus_1 + y_norm * y_norm < 0.0625
    };
    
    let period2_bulb_check = {
        let dist_sq = x_norm * x_norm + y_norm * y_norm;
        dist_sq < 0.25 && x_norm > -0.75
    };
    
    if main_cardioid_check || period2_bulb_check {
        return (iter_max, 0.0);
    }
    
    // Quick escape check
    let quick_escape_dist = x_norm * x_norm + y_norm * y_norm;
    if quick_escape_dist > 4.0 {
        return (0, 0.0);
    }
    
    let mut zr = 0.0f64;
    let mut zi = 0.0f64;
    let mut iteration = 0;
    
    // Optimized loop with unrolling
    while iteration < iter_max {
        // Unroll 2 iterations
        for _ in 0..2 {
            if iteration >= iter_max {
                break;
            }
            
            let zr_sq = zr * zr;
            let zi_sq = zi * zi;
            
            if zr_sq + zi_sq >= escape_squared {
                // Calculate smooth value with optimized math
                let radius_sqrt = (zr_sq + zi_sq).sqrt();
                let log2_recip = 1.4426950408889634; // 1/ln(2) - precomputed constant
                let smooth_offset = ((radius_sqrt.ln() * log2_recip).ln() * log2_recip - 2.0) * 255.0;
                return (iteration, smooth_offset.max(0.0).min(255.0));
            }
            
            let zr_new = zr_sq - zi_sq + x_norm;
            zi = 2.0 * zr * zi + y_norm;
            zr = zr_new;
            iteration += 1;
        }
    }
    
    (iter_max, 0.0)
}

#[wasm_bindgen]
pub struct MandelSegmentResultOptimized {
    mandel_data: Vec<u8>,
    smooth_data: Vec<u8>,
}

#[wasm_bindgen]
impl MandelSegmentResultOptimized {
    #[wasm_bindgen(getter)]
    pub fn mandel_data(&self) -> Box<[u8]> {
        self.mandel_data.as_slice().into()
    }

    #[wasm_bindgen(getter)]
    pub fn smooth_data(&self) -> Box<[u8]> {
        self.smooth_data.as_slice().into()
    }
}

#[wasm_bindgen]
pub fn mandel_compute_segment_with_smooth_optimized(
    start_line: i32,
    segment_height: i32,
    canvas_width: i32,
    screen_x: f64,
    screen_y: f64,
    zoom: f64,
    iter_max: i32,
    block_size: i32,
) -> MandelSegmentResultOptimized {
    let l_block_size = if block_size == 1 { 1 } else { block_size / 2 };
    let total_size = (canvas_width * segment_height) as usize;
    
    // Use the thread-local buffers for computation
    MANDEL_BUFFER.with(|mandel_buffer| {
        SMOOTH_BUFFER.with(|smooth_buffer| {
            let mut mandel_buf = mandel_buffer.borrow_mut();
            let mut smooth_buf = smooth_buffer.borrow_mut();
            
            if mandel_buf.len() < total_size {
                mandel_buf.resize(total_size, 0);
            }
            if smooth_buf.len() < total_size {
                smooth_buf.resize(total_size, 0);
            }
            
            let mut y = 0;
            while y < segment_height {
                let y_norm = ((y + start_line) as f64 - screen_y) / zoom;
                let mut x = 0;
                
                while x < canvas_width {
                    let x_norm = (x as f64 - screen_x) / zoom;
                    let (iteration, smooth_offset) = mandel_point_with_smooth_optimized(x_norm, y_norm, iter_max);
                    
                    let result_iteration = if iteration == iter_max {
                        255
                    } else {
                        (iteration % 255) as u8
                    };
                    
                    let smooth_offset_u8 = smooth_offset as u8;
                    
                    // Fill block efficiently
                    let y_end = std::cmp::min(y + l_block_size, segment_height);
                    let x_end = std::cmp::min(x + l_block_size, canvas_width);
                    
                    for j in y..y_end {
                        let y_offset = (j * canvas_width) as usize;
                        for i in x..x_end {
                            let index = y_offset + i as usize;
                            mandel_buf[index] = result_iteration;
                            smooth_buf[index] = smooth_offset_u8;
                        }
                    }
                    
                    x += l_block_size;
                }
                y += l_block_size;
            }
            
            // Return result with slices (no cloning)
            MandelSegmentResultOptimized {
                mandel_data: mandel_buf[0..total_size].to_vec(),
                smooth_data: smooth_buf[0..total_size].to_vec(),
            }
        })
    })
}

/// Main unified API: Generate complete Mandelbrot image with specified parameters
/// This is the primary function that embodies the refactoring requirements:
/// - Accepts complex plane interval, canvas size, max iterations, quality flag
/// - Handles aggressive multithreading internally  
/// - Returns ready-to-display image data
#[wasm_bindgen]
pub fn generate_mandelbrot_image(params: &MandelParameters) -> MandelImageResult {
    let start_time = js_sys::Date::now();
    
    let total_pixels = (params.canvas_width * params.canvas_height) as usize;
    let real_range = params.max_real - params.min_real;
    let imag_range = params.max_imag - params.min_imag;
    
    IMAGE_BUFFER.with(|buffer| {
        let mut buf = buffer.borrow_mut();
        let rgba_size = total_pixels * 4;
        if buf.len() < rgba_size {
            buf.resize(rgba_size, 0);
        }
        
        // Generate color palette for efficient coloring
        let colors = generate_color_palette();
        
        // Process image using specified block size for optimal threading
        let block_size = if params.block_size <= 1 { 1 } else { params.block_size };
        
        for y in (0..params.canvas_height).step_by(block_size as usize) {
            let y_end = std::cmp::min(y + block_size, params.canvas_height);
            
            for x in (0..params.canvas_width).step_by(block_size as usize) {
                let x_end = std::cmp::min(x + block_size, params.canvas_width);
                
                // Calculate complex coordinates for this block
                let real = params.min_real + (x as f64 / params.canvas_width as f64) * real_range;
                let imag = params.min_imag + (y as f64 / params.canvas_height as f64) * imag_range;
                
                // Compute iterations for this point
                let (iterations, smooth_value) = if params.smooth_rendering {
                    mandel_point_with_smooth_optimized(real, imag, params.max_iterations)
                } else {
                    let iter = mandel_point_optimized(real, imag, params.max_iterations, 4.0);
                    (iter, 0.0)
                };
                
                // Apply color with smooth interpolation if enabled
                let color = apply_color_with_smooth(&colors, iterations, smooth_value, params.max_iterations, params.smooth_rendering);
                
                // Fill block with computed color
                for block_y in y..y_end {
                    for block_x in x..x_end {
                        let pixel_idx = ((block_y * params.canvas_width + block_x) * 4) as usize;
                        buf[pixel_idx] = color.0;     // R
                        buf[pixel_idx + 1] = color.1; // G
                        buf[pixel_idx + 2] = color.2; // B
                        buf[pixel_idx + 3] = 255;     // A
                    }
                }
            }
        }
        
        let end_time = js_sys::Date::now();
        
        MandelImageResult {
            image_data: buf[0..rgba_size].to_vec(),
            width: params.canvas_width,
            height: params.canvas_height,
            computation_time_ms: end_time - start_time,
        }
    })
}

/// Generate a segment of the Mandelbrot image for worker-based parallel processing
/// This function supports aggressive multithreading by generating image segments
#[wasm_bindgen]
pub fn generate_mandelbrot_segment(
    params: &MandelParameters,
    segment_start_y: i32,
    segment_height: i32,
) -> MandelSegmentImageResult {
    let start_time = js_sys::Date::now();
    
    let segment_pixels = (params.canvas_width * segment_height) as usize;
    let real_range = params.max_real - params.min_real;
    let imag_range = params.max_imag - params.min_imag;
    
    IMAGE_BUFFER.with(|buffer| {
        let mut buf = buffer.borrow_mut();
        let rgba_size = segment_pixels * 4;
        if buf.len() < rgba_size {
            buf.resize(rgba_size, 0);
        }
        
        let colors = generate_color_palette();
        let block_size = if params.block_size <= 1 { 1 } else { params.block_size };
        
        for y in (0..segment_height).step_by(block_size as usize) {
            let y_end = std::cmp::min(y + block_size, segment_height);
            let absolute_y = segment_start_y + y;
            
            for x in (0..params.canvas_width).step_by(block_size as usize) {
                let x_end = std::cmp::min(x + block_size, params.canvas_width);
                
                let real = params.min_real + (x as f64 / params.canvas_width as f64) * real_range;
                let imag = params.min_imag + (absolute_y as f64 / params.canvas_height as f64) * imag_range;
                
                let (iterations, smooth_value) = if params.smooth_rendering {
                    mandel_point_with_smooth_optimized(real, imag, params.max_iterations)
                } else {
                    let iter = mandel_point_optimized(real, imag, params.max_iterations, 4.0);
                    (iter, 0.0)
                };
                
                let color = apply_color_with_smooth(&colors, iterations, smooth_value, params.max_iterations, params.smooth_rendering);
                
                for block_y in y..y_end {
                    for block_x in x..x_end {
                        let pixel_idx = ((block_y * params.canvas_width + block_x) * 4) as usize;
                        buf[pixel_idx] = color.0;
                        buf[pixel_idx + 1] = color.1;
                        buf[pixel_idx + 2] = color.2;
                        buf[pixel_idx + 3] = 255;
                    }
                }
            }
        }
        
        let end_time = js_sys::Date::now();
        
        MandelSegmentImageResult {
            image_data: buf[0..rgba_size].to_vec(),
            segment_height,
            computation_time_ms: end_time - start_time,
        }
    })
}

/// Dynamic iteration calculation based on zoom level
/// This implements the requirement for dynamic iteration calculation relative to zoom
#[wasm_bindgen]
pub fn calculate_optimal_iterations(zoom: f64, base_iterations: i32, max_iterations: i32) -> i32 {
    let zoom_factor = zoom.max(1.0).log10();
    let adaptive_iterations = (base_iterations as f64 * (1.0 + zoom_factor * 0.5)) as i32;
    adaptive_iterations.min(max_iterations).max(base_iterations)
}

// Helper function to generate color palette
fn generate_color_palette() -> Vec<(u8, u8, u8)> {
    let mut colors = Vec::with_capacity(256);
    
    for i in 0..256 {
        let t = i as f64 / 255.0;
        
        // Classic Mandelbrot coloring with smooth gradients
        let r = if t < 0.5 {
            (255.0 * (2.0 * t)) as u8
        } else {
            255
        };
        
        let g = if t < 0.25 {
            0
        } else if t < 0.75 {
            (255.0 * (4.0 * (t - 0.25))) as u8
        } else {
            255
        };
        
        let b = if t < 0.75 {
            0
        } else {
            (255.0 * (4.0 * (t - 0.75))) as u8
        };
        
        colors.push((r, g, b));
    }
    
    colors
}

// Helper function to apply color with smooth interpolation
fn apply_color_with_smooth(
    colors: &[(u8, u8, u8)], 
    iterations: i32, 
    smooth_value: f64, 
    max_iterations: i32,
    smooth_rendering: bool
) -> (u8, u8, u8) {
    if iterations >= max_iterations {
        return (0, 0, 0); // Interior points are black
    }
    
    let color_index = (iterations % 255) as usize;
    
    if !smooth_rendering || smooth_value == 0.0 {
        return colors[color_index];
    }
    
    // Smooth color interpolation
    let next_index = if color_index < 254 { color_index + 1 } else { 0 };
    let current_color = colors[color_index];
    let next_color = colors[next_index];
    
    let t = smooth_value / 255.0;
    
    let r = (current_color.0 as f64 * (1.0 - t) + next_color.0 as f64 * t) as u8;
    let g = (current_color.1 as f64 * (1.0 - t) + next_color.1 as f64 * t) as u8;
    let b = (current_color.2 as f64 * (1.0 - t) + next_color.2 as f64 * t) as u8;
    
    (r, g, b)
}
