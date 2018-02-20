const mongoose = require('mongoose');
const fs = require('fs');

const score = new mongoose.Schema({
  username: String,
  score: Number,
  hash:  String,
  date: Date,
  game:  String
});


const global_score = new mongoose.Schema({
  username: String,
  score: Number,
  date: Date,
  game: String,
  country: String
});

const Addon = new mongoose.Schema({
  name: String,
  cost: Number,
  purchased: Boolean,
  image: String,
  type: String
});

const User = new mongoose.Schema({
  username: String,
  country: String,
  password:  String,
  tokens: Number,
  fbid: String,
  games:  [Addon],
  features: [Addon],
  friends: [],
  friendRequests: []
});



function setup(){
  mongoose.model('Addon', Addon);
  mongoose.model('User',User);
  let cred;
  let username;
  let password;
  if(process.env.NODE_ENV === 'PRODUCTION'){
     cred = JSON.parse(fs.readFileSync('config.json', 'utf8'));
     username = cred.username;
     password = cred.password;
      mongoose.connect('mongodb://' + username + ':' + password + '@class-mongodb.cims.nyu.edu/' + username);
      //console.log('mongodb://' + username + ':' + password + '@class-mongodb.cims.nyu.edu/' + username)
  }
  else{
    mongoose.connect('mongodb://localhost/arcade');
  }

  //connection

}


module.exports = {setup:setup};