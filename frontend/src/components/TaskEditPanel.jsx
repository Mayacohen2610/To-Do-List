// Inline editor UI for updating an existing todo task.
import { toggleIdInList } from "../utils/ids";

export function TaskEditPanel({
  todo,
  users,
  editingTitle,
  editingDueAt,
  editingUserIds,
  setEditingTitle,
  setEditingDueAt,
  setEditingUserIds,
  editKeyPrefix,
}) {
  return (
    <div className="edit-panel">
      <input type="text" value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
      <input
        type="datetime-local"
        value={editingDueAt}
        onChange={(event) => setEditingDueAt(event.target.value)}
      />
      <div className="user-toggle-row">
        {users.map((user) => {
          const selected = editingUserIds.includes(user.id);
          return (
            <button
              key={`${editKeyPrefix}-${todo.id}-${user.id}`}
              type="button"
              className={`user-toggle ${selected ? "active" : ""}`}
              style={{ borderColor: user.color }}
              onClick={() => setEditingUserIds((previous) => toggleIdInList(previous, user.id))}
            >
              <span className="user-color-dot" style={{ backgroundColor: user.color }} />
              {user.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
