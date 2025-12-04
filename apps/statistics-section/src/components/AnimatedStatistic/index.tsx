import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for counting animation
 * Animates from 0 to the target value over the specified duration
 *
 * @param end - The target value to count up to
 * @param duration - Animation duration in milliseconds (default: 2000)
 * @returns The current animated count value
 */
export function useCountUp(
  end: number | null,
  duration: number = 2000
): number {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousEndRef = useRef<number | null>(null);

  useEffect(() => {
    if (end === null || end === undefined) {
      setCount(0);
      previousEndRef.current = null;
      return;
    }

    // Reset to 0 when a new value is set (different from previous)
    if (previousEndRef.current !== end) {
      setCount(0);
      startTimeRef.current = null;
      previousEndRef.current = end;
    }

    // Cancel any existing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (ease-out-quart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(end * easeOutQuart);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, duration]);

  return count;
}

export interface AnimatedStatisticProps {
  value: number | null;
  isLoading: boolean;
  error: any;
}

/**
 * Component for animated statistic value
 * Displays a loading state, error state, or animated counting value
 */
export function AnimatedStatistic({
  value,
  isLoading,
  error,
}: AnimatedStatisticProps) {
  const animatedValue = useCountUp(value, 2000);

  if (isLoading) {
    return <span>...</span>;
  }

  if (error || value === null) {
    return <span>-</span>;
  }

  return <span>{animatedValue.toLocaleString()}</span>;
}
