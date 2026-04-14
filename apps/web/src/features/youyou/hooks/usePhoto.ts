import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { youyouPhotoApi } from '../api/photoApi';
import type { PhotoTransform } from '../api/photoApi';

export function useYouyouPhoto() {
    return useQuery({
        queryKey: ['youyou-photo'],
        queryFn: () => youyouPhotoApi.getPhotoUrl(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useUploadYouyouPhoto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => youyouPhotoApi.uploadPhoto(file),
        onSuccess: (url) => {
            qc.setQueryData(['youyou-photo'], url);
        },
    });
}

export function useDeleteYouyouPhoto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => youyouPhotoApi.deletePhoto(),
        onSuccess: () => {
            qc.setQueryData(['youyou-photo'], null);
        },
    });
}

export function usePhotoTransform() {
    return useQuery({
        queryKey: ['youyou-photo-transform'],
        queryFn: () => youyouPhotoApi.getTransform(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useSavePhotoTransform() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (t: PhotoTransform) => youyouPhotoApi.saveTransform(t),
        onSuccess: (_data, t) => {
            qc.setQueryData(['youyou-photo-transform'], t);
        },
    });
}
