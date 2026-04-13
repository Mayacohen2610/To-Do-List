import { useCallback, useEffect, useState } from "react";

const sortByDueAt = (items) =>
  [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

export function useTodosUsersApi(apiBaseUrl) {
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Checking...");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchTodos = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/todos`);

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const data = await response.json();
      setTodos(sortByDueAt(data));
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load todos.");
    }
  }, [apiBaseUrl]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/users`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load users.");
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/health`);

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
  }, [apiBaseUrl, fetchTodos, fetchUsers]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchTodos(), fetchUsers()]);
  }, [fetchTodos, fetchUsers]);

  return {
    todos,
    setTodos,
    users,
    setUsers,
    connectionStatus,
    errorMessage,
    setErrorMessage,
    refreshData,
  };
}
