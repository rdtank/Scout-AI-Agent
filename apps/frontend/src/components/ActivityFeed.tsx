import type { AgentEvent } from "../types";

function ActivityCard({ event }: { event: AgentEvent }) {
  if (event.type === "status") {
    const hasQuestions = !!event.data.subQuestions?.length;
    return (
      <div className={`activity-card card-status`}>
        <span className="activity-icon">{hasQuestions ? "📋" : "⚡"}</span>
        <div className="activity-content">
          <div className="activity-label">{event.data.message}</div>
          {hasQuestions && (
            <ul className="sub-questions">
              {event.data.subQuestions!.map((q, i) => (
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
      <div className="activity-card card-tool">
        <span className="activity-icon">🔍</span>
        <div className="activity-content">
          <div className="activity-label">
            <span className="step-badge">
              {event.data.step}/{event.data.total}
            </span>
            {event.data.subQuestion}
          </div>
        </div>
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div className="activity-card card-error">
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
      <div className="section-label">Research Activity</div>
      <div className="feed-cards">
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
    </div>
  );
}
