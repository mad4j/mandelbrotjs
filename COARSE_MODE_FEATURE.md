# Coarse Mode for Animation Sequences

## Overview
This feature implements coarse mode rendering during animation sequences as requested in issue #61. The system automatically renders at quarter resolution during continuous interactions and switches back to full resolution when interactions stop.

## Implementation Details

### Key Components:
1. **Coarse Mode Variables**: Added timer mechanism and state tracking
2. **Automatic Detection**: Triggers coarse mode during:
   - Mouse dragging
   - Touch movement/pinch zooming  
   - Wheel zooming
   - Color cycling animation
3. **Performance Timer**: 300ms delay before switching back to fine mode

### Performance Improvements:
- **Coarse Mode**: ~640×360 resolution, ~28ms rendering time
- **Fine Mode**: 1280×720 resolution, ~109ms rendering time
- **Performance Gain**: ~75% faster rendering during interactions

### Console Output Example:
```
[LOG] Enabling coarse mode for animation
[LOG] WASM params: zoom=180, canvasWidth=640 (coarse mode)
[LOG] WASM unified computation took 28.85ms
[LOG] Switching back to fine mode  
[LOG] WASM params: zoom=360, canvasWidth=1280 (fine mode)
[LOG] WASM unified computation took 109.77ms
```

## Technical Implementation

### Functions Added:
- `enableCoarseMode()`: Activates coarse mode and logs status
- `scheduleFineModeSwitch()`: Sets timer to return to fine mode
- `shouldUseCoarseMode()`: Returns current mode state

### Modified Functions:
- `startRender()`: Uses coarse mode when `shouldUseCoarseMode()` returns true
- `mouseMove()`, `touchMove()`, `wheelMoved()`: Enable coarse mode during interaction
- `mouseup`, `touchEnd()`: Schedule return to fine mode
- `toggleRotatePalette()`: Manages coarse mode for color cycling

## User Experience
- Smooth real-time interaction during panning/zooming
- Automatic high-quality rendering when interaction stops
- No user intervention required - fully automatic
- Maintains visual fidelity for final viewing