import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getRoom } from "../api/rooms";
import { AppShell } from "../components/AppShell";
import { FinalScreen } from "../components/FinalScreen";
import { JoinRoomScreen } from "../components/JoinRoomScreen";
import { LobbyScreen } from "../components/LobbyScreen";
import { ResultsScreen } from "../components/ResultsScreen";
import { RoundScreen } from "../components/RoundScreen";
import { RejoiningScreen } from "../components/RejoiningScreen";
import { Toast } from "../components/Toast";
import { LeaveRoomModal } from "../components/LeaveRoomModal";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { useRoundTimer } from "../hooks/useRoundTimer";
import { useGameStore } from "../store";
import type { ClientAction, RoomSnapshot } from "../types/game";

export function Room() {
  const { roomCode: routeRoomCode } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const playerId = useGameStore((state) => state.playerId);
  const playerName = useGameStore((state) => state.playerName);
  const setName = useGameStore((state) => state.setName);
  const storedRoomCode = useGameStore((state) => state.roomCode);
  const connectionStatus = useGameStore((state) => state.connectionStatus);
  const hasSubmitted = useGameStore((state) => state.hasSubmitted);
  const setRoom = useGameStore((state) => state.setRoom);
  const setConnection = useGameStore((state) => state.setConnection);
  const setSubmitted = useGameStore((state) => state.setSubmitted);
  const [room, setLiveRoom] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState("");
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const activeRoomCode = routeRoomCode?.match(/^[A-HJ-NP-Z2-9]{5}$/i)
    ? routeRoomCode.toUpperCase()
    : null;
  const hasPlayerName = playerName.trim().length >= 2;
  const roomQuery = useQuery({
    queryKey: ["room", activeRoomCode],
    queryFn: () => getRoom(activeRoomCode!),
    enabled: Boolean(activeRoomCode) && hasPlayerName,
    retry: false,
    staleTime: Infinity,
  });
  const currentRoom = room ?? roomQuery.data ?? null;

  useEffect(() => {
    if (activeRoomCode && activeRoomCode !== storedRoomCode)
      setRoom(activeRoomCode);
  }, [activeRoomCode, storedRoomCode, setRoom]);
  const handleState = useCallback(
    (nextRoom: RoomSnapshot) => {
      setLiveRoom(nextRoom);
      setError("");
      setSubmitted(
        nextRoom.phase === "active" &&
          (nextRoom.players.find((player) => player.id === playerId)
            ?.submitted ??
            false),
      );
      queryClient.setQueryData(["room", nextRoom.code], nextRoom);
    }, [playerId, queryClient, setSubmitted]);
  const { send } = useRoomSocket({
    roomCode: roomQuery.isError || !hasPlayerName ? null : activeRoomCode,
    playerId,
    playerName,
    onState: handleState,
    onError: setError,
    onStatus: setConnection,
  });
  const seconds = useRoundTimer(
    currentRoom?.phase === "active" ? currentRoom.roundEndsAt : undefined,
  );
  const sendAction = (action: ClientAction) => {
    if (send(action)) setError("");
  };
  const requestLeave = () => setLeaveModalOpen(true);
  const leaveRoom = () => {
    setLeaveModalOpen(false);
    const score =
      currentRoom?.players.find((player) => player.id === playerId)?.score ?? 0;
    if (send({ type: "leave" })) {
      setLiveRoom(null);
      setRoom(null);
      navigate("/", { state: { leftScore: score } });
    }
  };
  const copyCode = async () => {
    if (!currentRoom) return;
    try {
      await navigator.clipboard.writeText(currentRoom.code);
      setError("Room code copied!");
      window.setTimeout(() => setError(""), 1800);
    } catch {
      setError(`Room code: ${currentRoom.code}`);
    }
  };

  if (!activeRoomCode) return <Navigate to="/" replace />;
  if (!hasPlayerName)
    return (
      <JoinRoomScreen
        roomCode={activeRoomCode}
        onJoin={(name) => setName(name)}
      />
    );
  if (!currentRoom && !roomQuery.isError)
    return <RejoiningScreen roomCode={activeRoomCode} />;
  if (!currentRoom) return <Navigate to="/" replace />;
  return (
    <AppShell
      room={currentRoom}
      playerName={playerName}
      connectionStatus={connectionStatus}
      onCopyCode={copyCode}
      onHome={requestLeave}
      onLeave={requestLeave}
    >
      {currentRoom.phase === "lobby" && (
        <LobbyScreen
          room={currentRoom}
          playerId={playerId}
          onCopyCode={copyCode}
          onStart={() => sendAction({ type: "start" })}
        />
      )}
      {currentRoom.phase === "active" && (
        <RoundScreen
          room={currentRoom}
          seconds={seconds}
          submitted={hasSubmitted}
          onSubmit={(guess) => sendAction({ type: "guess", guess })}
        />
      )}
      {currentRoom.phase === "results" && (
        <ResultsScreen
          room={currentRoom}
          playerId={playerId}
          onNext={() => sendAction({ type: "next" })}
        />
      )}
      {currentRoom.phase === "over" && (
        <FinalScreen
          room={currentRoom}
          playerId={playerId}
          onReplay={() => sendAction({ type: "replay" })}
          onHome={requestLeave}
        />
      )}
      {isLeaveModalOpen && (
        <LeaveRoomModal
          onCancel={() => setLeaveModalOpen(false)}
          onConfirm={leaveRoom}
        />
      )}
      {error && <Toast message={error} onDismiss={() => setError("")} />}
    </AppShell>
  );
}
