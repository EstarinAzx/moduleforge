import api from '../lib/api'

export type EntryType = 'character' | 'location' | 'item' | 'faction' | 'custom'

export interface MetadataField {
    id: string
    name: string
    type: 'text' | 'number' | 'dropdown'
    value: string
    options?: string[]
}

export interface Entry {
    id: string
    worldId: string
    type: EntryType
    title: string
    description: string | null
    content: string
    metadata: MetadataField[] | null
    coverImageUrl: string | null
    createdAt: string
    updatedAt: string
}

export interface EntryListItem {
    id: string
    type: EntryType
    title: string
    description: string | null
    coverImageUrl: string | null
    createdAt: string
    updatedAt: string
}

export interface EntriesResponse {
    entries: EntryListItem[]
    total: number
    page: number
    totalPages: number
}

export interface EntrySearchResult {
    id: string
    title: string
    type: EntryType
}

export const entriesApi = {
    // Create new entry
    create: (worldId: string, data: { type: EntryType; title: string; description?: string }) =>
        api.post<Entry>(`/worlds/${worldId}/entries`, data),

    // List entries in world
    list: (worldId: string, params?: { type?: EntryType; search?: string; page?: number; limit?: number }) =>
        api.get<EntriesResponse>(`/worlds/${worldId}/entries`, { params }),

    // Get single entry
    get: (worldId: string, entryId: string) =>
        api.get<Entry>(`/worlds/${worldId}/entries/${entryId}`),

    // Update entry
    update: (worldId: string, entryId: string, data: Partial<{ title: string; description: string; content: string; metadata: MetadataField[]; coverImageUrl: string }>) =>
        api.patch<Entry>(`/worlds/${worldId}/entries/${entryId}`, data),

    // Delete entry (soft delete)
    delete: (worldId: string, entryId: string) =>
        api.delete<{ success: boolean }>(`/worlds/${worldId}/entries/${entryId}`),

    // Search entries for linking autocomplete
    search: (worldId: string, query: string) =>
        api.get<{ entries: EntrySearchResult[] }>(`/worlds/${worldId}/entries/search`, { params: { q: query } }),
}
