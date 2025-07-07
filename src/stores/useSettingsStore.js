import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from './useAuthStore'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // UI Settings
      theme: 'light', // 'light', 'dark', 'system'
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h', // '12h', '24h'
      
      // Memory Settings
      memoryRetention: 'forever', // 'forever', '1year', '2years', '5years'
      autoSaveMemories: true,
      confidenceThreshold: 0.7, // Minimum confidence for AI to save memory
      
      // Privacy Settings
      enableAnalytics: true,
      shareUsageData: false,
      enableCrashReports: true,
      
      // Backup Settings
      autoBackup: true,
      backupFrequency: 'weekly', // 'daily', 'weekly', 'monthly'
      backupLocation: 'drive', // 'drive', 'email', 'both'
      lastBackupDate: null,
      
      // Google Drive Settings
      driveConnected: false,
      driveEmail: null,
      driveRefreshToken: null,
      
      // Notification Settings
      enableNotifications: true,
      reminderFrequency: 'weekly', // 'daily', 'weekly', 'monthly', 'never'
      backupReminders: true,
      
      // AI Settings
      geminiModel: 'gemini-pro', // 'gemini-pro', 'gemini-pro-vision'
      maxTokens: 1000,
      temperature: 0.7,
      
      // Data Export Settings
      exportFormat: 'json', // 'json', 'csv', 'pdf'
      includeMetadata: true,
      
      loading: false,
      error: null,

      // Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDateFormat: (format) => set({ dateFormat: format }),
      setTimeFormat: (format) => set({ timeFormat: format }),
      
      // Update any setting
      updateSetting: (key, value) => set({ [key]: value }),
      
      // Update multiple settings
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      
      // Set loading
      setLoading: (loading) => set({ loading }),
      
      // Set error
      setError: (error) => set({ error }),
      
      // Clear error
      clearError: () => set({ error: null }),

      // Load user settings from Supabase
      loadSettings: async () => {
        const { user } = useAuthStore.getState()
        if (!user) return

        try {
          set({ loading: true, error: null })

          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Error loading settings:', error)
            set({ error: error.message, loading: false })
            return
          }

          if (data) {
            const {
              theme, language, date_format, time_format,
              memory_retention, auto_save_memories, confidence_threshold,
              enable_analytics, share_usage_data, enable_crash_reports,
              auto_backup, backup_frequency, backup_location, last_backup_date,
              drive_connected, drive_email,
              enable_notifications, reminder_frequency, backup_reminders,
              gemini_model, max_tokens, temperature,
              export_format, include_metadata
            } = data

            set({
              theme: theme || 'light',
              language: language || 'en',
              dateFormat: date_format || 'MM/dd/yyyy',
              timeFormat: time_format || '12h',
              memoryRetention: memory_retention || 'forever',
              autoSaveMemories: auto_save_memories !== false,
              confidenceThreshold: confidence_threshold || 0.7,
              enableAnalytics: enable_analytics !== false,
              shareUsageData: share_usage_data || false,
              enableCrashReports: enable_crash_reports !== false,
              autoBackup: auto_backup !== false,
              backupFrequency: backup_frequency || 'weekly',
              backupLocation: backup_location || 'drive',
              lastBackupDate: last_backup_date,
              driveConnected: drive_connected || false,
              driveEmail: drive_email,
              enableNotifications: enable_notifications !== false,
              reminderFrequency: reminder_frequency || 'weekly',
              backupReminders: backup_reminders !== false,
              geminiModel: gemini_model || 'gemini-pro',
              maxTokens: max_tokens || 1000,
              temperature: temperature || 0.7,
              exportFormat: export_format || 'json',
              includeMetadata: include_metadata !== false,
              loading: false
            })
          } else {
            set({ loading: false })
          }

        } catch (error) {
          console.error('Error loading settings:', error)
          set({ error: error.message, loading: false })
        }
      },

      // Save settings to Supabase
      saveSettings: async () => {
        const { user } = useAuthStore.getState()
        if (!user) return { success: false, error: 'No user logged in' }

        try {
          set({ loading: true, error: null })

          const state = get()
          const settings = {
            user_id: user.id,
            theme: state.theme,
            language: state.language,
            date_format: state.dateFormat,
            time_format: state.timeFormat,
            memory_retention: state.memoryRetention,
            auto_save_memories: state.autoSaveMemories,
            confidence_threshold: state.confidenceThreshold,
            enable_analytics: state.enableAnalytics,
            share_usage_data: state.shareUsageData,
            enable_crash_reports: state.enableCrashReports,
            auto_backup: state.autoBackup,
            backup_frequency: state.backupFrequency,
            backup_location: state.backupLocation,
            last_backup_date: state.lastBackupDate,
            drive_connected: state.driveConnected,
            drive_email: state.driveEmail,
            enable_notifications: state.enableNotifications,
            reminder_frequency: state.reminderFrequency,
            backup_reminders: state.backupReminders,
            gemini_model: state.geminiModel,
            max_tokens: state.maxTokens,
            temperature: state.temperature,
            export_format: state.exportFormat,
            include_metadata: state.includeMetadata,
            updated_at: new Date().toISOString()
          }

          const { data, error } = await supabase
            .from('user_settings')
            .upsert(settings)
            .select()
            .single()

          if (error) {
            console.error('Error saving settings:', error)
            set({ error: error.message, loading: false })
            return { success: false, error: error.message }
          }

          set({ loading: false })
          return { success: true, data }

        } catch (error) {
          console.error('Error saving settings:', error)
          set({ error: error.message, loading: false })
          return { success: false, error: error.message }
        }
      },

      // Reset settings to defaults
      resetSettings: () => {
        set({
          theme: 'light',
          language: 'en',
          dateFormat: 'MM/dd/yyyy',
          timeFormat: '12h',
          memoryRetention: 'forever',
          autoSaveMemories: true,
          confidenceThreshold: 0.7,
          enableAnalytics: true,
          shareUsageData: false,
          enableCrashReports: true,
          autoBackup: true,
          backupFrequency: 'weekly',
          backupLocation: 'drive',
          lastBackupDate: null,
          driveConnected: false,
          driveEmail: null,
          driveRefreshToken: null,
          enableNotifications: true,
          reminderFrequency: 'weekly',
          backupReminders: true,
          geminiModel: 'gemini-pro',
          maxTokens: 1000,
          temperature: 0.7,
          exportFormat: 'json',
          includeMetadata: true
        })
      },

      // Connect Google Drive
      connectGoogleDrive: async () => {
        try {
          set({ loading: true, error: null })

          // This would typically open OAuth flow
          // For now, we'll simulate connection
          const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID
          if (!clientId) {
            throw new Error('Google Drive client ID not configured')
          }

          // OAuth URL
          const scope = 'https://www.googleapis.com/auth/drive.file'
          const redirectUri = import.meta.env.VITE_GOOGLE_DRIVE_REDIRECT_URI || `${window.location.origin}/auth/callback`
          
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `response_type=code&` +
            `access_type=offline&` +
            `prompt=consent`

          // Open auth window
          window.open(authUrl, 'google-drive-auth', 'width=500,height=600')

          // Note: In a real implementation, you'd handle the callback
          // and exchange the code for tokens
          set({ loading: false })

        } catch (error) {
          console.error('Error connecting Google Drive:', error)
          set({ error: error.message, loading: false })
        }
      },

      // Disconnect Google Drive
      disconnectGoogleDrive: async () => {
        try {
          set({
            driveConnected: false,
            driveEmail: null,
            driveRefreshToken: null
          })

          await get().saveSettings()

        } catch (error) {
          console.error('Error disconnecting Google Drive:', error)
          set({ error: error.message })
        }
      },

      // Update backup date
      updateLastBackupDate: (date) => {
        set({ lastBackupDate: date })
        get().saveSettings()
      },

      // Get formatted date
      getFormattedDate: (date) => {
        const { dateFormat, timeFormat } = get()
        const options = {
          year: 'numeric',
          month: dateFormat.includes('MM') ? '2-digit' : 'short',
          day: '2-digit',
          hour: timeFormat === '24h' ? '2-digit' : 'numeric',
          minute: '2-digit',
          hour12: timeFormat === '12h'
        }
        
        return new Intl.DateTimeFormat('en-US', options).format(new Date(date))
      },

      // Check if backup is due
      isBackupDue: () => {
        const { autoBackup, backupFrequency, lastBackupDate } = get()
        if (!autoBackup || !lastBackupDate) return true

        const now = new Date()
        const lastBackup = new Date(lastBackupDate)
        const timeDiff = now.getTime() - lastBackup.getTime()
        
        const frequencies = {
          daily: 24 * 60 * 60 * 1000,
          weekly: 7 * 24 * 60 * 60 * 1000,
          monthly: 30 * 24 * 60 * 60 * 1000
        }

        return timeDiff >= frequencies[backupFrequency]
      }
    }),
    {
      name: 'life-ai-settings',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        dateFormat: state.dateFormat,
        timeFormat: state.timeFormat
      })
    }
  )
)