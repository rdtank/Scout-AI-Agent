import "./App.css";
import { ActivityFeed } from "./components/ActivityFeed";
import { Answer } from "./components/Answer";
import { SearchForm } from "./components/SearchForm";
import { useAgentStream } from "./hooks/useAgentStream";

export default function App() {
  const { appState, events, answer, handleAction, formRef } = useAgentStream();

  return (
    <div className="scout-container">
      <header className="scout-header">
        <h1>Scout</h1>
        <p>Autonomous research agent — ask anything</p>
      </header>

      <main className="scout-main">
        <SearchForm ref={formRef} action={handleAction} />
        {events.length > 0 && (
          <ActivityFeed events={events} isRunning={appState === "running"} />
        )}
        {answer && <Answer text={answer} />}
      </main>
    </div>
  );
}
