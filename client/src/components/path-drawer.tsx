import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Path } from "@shared/schema";
import { localStorageService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface PathDrawerProps {
  path: Path;
  cellSize: number;
  onDelete: (pathId: string) => void;
}

export function PathDrawer({ path, cellSize, onDelete }: PathDrawerProps) {
  const points: Point[] = JSON.parse(path.points);
  
  if (points.length < 2) return null;

  // Create SVG path string
  const pathString = points.reduce((acc, point, index) => {
    const x = point.x * cellSize + cellSize / 2;
    const y = point.y * cellSize + cellSize / 2;
    
    if (index === 0) {
      return `M ${x} ${y}`;
    }
    return `${acc} L ${x} ${y}`;
  }, "");

  // Calculate path bounds for positioning delete button
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  const centerX = ((minX + maxX) / 2) * cellSize;
  const centerY = ((minY + maxY) / 2) * cellSize;

  const getPathColor = (color: string) => {
    switch (color) {
      case "brown": return "#8B4513";
      case "gray": return "#6B7280";
      case "yellow": return "#EAB308";
      default: return "#8B4513";
    }
  };

  return (
    <g className="walking-path group">
      {/* Path stroke */}
      <path
        d={pathString}
        stroke={getPathColor(path.color)}
        strokeWidth={path.width * 2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />
      
      {/* Path overlay for better visibility */}
      <path
        d={pathString}
        stroke="white"
        strokeWidth={Math.max(1, path.width - 1)}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3,3"
        className="opacity-60"
      />
      
      {/* Path label and delete button */}
      <g
        transform={`translate(${centerX}, ${centerY})`}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <rect
          x="-30"
          y="-15"
          width="60"
          height="30"
          fill="white"
          stroke={getPathColor(path.color)}
          strokeWidth="1"
          rx="4"
          className="shadow-sm"
        />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          className="text-xs font-medium fill-current"
          style={{ color: getPathColor(path.color) }}
        >
          {path.name}
        </text>
        <foreignObject x="15" y="-10" width="20" height="20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(path.id);
            }}
            className="w-4 h-4 text-red-500 hover:text-red-700 text-xs p-0 bg-white rounded-full border border-gray-200 hover:bg-red-50 transition-all flex items-center justify-center"
          >
            <X className="w-2 h-2" />
          </button>
        </foreignObject>
      </g>
    </g>
  );
}