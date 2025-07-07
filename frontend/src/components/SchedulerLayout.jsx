import { useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import EventModal from "../components/EventModal";

export default function SchedulerLayout({ children }) {
  const [view, setView] = useState("list");
  const [showEventModal, setShowEventModal] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <div className="scheduler-wrapper">
      <header className="scheduler-header">
        <div className="scheduler-view-selector">
          <label>View: </label>
          <select value={view} onChange={(e) => setView(e.target.value)}>
            <option value="calendar" disabled>
              Calendar View (TBA)
            </option>
            <option value="timeline" disabled>
              Timeline View (TBA)
            </option>
            <option value="list">List View</option>
          </select>

          <button className="scheduler-add-event" onClick={() => setShowEventModal(true)}>
            Add Event
          </button>
        </div>

        <div className="scheduler-user">
          {user && <span>{user.email.split("@")[0]}</span>}
          <button className="scheduler-logout" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      <main className="scheduler-main">
        {typeof children === "function" ? children(view) : children}
      </main>

      {showEventModal && (
        <EventModal
          onClose={() => setShowEventModal(false)}
          onEventAdded={() => {
            setShowEventModal(false);
            window.location.reload(); // or pass a callback instead
          }}
        />
      )}
    </div>
  );
}
