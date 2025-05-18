// src/contexts/AppContext.js
import React, { createContext, useReducer, useEffect } from 'react';
import { openDB } from 'idb';

// Create context
export const AppContext = createContext();

// Initial state
const initialState = {
  feeds: [],
  articles: [],
  categories: [],
  bookmarks: [],
  statistics: {
    readArticles: 0,
    totalReadingTime: 0,
    categoryBreakdown: {},
    readingHistory: []
  },
  readingPreferences: {
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    theme: 'light',
    textAlign: 'left',
    marginWidth: 'medium'
  },
  loading: false,
  error: null
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_FEEDS':
      return { ...state, feeds: action.payload };
    case 'ADD_FEED':
      return { ...state, feeds: [...state.feeds, action.payload] };
    case 'REMOVE_FEED':
      return { ...state, feeds: state.feeds.filter(feed => feed.id !== action.payload) };
    case 'UPDATE_FEED':
      return { 
        ...state, 
        feeds: state.feeds.map(feed => 
          feed.id === action.payload.id ? action.payload : feed
        ) 
      };
    case 'SET_ARTICLES':
      return { ...state, articles: action.payload };
    case 'ADD_ARTICLES':
      // Filter out duplicates by URL
      const existingUrls = new Set(state.articles.map(article => article.url));
      const newArticles = action.payload.filter(article => !existingUrls.has(article.url));
      return { 
        ...state, 
        articles: [...state.articles, ...newArticles] 
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        articles: state.articles.map(article => 
          article.id === action.payload ? { ...article, isRead: true, readDate: new Date().toISOString() } : article
        ),
        statistics: {
          ...state.statistics,
          readArticles: state.statistics.readArticles + 1,
          readingHistory: [
            ...state.statistics.readingHistory,
            { 
              articleId: action.payload, 
              date: new Date().toISOString(), 
              category: state.articles.find(a => a.id === action.payload)?.category || 'uncategorized'
            }
          ]
        }
      };
    case 'TOGGLE_BOOKMARK':
      return {
        ...state,
        articles: state.articles.map(article => 
          article.id === action.payload 
            ? { ...article, isBookmarked: !article.isBookmarked } 
            : article
        ),
        bookmarks: state.articles.find(a => a.id === action.payload)?.isBookmarked
          ? state.bookmarks.filter(id => id !== action.payload)
          : [...state.bookmarks, action.payload]
      };
    case 'UPDATE_READING_TIME':
      return {
        ...state,
        articles: state.articles.map(article => 
          article.id === action.payload.articleId 
            ? { ...article, actualReadingTime: (article.actualReadingTime || 0) + action.payload.seconds } 
            : article
        ),
        statistics: {
          ...state.statistics,
          totalReadingTime: state.statistics.totalReadingTime + action.payload.seconds,
          categoryBreakdown: {
            ...state.statistics.categoryBreakdown,
            [action.payload.category]: (state.statistics.categoryBreakdown[action.payload.category] || 0) + action.payload.seconds
          }
        }
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'REMOVE_CATEGORY':
      return { ...state, categories: state.categories.filter(cat => cat.id !== action.payload) };
    case 'UPDATE_READING_PREFERENCES':
      return { 
        ...state, 
        readingPreferences: { ...state.readingPreferences, ...action.payload } 
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Database initialization
const initDB = async () => {
  const db = await openDB('news-aggregator-db', 1, {
    upgrade(db) {
      // Create stores
      db.createObjectStore('feeds', { keyPath: 'id' });
      db.createObjectStore('articles', { keyPath: 'id' });
      db.createObjectStore('categories', { keyPath: 'id' });
      db.createObjectStore('bookmarks', { keyPath: 'id' });
      db.createObjectStore('statistics', { keyPath: 'id' });
      db.createObjectStore('preferences', { keyPath: 'id' });
    },
  });
  return db;
};

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const db = await initDB();
        
        // Load feeds
        const feeds = await db.getAll('feeds');
        if (feeds.length) {
          dispatch({ type: 'SET_FEEDS', payload: feeds });
        }
        
        // Load articles
        const articles = await db.getAll('articles');
        if (articles.length) {
          dispatch({ type: 'SET_ARTICLES', payload: articles });
        }
        
        // Load categories
        const categories = await db.getAll('categories');
        if (categories.length) {
          dispatch({ type: 'SET_CATEGORIES', payload: categories });
        }
        
        // Load bookmarks
        const bookmarks = await db.getAll('bookmarks');
        if (bookmarks.length) {
          dispatch({ type: 'SET_BOOKMARKS', payload: bookmarks.map(b => b.id) });
        }
        
        // Load statistics
        const statistics = await db.get('statistics', 'user-stats');
        if (statistics) {
          dispatch({ type: 'SET_STATISTICS', payload: statistics });
        }
        
        // Load preferences
        const preferences = await db.get('preferences', 'reading-preferences');
        if (preferences) {
          dispatch({ type: 'UPDATE_READING_PREFERENCES', payload: preferences });
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load application data' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadInitialData();
  }, []);

  // Save state changes to IndexedDB
  useEffect(() => {
    const saveStateToIndexedDB = async () => {
      if (state.loading) return; // Don't save while loading initial data
      
      try {
        const db = await initDB();
        
        // Save feeds
        const tx = db.transaction('feeds', 'readwrite');
        await Promise.all(state.feeds.map(feed => tx.store.put(feed)));
        await tx.done;
        
        // Save articles (only keep the most recent 1000 to avoid storage limits)
        const articlesTx = db.transaction('articles', 'readwrite');
        const sortedArticles = [...state.articles]
          .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
          .slice(0, 1000);
        await Promise.all(sortedArticles.map(article => articlesTx.store.put(article)));
        await articlesTx.done;
        
        // Save other data...
        await db.put('statistics', state.statistics, 'user-stats');
        await db.put('preferences', state.readingPreferences, 'reading-preferences');
        
        // Save bookmarks
        const bookmarksTx = db.transaction('bookmarks', 'readwrite');
        await bookmarksTx.store.clear(); // Clear existing
        await Promise.all(state.bookmarks.map(id => 
          bookmarksTx.store.put({ id, date: new Date().toISOString() })
        ));
        await bookmarksTx.done;
        
      } catch (error) {
        console.error('Failed to save state to IndexedDB:', error);
      }
    };
    
    saveStateToIndexedDB();
  }, [state.feeds, state.articles, state.categories, state.bookmarks, state.statistics, state.readingPreferences]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};