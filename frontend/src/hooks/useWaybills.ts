import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waybillsService } from '../services/waybills.service';
import toast from 'react-hot-toast';

export const useWaybillByShipment = (shipmentId: string) => {
  return useQuery({
    queryKey: ['waybills', 'shipment', shipmentId],
    queryFn: () => waybillsService.getByShipment(shipmentId),
    enabled: !!shipmentId,
  });
};

export const useGenerateWaybill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: string) => waybillsService.generate(shipmentId),
    onSuccess: (_, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: ['waybills', 'shipment', shipmentId] });
      toast.success('Waybill generated');
    },
  });
};

export const useMarkWaybillPrinted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (waybillId: string) => waybillsService.markAsPrinted(waybillId),
    onSuccess: (_, waybillId) => {
      queryClient.invalidateQueries({ queryKey: ['waybills'] });
      queryClient.invalidateQueries({ queryKey: ['waybills', waybillId] });
      toast.success('Waybill marked as printed');
    },
  });
};

export const useSignWaybill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ waybillId, signature, notes }: { waybillId: string; signature: string; notes?: string }) =>
      waybillsService.sign(waybillId, signature, notes),
    onSuccess: (_, { waybillId }) => {
      queryClient.invalidateQueries({ queryKey: ['waybills'] });
      queryClient.invalidateQueries({ queryKey: ['waybills', waybillId] });
      toast.success('Waybill signed');
    },
  });
};