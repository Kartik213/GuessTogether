import { json, roomCode } from "./http";
import { ROOM_CREATION_ATTEMPTS } from "./constants";
export { RoomDO } from "./room";

export interface Env {
  ROOMS: DurableObjectNamespace;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const roomMatch = url.pathname.match(
      /^\/api\/rooms\/([A-Z0-9]+)(?:\/(ws))?$/i,
    );

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      return createRoom(env);
    }
    if (!roomMatch)
      return url.pathname.startsWith("/api/")
        ? json({ error: "Not found" }, 404)
        : url.pathname.startsWith("/room/")
          ? env.ASSETS.fetch(new Request(new URL("/index.html", request.url)))
          : env.ASSETS.fetch(request);

    const roomCode = roomMatch[1].toUpperCase();
    const stub = env.ROOMS.get(env.ROOMS.idFromName(roomCode));
    if (roomMatch[2]) return forwardWebSocket(request, url, stub);
    if (request.method === "GET") return stub.fetch("https://room/state");
    return json({ error: "Method not allowed" }, 405);
  },
};

async function createRoom(env: Env) {
  for (let attempt = 0; attempt < ROOM_CREATION_ATTEMPTS; attempt += 1) {
    const code = roomCode();
    const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
    const response = await stub.fetch("https://room/init", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    if (
      response.ok &&
      ((await response.json()) as { created: boolean }).created
    )
      return json({ code });
  }
  return json({ error: "Could not create a room. Try again." }, 503);
}

function forwardWebSocket(request: Request, url: URL, stub: DurableObjectStub) {
  const playerId = url.searchParams.get("playerId") ?? "";
  const name = url.searchParams.get("name") ?? "";
  return stub.fetch(
    new Request(
      `https://room/ws?playerId=${encodeURIComponent(playerId)}&name=${encodeURIComponent(name)}`,
      request,
    ),
  );
}
