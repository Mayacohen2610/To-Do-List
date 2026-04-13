export const toggleIdInList = (list, userId) =>
  list.includes(userId) ? list.filter((id) => id !== userId) : [...list, userId];
