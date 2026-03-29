'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore, useCurrentConversation } from '@/store'
import type { Workspace } from '@/store'
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  ChevronLeft,
  Sun,
  Moon,
  FolderPlus,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Edit3,
  X,
  Check,
  Inbox,
} from 'lucide-react'
import { PersonaSelector } from './PersonaSelector'
import { ModelSelector } from './ModelSelector'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
const {
  conversations,
  currentConversationId,
  createConversation,
  selectConversation,
  deleteConversation,
  setShowSettings,
  theme,
  setTheme,
  setCurrentConversationId,
  workspaces,
  activeWorkspaceId,
  setActiveWorkspace,
  createWorkspace,
  deleteWorkspace,
  renameWorkspace,
  suppressWorkspaceDeleteConfirm,
  setSuppressWorkspaceDeleteConfirm,
  isStreaming,
  liquidResponseEnabled,
  autoTuneEnabled,
  parseltongueConfig,
  noLogMode,
} = useStore()

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showNewWs, setShowNewWs] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const [editingWsId, setEditingWsId] = useState<string | null>(null)
  const [editWsName, setEditWsName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const ctxRef = useRef<HTMLDivElement>(null)
  const isDark = theme !== 'light' && theme !== 'minimal'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const handleCreateWs = () => {
    if (!newWsName.trim()) return
    createWorkspace(newWsName.trim())
    setNewWsName('')
    setShowNewWs(false)
  }

  const handleRenameWs = (id: string) => {
    if (!editWsName.trim()) return
    renameWorkspace(id, editWsName.trim())
    setEditingWsId(null)
  }

  const handleDeleteWs = (id: string) => {
    if (suppressWorkspaceDeleteConfirm) {
      deleteWorkspace(id)
      return
    }
    setDeleteConfirmId(id)
  }

  const confirmDeleteWs = () => {
    if (!deleteConfirmId) return
    if (dontAskAgain) setSuppressWorkspaceDeleteConfirm(true)
    deleteWorkspace(deleteConfirmId)
    setDeleteConfirmId(null)
    setDontAskAgain(false)
  }

  const handleWsContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setCtxMenu({ id, x: e.clientX, y: e.clientY })
  }

  const switchWorkspace = (wsId: string | null) => {
    if (isStreaming) return
    setActiveWorkspace(wsId)
    const wsConvs = wsId ? conversations.filter(c => c.workspaceId === wsId) : conversations
    const currentInWs = wsConvs.some(c => c.id === currentConversationId)
    if (!currentInWs && wsConvs.length > 0) selectConversation(wsConvs[0].id)
  }

  const filteredConvs = activeWorkspaceId
    ? conversations.filter(c => c.workspaceId === activeWorkspaceId)
    : conversations

  const activeConv = useCurrentConversation()
  const convMode = activeConv?.mode || 'standard'
  const modeName = convMode === 'ultraplinian' ? 'ULTRA' : convMode === 'consortium' ? 'CNSRT' : 'STD'
  const modeColor = convMode === 'ultraplinian' ? '#ff6b6b' : convMode === 'consortium' ? '#a78bfa' : 'var(--secondary)'
  const activeFeatures = [
    liquidResponseEnabled && 'LIQ',
    autoTuneEnabled && 'AT',
    parseltongueConfig.enabled && 'PT',
    noLogMode && 'NL',
  ].filter(Boolean)

  return (
    <>
      <aside className={`fixed md:relative z-40 h-screen glass-panel transition-all duration-300
        ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
        <div className="flex flex-col h-full w-72">
          {/* Header */}
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentConversationId(null)}
                className="flex items-center gap-2.5 text-left p-0 border-0 bg-transparent"
                aria-label="Go to home"
              >
                <span className="text-2xl relative -top-[1px]">🜏</span>
                <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--primary)' }}>
                  G0DM0<span className="flipped-e">D</span><span className="flipped-e-soft">E</span>
                </h1>
              </button>
              <button onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                aria-label="Close sidebar">
                <ChevronLeft className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
              </button>
            </div>
            <button onClick={() => createConversation()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--primary)', color: isDark ? '#0a0a0f' : '#ffffff' }}>
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>

          {/* Model & Persona */}
          <div className="px-5 pb-3 space-y-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <ModelSelector />
            <PersonaSelector />
            {/* Status strip */}
            <button onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all
                hover:bg-[var(--glass-hover)]">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: `${modeColor}20`, color: modeColor }}>
                {modeName}
              </span>
              {activeFeatures.map(f => (
                <span key={f as string} className="text-[9px] font-mono" style={{ color: 'var(--secondary)', opacity: 0.7 }}>
                  {f}
                </span>
              ))}
              {activeFeatures.length === 0 && (
                <span className="text-[9px]" style={{ color: 'var(--secondary)', opacity: 0.4 }}>no modules</span>
              )}
            </button>
          </div>

          {/* Workspace tabs */}
          <div className="px-3 pt-3 pb-1 flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => switchWorkspace(null)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap
                transition-all duration-150 ${!activeWorkspaceId ? 'glass' : 'opacity-50 hover:opacity-80'}`}
              style={{ color: !activeWorkspaceId ? 'var(--primary)' : 'var(--secondary)' }}>
              <Inbox className="w-3 h-3" /> All
            </button>
            {workspaces.map(ws => (
              <button key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                onContextMenu={(e) => handleWsContextMenu(e, ws.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap
                  transition-all duration-150 ${activeWorkspaceId === ws.id ? 'glass' : 'opacity-50 hover:opacity-80'}`}
                style={{ color: activeWorkspaceId === ws.id ? 'var(--primary)' : 'var(--secondary)' }}>
                {activeWorkspaceId === ws.id ? <FolderOpen className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
                {editingWsId === ws.id ? (
                  <input type="text" value={editWsName} onChange={e => setEditWsName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameWs(ws.id); if (e.key === 'Escape') setEditingWsId(null) }}
                    onBlur={() => handleRenameWs(ws.id)}
                    className="w-16 bg-transparent border-b text-[11px] outline-none"
                    style={{ borderColor: 'var(--primary)', color: 'var(--text)' }}
                    autoFocus onClick={e => e.stopPropagation()} />
                ) : ws.name}
              </button>
            ))}
            <button onClick={() => setShowNewWs(true)}
              className="p-1.5 rounded-lg opacity-40 hover:opacity-80 transition-all"
              title="New workspace">
              <FolderPlus className="w-3.5 h-3.5" style={{ color: 'var(--secondary)' }} />
            </button>
          </div>

          {/* New workspace form */}
          {showNewWs && (
            <div className="px-3 pb-2 flex items-center gap-1.5">
              <input type="text" value={newWsName} onChange={e => setNewWsName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateWs(); if (e.key === 'Escape') setShowNewWs(false) }}
                placeholder="Workspace name..."
                className="flex-1 px-2.5 py-1.5 text-xs glass-input rounded-lg focus:outline-none"
                style={{ color: 'var(--text)' }} autoFocus />
              <button onClick={handleCreateWs} className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)]">
                <Check className="w-3.5 h-3.5 text-green-400" />
              </button>
              <button onClick={() => { setShowNewWs(false); setNewWsName('') }}
                className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)]">
                <X className="w-3.5 h-3.5" style={{ color: 'var(--secondary)' }} />
              </button>
            </div>
          )}

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {filteredConvs.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: 'var(--secondary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--secondary)' }}>
                  {activeWorkspaceId ? 'No chats in this workspace' : 'No conversations yet'}
                </p>
                <p className="text-xs mt-1 opacity-60" style={{ color: 'var(--secondary)' }}>
                  Start a new chat to begin
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredConvs.map(conv => (
                  <div key={conv.id}
                    className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer
                      transition-all duration-150
                      ${currentConversationId === conv.id ? 'glass-card' : 'hover:bg-[var(--glass-hover)]'}`}
                    onClick={() => !isStreaming && selectConversation(conv.id)}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}>
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--secondary)' }} />
                    <span className="flex-1 truncate text-sm" style={{ color: 'var(--text)' }}>{conv.title}</span>
                    {hoveredId === conv.id && (
                      <button onClick={e => { e.stopPropagation(); deleteConversation(conv.id) }}
                        className="p-1 rounded-md hover:bg-red-500/10 transition-colors"
                        aria-label="Delete conversation">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme}
                className="p-2.5 rounded-xl glass transition-all duration-200 hover:scale-105"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
                  : <Moon className="w-4 h-4" style={{ color: 'var(--secondary)' }} />}
              </button>
              <button onClick={() => setShowSettings(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl glass text-sm font-medium
                  transition-all duration-200 hover:scale-[1.01]"
                style={{ color: 'var(--text)' }}>
                <Settings className="w-4 h-4" style={{ color: 'var(--secondary)' }} /> Settings
              </button>
            </div>
            <div className="mt-3 text-center">
              <p className="text-[11px] font-medium" style={{ color: 'var(--secondary)', opacity: 0.5 }}>
                AGPL-3.0 | Cognition without control
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Workspace right-click context menu */}
      {ctxMenu && (
        <div ref={ctxRef} className="fixed z-[100] glass-panel rounded-xl shadow-2xl py-1 min-w-[140px]"
          style={{ left: ctxMenu.x, top: ctxMenu.y, background: 'var(--dim)' }}>
          <button onClick={() => {
            const ws = workspaces.find(w => w.id === ctxMenu.id)
            if (ws) { setEditingWsId(ws.id); setEditWsName(ws.name); switchWorkspace(ws.id) }
            setCtxMenu(null)
          }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--glass-hover)] transition-colors"
            style={{ color: 'var(--text)' }}>
            <Edit3 className="w-3 h-3" /> Rename
          </button>
          <button onClick={() => { handleDeleteWs(ctxMenu.id); setCtxMenu(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/10 transition-colors text-red-400">
            <Trash2 className="w-3 h-3" /> Delete Workspace
          </button>
        </div>
      )}

      {/* Delete workspace confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative glass-panel rounded-2xl p-6 max-w-sm w-full" style={{ background: 'var(--dim)' }}>
            <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>Delete Workspace?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--secondary)' }}>
              Conversations will be moved to "All", not deleted.
            </p>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={dontAskAgain} onChange={e => setDontAskAgain(e.target.checked)}
                className="rounded" />
              <span className="text-xs" style={{ color: 'var(--secondary)' }}>Don&apos;t ask again</span>
            </label>
            <div className="flex gap-2">
              <button onClick={confirmDeleteWs}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                Delete
              </button>
              <button onClick={() => { setDeleteConfirmId(null); setDontAskAgain(false) }}
                className="flex-1 py-2 rounded-xl text-sm font-medium glass transition-all"
                style={{ color: 'var(--text)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
