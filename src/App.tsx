import { useEffect, useState, useId } from "react";
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
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [error, setError] = useState<string | null>(null);




  const emailId = useId();
  const passwordId = useId();
  const taskInputId = useId();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchTasks(showLoading = false) {
    if (showLoading) setIsLoadingTasks(true);
    setError(null);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    setIsLoadingTasks(false);
    if (error) {
      setError("Failed to load tasks. Please try again.");
      console.error(error.message);
      return;
    }
    setTasks(data ?? []);
  }

  useEffect(() => {
    if (!session) return;
    fetchTasks(true);
  }, [session]);

  async function handleAuth(
    e?:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>
  ) {
    if (e && "key" in e && e.key !== "Enter") return;
    if (e) e.preventDefault();

    setIsLoading(true);
    setError(null);

    if (view === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setIsLoading(false);
      if (error) {
        setError(error.message);
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
        setError(error.message);
        return;
      }
    }
  }

  async function handleAddTask(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!session?.user.email || !title.trim()) return;

    const tempId = Date.now();
    const newTask: Task = {
      id: tempId,
      title: title.trim(),
      created_at: new Date().toISOString(),
      email: session.user.email,
    };

    setTasks((prev) => [...prev, newTask]);
    setTitle("");
    setError(null);

    const { error } = await supabase.from("tasks").insert({
      title: newTask.title,
      created_at: newTask.created_at,
      email: newTask.email,
    });

    if (error) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      setError("Failed to add task. Please try again.");
      console.error(error.message);
      return;
    }

    fetchTasks();
  }

  async function handleDelete(id: number) {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setError(null);

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setTasks(previousTasks);
      setError("Failed to complete task. Please try again.");
      console.error(error.message);
    }
  }

  async function handleUpdate(id: number, newTitle: string) {
    const trimmedTitle = newTitle.trim();
    const originalTask = tasks.find((t) => t.id === id);

    if (!trimmedTitle || (originalTask && trimmedTitle === originalTask.title)) {
      setEditingId(null);
      return;
    }

    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: trimmedTitle } : t))
    );
    setEditingId(null);
    setError(null);

    const { error } = await supabase
      .from("tasks")
      .update({ title: trimmedTitle })
      .eq("id", id);

    if (error) {
      setTasks(previousTasks);
      setError("Failed to update task. Please try again.");
      console.error(error.message);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      console.error("Sign out error:", error.message);
    }
  }


  if (!session && view === "landing") {
    return (
      <div className="landing-page">
        <header className="landing-header">
          <div className="logo-mark" aria-hidden="true"></div>
          <button className="header-login-btn" onClick={() => setView("login")}>
            Login
          </button>
        </header>

        <main className="landing-main">
          <section className="landing-hero">
            <h1 className="hero-title">Dead Simple Tasks</h1>
            <p className="hero-subtitle">
              A minimalist task manager for your focused work. No clutter, no
              distractions, just your tasks waiting patiently.
            </p>
          </section>

          <section className="landing-section">
            <h2 className="section-title">About</h2>
            <p className="section-text">
              In a world of overwhelming productivity apps, Dead Simple Tasks is
              your quiet corner. Add tasks, check them off, and move on. No
              algorithms deciding what matters. Just your tasks, waiting
              patiently until you need them again.
            </p>
          </section>

          <section className="landing-section">
            <h2 className="section-title">Join</h2>
            <p className="section-text">
              Create an account to start organizing your tasks.{" "}
              <button className="inline-link" onClick={() => setView("signup")}>
                Sign up here
              </button>{" "}
              to get started.
            </p>
          </section>
        </main>

        <footer className="landing-footer">
          <span className="footer-version">v0.3</span>
          <span className="footer-credit">
            Built by{" "}
            <a
              href="https://github.com/electr1fy0"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ayush
            </a>
          </span>
        </footer>
      </div>
    );
  }


  if (!session && (view === "login" || view === "signup")) {
    return (
      <div className="landing-page">
        <header className="landing-header">
          <div className="logo-mark" aria-hidden="true"></div>
          <button
            className="header-login-btn"
            onClick={() => {
              setView(view === "login" ? "signup" : "login");
              setSignupMessage(null);
              setError(null);
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

            <div className="input-wrapper">
              <label htmlFor={emailId} className="sr-only">
                Email address
              </label>
              <input
                id={emailId}
                type="email"
                name="email"
                value={email}
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                spellCheck={false}
                aria-describedby={error ? "auth-error" : undefined}
              />
            </div>

            <div className="input-wrapper">
              <label htmlFor={passwordId} className="sr-only">
                Password
              </label>
              <input
                id={passwordId}
                type="password"
                name="password"
                value={password}
                placeholder={
                  view === "signup" ? "Create a password" : "Password"
                }
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleAuth}
                autoComplete={
                  view === "signup" ? "new-password" : "current-password"
                }
                aria-describedby={error ? "auth-error" : undefined}
              />
            </div>

            {error && (
              <p id="auth-error" className="error-message" role="alert">
                {error}
              </p>
            )}

            <div aria-live="polite" aria-atomic="true">
              {signupMessage && (
                <p className="auth-helper" style={{ color: "#22c55e" }}>
                  {signupMessage}
                </p>
              )}
            </div>

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
              {isLoading && <span className="btn-spinner" aria-hidden="true"></span>}
              {!isLoading && view === "login" && "Sign in"}
              {!isLoading && view === "signup" && (signupMessage || "Sign up")}
            </button>

            <button
              onClick={() => {
                setView(view === "signup" ? "login" : "signup");
                setSignupMessage(null);
                setError(null);
              }}
              className="auth-switch-btn"
              disabled={isLoading}
            >
              {view === "signup"
                ? "Already have an account?"
                : "Don't have an account?"}
            </button>
          </div>
        </main>
      </div>
    );
  }


  return (
    <>
      <button
        onClick={handleSignOut}
        className="signout-btn"
        aria-label="Sign out"
      >
        sign out
      </button>

      <div className="main-app">
        <div className="heading">
          <h1>Dead Simple Tasks</h1>
          <h5>Tasks without the noise.</h5>
        </div>

        <div className="card">
          <div className="search-form">
            <label htmlFor={taskInputId} className="sr-only">
              Add a new task
            </label>
            <input
              id={taskInputId}
              type="text"
              name="task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleAddTask}
              placeholder="Add task"
              aria-describedby={error ? "task-error" : undefined}
            />
          </div>

          {error && (
            <p id="task-error" className="error-message" role="alert">
              {error}
            </p>
          )}

          {isLoadingTasks ? (
            <div className="task-list" aria-label="Loading tasks">
              <div className="skeleton skeleton-task"></div>
              <div className="skeleton skeleton-task"></div>
              <div className="skeleton skeleton-task"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet</p>
              <span>Press Enter after typing to add one</span>
            </div>
          ) : (
            <ul className="task-list" aria-label="Task list">
              {tasks.map((task) => (
                <li key={task.id} className="task-li">
                  <div className="task-content">
                    <button
                      className="complete-btn"
                      onClick={() => handleDelete(task.id)}
                      aria-label={`Complete task: ${task.title}`}
                    >
                      ✓
                    </button>
                    {editingId === task.id ? (
                      <>
                        <label
                          htmlFor={`edit-${task.id}`}
                          className="sr-only"
                        >
                          Edit task
                        </label>
                        <input
                          id={`edit-${task.id}`}
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
                      </>
                    ) : (
                      <span
                        className="task-title"
                        onClick={() => {
                          setEditingId(task.id);
                          setEditingTitle(task.title);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setEditingId(task.id);
                            setEditingTitle(task.title);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Edit task: ${task.title}`}
                      >
                        {task.title}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </>
  );
};

export default App;
