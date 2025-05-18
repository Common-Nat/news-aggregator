import React, { useContext } from 'react';
import {
  Box,
  Drawer,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BarChartIcon from '@mui/icons-material/BarChart';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import AddIcon from '@mui/icons-material/Add';
import FeedIcon from '@mui/icons-material/Feed';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AppContext } from '../contexts/AppContext';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 256;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Sidebar = ({ open, onClose }) => {
  const { state } = useContext(AppContext);
  const { feeds, categories } = state;
  const location = useLocation();
  
  const [feedsOpen, setFeedsOpen] = React.useState(true);
  const [categoriesOpen, setCategoriesOpen] = React.useState(true);
  
  const handleToggleFeeds = () => {
    setFeedsOpen(!feedsOpen);
  };
  
  const handleToggleCategories = () => {
    setCategoriesOpen(!categoriesOpen);
  };
  
  const groupedFeeds = React.useMemo(() => {
    const grouped = {};
    
    feeds.forEach(feed => {
      const category = feed.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(feed);
    });
    
    return grouped;
  }, [feeds]);
  
  const drawer = (
    <>
      <DrawerHeader />
      <Divider />
      <List>
        <ListItem component={Link} to="/" disablePadding>
          <ListItemButton selected={location.pathname === '/'}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        
        <ListItem component={Link} to="/bookmarks" disablePadding>
          <ListItemButton selected={location.pathname === '/bookmarks'}>
            <ListItemIcon>
              <BookmarkIcon />
            </ListItemIcon>
            <ListItemText primary="Bookmarks" />
          </ListItemButton>
        </ListItem>
        
        <ListItem component={Link} to="/recommendations" disablePadding>
          <ListItemButton selected={location.pathname === '/recommendations'}>
            <ListItemIcon>
              <ThumbUpIcon />
            </ListItemIcon>
            <ListItemText primary="Recommendations" />
          </ListItemButton>
        </ListItem>
        
        <ListItem component={Link} to="/stats" disablePadding>
          <ListItemButton selected={location.pathname === '/stats'}>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText primary="Reading Stats" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Divider />
      
      <List>
        <ListItem>
          <ListItemButton onClick={handleToggleCategories}>
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Categories" />
            {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {Object.keys(groupedFeeds).sort().map(category => (
              <ListItem key={category} disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={`/?category=${encodeURIComponent(category)}`}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <FolderIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={category} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
        
        <ListItem>
          <ListItemButton onClick={handleToggleFeeds}>
            <ListItemIcon>
              <FeedIcon />
            </ListItemIcon>
            <ListItemText primary="My Feeds" />
            {feedsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={feedsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {feeds.map(feed => (
              <ListItem key={feed.id} disablePadding secondaryAction={
                <Tooltip title="Open feed website">
                  <IconButton 
                    edge="end" 
                    aria-label="open" 
                    onClick={() => window.open(feed.url, '_blank')}
                    size="small"
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }>
                <ListItemButton 
                  component={Link} 
                  to={`/?feed=${encodeURIComponent(feed.id)}`}
                  sx={{ pl: 4 }}
                >
                  <ListItemText 
                    primary={feed.title} 
                    primaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
        
        <ListItem component={Link} to="/add-feed" disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Add Feed" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth 
          },
        }}
      >
        {drawer}
      </Drawer>
      
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            transform: open ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
            transition: theme => theme.transitions.create('transform', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open={open}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;