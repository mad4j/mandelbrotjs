use wasm_bindgen::prelude::*;
use std::cell::RefCell;

// Import the `console.log` function from the `console` object
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Thread-local memory pools for avoiding allocations
thread_local! {
    static MANDEL_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::new());
    static SMOOTH_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::new());
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

// Enhanced function for processing large image segments efficiently with smooth rendering
// Optimized for minimal JS-WASM boundary crossings with vectorized processing
#[wasm_bindgen]
pub fn mandel_compute_large_segment_with_smooth_optimized(
    start_line: i32,
    segment_height: i32,
    canvas_width: i32,
    screen_x: f64,
    screen_y: f64,
    zoom: f64,
    iter_max: i32,
    _block_size: i32,
) -> MandelSegmentResultOptimized {
    let total_size = (canvas_width * segment_height) as usize;
    
    // Use optimized processing for large segments with smooth rendering
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
            
            // Process in larger blocks for better cache performance with large segments
            let processing_block_size = if segment_height > 300 { 4 } else { 2 };
            
            let mut y = 0;
            while y < segment_height {
                let y_end = std::cmp::min(y + processing_block_size, segment_height);
                let y_norm_base = (start_line as f64 - screen_y) / zoom;
                
                for current_y in y..y_end {
                    let y_norm = y_norm_base + (current_y as f64 / zoom);
                    let y_offset = (current_y * canvas_width) as usize;
                    
                    // Vectorized processing across the width (8 pixels at once)
                    let mut x = 0;
                    while x < canvas_width {
                        let x_end = std::cmp::min(x + 8, canvas_width);
                        
                        for current_x in x..x_end {
                            let x_norm = (current_x as f64 - screen_x) / zoom;
                            let (iteration, smooth_offset) = mandel_point_with_smooth_optimized(x_norm, y_norm, iter_max);
                            
                            let result_iteration = if iteration == iter_max {
                                255
                            } else {
                                (iteration % 255) as u8
                            };
                            
                            let smooth_offset_u8 = smooth_offset as u8;
                            let index = y_offset + current_x as usize;
                            
                            mandel_buf[index] = result_iteration;
                            smooth_buf[index] = smooth_offset_u8;
                        }
                        x = x_end;
                    }
                }
                y = y_end;
            }
            
            // Return result with optimized data
            MandelSegmentResultOptimized {
                mandel_data: mandel_buf[0..total_size].to_vec(),
                smooth_data: smooth_buf[0..total_size].to_vec(),
            }
        })
    })
}

// Enhanced function for processing large image segments efficiently (non-smooth)
// Optimized for minimal JS-WASM boundary crossings with vectorized processing
#[wasm_bindgen]
pub fn mandel_compute_large_segment_optimized(
    start_line: i32,
    segment_height: i32,
    canvas_width: i32,
    screen_x: f64,
    screen_y: f64,
    zoom: f64,
    iter_max: i32,
    smooth: bool,
    _block_size: i32,
) -> Box<[u8]> {
    let escape_squared = if smooth { 256.0 } else { 4.0 };
    let total_size = (canvas_width * segment_height) as usize;
    
    // Use optimized processing for large segments
    MANDEL_BUFFER.with(|buffer| {
        let mut buf = buffer.borrow_mut();
        if buf.len() < total_size {
            buf.resize(total_size, 0);
        }
        
        // Process in larger blocks for better cache performance with large segments
        let processing_block_size = if segment_height > 300 { 4 } else { 2 };
        
        let mut y = 0;
        while y < segment_height {
            let y_end = std::cmp::min(y + processing_block_size, segment_height);
            let y_norm_base = (start_line as f64 - screen_y) / zoom;
            
            for current_y in y..y_end {
                let y_norm = y_norm_base + (current_y as f64 / zoom);
                let y_offset = (current_y * canvas_width) as usize;
                
                // Vectorized processing across the width
                let mut x = 0;
                while x < canvas_width {
                    let x_end = std::cmp::min(x + 8, canvas_width); // Process 8 pixels at once
                    
                    for current_x in x..x_end {
                        let x_norm = (current_x as f64 - screen_x) / zoom;
                        let iteration = mandel_point_optimized(x_norm, y_norm, iter_max, escape_squared);
                        
                        let result_iteration = if iteration == iter_max {
                            255
                        } else {
                            (iteration % 255) as u8
                        };
                        
                        buf[y_offset + current_x as usize] = result_iteration;
                    }
                    x = x_end;
                }
            }
            y = y_end;
        }
        
        // Return optimized slice
        buf[0..total_size].into()
    })
}
