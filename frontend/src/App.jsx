import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getStartOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isWithinRange = (date, rangeStart, rangeEnd) =>
  date.getTime() >= rangeStart.getTime() && date.getTime() < rangeEnd.getTime();

const toDateTimeLocalValue = (value) => {
  const date = new Date(value);
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

function WeekTodoPage({ weekOffset }) {
  const navigate = useNavigate();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDueAt, setNewTodoDueAt] = useState("");
  const [todos, setTodos] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Checking...");
  const [errorMessage, setErrorMessage] = useState("");

  const [editingDueTodoId, setEditingDueTodoId] = useState(null);
  const [editingDueAt, setEditingDueAt] = useState("");

  const sortByDueAt = (items) =>
    [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  const fetchTodos = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todos`);

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const data = await response.json();
      setTodos(sortByDueAt(data));
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load todos.");
    }
  }, []);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);

        if (!response.ok) {
          throw new Error("Health endpoint returned non-200");
        }

        setConnectionStatus("Connected");
        fetchTodos();
      } catch (error) {
        console.error(error);
        setConnectionStatus("Disconnected");
      }
    };

    checkBackendHealth();
  }, [fetchTodos]);

  const handleAddTodo = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!newTodoTitle.trim()) {
      setErrorMessage("Title cannot be empty.");
      return;
    }

    if (!newTodoDueAt) {
      setErrorMessage("Due time is required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTodoTitle.trim(),
          dueAt: newTodoDueAt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create todo.");
      }

      const createdTodo = await response.json();
      setTodos((prevTodos) => sortByDueAt([...prevTodos, createdTodo]));
      setNewTodoDueAt("");
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not create todo.");
    }

    setNewTodoTitle("");
  };

  const handleToggleTodo = async (todoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todos/${todoId}/toggle`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle todo.");
      }

      const updatedTodo = await response.json();
      setTodos((prevTodos) =>
        sortByDueAt(prevTodos.map((todo) => (todo.id === todoId ? updatedTodo : todo)))
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not update todo.");
    }
  };

  const handleDeleteTodo = async (todo) => {
    try {
      const latestTodosResponse = await fetch(`${API_BASE_URL}/api/todos`);

      if (!latestTodosResponse.ok) {
        throw new Error("Failed to fetch latest todos before delete.");
      }

      const latestTodos = await latestTodosResponse.json();
      const latestTodo = latestTodos.find((item) => item.id === todo.id);
      const isCompleted = latestTodo ? latestTodo.completed : todo.completed;

      if (!isCompleted) {
        const shouldDelete = window.confirm(
          "This task is not done yet. Are you sure you want to delete it?"
        );

        if (!shouldDelete) {
          return;
        }
      }

      const endpoint = isCompleted
        ? `${API_BASE_URL}/api/todos/${todo.id}`
        : `${API_BASE_URL}/api/todos/${todo.id}?force=true`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.status === 409) {
        const shouldDelete = window.confirm(
          "This task is not done yet. Are you sure you want to delete it?"
        );

        if (!shouldDelete) {
          return;
        }

        const forceDeleteResponse = await fetch(`${API_BASE_URL}/api/todos/${todo.id}?force=true`, {
          method: "DELETE",
        });

        if (!forceDeleteResponse.ok) {
          throw new Error("Failed to force delete todo.");
        }

        setTodos((prevTodos) => prevTodos.filter((item) => item.id !== todo.id));
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete todo.");
      }

      setTodos((prevTodos) => prevTodos.filter((item) => item.id !== todo.id));
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not delete todo.");
    }
  };

  const handleStartEditingDueDate = (todo) => {
    setEditingDueTodoId(todo.id);
    setEditingDueAt(toDateTimeLocalValue(todo.dueAt));
  };

  const handleSaveDueDate = async (todoId) => {
    if (!editingDueAt) {
      setErrorMessage("Please choose a new due date.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/todos/${todoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dueAt: editingDueAt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo due date.");
      }

      const updatedTodo = await response.json();
      setTodos((prevTodos) =>
        sortByDueAt(prevTodos.map((todo) => (todo.id === todoId ? updatedTodo : todo)))
      );
      setEditingDueTodoId(null);
      setEditingDueAt("");
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not update due date.");
    }
  };

  const formatDateTime = (value) => new Date(value).toLocaleString();
  const formatDayTitle = (value) =>
    new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(
      value
    );

  const nowTimestamp = Date.now();
  const currentWeekStart = getStartOfWeek(new Date(nowTimestamp));
  const viewedWeekStart = addDays(currentWeekStart, weekOffset * 7);
  const viewedWeekEnd = addDays(viewedWeekStart, 7);

  const overdueTodos = todos.filter(
    (todo) => !todo.completed && new Date(todo.dueAt).getTime() < nowTimestamp
  );

  const viewedWeekTodos = useMemo(() => {
    const overdueIds = new Set(overdueTodos.map((todo) => todo.id));

    return todos.filter((todo) => {
      const dueDate = new Date(todo.dueAt);
      const inViewedWeek = isWithinRange(dueDate, viewedWeekStart, viewedWeekEnd);

      if (!inViewedWeek) {
        return false;
      }

      if (weekOffset === 0 && overdueIds.has(todo.id)) {
        return false;
      }

      return true;
    });
  }, [overdueTodos, todos, viewedWeekEnd, viewedWeekStart, weekOffset]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, dayOffset) => {
        const dayDate = addDays(viewedWeekStart, dayOffset);
        const dayTodos = viewedWeekTodos.filter((todo) => {
          const dueDate = new Date(todo.dueAt);
          return (
            dueDate.getFullYear() === dayDate.getFullYear() &&
            dueDate.getMonth() === dayDate.getMonth() &&
            dueDate.getDate() === dayDate.getDate()
          );
        });

        return {
          date: dayDate,
          title: formatDayTitle(dayDate),
          todos: dayTodos,
        };
      }),
    [viewedWeekStart, viewedWeekTodos]
  );

  const viewedWeekLabel = `${formatDayTitle(viewedWeekStart)} - ${formatDayTitle(
    addDays(viewedWeekStart, 6)
  )}`;
  const hasAnyWeekTodos = days.some((day) => day.todos.length > 0);

  return (
    <main className="app">
      <h1>Todo Planner</h1>
      <p className="status">Backend: {connectionStatus}</p>
      {errorMessage ? <p className="error">{errorMessage}</p> : null}

      <form className="todo-form" onSubmit={handleAddTodo}>
        <input
          type="text"
          placeholder="Add a todo..."
          value={newTodoTitle}
          onChange={(event) => setNewTodoTitle(event.target.value)}
        />
        <input
          type="datetime-local"
          value={newTodoDueAt}
          onChange={(event) => setNewTodoDueAt(event.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {weekOffset === 0 ? (
        <section className="overdue-section">
          <h2>Overdue Tasks</h2>
          {overdueTodos.length === 0 ? <p className="empty">No overdue tasks.</p> : null}
          <div className="overdue-list">
            {overdueTodos.map((todo) => (
              <article className="overdue-item" key={todo.id}>
                <div className="overdue-main">
                  <label>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id)}
                    />
                    <span className={todo.completed ? "done" : ""}>{todo.title}</span>
                  </label>
                  <small>Due: {formatDateTime(todo.dueAt)}</small>
                </div>
                <div className="overdue-actions">
                  {editingDueTodoId === todo.id ? (
                    <>
                      <input
                        type="datetime-local"
                        value={editingDueAt}
                        onChange={(event) => setEditingDueAt(event.target.value)}
                      />
                      <button type="button" onClick={() => handleSaveDueDate(todo.id)}>
                        Save due time
                      </button>
                      <button type="button" onClick={() => setEditingDueTodoId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => handleStartEditingDueDate(todo)}>
                      Update due time
                    </button>
                  )}
                  <button className="delete-btn" type="button" onClick={() => handleDeleteTodo(todo)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="week-section">
        <div className="week-header">
          <h2>{weekOffset === 0 ? "Current Week" : `Week +${weekOffset}`}</h2>
          <p>{viewedWeekLabel}</p>
        </div>

        <div className="week-nav">
          {weekOffset > 0 ? (
            <button type="button" onClick={() => navigate(weekOffset === 1 ? "/" : `/weeks/${weekOffset - 1}`)}>
              Previous Week
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={() => navigate(`/weeks/${weekOffset + 1}`)}>
            Next Week
          </button>
        </div>

        <div className="week-cards">
          {!hasAnyWeekTodos ? <p className="empty week-empty">No tasks for this week.</p> : null}
          {days.map((day) =>
            day.todos.length > 0 ? (
              <article className="day-card" key={`day-${day.date.toISOString()}`}>
                <header className="day-card-header">
                  <h3>{day.title}</h3>
                  <span className="day-count">{day.todos.length} task(s)</span>
                </header>
                <div className="task-card-list">
                  {day.todos.map((todo) => (
                    <article className="task-card" key={todo.id}>
                      <div className="task-card-main">
                        <label className="task-check">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggleTodo(todo.id)}
                          />
                          <span className={todo.completed ? "done" : ""}>{todo.title}</span>
                        </label>
                        <small className="task-due">Due: {formatDateTime(todo.dueAt)}</small>
                      </div>
                      <div className="task-meta">
                        <span className={`task-status ${todo.completed ? "is-done" : "is-open"}`}>
                          {todo.completed ? "Done" : "Open"}
                        </span>
                        <button className="delete-btn" type="button" onClick={() => handleDeleteTodo(todo)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ) : null
          )}
        </div>
      </section>
    </main>
  );
}

function WeekTodoPageRoute() {
  const { weekOffset } = useParams();
  const parsedOffset = Number(weekOffset);

  if (!Number.isInteger(parsedOffset) || parsedOffset < 1) {
    return <Navigate to="/" replace />;
  }

  return <WeekTodoPage weekOffset={parsedOffset} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<WeekTodoPage weekOffset={0} />} />
      <Route path="/weeks/:weekOffset" element={<WeekTodoPageRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
