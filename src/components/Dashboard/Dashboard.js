import React, { useContext, useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Chip, 
  Skeleton,
  Tabs, 
  Tab,
  Divider,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AppContext } from '../../contexts/AppContext';
import ArticleList from '../ArticleList/ArticleList';
import { useNavigate, useLocation } from 'react-router-dom';

// Helper to parse query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Dashboard = () => {
  // Remove dispatch since it's not being used in this component
  const { state } = useContext(AppContext);
  const { articles, feeds, loading } = state;
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const query = useQuery();
  
  const [tabValue, setTabValue] = useState(0);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [filter, setFilter] = useState({
    type: 'all',
    value: null
  });
  
  // Parse URL parameters for filtering
  useEffect(() => {
    const search = query.get('search');
    const category = query.get('category');
    const feedId = query.get('feed');
    const view = query.get('view');
    
    if (search) {
      setFilter({ type: 'search', value: search });
      setTabValue(3);
    } else if (category) {
      setFilter({ type: 'category', value: category });
      setTabValue(1);
    } else if (feedId) {
      setFilter({ type: 'feed', value: feedId });
      setTabValue(2);
    } else if (view === 'unread') {
      setFilter({ type: 'unread', value: null });
      setTabValue(1);
    } else {
      setFilter({ type: 'all', value: null });
      setTabValue(0);
    }
  }, [query]);
  
  // Filter articles based on the current filter
  useEffect(() => {
    let filtered = [...articles];
    
    switch (filter.type) {
      case 'search':
        const searchTerm = filter.value.toLowerCase();
        filtered = articles.filter(article => 
          article.title.toLowerCase().includes(searchTerm) || 
          article.content.toLowerCase().includes(searchTerm) ||
          (article.summary && article.summary.toLowerCase().includes(searchTerm))
        );
        break;
      case 'category':
        filtered = articles.filter(article => article.category === filter.value);
        break;
      case 'feed':
        filtered = articles.filter(article => article.feedId === filter.value);
        break;
      case 'unread':
        filtered = articles.filter(article => !article.isRead);
        break;
      default:
        // Sort by date for "All" view
        filtered = filtered.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    }
    
    setFilteredArticles(filtered);
  }, [articles, filter]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    switch(newValue) {
      case 0: // All
        navigate('/');
        setFilter({ type: 'all', value: null });
        break;
      case 1: // Unread
        setFilter({ type: 'unread', value: null });
        navigate('/?view=unread');
        break;
      case 2: // Feeds
        const recentFeed = feeds[0]?.id;
        if (recentFeed) {
          setFilter({ type: 'feed', value: recentFeed });
          navigate(`/?feed=${recentFeed}`);
        }
        break;
      case 3: // Search
        // Keep current search if exists
        if (filter.type !== 'search') {
          setFilter({ type: 'all', value: null });
          navigate('/');
        }
        break;
      default:
        break;
    }
  };
  
  // Get the title for the current view
  const getViewTitle = () => {
    switch (filter.type) {
      case 'search':
        return `Search Results for "${filter.value}"`;
      case 'category':
        return `Category: ${filter.value}`;
      case 'feed':
        const feed = feeds.find(f => f.id === filter.value);
        return feed ? `Feed: ${feed.title}` : 'Feed';
      case 'unread':
        return 'Unread Articles';
      default:
        return 'Latest Articles';
    }
  };
  
  const handleAddFeed = () => {
    navigate('/add-feed');
  };

  // Get all unique categories for filter chips
  const uniqueCategories = React.useMemo(() => {
    const categories = articles
      .map(article => article.category)
      .filter(Boolean);
    
    return [...new Set(categories)].sort();
  }, [articles]);

  // Handle category chip click
  const handleCategoryClick = (category) => {
    navigate(`/?category=${encodeURIComponent(category)}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {getViewTitle()}
        </Typography>
        
        {feeds.length === 0 && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddFeed}
          >
            Add Your First Feed
          </Button>
        )}
      </Box>
      
      {/* Statistics summary section */}
      {articles.length > 0 && !loading && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Total Articles:</Typography>
              <Typography variant="h6">{articles.length}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Unread Articles:</Typography>
              <Typography variant="h6">
                {articles.filter(article => !article.isRead).length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Feeds:</Typography>
              <Typography variant="h6">{feeds.length}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {articles.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Welcome to News Aggregator!
          </Typography>
          <Typography variant="body1" paragraph>
            Start by adding your favorite RSS feeds to create your personalized news dashboard.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddFeed}
            size="large"
          >
            Add Your First Feed
          </Button>
        </Paper>
      ) : (
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
            >
              <Tab label="Latest" />
              <Tab label="Unread" />
              <Tab label="By Feed" />
              <Tab label="Search Results" disabled={filter.type !== 'search'} />
            </Tabs>
          </Paper>
          
          {/* Category filter chips */}
          {uniqueCategories.length > 0 && !loading && (
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ mr: 1, alignSelf: 'center' }}>
                Filter by category:
              </Typography>
              {uniqueCategories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => handleCategoryClick(category)}
                  color={filter.type === 'category' && filter.value === category ? 'primary' : 'default'}
                  variant={filter.type === 'category' && filter.value === category ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          {loading && articles.length === 0 ? (
            // Loading skeleton
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Grid item xs={12} key={item}>
                  <Skeleton variant="rectangular" height={150} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <ArticleList articles={filteredArticles} />
          )}
          
          {filteredArticles.length === 0 && !loading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No articles found
              </Typography>
              <Typography variant="body1">
                {filter.type === 'search' 
                  ? 'Try different search terms or add more feeds.' 
                  : 'Try selecting a different feed or category.'}
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default Dashboard;