import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { createRoom, getRoom, type CreateRoomResponse } from "../api/rooms";
import { HomeScreen } from "../components/HomeScreen";
import { LeaveSummaryScreen } from "../components/LeaveSummaryScreen";
import { useGameStore } from "../store";

type LocationState = { leftScore?: number } | null;

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const playerId = useGameStore((state) => state.playerId);
  const playerName = useGameStore((state) => state.playerName);
  const setName = useGameStore((state) => state.setName);
  const setRoom = useGameStore((state) => state.setRoom);
  const [error, setError] = useState("");
  const [leftScore, setLeftScore] = useState(
    (location.state as LocationState)?.leftScore ?? null,
  );
  const createMutation = useMutation<CreateRoomResponse, Error, void>({
    mutationFn: createRoom,
    onSuccess: ({ code }) => {
      setRoom(code);
      setError("");
      navigate(`/room/${code}`);
    },
    onError: (reason) =>
      setError(
        reason instanceof Error ? reason.message : "Could not create a room",
      ),
  });
  const validateName = (name: string) => {
    if (name.trim().length < 2 || name.trim().length > 20) {
      setError("Your name must be 2–20 characters.");
      return false;
    }
    return true;
  };
  const create = (name: string) => {
    if (!validateName(name)) return;
    setLeftScore(null);
    setName(name.trim());
    createMutation.mutate();
  };
  const join = async (name: string, code: string) => {
    if (!validateName(name)) return;
    const normalizedCode = code.trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{5}$/.test(normalizedCode)) {
      setError("Enter a valid five character room code.");
      return;
    }
    try {
      const room = await queryClient.fetchQuery({
        queryKey: ["room", normalizedCode],
        queryFn: () => getRoom(normalizedCode),
        staleTime: 0,
      });
      const normalizedName = name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
      if (
        room.players.some(
          (player) =>
            player.id !== playerId &&
            player.name.trim().replace(/\s+/g, " ").toLocaleLowerCase() ===
              normalizedName,
        )
      ) {
        setError("That name is already being used in this room.");
        return;
      }
      setName(name.trim());
      setRoom(normalizedCode);
      setError("");
      navigate(`/room/${normalizedCode}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not join that room.",
      );
    }
  };

  if (leftScore !== null) {
    return (
      <LeaveSummaryScreen
        score={leftScore}
        onHome={() => {
          setLeftScore(null);
          navigate("/", { replace: true, state: null });
        }}
      />
    );
  }
  return (
    <HomeScreen
      initialName={playerName}
      error={error}
      isCreating={createMutation.isPending}
      onCreate={create}
      onJoin={join}
    />
  );
}
