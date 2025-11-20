import { ReactNode, useRef, useEffect, useState } from "react";

interface VirtualizedListProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  itemHeight: number;
  containerHeight: number;
  className?: string;
}

const VirtualizedList = ({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  className,
}: VirtualizedListProps) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateVisibleRange = () => {
      if (!containerRef.current) return;

      const scrollTop = containerRef.current.scrollTop;
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        start + Math.ceil(containerHeight / itemHeight) + 2,
        items.length
      );

      setVisibleRange({ start, end });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", calculateVisibleRange);
      calculateVisibleRange();
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", calculateVisibleRange);
      }
    };
  }, [items.length, itemHeight, containerHeight]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, visibleRange.start + index)
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedList;

