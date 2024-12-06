var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

const app = express();

app.set('view engine', 'hbs');

app.get('/', (req, res) => {
  res.render('login');
});
app.get('/signup', (req, res) => {
  res.render('signup');
});
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Event Planner', message: 'Welcome to the Event Planner!' });
});

module.exports = router;
