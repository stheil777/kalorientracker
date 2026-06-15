import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

async function loadLora() {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Lora:ital,wght@1,700&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then((r) => r.text());
  const url = css.match(/src: url\(([^)]+)\) format/)?.[1];
  if (!url) throw new Error("Lora font URL not found");
  return fetch(url).then((r) => r.arrayBuffer());
}

export default async function Icon() {
  const loraData = await loadLora();
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F06B5D",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: 700,
            fontStyle: "italic",
            fontFamily: "Lora",
          }}
        >
          j
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Lora", data: loraData, weight: 700, style: "italic" }],
    },
  );
}
