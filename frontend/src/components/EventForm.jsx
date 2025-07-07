import { useState } from "react";
import { auth } from "../firebase";
import "./modal.css";

export default function EventForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [freq, setFreq] = useState("DAILY");
  const [interval, setInterval] = useState(1);
  const [byWeekDay, setByWeekDay] = useState([]);
  const [endType, setEndType] = useState("until");
  const [count, setCount] = useState("");
  const [until, setUntil] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    let recurrence = null;
    if (isRecurring) {
      let rule = `FREQ=${freq};INTERVAL=${interval}`;
      if (freq === "WEEKLY" && byWeekDay.length > 0) {
        rule += `;BYDAY=${byWeekDay.join(",")}`;
      }
      if (endType === "count" && count) rule += `;COUNT=${count}`;
      else if (endType === "until" && until)
        rule += `;UNTIL=${until.replaceAll("-", "")}T235959Z`;

      recurrence = rule;
    }

    const token = await auth.currentUser.getIdToken();
    await fetch(`${import.meta.env.VITE_API_BASE}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        start,
        end,
        description,
        recurrence,
      }),
    });

    setTitle("");
    setStart("");
    setEnd("");
    setDescription("");
    setFreq("DAILY");
    setInterval(1);
    setByWeekDay([]);
    setCount("");
    setUntil("");
    setIsRecurring(false);
    onAdd();
  };

  const weekdays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <h2>Add Event</h2>
      <div className="toggle-row">
          <label htmlFor="recurring-toggle">Recurring:</label>
          <label className="switch">
            <input
              id="recurring-toggle"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
      </div>
      <label>
        Title:
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Start:
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
      </label>
      <label>
        End:
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
      </label>
      <label>
        Description:
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

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
              onChange={(e) => setInterval(e.target.value)}
            />
          </label>
          {freq === "WEEKLY" && (
              <div className="weekday-toggle-row">
                {weekdays.map((day) => (
                  <div key={day} className="weekday-toggle">
                    <label>{day}</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        value={day}
                        checked={byWeekDay.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setByWeekDay((prev) => [...prev, day]);
                          } else {
                            setByWeekDay((prev) => prev.filter((d) => d !== day));
                          }
                        }}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                ))}
              </div>
          )}

          <label>
            End:
            <select value={endType} onChange={(e) => setEndType(e.target.value)}>
              <option value="until">Until</option>
              <option value="count">Count</option>
            </select>
          </label>
          {endType === "until" ? (
            <label>
              Until:
              <input
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
              />
            </label>
          ) : (
            <label>
              Count:
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </label>
          )}
        </>
      )}
      <button type="submit">Add Event</button>
    </form>
  );
}