import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from './useAuthStore'
import { useMemoryStore } from './useMemoryStore'
import { useGraphStore } from './useGraphStore'

export const useAnalyticsStore = create((set, get) => ({
  // Memory Statistics
  memoryStats: {
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0,
    averagePerDay: 0,
    averagePerWeek: 0,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
    topTags: {},
    topPeople: {},
    topPlaces: {},
    topEvents: {}
  },

  // Usage Patterns
  usagePatterns: {
    mostActiveHours: [],
    mostActiveDays: [],
    inputMethodBreakdown: { text: 0, voice: 0, image: 0 },
    averageSessionTime: 0,
    totalSessions: 0
  },

  // Graph Analytics
  graphStats: {
    totalNodes: 0,
    totalEdges: 0,
    nodeTypes: {},
    density: 0,
    centralNodes: [],
    clusters: []
  },

  // Insights
  insights: [],

  // Loading states
  loading: false,
  error: null,
  lastUpdated: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Load all analytics data
  loadAnalytics: async () => {
    const { user } = useAuthStore.getState()
    if (!user) return

    try {
      set({ loading: true, error: null })

      // Load memory analytics
      await get().loadMemoryAnalytics()
      
      // Load usage analytics
      await get().loadUsageAnalytics()
      
      // Load graph analytics
      await get().loadGraphAnalytics()
      
      // Generate insights
      await get().generateInsights()

      set({ 
        loading: false, 
        lastUpdated: new Date().toISOString() 
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
      set({ error: error.message, loading: false })
    }
  },

  // Load memory-specific analytics
  loadMemoryAnalytics: async () => {
    const { user } = useAuthStore.getState()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('memories')
        .select('created_at, tags, people, places, events, sentiment')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading memory analytics:', error)
        return
      }

      // Calculate statistics
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

      const stats = {
        total: data.length,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        topTags: {},
        topPeople: {},
        topPlaces: {},
        topEvents: {}
      }

      data.forEach(memory => {
        const createdAt = new Date(memory.created_at)
        
        if (createdAt > weekAgo) stats.thisWeek++
        if (createdAt > monthAgo) stats.thisMonth++
        if (createdAt > yearAgo) stats.thisYear++
        
        // Sentiment analysis
        if (memory.sentiment) {
          stats.sentimentBreakdown[memory.sentiment]++
        }
        
        // Tags analysis
        memory.tags?.forEach(tag => {
          stats.topTags[tag] = (stats.topTags[tag] || 0) + 1
        })
        
        // People analysis
        memory.people?.forEach(person => {
          stats.topPeople[person] = (stats.topPeople[person] || 0) + 1
        })
        
        // Places analysis
        memory.places?.forEach(place => {
          stats.topPlaces[place] = (stats.topPlaces[place] || 0) + 1
        })
        
        // Events analysis
        memory.events?.forEach(event => {
          stats.topEvents[event] = (stats.topEvents[event] || 0) + 1
        })
      })

      // Calculate averages
      stats.averagePerDay = stats.total / Math.max(1, Math.ceil((now - new Date(data[data.length - 1]?.created_at || now)) / (24 * 60 * 60 * 1000)))
      stats.averagePerWeek = stats.averagePerDay * 7

      set({ memoryStats: stats })

    } catch (error) {
      console.error('Error loading memory analytics:', error)
    }
  },

  // Load usage analytics
  loadUsageAnalytics: async () => {
    const { user } = useAuthStore.getState()
    if (!user) return

    try {
      // Note: In a real app, you'd track usage events
      // For now, we'll simulate some usage data
      const usageData = {
        mostActiveHours: [
          { hour: 9, count: 15 },
          { hour: 14, count: 12 },
          { hour: 19, count: 18 },
          { hour: 21, count: 10 }
        ],
        mostActiveDays: [
          { day: 'Monday', count: 25 },
          { day: 'Wednesday', count: 30 },
          { day: 'Sunday', count: 20 }
        ],
        inputMethodBreakdown: { text: 80, voice: 15, image: 5 },
        averageSessionTime: 12.5, // minutes
        totalSessions: 45
      }

      set({ usagePatterns: usageData })

    } catch (error) {
      console.error('Error loading usage analytics:', error)
    }
  },

  // Load graph analytics
  loadGraphAnalytics: async () => {
    const { getGraphStats } = useGraphStore.getState()
    
    try {
      const graphStats = getGraphStats()
      
      // Add more sophisticated analysis
      const enhancedStats = {
        ...graphStats,
        centralNodes: [], // Would calculate centrality metrics
        clusters: [] // Would identify clusters in the graph
      }

      set({ graphStats: enhancedStats })

    } catch (error) {
      console.error('Error loading graph analytics:', error)
    }
  },

  // Generate insights based on data
  generateInsights: async () => {
    const { memoryStats, usagePatterns, graphStats } = get()
    const insights = []

    try {
      // Memory-based insights
      if (memoryStats.thisWeek > memoryStats.averagePerWeek * 1.5) {
        insights.push({
          id: 'high_activity',
          type: 'positive',
          title: 'High Memory Activity',
          description: `You've been more active this week, creating ${memoryStats.thisWeek} memories compared to your average of ${Math.round(memoryStats.averagePerWeek)}.`,
          action: 'Keep up the great work!'
        })
      }

      if (memoryStats.thisWeek === 0) {
        insights.push({
          id: 'no_activity',
          type: 'warning',
          title: 'No Memories This Week',
          description: "You haven't created any memories this week. Try sharing something that happened recently!",
          action: 'Add a memory now'
        })
      }

      // Sentiment insights
      const totalSentiment = Object.values(memoryStats.sentimentBreakdown).reduce((a, b) => a + b, 0)
      if (totalSentiment > 0) {
        const positiveRatio = memoryStats.sentimentBreakdown.positive / totalSentiment
        
        if (positiveRatio > 0.7) {
          insights.push({
            id: 'positive_sentiment',
            type: 'positive',
            title: 'Positive Vibes',
            description: `${Math.round(positiveRatio * 100)}% of your memories have positive sentiment. You're living a happy life!`,
            action: null
          })
        } else if (positiveRatio < 0.3) {
          insights.push({
            id: 'low_sentiment',
            type: 'warning',
            title: 'Tough Times',
            description: 'Your recent memories seem to have lower sentiment. Remember that difficult times pass.',
            action: 'Consider reaching out to friends or family'
          })
        }
      }

      // People insights
      const topPeopleEntries = Object.entries(memoryStats.topPeople)
      if (topPeopleEntries.length > 0) {
        const topPerson = topPeopleEntries.sort((a, b) => b[1] - a[1])[0]
        insights.push({
          id: 'top_person',
          type: 'info',
          title: 'Most Mentioned Person',
          description: `You've mentioned ${topPerson[0]} in ${topPerson[1]} memories. They seem important to you!`,
          action: null
        })
      }

      // Backup insights
      // Note: This would integrate with settings store
      insights.push({
        id: 'backup_reminder',
        type: 'info',
        title: 'Backup Your Memories',
        description: 'Consider backing up your memories to Google Drive to keep them safe.',
        action: 'Set up backup'
      })

      set({ insights })

    } catch (error) {
      console.error('Error generating insights:', error)
    }
  },

  // Get memory trends over time
  getMemoryTrends: async (period = '30d') => {
    const { user } = useAuthStore.getState()
    if (!user) return []

    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('memories')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting memory trends:', error)
        return []
      }

      // Group by day
      const trendsMap = new Map()
      const today = new Date()
      
      // Initialize all days with 0
      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split('T')[0]
        trendsMap.set(dateKey, 0)
      }

      // Count memories per day
      data.forEach(memory => {
        const dateKey = memory.created_at.split('T')[0]
        if (trendsMap.has(dateKey)) {
          trendsMap.set(dateKey, trendsMap.get(dateKey) + 1)
        }
      })

      // Convert to array format
      return Array.from(trendsMap.entries()).map(([date, count]) => ({
        date,
        count
      })).reverse()

    } catch (error) {
      console.error('Error getting memory trends:', error)
      return []
    }
  },

  // Get sentiment trends
  getSentimentTrends: async (period = '30d') => {
    const { user } = useAuthStore.getState()
    if (!user) return []

    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('memories')
        .select('created_at, sentiment')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting sentiment trends:', error)
        return []
      }

      // Group by week for sentiment (daily might be too granular)
      const trendsMap = new Map()
      
      data.forEach(memory => {
        const date = new Date(memory.created_at)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Start of week
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!trendsMap.has(weekKey)) {
          trendsMap.set(weekKey, { positive: 0, neutral: 0, negative: 0, total: 0 })
        }
        
        const week = trendsMap.get(weekKey)
        week[memory.sentiment || 'neutral']++
        week.total++
      })

      return Array.from(trendsMap.entries()).map(([week, sentiments]) => ({
        week,
        positive: sentiments.total > 0 ? (sentiments.positive / sentiments.total) * 100 : 0,
        neutral: sentiments.total > 0 ? (sentiments.neutral / sentiments.total) * 100 : 0,
        negative: sentiments.total > 0 ? (sentiments.negative / sentiments.total) * 100 : 0
      }))

    } catch (error) {
      console.error('Error getting sentiment trends:', error)
      return []
    }
  },

  // Dismiss insight
  dismissInsight: (insightId) => {
    set((state) => ({
      insights: state.insights.filter(insight => insight.id !== insightId)
    }))
  },

  // Export analytics data
  exportAnalytics: () => {
    const { memoryStats, usagePatterns, graphStats, insights, lastUpdated } = get()
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      lastUpdated,
      memoryStats,
      usagePatterns,
      graphStats,
      insights
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `life-ai-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}))