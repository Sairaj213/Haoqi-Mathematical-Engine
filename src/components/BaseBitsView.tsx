import React, { useState } from 'react';
import { parseIEEE754, isPrime, primeFactors, gcd, lcm } from '../utils/mathEngine';
import { sound } from '../utils/audio';
import { TactileButton } from './TactileButton';
import { Binary, Cpu, Hash, Sparkles } from 'lucide-react';

export const BaseBitsView: React.FC = () => {
  const [decVal, setDecVal] = useState<number>(42.75);
  const [intVal, setIntVal] = useState<number>(1024);

  // Bitwise inputs
  const [bitA, setBitA] = useState<number>(0b11001100);
  const [bitB, setBitB] = useState<number>(0b10101010);
  const [shiftAmount, setShiftAmount] = useState<number>(2);

  // Number theory input
  const [theoryNum, setTheoryNum] = useState<number>(84);
  const [gcdA, setGcdA] = useState<number>(48);
  const [gcdB, setGcdB] = useState<number>(180);

  const ieee = parseIEEE754(decVal);

  const toggleIeeeBit = (bitIndex: number) => {
    sound.playClick(1.2);
    const chars = ieee.bitString.split('');
    chars[bitIndex] = chars[bitIndex] === '1' ? '0' : '1';
    const newBitStr = chars.join('');

    const uintVal = parseInt(newBitStr, 2);
    const buf = new ArrayBuffer(4);
    const uintView = new Uint32Array(buf);
    const floatView = new Float32Array(buf);
    uintView[0] = uintVal;

    setDecVal(floatView[0]);
  };

  const bitwiseResults = {
    and: (bitA & bitB) >>> 0,
    or: (bitA | bitB) >>> 0,
    xor: (bitA ^ bitB) >>> 0,
    notA: (~bitA) >>> 0,
    shl: (bitA << shiftAmount) >>> 0,
    shr: (bitA >>> shiftAmount) >>> 0,
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-mono">
      {/* 1. IEEE-754 Single Precision 32-bit Float Inspector */}
      <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--text-accent)]" />
            <span className="font-bold text-[var(--text-main)]">[05.A] IEEE-754 32-BIT FLOATING POINT INSPECTOR</span>
          </div>
          <span className="text-[10px]">CLICK ANY BIT TO FLIP STATE</span>
        </div>

        {/* Float Input & Metric Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs text-[var(--text-muted)]">Decimal Float:</label>
            <input
              type="number"
              step="any"
              value={decVal}
              onChange={(e) => setDecVal(parseFloat(e.target.value) || 0)}
              className="w-36 p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] font-bold text-sm text-[var(--text-main)]"
            />
          </div>

          <div className="flex items-center gap-4 text-xs tabular-nums flex-wrap">
            <div><span className="text-[var(--text-muted)]">Hex: </span><span className="font-bold text-[var(--text-main)]">{ieee.hex}</span></div>
            <div><span className="text-[var(--text-muted)]">Sign: </span><span className="font-bold text-amber-500">{ieee.sign > 0 ? '+1' : '-1'}</span></div>
            <div><span className="text-[var(--text-muted)]">Exp: </span><span className="font-bold text-emerald-500">2^({ieee.biasExponent})</span></div>
            <div><span className="text-[var(--text-muted)]">Mantissa: </span><span className="font-bold text-[var(--text-accent)]">{ieee.mantissaFraction.toFixed(6)}</span></div>
          </div>
        </div>

        {/* Interactive Bitboard */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span className="text-amber-500 font-bold">Bit 31: SIGN (1b)</span>
            <span className="text-emerald-500 font-bold">Bits 30-23: EXPONENT (8b)</span>
            <span className="text-[var(--text-accent)] font-bold">Bits 22-0: MANTISSA / FRACTION (23b)</span>
          </div>

          <div className="flex flex-wrap gap-1 p-3 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px] justify-between">
            {ieee.bitString.split('').map((bit, idx) => {
              const bitNum = 31 - idx;
              let colorClass = 'border-[var(--text-accent)]/40 hover:bg-[var(--text-accent)]/20 text-[var(--text-main)]';
              if (idx === 0) {
                colorClass = 'border-amber-500/60 bg-amber-500/10 text-amber-500';
              } else if (idx >= 1 && idx <= 8) {
                colorClass = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => toggleIeeeBit(idx)}
                  title={`Bit ${bitNum} (${idx === 0 ? 'Sign' : idx <= 8 ? 'Exponent' : 'Mantissa'})`}
                  className={`flex flex-col items-center justify-center w-6 sm:w-7 h-10 text-xs font-bold border rounded-[2px] transition-all cursor-pointer select-none ${
                    bit === '1' ? 'bg-[var(--text-main)] text-[var(--bg-root)]' : colorClass
                  }`}
                >
                  <span className="text-[8px] opacity-50 font-normal">{bitNum}</span>
                  <span>{bit}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Radix Multi-Base Converter (Dec, Hex, Bin, Oct, ASCII) */}
      <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5">
          <span className="font-bold text-[var(--text-main)]">[05.B] RADIX & MULTI-BASE REAL-TIME TRANSLATOR</span>
          <span>INTEGER DOMAIN</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Decimal */}
          <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-1">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Decimal (Base 10)</div>
            <input
              type="number"
              value={intVal}
              onChange={(e) => setIntVal(parseInt(e.target.value) || 0)}
              className="w-full bg-transparent font-bold text-base text-[var(--text-main)] outline-none"
            />
          </div>

          {/* Hexadecimal */}
          <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-1">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Hex (Base 16)</div>
            <div className="font-bold text-base text-[var(--text-main)] tabular-nums">
              0x{(intVal >>> 0).toString(16).toUpperCase()}
            </div>
          </div>

          {/* Binary */}
          <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-1">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Binary (Base 2)</div>
            <div className="font-bold text-xs text-[var(--text-main)] tabular-nums truncate">
              {(intVal >>> 0).toString(2)}
            </div>
          </div>

          {/* Octal */}
          <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] space-y-1">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Octal (Base 8)</div>
            <div className="font-bold text-base text-[var(--text-main)] tabular-nums">
              0o{(intVal >>> 0).toString(8)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bitwise Logic Matrix & Number Theory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bitwise Gates */}
        <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
            <span className="font-bold text-[var(--text-main)]">BITWISE LOGIC GATES</span>
            <span className="text-[10px]">32-BIT UNSIGNED</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">A & B (AND)</div>
              <div className="font-bold text-[var(--text-main)] mt-1">{bitwiseResults.and}</div>
            </div>

            <div className="p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">A | B (OR)</div>
              <div className="font-bold text-[var(--text-main)] mt-1">{bitwiseResults.or}</div>
            </div>

            <div className="p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">A ^ B (XOR)</div>
              <div className="font-bold text-[var(--text-main)] mt-1">{bitwiseResults.xor}</div>
            </div>

            <div className="p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">~A (NOT)</div>
              <div className="font-bold text-[var(--text-main)] mt-1">{bitwiseResults.notA}</div>
            </div>
          </div>
        </div>

        {/* Number Theory & Primes */}
        <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
            <span className="font-bold text-[var(--text-main)]">PRIME & NUMBER THEORY</span>
            <span className="text-[10px]">FACTORIZATION & EUCLID</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-[var(--text-muted)]">Target N:</label>
            <input
              type="number"
              value={theoryNum}
              onChange={(e) => setTheoryNum(parseInt(e.target.value) || 1)}
              className="w-24 p-1.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-main)] rounded-[2px] text-xs text-[var(--text-main)] font-bold"
            />
            <div className="text-xs font-bold">
              {isPrime(theoryNum) ? (
                <span className="text-emerald-500">✓ PRIME NUMBER</span>
              ) : (
                <span className="text-[var(--text-muted)]">COMPOSITE</span>
              )}
            </div>
          </div>

          <div className="p-2.5 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px] text-xs">
            <span className="text-[10px] text-[var(--text-muted)] block mb-1">PRIME FACTORS:</span>
            <span className="font-bold text-[var(--text-main)]">
              {primeFactors(theoryNum).join(' × ') || theoryNum}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">GCD({gcdA}, {gcdB})</div>
              <div className="font-bold text-base text-[var(--text-main)] mt-0.5">{gcd(gcdA, gcdB)}</div>
            </div>
            <div className="p-2 bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] rounded-[2px]">
              <div className="text-[10px] text-[var(--text-muted)]">LCM({gcdA}, {gcdB})</div>
              <div className="font-bold text-base text-[var(--text-main)] mt-0.5">{lcm(gcdA, gcdB)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
