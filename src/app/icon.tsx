import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
            fontSize: 18,
            fontWeight: 800,
            fontFamily: "Arial, sans-serif",
            letterSpacing: "-0.5px",
          }}
        >
          J
        </span>
      </div>
    ),
    { ...size },
  );
}
