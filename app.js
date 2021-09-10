var methodOverride = require("method-override"),
    LocalStrategy  = require("passport-local"),
    blog           = require("./models/blog"),
    User           = require("./models/user"),
    bodyParser     = require("body-parser"),
    passport       = require("passport"),
    mongoose       = require("mongoose"),
    express        = require("express"),
    app            = express();
    server         = require('http').createServer(app),
    io             = require("socket.io")(server);
   
    const path = require('path');
    const http = require('http');
    const formatMessage = require('./utils/messages');
    const {
        userJoin,
        getCurrentUser,
        userLeave,
        getRoomUsers
      } = require('./utils/users');



mongoose.connect("mongodb://localhost/restful_blogApp");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));
const botName = 'Blog chat Bot';


//Passport configuration
app.use(require("express-session")({
    secret: "Manny is the best web developer ever !",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

app.set("view engine", "ejs");

//Socket Config
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
  
      socket.join(user.room);
  
      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to Blog chat!'));
  
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} has joined the chat`)
        );
  
      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    });
  
    // Listen for chatMessage
    socket.on('chatMessage', msg => {
      const user = getCurrentUser(socket.id);
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
  
    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          'message',
          formatMessage(botName, `${user.username} has left the chat`)
        );
  
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }
    });
  });

//Index 
app.get("/",function(req,res){
    res.redirect("/blogs");
}); 

app.get("/blogs",function (req,res){
    blog.find({},function(err,blogs){
        if(err)
        console.log(err);
        else
         res.render("index",{blogs:blogs}); 
    });
   
});

//New blog
app.get("/blogs/new",function(req,res){
    res.render("new");
});

//Create blog
app.post("/blogs",function(req,res){
    blog.create(req.body.blog , function(err,newBlog){
        if(err)
        console.log(err);
        else
        res.redirect("/blogs");
        
    });
});

//Show blog
app.get("/blogs/:id",function(req,res){
    blog.findById(req.params.id,function(err,foundBlog){
        if(err)
        console.log(err);
        else
        res.render("show",{blog:foundBlog});
    });
});

//Edit blog
app.get("/blogs/:id/edit",function(req,res){
    blog.findById(req.params.id,function(err,foundBlog){
        if(err)
        console.log(err);
        else
        res.render("edit",{blog:foundBlog});
    })
});

//Update blog
app.put("/blogs/:id",function(req,res){
    blog.findByIdAndUpdate(req.params.id, req.body.blog , function(err,updatedBlog){
        if(err)
        res.redirect("/blogs");
        else 
        res.redirect("/blogs/"+ req.params.id);
    });
});

//Destroy
app.delete("/blogs/:id",function(req,res){
    blog.findByIdAndRemove(req.params.id,function(err){
        if(err)
        res.redirect("/blogs");
        else
        res.redirect("/blogs");
    });
});



//Register form
app.get("/register", function (req, res) {
    res.render("register");
  });
  
//SignUp Logic
app.post("/register", function (req, res) {
    var newUser = new User({
      username: req.body.username,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    });
    if (req.body.adminCode === "secretCode") {
      newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function (err, user) {
      if (err){
          res.redirect("/register");
          console.log(err);
      }
      passport.authenticate("local")(req, res, function () {
            console.log(user);
            res.redirect("/blogs");
    });
});
});   

//LogIn form
app.get("/login", function (req, res) {
    res.render("login");
  });
  
//LogIn logic
app.post("/login", passport.authenticate("local",
    {
      successRedirect: "/blogs",
      failureRedirect: "/login"
    }), function (req, res) {
    });


//LogOut
app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/blogs");
  });

server.listen("3000", function() {
    console.log("BlogApp server has started");
});