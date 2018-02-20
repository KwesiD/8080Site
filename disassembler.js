

const buffer = require('buffer');
const helpers = require('./parseHelpers'); //loads helper methods
const fs = require('fs');
const opcodeTable = JSON.parse(fs.readFileSync('./opcodes.json', 'utf8')); //loads opcode table

function startDisassembly(){
	console.log("Loading OpCodes");
	

	console.log("Loading game rom");
	if(process.argv.length < 3){
		throw "No file found!";
	}
	
	const data = fs.readFileSync(__dirname + "/" + process.argv[2]);
	let hex = (new Buffer(data,'utf8')).toString('hex');
	hex = helpers.splitBytes(hex); //parse data to array of bytes
	//const dump = disassemble(hex);  //disassemble file
	let pc = 0; //program counter
	const romSize = hex.length;
	const gameData = [];
	while(pc < romSize){
		pc += disassemble(hex,pc,gameData);
	}

	return gameData;
}


function disassemble(hexdump,pc,gameData){
	//console.log('Disassembling file');
	let ele = hexdump[pc]; //current element
	let line = pc.toString(16) + "\t" + ele + " ";
	let opbytes = parseInt(opcodeTable[ele].size);
	switch(parseInt(opcodeTable[ele].size)){
		case 1:
			line +=  "\t" + opcodeTable[ele].name + "\n";
			break;
		case 2:
			line +=  hexdump[pc+1] + "\t" +  opcodeTable[ele].name + " " + hexdump[pc+1] + '\n';
			break;
		case 3:
			line +=  hexdump[pc+1] + " " + hexdump[pc+2] + "\t" + opcodeTable[ele].name + " " + hexdump[pc+2] + "" + hexdump[pc+1] + '\n';
			break;
		default:
			opbytes = 1;
	}
	

	//console.log(line);
	gameData.push(line); //push the line into the game data
	//console.log(line);

	
	/*console.log("Saving disassembly....");
	fs.writeFile('dump.disassembled',disassembledDump,(error) => {
		if(error){
			console.log(error);
			throw "Error saving file!";
		}
		console.log("File saved!");
	});*/
	return opbytes;
	
}


module.exports = {
	startDisassembly:startDisassembly
};