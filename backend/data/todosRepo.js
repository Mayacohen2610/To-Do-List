const { store } = require("./store");

function sortTodos(items) {
  return [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

function listTodos() {
  return sortTodos(store.todos);
}

function createTodo({ title, dueAt, userIds }) {
  const newTodo = {
    id: store.nextTodoId++,
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    dueAt: new Date(dueAt).toISOString(),
    userIds,
  };

  store.todos.push(newTodo);
  return newTodo;
}

function findTodoById(todoId) {
  return store.todos.find((item) => item.id === todoId);
}

function findTodoIndexById(todoId) {
  return store.todos.findIndex((item) => item.id === todoId);
}

function toggleTodo(todoId) {
  const todo = findTodoById(todoId);
  if (!todo) {
    return null;
  }

  todo.completed = !todo.completed;
  return todo;
}

function updateTodo(todo, { title, dueAt, userIds }) {
  if (title !== undefined) {
    todo.title = title;
  }

  if (dueAt !== undefined) {
    todo.dueAt = dueAt;
  }

  if (userIds !== undefined) {
    todo.userIds = userIds;
  }

  return todo;
}

function deleteTodoByIndex(todoIndex) {
  store.todos.splice(todoIndex, 1);
}

module.exports = {
  listTodos,
  createTodo,
  findTodoById,
  findTodoIndexById,
  toggleTodo,
  updateTodo,
  deleteTodoByIndex,
};
