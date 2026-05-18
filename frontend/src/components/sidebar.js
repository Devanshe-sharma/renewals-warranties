import React from 'react';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Collapse, Avatar, Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
  Rule as RuleIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useLocation, Link } from 'react-router-dom';

const drawerWidth = 260;
const BRAND_BLUE = '#1976d2';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '?');
  };

  const menuItems = [
    { to: '/', text: 'Renewal Item', icon: <DashboardIcon /> },
    { to: '/updaterenewal', text: 'Update Renewal Item', icon: <EditIcon /> },
    { to: '/categories', text: 'Categories', icon: <CategoryIcon /> },
    // { to: '/statusrules', text: 'Status Rules', icon: <RuleIcon /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e0e0e0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
    >
      {/* Sticky Header */}
      <Box
        sx={{
          bgcolor: BRAND_BLUE,
          color: 'white',
          p: 3,
          textAlign: 'center',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            width: 50,
            height: 50,
            mx: 'auto',
            mb: 1.5,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
        >
          <DashboardIcon sx={{ fontSize: 30 }} />
        </Avatar>
        <Typography 
          variant="h6" 
          fontWeight={700}
          sx={{
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
          }}
        >
          Brisk Olive
        </Typography>
        <Typography 
          variant="caption" 
          sx={{
            display: 'block',
            fontSize: '0.7rem',
            opacity: 0.9,
            mt: 0.5,
          }}
        >
          Renewals & Warranty
        </Typography>
      </Box>

      {/* Scrollable Menu */}
      <List
        sx={{
          px: 2,
          mt: 2,
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { 
            width: '4px',
            transition: 'all 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#e0e0e0',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: '#d0d0d0',
            },
          },
        }}
      >
        {menuItems.map(item => {
          if (item.subItems) {
            const isParentActive = item.subItems.some(sub => isActive(sub.to));
            return (
              <Box key={item.text} sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={item.onClick}
                  sx={{
                    borderRadius: '8px',
                    bgcolor: isParentActive ? BRAND_BLUE : 'transparent',
                    color: isParentActive ? 'white' : '#212121',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateX(0)',
                    '&:hover': {
                      bgcolor: isParentActive ? '#1976d2' : '#f8fafc',
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    },
                    '&:active': {
                      transform: 'translateX(1px)',
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: 'inherit', 
                      minWidth: 40,
                      transition: 'transform 0.3s ease',
                      '.MuiListItemButton-root:hover &': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                      },
                    }}
                  />
                  {item.open ? (
                    <ExpandLessIcon 
                      sx={{
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  ) : (
                    <ExpandMoreIcon 
                      sx={{
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  )}
                </ListItemButton>

                <Collapse 
                  in={item.open}
                  timeout={300}
                >
                  <List disablePadding>
                    {item.subItems.map((sub, index) => {
                      const active = isActive(sub.to);
                      return (
                        <ListItemButton
                          key={sub.to}
                          component={Link}
                          to={sub.to}
                          sx={{
                            pl: 6,
                            borderRadius: '6px',
                            bgcolor: active ? BRAND_BLUE : 'transparent',
                            color: active ? 'white' : '#4b5563',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: 'translateX(0)',
                            opacity: 1,
                            '&:hover': {
                              bgcolor: active ? '#1976d2' : '#f1f5f9',
                              transform: 'translateX(4px)',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            },
                            '&:active': {
                              transform: 'translateX(2px)',
                            },
                          }}
                        >
                          <ListItemIcon 
                            sx={{ 
                              color: 'inherit', 
                              minWidth: 36,
                              fontSize: '0.85rem',
                              transition: 'transform 0.3s ease',
                              '.MuiListItemButton-root:hover &': {
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            {sub.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={sub.text}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                transition: 'all 0.3s ease',
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          const active = isActive(item.to);
          return (
            <ListItemButton
              key={item.text}
              component={Link}
              to={item.to}
              sx={{
                borderRadius: '8px',
                bgcolor: active ? BRAND_BLUE : 'transparent',
                color: active ? 'white' : '#212121',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateX(0)',
                '&:hover': {
                  bgcolor: active ? '#1976d2' : '#f8fafc',
                  transform: 'translateX(2px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                },
                '&:active': {
                  transform: 'translateX(1px)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: 'inherit', 
                  minWidth: 40,
                  transition: 'transform 0.3s ease',
                  '.MuiListItemButton-root:hover &': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
