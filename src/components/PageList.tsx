import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Trash2,
  FileEdit,
  FileDown,
  FileUp,
  Calendar,
  Layers,
  Github,
  Mail,
  Edit3,
  User,
  ShieldCheck,
  ShieldAlert
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
  profileName: string;
  profileRole: string;
  onOpenProfile: () => void;
  isLandscapeMobile?: boolean;
  permissions: { storage: boolean; export: boolean; import: boolean };
  onRequestPermission: (type: 'export' | 'import', onGranted: () => void) => void;
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
  profileName,
  profileRole,
  onOpenProfile,
  isLandscapeMobile = false,
  permissions,
  onRequestPermission,
}: PageListProps) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          alert('Invalid Doodle Space backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be selected again
    e.target.value = '';
  };

  const handleBackupClick = () => {
    onRequestPermission('export', () => {
      onExportWorkspace();
    });
  };

  const handleRestoreClick = () => {
    onRequestPermission('import', () => {
      fileInputRef.current?.click();
    });
  };

  return (
    <div className={`flex flex-col h-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-xl border-r border-slate-200/40 dark:border-slate-800/20 ${isLandscapeMobile ? 'w-60' : 'w-72'} max-w-full text-slate-800 dark:text-slate-200 select-none`}>
      {/* REBRANDED HEADER BRAND & GREETINGS */}
      <div className="p-4 border-b border-slate-200/30 dark:border-slate-800/20 flex flex-col gap-0.5 select-none shrink-0 bg-white/10 dark:bg-slate-950/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center shadow-md text-white font-black text-lg">
            D
          </div>
          <h1 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-mono">
            Doodle Space
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 pl-10 font-medium">
          Make a <span className="font-creative text-violet-500 dark:text-violet-400 text-lg leading-none">Doodle</span>
        </p>
      </div>

      {/* SEARCH PANEL */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-450 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search sketch notebooks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white/40 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/20 hover:border-slate-300/50 dark:hover:border-slate-705/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition text-[11px]"
          />
        </div>
      </div>

      {/* PAGES LIST */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 scrollbar-thin">
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-1">
          <span>Sketch Notebooks</span>
          <span>({filteredPages.length})</span>
        </div>

        {filteredPages.length === 0 ? (
          <div className="p-6 text-center text-[10px] text-slate-400 dark:text-slate-600 font-mono">
            No entries found.
          </div>
        ) : (
          filteredPages.map(page => {
            const isActive = page.id === activePageId;
            const elementCount = page.elements?.length || 0;
            const updatedDate = new Date(page.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={page.id}
                className={`group relative flex flex-col p-2.5 rounded-xl cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-white/70 dark:bg-slate-900/50 border-slate-300/30 dark:border-slate-700/35 shadow-sm backdrop-blur-md ring-1 ring-slate-200/10'
                    : 'bg-transparent border-transparent hover:bg-white/35 dark:hover:bg-slate-900/15 hover:border-slate-200/20'
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
                      className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded focus:outline-none w-10/12 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <p className={`text-[11px] font-semibold truncate max-w-[130px] ${isActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                      {page.title}
                    </p>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-white/90 dark:bg-slate-900 group-hover:bg-opacity-100 border border-slate-200/30 dark:border-slate-700/30 p-0.5 rounded-lg shrink-0">
                    <button
                      id={`rename-btn-${page.id}`}
                      onClick={e => {
                        e.stopPropagation();
                        startRename(page);
                      }}
                      className="p-0.5 hover:text-slate-900 dark:hover:text-white text-slate-400 dark:text-slate-550 rounded"
                      title="Rename notes page"
                    >
                      <FileEdit className="w-2.5 h-2.5" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        id={`delete-btn-${page.id}`}
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Delete Doodle "${page.title}" forever?`)) {
                            onDeletePage(page.id);
                          }
                        }}
                        className="p-0.5 hover:text-red-500 text-slate-400 dark:text-slate-555 rounded"
                        title="Delete page"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Meta details */}
                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                  <span className="flex items-center gap-0.5">
                    <Layers className="w-2.5 h-2.5 text-slate-300 dark:text-slate-700" />
                    {elementCount} items
                  </span>
                  <span>{updatedDate}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER ACTIONS AND CREATE */}
      <div className="p-3 border-t border-slate-200/25 dark:border-slate-800/15 space-y-1.5 bg-white/10 dark:bg-slate-950/10 backdrop-blur-md shrink-0">
        <button
          id="btn-new-page"
          onClick={() => onCreatePage()}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900/90 dark:bg-slate-50/95 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-semibold text-xs rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-white dark:text-slate-950" />
          Create New Doodle
        </button>

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            id="btn-export-workspace"
            onClick={handleBackupClick}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white/40 dark:bg-slate-900/10 hover:bg-white/80 dark:hover:bg-slate-800/60 text-slate-650 dark:text-slate-300 text-[10px] font-medium rounded-lg border border-slate-200/30 dark:border-slate-800/20 transition cursor-pointer"
            title="Download full backup of all doodles"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Backup All</span>
            {permissions.export ? (
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-500 ml-0.5 shrink-0" />
            ) : (
              <ShieldAlert className="w-2.5 h-2.5 text-amber-500 ml-0.5 shrink-0 opacity-60" />
            )}
          </button>

          <button
            onClick={handleRestoreClick}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white/40 dark:bg-slate-900/10 hover:bg-white/80 dark:hover:bg-slate-800/60 text-slate-650 dark:text-slate-300 text-[10px] font-medium rounded-lg border border-slate-200/30 dark:border-slate-800/20 transition cursor-pointer"
            title="Restore workspace from local JSON backup"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Restore</span>
            {permissions.import ? (
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-500 ml-0.5 shrink-0" />
            ) : (
              <ShieldAlert className="w-2.5 h-2.5 text-amber-500 ml-0.5 shrink-0 opacity-60" />
            )}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* PROFILES FOOTER SECTION (USER + ADMIN) */}
      <div className="border-t border-slate-200/25 dark:border-slate-800/15 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 select-none shrink-0">
        {/* Editable User Profile card */}
        <div 
          onClick={onOpenProfile}
          className="p-3 border-b border-slate-200/15 dark:border-slate-800/10 flex items-center gap-2 hover:bg-slate-500/5 cursor-pointer transition-colors group/user"
          title="View & Edit Your User Profile"
        >
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/45 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-xs shrink-0 border border-violet-200/20">
            {profileName ? profileName.charAt(0).toUpperCase() : 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[8px] text-slate-450 dark:text-slate-500 font-mono uppercase tracking-wider">User Profile</span>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover/user:text-violet-500 transition-colors">
              {profileName}
            </h2>
          </div>
          <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/user:opacity-100 transition-opacity shrink-0" />
        </div>

        {/* Permanent read-only Admin Profile card */}
        <div className="p-3 flex flex-col gap-1 bg-slate-100/30 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              N
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Nithish</span>
                <span className="px-1 py-0.2 bg-violet-500/20 text-violet-500 dark:text-violet-400 text-[8px] font-bold rounded uppercase tracking-wider scale-90 select-none">Admin</span>
              </div>
              <p className="text-[9px] text-slate-450 dark:text-slate-500 truncate font-mono">App Creator & Dev</p>
            </div>
          </div>
          <div className="flex gap-2.5 pl-10 text-[9px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">
            <a 
              href="https://github.com/NITHIZ-M" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-violet-500 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <Github className="w-2.5 h-2.5" /> github
            </a>
            <span>•</span>
            <a 
              href="mailto:nithish1436m@gmail.com" 
              className="hover:text-violet-500 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <Mail className="w-2.5 h-2.5" /> support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
