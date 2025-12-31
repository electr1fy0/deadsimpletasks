import { useState } from "react";

interface Task {
  id: number;
  title: string;
  createdAt: string;
}

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 32, title: "Finish the UI design", createdAt: "2025-07-16" },
    { id: 33, title: "Meow at the moon", createdAt: "In future" },
  ]);
  const [title, setTitle] = useState("");
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), title, createdAt: new Date().toISOString() },
    ]);
  }

  return (
    <div className="main-app">
      <div className="card">
        <form className="search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add task..."
          />
        </form>
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-li">
              <div className="task-content">
                <span className="icon">▢</span>
                <span className="task-title">{task.title}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
