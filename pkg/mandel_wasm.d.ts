declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	export function mandel_one_shot(x_norm: number, y_norm: number, iter_max: number, smooth: boolean): MandelComputeResult;
	export function mandel_compute_segment_optimized(start_line: number, segment_height: number, canvas_width: number, screen_x: number, screen_y: number, zoom: number, iter_max: number, smooth: boolean, block_size: number): Uint8Array;
	export function mandel_compute_segment_with_smooth_optimized(start_line: number, segment_height: number, canvas_width: number, screen_x: number, screen_y: number, zoom: number, iter_max: number, block_size: number): MandelSegmentResultOptimized;
	/**
	 * Main unified API: Generate complete Mandelbrot image with specified parameters
	 * This is the primary function that embodies the refactoring requirements:
	 * - Accepts complex plane interval, canvas size, max iterations, quality flag
	 * - Handles aggressive multithreading internally  
	 * - Returns ready-to-display image data
	 */
	export function generate_mandelbrot_image(params: MandelParameters): MandelImageResult;
	/**
	 * Generate a segment of the Mandelbrot image for worker-based parallel processing
	 * This function supports aggressive multithreading by generating image segments
	 */
	export function generate_mandelbrot_segment(params: MandelParameters, segment_start_y: number, segment_height: number): MandelSegmentImageResult;
	/**
	 * Dynamic iteration calculation based on zoom level
	 * This implements the requirement for dynamic iteration calculation relative to zoom
	 */
	export function calculate_optimal_iterations(zoom: number, base_iterations: number, max_iterations: number): number;
	export class MandelComputeResult {
	  private constructor();
	  free(): void;
	  readonly iterations: number;
	  readonly escape_radius: number;
	}
	export class MandelImageResult {
	  private constructor();
	  free(): void;
	  readonly image_data: Uint8Array;
	  readonly width: number;
	  readonly height: number;
	  readonly computation_time_ms: number;
	}
	export class MandelParameters {
	  free(): void;
	  constructor(min_real: number, max_real: number, min_imag: number, max_imag: number, canvas_width: number, canvas_height: number, max_iterations: number, smooth_rendering: boolean, block_size: number);
	  min_real: number;
	  max_real: number;
	  min_imag: number;
	  max_imag: number;
	  canvas_width: number;
	  canvas_height: number;
	  max_iterations: number;
	  smooth_rendering: boolean;
	  block_size: number;
	  readonly zoom: number;
	  readonly center_real: number;
	  readonly center_imag: number;
	}
	export class MandelSegmentImageResult {
	  private constructor();
	  free(): void;
	  readonly image_data: Uint8Array;
	  readonly segment_height: number;
	  readonly computation_time_ms: number;
	}
	export class MandelSegmentResult {
	  private constructor();
	  free(): void;
	  readonly mandel_data: Uint8Array;
	  readonly smooth_data: Uint8Array;
	}
	export class MandelSegmentResultOptimized {
	  private constructor();
	  free(): void;
	  readonly mandel_data: Uint8Array;
	  readonly smooth_data: Uint8Array;
	}
	
}

declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_mandelparameters_free: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_min_real: (a: number) => number;
  readonly __wbg_set_mandelparameters_min_real: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_max_real: (a: number) => number;
  readonly __wbg_set_mandelparameters_max_real: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_min_imag: (a: number) => number;
  readonly __wbg_set_mandelparameters_min_imag: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_max_imag: (a: number) => number;
  readonly __wbg_set_mandelparameters_max_imag: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_canvas_width: (a: number) => number;
  readonly __wbg_set_mandelparameters_canvas_width: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_canvas_height: (a: number) => number;
  readonly __wbg_set_mandelparameters_canvas_height: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_max_iterations: (a: number) => number;
  readonly __wbg_set_mandelparameters_max_iterations: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_smooth_rendering: (a: number) => number;
  readonly __wbg_set_mandelparameters_smooth_rendering: (a: number, b: number) => void;
  readonly __wbg_get_mandelparameters_block_size: (a: number) => number;
  readonly __wbg_set_mandelparameters_block_size: (a: number, b: number) => void;
  readonly mandelparameters_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly mandelparameters_zoom: (a: number) => number;
  readonly mandelparameters_center_real: (a: number) => number;
  readonly mandelparameters_center_imag: (a: number) => number;
  readonly __wbg_mandelimageresult_free: (a: number, b: number) => void;
  readonly mandelimageresult_image_data: (a: number) => [number, number];
  readonly mandelimageresult_width: (a: number) => number;
  readonly mandelimageresult_height: (a: number) => number;
  readonly __wbg_mandelsegmentimageresult_free: (a: number, b: number) => void;
  readonly mandelsegmentimageresult_image_data: (a: number) => [number, number];
  readonly __wbg_mandelcomputeresult_free: (a: number, b: number) => void;
  readonly mandelcomputeresult_iterations: (a: number) => number;
  readonly mandelcomputeresult_escape_radius: (a: number) => number;
  readonly __wbg_mandelsegmentresult_free: (a: number, b: number) => void;
  readonly mandelsegmentresult_mandel_data: (a: number) => [number, number];
  readonly mandelsegmentresult_smooth_data: (a: number) => [number, number];
  readonly mandel_one_shot: (a: number, b: number, c: number, d: number) => number;
  readonly mandel_compute_segment_optimized: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number];
  readonly mandelsegmentresultoptimized_mandel_data: (a: number) => [number, number];
  readonly mandelsegmentresultoptimized_smooth_data: (a: number) => [number, number];
  readonly mandel_compute_segment_with_smooth_optimized: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly generate_mandelbrot_image: (a: number) => number;
  readonly generate_mandelbrot_segment: (a: number, b: number, c: number) => number;
  readonly calculate_optimal_iterations: (a: number, b: number, c: number) => number;
  readonly mandelsegmentimageresult_segment_height: (a: number) => number;
  readonly mandelsegmentimageresult_computation_time_ms: (a: number) => number;
  readonly mandelimageresult_computation_time_ms: (a: number) => number;
  readonly __wbg_mandelsegmentresultoptimized_free: (a: number, b: number) => void;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
declare function wasm_bindgen (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
