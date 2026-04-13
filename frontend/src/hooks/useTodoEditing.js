// Manages local state and helpers for editing todo tasks.
import { useState } from "react";
import { toDateTimeLocalValue } from "../utils/dateWeek";

export function useTodoEditing() {
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueAt, setEditingDueAt] = useState("");
  const [editingUserIds, setEditingUserIds] = useState([]);

  const startEditingTask = (todo) => {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
    setEditingDueAt(toDateTimeLocalValue(todo.dueAt));
    setEditingUserIds(todo.userIds || []);
  };

  const cancelTaskEdit = () => {
    setEditingTodoId(null);
    setEditingTitle("");
    setEditingDueAt("");
    setEditingUserIds([]);
  };

  return {
    editingTodoId,
    editingTitle,
    editingDueAt,
    editingUserIds,
    setEditingTitle,
    setEditingDueAt,
    setEditingUserIds,
    setEditingTodoId,
    startEditingTask,
    cancelTaskEdit,
  };
}
