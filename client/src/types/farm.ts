import { type Farm, type Plot } from "@shared/schema";

export interface FarmWithPlots extends Farm {
  plots: Plot[];
}

export type PlotColor = 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'red';

export interface GridPosition {
  x: number;
  y: number;
}

export interface GridSize {
  width: number;
  height: number;
}

export const PLOT_COLORS: Record<PlotColor, { bg: string; border: string; text: string }> = {
  green: {
    bg: 'bg-green-200',
    border: 'border-green-400',
    text: 'text-green-800',
  },
  blue: {
    bg: 'bg-blue-200',
    border: 'border-blue-400',
    text: 'text-blue-800',
  },
  yellow: {
    bg: 'bg-yellow-200',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
  },
  purple: {
    bg: 'bg-purple-200',
    border: 'border-purple-400',
    text: 'text-purple-800',
  },
  orange: {
    bg: 'bg-orange-200',
    border: 'border-orange-400',
    text: 'text-orange-800',
  },
  red: {
    bg: 'bg-red-200',
    border: 'border-red-400',
    text: 'text-red-800',
  },
};
