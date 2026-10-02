type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function LeaveRoomModal({ onCancel, onConfirm }: Props) {
  return (
    <div
      className="leave-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="leave-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-room-title"
      >
        <span className="leave-modal-mark">!</span>
        <p className="eyebrow">LEAVE THIS ROOM?</p>
        <h2 id="leave-room-title">Your score is safe.</h2>
        <p>
          You can come back later, but you will leave the current game and stop
          receiving round updates.
        </p>
        <div className="leave-modal-actions">
          <button className="button outline" type="button" onClick={onCancel}>
            STAY
          </button>
          <button className="button dark" type="button" onClick={onConfirm}>
            LEAVE ROOM <span>↗</span>
          </button>
        </div>
      </section>
    </div>
  );
}
