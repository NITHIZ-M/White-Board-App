/**
 * Type declarations for the Doodle Space Application
 */

export type Tool =
  | 'select'
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'sticky'
  | 'image';

export type GridType = 'none' | 'dots' | 'lines';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface Point {
  x: number;
  y: number;
}

export interface BoardElement {
  id: string;
  type: Tool;
  // Position / Bounds
  x: number;
  y: number;
  width: number;
  height: number;
  // Multi-point shapes (paths, lines, arrows)
  points?: Point[];
  // Style properties
  color: string; // stroke/text color
  fillColor?: string; // background of sticky notes, or shape fill
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  // Text content / sizing
  text?: string;
  fontSize?: number;
  // Metadata
  createdAt: number;
  aspectRatio?: number;
}

export interface NotePage {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  elements: BoardElement[];
  offsetX: number;
  offsetY: number;
  scale: number;
  gridType: GridType;
}

export interface CanvasState {
  currentTool: Tool;
  color: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  fontSize: number;
  gridType: GridType;
  snapToGrid: boolean;
}

export interface HistoryState {
  past: BoardElement[][];
  future: BoardElement[][];
}
