export type ToneTokenClasses = {
  color: string;
  bg: string;
  bgStrong: string;
  border: string;
  fill: string;
  hoverBg: string;
};

export const TONES = {
  accent: {
    color: 'text-accent',
    bg: 'bg-accent/14',
    bgStrong: 'bg-accent/60',
    border: 'border-accent/30',
    fill: 'fill-accent',
    hoverBg: 'hover:bg-accent/22',
  },
  success: {
    color: 'text-success',
    bg: 'bg-success/14',
    bgStrong: 'bg-success/60',
    border: 'border-success/30',
    fill: 'fill-success',
    hoverBg: 'hover:bg-success/22',
  },
  warning: {
    color: 'text-warning',
    bg: 'bg-warning/14',
    bgStrong: 'bg-warning/60',
    border: 'border-warning/30',
    fill: 'fill-warning',
    hoverBg: 'hover:bg-warning/22',
  },
  danger: {
    color: 'text-danger',
    bg: 'bg-danger/14',
    bgStrong: 'bg-danger/60',
    border: 'border-danger/30',
    fill: 'fill-danger',
    hoverBg: 'hover:bg-danger/22',
  },
  blue: {
    color: 'text-tone-blue',
    bg: 'bg-tone-blue/14',
    bgStrong: 'bg-tone-blue/60',
    border: 'border-tone-blue/30',
    fill: 'fill-tone-blue',
    hoverBg: 'hover:bg-tone-blue/22',
  },
  green: {
    color: 'text-tone-green',
    bg: 'bg-tone-green/14',
    bgStrong: 'bg-tone-green/60',
    border: 'border-tone-green/30',
    fill: 'fill-tone-green',
    hoverBg: 'hover:bg-tone-green/22',
  },
  yellow: {
    color: 'text-tone-yellow',
    bg: 'bg-tone-yellow/14',
    bgStrong: 'bg-tone-yellow/60',
    border: 'border-tone-yellow/30',
    fill: 'fill-tone-yellow',
    hoverBg: 'hover:bg-tone-yellow/22',
  },
  purple: {
    color: 'text-tone-purple',
    bg: 'bg-tone-purple/14',
    bgStrong: 'bg-tone-purple/60',
    border: 'border-tone-purple/30',
    fill: 'fill-tone-purple',
    hoverBg: 'hover:bg-tone-purple/22',
  },
  orange: {
    color: 'text-tone-orange',
    bg: 'bg-tone-orange/14',
    bgStrong: 'bg-tone-orange/60',
    border: 'border-tone-orange/30',
    fill: 'fill-tone-orange',
    hoverBg: 'hover:bg-tone-orange/22',
  },
  cyan: {
    color: 'text-tone-cyan',
    bg: 'bg-tone-cyan/14',
    bgStrong: 'bg-tone-cyan/60',
    border: 'border-tone-cyan/30',
    fill: 'fill-tone-cyan',
    hoverBg: 'hover:bg-tone-cyan/22',
  },
  sky: {
    color: 'text-tone-sky',
    bg: 'bg-tone-sky/14',
    bgStrong: 'bg-tone-sky/60',
    border: 'border-tone-sky/30',
    fill: 'fill-tone-sky',
    hoverBg: 'hover:bg-tone-sky/22',
  },
  muted: {
    color: 'text-text-tertiary',
    bg: 'bg-bg-tertiary',
    bgStrong: 'bg-text-tertiary/40',
    border: 'border-border',
    fill: 'fill-text-tertiary',
    hoverBg: 'hover:bg-bg-secondary',
  },
} satisfies Record<string, ToneTokenClasses>;

export const DEFAULT_TONE = TONES.muted;
