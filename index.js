// import http from "http";
// import {random} from "./feature.js";
// console.log(random());



// const server = http.createServer((req,res) =>{
//     if (req.url === "/about" ){
//         res.end("<h1>ABOUT PAGE</h1>")
//     }
// });

// server.listen(5000,() =>{
//     console.log("server is working");
// })
import fs from 'fs';

import  express  from "express";
import path from "path";
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import Jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName: "backend",
}).then(()=> console.log('database connected')).catch((e)=>console.log(e));

const userschema = new mongoose.Schema({
    name: String,
    email:String,
    password:String,
});

const user = mongoose.model("loginUsers",userschema);


const app = express();


//middleware
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());


// setting up view engine
app.set("view engine","ejs");

const isAuhanticated = async (req,res,next) =>{
    const { token } = req.cookies;
    if(token){

        const decode = Jwt.verify(token,"adaedwqad")
        req.User = await user.findById(decode._id);

        next();

    }
    else{
         res.redirect("login");
    }


};

app.get("/", isAuhanticated, (req,res) =>{
    res.render("logout",{name:req.User.name});
});
app.get("/login", (req,res) =>{
    res.render("login");
});
app.get("/register", (req,res) =>{
    res.render("register");
});
app.post("/login",async(req,res) =>{
    const { email,password } = req.body;

    let User = await user.findOne({ email });

    if(!User) return res.redirect("/register");

    const match = await bcrypt.compare(password, User.password);

    if(!match) return res.render("login", {message: "Incorrect Username/Password"});
    const token = Jwt.sign({_id: User._id}, "adaedwqad");

    res.cookie("token",token,{
        httpOnly: true,
        expires: new Date(Date.now() + 60*100)
    })
    res.redirect("/");
})
app.post("/register",async(req,res)=>{
    const { name,email,password} = req.body;

    let User = await user.findOne({ email });
    if(User){
        return res.redirect("/login");
    }

    const hashpass = await bcrypt.hash(password,10);

    User = await user.create({
        name,
        email,
        password: hashpass,
    });
    
    const token = Jwt.sign({_id: User._id}, "adaedwqad");

    res.cookie("token",token,{
        httpOnly: true,
        expires: new Date(Date.now() + 60*100)
    })
    res.redirect("/");
})
app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.redirect("/");
})




app.listen(5000,()=>{
    console.log('server is working')
});
