const express = require('express');
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)

const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const { v4: uuidV4 } = require('uuid')

app.use(express.static('public'))

app.get('/room', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', {roomId: req.params.room })
})

io.on('connection', socket => {
  // When someone attempts to join the room
  socket.on('join-room', (roomId, userId) => {
      socket.join(roomId)  // Join the room
      socket.broadcast.emit('user-connected', userId) // Tell everyone else in the room that we joined
      // Communicate the disconnection
      socket.on('disconnect', () => {
          socket.broadcast.emit('user-disconnected', userId)
      })
  })
})

// Passport Config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
mongoose.connect(
    db,
    { useNewUrlParser: true ,useUnifiedTopology: true}
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, console.log(`Server running on  ${PORT}`));
