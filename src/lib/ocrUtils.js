import Tesseract from 'tesseract.js'

// OCR Configuration
const OCR_CONFIG = {
  lang: 'eng',
  oem: 1, // OCR Engine Mode (LSTM only)
  psm: 3, // Page Segmentation Mode (fully automatic)
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?;:-\'\"()[]{}/@#$%&*+=<>',
}

// OCR Worker instance (reusable)
let worker = null

// Initialize OCR worker
const initializeWorker = async () => {
  if (worker) return worker

  try {
    worker = await Tesseract.createWorker({
      logger: m => {
        console.log('OCR Progress:', m)
      }
    })

    await worker.loadLanguage(OCR_CONFIG.lang)
    await worker.initialize(OCR_CONFIG.lang)
    await worker.setParameters({
      tessedit_oem: OCR_CONFIG.oem,
      tessedit_pagesegmode: OCR_CONFIG.psm,
      tessedit_char_whitelist: OCR_CONFIG.tessedit_char_whitelist
    })

    console.log('OCR Worker initialized successfully')
    return worker
  } catch (error) {
    console.error('Error initializing OCR worker:', error)
    throw error
  }
}

// Extract text from image file
export const extractTextFromImage = async (imageFile, onProgress = null) => {
  try {
    // Validate file
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      throw new Error('Invalid image file provided')
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      throw new Error('Image file is too large. Maximum size is 10MB.')
    }

    // Initialize worker if needed
    const ocrWorker = await initializeWorker()

    // Create image URL for processing
    const imageUrl = URL.createObjectURL(imageFile)

    try {
      // Perform OCR
      const { data } = await ocrWorker.recognize(imageUrl, {
        logger: onProgress ? (m) => {
          if (m.status === 'recognizing text') {
            onProgress(Math.round(m.progress * 100))
          }
        } : undefined
      })

      // Clean up URL
      URL.revokeObjectURL(imageUrl)

      // Process and clean the extracted text
      const cleanedText = cleanupOcrText(data.text)

      return {
        success: true,
        text: cleanedText,
        confidence: data.confidence,
        words: data.words?.length || 0,
        lines: data.lines?.length || 0,
        paragraphs: data.paragraphs?.length || 0,
        rawData: {
          text: data.text,
          confidence: data.confidence,
          words: data.words,
          lines: data.lines,
          paragraphs: data.paragraphs
        }
      }

    } catch (ocrError) {
      URL.revokeObjectURL(imageUrl)
      throw ocrError
    }

  } catch (error) {
    console.error('Error extracting text from image:', error)
    return {
      success: false,
      error: error.message,
      text: '',
      confidence: 0
    }
  }
}

// Extract text from image URL
export const extractTextFromUrl = async (imageUrl, onProgress = null) => {
  try {
    // Initialize worker if needed
    const ocrWorker = await initializeWorker()

    // Perform OCR
    const { data } = await ocrWorker.recognize(imageUrl, {
      logger: onProgress ? (m) => {
        if (m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100))
        }
      } : undefined
    })

    // Process and clean the extracted text
    const cleanedText = cleanupOcrText(data.text)

    return {
      success: true,
      text: cleanedText,
      confidence: data.confidence,
      words: data.words?.length || 0,
      lines: data.lines?.length || 0,
      paragraphs: data.paragraphs?.length || 0
    }

  } catch (error) {
    console.error('Error extracting text from URL:', error)
    return {
      success: false,
      error: error.message,
      text: '',
      confidence: 0
    }
  }
}

// Extract text from canvas/blob
export const extractTextFromCanvas = async (canvas, onProgress = null) => {
  try {
    // Initialize worker if needed
    const ocrWorker = await initializeWorker()

    // Perform OCR
    const { data } = await ocrWorker.recognize(canvas, {
      logger: onProgress ? (m) => {
        if (m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100))
        }
      } : undefined
    })

    // Process and clean the extracted text
    const cleanedText = cleanupOcrText(data.text)

    return {
      success: true,
      text: cleanedText,
      confidence: data.confidence,
      words: data.words?.length || 0,
      lines: data.lines?.length || 0,
      paragraphs: data.paragraphs?.length || 0
    }

  } catch (error) {
    console.error('Error extracting text from canvas:', error)
    return {
      success: false,
      error: error.message,
      text: '',
      confidence: 0
    }
  }
}

// Clean up OCR extracted text
const cleanupOcrText = (rawText) => {
  if (!rawText) return ''

  return rawText
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim()
    // Remove common OCR artifacts
    .replace(/[^\w\s.,!?;:()\-'"@#$%&*+=<>[\]{}\/]/g, '')
    // Fix common OCR mistakes
    .replace(/\b0\b/g, 'O') // Zero to O
    .replace(/\b1\b/g, 'I') // One to I (context dependent)
    .replace(/rn/g, 'm') // rn to m
    .replace(/\|/g, 'l') // Pipe to l
    // Remove duplicate punctuation
    .replace(/[.,!?;:]{2,}/g, (match) => match[0])
    // Ensure proper spacing after punctuation
    .replace(/([.,!?;:])(\w)/g, '$1 $2')
    // Remove standalone single characters that are likely errors
    .replace(/\b[a-z]\b/gi, (match, offset, string) => {
      // Keep common single letters like 'I', 'a'
      if (['i', 'a'].includes(match.toLowerCase())) {
        return match
      }
      return ''
    })
    // Clean up extra spaces again
    .replace(/\s+/g, ' ')
    .trim()
}

// Validate extracted text quality
export const validateOcrText = (ocrResult) => {
  if (!ocrResult.success || !ocrResult.text) {
    return {
      isValid: false,
      reason: 'No text extracted',
      confidence: 0
    }
  }

  const text = ocrResult.text
  const confidence = ocrResult.confidence

  // Check minimum length
  if (text.length < 3) {
    return {
      isValid: false,
      reason: 'Text too short',
      confidence
    }
  }

  // Check confidence threshold
  if (confidence < 30) {
    return {
      isValid: false,
      reason: 'Low confidence',
      confidence
    }
  }

  // Check for reasonable word count
  const words = text.split(/\s+/).filter(word => word.length > 0)
  if (words.length < 2) {
    return {
      isValid: false,
      reason: 'Too few words',
      confidence
    }
  }

  // Check for reasonable character distribution
  const alphaNumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length
  if (alphaNumericRatio < 0.6) {
    return {
      isValid: false,
      reason: 'Too many special characters',
      confidence
    }
  }

  return {
    isValid: true,
    reason: 'Text appears valid',
    confidence,
    wordCount: words.length,
    characterCount: text.length
  }
}

// Process image and extract memory content
export const processImageForMemory = async (imageFile, onProgress = null) => {
  try {
    // Extract text from image
    const ocrResult = await extractTextFromImage(imageFile, onProgress)

    if (!ocrResult.success) {
      return {
        success: false,
        error: ocrResult.error,
        text: ''
      }
    }

    // Validate the extracted text
    const validation = validateOcrText(ocrResult)

    if (!validation.isValid) {
      return {
        success: false,
        error: `OCR validation failed: ${validation.reason}`,
        text: ocrResult.text,
        confidence: validation.confidence
      }
    }

    return {
      success: true,
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      validation: validation,
      metadata: {
        words: ocrResult.words,
        lines: ocrResult.lines,
        paragraphs: ocrResult.paragraphs,
        fileSize: imageFile.size,
        fileName: imageFile.name
      }
    }

  } catch (error) {
    console.error('Error processing image for memory:', error)
    return {
      success: false,
      error: error.message,
      text: ''
    }
  }
}

// Cleanup resources
export const cleanupOcr = async () => {
  try {
    if (worker) {
      await worker.terminate()
      worker = null
      console.log('OCR Worker terminated')
    }
  } catch (error) {
    console.error('Error cleaning up OCR worker:', error)
  }
}

// Get supported image formats
export const getSupportedImageFormats = () => {
  return [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff'
  ]
}

// Check if file is supported image
export const isSupportedImageFile = (file) => {
  const supportedFormats = getSupportedImageFormats()
  return file && supportedFormats.includes(file.type)
}

// Create image preview
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!isSupportedImageFile(file)) {
      reject(new Error('Unsupported image format'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

// Resize image if too large (for better OCR performance)
export const resizeImageForOcr = (file, maxWidth = 2000, maxHeight = 2000, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}