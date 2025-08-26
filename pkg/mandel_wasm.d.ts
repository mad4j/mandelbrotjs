declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	export function mandel_one_shot(x_norm: number, y_norm: number, iter_max: number, smooth: boolean): MandelComputeResult;
	export function mandel_compute_segment_optimized(start_line: number, segment_height: number, canvas_width: number, screen_x: number, screen_y: number, zoom: number, iter_max: number, smooth: boolean, block_size: number): Uint8Array;
	export function mandel_compute_segment_with_smooth_optimized(start_line: number, segment_height: number, canvas_width: number, screen_x: number, screen_y: number, zoom: number, iter_max: number, block_size: number): MandelSegmentResultOptimized;
	export function mandel_compute_large_segment_with_smooth_optimized(start_line: number, segment_height: number, canvas_width: number, screen_x: number, screen_y: number, zoom: number, iter_max: number, _block_size: number): MandelSegmentResultOptimized;
	export function mandel_compute_large_segment_optimized(start_line: number, segment_height: number, canvas_width: number, screen_x: number, screen_y: number, zoom: number, iter_max: number, smooth: boolean, _block_size: number): Uint8Array;
	export class MandelComputeResult {
	  private constructor();
	  free(): void;
	  readonly iterations: number;
	  readonly escape_radius: number;
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
  readonly mandel_compute_large_segment_with_smooth_optimized: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly mandel_compute_large_segment_optimized: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number];
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
