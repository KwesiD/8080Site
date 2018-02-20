//express setup
const express = require('express');
const path = require("path");
const bodyParser = require('body-parser');
const app = express();
const publicPath = path.resolve(__dirname, "public");
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(publicPath));



const hash = require('./hash');
//hash
app.use('/login',hash.hash);
app.use('/register',hash.hash);


app.get('/',function(req,res){
	res.redirect("/home");
});	

app.get('/home',function(req,res){
	res.render("home");
});	

app.get('/login',function(req,res){
	res.render("login");
});	

app.get('/register',function(req,res){
	res.render("register");
});	

app.post('/register',function(req,res){
	let user = req.body.username; 
	let pass = req.body.password; //passwords hashed by middleware
	let passConfirm = req.body.passwordConfirm;
	let blankPass = hash.SHA256("");
	let errors = {userExists:false,passMismatch:false,registrationComplete:false};
	if(pass !== passConfirm){ //password not retyped correctly
		errors.passMismatch = true; 
	}
	UserModel.findOne({username:user},(err,result) => {
		if(result === null){
			const newUser = new UserModel({username:user},tokens:0,games:[],features:[]});
			user.save(() => {
				errors.registrationComplete = true;
				res.render('register',errors);
			});
		}
		else{
			errors.userExists = true;
			res.render('register',errors);
		}
	});

});

app.post('/login',function(req,res){
	let user = req.body.username; 
	let pass = req.body.password; //passwords hashed by middleware

	res.render('login');
});





app.listen(3000);