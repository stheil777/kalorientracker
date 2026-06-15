import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JEN Kalorientracker",
    short_name: "JEN",
    description: "Dein persönlicher Kalorientracker",
    start_url: "/",
    display: "standalone",
    background_color: "#FDF7F0",
    theme_color: "#F06B5D",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
