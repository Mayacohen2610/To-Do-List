function normalizeUserName(value) {
  return String(value || "").trim();
}

function isValidHexColor(color) {
  return /^#([0-9a-fA-F]{6})$/.test(String(color || ""));
}

function sanitizeUserIds(userIds, users) {
  if (!Array.isArray(userIds)) {
    return null;
  }

  const normalized = [...new Set(userIds.map((id) => Number(id)).filter((id) => Number.isInteger(id)))];
  if (normalized.length === 0) {
    return null;
  }

  const validUserIds = new Set(users.map((user) => user.id));
  const hasInvalid = normalized.some((id) => !validUserIds.has(id));
  if (hasInvalid) {
    return null;
  }

  return normalized;
}

module.exports = {
  normalizeUserName,
  isValidHexColor,
  sanitizeUserIds,
};
