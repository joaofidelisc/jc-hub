"use client";

import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Message as MessageIcon,
  Event as EventIcon,
  BarChart as BarChartIcon,
  NotificationsNone as NotificationsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7c3aed", // Vibrant purple
    },
    secondary: {
      main: "#10b981", // Emerald green
    },
    background: {
      default: "#0f172a", // Slate 900
      paper: "rgba(30, 41, 59, 0.7)", // Slate 800 with opacity for glassmorphism
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
          transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 12px 40px 0 rgba(124, 58, 237, 0.2)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          padding: "10px 24px",
        },
      },
    },
  },
});

export default function Dashboard() {
  const stats = [
    { title: "Mensagens Hoje", value: "1,248", icon: <MessageIcon fontSize="large" color="primary" />, trend: "+12%" },
    { title: "Novos Leads", value: "45", icon: <BarChartIcon fontSize="large" color="secondary" />, trend: "+5%" },
    { title: "Agendamentos", value: "18", icon: <EventIcon fontSize="large" color="primary" />, trend: "+20%" },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
        
        {/* Sidebar (simplified for MVP) */}
        <Box sx={{ width: 280, bgcolor: "rgba(15, 23, 42, 0.8)", borderRight: "1px solid rgba(255,255,255,0.05)", p: 3, display: { xs: "none", md: "block" } }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 6, color: "primary.main", display: "flex", alignItems: "center", gap: 1 }}>
            JC Business <span className="text-xs bg-primary-main/20 text-primary-main px-2 py-1 rounded-full">AI</span>
          </Typography>
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button startIcon={<DashboardIcon />} variant="contained" color="primary" fullWidth sx={{ justifyContent: "flex-start", py: 1.5 }}>
              Dashboard
            </Button>
            <Button startIcon={<MessageIcon />} variant="text" sx={{ color: "text.secondary", justifyContent: "flex-start", py: 1.5, "&:hover": { color: "white" } }}>
              Atendimento
            </Button>
            <Button startIcon={<EventIcon />} variant="text" sx={{ color: "text.secondary", justifyContent: "flex-start", py: 1.5, "&:hover": { color: "white" } }}>
              Agenda
            </Button>
            <Button startIcon={<SettingsIcon />} variant="text" sx={{ color: "text.secondary", justifyContent: "flex-start", py: 1.5, "&:hover": { color: "white" } }}>
              Configurações
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
          <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 4 }}>
            <Toolbar sx={{ justifyContent: "space-between", px: "0 !important" }}>
              <Typography variant="h4" sx={{ background: "linear-gradient(45deg, #7c3aed, #3b82f6)", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Visão Geral
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton sx={{ color: "text.secondary" }}>
                  <NotificationsIcon />
                </IconButton>
                <Avatar sx={{ bgcolor: "primary.main", cursor: "pointer" }}>J</Avatar>
              </Box>
            </Toolbar>
          </AppBar>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <Card>
                  <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 3 }}>
                    <Box>
                      <Typography color="text.secondary" variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "secondary.main", mt: 1, fontWeight: 600 }}>
                        {stat.trend} em relação a ontem
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }}>
                      {stat.icon}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ height: "100%", minHeight: 350 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>Atendimentos Recentes da IA</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 250 }}>
                    <Typography color="text.secondary">O gráfico de conversas será renderizado aqui.</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>Status dos Agentes</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {['Comercial', 'Agenda', 'Suporte'].map((agent) => (
                      <Box key={agent} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "secondary.main", boxShadow: "0 0 10px #10b981" }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>Agente {agent}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">Online</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
