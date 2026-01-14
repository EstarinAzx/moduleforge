import api from '../lib/api'

export interface LoreArticle {
    id: string
    worldId: string
    title: string
    content: string
    category: string
    order: number
    createdAt: string
    updatedAt: string
}

export const LORE_CATEGORIES = [
    { value: 'general', label: 'General' },
    { value: 'magic', label: 'Magic & Powers' },
    { value: 'history', label: 'History' },
    { value: 'culture', label: 'Culture & Society' },
    { value: 'rules', label: 'World Rules' },
] as const

export const loreApi = {
    list: (worldId: string) =>
        api.get<{ articles: LoreArticle[] }>(`/worlds/${worldId}/lore`),

    get: (worldId: string, id: string) =>
        api.get<LoreArticle>(`/worlds/${worldId}/lore/${id}`),

    create: (worldId: string, data: { title: string; content?: string; category?: string }) =>
        api.post<LoreArticle>(`/worlds/${worldId}/lore`, data),

    update: (worldId: string, id: string, data: Partial<{ title: string; content: string; category: string; order: number }>) =>
        api.patch<LoreArticle>(`/worlds/${worldId}/lore/${id}`, data),

    delete: (worldId: string, id: string) =>
        api.delete<{ success: boolean }>(`/worlds/${worldId}/lore/${id}`),
}
