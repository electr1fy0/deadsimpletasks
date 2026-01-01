import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

interface Task {
  title: string;
  created_at: string;
  email: string;
}

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) {
        console.error(error.message);
        return;
      }
      setTasks(data ?? []);
    }
    if (!session) return;
    fetchTasks();
  }, [session]);

  async function handleAuth(
    e?:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>,
  ) {
    if (e && "key" in e && e.key !== "Enter") return;
    if (e) e.preventDefault();

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) console.error(error.message);
  }

  async function handleAddTask(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!session?.user.email || !title.trim()) return;

    const { error } = await supabase.from("tasks").insert({
      title,
      created_at: new Date().toISOString(),
      email: session.user.email,
    });

    if (error) {
      console.error(error.message);
      return;
    }

    setTitle("");
    fetchTasks();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <div className="main-app">
        <div className="auth-area">
          <h1>{isSignUp ? "sign up" : "log in"}</h1>
          <input
            type="email"
            value={email}
            placeholder="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            value={password}
            placeholder="password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleAuth}
          />
          <button onClick={handleAuth}>
            {isSignUp ? "sign up" : "log in"}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "log in" : "sign up"} instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button onClick={handleSignOut} className="signout-btn">
        sign out
      </button>
      <div className="main-app">
        <div className="heading">
          <h1>Dead Simple Tasks</h1>
          <h5>Tasks without the noise.</h5>
        </div>
        <div className="card">
          <div className="search-form">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleAddTask}
              placeholder="Add task..."
            />
          </div>
          <ul className="task-list">
            {tasks.map((task, idx) => (
              <li key={`${task.title}-${idx}`} className="task-li">
                <div className="task-content">
                  <span className="icon">✓</span>
                  <span className="task-title">{task.title}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default App;
