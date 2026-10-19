import type { Config } from "tailwindcss";
const config: Config = {
 darkMode:["class"],
 content:["./src/**/*.{js,ts,jsx,tsx,mdx}"],
 theme:{extend:{
  colors:{
   background:"hsl(var(--background))",foreground:"hsl(var(--foreground))",card:"hsl(var(--card))",
   border:"hsl(var(--border))",input:"hsl(var(--input))",
   primary:{DEFAULT:"hsl(var(--primary))",foreground:"hsl(var(--primary-foreground))"},
   secondary:{DEFAULT:"hsl(var(--secondary))",foreground:"hsl(var(--secondary-foreground))"},
   muted:{DEFAULT:"hsl(var(--muted))",foreground:"hsl(var(--muted-foreground))"},
   accent:{DEFAULT:"hsl(var(--accent))",foreground:"hsl(var(--accent-foreground))"},
   destructive:{DEFAULT:"hsl(var(--destructive))",foreground:"hsl(var(--destructive-foreground))"},
   ring:"hsl(var(--ring))",gold:{DEFAULT:"#c6a45c",foreground:"#101b2d"},navy:"#101b2d"
  },
  borderRadius:{lg:"var(--radius)",md:"calc(var(--radius) - 2px)",sm:"calc(var(--radius) - 4px)"},
  boxShadow:{panel:"0 2px 8px rgba(16,27,45,.025),0 1px 2px rgba(16,27,45,.02)"}
 }},
 plugins:[]
};
export default config;
