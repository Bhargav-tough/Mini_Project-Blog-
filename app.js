const express = require('express');
const app = express();

const userModel = require('./models/user');
const postModel = require('./models/post');

const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { upload } = require('./config/multerconfig');


app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(cookieParser());
app.use(express.static('public'));



const Port = 3000;
const JWT_SECRET = "shhhhhh";




// Middleware

function isLoggedIn(req,res,next){


    let token = req.cookies.token;


    if(!token){

        return res.redirect("/login");

    }


    try{

        let data = jwt.verify(token,JWT_SECRET);

        req.user = data;

        next();

    }
    catch(err){

        res.redirect("/login");

    }

}
app.get('/profileupload',isLoggedIn,(req,res)=>{

    res.render("profileupload");

});


app.post('/profileupload',
isLoggedIn,
upload.single('image'),
async(req,res)=>{


    console.log(req.file);


    let user = await userModel.findOne({
        email:req.user.email
    });


    if(req.file){

        user.profilepic = req.file.filename;

    }


    await user.save();


    res.redirect("/profile");

});

app.get('/',(req,res)=>{

    res.render("index");

});







// Login Page

app.get('/login',(req,res)=>{

    res.render("login");

});







// Register

app.post('/register',async(req,res)=>{


    const {
        username,
        name,
        age,
        email,
        password
    } = req.body;



    let existUser = await userModel.findOne({email});



    if(existUser){

        return res.send("User already exists");

    }



    let salt = await bcrypt.genSalt(10);


    let hash = await bcrypt.hash(password,salt);



    let user = await userModel.create({

        username,
        name,
        age,
        email,
        password:hash

    });




    let token = jwt.sign({

        email:user.email,
        id:user._id

    },JWT_SECRET);




    res.cookie("token",token);


    res.redirect("/profile");


});









// Login

app.post('/login',async(req,res)=>{


    const {
        email,
        password
    } = req.body;



    let user = await userModel.findOne({email});



    if(!user){

        return res.send("User not found");

    }




    let result = await bcrypt.compare(
        password,
        user.password
    );



    if(result){


        let token = jwt.sign({

            email:user.email,
            id:user._id

        },JWT_SECRET);



        res.cookie("token",token);


        res.redirect("/profile");


    }
    else{

        res.send("Wrong Password");

    }



});









// Profile

app.get('/profile',isLoggedIn,async(req,res)=>{


    let user = await userModel
    .findOne({
        email:req.user.email
    })
    .populate("posts");



    res.render("profile",{

        user,
        posts:user.posts

    });



});








// Create Post

app.post('/post',isLoggedIn,async(req,res)=>{


    let user = await userModel.findOne({

        email:req.user.email

    });



    let post = await postModel.create({

        user:user._id,

        content:req.body.content

    });



    user.posts.push(post._id);



    await user.save();



    res.redirect("/profile");


});









// Like / Unlike

app.get('/like/:id',isLoggedIn,async(req,res)=>{


    let post = await postModel.findById(req.params.id);



    if(!post.likes){

        post.likes=[];

    }



    // if already liked remove

    if(post.likes.includes(req.user.id)){


        post.likes = post.likes.filter(

            id => id.toString() !== req.user.id

        );


    }


    // else add like

    else{


        post.likes.push(req.user.id);


    }



    await post.save();



    res.redirect("/profile");


});









// Edit Page

app.get('/edit/:id',isLoggedIn,async(req,res)=>{


    let post = await postModel.findById(req.params.id);



    res.render("edit",{

        post

    });



});









// Update Post

app.post('/update/:id',isLoggedIn,async(req,res)=>{


    await postModel.findByIdAndUpdate(

        req.params.id,

        {

            content:req.body.content

        }

    );



    res.redirect("/profile");


});









// Delete Post

app.get('/delete/:id',isLoggedIn,async(req,res)=>{


    let post = await postModel.findById(req.params.id);



    await postModel.findByIdAndDelete(req.params.id);



    await userModel.findByIdAndUpdate(

        post.user,

        {

            $pull:{
                posts:req.params.id
            }

        }

    );



    res.redirect("/profile");


});









// Logout

app.get('/logout',(req,res)=>{


    res.clearCookie("token");


    res.redirect("/login");


});









app.listen(Port,()=>{

    console.log(`Server running on port ${Port}`);

});