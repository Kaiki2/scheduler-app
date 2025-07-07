import EventForm from "./EventForm";
import "./modal.css"; // Adjust the path if needed

export default function EventModal({ onClose, onEventAdded }) {
  if (!onClose || !onEventAdded) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button
          style={{ float: "right", marginBottom: "1rem" }}
          onClick={onClose}
        >
          Close
        </button>
        <EventForm
          onAdd={() => {
            onClose();
            onEventAdded();
          }}
        />
      </div>
    </div>
  );
}
