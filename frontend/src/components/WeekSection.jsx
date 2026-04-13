import { TaskAssignedUsers } from "./TaskAssignedUsers";
import { TaskEditPanel } from "./TaskEditPanel";

export function WeekSection({
  weekOffset,
  viewedWeekLabel,
  hasAnyWeekTodos,
  days,
  navigate,
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
  getTaskAccentBackground,
}) {
  return (
    <section className="week-section">
      <div className="week-header">
        <h2>{weekOffset === 0 ? "Current Week" : `Week +${weekOffset}`}</h2>
        <p>{viewedWeekLabel}</p>
      </div>

      <div className="week-nav">
        {weekOffset > 0 ? (
          <button type="button" onClick={() => navigate(weekOffset === 1 ? "/" : `/weeks/${weekOffset - 1}`)}>
            Previous Week
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={() => navigate(`/weeks/${weekOffset + 1}`)}>
          Next Week
        </button>
      </div>

      <div className="week-cards">
        {!hasAnyWeekTodos ? <p className="empty week-empty">No tasks for this week.</p> : null}
        {days.map((day) =>
          day.todos.length > 0 ? (
            <article className="day-card" key={`day-${day.date.toISOString()}`}>
              <header className="day-card-header">
                <h3>{day.title}</h3>
                <span className="day-count">{day.todos.length} task(s)</span>
              </header>
              <div className="task-card-list">
                {day.todos.map((todo) => (
                  <article className="task-card" key={todo.id}>
                    <span className="task-accent" style={{ background: getTaskAccentBackground(todo) }} />
                    <div className="task-card-main">
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
                          editKeyPrefix="edit-week"
                        />
                      ) : (
                        <>
                          <label className="task-check">
                            <input type="checkbox" checked={todo.completed} onChange={() => onToggleTodo(todo.id)} />
                            <span className={todo.completed ? "done" : ""}>{todo.title}</span>
                          </label>
                          <small className="task-due">Due: {formatDateTime(todo.dueAt)}</small>
                          <TaskAssignedUsers todo={todo} usersById={usersById} />
                        </>
                      )}
                    </div>
                    <div className="task-meta">
                      <span className={`task-status ${todo.completed ? "is-done" : "is-open"}`}>
                        {todo.completed ? "Done" : "Open"}
                      </span>
                      <div className="task-actions">
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
                            Edit
                          </button>
                        )}
                        <button className="delete-btn" type="button" onClick={() => onDeleteTodo(todo)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ) : null
        )}
      </div>
    </section>
  );
}
