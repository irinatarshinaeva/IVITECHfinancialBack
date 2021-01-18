const express = require('express');
const app = express();
const path = require('path');
global.fetch = require('node-fetch');
const router = require('./src/routes/formAPI');

const PORT = process.env.PORT || 3000;

app.set('view engine', 'hbs');
app.set('views', path.join(process.env.PWD, 'src', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.env.PWD, 'public')));
app.use(express.json());

app.use('/', router);

app.listen(PORT, () => {
  console.log(PORT, ' port is ON');
});

module.exports = app;
