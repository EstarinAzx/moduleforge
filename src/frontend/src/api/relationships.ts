import api from '../lib/api'

export interface Relationship {
    id: string
    sourceId: string
    targetId: string
    worldId: string
    label: string | null
    type: string
    createdAt: string
    updatedAt: string
    source?: { id: string; title: string; type: string }
    target?: { id: string; title: string; type: string }
}

export interface BulkSavePayload {
    relationships: {
        id?: string
        sourceId: string
        targetId: string
        label?: string | null
        type: string
    }[]
    deletedIds?: string[]
}

export const relationshipsApi = {
    // List all relationships for a world
    list: (worldId: string) =>
        api.get<{ relationships: Relationship[] }>(`/worlds/${worldId}/relationships`),

    // Create a single relationship
    create: (worldId: string, data: { sourceId: string; targetId: string; label?: string; type?: string }) =>
        api.post<Relationship>(`/worlds/${worldId}/relationships`, data),

    // Update a relationship
    update: (worldId: string, relationshipId: string, data: { label?: string; type?: string }) =>
        api.patch<Relationship>(`/worlds/${worldId}/relationships/${relationshipId}`, data),

    // Delete a relationship
    delete: (worldId: string, relationshipId: string) =>
        api.delete(`/worlds/${worldId}/relationships/${relationshipId}`),

    // Bulk save (create, update, delete in one call)
    bulkSave: (worldId: string, payload: BulkSavePayload) =>
        api.post<{ saved: number; deleted: number }>(`/worlds/${worldId}/relationships/bulk`, payload),
}

// Relationship type options for UI dropdowns
export const RELATIONSHIP_TYPES = [
    { value: 'related', label: 'Related to', icon: '🔗' },
    { value: 'parent', label: 'Parent of', icon: '👆' },
    { value: 'child', label: 'Child of', icon: '👇' },
    { value: 'allies', label: 'Allies with', icon: '🤝' },
    { value: 'enemies', label: 'Enemies with', icon: '⚔️' },
    { value: 'located_in', label: 'Located in', icon: '📍' },
    { value: 'belongs_to', label: 'Belongs to', icon: '📦' },
    { value: 'owns', label: 'Owns', icon: '👑' },
    { value: 'created', label: 'Created', icon: '✨' },
    { value: 'member_of', label: 'Member of', icon: '👥' },
] as const
