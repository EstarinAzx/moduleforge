import { Link } from 'react-router-dom'
import { EntryListItem, EntryType } from '../api/entries'
import EntryTypeIcon, { getEntryTypeConfig } from './EntryTypeIcon'

interface EntryCardProps {
    entry: EntryListItem
    worldId: string
    onDelete: (entry: EntryListItem) => void
}

const TYPE_COLORS: Record<EntryType, { bg: string; border: string; text: string }> = {
    character: { bg: 'rgba(244, 114, 182, 0.08)', border: 'rgba(244, 114, 182, 0.2)', text: '#f472b6' },
    location: { bg: 'rgba(52, 211, 153, 0.08)', border: 'rgba(52, 211, 153, 0.2)', text: '#34d399' },
    item: { bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
    faction: { bg: 'rgba(167, 139, 250, 0.08)', border: 'rgba(167, 139, 250, 0.2)', text: '#a78bfa' },
    custom: { bg: 'rgba(96, 165, 250, 0.08)', border: 'rgba(96, 165, 250, 0.2)', text: '#60a5fa' },
}

export default function EntryCard({ entry, worldId, onDelete }: EntryCardProps) {
    const config = getEntryTypeConfig(entry.type)
    const colors = TYPE_COLORS[entry.type] || TYPE_COLORS.custom

    return (
        <Link
            to={`/worlds/${worldId}/entries/${entry.id}`}
            className="block bg-slate-900/50 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900/70 transition-all group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <EntryTypeIcon type={entry.type} size="sm" />
                    <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: colors.text }}
                    >
                        {config.label}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDelete(entry)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-white truncate mb-1.5 group-hover:text-teal-400 transition-colors">
                {entry.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-500 line-clamp-2 min-h-10 mb-4">
                {entry.description || 'No description'}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-4 border-t border-slate-800/50">
                <span>
                    {new Date(entry.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-500 flex items-center gap-1">
                    Open
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        </Link>
    )
}
