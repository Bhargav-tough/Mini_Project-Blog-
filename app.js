const express = require('express');
const app = express();
const userModel = require('./models/user');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const Port = 3000;


// middleware
function isLoggedIn(req, res, next) {

    let token = req.cookies.token;

    if (!token) {
        return res.send("You need to login");
    }

    let data = jwt.verify(token, "shhhhhh");

    req.user = data;

    next();
}


app.get('/', (req, res) => {
    res.render("index");
});


app.get('/login', (req, res) => {
    res.render("login");
});


// register
app.post('/register', async (req, res) => {

    const { username, name, age, email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (user) {
        return res.status(500).send("User already exists");
    }

    bcrypt.genSalt(10, function(err, salt) {

        bcrypt.hash(password, salt, async function(err, hash) {

            let user = await userModel.create({
                username,
                name,
                age,
                email,
                password: hash
            });

            let token = jwt.sign(
                {
                    email: email,
                    username: user._id
                },
                "shhhhhh"
            );

            res.cookie("token", token);
            res.send("Registered Successfully");

        });

    });

});


// login
app.post('/login', async (req, res) => {

    const { email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) {
        return res.status(500).send("User does not exist");
    }

    bcrypt.compare(password, user.password, function(err, result) {

        if (result) {

            let token = jwt.sign(
                {
                    email: email,
                    username: user._id
                },
                "shhhhhh"
            );

            res.cookie("token", token);
            res.redirect("/profile")

        } 
        else {
            res.status(500).send("Invalid Credentials");
        }

    });

});


// profile with middleware
app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
console.log(user);
    res.render("profile", { user });
});

// logout
app.get('/logout', (req, res) => {

    res.cookie("token", "");

    res.send("Logged out Successfully");

});


app.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
});