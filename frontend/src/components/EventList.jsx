import { useEffect, useState } from "react";
import { fetchEvents, deleteEvent } from "../services/api";
import { getIdToken } from "../utils/auth";

export default function EventList() {
  const [events, setEvents] = useState([]);

  const loadEvents = async () => {
    const token = await getIdToken();
    const data = await fetchEvents(token);
    setEvents(data);
  };

  const handleDelete = async (id) => {
    const token = await getIdToken();
    await deleteEvent(id, token);
    loadEvents();
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <ul>
      {events.map((ev) => (
        <li key={ev.id}>
          <strong>{ev.title}</strong> ({ev.start} → {ev.end})
          <button onClick={() => handleDelete(ev.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
