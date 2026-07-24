"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from "@mui/material";
import { FilterList as FilterIcon } from "@mui/icons-material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Define o locale português brasileiro
dayjs.locale('pt-br');

export default function Agenda() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Todos");

  // Modal states
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    client_name: string;
    client_phone: string;
    service: string;
    scheduled_at: dayjs.Dayjs | null;
  }>({
    client_name: "",
    client_phone: "",
    service: "",
    scheduled_at: null,
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/agenda/");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error("Erro ao buscar agenda", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCreate = async () => {
    if (!formData.scheduled_at) return;
    try {
      const payload = {
        ...formData,
        scheduled_at: formData.scheduled_at.toISOString(),
        agent_origin: "Humano",
        status: "Confirmado"
      };
      
      const res = await fetch("http://localhost:8000/api/v1/agenda/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setOpen(false);
        setFormData({ client_name: "", client_phone: "", service: "", scheduled_at: null });
        fetchAppointments();
      }
    } catch (err) {
      console.error("Erro ao criar", err);
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchStatus = filterStatus === "Todos" || app.status === filterStatus;
    return matchStatus;
  });

  return (
    <DashboardLayout title="Agenda de Clientes">
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FilterIcon color="action" />
              <Typography variant="subtitle2">Filtros:</Typography>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="Todos">Todos os Status</MenuItem>
                  <MenuItem value="Confirmado">Confirmado</MenuItem>
                  <MenuItem value="Pendente">Pendente</MenuItem>
                  <MenuItem value="Cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
              + Novo Agendamento
            </Button>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Data / Hora</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Serviço</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Agente (Origem)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((row) => {
                const dateObj = new Date(row.scheduled_at);
                const displayDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                const displayTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{displayDate}</Typography>
                      <Typography variant="caption" color="text.secondary">{displayTime}</Typography>
                    </TableCell>
                    <TableCell>{row.client_name}</TableCell>
                    <TableCell>{row.service}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.agent_origin} 
                        size="small" 
                        color={row.agent_origin === "IA" ? "primary" : "default"} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.status} 
                        size="small" 
                        color={row.status === "Confirmado" ? "success" : row.status === "Cancelado" ? "error" : "warning"}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small">Detalhes</Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">Nenhum agendamento encontrado.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Novo Agendamento */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Agendamento Manual</DialogTitle>
        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
              <TextField 
                label="Nome do Cliente" 
                fullWidth 
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
              />
              <TextField 
                label="Telefone (Opcional)" 
                fullWidth 
                value={formData.client_phone}
                onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
              />
              <TextField 
                label="Serviço (Ex: Consultoria)" 
                fullWidth 
                value={formData.service}
                onChange={(e) => setFormData({...formData, service: e.target.value})}
              />
              <DateTimePicker
                label="Data e Hora"
                format="DD/MM/YYYY HH:mm"
                value={formData.scheduled_at}
                onChange={(newValue) => setFormData({...formData, scheduled_at: newValue})}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.client_name || !formData.service || !formData.scheduled_at}>
            Salvar Agendamento
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
