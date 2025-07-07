import { create } from 'zustand'
import { processWithGemini } from '../lib/geminiApi'
import { useMemoryStore } from './useMemoryStore'

export const useChatStore = create((set, get) => ({
  messages: [],
  currentMessage: '',
  isTyping: false,
  isProcessing: false,
  error: null,
  
  // Voice input state
  isListening: false,
  speechRecognition: null,

  // Set current message
  setCurrentMessage: (message) => set({ currentMessage: message }),
  
  // Set typing state
  setIsTyping: (isTyping) => set({ isTyping }),
  
  // Set processing state
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  
  // Set error
  setError: (error) => set({ error }),
  
  // Clear error
  clearError: () => set({ error: null }),

  // Add message to chat
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...message
    }]
  })),

  // Clear all messages
  clearMessages: () => set({ messages: [] }),

  // Send message to AI
  sendMessage: async (content, type = 'text') => {
    const { addMessage, setIsProcessing, setError } = get()
    const { saveMemory } = useMemoryStore.getState()

    try {
      setIsProcessing(true)
      setError(null)

      // Add user message
      addMessage({
        type: 'user',
        content,
        messageType: type
      })

      // Process with Gemini AI
      const aiResponse = await processWithGemini(content, type)
      
      if (aiResponse.error) {
        setError(aiResponse.error)
        addMessage({
          type: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please check your Gemini API key and try again.',
          messageType: 'text'
        })
        return
      }

      // Add AI response
      addMessage({
        type: 'assistant',
        content: aiResponse.response,
        messageType: 'text'
      })

      // Save memory if AI determined it's meaningful
      if (aiResponse.shouldSave && aiResponse.memoryData) {
        await saveMemory(aiResponse.memoryData)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      setError(error.message)
      addMessage({
        type: 'assistant',
        content: 'Sorry, I encountered an unexpected error. Please try again.',
        messageType: 'text'
      })
    } finally {
      setIsProcessing(false)
    }
  },

  // Start voice input
  startListening: () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      set({ error: 'Speech recognition is not supported in this browser' })
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      set({ isListening: true, error: null })
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      set({ currentMessage: transcript })
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      set({ 
        isListening: false, 
        error: `Speech recognition error: ${event.error}` 
      })
    }

    recognition.onend = () => {
      set({ isListening: false, speechRecognition: null })
    }

    recognition.start()
    set({ speechRecognition: recognition })
  },

  // Stop voice input
  stopListening: () => {
    const { speechRecognition } = get()
    if (speechRecognition) {
      speechRecognition.stop()
    }
    set({ isListening: false, speechRecognition: null })
  },

  // Handle forget command
  handleForgetCommand: async (query) => {
    const { addMessage, setIsProcessing } = get()
    const { forgetMemories } = useMemoryStore.getState()

    try {
      setIsProcessing(true)

      // Add user message
      addMessage({
        type: 'user',
        content: query,
        messageType: 'forget'
      })

      // Process forget command
      const result = await forgetMemories(query)

      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `I've forgotten ${result.deletedCount} memories matching your request: "${query}"`,
          messageType: 'text'
        })
      } else {
        addMessage({
          type: 'assistant',
          content: `I couldn't find any memories matching: "${query}"`,
          messageType: 'text'
        })
      }

    } catch (error) {
      console.error('Error handling forget command:', error)
      addMessage({
        type: 'assistant',
        content: 'Sorry, I encountered an error while trying to forget. Please try again.',
        messageType: 'text'
      })
    } finally {
      setIsProcessing(false)
    }
  },

  // Handle recall command
  handleRecallCommand: async (query) => {
    const { addMessage, setIsProcessing } = get()
    const { searchMemories } = useMemoryStore.getState()

    try {
      setIsProcessing(true)

      // Add user message
      addMessage({
        type: 'user',
        content: query,
        messageType: 'recall'
      })

      // Search memories
      const memories = await searchMemories(query)

      if (memories.length > 0) {
        const memoryList = memories.map(memory => 
          `• ${memory.content} (${new Date(memory.created_at).toLocaleDateString()})`
        ).join('\n')

        addMessage({
          type: 'assistant',
          content: `Here's what I remember about "${query}":\n\n${memoryList}`,
          messageType: 'text'
        })
      } else {
        addMessage({
          type: 'assistant',
          content: `I don't have any memories matching: "${query}"`,
          messageType: 'text'
        })
      }

    } catch (error) {
      console.error('Error handling recall command:', error)
      addMessage({
        type: 'assistant',
        content: 'Sorry, I encountered an error while searching memories. Please try again.',
        messageType: 'text'
      })
    } finally {
      setIsProcessing(false)
    }
  }
}))