import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timelineApi, TimelineEvent, IMPORTANCE_LEVELS } from '../api/timeline'

interface TimelineSectionProps {
    worldId: string
}

export default function TimelineSection({ worldId }: TimelineSectionProps) {
    const queryClient = useQueryClient()
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ['timeline', worldId],
        queryFn: () => timelineApi.list(worldId),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => timelineApi.delete(worldId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeline', worldId] })
            setSelectedEvent(null)
        },
    })

    const events = data?.data?.events || []

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-800/40 rounded-xl" />
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Timeline
                    </h3>
                    <span className="text-xs text-slate-600">{events.length} events</span>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Event
                </button>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12 border border-slate-800/50 rounded-xl bg-slate-900/30">
                    <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-medium text-white mb-1">No Timeline Events</h3>
                    <p className="text-sm text-slate-500 mb-4">Track your world's history and chronology</p>
                    <button onClick={() => setShowCreateModal(true)} className="px-5 py-2 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400">
                        Create First Event
                    </button>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-800" />

                    <div className="space-y-4">
                        {events.map((event) => {
                            const importance = IMPORTANCE_LEVELS.find(l => l.value === event.importance) || IMPORTANCE_LEVELS[1]
                            const isSelected = selectedEvent?.id === event.id

                            return (
                                <div key={event.id} className="relative pl-12">
                                    {/* Timeline dot */}
                                    <div
                                        className="absolute left-3.5 top-4 w-3 h-3 rounded-full border-2"
                                        style={{
                                            backgroundColor: isSelected ? importance.color : 'transparent',
                                            borderColor: importance.color,
                                        }}
                                    />

                                    {/* Event card */}
                                    <button
                                        onClick={() => setSelectedEvent(isSelected ? null : event)}
                                        className={`w-full text-left p-4 rounded-xl transition-all ${isSelected
                                            ? 'bg-slate-800/70 border border-slate-700'
                                            : 'bg-slate-900/50 border border-slate-800/50 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${importance.color}20`, color: importance.color }}>
                                                        {event.date}
                                                    </span>
                                                    {event.importance === 'major' && (
                                                        <span className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold">Major</span>
                                                    )}
                                                </div>
                                                <h4 className="text-sm font-medium text-white truncate">{event.title}</h4>
                                                {event.description && (
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                                                )}
                                            </div>

                                            {isSelected && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (confirm('Delete this event?')) {
                                                            deleteMutation.mutate(event.id)
                                                        }
                                                    }}
                                                    className="text-red-400/50 hover:text-red-400 p-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {isSelected && event.content && (
                                            <div
                                                className="mt-4 pt-4 border-t border-slate-700/50 prose prose-invert prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: event.content }}
                                            />
                                        )}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreateEventModal worldId={worldId} onClose={() => setShowCreateModal(false)} />
            )}
        </div>
    )
}

function CreateEventModal({ worldId, onClose }: { worldId: string; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [title, setTitle] = useState('')
    const [date, setDate] = useState('')
    const [description, setDescription] = useState('')
    const [importance, setImportance] = useState('normal')

    const createMutation = useMutation({
        mutationFn: () => timelineApi.create(worldId, { title, date, description, importance }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeline', worldId] })
            onClose()
        },
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-5">New Timeline Event</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="What happened?"
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Date</label>
                        <input
                            type="text"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            placeholder="Year 342, Spring of 1892, etc."
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief summary..."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Importance</label>
                        <div className="flex gap-2">
                            {IMPORTANCE_LEVELS.map(level => (
                                <button
                                    key={level.value}
                                    onClick={() => setImportance(level.value)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${importance === level.value
                                        ? 'border'
                                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-white'
                                        }`}
                                    style={importance === level.value ? { backgroundColor: `${level.color}15`, borderColor: `${level.color}40`, color: level.color } : {}}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-800/50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">Cancel</button>
                    <button
                        onClick={() => createMutation.mutate()}
                        disabled={!title.trim() || !date.trim() || createMutation.isPending}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400 disabled:opacity-50"
                    >
                        {createMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    )
}
