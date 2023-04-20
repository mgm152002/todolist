const express = require("express");
require('dotenv').config()
const bodyParser = require("body-parser");
const date = require(__dirname+"/date.js");
const mongoose = require("mongoose");
var _ = require('lodash');
mongoose.connect(process.env.Mongo);
const bcrypt = require('bcrypt');
const saltRounds = 10;
var cookie = require('cookie');

var jwt = require('jsonwebtoken');


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const listSchema={
  name:String
};

const Userschema={
  email:{type:String,required:true},
  password:String,
  todolist:[listSchema]
}
const day = "Today";

const listModel=new mongoose.model("list",listSchema);
const userModel=new mongoose.model("user",Userschema);


app.post("/signup",async function(req,res){
  const found= await userModel.findOne({email:req.body.email});
  if(found){
      res.redirect("/login");
  }
  else{
      const hash= bcrypt.hashSync(req.body.password, saltRounds);
      const user=new userModel({
          email:req.body.email,
          password:hash

      })
      const token = jwt.sign(
          { user_id: user._id},
          process.env.TOKEN_KEY,
          {
            expiresIn: "1h",
          }
        );
        
        
        var setCookie=cookie.serialize('jwtToken', token,{
          httpOnly: true,
          maxAge: 60 * 60 // 1 hour
      });
       res.setHeader('Set-Cookie', setCookie);//used to send cookie to client

      try{
          await user.save()
          
          res.redirect("/list")
      }
      catch(err){
          res.json(err)
      }
  }
})


app.get("/list", function(req, res){
  var cookies = cookie.parse(req.headers.cookie || '');
  jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {
  
  
  userModel.findOne({_id:decoded.user_id},function(err,docs){
    
      if(!docs)
      {
        res.send("create an account first");
      }
      else
      {
        const todolists=docs.todolist
        const title=docs.email
        res.render("list",{todo:todolists,title:title})
      }
   
    
});
  })
})

  app.post("/login",async function(req,res){
    const found= await userModel.findOne({email:req.body.email})
    if(found){
        const pass=found.password
        bcrypt.compare(req.body.password, pass, function(err, result) {
            if(result==true){
                const token = jwt.sign(
                    { user_id: found._id },
                    process.env.TOKEN_KEY,
                    {
                      expiresIn: "1h",
                    }
                  );
                 
                  
                  var setCookie=cookie.serialize('jwtToken', token,{
                    httpOnly: true,
                    maxAge: 60 * 60 // 1 hour
                });
                  res.setHeader('Set-Cookie', setCookie);//used to send cookie to client
                
                res.redirect("/list")
            }
            else if(result==false){
                res.send("password incorrect");
            }
            else{
                res.send(err);
            }})
    }
    else{
        // res.redirect('/adminsignup');
        res.send("signup first")
    }})
  
app.post("/list",function(req,res){
  
  
  var cookies = cookie.parse(req.headers.cookie || '');
  jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {
    
  if(!err){
    var item =req.body.todo;
  
  const newItem = new listModel({
    name:item
  })
    userModel.findOne({_id:decoded.user_id},async function(err,docs){
    
      if(!docs)
      {
        res.send("no account");
      }
      else
      {
       docs.todolist.push(newItem)
       await docs.save()
       res.redirect("/list")
      }
   
    
});

  }
  else{
    res.send("need auth")
  }
  
  
  })


  
  
})
app.post("/delete",function(req,res){
  var cookies = cookie.parse(req.headers.cookie || '');
  jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {

    if(!err){

      const deleteId= req.body.checkbox ;
      const filter=({_id:decoded.user_id})
      const update={$pull:{todolist:{_id:deleteId}}}
      const foun=await userModel.findOneAndUpdate(filter,update,{new:true})
      res.redirect("/list")
 
   
  

  }
  else{
    res.send("need auth")
  }
  
});
})

app.get("/signup",function(req,res){
  res.render('signup')
})
app.get("/login",function(req,res){
  res.render('login')
})

app.get("/",function(req,res){
  res.render("home")
})

app.get("/about",function(req,res){
  res.render('about');
})
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
