const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.i7b1a.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  )
  .then(() => console.log('Conected to database\n---------------------------'))
  .catch(err => console.log(err));

const port = process.env.PORT;
const server = app.listen(port, () =>
  console.log(`App running on port ${port}...`)
);

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 🔥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});
