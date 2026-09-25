let inputs = [];
let app = [];
const ALPHABET = "QWERTYUIOP";
// const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COLUMNS = 5;
let Spreadsheets = document.body.querySelector('#spreadsheets');

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
		let inputs = document.querySelectorAll('.cell');
		return inputs[index].cached_value ?? inputs[index].value;
	});
	console.log(formula);
	return eval(formula);
}

function UpdateValues() {
	// keep track of current changed items
	let inputs = document.querySelectorAll('.cell');
	for (let i = 0; i < inputs.length; i++) {
		if (inputs[i].formula && inputs[i] !== document.activeElement) {
			console.log("updating formula:", i, inputs[i].formula, inputs[i].formula.slice(1));
			inputs[i].cached_value = CalculateValue(inputs[i].formula.slice(1));
			inputs[i].value = inputs[i].cached_value;
		}
	}
}

function createSpreadsheetInput(parent, value) {
	let input = createInput(parent, value, '');
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
Spreadsheets.style.gridTemplateColumns = `repeat(${COLUMNS+1}, 1fr)`;

function LoadSpreadsheets(spreadsheet_data) {
	spreadsheet_data = ValidateData(spreadsheet_data);
	let spreadsheet = document.createElement('div');
	spreadsheet.classList = 'spreadsheet';
	Spreadsheets.append(spreadsheet);
	let top_row = document.createElement('div');
	top_row.classList = 'vertical_grid';
	spreadsheet.append(top_row);
	createInput(top_row, spreadsheet_data?.name, 'table');
	for (let i = 0; i < spreadsheet_data?.columns.length; i++) {
		createInput(top_row, ALPHABET[i], 'x');
	}
	for (let i = 0; i < spreadsheet_data.cells.length / spreadsheet_data.columns.length; i++) {
		let row_div = document.createElement('div');
		row_div.classList = 'vertical_grid';
		spreadsheet.append(row_div);
		let header_input = createInput(row_div, (i+1).toString(), 'y');
		header_input.disabled = true;
		for (let j = 0; j < spreadsheet_data.columns.length; j++) {
			// let input = createInput(column, ALPHABET[j], 'cell');
			let cell_index = i * spreadsheet_data.columns.length + j;
			let input = createSpreadsheetInput(row_div, spreadsheet_data.cells[cell_index].value);
			input.formula = spreadsheet_data.cells[cell_index].formula;
			row_div.append(input);
		}
	}
	spreadsheet.addRow = () => {
		let row_div = document.createElement('div');
		row_div.classList = 'vertical_grid';
		let header_input = createInput(row_div, spreadsheet.children.length.toString(), 'y');
		spreadsheet.append(row_div);
		header_input.disabled = true;
		console.log(top_row.children.length);
		for (let i = 0; i < top_row.children.length - 1; i++) {
			createSpreadsheetInput(row_div, '');
		}
	}
	spreadsheet.addColumn = () => {
		let rows = spreadsheet.children;
		let column_length = top_row.children.length - 1;
		createInput(top_row, ALPHABET[column_length], 'x');
		for (let i = 1; i < rows.length; i++) {
			createSpreadsheetInput(rows[i], '');
		}
	}
}

function ValidateData(spreadsheet_data) {
	console.log(spreadsheet_data);
	if (!spreadsheet_data) {
		spreadsheet_data = {
			cells: [{}],
			columns: [{}]
		}
		return spreadsheet_data;
	}
	if (!spreadsheet_data?.cells || spreadsheet_data.cells.length === 0) {
		spreadsheet_data.cells = [{}];
	}
	if (!spreadsheet_data?.columns || spreadsheet_data.columns.length === 0) {
		spreadsheet_data.columns = [{}];
	}
	return spreadsheet_data;
	console.log(spreadsheet_data);
}

LoadSpreadsheets(app[0]);




function getChildren(element) {
	return Array.from(element.children);
}

function getChildrenSkipFirst(element) {
	return getChildren(element).slice(1);
}

// data management
document.body.onkeydown = (event) => {
	if (event.ctrlKey == false) return;
	if (event.key !== 'u' && event.key !== 'i' && event.key !== 's') return;
	event.preventDefault();
	event.stopImmediatePropagation();
	if (event.key === 'u' || event.key === 'i') {
		if (!document.activeElement) return;
		let spreadsheet = document.activeElement.parentElement.parentElement;
		if (!spreadsheet.addColumn) return;
		if (event.key === 'i') {
			spreadsheet.addColumn();
		}
		if (event.key === 'u') {
			spreadsheet.addRow();
		}
	}
	if (event.key != 's') return;
	// save data
	// const json_string = JSON.stringify(app, null, 0);
	const json_string = JSON.stringify(
		getChildren(Spreadsheets).map((spreadsheet) => {
			let rows = getChildren(spreadsheet);
			return {
				name: rows[0].children[0].value, 
				columns: getChildrenSkipFirst(rows[0]).map((column) => {
					return {
						formula: column.formula
					}
				}),
				cells: Array.from(spreadsheet.querySelectorAll('input.cell')).map((cell) => {
					return {
						// cached_value: cell.cached_value ?? cell.value
						value: cell.cached_value ?? cell.value,
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
