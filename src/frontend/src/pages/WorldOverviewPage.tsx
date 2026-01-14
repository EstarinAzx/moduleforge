import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { worldsApi } from '../api/worlds'
import { entriesApi, EntryType, EntryListItem } from '../api/entries'
import EntryCard from '../components/EntryCard'
import CreateEntryModal from '../components/CreateEntryModal'
import RelationshipMap from '../components/RelationshipMap'
import LoreSection from '../components/LoreSection'
import TimelineSection from '../components/TimelineSection'

// Entry types (excluding lore and event which are now separate sections)
const ENTRY_TYPES: { value: EntryType | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'character', label: 'Characters' },
    { value: 'location', label: 'Locations' },
    { value: 'item', label: 'Items' },
    { value: 'faction', label: 'Factions' },
]

type MainTab = 'entries' | 'lore' | 'timeline'
type ViewMode = 'grid' | 'map'

export default function WorldOverviewPage() {
    const { worldId } = useParams<{ worldId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [mainTab, setMainTab] = useState<MainTab>('entries')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [typeFilter, setTypeFilter] = useState<EntryType | 'all'>('all')
    const [page, setPage] = useState(1)

    const { data: world, isLoading: worldLoading, error: worldError } = useQuery({
        queryKey: ['worlds', worldId],
        queryFn: async () => {
            const res = await worldsApi.get(worldId!)
            return res.data
        },
        enabled: !!worldId,
    })

    const { data: entriesResponse, isLoading: entriesLoading } = useQuery({
        queryKey: ['worlds', worldId, 'entries', typeFilter, page],
        queryFn: async () => {
            const res = await entriesApi.list(worldId!, {
                type: typeFilter === 'all' ? undefined : typeFilter,
                page,
                limit: 50,
            })
            return res.data
        },
        enabled: !!worldId && mainTab === 'entries',
    })

    const { data: allEntriesResponse } = useQuery({
        queryKey: ['worlds', worldId, 'entries', 'all-for-map'],
        queryFn: async () => {
            const res = await entriesApi.list(worldId!, { limit: 100 })
            return res.data
        },
        enabled: !!worldId && mainTab === 'entries' && viewMode === 'map',
    })

    const deleteMutation = useMutation({
        mutationFn: () => worldsApi.delete(worldId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worlds'] })
            navigate('/dashboard')
        },
    })

    const deleteEntryMutation = useMutation({
        mutationFn: (entryId: string) => entriesApi.delete(worldId!, entryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worlds', worldId, 'entries'] })
            queryClient.invalidateQueries({ queryKey: ['worlds', worldId] })
        },
    })

    const handleDeleteEntry = (entry: EntryListItem) => {
        if (window.confirm(`Delete "${entry.title}"?`)) {
            deleteEntryMutation.mutate(entry.id)
        }
    }

    const handleNodeClick = (entryId: string) => {
        navigate(`/worlds/${worldId}/entries/${entryId}`)
    }

    const entries = entriesResponse?.entries || []
    const allEntries = allEntriesResponse?.entries || entries
    const totalPages = entriesResponse?.totalPages || 1

    if (worldLoading) {
        return (
            <div className="min-h-screen bg-[#050810]">
                <div className="h-48 bg-gradient-to-br from-slate-800/30 to-slate-900/30 animate-pulse" />
                <div className="mx-auto max-w-6xl px-8 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 w-1/3 bg-slate-800/50 rounded" />
                        <div className="h-6 w-1/2 bg-slate-800/30 rounded" />
                    </div>
                </div>
            </div>
        )
    }

    if (worldError || !world) {
        return (
            <div className="min-h-screen bg-[#050810] flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">World Not Found</h1>
                    <p className="text-slate-400 text-sm mb-6">This world doesn't exist or you don't have access.</p>
                    <Link to="/dashboard" className="px-5 py-2.5 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050810]">
            {/* Header */}
            <div className="relative h-48 overflow-hidden">
                {world.coverImageUrl ? (
                    <>
                        <img src={world.coverImageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050810]/60 to-[#050810]" />
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800/20 to-slate-900/40 flex items-center justify-center">
                        <svg className="w-20 h-20 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )}
                <Link
                    to="/dashboard"
                    className="absolute top-4 left-6 z-10 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">Dashboard</span>
                </Link>
            </div>

            {/* World Info */}
            <div className="mx-auto max-w-6xl px-8 -mt-16 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{world.title}</h1>
                        {world.description && (
                            <p className="text-base text-slate-400">{world.description}</p>
                        )}
                        {world.entryCounts && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(world.entryCounts).map(([type, count]) => (
                                    <span key={type} className="px-2.5 py-1 text-xs font-medium rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                        {count} {type}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {mainTab === 'entries' && (
                            <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Entry
                            </button>
                        )}
                        <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2.5 text-sm font-medium rounded-lg bg-slate-800/80 text-red-400 border border-red-500/20 hover:bg-red-500/10">
                            Delete World
                        </button>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-800/60 mb-8">
                    {(['entries', 'lore', 'timeline'] as MainTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setMainTab(tab)}
                            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${mainTab === tab
                                ? 'text-white border-teal-500'
                                : 'text-slate-500 border-transparent hover:text-slate-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {mainTab === 'entries' && (
                    <div className="space-y-6">
                        {/* Entry Controls */}
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="flex items-center gap-2 border border-slate-800/60 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`px-4 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'map' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Map
                                </button>
                            </div>

                            {viewMode === 'grid' && (
                                <div className="flex flex-wrap gap-2">
                                    {ENTRY_TYPES.map(({ value, label }) => (
                                        <button
                                            key={value}
                                            onClick={() => { setTypeFilter(value); setPage(1) }}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${typeFilter === value
                                                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                                                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {viewMode === 'grid' ? (
                            <>
                                {entriesLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-40 bg-slate-800/30 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : entries.length === 0 ? (
                                    <div className="text-center py-16 border border-slate-800/50 rounded-xl bg-slate-900/30">
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-1">No Entries Yet</h3>
                                        <p className="text-sm text-slate-500 mb-4">Start building your world</p>
                                        <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400">
                                            Create First Entry
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {entries.map(entry => (
                                                <EntryCard
                                                    key={entry.id}
                                                    entry={entry}
                                                    worldId={worldId!}
                                                    onDelete={handleDeleteEntry}
                                                />
                                            ))}
                                        </div>

                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center gap-4 mt-8">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-sm text-slate-500">{page} / {totalPages}</span>
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <RelationshipMap
                                entries={allEntries}
                                worldId={worldId!}
                                onNodeClick={handleNodeClick}
                            />
                        )}
                    </div>
                )}

                {mainTab === 'lore' && <LoreSection worldId={worldId!} />}
                {mainTab === 'timeline' && <TimelineSection worldId={worldId!} />}
            </div>

            {/* Modals */}
            {showCreateModal && <CreateEntryModal worldId={worldId!} onClose={() => setShowCreateModal(false)} />}
            {showDeleteModal && (
                <DeleteWorldModal
                    title={world.title}
                    onConfirm={() => deleteMutation.mutate()}
                    onClose={() => setShowDeleteModal(false)}
                    isDeleting={deleteMutation.isPending}
                />
            )}
        </div>
    )
}

function DeleteWorldModal({ title, onConfirm, onClose, isDeleting }: { title: string; onConfirm: () => void; onClose: () => void; isDeleting: boolean }) {
    const [confirmText, setConfirmText] = useState('')
    const canDelete = confirmText === title

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md text-center" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Delete "{title}"?</h2>
                <p className="text-sm text-slate-500 mb-6">Type <span className="text-white font-medium">"{title}"</span> to confirm</p>
                <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="Type world name"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 text-center focus:outline-none focus:border-red-500/50 mb-6"
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">Cancel</button>
                    <button onClick={onConfirm} disabled={!canDelete || isDeleting} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50">
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}
