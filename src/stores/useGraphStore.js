import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from './useAuthStore'

export const useGraphStore = create((set, get) => ({
  nodes: [],
  edges: [],
  loading: false,
  error: null,
  selectedNode: null,
  graphData: { nodes: [], links: [] },
  
  // Filters
  nodeTypeFilter: 'all', // 'all', 'memory', 'person', 'place', 'event'
  timeFilter: 'all', // 'all', 'week', 'month', 'year'
  
  // Graph layout options
  graphConfig: {
    nodeSize: 8,
    linkDistance: 100,
    charge: -300,
    showLabels: true,
    colorScheme: 'default'
  },

  // Set nodes
  setNodes: (nodes) => set({ nodes }),
  
  // Set edges  
  setEdges: (edges) => set({ edges }),
  
  // Set loading
  setLoading: (loading) => set({ loading }),
  
  // Set error
  setError: (error) => set({ error }),
  
  // Set selected node
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  // Set filters
  setNodeTypeFilter: (filter) => set({ nodeTypeFilter: filter }),
  setTimeFilter: (filter) => set({ timeFilter: filter }),
  
  // Update graph config
  updateGraphConfig: (config) => set((state) => ({
    graphConfig: { ...state.graphConfig, ...config }
  })),

  // Load graph data
  loadGraph: async () => {
    const { user } = useAuthStore.getState()
    if (!user) return

    try {
      set({ loading: true, error: null })

      // Load nodes (memories + entities)
      const { data: memories, error: memoriesError } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)

      if (memoriesError) {
        console.error('Error loading memories for graph:', memoriesError)
        set({ error: memoriesError.message, loading: false })
        return
      }

      // Load edges
      const { data: edges, error: edgesError } = await supabase
        .from('graph_edges')
        .select('*')
        .eq('user_id', user.id)

      if (edgesError) {
        console.error('Error loading edges:', edgesError)
        set({ error: edgesError.message, loading: false })
        return
      }

      // Process nodes
      const nodes = []
      const entityNodes = new Map()

      // Add memory nodes
      memories?.forEach(memory => {
        nodes.push({
          id: `memory_${memory.id}`,
          type: 'memory',
          label: memory.content.substring(0, 50) + '...',
          data: memory,
          size: 12,
          color: '#3b82f6'
        })

        // Extract entities and create entity nodes
        const entities = [
          ...(memory.people || []).map(p => ({ type: 'person', value: p })),
          ...(memory.places || []).map(p => ({ type: 'place', value: p })),
          ...(memory.events || []).map(e => ({ type: 'event', value: e }))
        ]

        entities.forEach(entity => {
          const nodeId = `${entity.type}_${entity.value}`
          if (!entityNodes.has(nodeId)) {
            entityNodes.set(nodeId, {
              id: nodeId,
              type: entity.type,
              label: entity.value,
              data: entity,
              size: 8,
              color: entity.type === 'person' ? '#ef4444' : 
                     entity.type === 'place' ? '#10b981' : '#f59e0b'
            })
          }
        })
      })

      // Add entity nodes
      entityNodes.forEach(node => nodes.push(node))

      // Process edges with entity connections
      const processedEdges = []
      
      // Add stored edges
      edges?.forEach(edge => {
        processedEdges.push({
          id: edge.id,
          source: edge.source_node,
          target: edge.target_node,
          type: edge.edge_type,
          weight: edge.weight || 1,
          label: edge.label
        })
      })

      // Add implicit edges between memories and entities
      memories?.forEach(memory => {
        const memoryNodeId = `memory_${memory.id}`
        const entities = [
          ...(memory.people || []).map(p => ({ type: 'person', value: p })),
          ...(memory.places || []).map(p => ({ type: 'place', value: p })),
          ...(memory.events || []).map(e => ({ type: 'event', value: e }))
        ]

        entities.forEach(entity => {
          const entityNodeId = `${entity.type}_${entity.value}`
          processedEdges.push({
            id: `${memoryNodeId}_${entityNodeId}`,
            source: memoryNodeId,
            target: entityNodeId,
            type: 'contains',
            weight: 1
          })
        })
      })

      const { nodeTypeFilter, timeFilter } = get()
      const filteredData = get().applyFilters({ nodes, links: processedEdges }, nodeTypeFilter, timeFilter)

      set({ 
        nodes, 
        edges: processedEdges,
        graphData: filteredData,
        loading: false 
      })

    } catch (error) {
      console.error('Error loading graph:', error)
      set({ error: error.message, loading: false })
    }
  },

  // Apply filters to graph data
  applyFilters: (data, nodeTypeFilter, timeFilter) => {
    let filteredNodes = [...data.nodes]
    let filteredLinks = [...data.links]

    // Filter by node type
    if (nodeTypeFilter !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.type === nodeTypeFilter)
      
      // Keep only edges between filtered nodes
      const nodeIds = new Set(filteredNodes.map(n => n.id))
      filteredLinks = filteredLinks.filter(link => 
        nodeIds.has(link.source) && nodeIds.has(link.target)
      )
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date()
      const timeMap = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
      }
      const cutoff = new Date(now.getTime() - timeMap[timeFilter])

      filteredNodes = filteredNodes.filter(node => {
        if (node.type === 'memory' && node.data.created_at) {
          return new Date(node.data.created_at) > cutoff
        }
        return true // Keep entity nodes
      })

      // Keep only edges between filtered nodes
      const nodeIds = new Set(filteredNodes.map(n => n.id))
      filteredLinks = filteredLinks.filter(link => 
        nodeIds.has(link.source) && nodeIds.has(link.target)
      )
    }

    return { nodes: filteredNodes, links: filteredLinks }
  },

  // Update filters and refresh graph
  updateFilters: (nodeTypeFilter, timeFilter) => {
    const { nodes, edges } = get()
    const filteredData = get().applyFilters({ nodes, links: edges }, nodeTypeFilter, timeFilter)
    
    set({ 
      nodeTypeFilter, 
      timeFilter,
      graphData: filteredData 
    })
  },

  // Add node
  addNode: async (nodeData) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    try {
      // Add to local state
      set((state) => ({
        nodes: [...state.nodes, nodeData]
      }))

      // Note: Memory nodes are created via the memory store
      // Entity nodes don't need to be persisted separately
      
    } catch (error) {
      console.error('Error adding node:', error)
    }
  },

  // Remove node
  removeNode: async (nodeId) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    try {
      // Remove from local state
      set((state) => ({
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(edge => 
          edge.source !== nodeId && edge.target !== nodeId
        )
      }))

      // Remove associated edges from database
      await supabase
        .from('graph_edges')
        .delete()
        .eq('user_id', user.id)
        .or(`source_node.eq.${nodeId},target_node.eq.${nodeId}`)

    } catch (error) {
      console.error('Error removing node:', error)
    }
  },

  // Add edge
  addEdge: async (edgeData) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    try {
      const edge = {
        user_id: user.id,
        source_node: edgeData.source,
        target_node: edgeData.target,
        edge_type: edgeData.type,
        weight: edgeData.weight || 1,
        label: edgeData.label,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('graph_edges')
        .insert(edge)
        .select()
        .single()

      if (error) {
        console.error('Error adding edge:', error)
        return
      }

      // Add to local state
      set((state) => ({
        edges: [...state.edges, {
          id: data.id,
          source: data.source_node,
          target: data.target_node,
          type: data.edge_type,
          weight: data.weight,
          label: data.label
        }]
      }))

    } catch (error) {
      console.error('Error adding edge:', error)
    }
  },

  // Get node neighbors
  getNodeNeighbors: (nodeId) => {
    const { edges, nodes } = get()
    const neighborIds = new Set()
    
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        neighborIds.add(edge.target)
      } else if (edge.target === nodeId) {
        neighborIds.add(edge.source)
      }
    })

    return nodes.filter(node => neighborIds.has(node.id))
  },

  // Get node connections (edges)
  getNodeConnections: (nodeId) => {
    const { edges } = get()
    return edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    )
  },

  // Search nodes
  searchNodes: (query) => {
    const { nodes } = get()
    const searchTerm = query.toLowerCase()
    
    return nodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm) ||
      (node.data?.content && node.data.content.toLowerCase().includes(searchTerm))
    )
  },

  // Get graph statistics
  getGraphStats: () => {
    const { nodes, edges } = get()
    const nodeTypes = {}
    
    nodes.forEach(node => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1
    })

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypes,
      density: nodes.length > 1 ? (2 * edges.length) / (nodes.length * (nodes.length - 1)) : 0
    }
  }
}))