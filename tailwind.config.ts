import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#152239",
        muted: "#6d7890",
        canvas: "#f5f7fb",
        line: "#e9edf4",
        violet: "#6558e8",
      },
    },
  },
  plugins: [],
};

export default config;
