const LocalStrategy   = require('passport-local'),
      bodyParser      = require("body-parser"),
      passport        = require('passport'),
      mongoose        = require("mongoose"),
      express         = require('express'),
      fetch           = require('node-fetch'),
      app             = express();

const util = require('util')


const User = require("./models/user")
const Book = require("./models/book")
const Trade = require("./models/trade")

//======================
//PASSPORT
app.use(require("express-session")({
  secret: "I have fun with this",
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//=========================
//MONGOOSE DB
var url = process.env.DATABASEURLBS || "mongodb://localhost/book-sharing"
mongoose.connect(url);
//===============
//Set up
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  next();
});
//========================

//Routes
app.get('/', function(req,res){

  Book.find({}, function(err, allBooks){

    Trade.find({}, function(err,trades){

      let tradeUserArray = []
      trades.forEach(function(trade){
        tradeUserArray.push(trade.currentOwner_id);
      })

      res.render("index", {books: allBooks, tradeUserArray: tradeUserArray} )

    })
  })
})



//Auth Routes===========================================================

app.get('/register', function(req, res) {
  res.render("register");
});
//sign up logic
app.post("/register", function(req, res) {
  var newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      return res.redirect("/")
    }
    passport.authenticate("local")(req, res, function() {
      res.redirect("/");
    })
  })
});

//login routes
app.get('/login', function(req, res) {
  res.render("login");
});
//using passport middleware
app.post("/login", passport.authenticate("local",
  {
    successRedirect: "/",
    failureRedirect: "/login"
  }), function(req, res) {
});

//logout route
app.get("/logout", function(req, res) {
  req.logout()
  res.redirect("/");
})

//===================================================
//user book
app.get("/mybooks", function(req, res){
  Book.find({user: { id: req.user._id, username: req.user.username }}, function(err, userBooks){
    res.render("userbooks", {books:userBooks})
  })
})

//search for books
app.get("/mybooks/new", function(req, res){
  nothing = []
  res.render("new",{books: nothing})
})

app.post("/mybooks/new", function(req, res){
  const BASE_URL = 'https://www.googleapis.com/books/v1/volumes?q='
    fetch(`${BASE_URL}${req.body.book_title}`, { method: 'GET'})
      .then(res => res.json())
      .then(json => {
        res.render("new", {books: json.items})
      })
      .catch(function(){
        res.redirect("/")
      });
})

//add books
app.post("/mybooks/add", function(req, res){
  let book = JSON.parse(req.body.book);
  let image = ""
  if (book.volumeInfo.imageLinks === undefined) {
    image = "/images/no_photo.jpg"
  } else{
    image = book.volumeInfo.imageLinks.smallThumbnail
  }

  let newBook = {
    title: book.volumeInfo.title,
    image: image,
    previewLink: book.volumeInfo.previewLink,
    user: {
      id: req.user._id,
      username: req.user.username
    }
  }

  Book.create(newBook, function(err, newBook) {
    if (err) {
      console.log(err);
    } else {
      console.log("Book has been added");
    }
  })
  res.redirect("/mybooks");
})

//delete books
app.post("/mybooks/delete", function(req, res){
  let book = JSON.parse(req.body.book)

  Book.findByIdAndRemove(book._id,function(err){
    if (err) {
      console.log(err);
    } else {
      console.log('book deleted');
    }
  })

  res.redirect("/mybooks");
})
//===================================================
//Trade
app.get("/trade", function(req,res){

  Trade.find({}, function(err, tradeRequests){
    res.render("trade", {requests:tradeRequests})
    })
  })

app.post("/trade", function(req,res){
  let book = JSON.parse(req.body.book)
  let requester = {id: req.user.id, username: req.user.username}

  let request = {
    requester:requester,
    currentOwner: book.user,
    currentOwner_id: book._id,
    title: book.title,
    image: book.image,
    previewLink: book.previewLink
  }

  Trade.create(request, function(err,newTrade){
    if (err) {
      console.log(err);
    }else {
      console.log('trade created');
      res.redirect("/");
    }
  })
})

app.post("/trade/approved", function(req,res){
  let request = JSON.parse(req.body.request)

  let bookTransfer = {
    title: request.title,
    image: request.image,
    previewLink: request.previewLink,
    user: {
      id: request.requester.id,
      username: request.requester.username
    }
  }

  Book.create(bookTransfer, function(err, bookTransfer) {
    if (err) {
      console.log(err);
    } else {
      console.log("Book has been added");
    }
  })

  Book.findByIdAndRemove(request.currentOwner_id,function(err) {
    if (err) {
      console.log(err);
    }else {
      console.log('book deleted');
    }
  })



  Trade.findByIdAndRemove(request._id,function(err){
    if (err) {
      console.log(err);
    } else {
      console.log('book deleted');
      res.redirect("/")
    }
  })

})

//===================================================
//edit user information
app.get("/profile/:id", function(req,res){

  User.findById(req.params.id, function(err, foundUser) {
    res.render("profile", {user: foundUser});
  });

})

app.post("/profile/:id", function(req, res) {

  User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser) {
    if (err) {
      res.redirect("/")
    }else {
      res.redirect("/profile/" + req.params.id)
    }
  })

});
//===================================================


app.listen(process.env.PORT || 3000, process.env.IP, function() {
  console.log('Book Sharing app!')
});
