import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
            fontSize: 76,
            fontWeight: 400,
            fontStyle: "normal",
            fontFamily: "Lora",
          }}
        >
          Jen
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Lora", data: fontData, weight: 400, style: "normal" }],
    },
  );
}
