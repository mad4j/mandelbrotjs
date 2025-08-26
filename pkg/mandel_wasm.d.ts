declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	/**
	 * Single unified function for Mandelbrot image generation
	 * Uses the original coordinate system: screen coordinates, zoom level, max iterations and image dimensions  
	 * start_line parameter defines the vertical offset for this image segment
	 */
	export function mandel_generate_image(screen_x: number, screen_y: number, zoom: number, max_iterations: number, width: number, height: number, start_line: number): Uint8Array;
	
}

declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly mandel_generate_image: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
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
