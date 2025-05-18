// Calculates similarity between articles based on keywords
export const calculateSimilarity = (article1, article2) => {
  if (!article1.keywords || !article2.keywords) {
    return 0;
  }
  
  const keywords1 = new Set(article1.keywords);
  const keywords2 = new Set(article2.keywords);
  
  // Calculate Jaccard similarity (intersection over union)
  const intersection = new Set();
  for (const keyword of keywords1) {
    if (keywords2.has(keyword)) {
      intersection.add(keyword);
    }
  }
  
  const union = new Set([...keywords1, ...keywords2]);
  
  return intersection.size / union.size;
};

// Get recommendations based on reading history
export const getRecommendations = (articles, readArticles, maxRecommendations = 10) => {
  if (!readArticles.length) {
    // If no read articles, recommend most recent unread articles
    return articles
      .filter(article => !article.isRead)
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, maxRecommendations);
  }
  
  // Get user's most recently read articles
  const recentlyRead = readArticles
    .sort((a, b) => new Date(b.readDate) - new Date(a.readDate))
    .slice(0, 5);
  
  // Calculate score for each unread article
  const scoredArticles = articles
    .filter(article => !article.isRead)
    .map(article => {
      // Calculate average similarity with recently read articles
      let totalSimilarity = 0;
      
      recentlyRead.forEach(readArticle => {
        totalSimilarity += calculateSimilarity(article, readArticle);
        
        // Boost score if same category
        if (article.category === readArticle.category) {
          totalSimilarity += 0.2;
        }
      });
      
      const averageSimilarity = totalSimilarity / recentlyRead.length;
      
      // Recency factor
      const ageInDays = (new Date() - new Date(article.publishDate)) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0, 1 - (ageInDays / 30)); // Decays over 30 days
      
      // Final score combines similarity and recency
      const score = (averageSimilarity * 0.7) + (recencyFactor * 0.3);
      
      return { ...article, recommendationScore: score };
    });
  
  // Sort by score and take top N
  return scoredArticles
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, maxRecommendations);
};

// Get recommendations by category
export const getRecommendationsByCategory = (articles, categories) => {
  const recommendations = {};
  
  categories.forEach(category => {
    // Get unread articles in this category
    const unreadInCategory = articles
      .filter(article => 
        !article.isRead && 
        article.category === category.name
      )
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, 5);
    
    if (unreadInCategory.length) {
      recommendations[category.name] = unreadInCategory;
    }
  });
  
  return recommendations;
};