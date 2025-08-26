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
    static IMAGE_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::new());
}

/// Single unified function for Mandelbrot image generation
/// Takes screen center coordinates, zoom level, max iterations and image dimensions  
/// Optionally takes a start_line offset for segment-based computation
#[wasm_bindgen]
pub fn mandel_generate_image(
    screen_x: f64,
    screen_y: f64,
    zoom: f64,
    max_iterations: i32,
    width: i32,
    height: i32,
    start_line: i32,
) -> Box<[u8]> {
    let escape_squared = 4.0f64;
    let total_pixels = (width * height) as usize;
    
    // Use thread-local buffer for efficient memory management
    IMAGE_BUFFER.with(|buffer| {
        let mut buf = buffer.borrow_mut();
        if buf.len() < total_pixels {
            buf.resize(total_pixels, 0);
        }

        // Iterate through all pixels to generate the image
        for y in 0..height {
            let y_norm = ((y + start_line) as f64 - screen_y) / zoom;
            let row_start = (y * width) as usize;
            
            for x in 0..width {
                let x_norm = (x as f64 - screen_x) / zoom;
                let iteration = mandel_point_optimized(x_norm, y_norm, max_iterations, escape_squared);
                
                // Map iteration count to the same values as the original implementation
                let result_value = if iteration == max_iterations {
                    255  // Interior points get value 255
                } else {
                    (iteration % 255) as u8  // Exterior points get iteration count mod 255
                };
                
                let pixel_index = row_start + x as usize;
                buf[pixel_index] = result_value;
            }
        }
        
        // Return slice as boxed slice for transfer to JS
        buf[0..total_pixels].into()
    })
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
