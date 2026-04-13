import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MAX_USERS = 5;

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
  const [newTodoUserIds, setNewTodoUserIds] = useState([]);
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserColor, setNewUserColor] = useState("#7C4DFF");
  const colorInputRef = useRef(null);
  const [activeFilterUserIds, setActiveFilterUserIds] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Checking...");
  const [errorMessage, setErrorMessage] = useState("");

  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueAt, setEditingDueAt] = useState("");
  const [editingUserIds, setEditingUserIds] = useState([]);

  const sortByDueAt = (items) =>
    [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  const toggleIdInList = (list, userId) =>
    list.includes(userId) ? list.filter((id) => id !== userId) : [...list, userId];

  const usersById = useMemo(
    () => users.reduce((accumulator, user) => ({ ...accumulator, [user.id]: user }), {}),
    [users]
  );

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

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load users.");
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
        fetchUsers();
      } catch (error) {
        console.error(error);
        setConnectionStatus("Disconnected");
      }
    };

    checkBackendHealth();
  }, [fetchTodos, fetchUsers]);

  useEffect(() => {
    setActiveFilterUserIds((previous) =>
      previous.filter((userId) => users.some((user) => user.id === userId))
    );
    setNewTodoUserIds((previous) =>
      previous.filter((userId) => users.some((user) => user.id === userId))
    );
    setEditingUserIds((previous) =>
      previous.filter((userId) => users.some((user) => user.id === userId))
    );
  }, [users]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchTodos(), fetchUsers()]);
  }, [fetchTodos, fetchUsers]);

  const handleAddUser = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!newUserName.trim()) {
      setErrorMessage("User name is required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          color: newUserColor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create user.");
      }

      const createdUser = await response.json();
      setUsers((previous) => [...previous, createdUser]);
      setNewUserName("");
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Could not create user.");
    }
  };

  const handleDeleteUser = async (userId) => {
    const shouldDelete = window.confirm(
      "Delete this user? All tasks assigned to this user will also be deleted."
    );
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user.");
      }

      await refreshData();
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not delete user.");
    }
  };

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

    if (newTodoUserIds.length === 0) {
      setErrorMessage("Select at least one user for the task.");
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
          userIds: newTodoUserIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create todo.");
      }

      const createdTodo = await response.json();
      setTodos((prevTodos) => sortByDueAt([...prevTodos, createdTodo]));
      setNewTodoDueAt("");
      setNewTodoUserIds([]);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Could not create todo.");
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

  const handleStartEditingTask = (todo) => {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
    setEditingDueAt(toDateTimeLocalValue(todo.dueAt));
    setEditingUserIds(todo.userIds || []);
  };

  const handleSaveTask = async (todoId) => {
    if (!editingTitle.trim()) {
      setErrorMessage("Task title cannot be empty.");
      return;
    }

    if (!editingDueAt) {
      setErrorMessage("Please choose a new due date.");
      return;
    }

    if (editingUserIds.length === 0) {
      setErrorMessage("Choose at least one user.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/todos/${todoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingTitle.trim(),
          dueAt: editingDueAt,
          userIds: editingUserIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update todo.");
      }

      const updatedTodo = await response.json();
      setTodos((prevTodos) =>
        sortByDueAt(prevTodos.map((todo) => (todo.id === todoId ? updatedTodo : todo)))
      );
      setEditingTodoId(null);
      setEditingTitle("");
      setEditingDueAt("");
      setEditingUserIds([]);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Could not update task.");
    }
  };

  const handleCancelTaskEdit = () => {
    setEditingTodoId(null);
    setEditingTitle("");
    setEditingDueAt("");
    setEditingUserIds([]);
  };

  const formatDateTime = (value) => new Date(value).toLocaleString();
  const formatDayTitle = (value) =>
    new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(
      value
    );

  const filteredTodos = useMemo(() => {
    if (activeFilterUserIds.length === 0) {
      return todos;
    }

    return todos.filter((todo) => (todo.userIds || []).some((userId) => activeFilterUserIds.includes(userId)));
  }, [activeFilterUserIds, todos]);

  const nowTimestamp = Date.now();
  const currentWeekStart = getStartOfWeek(new Date(nowTimestamp));
  const viewedWeekStart = addDays(currentWeekStart, weekOffset * 7);
  const viewedWeekEnd = addDays(viewedWeekStart, 7);

  const overdueTodos = filteredTodos.filter(
    (todo) => !todo.completed && new Date(todo.dueAt).getTime() < nowTimestamp
  );

  const viewedWeekTodos = useMemo(() => {
    const overdueIds = new Set(overdueTodos.map((todo) => todo.id));

    return filteredTodos.filter((todo) => {
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
  }, [filteredTodos, overdueTodos, viewedWeekEnd, viewedWeekStart, weekOffset]);

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

  const getAssignedUsers = (todo) =>
    (todo.userIds || []).map((userId) => usersById[userId]).filter(Boolean);

  const getTaskAccentBackground = (todo) => {
    const colors = getAssignedUsers(todo).map((user) => user.color);
    if (colors.length === 0) {
      return "#d9c9ff";
    }

    if (colors.length === 1) {
      return colors[0];
    }

    return `linear-gradient(90deg, ${colors.join(", ")})`;
  };

  const renderAssignedUsers = (todo) => {
    const assignedUsers = getAssignedUsers(todo);
    if (assignedUsers.length === 0) {
      return <small className="task-users-empty">No assigned users</small>;
    }

    return (
      <div className="task-users">
        {assignedUsers.map((user) => (
          <span
            key={`${todo.id}-user-${user.id}`}
            className="user-chip"
            style={{ backgroundColor: `${user.color}22`, borderColor: user.color, color: user.color }}
          >
            {user.name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <main className="app">
      <h1>Todo Planner</h1>
      <p className="status">Backend: {connectionStatus}</p>
      {errorMessage ? <p className="error">{errorMessage}</p> : null}

      <section className="user-section">
        <h2>Users</h2>
        <p className="section-note">
          Add up to {MAX_USERS} users. Deleting a user removes only that user from tasks.
        </p>
        <form className="user-form" onSubmit={handleAddUser}>
          <input
            type="text"
            placeholder="User name"
            value={newUserName}
            onChange={(event) => setNewUserName(event.target.value)}
            disabled={users.length >= MAX_USERS}
          />
          <div className="color-picker-wrap">
            <button
              type="button"
              className="color-picker-btn"
              onClick={() => colorInputRef.current?.click()}
              disabled={users.length >= MAX_USERS}
            >
              Choose color
              <span className="color-preview" style={{ backgroundColor: newUserColor }} />
            </button>
            <input
              ref={colorInputRef}
              className="hidden-color-input"
              type="color"
              value={newUserColor}
              onChange={(event) => setNewUserColor(event.target.value)}
              disabled={users.length >= MAX_USERS}
            />
          </div>
          <button type="submit" disabled={users.length >= MAX_USERS}>
            Add User
          </button>
        </form>
        {users.length >= MAX_USERS ? <p className="limit-note">Maximum users reached.</p> : null}
        <div className="user-list">
          {users.length === 0 ? <p className="empty">No users yet. Add users first.</p> : null}
          {users.map((user) => (
            <article className="user-item" key={user.id}>
              <span className="user-color-dot" style={{ backgroundColor: user.color }} />
              <span>{user.name}</span>
              <button className="delete-btn user-delete-btn" type="button" onClick={() => handleDeleteUser(user.id)}>
                Delete
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="filter-section">
        <h2>Filter Tasks By User</h2>
        <div className="user-toggle-row">
          {users.map((user) => {
            const isActive = activeFilterUserIds.includes(user.id);
            return (
              <button
                key={`filter-${user.id}`}
                type="button"
                className={`user-toggle ${isActive ? "active" : ""}`}
                style={{ borderColor: user.color }}
                onClick={() => setActiveFilterUserIds((previous) => toggleIdInList(previous, user.id))}
              >
                <span className="user-color-dot" style={{ backgroundColor: user.color }} />
                {user.name}
              </button>
            );
          })}
        </div>
      </section>

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
      <div className="user-toggle-row assign-row">
        {users.map((user) => {
          const isSelected = newTodoUserIds.includes(user.id);
          return (
            <button
              key={`new-assignee-${user.id}`}
              type="button"
              className={`user-toggle ${isSelected ? "active" : ""}`}
              style={{ borderColor: user.color }}
              onClick={() => setNewTodoUserIds((previous) => toggleIdInList(previous, user.id))}
            >
              <span className="user-color-dot" style={{ backgroundColor: user.color }} />
              {user.name}
            </button>
          );
        })}
      </div>

      {weekOffset === 0 ? (
        <section className="overdue-section">
          <h2>Overdue Tasks</h2>
          {overdueTodos.length === 0 ? <p className="empty">No overdue tasks.</p> : null}
          <div className="overdue-list">
            {overdueTodos.map((todo) => (
              <article
                className={`overdue-item ${editingTodoId === todo.id ? "is-editing" : ""}`}
                key={todo.id}
                style={{ borderLeftColor: (getAssignedUsers(todo)[0] || {}).color || "#f3bfd3" }}
              >
                <div className="overdue-main">
                  {editingTodoId === todo.id ? (
                    <div className="edit-panel">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                      />
                      <input
                        type="datetime-local"
                        value={editingDueAt}
                        onChange={(event) => setEditingDueAt(event.target.value)}
                      />
                      <div className="user-toggle-row">
                        {users.map((user) => {
                          const selected = editingUserIds.includes(user.id);
                          return (
                            <button
                              key={`edit-overdue-${todo.id}-${user.id}`}
                              type="button"
                              className={`user-toggle ${selected ? "active" : ""}`}
                              style={{ borderColor: user.color }}
                              onClick={() =>
                                setEditingUserIds((previous) => toggleIdInList(previous, user.id))
                              }
                            >
                              <span className="user-color-dot" style={{ backgroundColor: user.color }} />
                              {user.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleTodo(todo.id)}
                        />
                        <span className={todo.completed ? "done" : ""}>{todo.title}</span>
                      </label>
                      <small>Due: {formatDateTime(todo.dueAt)}</small>
                      {renderAssignedUsers(todo)}
                    </>
                  )}
                </div>
                <div className="overdue-actions">
                  {editingTodoId === todo.id ? (
                    <>
                      <button type="button" onClick={() => handleSaveTask(todo.id)}>
                        Save
                      </button>
                      <button type="button" onClick={handleCancelTaskEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => handleStartEditingTask(todo)}>
                      Edit task
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
                      <span className="task-accent" style={{ background: getTaskAccentBackground(todo) }} />
                      <div className="task-card-main">
                        {editingTodoId === todo.id ? (
                          <div className="edit-panel">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                            />
                            <input
                              type="datetime-local"
                              value={editingDueAt}
                              onChange={(event) => setEditingDueAt(event.target.value)}
                            />
                            <div className="user-toggle-row">
                              {users.map((user) => {
                                const selected = editingUserIds.includes(user.id);
                                return (
                                  <button
                                    key={`edit-week-${todo.id}-${user.id}`}
                                    type="button"
                                    className={`user-toggle ${selected ? "active" : ""}`}
                                    style={{ borderColor: user.color }}
                                    onClick={() =>
                                      setEditingUserIds((previous) => toggleIdInList(previous, user.id))
                                    }
                                  >
                                    <span className="user-color-dot" style={{ backgroundColor: user.color }} />
                                    {user.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <>
                            <label className="task-check">
                              <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggleTodo(todo.id)}
                              />
                              <span className={todo.completed ? "done" : ""}>{todo.title}</span>
                            </label>
                            <small className="task-due">Due: {formatDateTime(todo.dueAt)}</small>
                            {renderAssignedUsers(todo)}
                          </>
                        )}
                      </div>
                      <div className="task-meta">
                        <span className={`task-status ${todo.completed ? "is-done" : "is-open"}`}>
                          {todo.completed ? "Done" : "Open"}
                        </span>
                        <div className="task-actions">
                          {editingTodoId === todo.id ? (
                            <>
                              <button type="button" onClick={() => handleSaveTask(todo.id)}>
                                Save
                              </button>
                              <button type="button" onClick={handleCancelTaskEdit}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => handleStartEditingTask(todo)}>
                              Edit
                            </button>
                          )}
                          <button className="delete-btn" type="button" onClick={() => handleDeleteTodo(todo)}>
                            Delete
                          </button>
                        </div>
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
