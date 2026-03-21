import "./App.css";
import { ActivityFeed } from "./components/ActivityFeed";
import { Answer } from "./components/Answer";
import { SearchForm } from "./components/SearchForm";
import { useAgentStream } from "./hooks/useAgentStream";

export default function App() {
  const { appState, events, answer, handleAction, formRef } = useAgentStream();

  const showResults = events.length > 0 || !!answer;

  return (
    <div className="scout-container">
      <header className="scout-header">
        <div className="scout-logo">
          <img
            src="/favicon.svg"
            alt="Scout logo"
            className="scout-logo-img"
          />
          <h1 className="scout-title">Scout</h1>
        </div>
        <p className="scout-subtitle">Autonomous research agent — ask anything</p>
      </header>

      <main>
        <SearchForm ref={formRef} action={handleAction} />

        {showResults && (
          <div className="scout-results">
            {events.length > 0 && (
              <ActivityFeed events={events} isRunning={appState === "running"} />
            )}
            {answer && <Answer text={answer} />}
          </div>
        )}
      </main>
    </div>
  );
}
