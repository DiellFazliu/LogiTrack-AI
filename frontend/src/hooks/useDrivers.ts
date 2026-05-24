import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversService } from '../services/drivers.service';
import toast from 'react-hot-toast';

export const useDrivers = (filters?: { page?: number; status?: string; search?: string }) => {
  return useQuery({
    queryKey: ['drivers', filters],
    queryFn: () => driversService.getAll(filters),
  });
};

export const useAvailableDrivers = () => {
  return useQuery({
    queryKey: ['drivers', 'available'],
    queryFn: () => driversService.getAvailable(),
  });
};

export const useDriver = (id: string) => {
  return useQuery({
    queryKey: ['drivers', id],
    queryFn: () => driversService.getById(id),
    enabled: !!id,
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => driversService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver created');
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => driversService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
      toast.success('Driver updated');
    },
  });
};

export const useUpdateDriverStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      driversService.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
      toast.success('Status updated');
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => driversService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver deleted');
    },
  });
};