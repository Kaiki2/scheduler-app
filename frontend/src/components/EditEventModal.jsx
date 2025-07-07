import { useEffect, useState } from "react";
import { auth } from "../firebase";
import "./modal.css";

export default function EditEventModal({ event, onClose, onSaved }) {
  if (!event || !event.id) return null;

  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [freq, setFreq] = useState("");
  const [interval, setInterval] = useState(1);
  const [count, setCount] = useState("");
  const [until, setUntil] = useState("");
  const [byWeekDay, setByWeekDay] = useState([]);

  useEffect(() => {
    setTitle(event.title || "");
    setStart(event.start || "");
    setEnd(event.end || "");
    setDescription(event.description || "");

    if (event.recurrence) {
      setIsRecurring(true);
      const parts = Object.fromEntries(
        event.recurrence.split(";").map((p) => p.split("="))
      );
      setFreq(parts.FREQ || "");
      setInterval(parseInt(parts.INTERVAL || 1));
      setCount(parts.COUNT || "");
      setUntil(parts.UNTIL ? parts.UNTIL.slice(0, 10) : "");
      setByWeekDay(parts.BYDAY ? parts.BYDAY.split(",") : []);
    } else {
      setIsRecurring(false);
      setFreq("");
      setInterval(1);
      setCount("");
      setUntil("");
      setByWeekDay([]);
    }
  }, [event]);

  const buildRRule = () => {
    if (!isRecurring || !freq) return null;
    let rrule = `FREQ=${freq};INTERVAL=${interval}`;
    if (freq === "WEEKLY" && byWeekDay.length) {
      rrule += `;BYDAY=${byWeekDay.join(",")}`;
    }
    if (count) rrule += `;COUNT=${count}`;
    if (until) rrule += `;UNTIL=${until.replace(/-/g, "")}T000000Z`;
    return rrule;
  };

  const handleSave = async () => {
    const token = await auth.currentUser.getIdToken();
    const body = JSON.stringify({
      title,
      start,
      end,
      description,
      recurrence: buildRRule(),
    });

    const url = event.isRecurringInstance
      ? `${import.meta.env.VITE_API_BASE}/api/events/${event.originalId}/override?date=${start.split("T")[0]}`
      : `${import.meta.env.VITE_API_BASE}/api/events/${event.id}`;

    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    onSaved();
  };

  const weekdays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>Close</button>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="event-form">
          <h2>Edit Event</h2>
          <label>
            Title:
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Start:
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </label>
          <label>
            End:
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </label>
          <label>
            Description:
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <div className="toggle-row">
            <span>Recurring:</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {isRecurring && (
            <>
              <label>
                Frequency:
                <select value={freq} onChange={(e) => setFreq(e.target.value)}>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>
              <label>
                Interval:
                <input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                />
              </label>

              {freq === "WEEKLY" && (
                <fieldset>
                  <legend>Days of Week</legend>
                  <div className="week-toggle-group">
                    {weekdays.map((day) => (
                      <label key={day} className="toggle-row">
                        {day}
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={byWeekDay.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setByWeekDay((prev) => [...prev, day]);
                              } else {
                                setByWeekDay((prev) =>
                                  prev.filter((d) => d !== day)
                                );
                              }
                            }}
                          />
                          <span className="slider"></span>
                        </label>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <label>
                Count (optional):
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </label>
              <label>
                Until (optional):
                <input
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
              </label>
            </>
          )}
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  );
}
