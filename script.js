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
		let column_index = ALPHABET.indexOf(match[0]);
		console.log(column_index, index);
		index = index * COLUMNS + column_index;
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
	input.classList = "cell";
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

function createInput(parent, value, placeholder) {
	let input = document.createElement('input');
	input.classList = 'header';
	if (placeholder) {
		input.placeholder = placeholder;
	}
	if (value) {
		input.value = value;
	}
	parent.append(input);
	return input;
}


// load saved data
if (localStorage.json) {
	app = JSON.parse(localStorage.json);
}
let spreadsheets = document.body.querySelector('#spreadsheets');
spreadsheets.style.gridTemplateColumns = `repeat(${COLUMNS+1}, 1fr)`;

function LoadSpreadsheets(spreadsheet_data) {
	let spreadsheet = document.createElement('div');
	spreadsheet.classList = 'spreadsheet';
	spreadsheets.append(spreadsheet);
	let left_side = document.createElement('div');
	spreadsheet.append(left_side);
	createInput(left_side, spreadsheet_data?.name, 'table');
	console.log(spreadsheet_data);
	for (let i = 0; i < spreadsheet_data?.cells.length / spreadsheet_data?.columns.length; i++) {
		let header_input = createInput(left_side, (i+1).toString(), 'y');
		header_input.disabled = true;
	}
	createInput(left_side, '', 'add row').onchange = (e) => {
		let header_input = createInput(left_side, (i+1).toString(), 'y');
		header_input.disabled = true;
	};
	// should check if length > 0
	for (let i = 0; i < spreadsheet_data?.cells.length / spreadsheet_data?.columns.length; i++) {
		let column = document.createElement('div');
		createInput(column, ALPHABET[i], 'x');
		for (let j = 0; j < spreadsheet_data?.cells.length; j += spreadsheet_data?.columns.length) {
			// let input = createInput(column, ALPHABET[j], 'cell');
			let input = createSpreadsheetInput();
			input.value = spreadsheet_data.cells[i].value;
			input.formula = spreadsheet_data.cells[i].formula;
			column.append(input);
		}
	}
}

LoadSpreadsheets(app[0]);





// data management
document.body.onkeydown = (event) => {
	if (event.key != "s") return;
	if (event.ctrlKey == false) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	// save data
	// const json_string = JSON.stringify(app, null, 0);
	const json_string = JSON.stringify(
		Array.from(document.body.querySelectorAll('.spreadsheet')).map((spreadsheet) => {
			return {
				name: "main", 
				cells: Array.from(spreadsheet.querySelectorAll('input.cell')).map((cell) => {
					return {
						// cached_value: cell.cached_value ?? cell.value
						value: input.value,
						formula: cell.formula
					}
				})
			}
		}), null, 0);
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
