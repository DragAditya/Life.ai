import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from './useAuthStore'
import { useGraphStore } from './useGraphStore'

export const useMemoryStore = create((set, get) => ({
  memories: [],
  loading: false,
  error: null,
  filters: {
    dateRange: null,
    people: [],
    tags: [],
    searchQuery: ''
  },
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  pageSize: 20,

  // Set memories
  setMemories: (memories) => set({ memories }),
  
  // Set loading state
  setLoading: (loading) => set({ loading }),
  
  // Set error
  setError: (error) => set({ error }),
  
  // Clear error
  clearError: () => set({ error: null }),

  // Set filters
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  // Clear filters
  clearFilters: () => set({
    filters: {
      dateRange: null,
      people: [],
      tags: [],
      searchQuery: ''
    }
  }),

  // Load memories with filters and pagination
  loadMemories: async (page = 1) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    try {
      set({ loading: true, error: null })

      const { filters, pageSize } = get()
      const offset = (page - 1) * pageSize

      let query = supabase
        .from('memories')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      // Apply filters
      if (filters.searchQuery) {
        query = query.textSearch('content', filters.searchQuery)
      }

      if (filters.dateRange) {
        const { start, end } = filters.dateRange
        query = query.gte('created_at', start).lte('created_at', end)
      }

      if (filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error loading memories:', error)
        set({ error: error.message, loading: false })
        return
      }

      const totalPages = Math.ceil(count / pageSize)

      set({ 
        memories: data || [], 
        loading: false,
        currentPage: page,
        totalPages
      })

    } catch (error) {
      console.error('Error loading memories:', error)
      set({ error: error.message, loading: false })
    }
  },

  // Save new memory
  saveMemory: async (memoryData) => {
    const { user } = useAuthStore.getState()
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      const { addNode, addEdge } = useGraphStore.getState()

      const memory = {
        user_id: user.id,
        content: memoryData.content,
        tags: memoryData.tags || [],
        people: memoryData.people || [],
        places: memoryData.places || [],
        events: memoryData.events || [],
        sentiment: memoryData.sentiment || 'neutral',
        confidence: memoryData.confidence || 0.8,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('memories')
        .insert(memory)
        .select()
        .single()

      if (error) {
        console.error('Error saving memory:', error)
        return { success: false, error: error.message }
      }

      // Add to local state
      set((state) => ({
        memories: [data, ...state.memories]
      }))

      // Update knowledge graph
      await addNode({
        id: data.id,
        type: 'memory',
        label: memoryData.content.substring(0, 50) + '...',
        data: data
      })

      // Add edges for people, places, events
      const allEntities = [
        ...memoryData.people?.map(p => ({ type: 'person', value: p })) || [],
        ...memoryData.places?.map(p => ({ type: 'place', value: p })) || [],
        ...memoryData.events?.map(e => ({ type: 'event', value: e })) || []
      ]

      for (const entity of allEntities) {
        await addEdge({
          source: data.id,
          target: entity.value,
          type: entity.type,
          weight: 1
        })
      }

      return { success: true, data }

    } catch (error) {
      console.error('Error saving memory:', error)
      return { success: false, error: error.message }
    }
  },

  // Update memory
  updateMemory: async (id, updates) => {
    const { user } = useAuthStore.getState()
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('memories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating memory:', error)
        return { success: false, error: error.message }
      }

      // Update local state
      set((state) => ({
        memories: state.memories.map(memory => 
          memory.id === id ? data : memory
        )
      }))

      return { success: true, data }

    } catch (error) {
      console.error('Error updating memory:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete memory
  deleteMemory: async (id) => {
    const { user } = useAuthStore.getState()
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      const { removeNode } = useGraphStore.getState()

      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting memory:', error)
        return { success: false, error: error.message }
      }

      // Remove from local state
      set((state) => ({
        memories: state.memories.filter(memory => memory.id !== id)
      }))

      // Remove from graph
      await removeNode(id)

      return { success: true }

    } catch (error) {
      console.error('Error deleting memory:', error)
      return { success: false, error: error.message }
    }
  },

  // Search memories
  searchMemories: async (query) => {
    const { user } = useAuthStore.getState()
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .textSearch('content', query)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error searching memories:', error)
        return []
      }

      return data || []

    } catch (error) {
      console.error('Error searching memories:', error)
      return []
    }
  },

  // Forget memories (smart delete based on query)
  forgetMemories: async (query) => {
    const { user } = useAuthStore.getState()
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      const { removeNode } = useGraphStore.getState()

      // First, find memories matching the query
      const { data: memoriesToDelete, error: searchError } = await supabase
        .from('memories')
        .select('id')
        .eq('user_id', user.id)
        .textSearch('content', query)

      if (searchError) {
        console.error('Error finding memories to forget:', searchError)
        return { success: false, error: searchError.message }
      }

      if (!memoriesToDelete || memoriesToDelete.length === 0) {
        return { success: false, error: 'No memories found matching the query' }
      }

      // Delete the memories
      const { error: deleteError } = await supabase
        .from('memories')
        .delete()
        .eq('user_id', user.id)
        .textSearch('content', query)

      if (deleteError) {
        console.error('Error deleting memories:', deleteError)
        return { success: false, error: deleteError.message }
      }

      // Remove from local state
      const deletedIds = memoriesToDelete.map(m => m.id)
      set((state) => ({
        memories: state.memories.filter(memory => !deletedIds.includes(memory.id))
      }))

      // Remove from graph
      for (const id of deletedIds) {
        await removeNode(id)
      }

      return { success: true, deletedCount: memoriesToDelete.length }

    } catch (error) {
      console.error('Error forgetting memories:', error)
      return { success: false, error: error.message }
    }
  },

  // Get memory statistics
  getMemoryStats: async () => {
    const { user } = useAuthStore.getState()
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('memories')
        .select('created_at, tags, people, sentiment')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error getting memory stats:', error)
        return null
      }

      const stats = {
        total: data.length,
        thisWeek: 0,
        thisMonth: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        topTags: {},
        topPeople: {}
      }

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      data.forEach(memory => {
        const createdAt = new Date(memory.created_at)
        
        if (createdAt > weekAgo) stats.thisWeek++
        if (createdAt > monthAgo) stats.thisMonth++
        
        stats.sentimentBreakdown[memory.sentiment]++
        
        memory.tags?.forEach(tag => {
          stats.topTags[tag] = (stats.topTags[tag] || 0) + 1
        })
        
        memory.people?.forEach(person => {
          stats.topPeople[person] = (stats.topPeople[person] || 0) + 1
        })
      })

      return stats

    } catch (error) {
      console.error('Error getting memory stats:', error)
      return null
    }
  }
}))