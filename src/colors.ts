/**
 * Minimal ANSI color utilities. Replaces chalk with zero dependencies.
 * Bun's terminal output handles ANSI natively.
 */
const esc = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;

export const c = {
  red: esc("31"),
  green: esc("32"),
  yellow: esc("33"),
  blue: esc("34"),
  magenta: esc("35"),
  cyan: esc("36"),
  white: esc("37"),
  gray: esc("90"),
  bold: esc("1"),
  dim: esc("2"),
};
