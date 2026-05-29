import React, { useState } from 'react';
import {
  Hand,
  MousePointer,
  Pencil,
  Highlighter,
  Eraser,
  Minus,
  ArrowUpRight,
  Square,
  Circle,
  Type,
  StickyNote,
  Sparkles,
  Image,
} from 'lucide-react';
import { Tool, StrokeStyle } from '../types';

interface ToolbarProps {
  currentTool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  strokeStyle: StrokeStyle;
  setStrokeStyle: (style: StrokeStyle) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  onAddImage: (dataUrl: string) => void;
}

const PALETTE = [
  { name: 'Sleek Purple', value: '#7F52FF' },
  { name: 'Sleek Pink', value: '#B125EA' },
  { name: 'Sleek Orange', value: '#FF8924' },
  { name: 'Dark Slate', value: '#1e293b' },
  { name: 'Electric Blue', value: '#3b82f6' },
  { name: 'Forest Green', value: '#10b981' },
  { name: 'Muted Gray', value: '#64748b' },
  { name: 'Hot Pink', value: '#ec4899' },
  { name: 'Amber Gold', value: '#f59e0b' },
  { name: 'Ink Black', value: '#0f172a' },
  { name: 'Paper White', value: '#ffffff' },
];

const FILL_PALETTE = [
  { name: 'None', value: 'transparent' },
  { name: 'Sleek Pastel Purple', value: 'rgba(127, 82, 255, 0.15)' },
  { name: 'Sleek Pastel Pink', value: 'rgba(177, 37, 234, 0.15)' },
  { name: 'Sleek Pastel Orange', value: 'rgba(255, 137, 36, 0.15)' },
  { name: 'Soft Blue', value: 'rgba(59, 130, 246, 0.15)' },
  { name: 'Soft Green', value: 'rgba(16, 185, 129, 0.15)' },
  { name: 'Soft Yellow', value: 'rgba(245, 158, 11, 0.2)' },
  { name: 'Soft Red', value: 'rgba(226, 56, 56, 0.15)' },
  { name: 'Solid Slate', value: '#334155' },
  { name: 'Solid Light', value: '#f1f5f9' },
];

export default function Toolbar({
  currentTool,
  setTool,
  color,
  setColor,
  fillColor,
  setFillColor,
  strokeWidth,
  setStrokeWidth,
  strokeStyle,
  setStrokeStyle,
  fontSize,
  setFontSize,
  onAddImage,
}: ToolbarProps) {
  const [customHex, setCustomHex] = useState('');

  const handleCustomHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let formatted = customHex.trim();
    if (!formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    // Check if valid hex
    if (/^#[0-9A-F]{6}$/i.test(formatted) || /^#[0-9A-F]{3}$/i.test(formatted)) {
      setColor(formatted);
    }
  };

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select Element', hotkey: 'V' },
    { id: 'pan', icon: Hand, label: 'Pan Canvas', hotkey: 'H' },
    { id: 'pen', icon: Pencil, label: 'Pen Tool', hotkey: 'P' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlighter', hotkey: 'Y' },
    { id: 'line', icon: Minus, label: 'Line', hotkey: 'L' },
    { id: 'arrow', icon: ArrowUpRight, label: 'Arrow', hotkey: 'A' },
    { id: 'rectangle', icon: Square, label: 'Rectangle', hotkey: 'R' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse', hotkey: 'O' },
    { id: 'text', icon: Type, label: 'Text', hotkey: 'T' },
    { id: 'sticky', icon: StickyNote, label: 'Sticky Note', hotkey: 'S' },
    { id: 'eraser', icon: Eraser, label: 'Eraser Tip', hotkey: 'E' },
  ] as const;

  const requiresColor = currentTool !== 'eraser' && currentTool !== 'pan' && currentTool !== 'image';
  const requiresWeight = ['pen', 'highlighter', 'line', 'arrow', 'rectangle', 'ellipse'].includes(currentTool);
  const requiresFill = ['rectangle', 'ellipse', 'sticky'].includes(currentTool);
  const requiresFontSize = ['text', 'sticky'].includes(currentTool);

  return (
    <div className="flex flex-col gap-3 w-full max-w-full">
      {/* TOOL BUTTONS BAR */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-x-auto scrollbar-none justify-center md:justify-start">
        {tools.map(tool => {
          const Icon = tool.icon;
          const isActive = currentTool === tool.id;
          return (
            <button
              key={tool.id}
              id={`tool-btn-${tool.id}`}
              onClick={() => setTool(tool.id)}
              className={`relative group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-950 shadow-md transform scale-[1.03] border border-white/20 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white'
              }`}
              title={`${tool.label} (Key: ${tool.hotkey})`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              {/* Tooltip */}
              <span className="absolute z-50 bottom-12 scale-0 group-hover:scale-100 transition-all duration-150 origin-bottom bg-slate-800 text-white text-[10px] whitespace-nowrap px-2 py-1 rounded shadow-lg">
                {tool.label} <span className="text-slate-400 font-mono ml-1">[{tool.hotkey}]</span>
              </span>
            </button>
          );
        })}

        {/* Stitch Image File Upload button */}
        <button
          key="image-upload"
          id="tool-btn-image"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target?.result && typeof event.target.result === 'string') {
                    onAddImage(event.target.result);
                  }
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}
          className="relative group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 shrink-0 text-slate-600 dark:text-slate-350 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white cursor-pointer"
          title="Stitch Image on Board"
        >
          <Image className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute z-50 bottom-12 scale-0 group-hover:scale-100 transition-all duration-150 origin-bottom bg-slate-800 text-white text-[10px] whitespace-nowrap px-2 py-1 rounded shadow-lg">
            Stitch Image <span className="text-slate-400 font-mono ml-1">Upload</span>
          </span>
        </button>
      </div>

      {/* PROPERTIES DRAWER */}
      {requiresColor && (
        <div className="p-3 bg-white/40 dark:bg-slate-950/45 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 flex flex-col gap-3 animate-fade-in text-[10px] sm:text-xs">
          {/* STROKE COLOR SECTION */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                Stroke / Text Color
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-450 dark:text-slate-500">
                {color}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 max-w-full">
              {PALETTE.map(c => (
                <button
                  key={c.name}
                  id={`color-${c.value}`}
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full border shrink-0 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                    color === c.value
                      ? 'border-slate-800 dark:border-white scale-105 shadow-md'
                      : 'border-slate-200/50 dark:border-slate-800/10'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color === c.value && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.value === '#ffffff' ? 'bg-slate-900' : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              ))}
              {/* Beautiful custom spectrum color picker circle */}
              <label 
                className="relative w-7 h-7 rounded-full border shrink-0 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 overflow-hidden border-slate-300 dark:border-slate-700 shadow-sm"
                style={{ 
                  background: 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)' 
                }}
                title="Select Custom Color Picker"
              >
                <input
                  type="color"
                  value={color.startsWith('#') && color.length === 7 ? color : '#7F52FF'}
                  onChange={e => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              </label>
            </div>
          </div>

          {/* FILL COLOR SECTION */}
          {requiresFill && (
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                  Fill Color
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-450 dark:text-slate-500">
                  {fillColor === 'transparent' ? 'none' : fillColor}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 max-w-full">
                {FILL_PALETTE.map(f => (
                  <button
                    key={f.name}
                    id={`fill-${f.value}`}
                    onClick={() => setFillColor(f.value)}
                    className={`min-w-8 h-7 px-2 rounded-lg border text-[10px] font-medium shrink-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
                      fillColor === f.value
                        ? 'border-slate-800 dark:border-white scale-105 shadow-sm'
                        : 'border-slate-200/30 dark:border-slate-800/10'
                    }`}
                    style={{
                      background: f.value === 'transparent' ? 'none' : f.value,
                    }}
                    title={f.name}
                  >
                    {f.value === 'transparent' ? (
                      <span className="text-slate-450 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider">None</span>
                    ) : (
                      fillColor === f.value && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            f.value === '#ffffff' || f.value === '#f1f5f9'
                              ? 'bg-slate-900'
                              : 'bg-white'
                          }`}
                        />
                      )
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STROKE WEIGHT & STYLE SECTION */}
          {requiresWeight && (
            <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-200/20 dark:border-slate-800/10 pt-2.5">
              {/* Width */}
              <div className="flex-1">
                <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider mb-1.5">
                  Line Weight
                </span>
                <div className="flex gap-1">
                  {[2, 4, 8, 12, 18].map(w => (
                    <button
                      key={w}
                      id={`stroke-weight-${w}`}
                      onClick={() => setStrokeWidth(w)}
                      className={`flex-1 py-1 text-[9px] font-mono rounded-lg border transition ${
                        strokeWidth === w
                          ? 'bg-slate-900/90 dark:bg-white text-white dark:text-slate-900 border-transparent'
                          : 'border-slate-200/40 dark:border-slate-800/15 text-slate-600 dark:text-slate-350 hover:bg-white/40'
                      }`}
                    >
                      {w === 2 ? 'Fine' : w === 4 ? 'Reg' : w === 8 ? 'Bold' : w === 12 ? 'Heavy' : 'Jumbo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="flex-1">
                <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider mb-1.5">
                  Line Style
                </span>
                <div className="flex gap-1 flex-wrap">
                  {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map(style => (
                    <button
                      key={style}
                      id={`stroke-style-${style}`}
                      onClick={() => setStrokeStyle(style)}
                      className={`flex-1 py-1 text-[9px] font-mono capitalize rounded-lg border transition ${
                        strokeStyle === style
                          ? 'bg-slate-900/90 dark:bg-white text-white dark:text-slate-900 border-transparent'
                          : 'border-slate-200/40 dark:border-slate-800/15 text-slate-600 dark:text-slate-350 hover:bg-white/40'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FONT SIZE SECTION */}
          {requiresFontSize && (
            <div className="border-t border-slate-200/20 dark:border-slate-800/10 pt-2.5 animate-fade-in">
              <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider mb-1.5">
                Font Size
              </span>
              <div className="flex gap-1.5">
                {[14, 24, 36, 48].map(size => (
                  <button
                    key={size}
                    id={`font-size-${size}`}
                    onClick={() => setFontSize(size)}
                    className={`flex-1 py-1 text-[10px] font-mono rounded-lg border transition ${
                      fontSize === size
                        ? 'bg-slate-900/90 dark:bg-white text-white dark:text-slate-900 border-transparent'
                        : 'border-slate-200/40 dark:border-slate-800/15 text-slate-600 dark:text-slate-350 hover:bg-white/40'
                    }`}
                  >
                    {size === 14 ? 'Sm' : size === 24 ? 'Md' : size === 36 ? 'Lg' : 'Xl'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
