import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await readFile(
    path.join(process.cwd(), "public/fonts/Lora-Regular.woff2"),
  );
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
            fontWeight: 400,
            fontFamily: "Lora",
          }}
        >
          J
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Lora", data: fontData, weight: 400, style: "normal" }],
    },
  );
}
