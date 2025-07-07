import { useEffect, useState } from "react";
import { auth } from "../firebase";
import EditEventModal from "./EditEventModal";
import "./DayGroupedList.css"

function parseRRule(rrule) {
  if (!rrule) return null;
  const parts = rrule.split(";").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key] = value;
    return acc;
  }, {});

  let desc = `Repeats every ${parts.INTERVAL || 1} `;
  switch (parts.FREQ) {
    case "DAILY":
      desc += "day(s)";
      break;
    case "WEEKLY":
      desc += "week(s)";
      if (parts.BYDAY) desc += ` on ${parts.BYDAY}`;
      break;
    case "MONTHLY":
      desc += "month(s)";
      break;
    default:
      desc += parts.FREQ?.toLowerCase();
  }

  if (parts.COUNT) desc += ` for ${parts.COUNT} time(s)`;
  if (parts.UNTIL) {
    const untilDate = new Date(
      parts.UNTIL.replace(/T.*/, "").replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
    );
    desc += ` until ${untilDate.toDateString()}`;
  }

  return desc;
}

export default function DayGroupedList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchEvents = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const grouped = data.reduce((acc, event) => {
        const day = new Date(event.start).toDateString();
        if (!acc[day]) acc[day] = [];
        acc[day].push(event);
        return acc;
      }, {});
      setEvents(grouped);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (event) => {
    const token = await auth.currentUser.getIdToken();
    let url = `${import.meta.env.VITE_API_BASE}/api/events/${event.id}`;
    let method = "DELETE";

    if (event.isRecurringInstance && event.originalId) {
      const dateStr = event.start.split("T")[0];
      url = `${import.meta.env.VITE_API_BASE}/api/events/${event.originalId}/override?date=${dateStr}`;
    }

    await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setConfirmingId(null);
    fetchEvents();
  };

  if (loading) return <p>Loading events...</p>;
  if (!Object.keys(events).length) return <p>No Events Found</p>;

  const sortedDayGroups = Object.entries(events).sort(
    ([dayA], [dayB]) => new Date(dayA) - new Date(dayB)
  );

  return (
    <div className="event-list">
      {sortedDayGroups.map(([day, dayEvents]) => (
        <div key={day} className="day-group">
          <h3>{day}</h3>
          <ul>
            {dayEvents.map((e) => (
              <li key={e.id} className="event-item">
                <strong>{e.title}</strong> (
                {new Date(e.start).toLocaleTimeString()} -{" "}
                {new Date(e.end).toLocaleTimeString()})
                {e.recurrence && (
                  <div className="recurring-tag">
                    <em>{parseRRule(e.recurrence)}</em>
                  </div>
                )}
                {e.description && <div>{e.description}</div>}
                <div className="event-item-buttons">
                  <button onClick={() => setEditingEvent(e)}>Edit</button>{" "}
                  {confirmingId === e.id ? (
                    <button className="delete-confirm" onClick={() => handleDelete(e)}>
                      Delete this Event?
                    </button>
                  ) : (
                    <button onClick={() => setConfirmingId(e.id)}>Delete</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => {
            setEditingEvent(null);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
