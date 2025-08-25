/* tslint:disable */
/* eslint-disable */
export function mandel_one_shot(x_norm: number, y_norm: number, iter_max: number, smooth: boolean): MandelComputeResult;
export function mandel_compute_segment(start_line: number, segment_height: number, canvas_width: number, screen_x: number, screen_y: number, zoom: number, iter_max: number, smooth: boolean, block_size: number): Uint8Array;
export function mandel_compute_segment_with_smooth(start_line: number, segment_height: number, canvas_width: number, screen_x: number, screen_y: number, zoom: number, iter_max: number, block_size: number): MandelSegmentResult;
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

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_mandelcomputeresult_free: (a: number, b: number) => void;
  readonly mandelcomputeresult_iterations: (a: number) => number;
  readonly mandelcomputeresult_escape_radius: (a: number) => number;
  readonly __wbg_mandelsegmentresult_free: (a: number, b: number) => void;
  readonly mandelsegmentresult_mandel_data: (a: number) => [number, number];
  readonly mandelsegmentresult_smooth_data: (a: number) => [number, number];
  readonly mandel_one_shot: (a: number, b: number, c: number, d: number) => number;
  readonly mandel_compute_segment: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number];
  readonly mandel_compute_segment_with_smooth: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
