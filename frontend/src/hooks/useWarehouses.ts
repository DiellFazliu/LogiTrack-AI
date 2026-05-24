import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesService } from '../services/warehouses.service';
import toast from 'react-hot-toast';

export const useWarehouses = (filters?: { page?: number; search?: string }) => {
  return useQuery({
    queryKey: ['warehouses', filters],
    queryFn: () => warehousesService.getAll(filters),
  });
};

export const useWarehouse = (id: string) => {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => warehousesService.getById(id),
    enabled: !!id,
  });
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => warehousesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse created');
    },
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => warehousesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', id] });
      toast.success('Warehouse updated');
    },
  });
};

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehousesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse deleted');
    },
  });
};