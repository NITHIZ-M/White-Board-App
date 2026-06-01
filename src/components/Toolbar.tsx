import React, { useState, useEffect, useRef } from 'react';
import {
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

// ==========================================
// COLOR CONVERSION HELPER FUNCTIONS
// ==========================================

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return { h: 250, s: 100, l: 66 };
  }

  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const val = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * val).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function parseToHsla(colorStr: string): { h: number; s: number; l: number; a: number } {
  if (!colorStr || colorStr === 'transparent') {
    return { h: 0, s: 0, l: 0, a: 0 };
  }

  if (colorStr.startsWith('#')) {
    const hsl = hexToHsl(colorStr);
    return { ...hsl, a: 1 };
  }

  const rgbaRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i;
  const match = colorStr.match(rgbaRegex);
  if (match) {
    let r = parseInt(match[1], 10) / 255;
    let g = parseInt(match[2], 10) / 255;
    let b = parseInt(match[3], 10) / 255;
    let a = match[4] !== undefined ? parseFloat(match[4]) : 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a: a,
    };
  }

  return { h: 250, s: 100, l: 66, a: 1 };
}

function hslaToRgba(h: number, s: number, l: number, a: number): string {
  if (a === 0) return 'transparent';
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const c = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const val = l - c * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * val);
  };
  return `rgba(${f(0)}, ${f(8)}, ${f(4)}, ${a.toFixed(2)})`;
}

// ==========================================
// CUSTOM COLOR STUDIO PICKER COMPONENT
// ==========================================

interface CustomColorStudioProps {
  color: string;
  onChange: (color: string) => void;
  isFill?: boolean;
}

function CustomColorStudio({ color, onChange, isFill = false }: CustomColorStudioProps) {
  const hsla = parseToHsla(color);
  const [h, setH] = useState(hsla.h);
  const [s, setS] = useState(hsla.s);
  const [l, setL] = useState(hsla.l);
  const [a, setA] = useState(hsla.a);
  const [hexInput, setHexInput] = useState(() => {
    return hsla.a === 0 ? 'transparent' : hslToHex(hsla.h, hsla.s, hsla.l);
  });
  const [isDraggingPad, setIsDraggingPad] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextHsla = parseToHsla(color);
    setH(nextHsla.h);
    setS(nextHsla.s);
    setL(nextHsla.l);
    setA(nextHsla.a);
    setHexInput(nextHsla.a === 0 ? 'transparent' : hslToHex(nextHsla.h, nextHsla.s, nextHsla.l));
  }, [color]);

  const updateColor = (newH: number, newS: number, newL: number, newA: number) => {
    setH(newH);
    setS(newS);
    setL(newL);
    setA(newA);
    
    if (isFill && newA === 0) {
      onChange('transparent');
      setHexInput('transparent');
    } else {
      const hex = hslToHex(newH, newS, newL);
      setHexInput(hex);
      if (isFill) {
        onChange(hslaToRgba(newH, newS, newL, newA));
      } else {
        onChange(hex);
      }
    }
  };

  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingPad(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePadPointerMove(e);
  };

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    
    const nextS = Math.round((x / rect.width) * 100);
    const nextL = Math.round(100 - (y / rect.height) * 100);
    updateColor(h, nextS, nextL, a);
  };

  const handlePadPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingPad(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let val = hexInput.trim().toLowerCase();
    if (val === 'transparent') {
      if (isFill) {
        updateColor(h, s, l, 0);
      }
      return;
    }
    if (!val.startsWith('#')) {
      val = '#' + val;
    }
    if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
      const parsed = hexToHsl(val);
      updateColor(parsed.h, parsed.s, parsed.l, a === 0 ? 1 : a);
    }
  };

  const harmonies = [
    { name: 'Mono', h: h, s: s, l: Math.max(15, l - 20) },
    { name: 'Contrast', h: (h + 180) % 360, s: s, l: l },
    { name: 'Analog', h: (h + 30) % 360, s: s, l: l },
  ];

  return (
    <div className="flex flex-col gap-2 text-[10px] sm:text-xs select-none">
      {/* 2D SATURATION-LIGHTNESS PAD */}
      <div 
        ref={padRef}
        onPointerDown={handlePadPointerDown}
        onPointerMove={isDraggingPad ? handlePadPointerMove : undefined}
        onPointerUp={handlePadPointerUp}
        className="w-full h-24 relative rounded-lg overflow-hidden cursor-crosshair border border-slate-200/30 dark:border-slate-800/15 touch-none shadow-inner"
        style={{
          background: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))
          `
        }}
      >
        <div 
          className="w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] absolute pointer-events-none"
          style={{
            left: `${s}%`,
            top: `${100 - l}%`,
            backgroundColor: hslToHex(h, s, l)
          }}
        />
      </div>

      {/* HUE SLIDER */}
      <div>
        <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-0.5 pl-0.5">
          <span>Hue Spectrum</span>
          <span>{h}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={h}
          onChange={e => updateColor(Number(e.target.value), s, l, a)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            WebkitAppearance: 'none'
          }}
        />
      </div>

      {/* OPACITY SLIDER */}
      {isFill && (
        <div>
          <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-0.5 pl-0.5">
            <span>Fill Opacity</span>
            <span>{Math.round(a * 100)}%</span>
          </div>
          <div className="relative w-full h-2 rounded-lg overflow-hidden border border-slate-200/20 dark:border-slate-800/10">
            <div 
              className="absolute inset-0 -z-10"
              style={{
                backgroundImage: 'conic-gradient(#ccc 0.25turn, #fff 0.25turn 0.5turn, #ccc 0.5turn 0.75turn, #fff 0.75turn)',
                backgroundSize: '8px 8px'
              }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={a}
              onChange={e => updateColor(h, s, l, Number(e.target.value))}
              className="w-full h-full appearance-none bg-transparent cursor-pointer"
              style={{
                background: `linear-gradient(to right, transparent, hsl(${h}, ${s}%, ${l}%))`,
                WebkitAppearance: 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* HEX INPUT AND PREVIEW */}
      <div className="flex gap-2 items-center border-t border-slate-200/20 dark:border-slate-800/10 pt-2">
        <form onSubmit={handleHexSubmit} className="flex-1 flex gap-1 items-center">
          <span className="text-[8px] font-mono text-slate-400 uppercase">Hex:</span>
          <input
            type="text"
            value={hexInput}
            onChange={e => setHexInput(e.target.value)}
            onBlur={handleHexSubmit}
            placeholder="#ffffff"
            className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/30 rounded-md text-[9px] font-mono outline-none text-slate-800 dark:text-white"
          />
        </form>
        <div 
          className="w-6 h-5 rounded border border-slate-200 dark:border-slate-800 shadow-sm shrink-0" 
          style={{
            backgroundColor: isFill ? hslaToRgba(h, s, l, a) : hslToHex(h, s, l)
          }}
        />
      </div>

      {/* MATCHING HARMONIES */}
      <div className="border-t border-slate-200/20 dark:border-slate-800/10 pt-2">
        <span className="block text-[8px] font-mono text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1 pl-0.5">Harmonic Pairs</span>
        <div className="flex gap-1.5">
          {harmonies.map(har => {
            const hex = hslToHex(har.h, har.s, har.l);
            const val = isFill ? hslaToRgba(har.h, har.s, har.l, a === 0 ? 0.35 : a) : hex;
            return (
              <button
                key={har.name}
                type="button"
                onClick={() => updateColor(har.h, har.s, har.l, a === 0 ? 0.45 : a)}
                className="flex-1 p-1 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-200/30 dark:border-slate-800/10 rounded-lg transition flex items-center justify-between gap-1 shadow-sm cursor-pointer"
              >
                <span className="text-[8px] font-semibold text-slate-500">{har.name}</span>
                <span 
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm shrink-0" 
                  style={{ backgroundColor: val }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
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
  const [activePicker, setActivePicker] = useState<'stroke' | 'fill' | null>(null);

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select Element', hotkey: 'V' },
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
    <div className="flex flex-col-reverse gap-3 w-full max-w-full">
      {/* TOOL BUTTONS BAR */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/5 justify-center md:justify-start max-w-full">
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
          title="Stitch Image on Doodle"
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
                  onClick={() => {
                    setColor(c.value);
                    setActivePicker(null);
                  }}
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
              {/* Upgraded custom interactive color wheel trigger */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActivePicker(activePicker === 'stroke' ? null : 'stroke');
                  }}
                  className={`w-7 h-7 rounded-full border shrink-0 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 overflow-hidden shadow-sm relative cursor-pointer ${
                    activePicker === 'stroke'
                      ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-950 scale-105 border-transparent'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                  style={{ 
                    background: 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)' 
                  }}
                  title="Custom Stroke Color Picker Studio"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                </button>

                {/* Custom Stroke Color Wheel Studio Popover */}
                {activePicker === 'stroke' && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setActivePicker(null)} />
                    <div className="absolute bottom-[calc(100%+12px)] right-0 z-50 w-60 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/40 animate-scale-up">
                      <CustomColorStudio 
                        color={color} 
                        onChange={(c) => setColor(c)} 
                        isFill={false}
                      />
                    </div>
                  </>
                )}
              </div>
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
                    onClick={() => {
                      setFillColor(f.value);
                      setActivePicker(null);
                    }}
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

                {/* Custom Fill Color Picker Trigger */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePicker(activePicker === 'fill' ? null : 'fill');
                    }}
                    className={`min-w-8 h-7 px-2 rounded-lg border text-[10px] font-semibold shrink-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer select-none ${
                      activePicker === 'fill'
                        ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-950 scale-105 border-transparent'
                        : 'border-slate-350 dark:border-slate-700'
                    }`}
                    style={{
                      background: 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)'
                    }}
                    title="Open Custom Fill Color Studio"
                  >
                    <span className="text-white mix-blend-difference font-mono text-[9px] uppercase tracking-wider font-bold">Custom</span>
                  </button>

                  {/* Custom Fill Color Wheel Studio Popover */}
                  {activePicker === 'fill' && (
                    <>
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setActivePicker(null)} />
                      <div className="absolute bottom-[calc(100%+12px)] right-0 z-50 w-60 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/40 animate-scale-up">
                        <CustomColorStudio 
                          color={fillColor} 
                          onChange={(c) => setFillColor(c)} 
                          isFill={true}
                        />
                      </div>
                    </>
                  )}
                </div>
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
