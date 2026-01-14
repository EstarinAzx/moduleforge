import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entriesApi, EntryType } from '../api/entries'
import EntryTypeIcon from './EntryTypeIcon'

interface CreateEntryModalProps {
    worldId: string
    onClose: () => void
}

const ENTRY_TYPES: { type: EntryType; label: string; desc: string }[] = [
    { type: 'character', label: 'Character', desc: 'People, creatures, NPCs' },
    { type: 'location', label: 'Location', desc: 'Places, buildings, regions' },
    { type: 'item', label: 'Item', desc: 'Objects, artifacts, equipment' },
    { type: 'faction', label: 'Faction', desc: 'Groups, organizations' },
    { type: 'custom', label: 'Custom', desc: 'Any other type of entry' },
]

const TYPE_COLORS: Record<EntryType, { bg: string; border: string; hover: string }> = {
    character: { bg: 'rgba(244, 114, 182, 0.05)', border: 'rgba(244, 114, 182, 0.15)', hover: 'rgba(244, 114, 182, 0.12)' },
    location: { bg: 'rgba(52, 211, 153, 0.05)', border: 'rgba(52, 211, 153, 0.15)', hover: 'rgba(52, 211, 153, 0.12)' },
    item: { bg: 'rgba(251, 191, 36, 0.05)', border: 'rgba(251, 191, 36, 0.15)', hover: 'rgba(251, 191, 36, 0.12)' },
    faction: { bg: 'rgba(167, 139, 250, 0.05)', border: 'rgba(167, 139, 250, 0.15)', hover: 'rgba(167, 139, 250, 0.12)' },
    custom: { bg: 'rgba(96, 165, 250, 0.05)', border: 'rgba(96, 165, 250, 0.15)', hover: 'rgba(96, 165, 250, 0.12)' },
}

export default function CreateEntryModal({ worldId, onClose }: CreateEntryModalProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [step, setStep] = useState<'type' | 'details'>('type')
    const [selectedType, setSelectedType] = useState<EntryType | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const createMutation = useMutation({
        mutationFn: () =>
            entriesApi.create(worldId, {
                type: selectedType!,
                title,
                description,
            }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['worlds', worldId, 'entries'] })
            queryClient.invalidateQueries({ queryKey: ['worlds', worldId] })
            navigate(`/worlds/${worldId}/entries/${res.data.id}`)
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedType || !title.trim()) return
        createMutation.mutate()
    }

    const handleTypeSelect = (type: EntryType) => {
        setSelectedType(type)
        setStep('details')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                {step === 'type' ? (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-semibold text-white">Create New Entry</h2>
                            <p className="text-sm text-slate-500 mt-1">Select the type of entry</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {ENTRY_TYPES.map(({ type, label, desc }) => {
                                const colors = TYPE_COLORS[type]
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleTypeSelect(type)}
                                        className="p-4 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5"
                                        style={{
                                            background: colors.bg,
                                            border: `1px solid ${colors.border}`,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = colors.hover
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = colors.bg
                                        }}
                                    >
                                        <div className="mb-3">
                                            <EntryTypeIcon type={type} size="md" />
                                        </div>
                                        <div className="font-medium text-white text-sm">{label}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-8 text-center">
                            <button onClick={onClose} className="text-sm text-slate-500 hover:text-white transition-colors">
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <button
                            type="button"
                            onClick={() => setStep('type')}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-white mb-6 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <EntryTypeIcon type={selectedType!} size="lg" />
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    New {ENTRY_TYPES.find((t) => t.type === selectedType)?.label}
                                </h2>
                                <p className="text-sm text-slate-500">Enter the details below</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Name</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a name..."
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                    Description <span className="text-slate-600 font-normal normal-case">(optional)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-800/50">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || createMutation.isPending}
                                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Entry'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
