


/**
Splits hex data into bytes (Every 2 characters);
**/
function splitBytes(hex){
	const bytes = [];
	if((hex.length%2) !== 0){
		throw "Hex data has odd-numbered length. Invalid data file!!"; 
	}
	for(let i = 0;i < hex.length;i+=2){
		let token = hex[i] + hex[i+1];
		bytes.push(token);
	}
	return bytes;

}

function parseInstructions(instruction){
	//console.log(instruction + "<parsing>");
	//console.log(instruction);
	let tokens = instruction.split('\t');
	let input = tokens[1].split(' ');
	let op = input[0];
	let bytes = input.slice(1,input.length);//tokens[1].slice(1,tokens[1].length);
	return [op,bytes];
}

module.exports = {
	splitBytes:splitBytes,
	parseInstructions:parseInstructions
};