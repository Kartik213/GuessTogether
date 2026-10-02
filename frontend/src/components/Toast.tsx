type Props = { message: string; onDismiss: () => void };

export function Toast({ message, onDismiss }: Props) {
  return (
    <div className="toast" role="status">
      {message}
      <button aria-label="Dismiss notification" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
