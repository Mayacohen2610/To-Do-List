const dotenv = require("dotenv");
const { createApp } = require("./app");

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
