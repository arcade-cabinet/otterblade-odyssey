export default function PostFX() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[9]">
      {/* Vignette */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.7) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Chromatic Aberration */}
      <div
        className="absolute inset-[-2px] opacity-60 animate-[chromaShift_2.8s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle at 50% 45%, rgba(96,165,250,0.10) 0%, rgba(96,165,250,0.0) 65%), radial-gradient(circle at 50% 45%, rgba(251,113,133,0.10) 0%, rgba(251,113,133,0.0) 65%)`,
          filter: "blur(0.8px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Grain (subtle noise texture) */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          mixBlendMode: "overlay",
          backgroundImage:
            "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=)",
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
