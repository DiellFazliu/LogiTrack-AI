import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsService } from '../services/shipments.service';
import toast from 'react-hot-toast';

export const useShipments = (filters?: { page?: number; status?: string; search?: string; fromDate?: string; toDate?: string }) => {
  return useQuery({
    queryKey: ['shipments', filters],
    queryFn: () => shipmentsService.getAll(filters),
  });
};

export const useMyShipments = (filters?: { page?: number; status?: string }) => {
  return useQuery({
    queryKey: ['shipments', 'my', filters],
    queryFn: () => shipmentsService.getMyShipments(filters),
  });
};

export const useDriverShipments = (filters?: { page?: number; status?: string }) => {
  return useQuery({
    queryKey: ['shipments', 'driver', filters],
    queryFn: () => shipmentsService.getDriverShipments(filters),
  });
};

export const useShipment = (id: string) => {
  return useQuery({
    queryKey: ['shipments', id],
    queryFn: () => shipmentsService.getById(id),
    enabled: !!id,
  });
};

export const useTrackShipment = (trackingNumber: string) => {
  return useQuery({
    queryKey: ['shipments', 'track', trackingNumber],
    queryFn: () => shipmentsService.track(trackingNumber),
    enabled: !!trackingNumber,
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => shipmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Shipment created');
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => shipmentsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', id] });
      toast.success('Shipment updated');
    },
  });
};

export const useUpdateShipmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      shipmentsService.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', id] });
      toast.success('Status updated');
    },
  });
};

export const useAssignDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, driverId }: { id: string; driverId: string }) =>
      shipmentsService.assignDriver(id, driverId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', id] });
      toast.success('Driver assigned');
    },
  });
};

export const useAssignVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vehicleId }: { id: string; vehicleId: string }) =>
      shipmentsService.assignVehicle(id, vehicleId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', id] });
      toast.success('Vehicle assigned');
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Shipment deleted');
    },
  });
};

export const useShipmentStats = () => {
  return useQuery({
    queryKey: ['shipments', 'stats'],
    queryFn: () => shipmentsService.getStats(),
  });
};