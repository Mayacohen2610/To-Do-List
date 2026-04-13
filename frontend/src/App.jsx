import { Navigate, Route, Routes } from "react-router-dom";
import { WeekTodoPage, WeekTodoPageRoute } from "./pages/WeekTodoPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<WeekTodoPage weekOffset={0} />} />
      <Route path="/weeks/:weekOffset" element={<WeekTodoPageRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
