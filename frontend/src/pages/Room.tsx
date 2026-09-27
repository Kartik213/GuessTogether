import { useParams } from "react-router-dom";

export function Room() {
  const { roomCode } = useParams();
  return <div>Room page: {roomCode}</div>;
}
