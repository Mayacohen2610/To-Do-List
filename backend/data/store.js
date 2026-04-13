const fs = require("fs");
const path = require("path");

const DATA_FILE_PATH = path.join(__dirname, "..", "data.json");
const DEFAULT_STORE = {
  users: [],
  todos: [],
  nextUserId: 1,
  nextTodoId: 1,
};

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

const store = loadStore();

function saveStore() {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

module.exports = {
  store,
  saveStore,
};
