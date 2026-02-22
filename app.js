require('dotenv').config();
const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectDB=require('./config/db')
connectDB();

// mongoos.connect()
//     .then(() => console.log("MongoDB connected successfully"))
//     .catch(error => console.error("MongoDB can't connect", error));

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware to protect routes
function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    // if (!token) return res.status(401).send("You must be logged in");
    if(!token) return res.redirect('/login');
    
    try {
        const data = jwt.verify(token, 'JWT_SECRET_KEY');
        req.user = data;
        next();
    } catch {
        res.status(401).send("Invalid token");
    }
}

app.get('/register', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));

app.post('/register', async (req, res) => {
    let { email, password, username, age } = req.body;
    let user = await userModel.findOne({ email });
    if (user) return res.status(400).send("User already exists");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser = await userModel.create({ username, email, age, password: hashedPassword });
    let token = jwt.sign({ username: newUser.username, userid: newUser._id, email: newUser.email }, 'JWT_SECRET_KEY');
    res.cookie('token', token);
    res.redirect('/profile');
});

app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        let token = jwt.sign({ username: user.username, userid: user._id, email: user.email }, 'JWT_SECRET_KEY');
        res.cookie('token', token);
        res.redirect('/profile');
    } else {
        res.status(401).send("Invalid credentials");
    }
});

app.get('/logout', (req, res) => {
    res.cookie('token', "");
    res.redirect('/login');
});

app.get('/profile', isLoggedIn, async (req, res) => {
    // Populate replaces the IDs in user.posts with the actual post objects
    let user = await userModel.findOne({ email: req.user.email }).populate('posts');
    res.render('profile', { user: user, posts: user.posts });
});

app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    
    let post = await postModel.create({
        user: user._id,
        content: req.body.content
    });

    user.posts.push(post._id);
    await user.save();
    console.log("--- New Post Created ---");
    console.log(post); 
    res.redirect('/profile');
});

app.listen(4000);