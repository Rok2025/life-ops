import { useQuery } from '@tanstack/react-query';
import { growthApi } from '../api/growthApi';

export function useGrowthRecords(limit = 50, offset = 0) {
    return useQuery({
        queryKey: ['youyou-growth-records', limit, offset],
        queryFn: () => growthApi.getRecords(limit, offset),
    });
}

export function useGrowthLatest() {
    return useQuery({
        queryKey: ['youyou-growth-latest'],
        queryFn: () => growthApi.getLatest(),
    });
}

export function useGrowthStats() {
    return useQuery({
        queryKey: ['youyou-growth-stats'],
        queryFn: () => growthApi.getStats(),
    });
}
