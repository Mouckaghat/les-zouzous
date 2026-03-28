import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Les Zouzous — Universal Family Translator",
    short_name: "Les Zouzous",
    description:
      "Your travel companion by Lobster Inc., under the Jura Technology umbrella.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030507",
    theme_color: "#109cff",
    lang: "en",
    categories: ["utilities", "productivity", "travel"],
    icons: [
      {
        src: "/blue_lobster.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/blue_lobster.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/blue_lobster.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
