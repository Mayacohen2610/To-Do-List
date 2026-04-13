// User management section for adding and removing app users.
export function UserSection({
  maxUsers,
  users,
  newUserName,
  setNewUserName,
  newUserColor,
  setNewUserColor,
  colorInputRef,
  onAddUser,
  onDeleteUser,
}) {
  return (
    <section className="user-section">
      <h2>Users</h2>
      <p className="section-note">
        Add up to {maxUsers} users. Deleting a user removes only that user from tasks.
      </p>
      <form className="user-form" onSubmit={onAddUser}>
        <input
          type="text"
          placeholder="User name"
          value={newUserName}
          onChange={(event) => setNewUserName(event.target.value)}
          disabled={users.length >= maxUsers}
        />
        <div className="color-picker-wrap">
          <button
            type="button"
            className="color-picker-btn"
            onClick={() => colorInputRef.current?.click()}
            disabled={users.length >= maxUsers}
          >
            Choose color
            <span className="color-preview" style={{ backgroundColor: newUserColor }} />
          </button>
          <input
            ref={colorInputRef}
            className="hidden-color-input"
            type="color"
            value={newUserColor}
            onChange={(event) => setNewUserColor(event.target.value)}
            disabled={users.length >= maxUsers}
          />
        </div>
        <button type="submit" disabled={users.length >= maxUsers}>
          Add User
        </button>
      </form>
      {users.length >= maxUsers ? <p className="limit-note">Maximum users reached.</p> : null}
      <div className="user-list">
        {users.length === 0 ? <p className="empty">No users yet. Add users first.</p> : null}
        {users.map((user) => (
          <article className="user-item" key={user.id}>
            <span className="user-color-dot" style={{ backgroundColor: user.color }} />
            <span>{user.name}</span>
            <button className="delete-btn user-delete-btn" type="button" onClick={() => onDeleteUser(user.id)}>
              Delete
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
