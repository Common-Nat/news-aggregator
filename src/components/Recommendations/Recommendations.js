import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Divider,
  Button,
  IconButton,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getRecommendations, getRecommendationsByCategory } from '../../services/recommendationService';
import { formatReadingTime } from '../../utils/readingUtils';
import { format, parseISO } from 'date-fns';

const Recommendations = () => {
  const { state, dispatch } = useContext(AppContext);
  const { articles, categories } = state;
  
  const [recommendations, setRecommendations] = useState([]);
  const [categoryRecommendations, setCategoryRecommendations] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  useEffect(() => {
    // Generate recommendations when articles change
    if (articles.length) {
      const readArticles = articles.filter(article => article.isRead);
      const generatedRecommendations = getRecommendations(articles, readArticles);
      setRecommendations(generatedRecommendations);
      
      // Get category recommendations
      const catRecs = getRecommendationsByCategory(articles, categories);
      setCategoryRecommendations(catRecs);
    }
  }, [articles, categories]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedCategory(null); // Reset category filter when changing tabs
  };
  
  const handleArticleClick = (articleId) => {
    // Navigate to article view (handled by parent component)
    if (typeof window !== 'undefined') {
      window.location.hash = `#/article/${articleId}`;
    }
  };
  
  const toggleBookmark = (e, articleId) => {
    e.stopPropagation(); // Prevent navigating to article
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: articleId });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };
  
  const ArticleCard = ({ article }) => (
    <Card 
      sx={{ 
        display: 'flex', 
        mb: 2, 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }} 
      onClick={() => handleArticleClick(article.id)}
    >
      {article.imageUrl && (
        <CardMedia
          component="img"
          sx={{ width: 140 }}
          image={article.imageUrl}
          alt={article.title}
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <CardContent sx={{ flex: '1 0 auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography component="div" variant="h6" sx={{ mb: 1 }}>
              {article.title}
            </Typography>
            <IconButton 
              aria-label="bookmark" 
              onClick={(e) => toggleBookmark(e, article.id)}
              size="small"
            >
              {article.isBookmarked 
                ? <BookmarkIcon color="primary" />
                : <BookmarkBorderIcon />
              }
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {article.summary}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                {formatReadingTime(article.estimatedReadingTime)}
              </Typography>
            </Box>
            
            <Chip 
              label={article.category || 'Uncategorized'} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {article.publishDate && format(parseISO(article.publishDate), 'MMM d, yyyy')}
          </Typography>
        </CardContent>
      </Box>
    </Card>
  );
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Recommended for You
      </Typography>
      
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="For You" />
          <Tab label="By Category" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  Based on Your Reading History
                </Typography>
                
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    // Refresh recommendations
                    const readArticles = articles.filter(article => article.isRead);
                    const generatedRecommendations = getRecommendations(articles, readArticles);
                    setRecommendations(generatedRecommendations);
                  }}
                >
                  Refresh
                </Button>
              </Box>

              {recommendations.length > 0 ? (
                <Grid container spacing={2}>
                  {recommendations.map(article => (
                    <Grid item xs={12} key={article.id}>
                      <ArticleCard article={article} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No recommendations available yet. Start reading some articles to get personalized recommendations!
                  </Typography>
                  <Button variant="contained" color="primary" href="/#/">
                    Browse Articles
                  </Button>
                </Paper>
              )}
            </>
          )}
          
          {tabValue === 1 && (
            <>
              {Object.keys(categoryRecommendations).length > 0 && (
                <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.keys(categoryRecommendations).map(category => (
                    <Chip 
                      key={category}
                      label={category} 
                      onClick={() => handleCategorySelect(category)}
                      color={selectedCategory === category ? "primary" : "default"} 
                      variant={selectedCategory === category ? "filled" : "outlined"} 
                    />
                  ))}
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              {Object.keys(categoryRecommendations).length > 0 ? (
                <>
                  {(selectedCategory ? [selectedCategory] : Object.keys(categoryRecommendations)).map(category => (
                    <Box key={category} sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={category} 
                          color="primary" 
                          size="small" 
                          sx={{ mr: 1 }} 
                        />
                        {categoryRecommendations[category].length} Recommendations
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {categoryRecommendations[category].slice(0, 3).map(article => (
                          <Grid item xs={12} key={article.id}>
                            <ArticleCard article={article} />
                          </Grid>
                        ))}
                      </Grid>
                      
                      {categoryRecommendations[category].length > 3 && (
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleArticleClick(categoryRecommendations[category][3].id)}
                          >
                            View More in {category}
                          </Button>
                        </Box>
                      )}
                      <Divider sx={{ my: 3 }} />
                    </Box>
                  ))}
                </>
              ) : (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No category recommendations available. Try adding more feeds in different categories.
                  </Typography>
                  <Button variant="contained" color="primary" href="/#/settings">
                    Manage Feeds
                  </Button>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Recommendations;