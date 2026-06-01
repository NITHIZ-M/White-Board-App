import React from 'react';
import { ShieldAlert, FileOutput, FileInput, X } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrant: () => void;
  type: 'export' | 'import';
}

export default function PermissionModal({ isOpen, onClose, onGrant, type }: PermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white/80 dark:bg-slate-950/75 backdrop-blur-2xl rounded-3xl max-w-sm w-full shadow-2xl border border-white/20 dark:border-white/5 flex flex-col overflow-hidden animate-scale-up">
        {/* Header Decors */}
        <div className="p-5 border-b border-slate-200/25 dark:border-slate-800/15 flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-500">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Access Request</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg text-slate-450 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            {type === 'export' ? <FileOutput className="w-7 h-7" /> : <FileInput className="w-7 h-7" />}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {type === 'export' ? 'Allow Export & Save Access?' : 'Allow File Import Access?'}
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mt-2">
              {type === 'export'
                ? 'Doodle Space requires permission to export project files to your device. This allows downloading local JSON backups and saving drawings as PNG or SVG images.'
                : 'Doodle Space requires permission to read JSON files from your device. This allows restoring notebooks and importing drawing canvases from saved backups.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/25 dark:border-slate-800/15 flex justify-end gap-2 bg-slate-50/40 dark:bg-slate-900/10">
          <button
            onClick={onClose}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onGrant();
              onClose();
            }}
            className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-semibold transition shadow-md cursor-pointer"
          >
            Grant Access
          </button>
        </div>
      </div>
    </div>
  );
}
