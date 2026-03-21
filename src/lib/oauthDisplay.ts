/** 教學用：過長字串中間省略 */
export function truncateDisplay(s: string, head = 14, tail = 6): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
