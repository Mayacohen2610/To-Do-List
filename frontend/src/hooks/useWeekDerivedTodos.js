// Derives week/day todo groupings and overdue tasks from source data.
import { useMemo } from "react";
import { addDays, getStartOfWeek, isWithinRange } from "../utils/dateWeek";

const formatDayTitle = (value) =>
  new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(value);

export function useWeekDerivedTodos({ todos, weekOffset, activeFilterUserIds, nowTimestamp }) {
  const filteredTodos = useMemo(() => {
    if (activeFilterUserIds.length === 0) {
      return todos;
    }

    return todos.filter((todo) => (todo.userIds || []).some((userId) => activeFilterUserIds.includes(userId)));
  }, [activeFilterUserIds, todos]);

  const currentWeekStart = getStartOfWeek(new Date(nowTimestamp));
  const viewedWeekStart = addDays(currentWeekStart, weekOffset * 7);
  const viewedWeekEnd = addDays(viewedWeekStart, 7);

  const overdueTodos = filteredTodos.filter(
    (todo) => !todo.completed && new Date(todo.dueAt).getTime() < nowTimestamp
  );

  const viewedWeekTodos = useMemo(() => {
    const overdueIds = new Set(overdueTodos.map((todo) => todo.id));

    return filteredTodos.filter((todo) => {
      const dueDate = new Date(todo.dueAt);
      const inViewedWeek = isWithinRange(dueDate, viewedWeekStart, viewedWeekEnd);

      if (!inViewedWeek) {
        return false;
      }

      if (weekOffset === 0 && overdueIds.has(todo.id)) {
        return false;
      }

      return true;
    });
  }, [filteredTodos, overdueTodos, viewedWeekEnd, viewedWeekStart, weekOffset]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, dayOffset) => {
        const dayDate = addDays(viewedWeekStart, dayOffset);
        const dayTodos = viewedWeekTodos.filter((todo) => {
          const dueDate = new Date(todo.dueAt);
          return (
            dueDate.getFullYear() === dayDate.getFullYear() &&
            dueDate.getMonth() === dayDate.getMonth() &&
            dueDate.getDate() === dayDate.getDate()
          );
        });

        return {
          date: dayDate,
          title: formatDayTitle(dayDate),
          todos: dayTodos,
        };
      }),
    [viewedWeekStart, viewedWeekTodos]
  );

  const viewedWeekLabel = `${formatDayTitle(viewedWeekStart)} - ${formatDayTitle(addDays(viewedWeekStart, 6))}`;
  const hasAnyWeekTodos = days.some((day) => day.todos.length > 0);

  return {
    overdueTodos,
    days,
    viewedWeekLabel,
    hasAnyWeekTodos,
  };
}
