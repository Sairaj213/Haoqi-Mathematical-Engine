import React, { useState } from 'react';
import { MatrixData } from '../types';
import { createMatrix, computeMatrixOps } from '../utils/mathEngine';
import { sound } from '../utils/audio';
import { TactileButton } from './TactileButton';
import { Grid, Sparkles, ArrowRight, RefreshCw, Equal } from 'lucide-react';

export const MatrixView: React.FC = () => {
  const [matrixA, setMatrixA] = useState<MatrixData>({
    rows: 2,
    cols: 2,
    data: [
      [3, 2],
      [1, 4],
    ],
  });

  const [matrixB, setMatrixB] = useState<MatrixData>({
    rows: 2,
    cols: 2,
    data: [
      [1, 0],
      [2, 3],
    ],
  });

  const [scalarK, setScalarK] = useState<number>(2);
  const [activeSubTab, setActiveSubTab] = useState<'properties' | 'arithmetic' | 'vectors'>('properties');

  // Vector states
  const [vecU, setVecU] = useState<number[]>([3, 4, 0]);
  const [vecV, setVecV] = useState<number[]>([1, 2, 2]);

  const updateCell = (target: 'A' | 'B', r: number, c: number, val: number) => {
    if (target === 'A') {
      const next = matrixA.data.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? val : cell))
      );
      setMatrixA({ ...matrixA, data: next });
    } else {
      const next = matrixB.data.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? val : cell))
      );
      setMatrixB({ ...matrixB, data: next });
    }
  };

  const resizeMatrix = (target: 'A' | 'B', rows: number, cols: number) => {
    sound.playClick();
    const newMat = createMatrix(rows, cols, 0);
    const oldMat = target === 'A' ? matrixA : matrixB;

    for (let r = 0; r < Math.min(rows, oldMat.rows); r++) {
      for (let c = 0; c < Math.min(cols, oldMat.cols); c++) {
        newMat.data[r][c] = oldMat.data[r][c];
      }
    }

    if (target === 'A') setMatrixA(newMat);
    else setMatrixB(newMat);
  };

  const opsA = computeMatrixOps(matrixA, matrixB);

  // Vector computations
  const dotProduct = vecU.reduce((acc, val, i) => acc + val * (vecV[i] || 0), 0);
  const magU = Math.sqrt(vecU.reduce((acc, val) => acc + val * val, 0));
  const magV = Math.sqrt(vecV.reduce((acc, val) => acc + val * val, 0));
  const angleRad = magU && magV ? Math.acos(Math.max(-1, Math.min(1, dotProduct / (magU * magV)))) : 0;
  const angleDeg = (angleRad * 180) / Math.PI;
  const crossProduct = [
    vecU[1] * vecV[2] - vecU[2] * vecV[1],
    vecU[2] * vecV[0] - vecU[0] * vecV[2],
    vecU[0] * vecV[1] - vecU[1] * vecV[0],
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2">
        <TactileButton
          variant={activeSubTab === 'properties' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSubTab('properties')}
        >
          MATRIX A ANALYSIS
        </TactileButton>
        <TactileButton
          variant={activeSubTab === 'arithmetic' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSubTab('arithmetic')}
        >
          A & B OPERATIONS
        </TactileButton>
        <TactileButton
          variant={activeSubTab === 'vectors' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSubTab('vectors')}
        >
          2D / 3D VECTOR LAB
        </TactileButton>
      </div>

      {/* Main Grid */}
      {activeSubTab === 'properties' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Matrix A Editor (6 cols) */}
          <div className="lg:col-span-6 border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
              <span className="font-bold text-[var(--text-main)]">[03] MATRIX A</span>
              <div className="flex items-center gap-1">
                {[2, 3, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => resizeMatrix('A', size, size)}
                    className={`px-2 py-0.5 text-[10px] border rounded-[2px] ${
                      matrixA.rows === size && matrixA.cols === size
                        ? 'bg-[var(--text-main)] text-[var(--bg-root)]'
                        : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="flex items-center justify-center p-4 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="relative p-2 border-l-2 border-r-2 border-[var(--text-main)]">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${matrixA.cols}, minmax(0, 1fr))` }}
                >
                  {matrixA.data.map((row, r) =>
                    row.map((val, c) => (
                      <input
                        key={`${r}-${c}`}
                        type="number"
                        step="any"
                        value={val}
                        onChange={(e) => updateCell('A', r, c, parseFloat(e.target.value) || 0)}
                        className="w-14 sm:w-16 h-10 sm:h-11 text-center font-mono text-sm font-semibold bg-[var(--bg-plate)] border border-[var(--border-main)] rounded-[2px] outline-none focus:border-[var(--text-accent)] text-[var(--text-main)]"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-2 text-xs font-mono">
              <span className="text-[var(--text-muted)] text-[10px]">PRESETS:</span>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setMatrixA({
                    rows: 2,
                    cols: 2,
                    data: [
                      [1, 0],
                      [0, 1],
                    ],
                  });
                }}
              >
                Identity
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setMatrixA({
                    rows: 2,
                    cols: 2,
                    data: [
                      [0, -1],
                      [1, 0],
                    ],
                  });
                }}
              >
                90° Rotation
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setMatrixA({
                    rows: 3,
                    cols: 3,
                    data: [
                      [1, 2, 3],
                      [0, 1, 4],
                      [5, 6, 0],
                    ],
                  });
                }}
              >
                3×3 Invertible
              </TactileButton>
            </div>
          </div>

          {/* Right: Matrix A Properties & Analytics (6 cols) */}
          <div className="lg:col-span-6 border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
              <span className="font-semibold text-[var(--text-main)] uppercase tracking-wider">
                COMPUTED SPECTRAL ATTRIBUTES
              </span>
              <span className="tabular-nums font-mono text-[10px]">DIM: {matrixA.rows}×{matrixA.cols}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Determinant |A|</div>
                <div className="text-lg font-bold text-[var(--text-main)] tabular-nums mt-1">
                  {opsA.det !== undefined ? opsA.det : 'N/A (Not Square)'}
                </div>
              </div>

              <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Trace tr(A)</div>
                <div className="text-lg font-bold text-[var(--text-main)] tabular-nums mt-1">
                  {opsA.trace !== undefined ? opsA.trace : 'N/A'}
                </div>
              </div>
            </div>

            {/* Eigenvalues */}
            {Array.isArray(opsA.eigenvalues) && (
              <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] font-mono text-xs space-y-1">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Eigenvalues λ</div>
                <div className="flex items-center gap-3 font-bold text-[var(--text-accent)] mt-1">
                  {opsA.eigenvalues.map((ev, i) => (
                    <span key={i}>λ{i + 1} = {String(ev)}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Transpose */}
            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-2 font-mono text-xs">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Transpose Aᵀ</div>
              <div className="flex items-center gap-3">
                <div className="border-l border-r border-[var(--text-main)] px-2 py-1 flex flex-col gap-1">
                  {(opsA.transpose as number[][])?.map((row, r) => (
                    <div key={r} className="flex gap-3 text-center">
                      {row.map((val, c) => (
                        <span key={c} className="w-8 tabular-nums font-semibold">{val}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inverse */}
            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-2 font-mono text-xs">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Inverse A⁻¹</div>
              {Array.isArray(opsA.inverse) ? (
                <div className="border-l border-r border-[var(--text-main)] px-2 py-1 inline-flex flex-col gap-1">
                  {opsA.inverse.map((row: number[], r: number) => (
                    <div key={r} className="flex gap-3 text-center">
                      {row.map((val: number, c: number) => (
                        <span key={c} className="w-12 tabular-nums font-semibold">{val}</span>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-[var(--text-muted)]">
                  {String(opsA.inverse || 'Non-invertible matrix')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Arithmetic Tab */}
      {activeSubTab === 'arithmetic' && (
        <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matrix A */}
            <div className="space-y-2 font-mono">
              <div className="text-xs font-bold text-[var(--text-main)]">MATRIX A</div>
              <div className="p-3 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px] inline-flex">
                <div className="border-l border-r border-[var(--text-main)] px-2 py-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${matrixA.cols}, minmax(0, 1fr))` }}>
                  {matrixA.data.map((row, r) =>
                    row.map((val, c) => (
                      <input
                        key={`a-${r}-${c}`}
                        type="number"
                        value={val}
                        onChange={(e) => updateCell('A', r, c, parseFloat(e.target.value) || 0)}
                        className="w-12 h-8 text-center text-xs bg-[var(--bg-plate)] border border-[var(--border-main)] rounded-[1px]"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Matrix B */}
            <div className="space-y-2 font-mono">
              <div className="text-xs font-bold text-[var(--text-main)]">MATRIX B</div>
              <div className="p-3 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px] inline-flex">
                <div className="border-l border-r border-[var(--text-main)] px-2 py-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${matrixB.cols}, minmax(0, 1fr))` }}>
                  {matrixB.data.map((row, r) =>
                    row.map((val, c) => (
                      <input
                        key={`b-${r}-${c}`}
                        type="number"
                        value={val}
                        onChange={(e) => updateCell('B', r, c, parseFloat(e.target.value) || 0)}
                        className="w-12 h-8 text-center text-xs bg-[var(--bg-plate)] border border-[var(--border-main)] rounded-[1px]"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Computed Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-subtle)] font-mono text-xs">
            {/* A + B */}
            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">Addition A + B</div>
              {Array.isArray(opsA.add) ? (
                <div className="border-l border-r border-[var(--text-main)] px-2 py-1 inline-flex flex-col gap-1">
                  {(opsA.add as number[][]).map((row, r) => (
                    <div key={r} className="flex gap-2">
                      {row.map((val, c) => (
                        <span key={c} className="w-8 text-center tabular-nums font-semibold">{val}</span>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-red-500">Dimensions must match</span>
              )}
            </div>

            {/* A - B */}
            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">Subtraction A − B</div>
              {Array.isArray(opsA.sub) ? (
                <div className="border-l border-r border-[var(--text-main)] px-2 py-1 inline-flex flex-col gap-1">
                  {(opsA.sub as number[][]).map((row, r) => (
                    <div key={r} className="flex gap-2">
                      {row.map((val, c) => (
                        <span key={c} className="w-8 text-center tabular-nums font-semibold">{val}</span>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-red-500">Dimensions must match</span>
              )}
            </div>

            {/* A × B */}
            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">Multiplication A × B</div>
              {Array.isArray(opsA.mult) ? (
                <div className="border-l border-r border-[var(--text-main)] px-2 py-1 inline-flex flex-col gap-1">
                  {(opsA.mult as number[][]).map((row, r) => (
                    <div key={r} className="flex gap-2">
                      {row.map((val, c) => (
                        <span key={c} className="w-8 text-center tabular-nums font-semibold">{val}</span>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-red-500">Columns of A must match Rows of B</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vectors Tab */}
      {activeSubTab === 'vectors' && (
        <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-6 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-[var(--text-accent)]">VECTOR u = [ux, uy, uz]</div>
              <div className="flex gap-2">
                {vecU.map((v, i) => (
                  <input
                    key={i}
                    type="number"
                    value={v}
                    onChange={(e) => {
                      const next = [...vecU];
                      next[i] = parseFloat(e.target.value) || 0;
                      setVecU(next);
                    }}
                    className="w-16 h-9 text-center text-xs bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px]"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-500">VECTOR v = [vx, vy, vz]</div>
              <div className="flex gap-2">
                {vecV.map((v, i) => (
                  <input
                    key={i}
                    type="number"
                    value={v}
                    onChange={(e) => {
                      const next = [...vecV];
                      next[i] = parseFloat(e.target.value) || 0;
                      setVecV(next);
                    }}
                    className="w-16 h-9 text-center text-xs bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px]"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-4 border-t border-[var(--border-subtle)]">
            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">DOT PRODUCT u · v</div>
              <div className="text-base font-bold text-[var(--text-main)] mt-1">{dotProduct.toFixed(4)}</div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">MAGNITUDE ||u||, ||v||</div>
              <div className="text-xs font-bold text-[var(--text-main)] mt-1">
                {magU.toFixed(3)}, {magV.toFixed(3)}
              </div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">ANGLE θ</div>
              <div className="text-base font-bold text-[var(--text-main)] mt-1">{angleDeg.toFixed(2)}°</div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">CROSS PRODUCT u × v</div>
              <div className="text-xs font-bold text-[var(--text-main)] mt-1">
                [{crossProduct.join(', ')}]
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
