import { toggleIdInList } from "../utils/ids";

export function UserFilterSection({ users, activeFilterUserIds, setActiveFilterUserIds }) {
  return (
    <section className="filter-section">
      <h2>Filter Tasks By User</h2>
      <div className="user-toggle-row">
        {users.map((user) => {
          const isActive = activeFilterUserIds.includes(user.id);
          return (
            <button
              key={`filter-${user.id}`}
              type="button"
              className={`user-toggle ${isActive ? "active" : ""}`}
              style={{ borderColor: user.color }}
              onClick={() => setActiveFilterUserIds((previous) => toggleIdInList(previous, user.id))}
            >
              <span className="user-color-dot" style={{ backgroundColor: user.color }} />
              {user.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
