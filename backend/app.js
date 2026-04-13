const express = require("express");
const cors = require("cors");
const usersRouter = require("./routes/users");
const todosRouter = require("./routes/todos");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/users", usersRouter);
  app.use("/api/todos", todosRouter);

  return app;
}

module.exports = {
  createApp,
};
