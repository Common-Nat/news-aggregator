import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
  Divider,
  Skeleton,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format, parseISO } from 'date-fns';
import { AppContext } from '../../contexts/AppContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import ReadabilityTools from '../ReadabilityTools/ReadabilityTools';
import { startReadingTimeTracking, stopReadingTimeTracking } from '../../utils/readingUtils';

const ArticleView = () => {
  const { state, dispatch } = useContext(AppContext);
  const { articles, readingPreferences } = state;
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState(null);
  
  useEffect(() => {
    if (id && articles.length > 0) {
      const foundArticle = articles.find(a => a.id === id);
      
      if (foundArticle) {
        setArticle(foundArticle);
        
        // Mark as read if not already
        if (!foundArticle.isRead) {
          dispatch({ type: 'MARK_AS_READ', payload: id });
        }
        
        // Start tracking reading time
        startReadingTimeTracking(id, foundArticle.category, ({ articleId, category, seconds }) => {
          dispatch({
            type: 'UPDATE_READING_TIME',
            payload: { articleId, category, seconds }
          });
        });
      } else {
        // Article not found
        navigate('/');
      }
    }
    
    // Cleanup tracking when leaving
    return () => {
      stopReadingTimeTracking();
    };
  }, [id, articles, dispatch, navigate]);
  
  const toggleBookmark = () => {
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: id });
  };
  
  if (!article) {
    return (
      <Box>
        <Skeleton variant="text" height={60} width="70%" />
        <Skeleton variant="text" height={20} width="30%" />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }
  
  // Apply reading preferences
  const contentStyle = {
    fontSize: `${readingPreferences.fontSize}px`,
    lineHeight: readingPreferences.lineHeight,
    fontFamily: readingPreferences.fontFamily,
    textAlign: readingPreferences.textAlign,
    maxWidth: readingPreferences.marginWidth === 'narrow' ? '650px' : 
              readingPreferences.marginWidth === 'medium' ? '800px' : '1000px',
    margin: '0 auto'
  };
  
  // Format publish date
  const publishDate = article.publishDate 
    ? format(parseISO(article.publishDate), 'MMMM d, yyyy') 
    : 'Unknown date';

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          {article.category && (
            <MuiLink
              component={Link}
              to={`/?category=${encodeURIComponent(article.category)}`}
              underline="hover"
              color="inherit"
            >
              {article.category}
            </MuiLink>
          )}
          <Typography color="text.primary">Article</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {article.title}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {article.author && (
              <Typography variant="subtitle1" color="text.secondary">
                By {article.author}
              </Typography>
            )}
            
            <Typography variant="subtitle1" color="text.secondary">
              {publishDate}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                {article.estimatedReadingTime} min read
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              endIcon={<OpenInNewIcon />}
              onClick={() => window.open(article.url, '_blank')}
            >
              Original Article
            </Button>
            
            <IconButton 
              onClick={toggleBookmark}
              color={article.isBookmarked ? 'primary' : 'default'}
              title={article.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {article.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Box>
        </Box>
        
        {article.imageUrl && (
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '400px', 
                objectFit: 'contain' 
              }} 
            />
          </Box>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={contentStyle}>
          <div 
            id="article-content"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(article.content) 
            }} 
          />
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {article.category && (
            <Chip 
              label={article.category} 
              color="primary" 
              variant="outlined" 
            />
          )}
          
          {article.keywords && article.keywords.map(keyword => (
            <Chip 
              key={keyword} 
              label={keyword} 
              size="small" 
              variant="outlined" 
            />
          ))}
        </Box>
      </Paper>
      
      <ReadabilityTools />
    </Box>
  );
};

export default ArticleView;