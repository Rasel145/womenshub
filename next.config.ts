import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // Not a full Content-Security-Policy yet, only the safe parts that cannot break pages
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  // Only for the live site. Browsers ignore it on plain http (localhost).
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const noStore = [{ key: "Cache-Control", value: "no-store" }];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },


    poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Pages with private data should never be kept in a shared cache
      { source: "/admin/:path*", headers: noStore },
      { source: "/account/:path*", headers: noStore },
      { source: "/api/admin/:path*", headers: noStore },
    ];
  },
    serverExternalPackages: ["exceljs"],
};

// Only for testing the dev server from a phone through a tunnel. Never applied on the live site.
if (process.env.NODE_ENV !== "production") {
  // Hostnames that may open the dev server (no port)
  nextConfig.allowedDevOrigins = [
    "192.168.31.35", // your computer on the home network
    "*.devtunnels.ms",
    "*.*.devtunnels.ms",
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.loca.lt",
  ];

  // Origins (with port) that may send Server Actions. VS Code Dev Tunnels rewrites the
  // Origin header to "localhost:3000", so that value has to be listed too.
  nextConfig.experimental = {
    ...nextConfig.experimental,
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "192.168.31.35:3000",
        "*.devtunnels.ms",
        "*.*.devtunnels.ms",
        "*.trycloudflare.com",
        "*.ngrok-free.app",
        "*.ngrok-free.dev",
        "*.ngrok.io",
        "*.loca.lt",
      ],
    },
  };
}
export default nextConfig;
