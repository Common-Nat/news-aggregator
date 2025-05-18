import React, { useContext, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Autocomplete,
  Alert,
  CircularProgress,
  Snackbar,
  Stack
} from '@mui/material';
import { AppContext } from '../../contexts/AppContext';
import { fetchFeed } from '../../services/feedService';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const AddFeed = () => {
  const { state, dispatch } = useContext(AppContext);
  const { categories } = state;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    url: '',
    category: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCategoryChange = (event, newValue) => {
    setFormData(prev => ({ ...prev, category: newValue }));
  };
  
  const validateUrl = (url) => {
    let validUrl = url.trim();
    
    // Add protocol if missing
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }
    
    try {
      new URL(validUrl);
      return validUrl;
    } catch (error) {
      return null;
    }
  };
  
  const handlePreviewFeed = async () => {
    const validUrl = validateUrl(formData.url);
    
    if (!validUrl) {
      setError('Please enter a valid URL');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const feedData = await fetchFeed(validUrl);
      setPreview({
        feed: feedData.feed,
        items: feedData.items.slice(0, 3) // Preview first 3 items
      });
      setError('');
    } catch (error) {
      console.error('Failed to load feed preview:', error);
      setError('Failed to load feed. Please check the URL and try again.');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddFeed = () => {
    if (!preview) {
      setError('Please preview the feed first');
      return;
    }
    
    const newFeed = {
      id: uuidv4(),
      url: formData.url,
      category: formData.category || 'Uncategorized',
      title: preview.feed.title,
      description: preview.feed.description,
      imageUrl: preview.feed.imageUrl,
      lastUpdated: new Date().toISOString()
    };
    
    // Add feed
    dispatch({ type: 'ADD_FEED', payload: newFeed });
    
    // Add articles
    const articlesWithFeedId = preview.items.map(article => ({
      ...article,
      feedId: newFeed.id,
      category: formData.category || 'Uncategorized'
    }));
    
    dispatch({ type: 'ADD_ARTICLES', payload: articlesWithFeedId });
    
    // Add category if new
    if (formData.category && !categories.includes(formData.category)) {
      dispatch({ 
        type: 'ADD_CATEGORY', 
        payload: { 
          id: uuidv4(), 
          name: formData.category 
        } 
      });
    }
    
    // Show success notification
    setNotification({
      open: true,
      message: 'Feed added successfully!',
      severity: 'success'
    });
    
    // Reset form
    setFormData({ url: '', category: '' });
    setPreview(null);
    
    // Navigate back to dashboard
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Get unique category names from existing feeds
  const existingCategories = React.useMemo(() => {
    return Array.from(new Set(
      state.feeds.map(feed => feed.category || 'Uncategorized')
    )).sort();
  }, [state.feeds]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New Feed
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Feed URL"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              fullWidth
              required
              placeholder="https://example.com/feed"
              helperText="Enter the URL of the RSS feed you want to add"
              error={!!error}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={existingCategories}
              value={formData.category}
              onChange={handleCategoryChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  name="category"
                  placeholder="Technology, News, etc."
                  helperText="Categorize this feed (optional)"
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePreviewFeed}
                disabled={loading || !formData.url}
                startIcon={loading && <CircularProgress size={20} />}
              >
                Preview Feed
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAddFeed}
                disabled={loading || !preview}
              >
                Add Feed
              </Button>
            </Box>
          </Grid>
          
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {preview && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Feed Preview
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">{preview.feed.title}</Typography>
            {preview.feed.description && (
              <Typography variant="body1" color="text.secondary">
                {preview.feed.description}
              </Typography>
            )}
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Recent Articles
          </Typography>
          
          <Stack spacing={2}>
            {preview.items.map((item, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1">{item.title}</Typography>
                {item.publishDate && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.publishDate).toLocaleString()}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}
      
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddFeed;