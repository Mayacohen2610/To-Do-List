// Form section used to create new todo tasks.
import { toggleIdInList } from "../utils/ids";

export function TodoCreateSection({
  users,
  newTodoTitle,
  setNewTodoTitle,
  newTodoDueAt,
  setNewTodoDueAt,
  newTodoUserIds,
  setNewTodoUserIds,
  onAddTodo,
}) {
  return (
    <>
      <form className="todo-form" onSubmit={onAddTodo}>
        <input
          type="text"
          placeholder="Add a todo..."
          value={newTodoTitle}
          onChange={(event) => setNewTodoTitle(event.target.value)}
        />
        <input
          type="datetime-local"
          value={newTodoDueAt}
          onChange={(event) => setNewTodoDueAt(event.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      <div className="user-toggle-row assign-row">
        {users.map((user) => {
          const isSelected = newTodoUserIds.includes(user.id);
          return (
            <button
              key={`new-assignee-${user.id}`}
              type="button"
              className={`user-toggle ${isSelected ? "active" : ""}`}
              style={{ borderColor: user.color }}
              onClick={() => setNewTodoUserIds((previous) => toggleIdInList(previous, user.id))}
            >
              <span className="user-color-dot" style={{ backgroundColor: user.color }} />
              {user.name}
            </button>
          );
        })}
      </div>
    </>
  );
}
