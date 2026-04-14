'use client';

import { useRef, useState, useEffect } from 'react';
import { ImagePlus, Trash2, Upload, RotateCcw } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useYouyouPhoto, useUploadYouyouPhoto, useDeleteYouyouPhoto, usePhotoTransform, useSavePhotoTransform } from '../../youyou/hooks/usePhoto';
import type { PhotoTransform } from '../../youyou/api/photoApi';

const DEFAULT: PhotoTransform = { x: 50, y: 50, zoom: 100, blurL: 12, blurC: 1, blurR: 8 };

function SliderRow({ label, min, max, step, value, unit, leftLabel, rightLabel, onChange }: {
    label: string; min: number; max: number; step?: number;
    value: number; unit: string; leftLabel: string; rightLabel: string;
    onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-body-sm text-text-secondary">{label}</span>
                <span className="text-caption text-text-tertiary tabular-nums">{value}{unit}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-caption text-text-tertiary shrink-0 w-6 text-center">{leftLabel}</span>
                <input
                    type="range"
                    min={min} max={max} step={step ?? 1}
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="flex-1 accent-accent"
                />
                <span className="text-caption text-text-tertiary shrink-0 w-6 text-center">{rightLabel}</span>
            </div>
        </div>
    );
}

export function YouyouPhotoSettings() {
    const fileRef = useRef<HTMLInputElement>(null);
    const { data: photoUrl, isLoading } = useYouyouPhoto();
    const upload = useUploadYouyouPhoto();
    const remove = useDeleteYouyouPhoto();
    const { data: saved } = usePhotoTransform();
    const save = useSavePhotoTransform();
    const [t, setT] = useState<PhotoTransform>(DEFAULT);

    useEffect(() => {
        if (saved) setT(saved);
    }, [saved]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        upload.mutate(file);
        e.target.value = '';
    };

    const isDirty = saved && (t.x !== saved.x || t.y !== saved.y || t.zoom !== saved.zoom || t.blurL !== saved.blurL || t.blurC !== saved.blurC || t.blurR !== saved.blurR);

    return (
        <Card className="p-card space-y-4">
            <div>
                <h3 className="text-body font-semibold text-text-primary">又又封面照片</h3>
                <p className="mt-1 text-body-sm text-text-secondary">
                    上传一张照片作为又又总览页面的背景封面，支持 JPG / PNG / WebP，最大 5MB。
                </p>
            </div>

            {isLoading ? (
                <div className="h-40 rounded-card bg-bg-tertiary animate-pulse" />
            ) : photoUrl ? (
                <div className="space-y-4">
                    {/* 实时预览 */}
                    <div className="relative group overflow-hidden rounded-card border border-glass-border" style={{ height: 180 }}>
                        <img
                            src={photoUrl}
                            alt="又又封面"
                            className="absolute inset-0 h-full w-full object-cover transition-all duration-150"
                            style={{
                                transform: `translate(${(t.x - 50) * 0.5}%, ${(t.y - 50) * 0.5}%) scale(${t.zoom / 100})`,
                            }}
                        />
                        {/* 与 dashboard 一致的模糊层 */}
                        {t.blurC > 0 && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ backdropFilter: `blur(${t.blurC}px)` }}
                            />
                        )}
                        {t.blurL > 0 && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backdropFilter: `blur(${t.blurL}px)`,
                                    maskImage: 'linear-gradient(to right, black 0%, black 15%, transparent 45%)',
                                }}
                            />
                        )}
                        {t.blurR > 0 && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backdropFilter: `blur(${t.blurR}px)`,
                                    maskImage: 'linear-gradient(to right, transparent 55%, black 85%, black 100%)',
                                }}
                            />
                        )}
                        {/* 左侧文字区底色 */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(to right, color-mix(in srgb, var(--bg-primary) 50%, transparent) 0%, color-mix(in srgb, var(--bg-primary) 25%, transparent) 30%, transparent 50%)',
                            }}
                        />
                        <div className="absolute bottom-2 left-3 text-white/90 text-caption pointer-events-none">预览效果</div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => fileRef.current?.click()}
                                disabled={upload.isPending}
                            >
                                <Upload size={14} />
                                更换
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => remove.mutate()}
                                disabled={remove.isPending}
                            >
                                <Trash2 size={14} />
                                删除
                            </Button>
                        </div>
                    </div>

                    {/* 调节控件 */}
                    <div className="space-y-3 rounded-inner-card border border-glass-border/80 bg-panel-bg/60 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-body-sm font-medium text-text-primary">位置与缩放</span>
                            <button
                                type="button"
                                onClick={() => setT(DEFAULT)}
                                className="flex items-center gap-1 text-caption text-text-tertiary hover:text-accent transition-colors"
                            >
                                <RotateCcw size={12} />
                                重置
                            </button>
                        </div>
                        <SliderRow
                            label="水平位置" min={0} max={100} value={t.x} unit="%"
                            leftLabel="左" rightLabel="右"
                            onChange={x => setT(p => ({ ...p, x }))}
                        />
                        <SliderRow
                            label="垂直位置" min={0} max={100} value={t.y} unit="%"
                            leftLabel="上" rightLabel="下"
                            onChange={y => setT(p => ({ ...p, y }))}
                        />
                        <SliderRow
                            label="缩放" min={100} max={200} step={5} value={t.zoom} unit="%"
                            leftLabel="小" rightLabel="大"
                            onChange={zoom => setT(p => ({ ...p, zoom }))}
                        />
                        <SliderRow
                            label="左侧模糊" min={0} max={20} step={1} value={t.blurL} unit="px"
                            leftLabel="清" rightLabel="糊"
                            onChange={blurL => setT(p => ({ ...p, blurL }))}
                        />
                        <SliderRow
                            label="中间模糊" min={0} max={10} step={1} value={t.blurC} unit="px"
                            leftLabel="清" rightLabel="糊"
                            onChange={blurC => setT(p => ({ ...p, blurC }))}
                        />
                        <SliderRow
                            label="右侧模糊" min={0} max={20} step={1} value={t.blurR} unit="px"
                            leftLabel="清" rightLabel="糊"
                            onChange={blurR => setT(p => ({ ...p, blurR }))}
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => save.mutate(t)}
                            disabled={save.isPending || !isDirty}
                            className="w-full"
                        >
                            {save.isPending ? '保存中...' : '保存位置'}
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={upload.isPending}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-glass-border/70 bg-bg-tertiary/40 py-10 text-text-tertiary transition-colors hover:border-accent/50 hover:text-accent"
                >
                    <ImagePlus size={32} />
                    <span className="text-body-sm font-medium">
                        {upload.isPending ? '上传中...' : '点击上传照片'}
                    </span>
                </button>
            )}

            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFile}
            />

            {upload.isError && (
                <p className="text-body-sm text-danger">上传失败，请重试。</p>
            )}
        </Card>
    );
}
