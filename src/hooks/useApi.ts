import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Generic fetcher
const fetcher = async (url: string) => {
  const { data } = await api.get(url);
  return data;
};

// Services
export const useServices = () => useQuery({ queryKey: ['services'], queryFn: () => fetcher('/services') });
export const useCreateService = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => api.post('/services', data), onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }) });
};

// Inventory
export const useInventory = () => useQuery({ queryKey: ['inventory'], queryFn: () => fetcher('/inventory') });
export const useRestockItem = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, quantity }: { id: string; quantity: number }) => api.post(`/inventory/${id}/restock`, { quantity }), onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }) });
};

// Customers
export const useCustomers = () => useQuery({ queryKey: ['customers'], queryFn: () => fetcher('/customers') });
export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => api.post('/customers', data), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }) });
};

// Transactions & Tickets
export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/transactions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    }
  });
};

// Analytics
export const useDashboardStats = () => useQuery({ queryKey: ['analytics', 'dashboard'], queryFn: () => fetcher('/analytics/dashboard') });
export const useRevenueData = (days: number = 7) => useQuery({ queryKey: ['analytics', 'revenue', days], queryFn: () => fetcher(`/analytics/revenue?days=${days}`) });
export const useServiceDistribution = () => useQuery({ queryKey: ['analytics', 'service-distribution'], queryFn: () => fetcher('/analytics/service-distribution') });

// Tickets (Scheduling)
export const useTickets = () => useQuery({ queryKey: ['tickets'], queryFn: () => fetcher('/tickets') });
export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/tickets/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] })
  });
};