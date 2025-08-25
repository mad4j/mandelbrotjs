use wasm_bindgen::prelude::*;

// Import the `console.log` function from the `console` object
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
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
    pub fn mandel_data(&self) -> Vec<u8> {
        self.mandel_data.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn smooth_data(&self) -> Vec<u8> {
        self.smooth_data.clone()
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
    let first_iteration = if smooth { -3 } else { -1 };
    
    let mut iteration = first_iteration;
    
    // Early bailout for points obviously outside the set
    if (x_norm > -0.5) && (x_norm < 0.25) && (y_norm > -0.5) && (y_norm < 0.5) {
        iteration = iter_max;
    } else {
        let mut zr = 0.0;
        let mut zi = 0.0;
        let mut zr_squared;
        let mut zi_squared;
        
        loop {
            zr_squared = zr * zr;
            zi_squared = zi * zi;
            
            if zr_squared + zi_squared >= escape_squared || iteration >= iter_max {
                break;
            }
            
            let zr_prev = zr;
            zr = zr_squared - zi_squared + x_norm;
            zi = (zr_prev * 2.0) * zi + y_norm;
            iteration += 1;
        }
    }
    
    MandelComputeResult {
        iterations: iteration,
        escape_radius: 0.0, // Will be calculated if needed
    }
}

#[wasm_bindgen]
pub fn mandel_compute_segment(
    start_line: i32,
    segment_height: i32,
    canvas_width: i32,
    screen_x: f64,
    screen_y: f64,
    zoom: f64,
    iter_max: i32,
    smooth: bool,
    block_size: i32,
) -> Vec<u8> {
    let escape_squared = if smooth { 256.0 } else { 4.0 };
    let first_iteration = if smooth { -3 } else { -1 };
    let l_block_size = if block_size == 1 { 1 } else { block_size / 2 };
    
    let mut mandel_data = vec![0u8; (canvas_width * segment_height) as usize];
    let mut y = 0;
    
    while y < segment_height {
        let y_norm = ((y + start_line) as f64 - screen_y) / zoom;
        let mut x = 0;
        
        while x < canvas_width {
            let x_norm = (x as f64 - screen_x) / zoom;
            let mut iteration = first_iteration;
            
            // Early bailout for points obviously inside the main cardioid and bulb
            if (x_norm > -0.5) && (x_norm < 0.25) && (y_norm > -0.5) && (y_norm < 0.5) {
                iteration = iter_max;
            } else {
                let mut zr = 0.0;
                let mut zi = 0.0;
                
                loop {
                    let zr_squared = zr * zr;
                    let zi_squared = zi * zi;
                    
                    if zr_squared + zi_squared >= escape_squared || iteration >= iter_max {
                        break;
                    }
                    
                    let zr_prev = zr;
                    zr = zr_squared - zi_squared + x_norm;
                    zi = (zr_prev * 2.0) * zi + y_norm;
                    iteration += 1;
                }
            }
            
            let result_iteration = if iteration == iter_max {
                255
            } else {
                (iteration % 255) as u8
            };
            
            // Fill block
            for j in 0..l_block_size {
                if y + j >= segment_height { break; }
                let y_offset = ((y + j) * canvas_width) as usize;
                for i in 0..l_block_size {
                    if x + i >= canvas_width { break; }
                    let index = y_offset + (x + i) as usize;
                    if index < mandel_data.len() {
                        mandel_data[index] = result_iteration;
                    }
                }
            }
            
            x += l_block_size;
        }
        y += l_block_size;
    }
    
    mandel_data
}

#[wasm_bindgen]
pub fn mandel_compute_segment_with_smooth(
    start_line: i32,
    segment_height: i32,
    canvas_width: i32,
    screen_x: f64,
    screen_y: f64,
    zoom: f64,
    iter_max: i32,
    block_size: i32,
) -> MandelSegmentResult {
    let escape_squared = 256.0;
    let first_iteration = -3;
    let l_block_size = if block_size == 1 { 1 } else { block_size / 2 };
    let log2 = 2.0_f64.ln();
    
    let mut mandel_data = vec![0u8; (canvas_width * segment_height) as usize];
    let mut smooth_mandel = vec![0u8; (canvas_width * segment_height) as usize];
    let mut y = 0;
    
    while y < segment_height {
        let y_norm = ((y + start_line) as f64 - screen_y) / zoom;
        let mut x = 0;
        
        while x < canvas_width {
            let x_norm = (x as f64 - screen_x) / zoom;
            let mut iteration = first_iteration;
            let mut zr = 0.0;
            let mut zi = 0.0;
            let mut zr_squared = 0.0;
            let mut zi_squared = 0.0;
            
            // Early bailout for points obviously inside the main cardioid and bulb
            if (x_norm > -0.5) && (x_norm < 0.25) && (y_norm > -0.5) && (y_norm < 0.5) {
                iteration = iter_max;
            } else {
                loop {
                    zr_squared = zr * zr;
                    zi_squared = zi * zi;
                    
                    if zr_squared + zi_squared >= escape_squared || iteration >= iter_max {
                        break;
                    }
                    
                    let zr_prev = zr;
                    zr = zr_squared - zi_squared + x_norm;
                    zi = (zr_prev * 2.0) * zi + y_norm;
                    iteration += 1;
                }
            }
            
            let smooth_offset = if iteration < iter_max {
                let radius_sqrt = (zr_squared + zi_squared).sqrt();
                ((radius_sqrt.ln() / log2).ln() / log2 - 2.0) * 255.0
            } else {
                0.0
            };
            
            let result_iteration = if iteration == iter_max {
                255
            } else {
                (iteration % 255) as u8
            };
            
            let smooth_offset_u8 = smooth_offset.floor().max(0.0).min(255.0) as u8;
            
            // Fill block
            for j in 0..l_block_size {
                if y + j >= segment_height { break; }
                let y_offset = ((y + j) * canvas_width) as usize;
                for i in 0..l_block_size {
                    if x + i >= canvas_width { break; }
                    let index = y_offset + (x + i) as usize;
                    if index < mandel_data.len() {
                        mandel_data[index] = result_iteration;
                        smooth_mandel[index] = smooth_offset_u8;
                    }
                }
            }
            
            x += l_block_size;
        }
        y += l_block_size;
    }
    
    MandelSegmentResult {
        mandel_data,
        smooth_data: smooth_mandel,
    }
}
