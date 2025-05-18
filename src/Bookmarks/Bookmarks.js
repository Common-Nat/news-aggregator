import React, { useContext, useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Tabs,
  Tab,
  Divider,
  Grid,
  Button,
  Chip,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import { AppContext } from '../../contexts/AppContext';
import ArticleList from '../ArticleList/ArticleList';
import { Link } from 'react-router-dom';

const Bookmarks = () => {
  const { state, dispatch } = useContext(AppContext);
  const { articles, bookmarks } = state;
  
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [sortOption, setSortOption] = useState('newest');
  const [filterValue, setFilterValue] = useState('all');
  
  // Get all bookmarked articles
  useEffect(() => {
    const getBookmarkedArticles = () => {
      const bookmarked = articles.filter(article => article.isBookmarked);
      
      // Apply sorting
      let sorted = [...bookmarked];
      
      switch (sortOption) {
        case 'newest':
          sorted = sorted.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
          break;
        case 'oldest':
          sorted = sorted.sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
          break;
        case 'title':
          sorted = sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        default:
          break;
      }
      
      // Apply filtering
      if (filterValue !== 'all') {
        sorted = sorted.filter(article => article.category === filterValue);
      }
      
      setBookmarkedArticles(sorted);
    };
    
    getBookmarkedArticles();
  }, [articles, bookmarks, sortOption, filterValue]);
  
  // Get available categories from bookmarked articles
  const categories = React.useMemo(() => {
    const bookmarked = articles.filter(article => article.isBookmarked);
    return Array.from(new Set(bookmarked.map(article => article.category)))
      .filter(Boolean) // Remove null/undefined
      .sort();
  }, [articles]);
  
  const handleSortChange = (newSort) => {
    setSortOption(newSort);
  };
  
  const handleFilterChange = (event, newValue) => {
    setFilterValue(newValue);
  };
  
  const handleRemoveAllBookmarks = () => {
    if (window.confirm('Are you sure you want to remove all bookmarks?')) {
      // For each bookmarked article, dispatch toggle action
      bookmarkedArticles.forEach(article => {
        dispatch({ type: 'TOGGLE_BOOKMARK', payload: article.id });
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Bookmarks
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={() => handleSortChange(
              sortOption === 'newest' ? 'oldest' : 
              sortOption === 'oldest' ? 'title' : 'newest'
            )}
          >
            Sort: {sortOption === 'newest' ? 'Newest' : 
                  sortOption === 'oldest' ? 'Oldest' : 'Title'}
          </Button>
          
          {bookmarkedArticles.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleRemoveAllBookmarks}
            >
              Remove All
            </Button>
          )}
        </Box>
      </Box>
      
      {bookmarkedArticles.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No bookmarked articles
          </Typography>
          <Typography variant="body1" paragraph>
            Start bookmarking articles you want to read later.
          </Typography>
          <Button component={Link} to="/" variant="contained" color="primary">
            Browse Articles
          </Button>
        </Paper>
      ) : (
        <>
          {categories.length > 0 && (
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={filterValue}
                onChange={handleFilterChange}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All Categories" value="all" />
                {categories.map(category => (
                  <Tab key={category} label={category} value={category} />
                ))}
              </Tabs>
            </Paper>
          )}
          
          <ArticleList articles={bookmarkedArticles} />
          
          {filterValue !== 'all' && bookmarkedArticles.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
              <Typography variant="body1">
                No bookmarked articles in this category.
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default Bookmarks;