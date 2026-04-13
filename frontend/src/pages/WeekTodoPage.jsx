import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { OverdueSection } from "../components/OverdueSection";
import { TodoCreateSection } from "../components/TodoCreateSection";
import { UserFilterSection } from "../components/UserFilterSection";
import { UserSection } from "../components/UserSection";
import { WeekSection } from "../components/WeekSection";
import { useTodoEditing } from "../hooks/useTodoEditing";
import { useTodosUsersApi } from "../hooks/useTodosUsersApi";
import { useWeekDerivedTodos } from "../hooks/useWeekDerivedTodos";
import "../App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MAX_USERS = 5;

const sortByDueAt = (items) =>
  [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

function WeekTodoPage({ weekOffset }) {
  const navigate = useNavigate();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDueAt, setNewTodoDueAt] = useState("");
  const [newTodoUserIds, setNewTodoUserIds] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserColor, setNewUserColor] = useState("#7C4DFF");
  const colorInputRef = useRef(null);
  const [activeFilterUserIds, setActiveFilterUserIds] = useState([]);
  const {
    todos,
    setTodos,
    users,
    setUsers,
    connectionStatus,
    errorMessage,
    setErrorMessage,
    refreshData,
  } = useTodosUsersApi(API_BASE_URL);
  const {
    editingTodoId,
    editingTitle,
    editingDueAt,
    editingUserIds,
    setEditingTitle,
    setEditingDueAt,
    setEditingUserIds,
    startEditingTask,
    cancelTaskEdit,
    setEditingTodoId,
  } = useTodoEditing();

  const usersById = useMemo(
    () => users.reduce((accumulator, user) => ({ ...accumulator, [user.id]: user }), {}),
    [users]
  );

  useEffect(() => {
    setActiveFilterUserIds((previous) =>
      previous.filter((userId) => users.some((user) => user.id === userId))
    );
    setNewTodoUserIds((previous) => previous.filter((userId) => users.some((user) => user.id === userId)));
    setEditingUserIds((previous) => previous.filter((userId) => users.some((user) => user.id === userId)));
  }, [setEditingUserIds, users]);

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

  const formatDateTime = (value) => new Date(value).toLocaleString();
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

  const nowTimestamp = Date.now();
  const { overdueTodos, days, viewedWeekLabel, hasAnyWeekTodos } = useWeekDerivedTodos({
    todos,
    weekOffset,
    activeFilterUserIds,
    nowTimestamp,
  });

  return (
    <main className="app">
      <h1>Todo Planner</h1>
      <p className="status">Backend: {connectionStatus}</p>
      {errorMessage ? <p className="error">{errorMessage}</p> : null}

      <UserSection
        maxUsers={MAX_USERS}
        users={users}
        newUserName={newUserName}
        setNewUserName={setNewUserName}
        newUserColor={newUserColor}
        setNewUserColor={setNewUserColor}
        colorInputRef={colorInputRef}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
      />

      <UserFilterSection
        users={users}
        activeFilterUserIds={activeFilterUserIds}
        setActiveFilterUserIds={setActiveFilterUserIds}
      />

      <TodoCreateSection
        users={users}
        newTodoTitle={newTodoTitle}
        setNewTodoTitle={setNewTodoTitle}
        newTodoDueAt={newTodoDueAt}
        setNewTodoDueAt={setNewTodoDueAt}
        newTodoUserIds={newTodoUserIds}
        setNewTodoUserIds={setNewTodoUserIds}
        onAddTodo={handleAddTodo}
      />

      <OverdueSection
        weekOffset={weekOffset}
        overdueTodos={overdueTodos}
        editingTodoId={editingTodoId}
        users={users}
        usersById={usersById}
        editingTitle={editingTitle}
        editingDueAt={editingDueAt}
        editingUserIds={editingUserIds}
        setEditingTitle={setEditingTitle}
        setEditingDueAt={setEditingDueAt}
        setEditingUserIds={setEditingUserIds}
        onToggleTodo={handleToggleTodo}
        onSaveTask={handleSaveTask}
        onCancelTaskEdit={cancelTaskEdit}
        onStartEditingTask={startEditingTask}
        onDeleteTodo={handleDeleteTodo}
        formatDateTime={formatDateTime}
        getAssignedUsers={getAssignedUsers}
      />

      <WeekSection
        weekOffset={weekOffset}
        viewedWeekLabel={viewedWeekLabel}
        hasAnyWeekTodos={hasAnyWeekTodos}
        days={days}
        navigate={navigate}
        editingTodoId={editingTodoId}
        users={users}
        usersById={usersById}
        editingTitle={editingTitle}
        editingDueAt={editingDueAt}
        editingUserIds={editingUserIds}
        setEditingTitle={setEditingTitle}
        setEditingDueAt={setEditingDueAt}
        setEditingUserIds={setEditingUserIds}
        onToggleTodo={handleToggleTodo}
        onSaveTask={handleSaveTask}
        onCancelTaskEdit={cancelTaskEdit}
        onStartEditingTask={startEditingTask}
        onDeleteTodo={handleDeleteTodo}
        formatDateTime={formatDateTime}
        getTaskAccentBackground={getTaskAccentBackground}
      />
    </main>
  );
}

export function WeekTodoPageRoute() {
  const { weekOffset } = useParams();
  const parsedOffset = Number(weekOffset);

  if (!Number.isInteger(parsedOffset) || parsedOffset < 1) {
    return <Navigate to="/" replace />;
  }

  return <WeekTodoPage weekOffset={parsedOffset} />;
}

export { WeekTodoPage };
