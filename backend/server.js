const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const todos = [];

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/todos", (req, res) => {
  const sortedTodos = [...todos].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  );

  res.json(sortedTodos);
});

app.post("/api/todos", (req, res) => {
  const { title, dueAt } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
    return res.status(400).json({ message: "A valid dueAt value is required." });
  }

  const newTodo = {
    id: Date.now(),
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    dueAt: new Date(dueAt).toISOString(),
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.patch("/api/todos/:id/toggle", (req, res) => {
  const todoId = Number(req.params.id);
  const todo = todos.find((item) => item.id === todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }

  todo.completed = !todo.completed;
  return res.json(todo);
});

app.patch("/api/todos/:id", (req, res) => {
  const todoId = Number(req.params.id);
  const { dueAt } = req.body;
  const todo = todos.find((item) => item.id === todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }

  if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
    return res.status(400).json({ message: "A valid dueAt value is required." });
  }

  todo.dueAt = new Date(dueAt).toISOString();
  return res.json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  const todoId = Number(req.params.id);
  const todoIndex = todos.findIndex((item) => item.id === todoId);
  const forceDelete = req.query.force === "true";

  if (todoIndex === -1) {
    return res.status(404).json({ message: "Todo not found." });
  }

  if (!todos[todoIndex].completed && !forceDelete) {
    return res.status(409).json({
      message: "Todo is not completed. Confirm deletion and retry with ?force=true.",
    });
  }

  todos.splice(todoIndex, 1);
  return res.json({ message: "Todo deleted." });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
