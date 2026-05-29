import React, { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  FileEdit,
  FileDown,
  FileUp,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { NotePage } from '../types';

interface PageListProps {
  pages: NotePage[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onCreatePage: (title?: string) => void;
  onRenamePage: (id: string, newTitle: string) => void;
  onDeletePage: (id: string) => void;
  onImportWorkspace: (pages: NotePage[]) => void;
  onExportWorkspace: () => void;
}

export default function PageList({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onRenamePage,
  onDeletePage,
  onImportWorkspace,
  onExportWorkspace,
}: PageListProps) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(search.toLowerCase())
  );

  const startRename = (page: NotePage) => {
    setEditingId(page.id);
    setEditingText(page.title);
  };

  const saveRename = (id: string) => {
    if (editingText.trim()) {
      onRenamePage(id, editingText.trim());
    }
    setEditingId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported) && imported.length > 0 && imported[0].id && imported[0].title) {
          onImportWorkspace(imported);
          alert('Workspace imported successfully!');
        } else {
          alert('Invalid whiteboard backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-xl border-r border-slate-200/40 dark:border-slate-800/20 w-72 max-w-full text-slate-800 dark:text-slate-200">
      {/* BRAND HEADER */}
      <div className="p-5 border-b border-slate-200/30 dark:border-slate-800/20 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-900/90 dark:bg-slate-100/95 flex items-center justify-center shadow-sm text-white dark:text-slate-900 font-bold text-sm tracking-widest font-mono">
          A
        </div>
        <div>
          <h1 className="text-xs font-semibold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
            ACE Board
          </h1>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase">Infinite Workspace</p>
        </div>
      </div>

      {/* SEARCH PANEL */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-450 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search sketch notebooks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white/40 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/20 hover:border-slate-300/50 dark:hover:border-slate-705/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-450 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition"
          />
        </div>
      </div>

      {/* PAGES LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1.5 scrollbar-thin">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-2">
          <span>Notes & Diagrams</span>
          <span>({filteredPages.length})</span>
        </div>

        {filteredPages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-650 font-mono">
            No entries found.
          </div>
        ) : (
          filteredPages.map(page => {
            const isActive = page.id === activePageId;
            const elementCount = page.elements?.length || 0;
            const updatedDate = new Date(page.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={page.id}
                className={`group relative flex flex-col p-3 rounded-xl cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-white/70 dark:bg-slate-900/50 border-slate-300/30 dark:border-slate-700/35 shadow-sm backdrop-blur-md ring-1 ring-slate-200/20'
                    : 'bg-transparent border-transparent hover:bg-white/35 dark:hover:bg-slate-900/15 hover:border-slate-200/20 dark:hover:border-slate-800/20'
                }`}
                onClick={() => onSelectPage(page.id)}
              >
                <div className="flex items-center justify-between w-full">
                  {editingId === page.id ? (
                    <input
                      type="text"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onBlur={() => saveRename(page.id)}
                      onKeyDown={e => e.key === 'Enter' && saveRename(page.id)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded focus:outline-none w-10/12 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <p className={`text-xs font-semibold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {page.title}
                    </p>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-white/85 dark:bg-slate-900 group-hover:bg-opacity-100 border border-slate-200/30 dark:border-slate-700/30 p-0.5 rounded-lg">
                    <button
                      id={`rename-btn-${page.id}`}
                      onClick={e => {
                        e.stopPropagation();
                        startRename(page);
                      }}
                      className="p-1 hover:text-slate-900 dark:hover:text-white text-slate-400 dark:text-slate-550 rounded"
                      title="Rename notes page"
                    >
                      <FileEdit className="w-3 h-3" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        id={`delete-btn-${page.id}`}
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Delete board "${page.title}" forever?`)) {
                            onDeletePage(page.id);
                          }
                        }}
                        className="p-1 hover:text-red-500 text-slate-400 dark:text-slate-550 rounded"
                        title="Delete page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Meta details */}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                    {elementCount} elements
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                    {updatedDate}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER ACTIONS AND CREATE */}
      <div className="p-4 border-t border-slate-200/30 dark:border-slate-800/20 space-y-2 bg-white/10 dark:bg-[#000000]/10 backdrop-blur-md">
        <button
          id="btn-new-page"
          onClick={() => onCreatePage()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900/90 dark:bg-slate-50/95 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-medium text-xs rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white dark:text-slate-950" />
          Create New Board
        </button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="btn-export-workspace"
            onClick={onExportWorkspace}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white/40 dark:bg-slate-900/10 hover:bg-white/80 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-350 text-[11px] font-medium rounded-lg border border-slate-200/30 dark:border-slate-800/20 transition cursor-pointer"
            title="Download full backup of all boards"
          >
            <FileDown className="w-3.5 h-3.5" />
            Backup All
          </button>

          <label className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white/40 dark:bg-slate-900/10 hover:bg-white/80 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-350 text-[11px] font-medium rounded-lg border border-slate-200/30 dark:border-slate-800/20 cursor-pointer">
            <FileUp className="w-3.5 h-3.5" />
            Restore
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
