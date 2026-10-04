import {
  HOST_RECONNECT_GRACE_MS,
  EMPTY_ROOM_CLEANUP_DELAY_MS,
  MAX_PLAYERS,
  MAX_GUESS,
  MAX_PLAYER_NAME_LENGTH,
  MAX_ROUND_SCORE,
  MIN_GUESS,
  MIN_PLAYER_NAME_LENGTH,
  REPLACED_SOCKET_CLOSE_CODE,
  ROUND_DURATION_MS,
  TOTAL_ROUNDS,
} from "../../shared/constants";
import type {
  ClientAction,
  RoomState,
  SocketAttachment,
  Player,
  RoomSnapshot,
} from "../../shared/game";
import { json } from "./http";
import { QUESTIONS } from "./questions";

export class RoomDO {
  private room: RoomState | null = null;

  constructor(private readonly state: DurableObjectState) {
    state.blockConcurrencyWhile(async () => {
      this.room = (await state.storage.get<RoomState>("room")) ?? null;
      if (!this.room) return;
      if (
        this.room.players.length === 0 &&
        this.room.emptyRoomEndsAt &&
        this.room.emptyRoomEndsAt <= Date.now()
      ) {
        await this.deleteRoom();
        return;
      }
      if (
        this.room.phase === "active" &&
        (this.room.endsAt ?? 0) <= Date.now()
      ) {
        await this.finishRound();
      } else {
        await this.scheduleAlarm();
      }
    });
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === "/init" && request.method === "POST")
      return this.initialize(request);
    if (url.pathname === "/state")
      return this.room
        ? json(this.snapshot())
        : json({ error: "Room not found" }, 404);
    if (url.pathname === "/ws") return this.connect(url);
    return json({ error: "Not found" }, 404);
  }

  async alarm() {
    const room = this.room;
    if (!room) return;
    if (
      room.players.length === 0 &&
      room.emptyRoomEndsAt &&
      room.emptyRoomEndsAt <= Date.now()
    ) {
      await this.deleteRoom();
      return;
    }
    if (room.phase === "active" && (room.endsAt ?? 0) <= Date.now()) {
      await this.finishRound();
      return;
    }
    if (room.hostGraceEndsAt && room.hostGraceEndsAt <= Date.now()) {
      delete room.hostGraceEndsAt;
      this.migrateHostIfNeeded(this.connectedPlayerIds());
      await this.persist();
      return;
    }
    await this.scheduleAlarm();
  }

  async webSocketMessage(webSocket: WebSocket, message: string | ArrayBuffer) {
    const playerId = this.attachment(webSocket)?.playerId;
    try {
      const action = JSON.parse(
        typeof message === "string" ? message : "",
      ) as ClientAction;
      await this.handleAction(playerId, action);
    } catch (error) {
      webSocket.send(
        JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Invalid message",
        }),
      );
    }
  }

  async webSocketClose(webSocket: WebSocket) {
    await this.handleDisconnect(webSocket);
  }

  async webSocketError(webSocket: WebSocket) {
    await this.handleDisconnect(webSocket);
  }

  private async initialize(request: Request) {
    if (this.room) return json({ created: false });
    const { code } = await request.json<{ code: string }>();
    this.room = {
      code,
      phase: "lobby",
      players: [],
      hostId: "",
      round: 0,
      questions: [],
    };
    await this.persist();
    return json({ created: true });
  }

  private async connect(url: URL) {
    if (!this.room) return json({ error: "Room not found" }, 404);

    const playerId = url.searchParams.get("playerId") ?? "";
    const playerName = (url.searchParams.get("name") ?? "").trim();
    if (!playerId) return json({ error: "Player id required" }, 400);
    if (
      playerName.length < MIN_PLAYER_NAME_LENGTH ||
      playerName.length > MAX_PLAYER_NAME_LENGTH
    )
      return json({ error: "Player name must be 2–20 characters" }, 400);

    let player = this.room.players.find(
      (candidate) => candidate.id === playerId,
    );
    const duplicateName = this.room.players.some(
      (candidate) =>
        candidate.id !== playerId &&
        this.normalizedName(candidate.name) === this.normalizedName(playerName),
    );
    if (duplicateName)
      return json({ error: "That name is already taken in this room" }, 409);

    if (!player) {
      if (this.room.phase !== "lobby")
        return json({ error: "Game already started" }, 409);
      if (this.room.players.length >= MAX_PLAYERS)
        return json({ error: "Room is full" }, 409);
      player = { id: playerId, name: playerName, score: 0 };
      this.room.players.push(player);
      if (!this.room.hostId) this.room.hostId = playerId;
    } else {
      player.name = playerName;
    }

    delete this.room.emptyRoomEndsAt;
    this.closeExistingPlayerSocket(playerId);
    const pair = new WebSocketPair();
    this.state.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({
      playerId,
    } satisfies SocketAttachment);
    if (playerId === this.room.hostId) delete this.room.hostGraceEndsAt;
    await this.persist();
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  private async handleAction(
    playerId: string | undefined,
    action: ClientAction,
  ) {
    const room = this.requireRoom();
    const player = room.players.find((candidate) => candidate.id === playerId);
    if (!player) throw new Error("Player is not in this room");

    switch (action.type) {
      case "start":
        this.requireHost(player);
        if (room.phase !== "lobby") throw new Error("Game already started");
        room.questions = this.pickQuestions();
        room.round = 0;
        room.players.forEach((candidate) => this.resetPlayer(candidate));
        await this.beginRound();
        break;
      case "guess":
        await this.submitGuess(player, action.guess);
        break;
      case "next":
        this.requireHost(player);
        if (room.phase !== "results") throw new Error("Results are not ready");
        if (room.round === TOTAL_ROUNDS - 1) room.phase = "over";
        else {
          room.round += 1;
          await this.beginRound();
        }
        break;
      case "replay":
        this.requireHost(player);
        if (room.phase !== "over") throw new Error("Game is not over");
        room.phase = "lobby";
        room.round = 0;
        room.questions = [];
        room.players.forEach((candidate) => this.resetPlayer(candidate));
        break;
      case "leave":
        await this.leaveRoom(player);
        break;
      default:
        throw new Error("Unknown action");
    }

    await this.persist();
  }

  private async submitGuess(player: Player, rawGuess: string) {
    const room = this.requireRoom();
    if (room.phase !== "active") throw new Error("This round is closed");
    if (player.guess !== undefined) throw new Error("Guess already submitted");

    const guess = Number(rawGuess);
    if (
      !rawGuess.trim() ||
      !Number.isFinite(guess) ||
      guess < MIN_GUESS ||
      guess > MAX_GUESS
    ) {
      throw new Error("Enter a valid number");
    }
    player.guess = guess;
    if (room.players.every((candidate) => candidate.guess !== undefined))
      await this.finishRound();
  }

  private async leaveRoom(player: Player) {
    const room = this.requireRoom();
    const wasHost = room.hostId === player.id;
    room.players = room.players.filter(
      (candidate) => candidate.id !== player.id,
    );

    if (room.players.length === 0) {
      room.hostId = "";
      room.phase = "lobby";
      room.round = 0;
      room.questions = [];
      delete room.endsAt;
      delete room.hostGraceEndsAt;
      room.emptyRoomEndsAt = Date.now() + EMPTY_ROOM_CLEANUP_DELAY_MS;
      return;
    }

    if (wasHost) {
      const connectedIds = this.connectedPlayerIds();
      const nextHost = room.players.find((candidate) =>
        connectedIds.has(candidate.id),
      );
      room.hostId = nextHost?.id ?? room.players[0].id;
      delete room.hostGraceEndsAt;
    }

    if (
      room.phase === "active" &&
      room.players.every((candidate) => candidate.guess !== undefined)
    ) {
      await this.finishRound();
    }
  }

  private async beginRound() {
    const room = this.requireRoom();
    room.phase = "active";
    room.players.forEach((player) => {
      delete player.guess;
      delete player.roundScore;
    });
    room.endsAt = Date.now() + ROUND_DURATION_MS;
  }

  private async finishRound() {
    const room = this.room;
    if (!room || room.phase !== "active") return;

    const answer = room.questions[room.round].answer;
    const submittedGuesses = room.players
      .map((player) => player.guess)
      .filter((guess): guess is number => guess !== undefined);
    const bestDistance = submittedGuesses.length
      ? Math.min(
          ...submittedGuesses.map((guess) => Math.abs(guess - answer)),
        )
      : undefined;
    for (const player of room.players) {
      const playerDistance =
        player.guess === undefined
          ? undefined
          : Math.abs(player.guess - answer);
      player.roundScore =
        playerDistance === undefined || bestDistance === undefined
          ? 0
          : playerDistance === bestDistance
            ? MAX_ROUND_SCORE
            : Math.min(
                MAX_ROUND_SCORE - 1,
                bestDistance === 0
                  ? 0
                  : Math.round(
                      (bestDistance / playerDistance) * MAX_ROUND_SCORE,
                    ),
              );
      player.score += player.roundScore;
    }
    delete room.endsAt;
    room.phase = "results";
    await this.persist();
  }

  private snapshot(): RoomSnapshot {
    const room = this.requireRoom();
    const connectedPlayerIds = new Set(
      this.sockets().map((socket) => this.attachment(socket)?.playerId),
    );
    const question = room.questions[room.round];
    return {
      code: room.code,
      phase: room.phase,
      hostId: room.hostId,
      round: room.round,
      roundEndsAt: room.phase === "active" ? room.endsAt : undefined,
      question:
        room.phase === "lobby" || room.phase === "over"
          ? undefined
          : {
              id: question.id,
              question: question.question,
              unit: question.unit,
            },
      answer: room.phase === "results" ? question.answer : undefined,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        connected: connectedPlayerIds.has(player.id),
        submitted: player.guess !== undefined,
        ...(room.phase === "results" || room.phase === "over"
          ? { guess: player.guess, roundScore: player.roundScore }
          : {}),
      })),
    };
  }

  private async persist() {
    await this.state.storage.put("room", this.room);
    await this.scheduleAlarm();
    const message = JSON.stringify({ type: "state", state: this.snapshot() });
    this.sockets().forEach((socket) => {
      try {
        socket.send(message);
      } catch {
        // closed socket
      }
    });
  }

  private handleDisconnect(webSocket: WebSocket) {
    const playerId = this.attachment(webSocket)?.playerId;
    if (!playerId) return Promise.resolve();
    const remainingPlayerIds = this.connectedPlayerIds(webSocket);
    if (remainingPlayerIds.has(playerId)) return Promise.resolve();
    if (this.requireRoom().hostId === playerId) {
      this.requireRoom().hostGraceEndsAt = Date.now() + HOST_RECONNECT_GRACE_MS;
    }
    return this.persist();
  }

  private async scheduleAlarm() {
    const room = this.requireRoom();
    const alarmTimes = [
      room.phase === "active" ? room.endsAt : undefined,
      room.hostGraceEndsAt,
      room.emptyRoomEndsAt,
    ].filter((time): time is number => typeof time === "number");
    if (alarmTimes.length === 0) await this.state.storage.deleteAlarm();
    else await this.state.storage.setAlarm(Math.min(...alarmTimes));
  }

  private migrateHostIfNeeded(connectedIds: Set<string>) {
    const room = this.requireRoom();
    if (connectedIds.has(room.hostId)) return;
    const nextHost = room.players.find((player) => connectedIds.has(player.id));
    if (nextHost) room.hostId = nextHost.id;
  }

  private async deleteRoom() {
    this.room = null;
    await this.state.storage.delete("room");
    await this.state.storage.deleteAlarm();
    this.sockets().forEach((socket) => socket.close(1000, "Room expired"));
  }

  private closeExistingPlayerSocket(playerId: string) {
    this.sockets().forEach((socket) => {
      if (this.attachment(socket)?.playerId === playerId)
        socket.close(REPLACED_SOCKET_CLOSE_CODE, "Reconnected");
    });
  }

  private sockets() {
    return this.state.getWebSockets();
  }
  private connectedPlayerIds(exclude?: WebSocket) {
    return new Set(
      this.sockets()
        .filter((socket) => socket !== exclude)
        .map((socket) => this.attachment(socket)?.playerId)
        .filter((playerId): playerId is string => Boolean(playerId)),
    );
  }
  private attachment(socket: WebSocket) {
    return socket.deserializeAttachment() as SocketAttachment | undefined;
  }
  private requireRoom() {
    if (!this.room) throw new Error("Room not found");
    return this.room;
  }
  private requireHost(player: Player) {
    if (this.requireRoom().hostId !== player.id)
      throw new Error("Only the host can do that");
  }
  private resetPlayer(player: Player) {
    player.score = 0;
    delete player.guess;
    delete player.roundScore;
  }
  private normalizedName(name: string) {
    return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }
  private pickQuestions() {
    return [...QUESTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, TOTAL_ROUNDS);
  }
}
