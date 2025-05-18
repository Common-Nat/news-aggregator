import { v4 as uuidv4 } from 'uuid';
import { estimateReadingTime } from '../utils/readingUtils';
import DOMPurify from 'dompurify';

// Fetch RSS feed from URL
export const fetchFeed = async (feedUrl) => {
  // Using rss2json API to convert RSS to JSON
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(data.message || 'Failed to parse feed');
    }
    
    return {
      feed: {
        title: data.feed.title,
        description: data.feed.description,
        link: data.feed.link,
        imageUrl: data.feed.image,
        lastUpdated: new Date().toISOString()
      },
      items: data.items.map(item => processArticle(item))
    };
  } catch (error) {
    console.error('Error fetching feed:', error);
    throw error;
  }
};

// Process a single article from the feed
const processArticle = (item) => {
  // Sanitize content to remove potentially harmful HTML
  const cleanContent = DOMPurify.sanitize(item.content);
  
  // Extract plain text for summary and reading time calculation
  const textContent = extractTextFromHtml(cleanContent);
  
  // Generate a summary (first 150 characters)
  const summary = textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '');
  
  // Calculate reading time
  const readingTime = estimateReadingTime(textContent);
  
  return {
    id: uuidv4(),
    title: item.title,
    content: cleanContent,
    textContent,
    summary,
    url: item.link,
    imageUrl: extractImageFromContent(cleanContent) || item.thumbnail,
    publishDate: new Date(item.pubDate).toISOString(),
    author: item.author,
    categories: item.categories || [],
    isRead: false,
    isBookmarked: false,
    estimatedReadingTime: readingTime,
    actualReadingTime: 0, // Will be updated when user reads
    keywords: extractKeywords(textContent)
  };
};

// Extract plain text from HTML content
const extractTextFromHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Extract the first image from the content
const extractImageFromContent = (html) => {
  const match = html.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
};

// Extract keywords from text for recommendations
const extractKeywords = (text) => {
  // Simple keyword extraction - remove common words and get most frequent
  const commonWords = new Set(['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'this', 'that']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Get top 10 keywords
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};

// Refresh all feeds
export const refreshAllFeeds = async (feeds) => {
  const results = {
    updatedFeeds: [],
    newArticles: []
  };
  
  for (const feed of feeds) {
    try {
      const feedData = await fetchFeed(feed.url);
      
      // Update feed info
      const updatedFeed = {
        ...feed,
        title: feedData.feed.title || feed.title,
        description: feedData.feed.description,
        imageUrl: feedData.feed.imageUrl,
        lastUpdated: new Date().toISOString()
      };
      
      results.updatedFeeds.push(updatedFeed);
      
      // Add category to articles
      const articlesWithCategory = feedData.items.map(article => ({
        ...article,
        feedId: feed.id,
        category: feed.category
      }));
      
      results.newArticles.push(...articlesWithCategory);
    } catch (error) {
      console.error(`Error refreshing feed ${feed.title}:`, error);
      // Continue with other feeds
    }
  }
  
  return results;
};