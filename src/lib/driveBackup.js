// Google Drive Backup Integration
// Note: This is a simplified implementation. In production, you'd need proper OAuth flow.

// Google Drive API configuration
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'

// Initialize Google Drive client
const initializeDriveClient = () => {
  const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('Google Drive credentials not configured')
  }
  
  return { clientId, clientSecret }
}

// Create backup file content
export const createBackupData = async (userData) => {
  const backupData = {
    version: '1.0',
    appName: 'Life.AI',
    createdAt: new Date().toISOString(),
    userData: userData,
    metadata: {
      totalMemories: userData.memories?.length || 0,
      totalEdges: userData.graphEdges?.length || 0,
      exportedBy: userData.user?.email || 'unknown'
    }
  }
  
  return JSON.stringify(backupData, null, 2)
}

// Upload backup to Google Drive
export const uploadBackupToDrive = async (backupData, accessToken, fileName = null) => {
  try {
    if (!accessToken) {
      throw new Error('No access token provided')
    }

    const filename = fileName || `life-ai-backup-${new Date().toISOString().split('T')[0]}.json`
    
    // Create file metadata
    const metadata = {
      name: filename,
      parents: await getOrCreateBackupFolder(accessToken),
      description: 'Life.AI Memory Backup'
    }

    // Upload file
    const formData = new FormData()
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    formData.append('file', new Blob([backupData], { type: 'application/json' }))

    const response = await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Drive upload failed: ${error}`)
    }

    const result = await response.json()
    return {
      success: true,
      fileId: result.id,
      fileName: result.name,
      webViewLink: result.webViewLink
    }

  } catch (error) {
    console.error('Error uploading to Drive:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Get or create backup folder
const getOrCreateBackupFolder = async (accessToken) => {
  try {
    // Search for existing folder
    const searchResponse = await fetch(
      `${DRIVE_API_BASE}/files?q=name='Life.AI Backups' and mimeType='application/vnd.google-apps.folder'`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const searchResult = await searchResponse.json()
    
    if (searchResult.files && searchResult.files.length > 0) {
      return [searchResult.files[0].id]
    }

    // Create new folder
    const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Life.AI Backups',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Automated backups from Life.AI personal memory system'
      })
    })

    const createResult = await createResponse.json()
    return [createResult.id]

  } catch (error) {
    console.error('Error managing backup folder:', error)
    return []
  }
}

// List existing backups
export const listBackupsFromDrive = async (accessToken) => {
  try {
    const response = await fetch(
      `${DRIVE_API_BASE}/files?q=name contains 'life-ai-backup' and mimeType='application/json'&orderBy=createdTime desc`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to list backups')
    }

    const result = await response.json()
    return {
      success: true,
      backups: result.files || []
    }

  } catch (error) {
    console.error('Error listing backups:', error)
    return {
      success: false,
      error: error.message,
      backups: []
    }
  }
}

// Download backup from Drive
export const downloadBackupFromDrive = async (fileId, accessToken) => {
  try {
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to download backup')
    }

    const backupData = await response.text()
    return {
      success: true,
      data: JSON.parse(backupData)
    }

  } catch (error) {
    console.error('Error downloading backup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Delete backup from Drive
export const deleteBackupFromDrive = async (fileId, accessToken) => {
  try {
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete backup')
    }

    return { success: true }

  } catch (error) {
    console.error('Error deleting backup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Send backup via email (using Gmail API)
export const sendBackupViaEmail = async (backupData, userEmail, accessToken) => {
  try {
    const fileName = `life-ai-backup-${new Date().toISOString().split('T')[0]}.json`
    
    // Create email with attachment
    const email = createEmailWithAttachment(
      userEmail,
      'Life.AI Memory Backup',
      'Your Life.AI memories have been backed up. Please keep this file safe.',
      backupData,
      fileName
    )

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: btoa(email)
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    return { success: true }

  } catch (error) {
    console.error('Error sending backup email:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Create email with attachment
const createEmailWithAttachment = (to, subject, body, attachmentData, attachmentName) => {
  const boundary = 'backup_boundary_' + Math.random().toString(16)
  
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
    '',
    `--${boundary}`,
    'Content-Type: application/json',
    `Content-Disposition: attachment; filename="${attachmentName}"`,
    'Content-Transfer-Encoding: base64',
    '',
    btoa(attachmentData),
    '',
    `--${boundary}--`
  ].join('\n')
  
  return email
}

// Automatic backup scheduler
export const scheduleAutomaticBackup = (userData, settings) => {
  const { autoBackup, backupFrequency, backupLocation } = settings
  
  if (!autoBackup) return null

  const frequencies = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000
  }

  const interval = frequencies[backupFrequency] || frequencies.weekly

  return setInterval(async () => {
    try {
      await performAutomaticBackup(userData, settings)
    } catch (error) {
      console.error('Automatic backup failed:', error)
    }
  }, interval)
}

// Perform automatic backup
export const performAutomaticBackup = async (userData, settings) => {
  try {
    const backupData = await createBackupData(userData)
    const { backupLocation, driveConnected, driveEmail } = settings

    if (backupLocation === 'drive' && driveConnected) {
      // Would need proper token management here
      console.log('Would backup to Google Drive')
    }

    if (backupLocation === 'email' || backupLocation === 'both') {
      // Would send via email
      console.log('Would send backup via email')
    }

    // Download locally as fallback
    downloadBackupLocally(backupData)

    return { success: true }

  } catch (error) {
    console.error('Error performing automatic backup:', error)
    return { success: false, error: error.message }
  }
}

// Download backup file locally
export const downloadBackupLocally = (backupData, fileName = null) => {
  try {
    const filename = fileName || `life-ai-backup-${new Date().toISOString().split('T')[0]}.json`
    
    const blob = new Blob([backupData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    return { success: true, fileName: filename }

  } catch (error) {
    console.error('Error downloading backup locally:', error)
    return { success: false, error: error.message }
  }
}

// Restore from backup
export const restoreFromBackup = async (backupData) => {
  try {
    // Validate backup data structure
    if (!backupData.version || !backupData.userData) {
      throw new Error('Invalid backup file format')
    }

    if (backupData.version !== '1.0') {
      throw new Error('Unsupported backup version')
    }

    return {
      success: true,
      userData: backupData.userData,
      metadata: backupData.metadata
    }

  } catch (error) {
    console.error('Error restoring from backup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Test Google Drive connection
export const testDriveConnection = async (accessToken) => {
  try {
    const response = await fetch(`${DRIVE_API_BASE}/about?fields=user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to connect to Google Drive')
    }

    const result = await response.json()
    return {
      success: true,
      user: result.user
    }

  } catch (error) {
    console.error('Drive connection test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}