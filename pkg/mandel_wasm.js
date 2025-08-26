let wasm_bindgen;
(function() {
    const __exports = {};
    let script_src;
    if (typeof document !== 'undefined' && document.currentScript !== null) {
        script_src = new URL(document.currentScript.src, location.href).toString();
    }
    let wasm = undefined;

    const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

    if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

    let cachedUint8ArrayMemory0 = null;

    function getUint8ArrayMemory0() {
        if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
            cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8ArrayMemory0;
    }

    function getStringFromWasm0(ptr, len) {
        ptr = ptr >>> 0;
        return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
    }

    function getArrayU8FromWasm0(ptr, len) {
        ptr = ptr >>> 0;
        return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
    }
    /**
     * @param {number} x_norm
     * @param {number} y_norm
     * @param {number} iter_max
     * @param {boolean} smooth
     * @returns {MandelComputeResult}
     */
    __exports.mandel_one_shot = function(x_norm, y_norm, iter_max, smooth) {
        const ret = wasm.mandel_one_shot(x_norm, y_norm, iter_max, smooth);
        return MandelComputeResult.__wrap(ret);
    };

    /**
     * @param {number} start_line
     * @param {number} segment_height
     * @param {number} canvas_width
     * @param {number} screen_x
     * @param {number} screen_y
     * @param {number} zoom
     * @param {number} iter_max
     * @param {boolean} smooth
     * @param {number} block_size
     * @returns {Uint8Array}
     */
    __exports.mandel_compute_segment_optimized = function(start_line, segment_height, canvas_width, screen_x, screen_y, zoom, iter_max, smooth, block_size) {
        const ret = wasm.mandel_compute_segment_optimized(start_line, segment_height, canvas_width, screen_x, screen_y, zoom, iter_max, smooth, block_size);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    };

    /**
     * @param {number} start_line
     * @param {number} segment_height
     * @param {number} canvas_width
     * @param {number} screen_x
     * @param {number} screen_y
     * @param {number} zoom
     * @param {number} iter_max
     * @param {number} block_size
     * @returns {MandelSegmentResultOptimized}
     */
    __exports.mandel_compute_segment_with_smooth_optimized = function(start_line, segment_height, canvas_width, screen_x, screen_y, zoom, iter_max, block_size) {
        const ret = wasm.mandel_compute_segment_with_smooth_optimized(start_line, segment_height, canvas_width, screen_x, screen_y, zoom, iter_max, block_size);
        return MandelSegmentResultOptimized.__wrap(ret);
    };

    function _assertClass(instance, klass) {
        if (!(instance instanceof klass)) {
            throw new Error(`expected instance of ${klass.name}`);
        }
    }
    /**
     * Main unified API: Generate complete Mandelbrot image with specified parameters
     * This is the primary function that embodies the refactoring requirements:
     * - Accepts complex plane interval, canvas size, max iterations, quality flag
     * - Handles aggressive multithreading internally
     * - Returns ready-to-display image data
     * @param {MandelParameters} params
     * @returns {MandelImageResult}
     */
    __exports.generate_mandelbrot_image = function(params) {
        _assertClass(params, MandelParameters);
        const ret = wasm.generate_mandelbrot_image(params.__wbg_ptr);
        return MandelImageResult.__wrap(ret);
    };

    /**
     * Generate a segment of the Mandelbrot image for worker-based parallel processing
     * This function supports aggressive multithreading by generating image segments
     * @param {MandelParameters} params
     * @param {number} segment_start_y
     * @param {number} segment_height
     * @returns {MandelSegmentImageResult}
     */
    __exports.generate_mandelbrot_segment = function(params, segment_start_y, segment_height) {
        _assertClass(params, MandelParameters);
        const ret = wasm.generate_mandelbrot_segment(params.__wbg_ptr, segment_start_y, segment_height);
        return MandelSegmentImageResult.__wrap(ret);
    };

    /**
     * Dynamic iteration calculation based on zoom level
     * This implements the requirement for dynamic iteration calculation relative to zoom
     * @param {number} zoom
     * @param {number} base_iterations
     * @param {number} max_iterations
     * @returns {number}
     */
    __exports.calculate_optimal_iterations = function(zoom, base_iterations, max_iterations) {
        const ret = wasm.calculate_optimal_iterations(zoom, base_iterations, max_iterations);
        return ret;
    };

    const MandelComputeResultFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_mandelcomputeresult_free(ptr >>> 0, 1));

    class MandelComputeResult {

        static __wrap(ptr) {
            ptr = ptr >>> 0;
            const obj = Object.create(MandelComputeResult.prototype);
            obj.__wbg_ptr = ptr;
            MandelComputeResultFinalization.register(obj, obj.__wbg_ptr, obj);
            return obj;
        }

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            MandelComputeResultFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_mandelcomputeresult_free(ptr, 0);
        }
        /**
         * @returns {number}
         */
        get iterations() {
            const ret = wasm.mandelcomputeresult_iterations(this.__wbg_ptr);
            return ret;
        }
        /**
         * @returns {number}
         */
        get escape_radius() {
            const ret = wasm.mandelcomputeresult_escape_radius(this.__wbg_ptr);
            return ret;
        }
    }
    __exports.MandelComputeResult = MandelComputeResult;

    const MandelImageResultFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_mandelimageresult_free(ptr >>> 0, 1));

    class MandelImageResult {

        static __wrap(ptr) {
            ptr = ptr >>> 0;
            const obj = Object.create(MandelImageResult.prototype);
            obj.__wbg_ptr = ptr;
            MandelImageResultFinalization.register(obj, obj.__wbg_ptr, obj);
            return obj;
        }

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            MandelImageResultFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_mandelimageresult_free(ptr, 0);
        }
        /**
         * @returns {Uint8Array}
         */
        get image_data() {
            const ret = wasm.mandelimageresult_image_data(this.__wbg_ptr);
            var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
            return v1;
        }
        /**
         * @returns {number}
         */
        get width() {
            const ret = wasm.mandelimageresult_width(this.__wbg_ptr);
            return ret;
        }
        /**
         * @returns {number}
         */
        get height() {
            const ret = wasm.mandelimageresult_height(this.__wbg_ptr);
            return ret;
        }
        /**
         * @returns {number}
         */
        get computation_time_ms() {
            const ret = wasm.mandelcomputeresult_escape_radius(this.__wbg_ptr);
            return ret;
        }
    }
    __exports.MandelImageResult = MandelImageResult;

    const MandelParametersFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_mandelparameters_free(ptr >>> 0, 1));

    class MandelParameters {

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            MandelParametersFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_mandelparameters_free(ptr, 0);
        }
        /**
         * @returns {number}
         */
        get min_real() {
            const ret = wasm.__wbg_get_mandelparameters_min_real(this.__wbg_ptr);
            return ret;
        }
        /**
         * @param {number} arg0
         */
        set min_real(arg0) {
            wasm.__wbg_set_mandelparameters_min_real(this.__wbg_ptr, arg0);
        }
        /**
         * @returns {number}
         */
        get max_real() {
            const ret = wasm.__wbg_get_mandelparameters_max_real(this.__wbg_ptr);
            return ret;
        }
        /**
         * @param {number} arg0
         */
        set max_real(arg0) {
            wasm.__wbg_set_mandelparameters_max_real(this.__wbg_ptr, arg0);
        }
        /**
         * @returns {number}
         */
        get min_imag() {
            const ret = wasm.__wbg_get_mandelparameters_min_imag(this.__wbg_ptr);
            return ret;
        }
        /**
         * @param {number} arg0
         */
        set min_imag(arg0) {
            wasm.__wbg_set_mandelparameters_min_imag(this.__wbg_ptr, arg0);
        }
        /**
         * @returns {number}
         */
        get max_imag() {
            const ret = wasm.__wbg_get_mandelparameters_max_imag(this.__wbg_ptr);
            return ret;
        }
        /**
         * @param {number} arg0
         */
        set max_imag(arg0) {
            wasm.__wbg_set_mandelparameters_max_imag(this.__wbg_ptr, arg0);
        }
        /**
         * @returns {number}
         */
        get canvas_width() {
            const ret = wasm.__wbg_get_mandelparameters_canvas_width(this.__wbg_ptr);
            return ret;
        }
        /**
         * @param {number} arg0
         */
        set canvas_width(arg0) {
            wasm.__wbg_set_mandelparameters_canvas_width(this.__wbg_ptr, arg0);
        }
        /**
         * @returns {number}
         */
        get canvas_height() {
            const ret = wasm.__wbg_get_mandelparameters_canvas_height(this.__wbg_ptr);
            return ret;
        }
        /**
         * @param {number} arg0
         */
        set canvas_height(arg0) {
            wasm.__wbg_set_mandelparameters_canvas_height(this.__wbg_ptr, arg0);
        }
        /**
         * @returns {number}
         */
        get max_iterations() {
            const ret = wasm.__wbg_get_mandelparameters_max_iterations(this.__wbg_ptr);
            return ret;
        }
        /**
         * @param {number} arg0
         */
        set max_iterations(arg0) {
            wasm.__wbg_set_mandelparameters_max_iterations(this.__wbg_ptr, arg0);
        }
        /**
         * @returns {boolean}
         */
        get smooth_rendering() {
            const ret = wasm.__wbg_get_mandelparameters_smooth_rendering(this.__wbg_ptr);
            return ret !== 0;
        }
        /**
         * @param {boolean} arg0
         */
        set smooth_rendering(arg0) {
            wasm.__wbg_set_mandelparameters_smooth_rendering(this.__wbg_ptr, arg0);
        }
        /**
         * @returns {number}
         */
        get block_size() {
            const ret = wasm.__wbg_get_mandelparameters_block_size(this.__wbg_ptr);
            return ret;
        }
        /**
         * @param {number} arg0
         */
        set block_size(arg0) {
            wasm.__wbg_set_mandelparameters_block_size(this.__wbg_ptr, arg0);
        }
        /**
         * @param {number} min_real
         * @param {number} max_real
         * @param {number} min_imag
         * @param {number} max_imag
         * @param {number} canvas_width
         * @param {number} canvas_height
         * @param {number} max_iterations
         * @param {boolean} smooth_rendering
         * @param {number} block_size
         */
        constructor(min_real, max_real, min_imag, max_imag, canvas_width, canvas_height, max_iterations, smooth_rendering, block_size) {
            const ret = wasm.mandelparameters_new(min_real, max_real, min_imag, max_imag, canvas_width, canvas_height, max_iterations, smooth_rendering, block_size);
            this.__wbg_ptr = ret >>> 0;
            MandelParametersFinalization.register(this, this.__wbg_ptr, this);
            return this;
        }
        /**
         * @returns {number}
         */
        get zoom() {
            const ret = wasm.mandelparameters_zoom(this.__wbg_ptr);
            return ret;
        }
        /**
         * @returns {number}
         */
        get center_real() {
            const ret = wasm.mandelparameters_center_real(this.__wbg_ptr);
            return ret;
        }
        /**
         * @returns {number}
         */
        get center_imag() {
            const ret = wasm.mandelparameters_center_imag(this.__wbg_ptr);
            return ret;
        }
    }
    __exports.MandelParameters = MandelParameters;

    const MandelSegmentImageResultFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_mandelsegmentimageresult_free(ptr >>> 0, 1));

    class MandelSegmentImageResult {

        static __wrap(ptr) {
            ptr = ptr >>> 0;
            const obj = Object.create(MandelSegmentImageResult.prototype);
            obj.__wbg_ptr = ptr;
            MandelSegmentImageResultFinalization.register(obj, obj.__wbg_ptr, obj);
            return obj;
        }

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            MandelSegmentImageResultFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_mandelsegmentimageresult_free(ptr, 0);
        }
        /**
         * @returns {Uint8Array}
         */
        get image_data() {
            const ret = wasm.mandelsegmentimageresult_image_data(this.__wbg_ptr);
            var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
            return v1;
        }
        /**
         * @returns {number}
         */
        get segment_height() {
            const ret = wasm.mandelimageresult_width(this.__wbg_ptr);
            return ret;
        }
        /**
         * @returns {number}
         */
        get computation_time_ms() {
            const ret = wasm.mandelcomputeresult_escape_radius(this.__wbg_ptr);
            return ret;
        }
    }
    __exports.MandelSegmentImageResult = MandelSegmentImageResult;

    const MandelSegmentResultFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_mandelsegmentresult_free(ptr >>> 0, 1));

    class MandelSegmentResult {

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            MandelSegmentResultFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_mandelsegmentresult_free(ptr, 0);
        }
        /**
         * @returns {Uint8Array}
         */
        get mandel_data() {
            const ret = wasm.mandelsegmentresult_mandel_data(this.__wbg_ptr);
            var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
            return v1;
        }
        /**
         * @returns {Uint8Array}
         */
        get smooth_data() {
            const ret = wasm.mandelsegmentresult_smooth_data(this.__wbg_ptr);
            var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
            return v1;
        }
    }
    __exports.MandelSegmentResult = MandelSegmentResult;

    const MandelSegmentResultOptimizedFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_mandelsegmentresultoptimized_free(ptr >>> 0, 1));

    class MandelSegmentResultOptimized {

        static __wrap(ptr) {
            ptr = ptr >>> 0;
            const obj = Object.create(MandelSegmentResultOptimized.prototype);
            obj.__wbg_ptr = ptr;
            MandelSegmentResultOptimizedFinalization.register(obj, obj.__wbg_ptr, obj);
            return obj;
        }

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            MandelSegmentResultOptimizedFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_mandelsegmentresultoptimized_free(ptr, 0);
        }
        /**
         * @returns {Uint8Array}
         */
        get mandel_data() {
            const ret = wasm.mandelsegmentresultoptimized_mandel_data(this.__wbg_ptr);
            var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
            return v1;
        }
        /**
         * @returns {Uint8Array}
         */
        get smooth_data() {
            const ret = wasm.mandelsegmentresultoptimized_smooth_data(this.__wbg_ptr);
            var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
            return v1;
        }
    }
    __exports.MandelSegmentResultOptimized = MandelSegmentResultOptimized;

    async function __wbg_load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    function __wbg_get_imports() {
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbg_now_807e54c39636c349 = function() {
            const ret = Date.now();
            return ret;
        };
        imports.wbg.__wbindgen_init_externref_table = function() {
            const table = wasm.__wbindgen_export_0;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
            ;
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };

        return imports;
    }

    function __wbg_init_memory(imports, memory) {

    }

    function __wbg_finalize_init(instance, module) {
        wasm = instance.exports;
        __wbg_init.__wbindgen_wasm_module = module;
        cachedUint8ArrayMemory0 = null;


        wasm.__wbindgen_start();
        return wasm;
    }

    function initSync(module) {
        if (wasm !== undefined) return wasm;


        if (typeof module !== 'undefined') {
            if (Object.getPrototypeOf(module) === Object.prototype) {
                ({module} = module)
            } else {
                console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
            }
        }

        const imports = __wbg_get_imports();

        __wbg_init_memory(imports);

        if (!(module instanceof WebAssembly.Module)) {
            module = new WebAssembly.Module(module);
        }

        const instance = new WebAssembly.Instance(module, imports);

        return __wbg_finalize_init(instance, module);
    }

    async function __wbg_init(module_or_path) {
        if (wasm !== undefined) return wasm;


        if (typeof module_or_path !== 'undefined') {
            if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
                ({module_or_path} = module_or_path)
            } else {
                console.warn('using deprecated parameters for the initialization function; pass a single object instead')
            }
        }

        if (typeof module_or_path === 'undefined' && typeof script_src !== 'undefined') {
            module_or_path = script_src.replace(/\.js$/, '_bg.wasm');
        }
        const imports = __wbg_get_imports();

        if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
            module_or_path = fetch(module_or_path);
        }

        __wbg_init_memory(imports);

        const { instance, module } = await __wbg_load(await module_or_path, imports);

        return __wbg_finalize_init(instance, module);
    }

    wasm_bindgen = Object.assign(__wbg_init, { initSync }, __exports);

})();
