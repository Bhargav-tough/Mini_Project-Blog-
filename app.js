const express = require('express');
const app = express();

const userModel = require('./models/user');
const postModel = require('./models/post');

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
        return res.redirect("/login");
    }

    let data = jwt.verify(token, "shhhhhh");

    req.user = data;

    next();
}


// Home
app.get('/', (req, res) => {
    res.render("index");
});


// Login page
app.get('/login', (req, res) => {
    res.render("login");
});



// Register

app.post('/register', async (req,res)=>{

    const {username,name,age,email,password}=req.body;


    let existUser = await userModel.findOne({email});

    if(existUser){
        return res.send("User already exists");
    }


    bcrypt.genSalt(10,(err,salt)=>{

        bcrypt.hash(password,salt,async(err,hash)=>{


            let user = await userModel.create({

                username,
                name,
                age,
                email,
                password:hash

            });



            let token = jwt.sign({

                email:user.email,
                username:user._id

            },
            "shhhhhh");


            res.cookie("token",token);

            res.redirect("/profile");

        });

    });

});




// Login

app.post('/login',async(req,res)=>{


    const {email,password}=req.body;


    let user = await userModel.findOne({email});


    if(!user){
        return res.send("User not found");
    }



    bcrypt.compare(password,user.password,(err,result)=>{


        if(result){


            let token = jwt.sign({

                email:user.email,
                username:user._id

            },
            "shhhhhh");


            res.cookie("token",token);

            res.redirect("/profile");


        }
        else{

            res.send("Wrong Password");

        }

    });


});





// Profile

app.get('/profile',isLoggedIn,async(req,res)=>{


    let user = await userModel
    .findOne({email:req.user.email})
    .populate("posts");


    res.render("profile",{user});


});






// Create Post

app.post('/post', isLoggedIn, async (req, res) => {

    let user = await userModel.findOne({
        email: req.user.email
    });

    let { content } = req.body;


    let post = await postModel.create({
        user: user._id,
        content: content
    });


    // if posts array doesn't exist, create it
    if (!user.posts) {
        user.posts = [];
    }


    user.posts.push(post._id);

    await user.save();


    res.redirect('/profile');

});



// Logout

app.get('/logout',(req,res)=>{


    res.cookie("token","");

    res.redirect("/login");


});





app.listen(Port,()=>{

    console.log(`Server running on port ${Port}`);

});