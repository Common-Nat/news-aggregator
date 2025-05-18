import React, { useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Grid,
  IconButton,
  CardActionArea,
  Tooltip
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format, parseISO } from 'date-fns';
import { AppContext } from '../../contexts/AppContext';
import { formatReadingTime } from '../../utils/readingUtils';
import { useNavigate } from 'react-router-dom';

const ArticleList = ({ articles }) => {
  const { dispatch } = useContext(AppContext);
  const navigate = useNavigate();
  
  const handleArticleClick = (article) => {
    // Mark as read and navigate to article view
    dispatch({ type: 'MARK_AS_READ', payload: article.id });
    navigate(`/article/${article.id}`);
  };
  
  const toggleBookmark = (e, articleId) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: articleId });
  };
  
  // Helper to format date nicely
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {articles.map(article => (
          <Grid item xs={12} key={article.id}>
            <Card sx={{ 
              display: 'flex', 
              opacity: article.isRead ? 0.8 : 1,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              <CardActionArea 
                sx={{ display: 'flex', justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => handleArticleClick(article)}
              >
                {article.imageUrl && (
                  <CardMedia
                    component="img"
                    sx={{ width: { xs: 100, sm: 150 }, objectFit: 'cover' }}
                    image={article.imageUrl}
                    alt={article.title}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {article.title}
                    </Typography>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={article.isBookmarked ? "Remove bookmark" : "Add bookmark"}>
                        <IconButton 
                          aria-label="bookmark"
                          onClick={(e) => toggleBookmark(e, article.id)}
                          size="small"
                        >
                          {article.isBookmarked ? (
                            <BookmarkIcon color="primary" />
                          ) : (
                            <BookmarkBorderIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                    {article.summary || ''}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">
                          {formatReadingTime(article.estimatedReadingTime)}
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={article.isRead ? 'Read' : 'Unread'} 
                        size="small" 
                        color={article.isRead ? 'default' : 'primary'} 
                        variant={article.isRead ? 'outlined' : 'filled'}
                        sx={{ mr: 1 }}
                      />
                      
                      {article.category && (
                        <Chip 
                          label={article.category} 
                          size="small" 
                          color="default" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(article.publishDate)}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ArticleList;