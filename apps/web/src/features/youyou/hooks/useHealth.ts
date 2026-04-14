import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../api/healthApi';
import type { MedicalRecordType } from '../types';

export function useVaccinations() {
    return useQuery({
        queryKey: ['youyou-vaccinations'],
        queryFn: () => healthApi.getVaccinations(),
    });
}

export function useVaccinationStats() {
    return useQuery({
        queryKey: ['youyou-vaccination-stats'],
        queryFn: () => healthApi.getVaccinationStats(),
    });
}

export function useMedicalRecords(type?: MedicalRecordType) {
    return useQuery({
        queryKey: ['youyou-medical-records', type],
        queryFn: () => healthApi.getMedicalRecords(type),
    });
}

export function useMedicalStats() {
    return useQuery({
        queryKey: ['youyou-medical-stats'],
        queryFn: () => healthApi.getMedicalStats(),
    });
}
