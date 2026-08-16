import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';
import { TactileButton } from './TactileButton';
import { BarChart2, TrendingUp, Sparkles } from 'lucide-react';

export const StatsView: React.FC = () => {
  const [dataInput, setDataInput] = useState<string>('12, 15, 18, 19, 21, 22, 22, 25, 28, 30, 31, 35, 42');
  const [regressionInput, setRegressionInput] = useState<string>('1,2; 2,3.8; 3,6.2; 4,7.9; 5,10.1; 6,11.8');
  const [activeTab, setActiveTab] = useState<'distribution' | 'regression'>('distribution');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regCanvasRef = useRef<HTMLCanvasElement>(null);

  // Parse sample data
  const numbers = dataInput
    .split(/[\s,]+/)
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  // Calculate descriptive statistics
  const count = numbers.length;
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = count > 0 ? sum / count : 0;

  const median =
    count > 0
      ? count % 2 === 0
        ? (numbers[count / 2 - 1] + numbers[count / 2]) / 2
        : numbers[Math.floor(count / 2)]
      : 0;

  const variance =
    count > 1
      ? numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1)
      : 0;
  const stdDev = Math.sqrt(variance);
  const minVal = count > 0 ? numbers[0] : 0;
  const maxVal = count > 0 ? numbers[count - 1] : 0;
  const q1 = count > 0 ? numbers[Math.floor(count * 0.25)] : 0;
  const q3 = count > 0 ? numbers[Math.floor(count * 0.75)] : 0;
  const iqr = q3 - q1;

  // Draw Histogram & Gaussian Bell
  useEffect(() => {
    if (activeTab !== 'distribution') return;
    const canvas = canvasRef.current;
    if (!canvas || count === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = 280;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Binning
    const binCount = Math.max(5, Math.min(12, Math.ceil(Math.sqrt(count))));
    const binWidth = (maxVal - minVal) / binCount || 1;
    const bins: number[] = new Array(binCount).fill(0);

    numbers.forEach((n) => {
      let bIdx = Math.floor((n - minVal) / binWidth);
      if (bIdx >= binCount) bIdx = binCount - 1;
      bins[bIdx]++;
    });

    const maxBin = Math.max(...bins, 1);
    const barW = (width - 60) / binCount;

    // Draw Bars
    bins.forEach((b, i) => {
      const barH = (b / maxBin) * (height - 60);
      const x = 40 + i * barW;
      const y = height - 30 - barH;

      ctx.fillStyle = 'rgba(0, 85, 255, 0.15)';
      ctx.strokeStyle = 'rgba(0, 85, 255, 0.8)';
      ctx.lineWidth = 1.5;

      ctx.fillRect(x, y, barW - 4, barH);
      ctx.strokeRect(x, y, barW - 4, barH);

      // Label
      ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText(String(b), x + barW / 2 - 8, y - 5);
      ctx.fillText((minVal + i * binWidth).toFixed(0), x, height - 12);
    });

    // Draw Fitted Gaussian Normal Curve
    if (stdDev > 0) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let px = 40; px <= width - 20; px += 2) {
        const xVal = minVal + ((px - 40) / (width - 60)) * (maxVal - minVal);
        const z = (xVal - mean) / stdDev;
        const normY = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
        // Scale to canvas
        const screenY = height - 30 - normY * stdDev * (height - 60) * 1.5;

        if (px === 40) ctx.moveTo(px, screenY);
        else ctx.lineTo(px, screenY);
      }
      ctx.stroke();
    }
  }, [numbers, count, mean, stdDev, minVal, maxVal, activeTab]);

  // Linear Regression Calculation
  const regPoints = regressionInput
    .split(';')
    .map((pair) => {
      const [xStr, yStr] = pair.split(',');
      const x = parseFloat(xStr);
      const y = parseFloat(yStr);
      return !isNaN(x) && !isNaN(y) ? { x, y } : null;
    })
    .filter((p): p is { x: number; y: number } => p !== null);

  const nReg = regPoints.length;
  let slope = 0;
  let intercept = 0;
  let rSquared = 0;

  if (nReg >= 2) {
    const sumX = regPoints.reduce((acc, p) => acc + p.x, 0);
    const sumY = regPoints.reduce((acc, p) => acc + p.y, 0);
    const sumXY = regPoints.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = regPoints.reduce((acc, p) => acc + p.x * p.x, 0);
    const sumYY = regPoints.reduce((acc, p) => acc + p.y * p.y, 0);

    slope = (nReg * sumXY - sumX * sumY) / (nReg * sumXX - sumX * sumX);
    intercept = (sumY - slope * sumX) / nReg;

    const numerator = nReg * sumXY - sumX * sumY;
    const denom = Math.sqrt((nReg * sumXX - sumX * sumX) * (nReg * sumYY - sumY * sumY));
    const r = denom !== 0 ? numerator / denom : 0;
    rSquared = r * r;
  }

  // Draw Regression Scatter & Line
  useEffect(() => {
    if (activeTab !== 'regression') return;
    const canvas = regCanvasRef.current;
    if (!canvas || nReg < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = 280;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const minX = Math.min(...regPoints.map((p) => p.x)) - 1;
    const maxX = Math.max(...regPoints.map((p) => p.x)) + 1;
    const minY = Math.min(...regPoints.map((p) => p.y)) - 1;
    const maxY = Math.max(...regPoints.map((p) => p.y)) + 1;

    const toScreenX = (x: number) => 40 + ((x - minX) / (maxX - minX)) * (width - 60);
    const toScreenY = (y: number) => height - 30 - ((y - minY) / (maxY - minY)) * (height - 60);

    // Draw Scatter points
    ctx.fillStyle = '#0066FF';
    regPoints.forEach((p) => {
      ctx.beginPath();
      ctx.arc(toScreenX(p.x), toScreenY(p.y), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Fitted Line
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toScreenX(minX), toScreenY(slope * minX + intercept));
    ctx.lineTo(toScreenX(maxX), toScreenY(slope * maxX + intercept));
    ctx.stroke();
  }, [regPoints, nReg, slope, intercept, activeTab]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-mono">
      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2">
        <TactileButton
          variant={activeTab === 'distribution' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('distribution')}
        >
          DESCRIPTIVE STATS & HISTOGRAM
        </TactileButton>
        <TactileButton
          variant={activeTab === 'regression' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('regression')}
        >
          LINEAR REGRESSION (y = mx + b)
        </TactileButton>
      </div>

      {activeTab === 'distribution' && (
        <div className="space-y-6">
          {/* Input & Raw Data */}
          <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
              <span className="font-bold text-[var(--text-main)]">[06.A] SAMPLE DATASET FEED</span>
              <span className="text-[10px]">COMMA / SPACE SEPARATED VALUES</span>
            </div>
            <textarea
              rows={2}
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)] outline-none focus:border-[var(--text-accent)]"
              placeholder="e.g. 10, 12, 14, 15, 18, 22, 25..."
            />
          </div>

          {/* Metrics Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">COUNT N</div>
              <div className="text-lg font-bold text-[var(--text-main)] mt-1">{count}</div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">MEAN μ</div>
              <div className="text-lg font-bold text-[var(--text-main)] mt-1">{mean.toFixed(3)}</div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">MEDIAN Q2</div>
              <div className="text-lg font-bold text-[var(--text-main)] mt-1">{median.toFixed(3)}</div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">STD DEV σ</div>
              <div className="text-lg font-bold text-emerald-500 mt-1">{stdDev.toFixed(3)}</div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">VARIANCE σ²</div>
              <div className="text-lg font-bold text-[var(--text-main)] mt-1">{variance.toFixed(3)}</div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">IQR (Q3 - Q1)</div>
              <div className="text-lg font-bold text-[var(--text-accent)] mt-1">{iqr.toFixed(3)}</div>
            </div>
          </div>

          {/* Histogram Canvas */}
          <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="font-bold text-[var(--text-main)]">HISTOGRAM & FITTED GAUSSIAN NORMAL DENSITY</span>
              <span className="text-[10px] text-emerald-500">─ GREEN: N(μ, σ)</span>
            </div>
            <div className="w-full h-[280px] bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'regression' && (
        <div className="space-y-6">
          <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
              <span className="font-bold text-[var(--text-main)]">[06.B] (x, y) DATA POINTS</span>
              <span className="text-[10px]">FORMAT: x1,y1; x2,y2; x3,y3...</span>
            </div>
            <input
              type="text"
              value={regressionInput}
              onChange={(e) => setRegressionInput(e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">BEST-FIT EQUATION</div>
              <div className="text-base font-bold text-[var(--text-main)] mt-1">
                y = {slope.toFixed(4)}x {intercept >= 0 ? '+' : '-'} {Math.abs(intercept).toFixed(4)}
              </div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">R² COEFFICIENT (FIT SCORE)</div>
              <div className="text-lg font-bold text-emerald-500 mt-1">{(rSquared * 100).toFixed(2)}%</div>
            </div>

            <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">SLOPE m</div>
              <div className="text-lg font-bold text-[var(--text-accent)] mt-1">{slope.toFixed(4)}</div>
            </div>
          </div>

          <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-2">
            <div className="w-full h-[280px] bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <canvas ref={regCanvasRef} className="w-full h-full block" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
