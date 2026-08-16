import React, { useState, useEffect, useRef } from 'react';
import { AngleUnit, HistoryItem } from '../types';
import { evaluateExpression } from '../utils/mathEngine';
import { sound } from '../utils/audio';
import { TactileButton } from './TactileButton';
import { CornerDownLeft, Trash2, Clock, Copy, Check, Sparkles, Variable, HelpCircle } from 'lucide-react';

interface ExpressionViewProps {
  angleUnit: AngleUnit;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  variables: Record<string, unknown>;
  setVariables: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

const PRESETS = [
  { name: "Euler's Identity", expr: "e^(i * pi) + 1", desc: "Fundamental constant relation" },
  { name: "Lorentz Factor (v=0.8c)", expr: "1 / sqrt(1 - 0.8^2)", desc: "Special relativity time dilation" },
  { name: "Golden Ratio φ", expr: "(1 + sqrt(5)) / 2", desc: "Fibonacci limit ratio" },
  { name: "Gaussian Peak", expr: "1 / sqrt(2 * pi) * e^(-0.5 * 0^2)", desc: "Standard normal density at x=0" },
  { name: "Compound Growth", expr: "10000 * (1 + 0.065 / 12)^(12 * 10)", desc: "10-yr interest at 6.5%" },
  { name: "Complex Polar", expr: "(3 + 4i) * (1 - 2i)", desc: "Complex multiplication" },
];

export const ExpressionView: React.FC<ExpressionViewProps> = ({
  angleUnit,
  history,
  setHistory,
  variables,
  setVariables,
}) => {
  const [inputExpr, setInputExpr] = useState('sin(pi / 4) * sqrt(2)');
  const [currentResult, setCurrentResult] = useState<string>('1');
  const [exactResult, setExactResult] = useState<string | undefined>('1');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [durationUs, setDurationUs] = useState<number>(140);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keypad' | 'variables' | 'presets'>('keypad');

  const inputRef = useRef<HTMLInputElement>(null);

  const performEvaluation = (expr: string) => {
    if (!expr.trim()) return;

    const res = evaluateExpression(expr, variables, angleUnit);
    if (res.success && res.result !== undefined) {
      setCurrentResult(res.result);
      setExactResult(res.exactResult);
      setErrorMsg(null);
      setDurationUs(res.durationUs);
      sound.playSuccess();

      // If variable assignment
      if (res.assignedVar) {
        setVariables((prev) => ({
          ...prev,
          [res.assignedVar as string]: res.rawResult,
        }));
      }

      // Update ans in variables
      setVariables((prev) => ({
        ...prev,
        ans: res.rawResult,
      }));

      // Add to history
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        expression: expr,
        result: res.result,
        exactResult: res.exactResult,
        timestamp: Date.now(),
        durationUs: res.durationUs,
        mode: angleUnit,
        steps: res.steps,
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
    } else {
      setErrorMsg(res.error || 'Syntax Error');
      sound.playError();
    }
  };

  useEffect(() => {
    // Initial evaluation
    const res = evaluateExpression(inputExpr, variables, angleUnit);
    if (res.success && res.result) {
      setCurrentResult(res.result);
      setExactResult(res.exactResult);
      setDurationUs(res.durationUs);
    }
  }, [angleUnit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performEvaluation(inputExpr);
    }
  };

  const insertToken = (token: string) => {
    sound.playClick();
    if (!inputRef.current) return;

    const start = inputRef.current.selectionStart || inputExpr.length;
    const end = inputRef.current.selectionEnd || inputExpr.length;
    const nextText = inputExpr.substring(0, start) + token + inputExpr.substring(end);
    setInputExpr(nextText);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(start + token.length, start + token.length);
      }
    }, 10);
  };

  const clearInput = () => {
    sound.playClick();
    setInputExpr('');
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    sound.playClick(1.5);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Expression Evaluation Terminal */}
      <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 sm:p-6 rounded-[2px] shadow-xs relative">
        {/* Corner Reticles */}
        <div className="absolute top-1 left-1 text-[var(--crosshair)] font-mono text-[9px] select-none">+</div>
        <div className="absolute top-1 right-1 text-[var(--crosshair)] font-mono text-[9px] select-none">+</div>
        <div className="absolute bottom-1 left-1 text-[var(--crosshair)] font-mono text-[9px] select-none">+</div>
        <div className="absolute bottom-1 right-1 text-[var(--crosshair)] font-mono text-[9px] select-none">+</div>

        {/* Terminal Header */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-main)] font-semibold tracking-wider">[01] EXPRESSION TERMINAL</span>
            <span className="opacity-40">//</span>
            <span className="uppercase">MODE: {angleUnit}</span>
          </div>
          <div className="flex items-center gap-3 tabular-nums">
            <span>EXEC: {durationUs} μs</span>
            <span className="opacity-40">//</span>
            <span>MEM: {Object.keys(variables).length} VARS</span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center gap-2 mb-4">
          <span className="font-mono text-lg font-bold text-[var(--text-accent)] pl-1 select-none">
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputExpr}
            onChange={(e) => setInputExpr(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type mathematical formula (e.g., 2*sin(pi/3) + log(100), x = 42)..."
            className="w-full bg-transparent font-mono text-lg sm:text-xl font-medium text-[var(--text-main)] outline-none border-b border-[var(--border-main)] pb-1 px-1 focus:border-[var(--text-accent)] transition-colors placeholder:text-[var(--text-muted)]/50"
            autoFocus
          />
          <div className="flex items-center gap-1.5">
            {inputExpr && (
              <TactileButton variant="ghost" size="sm" onClick={clearInput} title="Clear Input">
                CLEAR
              </TactileButton>
            )}
            <TactileButton
              variant="primary"
              size="md"
              onClick={() => performEvaluation(inputExpr)}
              title="Evaluate [ENTER]"
            >
              <span>EVAL</span>
              <CornerDownLeft className="w-3 h-3" />
            </TactileButton>
          </div>
        </div>

        {/* Error or Live Result Display */}
        {errorMsg ? (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-mono text-xs rounded-[2px] flex items-center justify-between">
            <span>ERR: {errorMsg}</span>
            <span className="text-[10px] opacity-70">Check syntax / variable definitions</span>
          </div>
        ) : (
          <div className="bg-[var(--bg-plate-subtle)] border border-[var(--border-subtle)] p-4 rounded-[2px] flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
                COMPUTED RESULT
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] tabular-nums flex items-baseline gap-3 flex-wrap">
                <span>{currentResult}</span>
                {exactResult && exactResult !== currentResult && (
                  <span className="text-sm font-normal text-[var(--text-muted)]">
                    (= {exactResult})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(currentResult, 'current')}
              >
                {copiedId === 'current' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>COPY</span>
                  </>
                )}
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  insertToken(currentResult);
                }}
              >
                USE RESULT
              </TactileButton>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Lower Panels (Keypad / Variables / Presets) vs History Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Modular Controls Panel */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub-tabs for Left Column */}
          <div className="flex items-center gap-1 border-b border-[var(--border-main)] pb-2">
            <TactileButton
              variant={activeTab === 'keypad' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('keypad')}
            >
              KEYPAD MATRIX
            </TactileButton>
            <TactileButton
              variant={activeTab === 'variables' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('variables')}
            >
              <Variable className="w-3 h-3" />
              <span>VARIABLES ({Object.keys(variables).length})</span>
            </TactileButton>
            <TactileButton
              variant={activeTab === 'presets' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('presets')}
            >
              <Sparkles className="w-3 h-3" />
              <span>FORMULAS & PRESETS</span>
            </TactileButton>
          </div>

          {/* Tab 1: Keypad Matrix */}
          {activeTab === 'keypad' && (
            <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-3">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 text-xs font-mono">
                {/* Row 1: Advanced Functions */}
                <TactileButton variant="key" size="md" onClick={() => insertToken('sin(')}>sin</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('cos(')}>cos</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('tan(')}>tan</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('asin(')}>asin</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('acos(')}>acos</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('atan(')}>atan</TactileButton>

                {/* Row 2: Powers & Logs */}
                <TactileButton variant="key" size="md" onClick={() => insertToken('sqrt(')}>√x</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('^2')}>x²</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('^')}>xʸ</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('log10(')}>log₁₀</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('log(')}>ln</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('exp(')}>eˣ</TactileButton>

                {/* Row 3: Constants & Brackets */}
                <TactileButton variant="key" size="md" onClick={() => insertToken('pi')}>π</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('e')}>e</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('i')}>i</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('(')}>(</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken(')')}>)</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('!')}>n!</TactileButton>

                {/* Row 4: Digits & Arithmetic */}
                <TactileButton variant="key" size="md" onClick={() => insertToken('7')}>7</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('8')}>8</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('9')}>9</TactileButton>
                <TactileButton variant="secondary" size="md" onClick={() => insertToken(' / ')}>÷</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('abs(')}>|x|</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken(' % ')}>mod</TactileButton>

                {/* Row 5 */}
                <TactileButton variant="key" size="md" onClick={() => insertToken('4')}>4</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('5')}>5</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('6')}>6</TactileButton>
                <TactileButton variant="secondary" size="md" onClick={() => insertToken(' * ')}>×</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('ans')}>ans</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('x')}>x</TactileButton>

                {/* Row 6 */}
                <TactileButton variant="key" size="md" onClick={() => insertToken('1')}>1</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('2')}>2</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('3')}>3</TactileButton>
                <TactileButton variant="secondary" size="md" onClick={() => insertToken(' - ')}>−</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('y')}>y</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('z')}>z</TactileButton>

                {/* Row 7 */}
                <TactileButton variant="key" size="md" onClick={() => insertToken('0')}>0</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken('.')}>.</TactileButton>
                <TactileButton variant="key" size="md" onClick={() => insertToken(' = ')}>=</TactileButton>
                <TactileButton variant="secondary" size="md" onClick={() => insertToken(' + ')}>+</TactileButton>
                <TactileButton
                  variant="primary"
                  size="md"
                  className="col-span-2"
                  onClick={() => performEvaluation(inputExpr)}
                >
                  EVALUATE [↵]
                </TactileButton>
              </div>
            </div>
          )}

          {/* Tab 2: Variable Bank */}
          {activeTab === 'variables' && (
            <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>ACTIVE MEMORY VARIABLES</span>
                <span className="text-[10px]">Type e.g. &apos;a = 15&apos; in terminal</span>
              </div>

              <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-[2px] max-h-60 overflow-y-auto">
                {Object.keys(variables).length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                    No custom variables registered yet. Try typing &apos;x = 24&apos; or &apos;radius = 5.5&apos;
                  </div>
                ) : (
                  Object.entries(variables).map(([k, v]) => (
                    <div
                      key={k}
                      className="p-2.5 px-3 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-accent)]">{k}</span>
                        <span className="opacity-40">=</span>
                        <span className="tabular-nums">{String(v)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TactileButton
                          variant="ghost"
                          size="sm"
                          onClick={() => insertToken(k)}
                          title="Insert variable"
                        >
                          INSERT
                        </TactileButton>
                        <TactileButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setVariables((prev) => {
                              const copy = { ...prev };
                              delete copy[k];
                              return copy;
                            });
                          }}
                          title="Delete variable"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </TactileButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Presets */}
          {activeTab === 'presets' && (
            <div className="border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] space-y-3">
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>SELECT PRESET FORMULA TO LOAD & EVALUATE</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputExpr(p.expr);
                      performEvaluation(p.expr);
                    }}
                    className="text-left p-3 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-main)] rounded-[2px] transition-all space-y-1 group"
                  >
                    <div className="text-xs font-bold text-[var(--text-main)] group-hover:text-[var(--text-accent)] flex items-center justify-between">
                      <span>{p.name}</span>
                      <span className="text-[9px] opacity-40">LOAD →</span>
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                      {p.expr}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] opacity-70">
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): History Ledger */}
        <div className="lg:col-span-5 border border-[var(--border-main)] bg-[var(--bg-plate)] p-4 rounded-[2px] flex flex-col justify-between space-y-3 min-h-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[var(--text-accent)]" />
              <span className="font-semibold text-[var(--text-main)] uppercase tracking-wider">
                LEDGER / AUDIT TRAIL
              </span>
            </div>
            {history.length > 0 && (
              <TactileButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  sound.playClick();
                  setHistory([]);
                }}
              >
                CLEAR
              </TactileButton>
            )}
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] pr-1">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[var(--text-muted)] space-y-1 opacity-60">
                <Clock className="w-6 h-6 stroke-[1.5]" />
                <p>No calculations logged yet.</p>
                <p className="text-[10px]">Operations will be recorded with microsecond telemetry.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 border border-[var(--border-subtle)] bg-[var(--bg-plate-subtle)] rounded-[2px] hover:border-[var(--border-main)] transition-all text-xs font-mono space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span className="tabular-nums">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span>{item.durationUs} μs</span>
                  </div>

                  <div
                    className="cursor-pointer hover:text-[var(--text-accent)] font-medium text-[var(--text-main)] break-all"
                    onClick={() => {
                      setInputExpr(item.expression);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    title="Click to recall expression"
                  >
                    &gt; {item.expression}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-main)] tabular-nums">
                      = {item.result}
                    </span>
                    <TactileButton
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.result, item.id)}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </TactileButton>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>TOTAL TRANSACTIONS: {history.length}</span>
            <span>PRECISION: 64-BIT IEEE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
