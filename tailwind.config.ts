import type { Config } from "tailwindcss";

// RDOS-v14와 동일하게 class 기반 다크모드 + CSS 변수 토큰 사용
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--color-background-primary)",
          2: "var(--color-background-secondary)",
          3: "var(--color-background-tertiary)",
        },
        ink: {
          DEFAULT: "var(--color-text-primary)",
          2: "var(--color-text-secondary)",
          3: "var(--color-text-tertiary)",
        },
        line: {
          DEFAULT: "var(--color-border-tertiary)",
          2: "var(--color-border-secondary)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          soft: "var(--brand-soft)",
          ink: "var(--brand-ink)",
        },
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
      },
      borderRadius: { DEFAULT: "8px", lg: "12px" },
      fontFamily: {
        body: ["NanumGothic", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "sans-serif"],
        myeongjo: ["NanumMyeongjo", "Noto Serif KR", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
