import { useState, useRef } from "react";
import { X } from "lucide-react";
import { Plot } from "@shared/schema";
import { PLOT_COLORS, PlotColor } from "@/types/farm";

interface DraggablePlotProps {
  plot: Plot;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  onMove: (plotId: string, newX: number, newY: number) => void;
  onDelete: (plotId: string) => void;
}

export function DraggablePlot({ 
  plot, 
  cellSize, 
  gridWidth, 
  gridHeight, 
  onMove, 
  onDelete 
}: DraggablePlotProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const plotRef = useRef<HTMLDivElement>(null);

  const colors = PLOT_COLORS[plot.color as PlotColor] || PLOT_COLORS.green;

  const plotStyle = {
    left: `${plot.x * cellSize + 4}px`,
    top: `${plot.y * cellSize + 4}px`,
    width: `${plot.width * cellSize}px`,
    height: `${plot.height * cellSize}px`,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return; // Don't start drag if clicking on delete button
    }

    setIsDragging(true);
    const rect = plotRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !plotRef.current?.parentElement) return;

    const containerRect = plotRef.current.parentElement.getBoundingClientRect();
    const newX = Math.floor((e.clientX - containerRect.left - dragOffset.x) / cellSize);
    const newY = Math.floor((e.clientY - containerRect.top - dragOffset.y) / cellSize);

    // Constrain to grid boundaries
    const constrainedX = Math.max(0, Math.min(gridWidth - plot.width, newX));
    const constrainedY = Math.max(0, Math.min(gridHeight - plot.height, newY));

    if (constrainedX !== plot.x || constrainedY !== plot.y) {
      onMove(plot.id, constrainedX, constrainedY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners when dragging starts
  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Cleanup on unmount or when dragging stops
    setTimeout(() => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }, 0);
  }

  return (
    <div
      ref={plotRef}
      className={`absolute ${colors.bg} border-2 ${colors.border} rounded-lg p-2 cursor-move hover:shadow-lg transition-shadow group select-none ${
        isDragging ? 'shadow-lg scale-105' : ''
      }`}
      style={plotStyle}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-semibold ${colors.text} truncate`}>
          {plot.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(plot.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-100 transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className={`text-xs ${colors.text}`}>
        <div>{plot.width}×{plot.height} units</div>
        <div>({plot.x}, {plot.y})</div>
      </div>
    </div>
  );
}
