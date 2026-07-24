"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  ThemeProvider,
  createTheme,
  CssBaseline,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  ChatBubble as MessageIcon,
  Event as EventIcon,
  TrendingUp as BarChartIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

const lightEnterpriseTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb", // Deep professional blue (Stripe/Vercel style)
    },
    secondary: {
      main: "#0ea5e9", // Sky blue for accents
    },
    background: {
      default: "#f8fafc", // Very light slate gray
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, fontSize: "1.1rem" },
    subtitle2: {
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#64748b",
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          border: "1px solid #e2e8f0",
          transition: "box-shadow 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8, boxShadow: "none" },
        containedPrimary: {
          background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
          border: "1px solid #1d4ed8",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 4,
          "&.Mui-selected": {
            backgroundColor: "#eff6ff",
            color: "#2563eb",
            "& .MuiListItemIcon-root": { color: "#2563eb" },
          },
        },
      },
    },
  },
});

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    { label: "Visão Geral", icon: <DashboardIcon />, path: "/" },
    { label: "Agenda", icon: <EventIcon />, path: "/agenda" },
    { label: "CRM de Clientes", icon: <PeopleIcon />, path: "/crm" },
  ];

  return (
    <ThemeProvider theme={lightEnterpriseTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <Box 
          sx={{ 
            width: 260, 
            bgcolor: "#ffffff", 
            borderRight: "1px solid", 
            borderColor: "divider",
            display: { xs: "none", md: "flex" },
            flexDirection: "column" 
          }}
        >
          <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ 
              width: 36, 
              height: 36, 
              borderRadius: 2, 
              bgcolor: "primary.main", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "1.2rem",
              letterSpacing: "-1px",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)"
            }}>
              JC
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", letterSpacing: "-0.5px" }}>
              Business
            </Typography>
          </Box>
          
          <Box sx={{ px: 2, flex: 1 }}>
            <List>
              {menuItems.map((item) => (
                <ListItem disablePadding key={item.path}>
                  <ListItemButton component="a" href={item.path} selected={pathname === item.path}>
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={<Typography sx={{ fontWeight: 500 }}>{item.label}</Typography>} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon sx={{ minWidth: 40 }}><SettingsIcon /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontWeight: 500 }}>Configurações</Typography>} />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
          {/* Topbar */}
          <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(8px)" }}>
            <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 4 } }}>
              <Typography variant="h5" color="text.primary">
                {title}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconButton size="small" sx={{ color: "text.secondary", border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1 }}>
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ color: "text.secondary", border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1 }}>
                  <NotificationsIcon fontSize="small" />
                </IconButton>
                <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: "0.9rem", fontWeight: 600, ml: 1 }}>
                  JC
                </Avatar>
              </Box>
            </Toolbar>
          </AppBar>
          
          {/* Page Content */}
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
