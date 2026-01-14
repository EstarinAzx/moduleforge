import { useCallback, useMemo, useState, useEffect } from 'react'
import {
    ReactFlow,
    Node,
    Edge,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    NodeTypes,
    Handle,
    Position,
    EdgeLabelRenderer,
    BaseEdge,
    getSmoothStepPath,
    EdgeProps,
    Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntryListItem, EntryType } from '../api/entries'
import { relationshipsApi, Relationship, RELATIONSHIP_TYPES } from '../api/relationships'

interface RelationshipMapProps {
    entries: EntryListItem[]
    worldId: string
    onNodeClick?: (entryId: string) => void
}

const NODE_COLORS: Record<EntryType, { bg: string; border: string; text: string }> = {
    character: { bg: 'rgba(244, 114, 182, 0.08)', border: '#f472b6', text: '#f9a8d4' },
    location: { bg: 'rgba(52, 211, 153, 0.08)', border: '#34d399', text: '#6ee7b7' },
    item: { bg: 'rgba(251, 191, 36, 0.08)', border: '#fbbf24', text: '#fcd34d' },
    faction: { bg: 'rgba(167, 139, 250, 0.08)', border: '#a78bfa', text: '#c4b5fd' },
    custom: { bg: 'rgba(96, 165, 250, 0.08)', border: '#60a5fa', text: '#93c5fd' },
}

const TYPE_LABELS: Record<EntryType, string> = {
    character: 'Character',
    location: 'Location',
    item: 'Item',
    faction: 'Faction',
    custom: 'Custom',
}

// Custom node with 4 handles
function EntryNode({ data, selected }: { data: { entry: EntryListItem; onNodeClick?: (id: string) => void }; selected?: boolean }) {
    const colors = NODE_COLORS[data.entry.type] || NODE_COLORS.custom
    const label = TYPE_LABELS[data.entry.type] || 'Entry'

    const handleStyle = {
        background: colors.border,
        border: '2px solid #0f172a',
        width: 10,
        height: 10,
    }

    return (
        <div
            onClick={() => data.onNodeClick?.(data.entry.id)}
            className="cursor-pointer"
            style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: `1px solid ${selected ? colors.border : 'rgba(51, 65, 85, 0.5)'}`,
                borderRadius: '12px',
                padding: '14px 18px',
                minWidth: '150px',
                maxWidth: '180px',
                boxShadow: selected ? `0 0 20px -5px ${colors.border}40` : '0 8px 32px -8px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease',
            }}
        >
            {/* Top handle */}
            <Handle type="target" position={Position.Top} id="top" style={{ ...handleStyle, top: -5 }} />

            {/* Bottom handle */}
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: -5 }} />

            {/* Left handle */}
            <Handle type="target" position={Position.Left} id="left" style={{ ...handleStyle, left: -5 }} />

            {/* Right handle */}
            <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: -5 }} />

            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: colors.text }}>
                {label}
            </div>
            <div className="text-white font-medium text-sm truncate">
                {data.entry.title}
            </div>
        </div>
    )
}

// Custom edge - respects handle positions
function LabeledEdge({
    id, sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    data, selected
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX, sourceY, targetX, targetY,
        sourcePosition, targetPosition,
        borderRadius: 16
    })
    const edgeData = data as Record<string, unknown> | undefined
    const label = (edgeData?.label as string) || ''
    const type = (edgeData?.type as string) || 'related'
    const typeInfo = RELATIONSHIP_TYPES.find(t => t.value === type) || RELATIONSHIP_TYPES[0]

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    stroke: selected ? '#14b8a6' : '#334155',
                    strokeWidth: selected ? 2 : 1,
                }}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium cursor-pointer transition-all ${selected
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'bg-slate-800/90 text-slate-500 border border-slate-700/50 hover:text-slate-400'
                        }`}
                >
                    {label || typeInfo.label}
                </div>
            </EdgeLabelRenderer>
        </>
    )
}

const nodeTypes: NodeTypes = { entryNode: EntryNode }
const edgeTypes = { labeled: LabeledEdge }

export default function RelationshipMap({ entries, worldId, onNodeClick }: RelationshipMapProps) {
    const queryClient = useQueryClient()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingEdge, setEditingEdge] = useState<Edge | null>(null)
    const [deletedIds, setDeletedIds] = useState<string[]>([])

    const { data: relationshipsData } = useQuery({
        queryKey: ['relationships', worldId],
        queryFn: () => relationshipsApi.list(worldId),
        enabled: !!worldId,
    })

    const initialNodes: Node[] = useMemo(() => {
        const cols = Math.ceil(Math.sqrt(entries.length))
        const spacing = { x: 250, y: 160 }
        return entries.map((entry, index) => ({
            id: entry.id,
            type: 'entryNode',
            position: { x: 80 + (index % cols) * spacing.x, y: 80 + Math.floor(index / cols) * spacing.y },
            data: { entry, onNodeClick },
        }))
    }, [entries, onNodeClick])

    const initialEdges: Edge[] = useMemo(() => {
        if (!relationshipsData?.data?.relationships) return []
        return relationshipsData.data.relationships.map((rel: Relationship) => ({
            id: rel.id,
            source: rel.sourceId,
            target: rel.targetId,
            type: 'labeled',
            data: { label: rel.label, type: rel.type, dbId: rel.id },
        }))
    }, [relationshipsData])

    const [nodes, , onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    useEffect(() => {
        if (initialEdges.length > 0) setEdges(initialEdges)
    }, [initialEdges, setEdges])

    const saveMutation = useMutation({
        mutationFn: () => {
            const relationships = edges.map(edge => ({
                id: (edge.data as Record<string, unknown>)?.dbId as string | undefined,
                sourceId: edge.source,
                targetId: edge.target,
                label: ((edge.data as Record<string, unknown>)?.label as string) || null,
                type: ((edge.data as Record<string, unknown>)?.type as string) || 'related',
            }))
            return relationshipsApi.bulkSave(worldId, { relationships, deletedIds })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['relationships', worldId] })
            setHasUnsavedChanges(false)
            setDeletedIds([])
        },
    })

    const onConnect = useCallback((params: Connection) => {
        if (!params.source || !params.target) return
        setEdges(eds => [...eds, {
            id: `new_${Date.now()}`,
            source: params.source!,
            target: params.target!,
            sourceHandle: params.sourceHandle || undefined,
            targetHandle: params.targetHandle || undefined,
            type: 'labeled',
            data: { label: '', type: 'related' },
        }])
        setHasUnsavedChanges(true)
    }, [setEdges])

    const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
        setSelectedEdge(edge.id)
        setEditingEdge(edge)
        setShowEditModal(true)
    }, [])

    const handleDeleteSelected = useCallback(() => {
        if (selectedEdge) {
            const edge = edges.find(e => e.id === selectedEdge)
            if (edge && (edge.data as Record<string, unknown>)?.dbId) {
                setDeletedIds(prev => [...prev, (edge.data as Record<string, unknown>).dbId as string])
            }
            setEdges(eds => eds.filter(e => e.id !== selectedEdge))
            setSelectedEdge(null)
            setHasUnsavedChanges(true)
        }
    }, [selectedEdge, edges, setEdges])

    const handleSaveEdgeEdit = useCallback((label: string, type: string) => {
        if (editingEdge) {
            setEdges(eds => eds.map(e => e.id === editingEdge.id ? { ...e, data: { ...e.data, label, type } } : e))
            setHasUnsavedChanges(true)
        }
        setShowEditModal(false)
        setEditingEdge(null)
    }, [editingEdge, setEdges])

    const handleDiscard = useCallback(() => {
        setEdges(initialEdges)
        setDeletedIds([])
        setHasUnsavedChanges(false)
    }, [initialEdges, setEdges])

    if (entries.length === 0) {
        return (
            <div className="text-center py-16 border border-slate-800/50 rounded-xl bg-slate-900/30">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No Connections</h3>
                <p className="text-sm text-slate-500">Add entries to visualize relationships</p>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Relationship Map
                    </h3>
                    <span className="text-xs text-slate-600">{entries.length} entries · {edges.length} connections</span>
                </div>

                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                        <div className="flex items-center gap-1.5 text-amber-400/80 mr-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-xs font-medium">Unsaved</span>
                        </div>
                    )}
                    <button onClick={handleDeleteSelected} disabled={!selectedEdge} className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800/50 text-slate-400 border border-slate-700/50 disabled:opacity-30 hover:text-red-400 hover:border-red-500/30">
                        Delete
                    </button>
                    {hasUnsavedChanges && (
                        <>
                            <button onClick={handleDiscard} className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white">
                                Discard
                            </button>
                            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="px-4 py-1.5 text-xs font-medium rounded-md bg-teal-500 text-white hover:bg-teal-400 disabled:opacity-50">
                                {saveMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-[500px] rounded-xl overflow-hidden'} bg-[#0a0f18] border border-slate-800/50`}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges.map(e => ({ ...e, selected: e.id === selectedEdge }))}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeClick={handleEdgeClick}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={{ type: 'labeled' }}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#1e293b" gap={40} size={1} />

                    {/* Floating Toolkit - Top Left */}
                    <Panel position="top-left" className="bg-slate-900/95 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm shadow-xl">
                        <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Relationship Toolkit
                        </div>

                        <div className="space-y-2 text-xs text-slate-400 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-teal-400" />
                                <span>Drag from dots to connect entries</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                <span>Click on a line to edit/delete</span>
                            </div>
                        </div>

                        {selectedEdge && (
                            <div className="pt-3 border-t border-slate-700/50">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Selected Connection</div>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Connection
                                </button>
                            </div>
                        )}
                    </Panel>

                    {/* Fullscreen Toggle - Top Right */}
                    <Panel position="top-right" className="flex gap-2">
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800/90 text-slate-400 border border-slate-700/50 hover:text-white backdrop-blur-sm"
                        >
                            {isFullscreen ? 'Close' : 'Fullscreen'}
                        </button>
                    </Panel>

                    {/* Legend - Bottom Right */}
                    <Panel position="bottom-right" className="flex gap-1.5">
                        {Object.entries(NODE_COLORS).map(([type, colors]) => (
                            <div key={type} className="px-2 py-1 rounded text-[9px] font-medium bg-slate-900/90 border border-slate-800/50" style={{ color: colors.text }}>
                                {TYPE_LABELS[type as EntryType]}
                            </div>
                        ))}
                    </Panel>
                </ReactFlow>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingEdge && (
                <EditEdgeModal
                    edge={editingEdge}
                    onSave={handleSaveEdgeEdit}
                    onDelete={() => { handleDeleteSelected(); setShowEditModal(false) }}
                    onClose={() => { setShowEditModal(false); setEditingEdge(null) }}
                />
            )}
        </div>
    )
}

function EditEdgeModal({ edge, onSave, onDelete, onClose }: { edge: Edge; onSave: (label: string, type: string) => void; onDelete: () => void; onClose: () => void }) {
    const edgeData = edge.data as Record<string, unknown> | undefined
    const [label, setLabel] = useState((edgeData?.label as string) || '')
    const [type, setType] = useState((edgeData?.type as string) || 'related')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-semibold text-white mb-5">Edit Connection</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {RELATIONSHIP_TYPES.slice(0, 6).map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setType(t.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${type === t.value
                                        ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-white'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Label</label>
                        <input
                            type="text"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="Optional description..."
                            className="w-full px-3 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                        />
                    </div>
                </div>

                <div className="flex justify-between gap-3 mt-6 pt-5 border-t border-slate-800/50">
                    <button onClick={onDelete} className="text-sm text-red-400/80 hover:text-red-400">Remove</button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white">Cancel</button>
                        <button onClick={() => onSave(label, type)} className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-400">Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
