import React, { useRef, useState, useEffect } from 'react';

interface PullToRefreshProps {
  onRefresh: () => void;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshing) return;
      if (event.touches.length !== 1) return;
      const target = event.target as HTMLElement | null;
      const scrollParent = findScrollableParent(target);
      if (scrollParent && scrollParent.scrollTop > 0) return;
      startYRef.current = event.touches[0].clientY;
      pullingRef.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pullingRef.current || isRefreshing) return;
      if (startYRef.current === null) return;
      const currentY = event.touches[0].clientY;
      const delta = currentY - startYRef.current;
      if (delta <= 0) return;
      event.preventDefault();
      const next = Math.min(MAX_PULL, delta);
      setPullDistance(next);
    };

    const handleTouchEnd = () => {
      if (!pullingRef.current || isRefreshing) return;
      pullingRef.current = false;
      startYRef.current = null;
      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        window.setTimeout(() => {
          onRefresh();
          setIsRefreshing(false);
          setPullDistance(0);
        }, 300);
        return;
      }
      setPullDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, onRefresh]);

  return (
    <div className="relative h-full w-full">
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex items-center justify-center"
        style={pullDistance > 0 || isRefreshing ? { transform: `translateY(${Math.max(-40, pullDistance - 40)}px)` } : undefined}
        aria-hidden="true"
      />
      <div
        style={pullDistance > 0 || isRefreshing ? { transform: `translateY(${pullDistance}px)` } : undefined}
        className="h-full w-full transition-transform duration-150"
      >
        {children}
      </div>
    </div>
  );
};

const findScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
  let current = node;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return document.scrollingElement as HTMLElement | null;
};
