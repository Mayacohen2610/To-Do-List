// Provides data operations for user records stored in the in-memory store.
const { store } = require("../storage/store");

function listUsers() {
  return store.users;
}

function createUser({ name, color }) {
  const newUser = {
    id: store.nextUserId++,
    name,
    color,
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  return newUser;
}

function findUserIndexById(userId) {
  return store.users.findIndex((user) => user.id === userId);
}

function deleteUserAndCleanupTodos(userId) {
  const userIndex = findUserIndexById(userId);
  if (userIndex === -1) {
    return false;
  }

  store.users.splice(userIndex, 1);
  store.todos = store.todos
    .map((todo) => ({
      ...todo,
      userIds: (todo.userIds || []).filter((assignedUserId) => assignedUserId !== userId),
    }))
    .filter((todo) => todo.userIds.length > 0);

  return true;
}

module.exports = {
  listUsers,
  createUser,
  findUserIndexById,
  deleteUserAndCleanupTodos,
};
