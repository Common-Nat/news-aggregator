// Calculate estimated reading time for text
export const estimateReadingTime = (text) => {
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  return minutes;
};

// Format reading time for display
export const formatReadingTime = (minutes) => {
  if (minutes < 1) {
    return 'Less than a minute';
  } else if (minutes === 1) {
    return '1 minute';
  } else {
    return `${minutes} minutes`;
  }
};

// Track actual reading time
let readingTimeTracker = {
  articleId: null,
  category: null,
  startTime: null,
  intervalId: null
};

// Start tracking reading time for an article
export const startReadingTimeTracking = (articleId, category, updateCallback) => {
  // Stop any existing tracking
  if (readingTimeTracker.intervalId) {
    clearInterval(readingTimeTracker.intervalId);
  }
  
  // Set up new tracking
  readingTimeTracker = {
    articleId,
    category,
    startTime: Date.now(),
    intervalId: setInterval(() => {
      // Update every 5 seconds
      const elapsedSeconds = 5;
      updateCallback({
        articleId,
        category,
        seconds: elapsedSeconds
      });
    }, 5000) // 5 seconds interval
  };
};

// Stop tracking reading time
export const stopReadingTimeTracking = () => {
  if (readingTimeTracker.intervalId) {
    clearInterval(readingTimeTracker.intervalId);
    readingTimeTracker = {
      articleId: null,
      category: null,
      startTime: null,
      intervalId: null
    };
  }
};

// Create a summary of an article
export const createArticleSummary = (text, sentenceCount = 3) => {
  if (!text) return '';
  
  // Split text into sentences - fixed regex with proper escaping
  const sentences = text.match(/[^\.\!\?]+[\.\!\?]+/g) || [];
  
  if (sentences.length <= sentenceCount) {
    return text;
  }
  
  // Simple extractive summarization - take first few sentences
  return sentences.slice(0, sentenceCount).join(' ');
};

// Get text statistics
export const getTextStatistics = (text) => {
  if (!text) return { wordCount: 0, sentenceCount: 0, paragraphCount: 0, averageWordsPerSentence: 0 };
  
  const words = text.trim().split(/\s+/).length;
  // Fixed sentence regex pattern with proper escaping
  const sentences = (text.match(/[^\.\!\?]+[\.\!\?]+/g) || []).length;
  // Fixed paragraph regex pattern
  const paragraphs = (text.match(/\n\s*\n/g) || []).length + 1;
  
  return {
    wordCount: words,
    sentenceCount: sentences,
    paragraphCount: paragraphs,
    averageWordsPerSentence: sentences > 0 ? Math.round(words / sentences) : 0
  };
};

// New function: Calculate reading difficulty (Flesch-Kincaid Grade Level)
export const calculateReadingDifficulty = (text) => {
  if (!text) return { score: 0, level: 'Unknown' };
  
  const stats = getTextStatistics(text);
  const { wordCount, sentenceCount } = stats;
  
  if (wordCount === 0 || sentenceCount === 0) return { score: 0, level: 'Unknown' };
  
  // Count syllables (simplified approach)
  const syllableCount = countSyllables(text);
  
  // Flesch-Kincaid Grade Level formula
  const score = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;
  const roundedScore = Math.round(score * 10) / 10;
  
  // Determine reading level
  let level = 'Unknown';
  if (score <= 5) level = 'Very Easy';
  else if (score <= 8) level = 'Easy';
  else if (score <= 12) level = 'Moderate';
  else if (score <= 15) level = 'Difficult';
  else level = 'Very Difficult';
  
  return { score: roundedScore, level };
};

// Helper function to count syllables (simplified)
const countSyllables = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  let count = 0;
  
  words.forEach(word => {
    // Remove non-alphabetic characters
    word = word.replace(/[^a-z]/g, '');
    
    // Count vowel groups as syllables
    const syllables = word.match(/[aeiouy]+/g) || [];
    let syllableCount = syllables.length;
    
    // Adjust for common patterns
    if (word.length > 3 && word.endsWith('e') && !word.endsWith('le')) {
      syllableCount--;
    }
    
    // Every word has at least one syllable
    count += Math.max(1, syllableCount);
  });
  
  return count;
};