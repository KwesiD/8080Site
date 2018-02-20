const core = require('./emulator_core');
const disassembler = require('./disassembler');
const helpers = require('./parseHelpers');
const state = new core.EmulatorState();
const gameData = disassembler.startDisassembly();
const readlineSync = require('readline-sync');


state.loadGame(gameData); //loads game into memory
let count = 0;
let prevcount = 0;
let steps = 0;
let lastInterrupt = Infinity;
let interruptNum = 2;
let saveFile = "";
let saveFileName = "";
//let oldPC;



process.on('message',(data) => {
	if(data === 'loop'){
		runEmulator();
	}
	else{
		let curr;
		switch(data){
			case 'c':
				curr = Number('0x' + state.inputPorts[1]) | 0b00000001;
				state.inputPorts[1] = curr.toString('16'); 
				console.log("inserted count:",state.inputPorts);
				break;
			case '1':
				curr = Number('0x' + state.inputPorts[1]) | 0b00000100;
				state.inputPorts[1] = curr.toString('16'); 
				//console.log("inserted count:",state.inputPorts);
				break;
		}
	}
});

if(process.argv.indexOf('-o') !== -1){
	saveFileName = process.argv[process.argv.indexOf('-o') + 1];
	if(saveFileName === undefined){
		throw "Output file not defined";
	}
}

runEmulator();

function runEmulator(){

	while(Number("0x" + state.PC) < state.memory.length){

			//(d)ebug mode
			if(process.argv.indexOf('-d') !== -1){
				if(count-prevcount === steps){
					while(true){
						steps = readlineSync.question("How many steps?: ");
						if(Number(steps) !== NaN){
							steps = Number(steps);
							prevcount = count;
							break;
						}

					}
				}
			}

			let temppc = Number('0x' + state.PC);
			let opcode;
			let bytes;
		/*	if(state.PC === '0ada'){
				console.log("here");
				//exportImage(state);
				//process.send('loop');
				//break;
				process.exit();
			}*/
			try{
				[opcode,bytes] = helpers.parseInstructions(state.gameFile[Number("0x" + state.PC)]);
			
			}
			catch(e){
				console.log(e);
				console.log('\n\nERROR: ' + state.gameFile[Number("0x" + state.PC)],state.toString());
				process.exit();
			}
			try{
				//keypress(state);
				//oldPC = state.PC;
				core.executeOpcode(opcode,bytes,state);
			}
			catch(e){
				console.log(e);
				console.log('\n\nERROR: ' + opcode,bytes,'\t',state.gameFile[Number("0x" + state.PC)]);
				
				if(process.argv.indexOf('-o') !== -1){
					fs.writeFileSync(saveFileName,saveFile);
				}
				//(c)ontinue even if unimplemented
				if(process.argv.indexOf('-c') === -1){
					process.exit();
				}
			}

			count++;

			
/*
			if(r && state.PC === '0381'){
				process.exit();
			}


			if(!r && state.PC === '0381'){
				r = true;
			}*/


			//(l)og out info
			if(process.argv.indexOf('-l') !== -1){
				//state.printStack(state.SP);
				console.log(count);
				console.log(opcode,bytes,'\t',state.gameFile[temppc],state.toString(),'\n');	
			}



			if(process.argv.indexOf('-o') !== -1){
				saveFile += (opcode,bytes,'\t',state.gameFile[temppc],state.toString(),'\n');
				saveFile += (count) + "\n";
			}

			if(state.interruptsEnabled && lastInterrupt === Infinity){
				lastInterrupt = Date.now(); //only initializes last interrupt once (when lastinterrupt is 0 and interrupts have been just set)
			}

			/**
			Interrupt handler
			**/
			if(((Date.now() - lastInterrupt)/1000.0 > 1.0/60.0) && state.interruptsEnabled){
				interruptNum = (interruptNum%2)+1; //toggle before passing to function
				state.interruptsEnabled = false; //disable interrupts temporarily
				//state.PC = oldPC; //ensures that the emulator returns to the instruction that just ran (rather than returning to the nextPC and skipping that opcode upon return from the interrupt handler
				generateInterrupt(state,interruptNum);
				exportImage(state);
				lastInterrupt = Infinity;//Date.now();
				process.send('loop');
				break;
				
			}


	}
}


function exportImage(state){
	const imageArray = new Array(256*224);
	const len = 256*28;

	for(let i = 0;i < len;i++){
		for(let j = 0;j < 8;j++){
			imageArray[(i*8)+j] = Number(padBytes(Number("0x" + state.memory[i + 0x2400]).toString('2'))[j]);
		}
		//console.log('\n' + (0x2400 + i).toString('16') + '\t' + padBytes(Number("0x" + state.memory[i + 0x2400]).toString('16'),2) + '\n');
	}
	//process.exit();

	process.send(imageArray);
	//console.log(imageArray);
}

function padBytes(bytes,mul=4){
	const pad = (2*mul) - (""+bytes.length); 
	for(let i = 0;i < pad;i++){
		bytes = "0" + bytes; 
	}
	return bytes;
}

function generateInterrupt(state,num){
	//core.rst(state,num); //generate the interrupt	
	core.pushDirect(state,core.splitBytes(state.PC));
	state.PC = padBytes((8 * num).toString('16'),2);

}
