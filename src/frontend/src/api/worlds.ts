import api from '../lib/api'

export interface World {
    id: string
    title: string
    description: string | null
    content: string
    metadata: unknown[] | null
    coverImageUrl: string | null
    visibility: string
    ownerId: string
    createdAt: string
    updatedAt: string
    entryCounts?: Record<string, number>
}

export interface WorldListItem {
    id: string
    title: string
    description: string | null
    coverImageUrl: string | null
    visibility: string
    entryCount: number
    createdAt: string
    updatedAt: string
}

export interface WorldsResponse {
    worlds: WorldListItem[]
    total: number
    page: number
    totalPages: number
}

export const worldsApi = {
    // Create new world
    create: (data: { title: string; description?: string; coverImageUrl?: string }) =>
        api.post<World>('/worlds', data),

    // List user's worlds
    list: (params?: { search?: string; page?: number; limit?: number }) =>
        api.get<WorldsResponse>('/worlds', { params }),

    // Get single world with entry counts
    get: (id: string) =>
        api.get<World>('/worlds/' + id),

    // Update world
    update: (id: string, data: Partial<{ title: string; description: string; content: string; metadata: unknown[]; coverImageUrl: string }>) =>
        api.patch<World>('/worlds/' + id, data),

    // Delete world (soft delete)
    delete: (id: string) =>
        api.delete<{ success: boolean }>('/worlds/' + id),
}
