import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  FileText, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  RefreshCw, 
  X, 
  Play, 
  ChevronRight, 
  ChevronDown, 
  Save, 
  ArrowLeft,
  Code,
  FileCode
} from 'lucide-react';
import { FileItem } from '../types';

interface FileExplorerProps {
  onClose: () => void;
  onExecuteInTerminal: (cmd: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  onClose,
  onExecuteInTerminal,
}) => {
  const [currentPath, setCurrentPath] = useState('.');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active File Editor State
  const [editingFile, setEditingFile] = useState<{ path: string; content: string; original: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // New File/Folder Modal
  const [createModal, setCreateModal] = useState<{ open: boolean; isDirectory: boolean; name: string }>({
    open: false,
    isDirectory: false,
    name: '',
  });

  const fetchFiles = async (path: string = currentPath) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/tree?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to list directory');
      }
      const data = await res.json();
      setItems(data.items);
      setCurrentPath(data.currentPath);
    } catch (err: any) {
      setError(err.message || 'Error loading files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles('.');
  }, []);

  const handleOpenFolder = (folderPath: string) => {
    fetchFiles(folderPath);
  };

  const handleGoUp = () => {
    if (currentPath === '.' || currentPath === '') return;
    const parts = currentPath.split('/');
    parts.pop();
    const parentPath = parts.join('/') || '.';
    fetchFiles(parentPath);
  };

  const handleOpenFile = async (fileItem: FileItem) => {
    try {
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(fileItem.path)}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Cannot open file');
      }
      const data = await res.json();
      setEditingFile({ path: data.path, content: data.content, original: data.content });
    } catch (err: any) {
      alert(err.message || 'Error opening file');
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/files/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editingFile.path, content: editingFile.content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setEditingFile({ ...editingFile, original: editingFile.content });
      fetchFiles(currentPath);
    } catch (err: any) {
      alert(err.message || 'Error saving file');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!createModal.name.trim()) return;
    const newPath = currentPath === '.' ? createModal.name.trim() : `${currentPath}/${createModal.name.trim()}`;
    try {
      const res = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath, isDirectory: createModal.isDirectory }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create');
      }
      setCreateModal({ open: false, isDirectory: false, name: '' });
      fetchFiles(currentPath);
    } catch (err: any) {
      alert(err.message || 'Failed to create item');
    }
  };

  const handleDelete = async (fileItem: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${fileItem.name}?`)) return;
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fileItem.path }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      fetchFiles(currentPath);
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const content = reader.result as string;
        const uploadPath = currentPath === '.' ? file.name : `${currentPath}/${file.name}`;
        try {
          await fetch('/api/files/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: uploadPath, content }),
          });
          fetchFiles(currentPath);
        } catch (err) {
          alert(`Failed to upload ${file.name}`);
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <div id="file-explorer-drawer" className="w-64 sm:w-72 bg-[#080808] border-l border-[#1a1a1a] flex flex-col h-full z-20 shrink-0 font-mono text-xs select-none shadow-2xl">
      {/* Drawer Header */}
      <div className="p-2.5 bg-[#0c0c0c] border-b border-[#1a1a1a] flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-widest font-bold shrink-0">
        <div className="flex items-center gap-2">
          <Folder className="w-3.5 h-3.5 text-blue-400" />
          <span>Project Explorer</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchFiles(currentPath)}
            className="p-1 rounded hover:bg-[#1a1a1a] text-neutral-400 hover:text-white transition cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#1a1a1a] text-neutral-400 hover:text-white transition cursor-pointer"
            title="Close Explorer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Path Toolbar */}
      <div className="px-2.5 py-1.5 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 overflow-hidden truncate text-neutral-300">
          {currentPath !== '.' && (
            <button
              onClick={handleGoUp}
              className="px-1.5 py-0.5 rounded bg-[#181818] hover:bg-[#262626] text-neutral-300 cursor-pointer"
              title="Go up directory"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}
          <span className="truncate px-1.5 py-0.5 rounded bg-[#000000] text-[#00ff41] border border-[#1a1a1a]">
            /{currentPath === '.' ? '' : currentPath}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCreateModal({ open: true, isDirectory: false, name: '' })}
            className="p-1 rounded bg-[#1a1a1a] hover:bg-blue-600 text-neutral-200 hover:text-white transition cursor-pointer"
            title="New File"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setCreateModal({ open: true, isDirectory: true, name: '' })}
            className="p-1 rounded bg-[#1a1a1a] hover:bg-blue-600 text-neutral-200 hover:text-white transition cursor-pointer"
            title="New Folder"
          >
            <FolderPlus className="w-3 h-3" />
          </button>
          <label className="p-1 rounded bg-[#1a1a1a] hover:bg-emerald-600 text-neutral-200 hover:text-white transition cursor-pointer inline-flex items-center" title="Upload File">
            <Upload className="w-3 h-3" />
            <input type="file" multiple onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* File List View */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {loading && (
          <div className="text-center py-8 text-[11px] text-neutral-500 font-mono">
            Scanning directory...
          </div>
        )}

        {error && (
          <div className="p-2 rounded bg-rose-950/40 border border-rose-900 text-rose-300 text-[11px] font-mono">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-12 text-[11px] text-neutral-500 font-mono">
            Empty directory
          </div>
        )}

        {!loading &&
          items.map((item) => (
            <div
              key={item.path}
              className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#151515] transition text-[11px] font-mono select-none cursor-pointer border border-transparent hover:border-[#222222]"
            >
              <div
                className="flex items-center gap-2 overflow-hidden truncate flex-1"
                onClick={() =>
                  item.isDirectory ? handleOpenFolder(item.path) : handleOpenFile(item)
                }
              >
                {item.isDirectory ? (
                  <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
                )}
                <span className={`truncate ${item.isDirectory ? 'font-semibold text-slate-100' : 'text-neutral-300'}`}>
                  {item.name}
                </span>
              </div>

              {/* Hover Item Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                {!item.isDirectory && (
                  <button
                    onClick={() => onExecuteInTerminal(`cat "${item.path}"`)}
                    className="p-0.5 rounded hover:bg-[#262626] text-neutral-400 hover:text-[#00ff41] transition cursor-pointer"
                    title="Cat / Run in Terminal"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.path)}
                  className="p-0.5 rounded hover:bg-rose-950/80 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
                  title="Delete Item"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Footer Info Box */}
      <div className="p-2.5 border-t border-[#1a1a1a] bg-[#0c0c0c] shrink-0 text-[10px] text-neutral-500 space-y-0.5 font-mono">
        <div>Local Port: <span className="text-neutral-300 font-bold">3000</span></div>
        <div>Tunnel: <span className="text-[#00ff41]">ACTIVE</span></div>
      </div>

      {/* New Item Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-full max-w-xs shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Create {createModal.isDirectory ? 'Folder' : 'File'}
              </span>
              <button
                onClick={() => setCreateModal({ open: false, isDirectory: false, name: '' })}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder={createModal.isDirectory ? 'Folder name...' : 'filename.txt'}
              value={createModal.name}
              onChange={(e) => setCreateModal({ ...createModal, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSubmit()}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCreateModal({ open: false, isDirectory: false, name: '' })}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Built-in File Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="h-12 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-xs text-slate-200 font-semibold truncate">
                  {editingFile.path}
                </span>
                {editingFile.content !== editingFile.original && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onExecuteInTerminal(`cat "${editingFile.path}"`)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run in Terminal
                </button>
                <button
                  onClick={handleSaveFile}
                  disabled={saving}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save File'}
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-2 bg-slate-950 overflow-hidden flex flex-col">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className="w-full h-full bg-slate-950 text-slate-100 font-mono text-xs p-3 focus:outline-none resize-none leading-relaxed tracking-wide select-text border border-slate-800 rounded"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
