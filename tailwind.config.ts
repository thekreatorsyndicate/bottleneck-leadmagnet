import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101411",
        paper: "#f7f3ea",
        mist: "#e8ecdf",
        moss: "#526850",
        copper: "#b25d3d",
        brass: "#c49542",
        spruce: "#153f39",
        limewash: "#dfe7c6",
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-serif", "Georgia"],
      },
      boxShadow: {
        "soft-line": "0 1px 0 rgba(16, 20, 17, 0.08)",
        "lifted": "0 24px 80px rgba(21, 63, 57, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
