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
  Badge,
  Avatar
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
import CategoryIcon from '@mui/icons-material/Category';
import { AppContext } from '../../contexts/AppContext';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 256;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

// Category item with custom styling
const CategoryAvatar = styled(Avatar)(({ theme }) => ({
  width: 24,
  height: 24,
  backgroundColor: theme.palette.primary.main,
  fontSize: '0.75rem',
}));

const Sidebar = ({ open, onClose }) => {
  const { state } = useContext(AppContext);
  const { feeds, categories, articles } = state;
  const location = useLocation();
  
  const [feedsOpen, setFeedsOpen] = React.useState(true);
  const [categoriesOpen, setCategoriesOpen] = React.useState(true);
  
  const handleToggleFeeds = () => {
    setFeedsOpen(!feedsOpen);
  };
  
  const handleToggleCategories = () => {
    setCategoriesOpen(!categoriesOpen);
  };
  
  // Organize feeds by category for feed list
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

  // Count unread articles by category
  const categoryUnreadCounts = React.useMemo(() => {
    const counts = {};
    
    articles.forEach(article => {
      if (!article.isRead) {
        const category = article.category || 'Uncategorized';
        counts[category] = (counts[category] || 0) + 1;
      }
    });
    
    return counts;
  }, [articles]);

  // Count unread articles by feed
  const feedUnreadCounts = React.useMemo(() => {
    const counts = {};
    
    articles.forEach(article => {
      if (!article.isRead && article.feedId) {
        counts[article.feedId] = (counts[article.feedId] || 0) + 1;
      }
    });
    
    return counts;
  }, [articles]);
  
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
              <Badge 
                color="secondary" 
                badgeContent={articles.filter(article => article.isBookmarked).length}
                showZero={false}
              >
                <BookmarkIcon />
              </Badge>
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
              <CategoryIcon />
            </ListItemIcon>
            <ListItemText primary="Categories" />
            {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {categories.map(category => (
              <ListItem key={category.id} disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={`/?category=${encodeURIComponent(category.name)}`}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    {categoryUnreadCounts[category.name] ? (
                      <Badge 
                        color="error" 
                        badgeContent={categoryUnreadCounts[category.name]}
                      >
                        <FolderIcon fontSize="small" />
                      </Badge>
                    ) : (
                      <FolderIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.name}
                  />
                  <CategoryAvatar>{category.name.charAt(0).toUpperCase()}</CategoryAvatar>
                </ListItemButton>
              </ListItem>
            ))}
            
            {/* For feeds with uncategorized category */}
            {groupedFeeds['Uncategorized'] && (
              <ListItem disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={`/?category=Uncategorized`}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    {categoryUnreadCounts['Uncategorized'] ? (
                      <Badge 
                        color="error" 
                        badgeContent={categoryUnreadCounts['Uncategorized']}
                      >
                        <FolderIcon fontSize="small" />
                      </Badge>
                    ) : (
                      <FolderIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary="Uncategorized" />
                </ListItemButton>
              </ListItem>
            )}
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
                  <ListItemIcon>
                    {feedUnreadCounts[feed.id] ? (
                      <Badge 
                        color="error" 
                        badgeContent={feedUnreadCounts[feed.id]}
                      >
                        <FeedIcon fontSize="small" />
                      </Badge>
                    ) : (
                      <FeedIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={feed.title} 
                    primaryTypographyProps={{ noWrap: true }}
                    secondary={feed.category || 'Uncategorized'}
                    secondaryTypographyProps={{ noWrap: true, variant: 'caption' }}
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