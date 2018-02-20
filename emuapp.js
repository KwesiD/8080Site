const fs = require('fs')
const express = require('express');
const http = require('http');
const path = require("path");
const bodyParser = require('body-parser');
const app = express();
const publicPath = path.resolve(__dirname, "public");
const server = http.createServer(app);
const io = require('socket.io')(server);
const { fork } = require('child_process');
const emulator = fork('emulator.js',process.argv.slice(2,process.argv.length));

let arr;
emulator.on('message',(data) => {
	if(data === 'loop'){
		emulator.send('loop');
	}
	else{
		//console.log('logged');
		arr = data;
		io.sockets.emit('private',arr);
	}
});


app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(publicPath));




app.get('/',function(req,res){
	res.sendFile(path.join(__dirname, '/public','site.html'));
});


io.on('connection',function connection(socket) {
	console.log('connected');
	//socket.emit('private','You\'re connected!');
	socket.on('key',(data) => {
		//console.log(data);
		if(!data.msg){
			console.log("Server: " + data);
			emulator.send(data);
		}
	});
	socket.emit('private',arr)

});

server.listen(3000);
