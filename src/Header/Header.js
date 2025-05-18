import React, { useContext } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  InputBase, 
  Box,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { AppContext } from '../../contexts/AppContext';
import { refreshAllFeeds } from '../../services/feedService';
import { useNavigate } from 'react-router-dom';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Header = ({ onMenuToggle }) => {
  const { state, dispatch } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [settingsMenu, setSettingsMenu] = React.useState(null);
  
  const handleRefresh = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const results = await refreshAllFeeds(state.feeds);
      
      if (results.updatedFeeds.length > 0) {
        dispatch({ type: 'SET_FEEDS', payload: results.updatedFeeds });
      }
      
      if (results.newArticles.length > 0) {
        dispatch({ type: 'ADD_ARTICLES', payload: results.newArticles });
        dispatch({ 
          type: 'SET_NOTIFICATION', 
          payload: {
            type: 'success',
            message: `Fetched ${results.newArticles.length} new articles`
          }
        });
      } else {
        dispatch({ 
          type: 'SET_NOTIFICATION', 
          payload: {
            type: 'info',
            message: 'No new articles found'
          }
        });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Failed to refresh feeds:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh feeds' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  const handleOpenSettings = (event) => {
    setSettingsMenu(event.currentTarget);
  };
  
  const handleCloseSettings = () => {
    setSettingsMenu(null);
  };
  
  const toggleTheme = () => {
    const newTheme = state.readingPreferences.theme === 'light' ? 'dark' : 'light';
    dispatch({
      type: 'UPDATE_READING_PREFERENCES',
      payload: { theme: newTheme }
    });
    handleCloseSettings();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          News Aggregator
        </Typography>
        
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search articles..."
            inputProps={{ 'aria-label': 'search' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </Search>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex' }}>
          <Tooltip title="Refresh feeds">
            <IconButton color="inherit" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={handleOpenSettings}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Menu
          anchorEl={settingsMenu}
          open={Boolean(settingsMenu)}
          onClose={handleCloseSettings}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  checked={state.readingPreferences.theme === 'dark'}
                  onChange={toggleTheme}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {state.readingPreferences.theme === 'dark' ? 
                    <DarkModeIcon sx={{ mr: 1 }} /> : 
                    <LightModeIcon sx={{ mr: 1 }} />
                  }
                  {state.readingPreferences.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Box>
              }
            />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;