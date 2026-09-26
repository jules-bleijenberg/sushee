let inputs = [];
let app = [];
// const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COLUMN_LETTERS = "PQWERTYUIO";
const TABLE_LETTERS = "pqwertyuio";
// const NUMBERS = "0123456789";
// let FORMUMLA_REGEX = new RegExp("[PQWERTYUIO]\d+", 'g');
let FORMUMLA_REGEX = /[pqwertyuio].[PQWERTYUIO]\d+/g;
const COLUMNS = 5;
let Spreadsheets = document.body.querySelector('#spreadsheets');

// keep track of references
// on create -> check for recursion
// on update -> refresh references

// on update -> refresh all

function GetCell(table_id, x, y) {
	// handle out of bounds
	return Spreadsheets.children[table_id].children[y].children[x];
}

function GetCellByString(str) {
	let table_id = TABLE_LETTERS.indexOf(str[0]);
	let x = COLUMN_LETTERS.indexOf(str[2]);
	let y = parseInt(str.slice(3));
	return GetCell(table_id, x, y);
}

function GetReferences(cell) {
	console.log(FORMUMLA_REGEX);
	if (!cell.formula) return [];
	let regex_references = cell.formula.match(FORMUMLA_REGEX);
	if (!regex_references) return [];
	console.log(regex_references);
	let references = [];
	for (let i = 0; i < regex_references.length; i++) {
		let reference = regex_references[i];
		let j = 0;
		while (j < references.length && references[j].reference !== reference) {
			j++;
		};
		if (j !== references.length) continue;
		references.push({
			reference: reference,
			cell: GetCellByString(reference)
		});
	}
	return references;
}

function createSpreadsheetInput(parent, value) {
	let input = createInput(parent, value, '');
	input.classList = "cell";
	// default properties
	input.cells_to_update = [];
	input.references = [];
	input.setReferences = () => {
		input.references = GetReferences(input);
		for (let x = 0; x < input.references.length; x++) {
			input.references[x].cell.cells_to_update.push(input);
		}
	}
	input.removeReferences = () => {
		for (let x = 0; x < input.references.length; x++) {
			let index = input.references[x].cell.cells_to_update.indexOf(input);
			if (index < 0) continue;
			input.references[x].cell.cells_to_update.splice(index, 1);
		}
		input.references = GetReferences(input);
		for (let x = 0; x < input.references.length; x++) {
			input.references[x].cell.cells_to_update.push(input);
		}
	}
	input.change_formula = () => {
		if (input.formula) {
			// todo improve efficiency
			input.removeReferences();
			input.setReferences();
		}
	}
	input.update = () => {
		if (!input.formula) {
			for (let i = 0; i < input.cells_to_update.length; i++) {
				input.cells_to_update[i].update();
			}
			return;
		}
		console.log(input.formula);
		let formula = input.formula.slice(1).replaceAll(FORMUMLA_REGEX, (match) => {
			console.log(input.references, match);
			for (let i = 0; i < input.references.length; i++) {
				console.log(input.references[i], match);
				if (match !== input.references[i].reference) continue;
				return input.references[i].cell.cached_value ?? input.references[i].cell.value;
			}
		});
		console.log(formula);
		if (input === document.activeElement) {
			input.cached_value = eval(formula);
		} else {
			input.cached_value = eval(formula);
			input.value = input.cached_value;
		}
		for (let i = 0; i < input.cells_to_update.length; i++) {
			input.cells_to_update[i].update();
		}
	}
	input.onchange = (e) => {
		if (input !== document.activeElement) {
			return;
		}
		if (e.target.value[0] == '=') {
			input.formula = input.value;
			input.change_formula();
			input.update();
		} else if (input === document.activeElement) {
			input.formula = undefined;
			input.update();
		}
	}
	input.onfocus = (e) => {
		// e.target.selectionStart = e.target.selectionEnd;
		if (e.target.formula) {
			input.value = input.formula;
		}
	}
	input.onblur = (e) => {
		if (e.target.value[0] !== '=') {
			input.formula = undefined;
			// input.cached_value = undefined;
			return;
		}
		if (input.formula === input.value) {
			input.value = input.cached_value;
			return
		}
		input.formula = input.value;
		input.change_formula();
		input.update();
		input.value = input.cached_value;
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

function ForEachCell(func) {
	for (let i = 0; i < Spreadsheets.children.length; i++) {
		for (let y = 1; y < Spreadsheets.children[i].children.length; y++) {
			for (let x = 1; x < Spreadsheets.children[i].children[y].children.length; x++) {
				func(Spreadsheets.children[i].children[y].children[x]);
			}
		}
	}
}

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
		createInput(top_row, COLUMN_LETTERS[i + 1], 'x');
	}
	for (let i = 0; i < spreadsheet_data.cells.length / spreadsheet_data.columns.length; i++) {
		let row_div = document.createElement('div');
		row_div.classList = 'vertical_grid';
		spreadsheet.append(row_div);
		let header_input = createInput(row_div, (i+1).toString(), 'y');
		header_input.disabled = true;
		for (let j = 0; j < spreadsheet_data.columns.length; j++) {
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
		let next_collumn_index = top_row.children.length;
		createInput(top_row, COLUMN_LETTERS[next_collumn_index], 'x');
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
ForEachCell((cell) => {
	cell.setReferences();
});
ForEachCell((cell) => {
	console.log(cell);
	cell.update();
});
// setTimeout(() => {
// }, 100);



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
		getChildrenSkipFirst(Spreadsheets).map((spreadsheet) => {
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
						value: cell.value,
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
