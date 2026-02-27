import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#0C0E12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 120,
            fontWeight: 900,
            fontFamily: "monospace",
            color: "#06D6A0",
            lineHeight: 1,
            marginTop: -4,
          }}
        >
          B
        </span>
      </div>
    ),
    { ...size }
  );
}
