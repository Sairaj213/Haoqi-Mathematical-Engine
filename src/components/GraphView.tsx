import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GraphFunction } from '../types';
import { evaluateExpression, numericalDerivative } from '../utils/mathEngine';
import { sound } from '../utils/audio';
import { TactileButton } from './TactileButton';
import { Plus, Eye, EyeOff, Trash2, ZoomIn, ZoomOut, RotateCcw, Crosshair, Sparkles } from 'lucide-react';

export const GraphView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport window [xMin, xMax], [yMin, yMax]
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-6);
  const [yMax, setYMax] = useState<number>(6);

  // Functions list
  const [functions, setFunctions] = useState<GraphFunction[]>([
    { id: '1', name: 'f(x)', expr: 'sin(x * a) * cos(x / 2)', color: '#0066FF', visible: true, derivativeVisible: true, integralVisible: false },
    { id: '2', name: 'g(x)', expr: '0.1 * x^2 - 2', color: '#10B981', visible: true, derivativeVisible: false, integralVisible: false },
  ]);

  // Dynamic parameters
  const [paramA, setParamA] = useState<number>(1.5);
  const [paramB, setParamB] = useState<number>(2.0);

  // Interactive mouse tracker
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Integral bounds
  const [integralA, setIntegralA] = useState<number>(-3);
  const [integralB, setIntegralB] = useState<number>(3);
  const [computedIntegral, setComputedIntegral] = useState<number | null>(null);

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // World to Screen transformation helpers
    const toScreenX = (wx: number) => ((wx - xMin) / (xMax - xMin)) * width;
    const toScreenY = (wy: number) => height - ((wy - yMin) / (yMax - yMin)) * height;
    const toWorldX = (sx: number) => xMin + (sx / width) * (xMax - xMin);
    const toWorldY = (sy: number) => yMin + ((height - sy) / height) * (yMax - yMin);

    // Draw Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.12)';

    // Step calculation based on zoom range
    const xRange = xMax - xMin;
    const step = Math.pow(10, Math.floor(Math.log10(xRange))) / 2 || 1;

    // Vertical grid
    const firstX = Math.ceil(xMin / step) * step;
    for (let x = firstX; x <= xMax; x += step) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();

      // Axis label
      if (Math.abs(x) > 1e-6) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.6)';
        ctx.font = '10px monospace';
        ctx.fillText(Number(x.toFixed(2)).toString(), sx + 3, toScreenY(0) - 4);
      }
    }

    // Horizontal grid
    const firstY = Math.ceil(yMin / step) * step;
    for (let y = firstY; y <= yMax; y += step) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();

      // Axis label
      if (Math.abs(y) > 1e-6) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.6)';
        ctx.font = '10px monospace';
        ctx.fillText(Number(y.toFixed(2)).toString(), toScreenX(0) + 4, sy - 3);
      }
    }

    // Draw Primary Axes
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
    ctx.lineWidth = 1.5;

    // X Axis
    const originY = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y Axis
    const originX = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Scope for evaluation
    const scope: Record<string, unknown> = {
      a: paramA,
      b: paramB,
      pi: Math.PI,
      e: Math.E,
    };

    // Plot Functions
    functions.forEach((fn) => {
      if (!fn.visible || !fn.expr.trim()) return;

      // Plot shaded integral area if enabled
      if (fn.integralVisible) {
        ctx.fillStyle = `${fn.color}22`;
        ctx.beginPath();
        const startSx = toScreenX(Math.max(xMin, integralA));
        const endSx = toScreenX(Math.min(xMax, integralB));

        ctx.moveTo(startSx, originY);

        for (let sx = startSx; sx <= endSx; sx += 2) {
          const wx = toWorldX(sx);
          const evalRes = evaluateExpression(fn.expr, { ...scope, x: wx });
          if (evalRes.success && typeof evalRes.rawResult === 'number' && isFinite(evalRes.rawResult)) {
            ctx.lineTo(sx, toScreenY(evalRes.rawResult));
          }
        }
        ctx.lineTo(endSx, originY);
        ctx.closePath();
        ctx.fill();
      }

      // Plot curve
      ctx.strokeStyle = fn.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let isFirst = true;

      for (let sx = 0; sx <= width; sx += 2) {
        const wx = toWorldX(sx);
        const evalRes = evaluateExpression(fn.expr, { ...scope, x: wx });

        if (evalRes.success && typeof evalRes.rawResult === 'number' && isFinite(evalRes.rawResult)) {
          const sy = toScreenY(evalRes.rawResult);
          if (isFirst) {
            ctx.moveTo(sx, sy);
            isFirst = false;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          isFirst = true;
        }
      }
      ctx.stroke();

      // Plot Tangent Line at mouse position if derivative is enabled
      if (fn.derivativeVisible && mouseCoord) {
        const deriv = numericalDerivative(fn.expr, mouseCoord.x);
        const evalRes = evaluateExpression(fn.expr, { ...scope, x: mouseCoord.x });

        if (deriv !== null && evalRes.success && typeof evalRes.rawResult === 'number') {
          const y0 = evalRes.rawResult;
          const x0 = mouseCoord.x;
          // Tangent equation: y - y0 = m(x - x0) => y = m*(x - x0) + y0
          const tanX1 = x0 - 3;
          const tanY1 = deriv * (tanX1 - x0) + y0;
          const tanX2 = x0 + 3;
          const tanY2 = deriv * (tanX2 - x0) + y0;

          ctx.strokeStyle = `${fn.color}99`;
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(toScreenX(tanX1), toScreenY(tanY1));
          ctx.lineTo(toScreenX(tanX2), toScreenY(tanY2));
          ctx.stroke();
          ctx.setLineDash([]);

          // Tangent point marker
          ctx.fillStyle = fn.color;
          ctx.beginPath();
          ctx.arc(toScreenX(x0), toScreenY(y0), 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Draw Crosshairs Reticle at Mouse Position
    if (mouseCoord) {
      const msx = toScreenX(mouseCoord.x);
      const msy = toScreenY(mouseCoord.y);

      ctx.strokeStyle = 'rgba(128, 128, 128, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);

      ctx.beginPath();
      ctx.moveTo(msx, 0);
      ctx.lineTo(msx, height);
      ctx.moveTo(0, msy);
      ctx.lineTo(width, msy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [xMin, xMax, yMin, yMax, functions, paramA, paramB, mouseCoord, integralA, integralB]);

  // Auto-resize canvas according to container
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = Math.max(380, rect.height || 420);
      drawGraph();
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [drawGraph]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Zoom controls
  const handleZoom = (factor: number) => {
    sound.playClick(factor > 1 ? 1.2 : 0.8);
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const xSpan = ((xMax - xMin) * factor) / 2;
    const ySpan = ((yMax - yMin) * factor) / 2;

    setXMin(xCenter - xSpan);
    setXMax(xCenter + xSpan);
    setYMin(yCenter - ySpan);
    setYMax(yCenter + ySpan);
  };

  const handleResetView = () => {
    sound.playClick();
    setXMin(-10);
    setXMax(10);
    setYMin(-6);
    setYMax(6);
  };

  // Canvas Mouse Interactions (Pan & Coordinate Tracking)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const wx = xMin + (sx / canvas.width) * (xMax - xMin);
    const wy = yMin + ((canvas.height - sy) / canvas.height) * (yMax - yMin);
    setMouseCoord({ x: wx, y: wy });

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      const worldDx = (dx / canvas.width) * (xMax - xMin);
      const worldDy = (dy / canvas.height) * (yMax - yMin);

      setXMin((prev) => prev - worldDx);
      setXMax((prev) => prev - worldDx);
      setYMin((prev) => prev + worldDy);
      setYMax((prev) => prev + worldDy);

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.85;
    handleZoom(factor);
  };

  // Add / toggle function
  const addFunction = () => {
    sound.playClick();
    const colors = ['#0066FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const newColor = colors[functions.length % colors.length];
    const newFn: GraphFunction = {
      id: Math.random().toString(36).substring(2, 7),
      name: `f${functions.length + 1}(x)`,
      expr: 'cos(x)',
      color: newColor,
      visible: true,
    };
    setFunctions([...functions, newFn]);
  };

  const loadPreset = (expr: string) => {
    sound.playSuccess();
    setFunctions([
      { id: '1', name: 'f(x)', expr, color: '#0066FF', visible: true, derivativeVisible: true },
    ]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header & Visualizer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): 2D Canvas Reticle Screen */}
        <div className="lg:col-span-8 border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] shadow-xs relative flex flex-col justify-between space-y-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-main)]">[02] 2D CARTESIAN PLOTTER</span>
              <span className="opacity-40">//</span>
              <span>GRID: AUTO-SCALE</span>
            </div>
            {mouseCoord && (
              <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-main)] tabular-nums">
                <Crosshair className="w-3 h-3 text-[var(--text-accent)]" />
                <span>X: {mouseCoord.x.toFixed(3)}</span>
                <span>Y: {mouseCoord.y.toFixed(3)}</span>
              </div>
            )}
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={containerRef}
            className="w-full h-[400px] sm:h-[460px] bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px] relative overflow-hidden cursor-crosshair select-none"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setMouseCoord(null);
                setIsDragging(false);
              }}
              onWheel={handleWheel}
              className="w-full h-full block"
            />

            {/* Quick Floating Zoom & Pan HUD */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[var(--bg-plate)]/90 backdrop-blur-xs p-1 border border-[var(--border-main)] rounded-[2px] shadow-xs">
              <TactileButton variant="ghost" size="sm" onClick={() => handleZoom(0.8)} title="Zoom In">
                <ZoomIn className="w-3.5 h-3.5" />
              </TactileButton>
              <TactileButton variant="ghost" size="sm" onClick={() => handleZoom(1.25)} title="Zoom Out">
                <ZoomOut className="w-3.5 h-3.5" />
              </TactileButton>
              <TactileButton variant="ghost" size="sm" onClick={handleResetView} title="Reset View">
                <RotateCcw className="w-3.5 h-3.5" />
              </TactileButton>
            </div>
          </div>

          {/* Dynamic Slider Parameters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono">
            <div className="flex items-center gap-3 bg-[var(--bg-plate-subtle)] p-2 rounded-[2px] border border-[var(--border-subtle)]">
              <span className="font-bold text-[var(--text-accent)]">param a:</span>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={paramA}
                onChange={(e) => setParamA(parseFloat(e.target.value))}
                className="w-full accent-[var(--text-main)] cursor-pointer"
              />
              <span className="w-10 text-right tabular-nums">{paramA.toFixed(1)}</span>
            </div>

            <div className="flex items-center gap-3 bg-[var(--bg-plate-subtle)] p-2 rounded-[2px] border border-[var(--border-subtle)]">
              <span className="font-bold text-emerald-500">param b:</span>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={paramB}
                onChange={(e) => setParamB(parseFloat(e.target.value))}
                className="w-full accent-[var(--text-main)] cursor-pointer"
              />
              <span className="w-10 text-right tabular-nums">{paramB.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Function Stack & Presets */}
        <div className="lg:col-span-4 space-y-4">
          {/* Function Stack Panel */}
          <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
              <span className="font-semibold text-[var(--text-main)] uppercase tracking-wider">
                FUNCTION REPERTOIRE
              </span>
              <TactileButton variant="ghost" size="sm" onClick={addFunction}>
                <Plus className="w-3 h-3" />
                <span>ADD</span>
              </TactileButton>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {functions.map((fn, idx) => (
                <div
                  key={fn.id}
                  className="p-2.5 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fn.color }} />
                      <span className="font-bold text-[var(--text-main)]">{fn.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const updated = [...functions];
                          updated[idx].derivativeVisible = !updated[idx].derivativeVisible;
                          setFunctions(updated);
                        }}
                        title="Toggle Tangent Line f'(x)"
                        className={`text-[10px] px-1.5 py-0.5 border rounded-[2px] ${
                          fn.derivativeVisible ? 'bg-[var(--text-main)] text-[var(--bg-root)]' : 'opacity-50'
                        }`}
                      >
                        f&apos;(x)
                      </button>

                      <button
                        onClick={() => {
                          const updated = [...functions];
                          updated[idx].integralVisible = !updated[idx].integralVisible;
                          setFunctions(updated);
                        }}
                        title="Toggle Shaded Integral Area"
                        className={`text-[10px] px-1.5 py-0.5 border rounded-[2px] ${
                          fn.integralVisible ? 'bg-[var(--text-main)] text-[var(--bg-root)]' : 'opacity-50'
                        }`}
                      >
                        ∫dx
                      </button>

                      <button
                        onClick={() => {
                          const updated = [...functions];
                          updated[idx].visible = !updated[idx].visible;
                          setFunctions(updated);
                        }}
                        className="p-1 opacity-70 hover:opacity-100"
                      >
                        {fn.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {functions.length > 1 && (
                        <button
                          onClick={() => {
                            setFunctions(functions.filter((f) => f.id !== fn.id));
                          }}
                          className="p-1 text-red-500 opacity-70 hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={fn.expr}
                    onChange={(e) => {
                      const updated = [...functions];
                      updated[idx].expr = e.target.value;
                      setFunctions(updated);
                    }}
                    className="w-full bg-[var(--bg-plate)] font-mono text-xs p-1.5 border border-[var(--border-main)] rounded-[2px] outline-none focus:border-[var(--text-accent)] text-[var(--text-main)]"
                    placeholder="e.g. sin(x) + a*x"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Presets */}
          <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--text-accent)]" />
              <span className="font-semibold text-[var(--text-main)] uppercase tracking-wider">
                CURVE PRESETS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => loadPreset('exp(-x^2 / 2) / sqrt(2 * pi)')}
              >
                Gaussian Bell
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => loadPreset('sin(x) / x')}
              >
                Sinc Function
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => loadPreset('exp(-0.2 * x) * sin(3 * x)')}
              >
                Damped Wave
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => loadPreset('1 / (1 + exp(-x))')}
              >
                Sigmoid
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => loadPreset('x^3 - 3*x')}
              >
                Cubic Extrema
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => loadPreset('abs(sin(x)) + 0.5*cos(3*x)')}
              >
                Harmonic Rect
              </TactileButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
