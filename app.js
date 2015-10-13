var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(80);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var deerusers = [];

io.sockets.on('connection', function(socket) {
  //new user login
  socket.on('login', function(nickname) {
    if (deerusers.indexOf(nickname) > -1) {
      socket.emit('nickExisted');
    } else {
      socket.userIndex = deerusers.length;
      socket.nickname = nickname;
      deerusers.push(nickname);
      socket.emit('loginSuccess');
      io.sockets.emit('system', nickname, deerusers.length, 'login');
    };
  });
  //user leaves
  socket.on('disconnect', function() {
    deerusers.splice(socket.userIndex, 1);
    socket.broadcast.emit('system', socket.nickname, deerusers.length, 'logout');
  });
  //new message get
  socket.on('postMsg', function(msg, color) {
    socket.broadcast.emit('newMsg', socket.nickname, msg, color);
  });
  //new image get
  socket.on('img', function(imgData, color) {
    socket.broadcast.emit('newImg', socket.nickname, imgData, color);
  });
});

module.exports = app;
