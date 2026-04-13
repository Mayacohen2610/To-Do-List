export function TaskAssignedUsers({ todo, usersById }) {
  const assignedUsers = (todo.userIds || []).map((userId) => usersById[userId]).filter(Boolean);

  if (assignedUsers.length === 0) {
    return <small className="task-users-empty">No assigned users</small>;
  }

  return (
    <div className="task-users">
      {assignedUsers.map((user) => (
        <span
          key={`${todo.id}-user-${user.id}`}
          className="user-chip"
          style={{ backgroundColor: `${user.color}22`, borderColor: user.color, color: user.color }}
        >
          {user.name}
        </span>
      ))}
    </div>
  );
}
