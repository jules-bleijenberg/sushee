let inputs = [];
let app = [];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COLUMNS = 5;

// keep track of references
// on create -> check for recursion
// on update -> refresh references

// on update -> refresh all

function CalculateValue(formula) {
	formula = formula.replaceAll(/[A-Z]\d+/g, (match) => {
		let index = parseInt(match.slice(1)) - 1;
		let row_index = ALPHABET.indexOf(match[0]);
		console.log(row_index, index);
		index += row_index * COLUMNS;
		return inputs[index].cached_value ?? inputs[index].value;
	});
	console.log(formula);
	return eval(formula);
}

function UpdateValues() {
	// keep track of current changed items
	for (let i = 0; i < inputs.length; i++) {
		if (inputs[i].formula && inputs[i] !== document.activeElement) {
			console.log("updating formula:", i, inputs[i].formula, inputs[i].formula.slice(1));
			inputs[i].cached_value = CalculateValue(inputs[i].formula.slice(1));
			inputs[i].value = inputs[i].cached_value;
		}
	}
}

function createSpreadsheetInput() {
	let input = document.createElement('input');
	input.onchange = (e) => {
		if (input !== document.activeElement) {
			return;
		}
		if (e.target.value[0] == '=') {
			input.formula = input.value;
			input.cached_value = CalculateValue(e.target.value.slice(1));
		} else if (input === document.activeElement) {
			input.formula = undefined;
		}
		UpdateValues();
	}
	input.onfocus = (e) => {
		// e.target.selectionStart = e.target.selectionEnd;
		if (e.target.formula) {
			input.value = input.formula;
		}
	}
	input.onblur = (e) => {
		if (e.target.value[0] == '=') {
			input.formula = input.value;
			input.cached_value = CalculateValue(e.target.value.slice(1));
			input.value = input.cached_value;
		} else {
			input.formula = undefined;
		}
	}
	return input;
}

function createHeaderInput() {
	let input = document.createElement('input');
	input.classList = 'header';
	// input.tabIndex = "2";
	return input;
}


// load saved data
if (localStorage.json) {
	app = JSON.parse(localStorage.json);
}
let spreadsheet = document.body.querySelector('#spreadsheet');
spreadsheet.style.gridTemplateColumns = `repeat(${COLUMNS+1}, 1fr)`;
let title_input = createHeaderInput();
title_input.placeholder = 'table';
title_input.value = app[0].name;
spreadsheet.append(title_input);
for (let i = 0; i < COLUMNS; i++) {
	let input = createHeaderInput();
	input.value = ALPHABET[i];
	spreadsheet.append(input);
}
for (let i = 0; i < app[0].cells.length; i++) {
	if (i % COLUMNS === 0) {
		let header_input = createHeaderInput();
		header_input.disabled = true;
		header_input.value = (i/COLUMNS+1).toString();
		spreadsheet.append(header_input);
	}
	let input = createSpreadsheetInput();
	input.value = app[0].cells[i].value;
	input.formula = app[0].cells[i].formula;
	spreadsheet.append(input);
	inputs.push(input);
}






// data management
document.body.onkeydown = (event) => {
	if (event.key != "s") return;
	if (event.ctrlKey == false) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	// save data
	const json_string = JSON.stringify(app, null, 0);
	// const json_string = JSON.stringify(inputs.map((input) => {
	// 	return {
	// 		value: input.value,
	// 		formula: input.formula
	// 	}
	// }), null, 0);
	console.log("Saved",json_string);
	localStorage.json = json_string;
	let message = document.createElement('p');
	message.classList = "message";
	message.textContent = 'Saved spreadsheet';
	document.body.append(message);
	setTimeout(() => {
		message.remove();
	}, 3000);
}
// document.querySelectorAll('input');
