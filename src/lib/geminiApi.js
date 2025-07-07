import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini API
const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.')
  }
  return new GoogleGenerativeAI(apiKey)
}

// Memory extraction prompt template
const MEMORY_EXTRACTION_PROMPT = `
You are a helpful AI assistant that processes personal messages and determines if they contain meaningful memories worth saving.

Instructions:
1. Analyze the user's message for meaningful content that represents a personal memory, experience, or significant event
2. Ignore casual greetings, small talk, questions, or commands
3. If the message contains a meaningful memory, extract the following information:
   - Main content/description
   - People mentioned (first names or relationships like "mom", "friend")
   - Places mentioned (cities, restaurants, specific locations)
   - Events/activities mentioned
   - Sentiment (positive, neutral, negative)
   - Confidence level (0.0 to 1.0)

4. Respond with a JSON object in this exact format:
{
  "shouldSave": boolean,
  "response": "Your conversational response to the user",
  "memoryData": {
    "content": "Cleaned up version of the memory",
    "people": ["person1", "person2"],
    "places": ["place1", "place2"],
    "events": ["event1", "event2"],
    "tags": ["tag1", "tag2"],
    "sentiment": "positive|neutral|negative",
    "confidence": 0.8
  }
}

Examples:

User: "Hello there!"
Response: {
  "shouldSave": false,
  "response": "Hello! How can I help you today?",
  "memoryData": null
}

User: "I went to the beach with Sarah yesterday and we had an amazing sunset picnic"
Response: {
  "shouldSave": true,
  "response": "That sounds like a wonderful time! Beach sunsets with friends are always special. I've saved this memory for you.",
  "memoryData": {
    "content": "Went to the beach with Sarah and had an amazing sunset picnic",
    "people": ["Sarah"],
    "places": ["beach"],
    "events": ["sunset picnic"],
    "tags": ["beach", "sunset", "picnic", "friends"],
    "sentiment": "positive",
    "confidence": 0.9
  }
}

User: "What did I do last week?"
Response: {
  "shouldSave": false,
  "response": "I can help you recall your memories! Let me search through what you've shared with me.",
  "memoryData": null
}

Now process this message:
`

// Command detection prompts
const FORGET_COMMAND_PROMPT = `
Analyze if this message is asking to forget or delete memories. Look for phrases like:
- "forget about..."
- "delete my memories of..."
- "remove the memory about..."
- "I want to forget..."

Respond with JSON: {"isForgetCommand": boolean, "query": "extracted search terms"}

Message: `

const RECALL_COMMAND_PROMPT = `
Analyze if this message is asking to recall or search memories. Look for phrases like:
- "what did I do..."
- "remember when..."
- "tell me about..."
- "do you remember..."
- "show me memories of..."

Respond with JSON: {"isRecallCommand": boolean, "query": "extracted search terms"}

Message: `

// Process message with Gemini
export const processWithGemini = async (message, messageType = 'text') => {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Check for special commands first
    const forgetResult = await checkForgetCommand(message)
    if (forgetResult.isForgetCommand) {
      return {
        shouldSave: false,
        response: `I'll help you forget memories about "${forgetResult.query}". Let me search and remove them.`,
        isForgetCommand: true,
        query: forgetResult.query
      }
    }

    const recallResult = await checkRecallCommand(message)
    if (recallResult.isRecallCommand) {
      return {
        shouldSave: false,
        response: `Let me search for memories about "${recallResult.query}".`,
        isRecallCommand: true,
        query: recallResult.query
      }
    }

    // Process for memory extraction
    const prompt = MEMORY_EXTRACTION_PROMPT + `"${message}"`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    let parsedResponse
    try {
      // Extract JSON from response (sometimes AI adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      console.log('Raw response:', text)
      
      // Fallback response
      return {
        shouldSave: false,
        response: "I received your message! Could you tell me more about what happened?",
        error: 'Failed to parse AI response'
      }
    }

    // Validate response structure
    if (typeof parsedResponse.shouldSave !== 'boolean') {
      parsedResponse.shouldSave = false
    }

    if (!parsedResponse.response) {
      parsedResponse.response = "Thanks for sharing that with me!"
    }

    // Clean up memory data
    if (parsedResponse.shouldSave && parsedResponse.memoryData) {
      const memoryData = parsedResponse.memoryData
      
      // Ensure arrays
      memoryData.people = Array.isArray(memoryData.people) ? memoryData.people : []
      memoryData.places = Array.isArray(memoryData.places) ? memoryData.places : []
      memoryData.events = Array.isArray(memoryData.events) ? memoryData.events : []
      memoryData.tags = Array.isArray(memoryData.tags) ? memoryData.tags : []
      
      // Ensure sentiment is valid
      if (!['positive', 'neutral', 'negative'].includes(memoryData.sentiment)) {
        memoryData.sentiment = 'neutral'
      }
      
      // Ensure confidence is a number between 0 and 1
      memoryData.confidence = Math.max(0, Math.min(1, Number(memoryData.confidence) || 0.5))
      
      // Add timestamp
      memoryData.timestamp = new Date().toISOString()
    }

    return parsedResponse

  } catch (error) {
    console.error('Error processing with Gemini:', error)
    
    if (error.message.includes('API key')) {
      return {
        shouldSave: false,
        response: "I'm having trouble connecting to the AI service. Please check your Gemini API key configuration.",
        error: 'API key error'
      }
    }

    return {
      shouldSave: false,
      response: "I'm having trouble processing your message right now. Please try again.",
      error: error.message
    }
  }
}

// Check if message is a forget command
export const checkForgetCommand = async (message) => {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = FORGET_COMMAND_PROMPT + `"${message}"`
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return { isForgetCommand: false, query: '' }
  } catch (error) {
    console.error('Error checking forget command:', error)
    return { isForgetCommand: false, query: '' }
  }
}

// Check if message is a recall command
export const checkRecallCommand = async (message) => {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = RECALL_COMMAND_PROMPT + `"${message}"`
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return { isRecallCommand: false, query: '' }
  } catch (error) {
    console.error('Error checking recall command:', error)
    return { isRecallCommand: false, query: '' }
  }
}

// Generate insights from memories
export const generateInsights = async (memories) => {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
Analyze these personal memories and generate 3-5 helpful insights about patterns, relationships, or interesting observations.

Memories:
${memories.map(m => `- ${m.content} (${m.sentiment})`).join('\n')}

Respond with JSON array of insights:
[
  {
    "title": "Insight title",
    "description": "Detailed explanation",
    "type": "positive|neutral|warning",
    "action": "Optional suggested action"
  }
]
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return []
  } catch (error) {
    console.error('Error generating insights:', error)
    return []
  }
}

// Enhance memory content with AI
export const enhanceMemoryContent = async (content) => {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
Enhance this memory by making it more descriptive and complete while keeping the core facts intact.
Add context and details that would make it more meaningful to remember later.

Original: "${content}"

Enhanced version (keep it concise but richer):
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()

  } catch (error) {
    console.error('Error enhancing memory:', error)
    return content // Return original if enhancement fails
  }
}

// Summarize multiple memories
export const summarizeMemories = async (memories, timeframe) => {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
Create a warm, personal summary of these memories from ${timeframe}.
Focus on key highlights, people, places, and emotional themes.

Memories:
${memories.map(m => `- ${m.content}`).join('\n')}

Write a summary as if talking to the person about their ${timeframe}:
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()

  } catch (error) {
    console.error('Error summarizing memories:', error)
    return `You had ${memories.length} memorable moments during ${timeframe}.`
  }
}

// Test Gemini connection
export const testGeminiConnection = async () => {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const result = await model.generateContent('Say "Connection successful" if you can read this.')
    const response = await result.response
    const text = response.text()

    return { 
      success: true, 
      message: 'Gemini API connection is working',
      response: text
    }
  } catch (error) {
    console.error('Gemini connection test failed:', error)
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to connect to Gemini API'
    }
  }
}