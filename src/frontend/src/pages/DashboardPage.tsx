import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { worldsApi, WorldListItem } from '../api/worlds'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(1)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [worldToDelete, setWorldToDelete] = useState<WorldListItem | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    const { data, isLoading, error } = useQuery({
        queryKey: ['worlds', debouncedSearch, page],
        queryFn: async () => {
            const res = await worldsApi.list({ search: debouncedSearch || undefined, page })
            return res.data
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => worldsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worlds'] })
            setWorldToDelete(null)
        },
    })

    const worlds = data?.worlds || []
    const totalPages = data?.totalPages || 1

    return (
        <div className="min-h-screen bg-[#050810]">
            {/* Header */}
            <header className="border-b border-slate-800/60">
                <div className="mx-auto max-w-6xl px-8 py-4 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-white tracking-tight">ModuleForge</h1>
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-medium text-sm">
                                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm text-slate-400 hidden sm:block">{user?.displayName}</span>
                        </div>
                        <button onClick={logout} className="text-sm text-slate-500 hover:text-white transition-colors">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="mx-auto max-w-6xl px-8 py-12">
                {/* Hero */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                        Welcome back, {user?.displayName?.split(' ')[0]}
                    </h2>
                    <p className="text-slate-500">Manage and explore your worlds</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
                    <div className="relative w-full sm:w-80">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search worlds..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/60 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 text-sm"
                        />
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 text-sm font-medium rounded-xl bg-teal-500 text-white hover:bg-teal-400 transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create World
                    </button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden animate-pulse">
                                <div className="h-36 bg-slate-800/40" />
                                <div className="p-5 space-y-3">
                                    <div className="h-5 w-2/3 bg-slate-800/50 rounded" />
                                    <div className="h-4 w-full bg-slate-800/30 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Failed to load worlds</h3>
                        <p className="text-slate-500 text-sm">Please try again later</p>
                    </div>
                ) : worlds.length === 0 ? (
                    <div className="text-center py-20 max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {search ? 'No worlds found' : 'Start Your Journey'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-8">
                            {search ? 'Try a different search' : 'Create your first world and begin building'}
                        </p>
                        {!search && (
                            <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 text-sm font-medium rounded-xl bg-teal-500 text-white hover:bg-teal-400 transition-colors">
                                Create Your First World
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {worlds.map((world) => (
                                <WorldCard
                                    key={world.id}
                                    world={world}
                                    onClick={() => navigate(`/worlds/${world.id}`)}
                                    onDelete={() => setWorldToDelete(world)}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-500 font-mono">{page} / {totalPages}</span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {showCreateModal && <CreateWorldModal onClose={() => setShowCreateModal(false)} />}
            {worldToDelete && (
                <DeleteWorldModal
                    world={worldToDelete}
                    onConfirm={() => deleteMutation.mutate(worldToDelete.id)}
                    onClose={() => setWorldToDelete(null)}
                    isDeleting={deleteMutation.isPending}
                />
            )}
        </div>
    )
}

function WorldCard({ world, onClick, onDelete }: { world: WorldListItem; onClick: () => void; onDelete: () => void }) {
    const entryCount = world.entryCount || 0

    return (
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden cursor-pointer hover:border-slate-700 transition-all group" onClick={onClick}>
            <div className="relative h-36 overflow-hidden">
                {world.coverImageUrl ? (
                    <img src={world.coverImageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800/50 to-slate-900 flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
            </div>
            <div className="p-5">
                <h3 className="text-base font-semibold text-white truncate mb-1 group-hover:text-teal-400 transition-colors">{world.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-10">{world.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{entryCount} entries</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete() }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

function CreateWorldModal({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const createMutation = useMutation({
        mutationFn: () => worldsApi.create({ title, description }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['worlds'] })
            navigate(`/worlds/${res.data.id}`)
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return
        createMutation.mutate()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold text-white mb-1">Create New World</h2>
                <p className="text-sm text-slate-500 mb-6">Start building your universe</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Name</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="World name" className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50" autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this world about?" rows={3} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">Cancel</button>
                        <button type="submit" disabled={!title.trim() || createMutation.isPending} className="px-5 py-2.5 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400 disabled:opacity-50">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function DeleteWorldModal({ world, onConfirm, onClose, isDeleting }: { world: WorldListItem; onConfirm: () => void; onClose: () => void; isDeleting: boolean }) {
    const [confirmText, setConfirmText] = useState('')
    const canDelete = confirmText === world.title

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md text-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Delete "{world.title}"?</h2>
                <p className="text-sm text-slate-500 mb-6">Type <span className="text-white font-medium">"{world.title}"</span> to confirm</p>
                <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type world name" className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 text-center focus:outline-none focus:border-red-500/50 mb-6" />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">Cancel</button>
                    <button onClick={onConfirm} disabled={!canDelete || isDeleting} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete'}</button>
                </div>
            </div>
        </div>
    )
}
