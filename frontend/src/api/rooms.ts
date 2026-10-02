import type { RoomSnapshot } from "../types/game";

export type CreateRoomResponse = { code: string };

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? "Request failed");
  return data;
}

export async function createRoom(): Promise<CreateRoomResponse> {
  return readJson(await fetch("/api/rooms", { method: "POST" }));
}

export async function getRoom(code: string): Promise<RoomSnapshot> {
  return readJson(await fetch(`/api/rooms/${code}`));
}
