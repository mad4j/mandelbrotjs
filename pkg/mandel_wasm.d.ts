declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	/**
	 * Single unified function for Mandelbrot image generation
	 * Uses center coordinates in the complex plane, zoom level, max iterations and image dimensions  
	 * start_line parameter defines the vertical offset for this image segment
	 * width is the canvas width, height is the segment height
	 * Returns result with data and min/max iteration values for dynamic color mapping
	 */
	export function mandel_generate_image(center_x: number, center_y: number, zoom: number, max_iterations: number, width: number, height: number, start_line: number): MandelbrotResult;
	/**
	 * WASM function for direct RGBA image generation (for rendering pipeline)
	 * Produces RGBA pixel data ready for ImageBitmap creation with dynamic color mapping
	 */
	export function mandel_generate_rgba_image(center_x: number, center_y: number, zoom: number, max_iterations: number, width: number, height: number, start_line: number): Uint8Array;
	/**
	 * Result structure for Mandelbrot computation with min/max iteration tracking
	 */
	export class MandelbrotResult {
	  private constructor();
	  free(): void;
	  readonly data: Uint8Array;
	  readonly min_iter: number;
	  readonly max_iter: number;
	}
	
}

declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_mandelbrotresult_free: (a: number, b: number) => void;
  readonly mandelbrotresult_data: (a: number) => [number, number];
  readonly mandelbrotresult_min_iter: (a: number) => number;
  readonly mandelbrotresult_max_iter: (a: number) => number;
  readonly mandel_generate_image: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly mandel_generate_rgba_image: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
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
