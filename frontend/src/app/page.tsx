"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
} from "@mui/material";
import {
  ChatBubble as MessageIcon,
  Event as EventIcon,
  People as PeopleIcon,
} from "@mui/icons-material";

export default function Dashboard() {
  const stats = [
    { title: "Mensagens Recebidas", value: "1,248", icon: <MessageIcon color="primary" />, trend: "+12%" },
    { title: "Leads Capturados", value: "45", icon: <PeopleIcon color="primary" />, trend: "+5%" },
    { title: "Novos Agendamentos", value: "18", icon: <EventIcon color="primary" />, trend: "+20%" },
  ];

  return (
    <DashboardLayout title="Visão Geral">
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, md: 4 }} key={index}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="subtitle2">
                    {stat.title}
                  </Typography>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.50", color: "primary.main", display: "flex" }}>
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {stat.value}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                    {stat.trend}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    vs semana anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: "100%", minHeight: 400 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6">Performance de Atendimentos</Typography>
                <Button variant="outlined" size="small" color="inherit">Exportar</Button>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, bgcolor: "background.default", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
                <Typography color="text.secondary">O gráfico de análise será renderizado aqui.</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Status dos Agentes de IA</Typography>
              <List disablePadding>
                {['Comercial', 'Agenda', 'CRM', 'Marketing', 'Conteúdo', 'Administrativo'].map((agent) => (
                  <ListItem key={agent} disablePadding sx={{ mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main" }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{agent}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: "success.main", bgcolor: "success.50", px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                        Ativo
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
