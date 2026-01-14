import { EntryType } from '../api/entries'

interface EntryTypeIconProps {
    type: EntryType
    size?: 'sm' | 'md' | 'lg'
}

const TYPE_CONFIG: Record<EntryType, { label: string; color: string }> = {
    character: { label: 'Character', color: '#f472b6' },
    location: { label: 'Location', color: '#34d399' },
    item: { label: 'Item', color: '#fbbf24' },
    faction: { label: 'Faction', color: '#a78bfa' },
    custom: { label: 'Custom', color: '#60a5fa' },
}

export function getEntryTypeConfig(type: EntryType) {
    return {
        ...TYPE_CONFIG[type] || { label: 'Entry', color: '#14b8a6' },
        icon: '',
    }
}

export default function EntryTypeIcon({ type, size = 'md' }: EntryTypeIconProps) {
    const config = TYPE_CONFIG[type] || { label: 'Entry', color: '#14b8a6' }

    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    }

    const iconSize = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    }

    const icons: Record<EntryType, React.ReactNode> = {
        character: (
            <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        location: (
            <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        item: (
            <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        faction: (
            <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        custom: (
            <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
    }

    return (
        <div
            className={`${sizeClasses[size]} rounded-lg flex items-center justify-center`}
            style={{
                background: `${config.color}15`,
                border: `1px solid ${config.color}30`,
                color: config.color,
            }}
        >
            {icons[type] || icons.custom}
        </div>
    )
}

