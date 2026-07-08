const DEFAULT_ORIGIN = "https://thc282.github.io";
const ALLOWED_ORIGINS = new Set([
  DEFAULT_ORIGIN,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8080",
  "http://127.0.0.1:8080"
]);
const LAMP_POST_PATTERN = /^[A-Z0-9_-]{1,32}$/;

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || DEFAULT_ORIGIN;
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function jsonResponse(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init.headers || {})
    }
  });
}

export default {
  async fetch(request) {
    const headers = corsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "GET") {
      return jsonResponse(
        { error: "Method not allowed" },
        { status: 405, headers }
      );
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/lp\/([^/]+)$/);

    if (!match) {
      return jsonResponse(
        { error: "Use /lp/{lampPostNumber}" },
        { status: 400, headers }
      );
    }

    let lampPostNumber;
    try {
      lampPostNumber = decodeURIComponent(match[1]).toUpperCase();
    } catch (error) {
      return jsonResponse(
        { error: "Invalid lamp post number" },
        { status: 400, headers }
      );
    }

    if (!LAMP_POST_PATTERN.test(lampPostNumber)) {
      return jsonResponse(
        { error: "Invalid lamp post number" },
        { status: 400, headers }
      );
    }

    const upstreamUrl = `https://www.map.gov.hk/gih-ws2/lp/${encodeURIComponent(lampPostNumber)}`;

    let upstream;
    try {
      upstream = await fetch(upstreamUrl, {
        headers: {
          "Accept": "application/json"
        }
      });
    } catch (error) {
      return jsonResponse(
        { error: "Unable to connect to lamp post service" },
        { status: 502, headers }
      );
    }

    if (!upstream.ok) {
      return jsonResponse(
        {
          error: "Lamp post service returned an error",
          status: upstream.status
        },
        { status: 502, headers }
      );
    }

    const body = await upstream.text();
    return new Response(body, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": upstream.headers.get("Content-Type") || "application/json;charset=UTF-8",
        "Cache-Control": "public, max-age=300"
      }
    });
  }
};
