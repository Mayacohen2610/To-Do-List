const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MAX_USERS = 5;
const DATA_FILE_PATH = path.join(__dirname, "data.json");
const DEFAULT_STORE = {
  users: [],
  todos: [],
  nextUserId: 1,
  nextTodoId: 1,
};
let store = loadStore();

function loadStore() {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
      return { ...DEFAULT_STORE };
    }

    const rawData = fs.readFileSync(DATA_FILE_PATH, "utf8");
    const parsed = JSON.parse(rawData);
    const users = Array.isArray(parsed.users) ? parsed.users : [];
    const todos = Array.isArray(parsed.todos)
      ? parsed.todos.map((todo) => ({
          ...todo,
          userIds: Array.isArray(todo.userIds)
            ? [...new Set(todo.userIds.map((id) => Number(id)).filter((id) => Number.isInteger(id)))]
            : [],
        }))
      : [];

    const maxUserId = users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 0);
    const maxTodoId = todos.reduce((max, todo) => Math.max(max, Number(todo.id) || 0), 0);

    return {
      users,
      todos,
      nextUserId: Number(parsed.nextUserId) > maxUserId ? parsed.nextUserId : maxUserId + 1,
      nextTodoId: Number(parsed.nextTodoId) > maxTodoId ? parsed.nextTodoId : maxTodoId + 1,
    };
  } catch (error) {
    console.error("Failed to load store. Falling back to defaults.", error);
    return { ...DEFAULT_STORE };
  }
}

function saveStore() {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function sortTodos(items) {
  return [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

function normalizeUserName(value) {
  return String(value || "").trim();
}

function isValidHexColor(color) {
  return /^#([0-9a-fA-F]{6})$/.test(String(color || ""));
}

function sanitizeUserIds(userIds) {
  if (!Array.isArray(userIds)) {
    return null;
  }

  const normalized = [...new Set(userIds.map((id) => Number(id)).filter((id) => Number.isInteger(id)))];
  if (normalized.length === 0) {
    return null;
  }

  const validUserIds = new Set(store.users.map((user) => user.id));
  const hasInvalid = normalized.some((id) => !validUserIds.has(id));
  if (hasInvalid) {
    return null;
  }

  return normalized;
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/todos", (req, res) => {
  res.json(sortTodos(store.todos));
});

app.get("/api/users", (req, res) => {
  res.json(store.users);
});

app.post("/api/users", (req, res) => {
  const name = normalizeUserName(req.body.name);
  const color = String(req.body.color || "").trim();

  if (!name) {
    return res.status(400).json({ message: "User name is required." });
  }

  if (!isValidHexColor(color)) {
    return res.status(400).json({ message: "Color must be a valid hex value like #AABBCC." });
  }

  if (store.users.length >= MAX_USERS) {
    return res.status(400).json({ message: `Only ${MAX_USERS} users are allowed.` });
  }

  const nameExists = store.users.some((user) => user.name.toLowerCase() === name.toLowerCase());
  if (nameExists) {
    return res.status(400).json({ message: "User name already exists." });
  }

  const colorExists = store.users.some((user) => user.color.toLowerCase() === color.toLowerCase());
  if (colorExists) {
    return res.status(400).json({ message: "Color already in use by another user." });
  }

  const newUser = {
    id: store.nextUserId++,
    name,
    color,
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  saveStore();
  return res.status(201).json(newUser);
});

app.delete("/api/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  const userIndex = store.users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found." });
  }

  store.users.splice(userIndex, 1);
  store.todos = store.todos
    .map((todo) => ({
      ...todo,
      userIds: (todo.userIds || []).filter((assignedUserId) => assignedUserId !== userId),
    }))
    .filter((todo) => todo.userIds.length > 0);
  saveStore();
  return res.json({ message: "User removed from tasks. Tasks with no users were deleted." });
});

app.post("/api/todos", (req, res) => {
  const { title, dueAt, userIds } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
    return res.status(400).json({ message: "A valid dueAt value is required." });
  }

  const sanitizedUserIds = sanitizeUserIds(userIds);
  if (!sanitizedUserIds) {
    return res.status(400).json({ message: "At least one valid assigned user is required." });
  }

  const newTodo = {
    id: store.nextTodoId++,
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    dueAt: new Date(dueAt).toISOString(),
    userIds: sanitizedUserIds,
  };

  store.todos.push(newTodo);
  saveStore();
  res.status(201).json(newTodo);
});

app.patch("/api/todos/:id/toggle", (req, res) => {
  const todoId = Number(req.params.id);
  const todo = store.todos.find((item) => item.id === todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }

  todo.completed = !todo.completed;
  saveStore();
  return res.json(todo);
});

app.patch("/api/todos/:id", (req, res) => {
  const todoId = Number(req.params.id);
  const { title, dueAt, userIds } = req.body;
  const todo = store.todos.find((item) => item.id === todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }

  if (title !== undefined) {
    const normalizedTitle = String(title).trim();
    if (!normalizedTitle) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    todo.title = normalizedTitle;
  }

  if (dueAt !== undefined) {
    if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
      return res.status(400).json({ message: "A valid dueAt value is required." });
    }

    todo.dueAt = new Date(dueAt).toISOString();
  }

  if (userIds !== undefined) {
    const sanitizedUserIds = sanitizeUserIds(userIds);
    if (!sanitizedUserIds) {
      return res.status(400).json({ message: "At least one valid assigned user is required." });
    }

    todo.userIds = sanitizedUserIds;
  }

  saveStore();
  return res.json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  const todoId = Number(req.params.id);
  const todoIndex = store.todos.findIndex((item) => item.id === todoId);
  const forceDelete = req.query.force === "true";

  if (todoIndex === -1) {
    return res.status(404).json({ message: "Todo not found." });
  }

  if (!store.todos[todoIndex].completed && !forceDelete) {
    return res.status(409).json({
      message: "Todo is not completed. Confirm deletion and retry with ?force=true.",
    });
  }

  store.todos.splice(todoIndex, 1);
  saveStore();
  return res.json({ message: "Todo deleted." });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
