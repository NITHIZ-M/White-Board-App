import React from 'react';
import { X, HelpCircle, ArrowUpRight } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['V'], desc: 'Select Pointer mode (select/move/resize elements)' },
  { keys: ['H'], desc: 'Hand Tool (panning canvas)' },
  { keys: ['Space', 'Drag'], desc: 'Quick-Pan (hold Spacebar and drag canvas)' },
  { keys: ['P'], desc: 'Pen sketching tool' },
  { keys: ['Y'], desc: 'Highlighter Pen tool' },
  { keys: ['L'], desc: 'Line drawing tool' },
  { keys: ['A'], desc: 'Arrow drawing tool' },
  { keys: ['R'], desc: 'Rectangle shape drawing' },
  { keys: ['O'], desc: 'Ellipse shape drawing' },
  { keys: ['T'], desc: 'Text tool (click canvas to create text; edit text)' },
  { keys: ['S'], desc: 'Sticky note tool (click to place notes)' },
  { keys: ['E'], desc: 'Eraser (click elements or drag over to erase)' },
  { keys: ['Ctrl', 'Z'], desc: 'Undo last change' },
  { keys: ['Ctrl', 'Y'], desc: 'Redo last change' },
  { keys: ['Ctrl', '+ / - / Scroll'], desc: 'Infinite Zoom In / Out centered on cursor' },
  { keys: ['Backspace', 'Delete'], desc: 'Delete currently selected whiteboard element' },
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white/45 dark:bg-slate-950/50 backdrop-blur-2xl rounded-2xl max-w-lg w-full shadow-2xl border border-white/20 dark:border-white/5 flex flex-col overflow-hidden max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-slate-200/30 dark:border-slate-800/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-slate-700 dark:text-slate-350" />
            <span className="font-semibold text-slate-900 dark:text-white text-sm font-sans tracking-wide">
              Whiteboard Guides & Keybindings
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/40 dark:hover:bg-slate-900/50 text-slate-500 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GUIDES AND SHORTCUTS LIST */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin">
          {/* SECRETS TO INFINITE CANVAS */}
          <div className="p-3 bg-white/25 dark:bg-slate-900/20 rounded-xl border border-slate-200/30 dark:border-slate-800/10">
            <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wide text-[10px] font-mono mb-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-ping" />
              Pro Tips: Infinite Zoom & Pan
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Use your **Trackpad (pinch to zoom, 2-finger drag to pan)** or **Mouse scroll wheel (scroll to zoom, drag with scrollwheel or hold Spacebar to pan)**. The zoom is calculated dynamically centering precisely on your mouse pointer, creating a completely seamless vectorspace exploration!
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px] font-mono">
              Keyboard Hotkeys
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {SHORTCUTS.map((sc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-900 border border-slate-150/40 dark:border-slate-800/40 transition-colors"
                >
                  <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                    {sc.desc}
                  </span>
                  <div className="flex gap-1">
                    {sc.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="px-1.5 py-0.5 font-mono text-[9px] font-extrabold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="p-3 bg-white/10 dark:bg-slate-950/20 border-t border-slate-200/30 dark:border-slate-800/10 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-900/90 dark:bg-slate-100 text-white dark:text-slate-950 font-medium rounded-lg text-xs hover:opacity-90 transition shadow-sm cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
