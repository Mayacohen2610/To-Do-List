// Renders overdue todos and supports inline editing actions.
import { TaskAssignedUsers } from "./TaskAssignedUsers";
import { TaskEditPanel } from "./TaskEditPanel";

export function OverdueSection({
  weekOffset,
  overdueTodos,
  editingTodoId,
  users,
  usersById,
  editingTitle,
  editingDueAt,
  editingUserIds,
  setEditingTitle,
  setEditingDueAt,
  setEditingUserIds,
  onToggleTodo,
  onSaveTask,
  onCancelTaskEdit,
  onStartEditingTask,
  onDeleteTodo,
  formatDateTime,
  getAssignedUsers,
}) {
  if (weekOffset !== 0) {
    return null;
  }

  return (
    <section className="overdue-section">
      <h2>Overdue Tasks</h2>
      {overdueTodos.length === 0 ? <p className="empty">No overdue tasks.</p> : null}
      <div className="overdue-list">
        {overdueTodos.map((todo) => (
          <article
            className={`overdue-item ${editingTodoId === todo.id ? "is-editing" : ""}`}
            key={todo.id}
            style={{ borderLeftColor: (getAssignedUsers(todo)[0] || {}).color || "#f3bfd3" }}
          >
            <div className="overdue-main">
              {editingTodoId === todo.id ? (
                <TaskEditPanel
                  todo={todo}
                  users={users}
                  editingTitle={editingTitle}
                  editingDueAt={editingDueAt}
                  editingUserIds={editingUserIds}
                  setEditingTitle={setEditingTitle}
                  setEditingDueAt={setEditingDueAt}
                  setEditingUserIds={setEditingUserIds}
                  editKeyPrefix="edit-overdue"
                />
              ) : (
                <>
                  <label>
                    <input type="checkbox" checked={todo.completed} onChange={() => onToggleTodo(todo.id)} />
                    <span className={todo.completed ? "done" : ""}>{todo.title}</span>
                  </label>
                  <small>Due: {formatDateTime(todo.dueAt)}</small>
                  <TaskAssignedUsers todo={todo} usersById={usersById} />
                </>
              )}
            </div>
            <div className="overdue-actions">
              {editingTodoId === todo.id ? (
                <>
                  <button type="button" onClick={() => onSaveTask(todo.id)}>
                    Save
                  </button>
                  <button type="button" onClick={onCancelTaskEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => onStartEditingTask(todo)}>
                  Edit task
                </button>
              )}
              <button className="delete-btn" type="button" onClick={() => onDeleteTodo(todo)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
