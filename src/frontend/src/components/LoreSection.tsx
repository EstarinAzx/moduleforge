import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loreApi, LoreArticle, LORE_CATEGORIES } from '../api/lore'
import TiptapEditor from './TiptapEditor'

interface LoreSectionProps {
    worldId: string
}

export default function LoreSection({ worldId }: LoreSectionProps) {
    const queryClient = useQueryClient()
    const [selectedArticle, setSelectedArticle] = useState<LoreArticle | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ['lore', worldId],
        queryFn: () => loreApi.list(worldId),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LoreArticle> }) =>
            loreApi.update(worldId, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lore', worldId] })
            setIsEditing(false)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => loreApi.delete(worldId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lore', worldId] })
            setSelectedArticle(null)
        },
    })

    const articles = data?.data?.articles || []

    // Group by category
    const grouped = LORE_CATEGORIES.map(cat => ({
        ...cat,
        articles: articles.filter(a => a.category === cat.value),
    })).filter(g => g.articles.length > 0)

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-800/40 rounded-xl" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Lore
                    </h3>
                    <span className="text-xs text-slate-600">{articles.length} articles</span>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Article
                </button>
            </div>

            {articles.length === 0 ? (
                <div className="text-center py-12 border border-slate-800/50 rounded-xl bg-slate-900/30">
                    <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h3 className="text-base font-medium text-white mb-1">No Lore Yet</h3>
                    <p className="text-sm text-slate-500 mb-4">Document your world's rules, history, and culture</p>
                    <button onClick={() => setShowCreateModal(true)} className="px-5 py-2 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400">
                        Create First Article
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Article List */}
                    <div className="lg:col-span-1 space-y-4">
                        {grouped.map(({ label, articles }) => (
                            <div key={label}>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</h4>
                                <div className="space-y-1.5">
                                    {articles.map(article => (
                                        <button
                                            key={article.id}
                                            onClick={() => { setSelectedArticle(article); setIsEditing(false) }}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedArticle?.id === article.id
                                                    ? 'bg-teal-500/10 border border-teal-500/30 text-white'
                                                    : 'bg-slate-900/50 border border-slate-800/50 text-slate-400 hover:text-white hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="font-medium text-sm truncate">{article.title}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Article Detail */}
                    <div className="lg:col-span-2">
                        {selectedArticle ? (
                            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                defaultValue={selectedArticle.title}
                                                id="lore-title-input"
                                                className="text-xl font-semibold text-white bg-transparent border-none outline-none w-full"
                                            />
                                        ) : (
                                            <h3 className="text-xl font-semibold text-white">{selectedArticle.title}</h3>
                                        )}
                                        <span className="text-xs text-slate-500 uppercase tracking-wider mt-1 block">
                                            {LORE_CATEGORIES.find(c => c.value === selectedArticle.category)?.label || 'General'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const titleInput = document.getElementById('lore-title-input') as HTMLInputElement
                                                        const contentEl = document.querySelector('.ProseMirror') as HTMLElement
                                                        updateMutation.mutate({
                                                            id: selectedArticle.id,
                                                            data: {
                                                                title: titleInput?.value || selectedArticle.title,
                                                                content: contentEl?.innerHTML || selectedArticle.content,
                                                            }
                                                        })
                                                    }}
                                                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400"
                                                >
                                                    Save
                                                </button>
                                                <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Delete this article?')) {
                                                            deleteMutation.mutate(selectedArticle.id)
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <TiptapEditor content={selectedArticle.content} onUpdate={() => { }} autoSave={false} />
                                ) : (
                                    <div
                                        className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-a:text-teal-400"
                                        dangerouslySetInnerHTML={{ __html: selectedArticle.content || '<p class="text-slate-600 italic">No content yet.</p>' }}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-16 border border-slate-800/30 rounded-xl border-dashed">
                                <p className="text-sm text-slate-500">Select an article to view</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreateLoreModal worldId={worldId} onClose={() => setShowCreateModal(false)} />
            )}
        </div>
    )
}

function CreateLoreModal({ worldId, onClose }: { worldId: string; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('general')

    const createMutation = useMutation({
        mutationFn: () => loreApi.create(worldId, { title, category }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lore', worldId] })
            onClose()
        },
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-5">New Lore Article</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Article title..."
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                            {LORE_CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => setCategory(cat.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${category === cat.value
                                            ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                                            : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-white'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-800/50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">Cancel</button>
                    <button
                        onClick={() => createMutation.mutate()}
                        disabled={!title.trim() || createMutation.isPending}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400 disabled:opacity-50"
                    >
                        {createMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    )
}
