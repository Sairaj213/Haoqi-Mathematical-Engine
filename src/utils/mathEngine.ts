import * as math from 'mathjs';
import { AngleUnit, MatrixData } from '../types';

// Custom configuration for math.js
export function evaluateExpression(expr: string, scope: Record<string, unknown> = {}, angleUnit: AngleUnit = 'rad') {
  const startTime = performance.now();

  try {
    if (!expr || !expr.trim()) {
      return { success: false, error: 'Empty expression', durationUs: 0 };
    }

    // Clean expression (allow unicode symbols like ×, ÷, π, √)
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/√\s*\(([^)]+)\)/g, 'sqrt($1)')
      .replace(/√([0-9a-zA-Z]+)/g, 'sqrt($1)')
      .replace(/∞/g, 'Infinity');

    // Handle degree mode replacement if needed for trig functions
    const customScope: Record<string, unknown> = {
      ...scope,
      pi: Math.PI,
      e: Math.E,
      phi: (1 + Math.sqrt(5)) / 2,
    };

    if (angleUnit === 'deg') {
      customScope.sin = (x: number) => Math.sin((x * Math.PI) / 180);
      customScope.cos = (x: number) => Math.cos((x * Math.PI) / 180);
      customScope.tan = (x: number) => Math.tan((x * Math.PI) / 180);
      customScope.asin = (x: number) => (Math.asin(x) * 180) / Math.PI;
      customScope.acos = (x: number) => (Math.acos(x) * 180) / Math.PI;
      customScope.atan = (x: number) => (Math.atan(x) * 180) / Math.PI;
    }

    // Check if it's an assignment (e.g. x = 5)
    let assignedVar: string | null = null;
    if (sanitized.includes('=') && !sanitized.includes('==') && !sanitized.includes('<=') && !sanitized.includes('>=')) {
      const parts = sanitized.split('=');
      if (parts.length === 2 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(parts[0].trim())) {
        assignedVar = parts[0].trim();
        sanitized = parts[1].trim();
      }
    }

    const compiled = math.compile(sanitized);
    const rawResult = compiled.evaluate(customScope);

    const endTime = performance.now();
    const durationUs = Math.round((endTime - startTime) * 1000);

    let formattedResult = '';
    let exactResult: string | undefined = undefined;

    if (rawResult === null || rawResult === undefined) {
      formattedResult = 'null';
    } else if (typeof rawResult === 'object' && 'isComplex' in rawResult) {
      const c = rawResult as { re: number; im: number };
      formattedResult = `${c.re.toFixed(6)} ${c.im >= 0 ? '+' : '-'} ${Math.abs(c.im).toFixed(6)}i`;
    } else if (typeof rawResult === 'number') {
      if (Number.isInteger(rawResult)) {
        formattedResult = rawResult.toString();
        exactResult = rawResult.toString();
      } else if (isNaN(rawResult)) {
        formattedResult = 'NaN';
      } else if (!isFinite(rawResult)) {
        formattedResult = rawResult > 0 ? '+Infinity' : '-Infinity';
      } else {
        // High precision format
        formattedResult = Number(rawResult.toFixed(10)).toString();
        // Try fraction representation if clean
        try {
          const frac = math.fraction(rawResult);
          if (frac.d <= 1000 && frac.d > 1) {
            exactResult = `${frac.s * frac.n}/${frac.d}`;
          }
        } catch {
          // ignore fraction error
        }
      }
    } else if (typeof rawResult === 'boolean') {
      formattedResult = rawResult ? 'true' : 'false';
    } else if (typeof rawResult === 'object' && 'toArray' in rawResult) {
      formattedResult = JSON.stringify((rawResult as { toArray: () => unknown }).toArray());
    } else {
      formattedResult = String(rawResult);
    }

    // Generate steps breakdown
    const steps: string[] = [];
    try {
      const parsedNode = math.parse(sanitized);
      steps.push(`AST Root: ${parsedNode.type}`);
      if (parsedNode.type === 'OperatorNode') {
        steps.push(`Operation: ${(parsedNode as unknown as { op: string }).op}`);
      }
      steps.push(`Evaluated in ${durationUs} μs`);
    } catch {
      // ignore
    }

    return {
      success: true,
      result: formattedResult,
      exactResult,
      rawResult,
      assignedVar,
      durationUs,
      steps,
    };
  } catch (err: unknown) {
    const endTime = performance.now();
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Evaluation error',
      durationUs: Math.round((endTime - startTime) * 1000),
    };
  }
}

// Numerical Derivative f'(x) via Richardson Extrapolation / Central Difference
export function numericalDerivative(fnStr: string, x: number, h: number = 1e-5): number | null {
  try {
    const compiled = math.compile(fnStr);
    const f = (val: number) => {
      const res = compiled.evaluate({ x: val, pi: Math.PI, e: Math.E });
      return typeof res === 'number' ? res : Number(res);
    };

    // 5-point stencil central difference
    const d = (-f(x + 2 * h) + 8 * f(x + h) - 8 * f(x - h) + f(x - 2 * h)) / (12 * h);
    return isFinite(d) ? d : null;
  } catch {
    return null;
  }
}

// Definite Numerical Integration via Adaptive Simpson's Rule
export function numericalIntegral(fnStr: string, a: number, b: number, n: number = 200): number | null {
  try {
    const compiled = math.compile(fnStr);
    const f = (xVal: number) => {
      const res = compiled.evaluate({ x: xVal, pi: Math.PI, e: Math.E });
      return typeof res === 'number' && isFinite(res) ? res : 0;
    };

    if (a === b) return 0;
    const intervals = n % 2 === 0 ? n : n + 1;
    const h = (b - a) / intervals;
    let sum = f(a) + f(b);

    for (let i = 1; i < intervals; i++) {
      const x = a + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * f(x);
    }

    return (h / 3) * sum;
  } catch {
    return null;
  }
}

// Matrix operations
export function createMatrix(rows: number, cols: number, initial: number = 0): MatrixData {
  const data: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(initial);
    }
    data.push(row);
  }
  return { rows, cols, data };
}

export function computeMatrixOps(A: MatrixData, B: MatrixData | null = null) {
  const results: Record<string, unknown> = {};

  try {
    const mA = A.data;
    // Transpose
    const trans: number[][] = [];
    for (let c = 0; c < A.cols; c++) {
      const row: number[] = [];
      for (let r = 0; r < A.rows; r++) {
        row.push(mA[r][c]);
      }
      trans.push(row);
    }
    results.transpose = trans;

    // Determinant & Inverse (if square)
    if (A.rows === A.cols) {
      try {
        const det = math.det(mA);
        results.det = Number(det.toFixed(8));
        results.trace = mA.reduce((sum, row, i) => sum + row[i], 0);

        if (Math.abs(det) > 1e-12) {
          const inv = math.inv(mA);
          results.inverse = (inv as unknown as number[][]).map(row =>
            row.map(val => Number(val.toFixed(6)))
          );
        } else {
          results.inverse = 'Singular matrix (det = 0, no inverse)';
        }

        // Eigenvalues for 2x2
        if (A.rows === 2) {
          const a = mA[0][0], b = mA[0][1], c = mA[1][0], d = mA[1][1];
          const tr = a + d;
          const disc = tr * tr - 4 * (a * d - b * c);
          if (disc >= 0) {
            results.eigenvalues = [
              Number(((tr + Math.sqrt(disc)) / 2).toFixed(6)),
              Number(((tr - Math.sqrt(disc)) / 2).toFixed(6)),
            ];
          } else {
            results.eigenvalues = [
              `${(tr / 2).toFixed(4)} + ${(Math.sqrt(-disc) / 2).toFixed(4)}i`,
              `${(tr / 2).toFixed(4)} - ${(Math.sqrt(-disc) / 2).toFixed(4)}i`,
            ];
          }
        }
      } catch (err: unknown) {
        results.detError = err instanceof Error ? err.message : 'Error';
      }
    }

    // Binary ops with B
    if (B && A.rows === B.rows && A.cols === B.cols) {
      results.add = A.data.map((row, r) => row.map((val, c) => Number((val + B.data[r][c]).toFixed(6))));
      results.sub = A.data.map((row, r) => row.map((val, c) => Number((val - B.data[r][c]).toFixed(6))));
    }

    if (B && A.cols === B.rows) {
      try {
        results.mult = math.multiply(A.data, B.data);
      } catch {
        // ignore
      }
    }
  } catch (err: unknown) {
    results.error = err instanceof Error ? err.message : 'Matrix computation error';
  }

  return results;
}

// IEEE-754 Single Precision 32-bit float bit analyzer
export function parseIEEE754(floatVal: number) {
  const buffer = new ArrayBuffer(4);
  const floatView = new Float32Array(buffer);
  const uintView = new Uint32Array(buffer);

  floatView[0] = floatVal;
  const bits = uintView[0];

  const bitString = bits.toString(2).padStart(32, '0');
  const signBit = bitString[0];
  const exponentBits = bitString.slice(1, 9);
  const mantissaBits = bitString.slice(9);

  const sign = signBit === '1' ? -1 : 1;
  const exponentVal = parseInt(exponentBits, 2);
  const biasExponent = exponentVal - 127;

  let mantissaFraction = 0;
  for (let i = 0; i < mantissaBits.length; i++) {
    if (mantissaBits[i] === '1') {
      mantissaFraction += Math.pow(2, -(i + 1));
    }
  }

  return {
    bitString,
    signBit,
    exponentBits,
    mantissaBits,
    sign,
    exponentVal,
    biasExponent,
    mantissaFraction: 1 + mantissaFraction,
    hex: '0x' + bits.toString(16).toUpperCase().padStart(8, '0'),
    reconstructed: floatView[0],
  };
}

// Number Theory utilities
export function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export function primeFactors(n: number): number[] {
  let num = Math.abs(Math.floor(n));
  const factors: number[] = [];
  while (num % 2 === 0) {
    factors.push(2);
    num = Math.floor(num / 2);
  }
  for (let i = 3; i * i <= num; i += 2) {
    while (num % i === 0) {
      factors.push(i);
      num = Math.floor(num / i);
    }
  }
  if (num > 2) factors.push(num);
  return factors;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.floor((a * b) / gcd(a, b)));
}
