// Handles user API endpoints for listing, creating, and deleting users.
const express = require("express");
const { store, saveStore } = require("../storage/store");
const { createUser, deleteUserAndCleanupTodos, listUsers } = require("../repositories/usersRepo");
const { isValidHexColor, normalizeUserName } = require("../utils/validation");

const MAX_USERS = 5;
const router = express.Router();

router.get("/", (req, res) => {
  res.json(listUsers());
});

router.post("/", (req, res) => {
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

  const newUser = createUser({ name, color });
  saveStore();
  return res.status(201).json(newUser);
});

router.delete("/:id", (req, res) => {
  const userId = Number(req.params.id);
  const removed = deleteUserAndCleanupTodos(userId);

  if (!removed) {
    return res.status(404).json({ message: "User not found." });
  }

  saveStore();
  return res.json({ message: "User removed from tasks. Tasks with no users were deleted." });
});

module.exports = router;
