import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#0C0E12",
          border: "1.5px solid #1E2230",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            fontFamily: "monospace",
            color: "#06D6A0",
            lineHeight: 1,
            marginTop: -1,
          }}
        >
          B
        </span>
      </div>
    ),
    { ...size }
  );
}
