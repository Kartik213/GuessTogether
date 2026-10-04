export type GamePhase = "lobby" | "active" | "results" | "over";

export type Question = {
  id: string;
  question: string;
  answer: number;
  unit: string;
};

export type PublicQuestion = Pick<Question, "id" | "question" | "unit">;

export type PlayerSnapshot = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  submitted: boolean;
  guess?: number;
  roundScore?: number;
};

export type RoomSnapshot = {
  code: string;
  phase: GamePhase;
  hostId: string;
  round: number;
  roundEndsAt?: number;
  question?: PublicQuestion;
  answer?: number;
  players: PlayerSnapshot[];
};

export type ClientAction =
  | { type: "start" }
  | { type: "guess"; guess: string }
  | { type: "next" }
  | { type: "replay" }
  | { type: "leave" };

export type ServerMessage =
  | { type: "state"; state: RoomSnapshot }
  | { type: "error"; message: string };

export type Player = {
  id: string;
  name: string;
  score: number;
  guess?: number;
  roundScore?: number;
};

export type RoomState = {
  code: string;
  phase: RoomSnapshot["phase"];
  players: Player[];
  hostId: string;
  round: number;
  questions: Question[];
  endsAt?: number;
  hostGraceEndsAt?: number;
  emptyRoomEndsAt?: number;
};

export type SocketAttachment = { playerId: string };