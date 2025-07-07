import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database schema helper functions
export const createDatabaseSchema = async () => {
  try {
    console.log('Database schema creation should be done through Supabase dashboard or migrations')
    console.log('Required tables:')
    console.log('1. memories (id, user_id, content, tags, people, places, events, sentiment, confidence, created_at, updated_at)')
    console.log('2. graph_edges (id, user_id, source_node, target_node, edge_type, weight, label, created_at)')
    console.log('3. user_settings (user_id, theme, language, date_format, auto_backup, etc.)')
    console.log('4. profiles (id, email, full_name, avatar_url, updated_at)')
    
    return { success: true }
  } catch (error) {
    console.error('Error with database schema:', error)
    return { success: false, error: error.message }
  }
}

// Auth helpers
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return { success: false, error: error.message }
  }
}

// Memory helpers
export const saveMemoryToSupabase = async (memoryData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        ...memoryData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error saving memory:', error)
    return { success: false, error: error.message }
  }
}

export const getMemoriesFromSupabase = async (filters = {}) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    let query = supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.searchQuery) {
      query = query.textSearch('content', filters.searchQuery)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting memories:', error)
    return { success: false, error: error.message }
  }
}

export const deleteMemoryFromSupabase = async (memoryId) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', user.id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting memory:', error)
    return { success: false, error: error.message }
  }
}

// Graph helpers
export const saveGraphEdge = async (edgeData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('graph_edges')
      .insert({
        user_id: user.id,
        ...edgeData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error saving graph edge:', error)
    return { success: false, error: error.message }
  }
}

export const getGraphEdges = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('graph_edges')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting graph edges:', error)
    return { success: false, error: error.message }
  }
}

// Settings helpers
export const saveUserSettings = async (settings) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error saving user settings:', error)
    return { success: false, error: error.message }
  }
}

export const getUserSettings = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return { success: true, data: data || null }
  } catch (error) {
    console.error('Error getting user settings:', error)
    return { success: false, error: error.message }
  }
}

// Real-time subscriptions
export const subscribeToMemories = (callback) => {
  const user = getCurrentUser()
  if (!user) return null

  return supabase
    .channel('memories')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'memories',
      filter: `user_id=eq.${user.id}`
    }, callback)
    .subscribe()
}

export const subscribeToGraphEdges = (callback) => {
  const user = getCurrentUser()
  if (!user) return null

  return supabase
    .channel('graph_edges')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'graph_edges',
      filter: `user_id=eq.${user.id}`
    }, callback)
    .subscribe()
}

// Cleanup function
export const unsubscribeAll = () => {
  supabase.removeAllChannels()
}

// Export all memories as JSON for backup
export const exportAllUserData = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    // Get all user data
    const [memoriesResult, edgesResult, settingsResult] = await Promise.all([
      getMemoriesFromSupabase(),
      getGraphEdges(),
      getUserSettings()
    ])

    if (!memoriesResult.success) throw new Error(memoriesResult.error)
    if (!edgesResult.success) throw new Error(edgesResult.error)
    if (!settingsResult.success) throw new Error(settingsResult.error)

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      },
      memories: memoriesResult.data,
      graphEdges: edgesResult.data,
      settings: settingsResult.data,
      version: '1.0'
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error('Error exporting user data:', error)
    return { success: false, error: error.message }
  }
}

// Health check
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('count')
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return { success: true, message: 'Supabase connection is healthy' }
  } catch (error) {
    console.error('Supabase connection error:', error)
    return { success: false, error: error.message }
  }
}