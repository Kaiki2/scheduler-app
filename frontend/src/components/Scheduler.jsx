import SchedulerLayout from "./SchedulerLayout";
import EventModal from "../components/EventModal";
import DayGroupedList from "../components/DayGroupedList";
import './Scheduler.css';

export default function Scheduler() {
  return (
    <SchedulerLayout>
      {(view) => {
        return (
          <>
            <EventModal onEventAdded={() => window.location.reload()} />
            {view === "list" ? (
              <DayGroupedList />
            ) : (
              <div className="coming-soon-box">Coming Soon</div>
            )}
          </>
        );
      }}
    </SchedulerLayout>
  );
}
