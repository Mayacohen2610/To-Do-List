// Utility helpers for toggling user IDs in selection lists.
export const toggleIdInList = (list, userId) =>
  list.includes(userId) ? list.filter((id) => id !== userId) : [...list, userId];
