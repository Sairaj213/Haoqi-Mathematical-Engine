import React, { useState } from 'react';
import { numericalDerivative, numericalIntegral, evaluateExpression } from '../utils/mathEngine';
import { sound } from '../utils/audio';
import { TactileButton } from './TactileButton';
import { Sigma, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';

export const CalculusView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'integral' | 'derivative' | 'series' | 'limits'>('integral');

  // Integral state
  const [intFn, setIntFn] = useState<string>('sin(x) * e^(-x)');
  const [intA, setIntA] = useState<number>(0);
  const [intB, setIntB] = useState<number>(3.14159);
  const [intN, setIntN] = useState<number>(500);
  const [intResult, setIntResult] = useState<number | null>(null);

  // Derivative state
  const [diffFn, setDiffFn] = useState<string>('x^3 - 3*x^2 + 2*x');
  const [diffX0, setDiffX0] = useState<number>(2);
  const [diffResult, setDiffResult] = useState<number | null>(null);
  const [diffSecond, setDiffSecond] = useState<number | null>(null);

  // Series state
  const [seriesFn, setSeriesFn] = useState<string>('1 / (n^2)');
  const [seriesStart, setSeriesStart] = useState<number>(1);
  const [seriesEnd, setSeriesEnd] = useState<number>(100);
  const [seriesSum, setSeriesSum] = useState<number | null>(null);
  const [seriesProd, setSeriesProd] = useState<number | null>(null);

  // Limits state
  const [limitFn, setLimitFn] = useState<string>('sin(x) / x');
  const [limitC, setLimitC] = useState<number>(0);
  const [limitApproaches, setLimitApproaches] = useState<{ delta: number; left: number; right: number }[]>([]);

  // Handlers
  const calculateIntegral = () => {
    sound.playSuccess();
    const res = numericalIntegral(intFn, intA, intB, intN);
    setIntResult(res);
  };

  const calculateDerivative = () => {
    sound.playSuccess();
    const d1 = numericalDerivative(diffFn, diffX0, 1e-5);
    // second derivative via central difference of first derivative
    const d2_1 = numericalDerivative(diffFn, diffX0 + 1e-4, 1e-5);
    const d2_2 = numericalDerivative(diffFn, diffX0 - 1e-4, 1e-5);
    const d2 = d2_1 !== null && d2_2 !== null ? (d2_1 - d2_2) / (2e-4) : null;

    setDiffResult(d1);
    setDiffSecond(d2);
  };

  const calculateSeries = () => {
    sound.playSuccess();
    let sum = 0;
    let prod = 1;
    for (let n = seriesStart; n <= Math.min(seriesStart + 5000, seriesEnd); n++) {
      const evalRes = evaluateExpression(seriesFn, { n, pi: Math.PI, e: Math.E });
      if (evalRes.success && typeof evalRes.rawResult === 'number' && isFinite(evalRes.rawResult)) {
        sum += evalRes.rawResult;
        if (prod !== 0) prod *= evalRes.rawResult;
      }
    }
    setSeriesSum(sum);
    setSeriesProd(prod);
  };

  const calculateLimit = () => {
    sound.playSuccess();
    const deltas = [0.1, 0.01, 0.001, 0.0001, 0.00001];
    const rows = deltas.map((d) => {
      const leftRes = evaluateExpression(limitFn, { x: limitC - d, pi: Math.PI, e: Math.E });
      const rightRes = evaluateExpression(limitFn, { x: limitC + d, pi: Math.PI, e: Math.E });
      return {
        delta: d,
        left: typeof leftRes.rawResult === 'number' ? leftRes.rawResult : NaN,
        right: typeof rightRes.rawResult === 'number' ? rightRes.rawResult : NaN,
      };
    });
    setLimitApproaches(rows);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2 overflow-x-auto">
        <TactileButton
          variant={activeTab === 'integral' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('integral')}
        >
          DEFINITE INTEGRATION ∫
        </TactileButton>
        <TactileButton
          variant={activeTab === 'derivative' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('derivative')}
        >
          DERIVATIVES d/dx & d²/dx²
        </TactileButton>
        <TactileButton
          variant={activeTab === 'series' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('series')}
        >
          DISCRETE SERIES ∑ / ∏
        </TactileButton>
        <TactileButton
          variant={activeTab === 'limits' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('limits')}
        >
          NUMERICAL LIMITS lim x→c
        </TactileButton>
      </div>

      {/* 1. Definite Integration Panel */}
      {activeTab === 'integral' && (
        <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-6 font-mono">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
            <span className="font-bold text-[var(--text-main)]">[04.A] ADAPTIVE SIMPSON&apos;S NUMERICAL INTEGRAL</span>
            <span>ALGORITHM: 1/3 QUADRATURE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Integrand Function f(x)</label>
              <input
                type="text"
                value={intFn}
                onChange={(e) => setIntFn(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-sm text-[var(--text-main)] outline-none focus:border-[var(--text-accent)] font-semibold"
                placeholder="e.g. sin(x) / x, e^(-x^2)"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Lower Bound a</label>
              <input
                type="number"
                step="any"
                value={intA}
                onChange={(e) => setIntA(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)] outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Upper Bound b</label>
              <input
                type="number"
                step="any"
                value={intB}
                onChange={(e) => setIntB(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <TactileButton variant="primary" size="lg" className="w-full" onClick={calculateIntegral}>
                <span>INTEGRATE</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </TactileButton>
            </div>
          </div>

          {/* Results Output */}
          <div className="p-4 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px] space-y-2">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Numerical Solution</div>
            <div className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] tabular-nums">
              {intResult !== null ? `∫ = ${intResult.toFixed(9)}` : 'Click INTEGRATE to solve'}
            </div>
          </div>
        </div>
      )}

      {/* 2. Derivative Panel */}
      {activeTab === 'derivative' && (
        <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-6 font-mono">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
            <span className="font-bold text-[var(--text-main)]">[04.B] NUMERICAL DIFFERENTIATION</span>
            <span>STENCIL: 5-POINT CENTRAL DIFFERENCE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Function f(x)</label>
              <input
                type="text"
                value={diffFn}
                onChange={(e) => setDiffFn(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-sm text-[var(--text-main)] outline-none focus:border-[var(--text-accent)] font-semibold"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Evaluation Point x₀</label>
              <input
                type="number"
                step="any"
                value={diffX0}
                onChange={(e) => setDiffX0(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <TactileButton variant="primary" size="lg" className="w-full" onClick={calculateDerivative}>
                <span>DIFFERENTIATE</span>
              </TactileButton>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">First Derivative f&apos;(x₀)</div>
              <div className="text-xl font-bold text-[var(--text-main)] tabular-nums mt-1">
                {diffResult !== null ? diffResult.toFixed(8) : '—'}
              </div>
            </div>

            <div className="p-4 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Second Derivative f&apos;&apos;(x₀) (Curvature)</div>
              <div className="text-xl font-bold text-[var(--text-main)] tabular-nums mt-1">
                {diffSecond !== null ? diffSecond.toFixed(8) : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Series Panel */}
      {activeTab === 'series' && (
        <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-6 font-mono">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
            <span className="font-bold text-[var(--text-main)]">[04.C] DISCRETE SERIES EVALUATOR</span>
            <span>TERMS: n ∈ [START, END]</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Term Formula f(n)</label>
              <input
                type="text"
                value={seriesFn}
                onChange={(e) => setSeriesFn(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-sm text-[var(--text-main)] outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Start n</label>
              <input
                type="number"
                value={seriesStart}
                onChange={(e) => setSeriesStart(parseInt(e.target.value) || 1)}
                className="w-full p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">End n</label>
              <input
                type="number"
                value={seriesEnd}
                onChange={(e) => setSeriesEnd(parseInt(e.target.value) || 10)}
                className="w-full p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)]"
              />
            </div>

            <div className="md:col-span-2">
              <TactileButton variant="primary" size="lg" className="w-full" onClick={calculateSeries}>
                <span>SUM / PROD</span>
              </TactileButton>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Summation ∑ f(n)</div>
              <div className="text-xl font-bold text-[var(--text-main)] tabular-nums mt-1">
                {seriesSum !== null ? seriesSum.toFixed(8) : '—'}
              </div>
            </div>

            <div className="p-4 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Product ∏ f(n)</div>
              <div className="text-xl font-bold text-[var(--text-main)] tabular-nums mt-1">
                {seriesProd !== null ? seriesProd.toExponential(6) : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Limits Panel */}
      {activeTab === 'limits' && (
        <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-6 font-mono">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
            <span className="font-bold text-[var(--text-main)]">[04.D] LIMIT APPROXIMATION TABLE</span>
            <span>TWO-SIDED CONVERGENCE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Function f(x)</label>
              <input
                type="text"
                value={limitFn}
                onChange={(e) => setLimitFn(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-sm text-[var(--text-main)] outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Approaching c</label>
              <input
                type="number"
                step="any"
                value={limitC}
                onChange={(e) => setLimitC(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)]"
              />
            </div>

            <div className="md:col-span-2">
              <TactileButton variant="primary" size="lg" className="w-full" onClick={calculateLimit}>
                <span>CALCULATE</span>
              </TactileButton>
            </div>
          </div>

          {limitApproaches.length > 0 && (
            <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-[2px]">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-[var(--bg-plate-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <tr>
                    <th className="p-2.5">Delta δ</th>
                    <th className="p-2.5">Left Limit f(c - δ)</th>
                    <th className="p-2.5">Right Limit f(c + δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {limitApproaches.map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-hover)]">
                      <td className="p-2.5 tabular-nums text-[var(--text-muted)]">{row.delta}</td>
                      <td className="p-2.5 tabular-nums font-semibold text-[var(--text-main)]">
                        {isNaN(row.left) ? 'Undefined' : row.left.toFixed(8)}
                      </td>
                      <td className="p-2.5 tabular-nums font-semibold text-[var(--text-main)]">
                        {isNaN(row.right) ? 'Undefined' : row.right.toFixed(8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
