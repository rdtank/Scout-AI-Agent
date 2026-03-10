import type { AgentEvent } from "../types";

function ActivityCard({ event }: { event: AgentEvent }) {
  if (event.type === "status") {
    return (
      <div className="activity-card">
        <span className="activity-icon">
          {event.data.subQuestions ? "📋" : "⏳"}
        </span>
        <div className="activity-content">
          <div className="activity-label">{event.data.message}</div>
          {event.data.subQuestions && (
            <ul className="sub-questions">
              {event.data.subQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (event.type === "tool_result") {
    return (
      <div className="activity-card">
        <span className="activity-icon">🔍</span>
        <div className="activity-content">
          <div className="activity-label">
            <span className="step-badge">
              {event.data.step}/{event.data.total}
            </span>{" "}
            {event.data.subQuestion}
          </div>
        </div>
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div className="activity-card activity-error">
        <span className="activity-icon">⚠️</span>
        <div className="activity-content">
          <div className="activity-label">{event.data.message}</div>
        </div>
      </div>
    );
  }

  return null;
}

interface Props {
  events: AgentEvent[];
  isRunning: boolean;
}

export function ActivityFeed({ events, isRunning }: Props) {
  return (
    <div className="activity-feed">
      <div className="feed-label">Activity</div>
      {events.map((event, i) => (
        <ActivityCard key={i} event={event} />
      ))}
      {isRunning && (
        <div className="activity-pulse">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
