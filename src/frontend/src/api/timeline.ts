import api from '../lib/api'

export interface TimelineEvent {
    id: string
    worldId: string
    title: string
    description: string | null
    content: string
    date: string
    sortOrder: number
    importance: 'minor' | 'normal' | 'major'
    createdAt: string
    updatedAt: string
}

export const IMPORTANCE_LEVELS = [
    { value: 'minor', label: 'Minor', color: '#64748b' },
    { value: 'normal', label: 'Normal', color: '#60a5fa' },
    { value: 'major', label: 'Major', color: '#f59e0b' },
] as const

export const timelineApi = {
    list: (worldId: string) =>
        api.get<{ events: TimelineEvent[] }>(`/worlds/${worldId}/timeline`),

    get: (worldId: string, id: string) =>
        api.get<TimelineEvent>(`/worlds/${worldId}/timeline/${id}`),

    create: (worldId: string, data: { title: string; date: string; description?: string; content?: string; importance?: string }) =>
        api.post<TimelineEvent>(`/worlds/${worldId}/timeline`, data),

    update: (worldId: string, id: string, data: Partial<{ title: string; description: string; content: string; date: string; sortOrder: number; importance: string }>) =>
        api.patch<TimelineEvent>(`/worlds/${worldId}/timeline/${id}`, data),

    delete: (worldId: string, id: string) =>
        api.delete<{ success: boolean }>(`/worlds/${worldId}/timeline/${id}`),
}
