
//general setup
const fs = require('fs');
const uuid = require('node-uuid');
const hash = require('./hash');
const url = require('url');
const { fork } = require('child_process');
const http = require('http');
let countries;
let countryCodes = {};

fs.readFile('countries.txt',(err,data) => {
	countries = (data+"").split('\n');
	countries = countries.map((line) =>{
		line = line.split(":");
		line[0] = line[0].trim().toLowerCase();
		line[1] = line[1].substring(1,line[1].length-1);
		countryCodes[line[1]] = line[0];
		return {name:line[1],code:line[0]};
	});
	//console.log(countries);
});

//express setup
const express = require('express');
const path = require("path");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const publicPath = path.resolve(__dirname, "public");

//sockets setup
const server = http.createServer(app);
const io = require('socket.io')(server);

//mongo setup
const mongoose = require('mongoose');
const db = require('./db');
db.setup();

////creating mongoose models
const AddonModel = mongoose.model('Addon');
const UserModel = mongoose.model('User');

//setting up middleware
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(handleCookie);
app.use(express.static(publicPath));
app.use('/login',hash.hash);
app.use('/register',hash.hash);

//session management
const sessions = {};
const loggedUsers = [];
const recentPlays = [];




/*//Drop db for testing
AddonModel.remove({});
UserModel.remove({});
let invadersGame;
AddonModel.findOne({name:"Space Invaders"},function(err,result){
	if(result === null){
		invadersGame = new AddonModel({name:"Space Invaders",cost:0,purchased:true,image:"invaders.jpg",type:"game"});
		invadersGame.save();
		new AddonModel({name:"Balloon Bomber",cost:120,purchased:false,image:"balloon.jpg",type:"game"}).save();
		new AddonModel({name:"Create Tournaments",cost:200,purchased:false,image:"tournament.jpg",type:"feature"}).save();
		new AddonModel({name:"Multiplayer",cost:300,purchased:false,image:"multiplayer.png",type:"feature"}).save();

	}
	invadersGame = result;
});

*/

app.get('/',function(req,res){
	res.redirect("/home");
});	

app.get('/home',function(req,res){
	res.render("home",{recentPlays:recentPlays});
});	

app.get('/login',function(req,res){
	let session = req.cookies.session;
	if(session){
		if(sessions[session.id] !== undefined){
			res.redirect("profile");
		}
		else{
			res.render("login");
		}
	}
	else{
		res.render("login");
	}
});	

app.get('/register',function(req,res){
	let session = req.cookies.session;
	if(session){
		if(sessions[session.id] !== undefined){
			res.redirect("profile");
		}
		else{
			res.render("register",{countries:countries});
		}
	}
	else{
		res.render("register",{countries:countries});
	}
});	

app.post('/register',function(req,res){
	let user = req.body.username.trim(); 
	let pass = req.body.password; //passwords hashed by middleware
	let passConfirm = req.body.passwordConfirm;
	let country = req.body.countries;
	//console.log(country);
	let errors = {
		userExists:false,passMismatch:false,registrationComplete:false,
		emptyUser:false,emptyPass:false,emptyConfirm:false
	};


	let blankPass = hash.SHA256("");

	if(user === "" || user === undefined){
		errors.emptyUser = true;
	}
	if(pass === blankPass || pass === undefined){
		errors.emptyPass = true;
	}
	if(passConfirm === blankPass || passConfirm === undefined){
		errors.emptyConfirm = true;
	}

	if(errors.emptyUser || errors.emptyPass || errors.emptyConfirm){
		res.render('register',{errors:errors,countries:countries});
	}
	else if(pass !== passConfirm){ //password not retyped correctly
		errors.passMismatch = true; 
		res.render('register',{errors:errors,countries:countries});
	}
	else{
		UserModel.findOne({username:user},(err,result) => {
			if(result === null){
				const newUser = new UserModel({username:user,password:pass,tokens:0,country:country,games:[],features:[],friends:[],friendRequests:[]});
				newUser.save(() => {
					errors.registrationComplete = true;
					res.render('register',{errors:errors,countries:countries});
				});
			}
			else{
				errors.userExists = true;
				res.render('register',{errors:errors,countries:countries});
			}
		});
	}

});


app.post('/login',function(req,res){
	let user = req.body.username;
	let pass = req.body.password; //passwords hashed by middleware
	let blankPass = hash.SHA256("");
	const errors = {emptyUser:false,emptyPass:false,userNotFound:false,wrongPass:false};
	if(pass === blankPass || pass === undefined){
		errors.emptyPass = true;
	}
	if(user === ""){
		errors.emptyUser = true;
	}
	if(errors.emptyPass || errors.emptyUser){
		res.render('login',{errors});
	}
	else{
		UserModel.findOne({username:user},(err,result) => {
			//console.log(result)
			if(err){
				console.log(err);
			}
			else{
				if(result === null){
					errors.userNotFound = true;
					res.render('login',{errors});
				}
				else if(result.password != pass){
					errors.wrongPass = true;
					res.render('login',{errors});
				}
				else if(result.username === user && result.password === pass){
			
					//set cookie
					let rand = uuid.v4();
					res.cookie('session',{id:rand}, { maxAge: 900000, httpOnly: true });
					sessions[rand] = {loggedIn:true,user:result};

					res.redirect('profile');
				}
			}
		});
	}


	//res.render('login');
});

app.get('/register/fblogin',function(req,res){
	let session = req.cookies.session;
	if(session){
		if(sessions[session.id] !== undefined){
			let currUser = sessions[session.id].user;
			res.redirect("/profile");
		}
		else{
			res.render('fbreg',{countries:countries});
		}
	}
	else{
		res.render('fbreg',{countries:countries});
	}
});


app.post('/register/fblogin',function(req,res){
	let fbid = req.query.id;//req.body.fbid;
	//let name = req.body.name;
	let user = req.body.username.trim(); 
	let country = req.body.countries;
	let errors = {userFound:false,emptyUser:false,idFound:false};
	//console.log(fbid,name,req.body,"reg");
	if(user === ""){
		errors.emptyUser = true;
		res.render('fbreg',{errors:errors,countries:countries});	
	}
	else{
		UserModel.findOne({fbid:fbid},(err,fbuser) => {
			if(fbuser === null){
				UserModel.findOne({username:user},(err,result) => {
					if(err){
						console.log(err);
					}
					else{
						if(result === null){
							const newUser = new UserModel({username:user,tokens:0,fbid:fbid,country:country,games:[],features:[],friends:[],friendRequests:[]});
							newUser.save((err,createdUser) => {
								if(err){
									console.log(err);
								}
								else{
									//set cookie
									let rand = uuid.v4();
									res.cookie('session',{id:rand}, { maxAge: 900000, httpOnly: true });
									sessions[rand] = {loggedIn:true,user:createdUser};
									//console.log(createdUser);
									res.redirect('/profile');
								}
							});		

						}
						else{
							errors.userFound = true;
							res.render('fbreg',{errors:errors,countries:countries});
						}
					}	
				});
			}
			else{
				errors.idFound = true;
				res.render('fbreg',{errors:errors,countries:countries});
			}
		});
	}


	//res.redirect('/login');
});

app.get('/login/fblogin',function(req,res){
	
});

app.post('/login/fblogin',function(req,res){
	let fbid = req.body.fbid;
	let name = req.body.name;
	//console.log(fbid,name,"login/fblogin");
	let errors = {notFound:false};
	UserModel.findOne({fbid:fbid},(err,result) => {
		if(err){
			console.log(err);
		}
		else{
			if(result === null){
				//go to fbregister
				console.log(result);
				res.redirect("/register/fblogin?id="+fbid);
			}
			else{
			//set cookie
				
				let rand = uuid.v4();
				res.cookie('session',{id:rand}, { maxAge: 900000, httpOnly: true });
				sessions[rand] = {loggedIn:true,user:result,fbid:fbid};

				res.redirect('/profile');
			}
		}
	});
});


app.get("/profile",function(req,res){
	let session = req.cookies.session;
	if(session){
		if(sessions[session.id] !== undefined){
		
			let currUser = sessions[session.id].user;
			let states = {notFound:false,haveRequest:false,haveTokens:false};
			if(currUser.friendRequests.length !== 0){
				states.haveRequest = true;
			}
			if(currUser.tokens > 0){
					states.haveTokens = true;
				}
			//console.log(currUser,states);
			res.render("profile",{states:states,friendRequests:currUser.friendRequests,friends:currUser.friends,user:currUser,countrycode:countryCodes[currUser.country],states:states});
		}
		else{
			res.redirect("login");
		}
	}
	else{
		res.redirect("login");
	}

});

app.post("/profile",function(req,res){
	let session = req.cookies.session;
	let user = sessions[session.id].user;
	let states = {notFound:false,haveRequest:false,friendSelf:false};
	if(user.friendRequests.length !== 0){
		states.haveRequest = true;
	}
	if(req.body.type === "request"){
		let friend = req.body.friendName;
		//console.log(friend);
		UserModel.findOne({username:friend},(err,result) => {
			if(err){
				console.log(err);
			}
			else if(result){
				if(result.username === user.username){
					states.friendSelf = true;
					res.render('profile',{states:states,friendRequests:user.friendRequests,friends:user.friends,user:user,countrycode:countryCodes[user.country]});

				}
				else{
					result.friendRequests.push({requestor:user});
					result.save();
					//console.log(result);
					res.redirect('/profile');
				}
			}
			else{
				states.notFound = true;
				res.render('profile',{states:states,friendRequests:user.friendRequests,friends:user.friends,user:user,countrycode:countryCodes[user.country]});
			}
		});
	}
	else if(req.body.type === "acceptreject"){
		if(req.body.buttonType === 'accept'){
			let newFriend = user.friendRequests.filter((requestor) =>{return (requestor.requestor.username === req.body.requestor)});
			console.log(newFriend[0].requestor);
			user.friends.push(newFriend[0].requestor);
			user.friendRequests = user.friendRequests.filter((requestor) =>{return requestor.requestor.username !== req.body.requestor});
			UserModel.findOne({username:user.username},(err,results) => {
				results.friends.push(newFriend[0].requestor);
				results.friendRequests = user.friendRequests.filter((requestor) =>{return requestor.requestor.username !== req.body.requestor});
				results.save();
				sessions[session.id].user = results;
			});
			UserModel.findOne({username:newFriend[0].requestor.username},(err,results) => {
				results.friends.push(user);
				results.save();
			});
			//console.log(user.friends);
			res.redirect('/profile');
		}
		else{
			user.friendRequests = user.friendRequests.filter((requestor) =>{return requestor.requestor.username !== req.body.requestor});
			user.save();
			sessions[session.id].user = user;
			res.redirect('/profile');
		}
	}
	else if(req.body.type === 'tokens'){
		UserModel.findOne({username:user.username},(err,results) => {
			results.tokens += 480;
			sessions[session.id].user = results;
			results.save();
		});
		res.redirect('/profile');
	}
});


app.get('/logout',function(req,res){
	let session = req.cookies.session;
	res.clearCookie('session');
	if(session){
		if(sessions[session.id] !== undefined){
			sessions[session.id] = undefined; //clear cookie
			res.render('logout');
		}
		else{
			res.redirect("/home");
		}
	}
	else{
		res.redirect("/home");
	}
});

app.get('/invaders',function(req,res){
	let session = req.cookies.session;
	console.log(session);
	if(session){
		if(sessions[session.id] !== undefined){
			let query = req.query.id;
			if(query === undefined){
				res.redirect('/invaders?id='+sessions[session.id].user.id);
			}
			else{
			/*	let urlobj = url.parse(req.originalUrl);
				urlobj.protocol = req.protocol;
				urlobj.host = req.get('host');
				let requrl = url.format(urlobj);
			//	console.log(requrl)
				updateRecentPlays(sessions[session.id].user);
				console.log(urlobj);*/
				res.render('invaders');

			}
		}
		else{
			res.redirect("/login");
		}
	}
	else{
		res.redirect("/login");
	}

});

/*function getSessionByUserId(id){
	let session;
	Object.keys(sessions).forEach((key) => {
		if(sessions[key].user.id === id){
			session = sessions[key];
		}
	});
	return session;
}*/


io.sockets.on('connection',function connection(socket) {
	//console.log('connected to socket');
	let gameUrl = socket.handshake.headers.referer
	//let session = getSessionByUserId(gameUrl.split("=")[1]);
	//console.log(socket.handshake.headers);
	if(gameUrl.indexOf('/invaders') !== -1){
		//session.socketId = socket.id;
		//console.log(socket.id);
		socket.join('room'+socket.id)
		let emulator = fork('emulator.js',["invaders"]);
		emulator.on('message',(data) => {
			if(data === 'loop'){
				emulator.send('loop');
			}
			else{
				io.to("room"+socket.id).emit('private',data);
			}
		});

		//socket.emit('private','You\'re connected!');
		socket.on('private',(data) => {
			//console.log(data);
			if(!data.msg){
				console.log("Server: " + data);
				emulator.send(data);
			}
		});

		socket.on('disconnect',function(){
			//console.log("disconnected");
			emulator.kill('SIGINT');
		});
		//socket.emit('private',arr)
	}

});



/*
app.get('/tournaments',function(req,res){
	UserModel.findOne({},function(err,result){
		let enabled = false;
		if(result.features){
			result.features.forEach((feature) => {
				if(feature.name === "Create Tournaments"){
					enabled = true;
				}
			});
			
		}
		res.render("tournament",{enabled:enabled});

	});
});	

app.post('/tournaments',function(req,res){

	let style = req.body.style;
	let participants = req.body.participants;
	let friends = req.body.friends;
	let created = false;
	let error = {style:false,participants:false,friends:false};
	UserModel.findOne({},function(err,result){
		let enabled = false;
		if(result.features){
			result.features.forEach((feature) => {
				if(feature.name === "Create Tournaments"){
					enabled = true;
				}
			});
			
		}
		if(style === undefined){
			error.style = true;
		}
		if(participants === '0'){
				error.participants = true;
		}
		if(friends === undefined){
				error.friends = true;
		}
		if(style && participants && friends){
			created = true;
			//create tournament here
		}
		res.render("tournament",{error:error,enabled:enabled,created:created});
	});


});



app.get('/sample',function(req,res){
	UserModel.findOne({},function(err,result){
		if(result === null){
			const user = new UserModel({username:"CSCI",tokens:1000,country:"USA",games:[invadersGame],features:[]});
			user.save(function(){
				AddonModel.find({},function(err,results){
					const games = results.filter((element) => {
						return element.type === "game";
					});
					const features = results.filter((element) => {
						return element.type === "feature";
					});
					res.render("sample",{user:user,games:games,features:features});
				});

			});
		}
		else{
			AddonModel.find({},function(err,results){
				const games = results.filter((element) => {
					return element.type === "game";
				});
				const features = results.filter((element) => {
					return element.type === "feature";
				});
				res.render("sample",{user:result,games:games,features:features});
			});
		}
	});
});

app.post('/sample',function(req,res){
	//console.log(req.body);
	const ids = req.body.select;
	const userTokens = req.body.tokens;
	const error = {tokenError:false,noPurchase:false};
	if(ids === undefined){
		error.noPurchase = true;
		UserModel.findOne({_id:req.body.userid},function(err,user){
			AddonModel.find({},function(err,results){
				const games = results.filter((element) => {
					return element.type === "game";
				});
				const features = results.filter((element) => {
					return element.type === "feature";
				});
				res.render("sample",{user:user,games:games,features:features,error:error});
			});
		});
	}
	else{
		AddonModel.find({},function(err,results){
			const addons = results.filter((result) => {
				//console.log(result);
				return ids.includes(result._id);
			});
			let total = 0;
			let featureList = [];
			addons.forEach((addon) => {
				total += addon.cost;
				featureList.push(addon);
			});
			//console.log(total);
			UserModel.findOne({_id:req.body.userid},function(err,user){
				featureList.forEach((f) => {
					user.features.push(f);
				});
				user.save();
				if(total > userTokens){
					error.tokenError = true;
					AddonModel.find({},function(err,results){
						const games = results.filter((element) => {
							return element.type === "game";
						});
						const features = results.filter((element) => {
							return element.type === "feature";
						});

						res.render("sample",{user:user,games:games,features:features,error:error});
					});
				}
				else{
					user.tokens -= total;
					addons.forEach((addon) => {
							addon.purchased = true;
							addon.save();
					});
					user.save(function(){
						AddonModel.find({},function(err,results){
							const games = results.filter((element) => {
								return element.type === "game";
							});
							const features = results.filter((element) => {
								return element.type === "feature";
							});
							res.render("sample",{user:user,games:games,features:features,error:error});
						});
					});
				}
			});
		});
	}
});

*/



/*function handleCookie(req,res,next){
	let cookie = req.cookies.cookieName;
	if (cookie !== undefined){

	}

	next();
}
*/

function updateUser(req,res,next){
	let cookie = req.cookies
	if(cookie && cookie.session){
		session = cookie.session;
		if(sessions[session.id] !== undefined){
			UserModel.findOne({username:user.username},(err,result) => {
				if(result){
					sessions[session.id].user = result;
				}
			});
		}
	}
	next();
}


function updateRecentPlays(user){
	/*if(recentPlays.indexOf(user) === -1){
		recentPlays.push(user);
	}*/
	recentPlays.push(user);
	if(recentPlays.length > 10){
		recentPlays = recentPlays.slice(1,11);
	}
}

server.listen(process.env.PORT || 3000);