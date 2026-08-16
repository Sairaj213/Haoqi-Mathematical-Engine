import { useEffect, useState, useRef, useCallback } from 'react';

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=≠≈√πeφ∫∂λ';

export function useScramble(targetText: string, options: { speed?: number; iterations?: number; triggerOnHover?: boolean } = {}) {
  const [displayText, setDisplayText] = useState(targetText);
  const isHovered = useRef(false);
  const frameRef = useRef<number | null>(null);

  const speed = options.speed ?? 30; // ms per step
  const totalIterations = options.iterations ?? 8;

  const triggerScramble = useCallback(() => {
    let iteration = 0;
    if (frameRef.current) clearInterval(frameRef.current);

    frameRef.current = window.setInterval(() => {
      setDisplayText(() => {
        return targetText
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < (iteration / totalIterations) * targetText.length) {
              return targetText[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');
      });

      iteration += 1;
      if (iteration > totalIterations) {
        if (frameRef.current) clearInterval(frameRef.current);
        setDisplayText(targetText);
      }
    }, speed);
  }, [targetText, speed, totalIterations]);

  useEffect(() => {
    triggerScramble();
    return () => {
      if (frameRef.current) clearInterval(frameRef.current);
    };
  }, [targetText, triggerScramble]);

  const onMouseEnter = () => {
    isHovered.current = true;
    if (options.triggerOnHover) {
      triggerScramble();
    }
  };

  return { displayText, triggerScramble, onMouseEnter };
}
