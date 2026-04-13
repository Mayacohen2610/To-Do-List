const express = require("express");
const { store, saveStore } = require("../data/store");
const {
  createTodo,
  deleteTodoByIndex,
  findTodoById,
  findTodoIndexById,
  listTodos,
  toggleTodo,
  updateTodo,
} = require("../data/todosRepo");
const { sanitizeUserIds } = require("../utils/validation");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(listTodos());
});

router.post("/", (req, res) => {
  const { title, dueAt, userIds } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
    return res.status(400).json({ message: "A valid dueAt value is required." });
  }

  const sanitizedUserIds = sanitizeUserIds(userIds, store.users);
  if (!sanitizedUserIds) {
    return res.status(400).json({ message: "At least one valid assigned user is required." });
  }

  const newTodo = createTodo({ title, dueAt, userIds: sanitizedUserIds });
  saveStore();
  return res.status(201).json(newTodo);
});

router.patch("/:id/toggle", (req, res) => {
  const todoId = Number(req.params.id);
  const todo = toggleTodo(todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }

  saveStore();
  return res.json(todo);
});

router.patch("/:id", (req, res) => {
  const todoId = Number(req.params.id);
  const { title, dueAt, userIds } = req.body;
  const todo = findTodoById(todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }

  if (title !== undefined) {
    const normalizedTitle = String(title).trim();
    if (!normalizedTitle) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    updateTodo(todo, { title: normalizedTitle });
  }

  if (dueAt !== undefined) {
    if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
      return res.status(400).json({ message: "A valid dueAt value is required." });
    }

    updateTodo(todo, { dueAt: new Date(dueAt).toISOString() });
  }

  if (userIds !== undefined) {
    const sanitizedUserIds = sanitizeUserIds(userIds, store.users);
    if (!sanitizedUserIds) {
      return res.status(400).json({ message: "At least one valid assigned user is required." });
    }

    updateTodo(todo, { userIds: sanitizedUserIds });
  }

  saveStore();
  return res.json(todo);
});

router.delete("/:id", (req, res) => {
  const todoId = Number(req.params.id);
  const todoIndex = findTodoIndexById(todoId);
  const forceDelete = req.query.force === "true";

  if (todoIndex === -1) {
    return res.status(404).json({ message: "Todo not found." });
  }

  if (!store.todos[todoIndex].completed && !forceDelete) {
    return res.status(409).json({
      message: "Todo is not completed. Confirm deletion and retry with ?force=true.",
    });
  }

  deleteTodoByIndex(todoIndex);
  saveStore();
  return res.json({ message: "Todo deleted." });
});

module.exports = router;
