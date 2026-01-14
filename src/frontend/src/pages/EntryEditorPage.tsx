import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { entriesApi, MetadataField, EntryType } from '../api/entries'
import { worldsApi } from '../api/worlds'
import TiptapEditor from '../components/TiptapEditor'

// Type configuration without emojis
const TYPE_CONFIG: Record<EntryType, { label: string; color: string; borderColor: string }> = {
    character: { label: 'Character', color: 'rgba(244, 114, 182, 0.15)', borderColor: '#f472b6' },
    location: { label: 'Location', color: 'rgba(52, 211, 153, 0.15)', borderColor: '#34d399' },
    item: { label: 'Item', color: 'rgba(251, 191, 36, 0.15)', borderColor: '#fbbf24' },
    faction: { label: 'Faction', color: 'rgba(167, 139, 250, 0.15)', borderColor: '#a78bfa' },
    custom: { label: 'Custom', color: 'rgba(96, 165, 250, 0.15)', borderColor: '#60a5fa' },
}

export default function EntryEditorPage() {
    const { worldId, entryId } = useParams<{ worldId: string; entryId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [isEditMode, setIsEditMode] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Local editable state
    const [localTitle, setLocalTitle] = useState('')
    const [localDescription, setLocalDescription] = useState('')
    const [localContent, setLocalContent] = useState('')
    const [localMetadata, setLocalMetadata] = useState<MetadataField[]>([])

    // Fetch world for breadcrumb
    const { data: world } = useQuery({
        queryKey: ['worlds', worldId],
        queryFn: () => worldsApi.get(worldId!),
        enabled: !!worldId,
    })

    // Fetch entry
    const { data: entry, isLoading, error } = useQuery({
        queryKey: ['worlds', worldId, 'entries', entryId],
        queryFn: () => entriesApi.get(worldId!, entryId!),
        enabled: !!worldId && !!entryId,
    })

    // Initialize local state when data loads
    useEffect(() => {
        if (entry?.data) {
            setLocalTitle(entry.data.title)
            setLocalDescription(entry.data.description || '')
            setLocalContent(entry.data.content || '')
            setLocalMetadata((entry.data.metadata || []) as MetadataField[])
            setHasUnsavedChanges(false)
        }
    }, [entry?.data])

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: { title: string; description: string; content: string; metadata: MetadataField[] }) =>
            entriesApi.update(worldId!, entryId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worlds', worldId, 'entries', entryId] })
            setHasUnsavedChanges(false)
            setIsSaving(false)
        },
        onError: () => {
            setIsSaving(false)
        },
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => entriesApi.delete(worldId!, entryId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worlds', worldId, 'entries'] })
            queryClient.invalidateQueries({ queryKey: ['worlds', worldId] })
            navigate(`/worlds/${worldId}`)
        },
    })

    const handleSave = () => {
        if (!localTitle.trim()) return
        setIsSaving(true)
        updateMutation.mutate({
            title: localTitle.trim(),
            description: localDescription,
            content: localContent,
            metadata: localMetadata,
        })
    }

    const handleDiscard = () => {
        if (entry?.data) {
            setLocalTitle(entry.data.title)
            setLocalDescription(entry.data.description || '')
            setLocalContent(entry.data.content || '')
            setLocalMetadata((entry.data.metadata || []) as MetadataField[])
            setHasUnsavedChanges(false)
        }
    }

    const markChanged = () => {
        if (!hasUnsavedChanges) setHasUnsavedChanges(true)
    }

    // Loading
    if (isLoading) {
        return (
            <div className="min-h-screen">
                <div className="mx-auto max-w-5xl px-8 py-12">
                    <div className="animate-pulse space-y-6">
                        <div className="h-4 w-24 bg-slate-800 rounded" />
                        <div className="h-8 w-1/2 bg-slate-800/70 rounded" />
                        <div className="h-px bg-slate-800/50" />
                        <div className="h-64 bg-slate-800/40 rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    // Error
    if (error || !entry?.data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md px-8">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">Entry Not Found</h1>
                    <p className="text-slate-400 text-sm mb-6">This entry doesn't exist or you don't have access.</p>
                    <Link to={`/worlds/${worldId}`} className="btn-primary">
                        Return to World
                    </Link>
                </div>
            </div>
        )
    }

    const data = entry.data
    const typeConfig = TYPE_CONFIG[data.type] || TYPE_CONFIG.custom

    return (
        <div className="min-h-screen bg-[#050810]">
            {/* Minimal Header */}
            <header className="border-b border-slate-800/60">
                <div className="mx-auto max-w-5xl px-8 py-4 flex items-center justify-between">
                    <Link
                        to={`/worlds/${worldId}`}
                        className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">{world?.data?.title || 'Back'}</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-2 text-amber-400/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-xs font-medium">Unsaved</span>
                            </div>
                        )}

                        <div className="flex items-center border border-slate-700/50 rounded-lg overflow-hidden">
                            <button
                                onClick={() => {
                                    if (isEditMode && hasUnsavedChanges) {
                                        if (!confirm('Discard unsaved changes?')) return
                                        handleDiscard()
                                    }
                                    setIsEditMode(false)
                                }}
                                className={`px-4 py-2 text-xs font-medium transition-colors ${!isEditMode
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                View
                            </button>
                            <button
                                onClick={() => setIsEditMode(true)}
                                className={`px-4 py-2 text-xs font-medium transition-colors ${isEditMode
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                Edit
                            </button>
                        </div>

                        {isEditMode && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !hasUnsavedChanges}
                                className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal-500 text-white hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        )}

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-5xl px-8 py-10">
                {/* Entry Header */}
                <div className="mb-10">
                    {/* Type Indicator */}
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider mb-5"
                        style={{
                            background: typeConfig.color,
                            borderLeft: `3px solid ${typeConfig.borderColor}`,
                            color: typeConfig.borderColor,
                        }}
                    >
                        {typeConfig.label}
                    </div>

                    {/* Title */}
                    {isEditMode ? (
                        <input
                            type="text"
                            value={localTitle}
                            onChange={(e) => { setLocalTitle(e.target.value); markChanged() }}
                            className="w-full text-4xl font-bold text-white bg-transparent border-none outline-none placeholder-slate-600"
                            placeholder="Entry title"
                        />
                    ) : (
                        <h1 className="text-4xl font-bold text-white tracking-tight">{data.title}</h1>
                    )}

                    {/* Description */}
                    <div className="mt-3">
                        {isEditMode ? (
                            <textarea
                                value={localDescription}
                                onChange={(e) => { setLocalDescription(e.target.value); markChanged() }}
                                className="w-full text-lg text-slate-400 bg-transparent border-none outline-none resize-none placeholder-slate-600"
                                placeholder="Add a brief description..."
                                rows={2}
                            />
                        ) : (
                            <p className="text-lg text-slate-400">
                                {data.description || <span className="text-slate-600 italic">No description</span>}
                            </p>
                        )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-800/50 text-xs text-slate-600">
                        <span>Created {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span>Updated {new Date(data.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <section>
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Content</h2>
                            <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 p-6">
                                {isEditMode ? (
                                    <TiptapEditor
                                        content={localContent}
                                        onUpdate={(content) => { setLocalContent(content); markChanged() }}
                                        autoSave={false}
                                    />
                                ) : (
                                    <div
                                        className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-a:text-teal-400 prose-strong:text-white min-h-32"
                                        dangerouslySetInnerHTML={{
                                            __html: data.content || '<p class="text-slate-600 italic">No content yet.</p>'
                                        }}
                                    />
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <MetadataSidebar
                            metadata={localMetadata}
                            isEditMode={isEditMode}
                            onChange={(updated) => { setLocalMetadata(updated); markChanged() }}
                        />
                    </aside>
                </div>
            </main>

            {/* Delete Modal */}
            {showDeleteModal && (
                <DeleteModal
                    title={data.title}
                    onConfirm={() => deleteMutation.mutate()}
                    onClose={() => setShowDeleteModal(false)}
                    isDeleting={deleteMutation.isPending}
                />
            )}
        </div>
    )
}

// Metadata Sidebar
function MetadataSidebar({
    metadata,
    isEditMode,
    onChange,
}: {
    metadata: MetadataField[]
    isEditMode: boolean
    onChange: (metadata: MetadataField[]) => void
}) {
    const [showAddField, setShowAddField] = useState(false)
    const [newFieldName, setNewFieldName] = useState('')

    const handleFieldChange = (id: string, value: string) => {
        onChange(metadata.map(f => f.id === id ? { ...f, value } : f))
    }

    const handleAddField = () => {
        if (!newFieldName.trim()) return
        const newField: MetadataField = {
            id: `custom_${Date.now()}`,
            name: newFieldName.trim(),
            type: 'text',
            value: '',
        }
        onChange([...metadata, newField])
        setNewFieldName('')
        setShowAddField(false)
    }

    const handleRemoveField = (id: string) => {
        if (id.startsWith('custom_')) {
            onChange(metadata.filter(f => f.id !== id))
        }
    }

    return (
        <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Properties</h2>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 p-5 space-y-5">
                {metadata.length === 0 && !isEditMode ? (
                    <p className="text-sm text-slate-600 italic">No properties defined</p>
                ) : (
                    metadata.map((field) => (
                        <div key={field.id}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                    {field.name}
                                </label>
                                {isEditMode && field.id.startsWith('custom_') && (
                                    <button
                                        onClick={() => handleRemoveField(field.id)}
                                        className="text-slate-600 hover:text-red-400 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {isEditMode ? (
                                field.type === 'dropdown' && field.options ? (
                                    <select
                                        value={field.value}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-teal-500/50"
                                    >
                                        <option value="">Select...</option>
                                        {field.options.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type === 'number' ? 'number' : 'text'}
                                        value={field.value}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                                        placeholder="Enter value..."
                                    />
                                )
                            ) : (
                                <div className="text-sm text-white">
                                    {field.value || <span className="text-slate-600">—</span>}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isEditMode && (
                    <div className="pt-4 border-t border-slate-800/50">
                        {showAddField ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={newFieldName}
                                    onChange={(e) => setNewFieldName(e.target.value)}
                                    placeholder="Property name"
                                    className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleAddField} className="flex-1 py-2 text-xs font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400">
                                        Add
                                    </button>
                                    <button
                                        onClick={() => { setShowAddField(false); setNewFieldName('') }}
                                        className="flex-1 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddField(true)}
                                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-teal-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Property
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// Delete Modal
function DeleteModal({
    title,
    onConfirm,
    onClose,
    isDeleting,
}: {
    title: string
    onConfirm: () => void
    onClose: () => void
    isDeleting: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Delete "{title}"?</h2>
                <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}
