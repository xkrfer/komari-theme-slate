const TAG_TONES = [
  "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
] as const;

export function tagTone(tag: string) {
  let hash = 0;
  for (let index = 0; index < tag.length; index += 1) {
    hash = (hash * 31 + tag.charCodeAt(index)) | 0;
  }
  return TAG_TONES[Math.abs(hash) % TAG_TONES.length];
}
