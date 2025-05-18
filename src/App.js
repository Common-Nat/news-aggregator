import React, { useState, useContext, useEffect } from 'react';
import {
  CssBaseline,
  Box,
  CircularProgress,
  ThemeProvider,
  createTheme,
  Alert,
  Snackbar
} from '@mui/material';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, AppContext } from './contexts/AppContext';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import ArticleView from './components/ArticleView/ArticleView';
import AddFeed from './components/AddFeed/AddFeed';
import ReadingStatistics from './components/ReadingStatistics/ReadingStatistics';
import Recommendations from './components/Recommendations/Recommendations';
import Bookmarks from './components/Bookmarks/Bookmarks';
import { refreshAllFeeds } from './services/feedService';
import { registerServiceWorker } from './serviceWorker';

// Wrapper component to access context
const AppContent = () => {
  const { state, dispatch } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Create theme based on user preferences
  const theme = createTheme({
    palette: {
      mode: state.readingPreferences.theme,
      primary: {
        main: '#4a6cf7',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });
  
  // Refresh feeds on startup
  useEffect(() => {
    const refreshFeeds = async () => {
      if (state.feeds.length > 0) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const results = await refreshAllFeeds(state.feeds);
          
          if (results.updatedFeeds.length > 0) {
            dispatch({ type: 'SET_FEEDS', payload: results.updatedFeeds });
          }
          
          if (results.newArticles.length > 0) {
            dispatch({ type: 'ADD_ARTICLES', payload: results.newArticles });
            setNotification({
              open: true,
              message: `Fetched ${results.newArticles.length} new articles`,
              severity: 'success'
            });
          } else {
            setNotification({
              open: true,
              message: 'No new articles found',
              severity: 'info'
            });
          }
          dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
          console.error('Failed to refresh feeds:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh feeds' });
          dispatch({ type: 'SET_LOADING', payload: false });
          setNotification({
            open: true,
            message: 'Failed to refresh feeds',
            severity: 'error'
          });
        }
      }
    };
    
    refreshFeeds();
    
    // Register service worker for offline support
    registerServiceWorker();
    
    // Set up periodic refresh (every 30 minutes)
    const refreshInterval = setInterval(refreshFeeds, 30 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [dispatch, state.feeds]);
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  if (state.loading && state.articles.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <Box sx={{ 
          flexGrow: 1, 
          p: 3, 
          mt: 8, 
          ml: { xs: 0, sm: sidebarOpen ? 32 : 0 },
          transition: theme => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          overflowY: 'auto'
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/article/:id" element={<ArticleView />} />
            <Route path="/add-feed" element={<AddFeed />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/stats" element={<ReadingStatistics />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
        
        <Snackbar 
          open={notification.open} 
          autoHideDuration={5000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

// Root component with context provider
const App = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;