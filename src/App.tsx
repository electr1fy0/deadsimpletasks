import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

interface Task {
  id: number;
  title: string;
  created_at: string;
  email: string;
}

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<"landing" | "login" | "signup">("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error.message);
      return;
    }
    setTasks(data ?? []);
  }

  useEffect(() => {
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

    setIsLoading(true);

    if (view === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setIsLoading(false);
      if (error) {
        console.error(error.message);
        return;
      }
      setSignupMessage("Check your email to verify");
    } else {
      setSignupMessage(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setIsLoading(false);
      if (error) {
        console.error(error.message);
        return;
      }
    }
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

  async function handleDelete(id: number) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error(error.message);
      return;
    }
    fetchTasks();
  }

  async function handleUpdate(id: number, newTitle: string) {
    if (!newTitle.trim()) {
      setEditingId(null);
      return;
    }
    const { error } = await supabase
      .from("tasks")
      .update({ title: newTitle.trim() })
      .eq("id", id);
    if (error) {
      console.error(error.message);
      return;
    }
    setEditingId(null);
    fetchTasks();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (!session && view === "landing") {
    return (
      <div className="landing-page">
        <header className="landing-header">
          <div className="logo-mark"></div>
          <button
            className="header-login-btn"
            onClick={() => setView("login")}
          >
            Login
          </button>
        </header>

        <main className="landing-main">
          <section className="landing-hero">
            <h1 className="hero-title">
              Dead Simple Tasks
            </h1>
            <p className="hero-subtitle">
              A minimalist task manager for your focused work. No clutter, no distractions, just your tasks waiting patiently.
            </p>
          </section>

          <section className="landing-section">
            <h2 className="section-title">About</h2>
            <p className="section-text">
              In a world of overwhelming productivity apps, Dead Simple Tasks is your quiet corner. Add tasks, check them off, and move on. No algorithms deciding what matters. Just your tasks, waiting patiently until you need them again.
            </p>
          </section>

          <section className="landing-section">
            <h2 className="section-title">Join</h2>
            <p className="section-text">
              Create an account to start organizing your tasks.{" "}
              <button
                className="inline-link"
                onClick={() => setView("signup")}
              >
                Sign up here
              </button>{" "}
              to get started.
            </p>
          </section>
        </main>

        <footer className="landing-footer">
          <span className="footer-version">v0.3</span>
          <span className="footer-credit">
            Built by <a href="https://github.com/electr1fy0" target="_blank" rel="noopener noreferrer">Ayush</a>
          </span>
        </footer>
      </div>
    );
  }

  if (!session && (view === "login" || view === "signup")) {
    return (
      <div className="landing-page">
        <header className="landing-header">
          <div className="logo-mark"></div>
          <button
            className="header-login-btn"
            onClick={() => {
              setView(view === "login" ? "signup" : "login");
              setSignupMessage(null);
            }}
          >
            {view === "login" ? "Sign up" : "Login"}
          </button>
        </header>

        <main className="landing-main">
          <div className="auth-area">
            <div className="auth-header">
              <h1>{view === "signup" ? "Create an account" : "Welcome back"}</h1>
              <p className="auth-helper">
                {view === "signup"
                  ? "Enter your details to start organizing your tasks."
                  : "Enter your credentials to access your tasks."}
              </p>
            </div>
            <input
              type="email"
              value={email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleAuth}
            />
            <button
              onClick={handleAuth}
              className={`auth-submit-btn ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
              style={
                view === "signup" && signupMessage
                  ? { backgroundColor: "#3C3C3C", color: "#777777" }
                  : undefined
              }
            >
              {isLoading && <span className="btn-spinner"></span>}
              {!isLoading && view === "login" && "Sign in"}
              {!isLoading && view === "signup" && (signupMessage || "Sign up")}
            </button>
            <button
              onClick={() => {
                setView(view === "signup" ? "login" : "signup");
                setSignupMessage(null);
              }}
              className="auth-switch-btn"
              disabled={isLoading}
            >
              {view === "signup" ? "Already have an account?" : "Don't have an account?"}
            </button>
          </div>
        </main>
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
            {tasks.map((task) => (
              <li
                key={task.id}
                className="task-li"
              >
                <div className="task-content">
                  <span
                    className="icon"
                    onClick={() => handleDelete(task.id)}
                  >
                    ✓
                  </span>
                  {editingId === task.id ? (
                    <input
                      type="text"
                      className="task-edit-input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUpdate(task.id, editingTitle);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      onBlur={() => handleUpdate(task.id, editingTitle)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="task-title"
                      onClick={() => {
                        setEditingId(task.id);
                        setEditingTitle(task.title);
                      }}
                    >
                      {task.title}
                    </span>
                  )}
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
