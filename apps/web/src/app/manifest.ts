import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Fabricante de Milhas",
    short_name: "Fabricante",
    description:
      "Organize pontos e milhas, acompanhe oportunidades e planeje suas viagens.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#000000",
    theme_color: "#101b2d",
    icons: [
      {
        src: "/logo.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/logo.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
