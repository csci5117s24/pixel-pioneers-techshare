// Replace these empty strings with your sheet id and name
var SHEET_ID = "";
var SHEET_NAME = "";

function doUpdate(request) {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var lastRow = sheet.getLastRow(); // get the last row
    var dataRange = sheet.getRange(2, 1, lastRow, 2); // Assumes ID is in column A and value in column B. Starts at 2nd row, 1st column, extends down to last row, and spans 2 columns.
    var data = dataRange.getValues(); // getting the data and adding to a 2d array

    for (var i = 0; i < data.length; i++) { // iterating through the array
        if (data[i][0] == request.parameter.id) { // Checking if the ID matches
            sheet.getRange(i + 2, 2).setValue(request.parameter.value); // setting the new value for the matching id
            break;
        }
    }
}

function doDelete(request) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow(); // gets the last row
  var dataRange = sheet.getRange(2, 1, lastRow, 1); // get range parameters say that the range starts at 2nd row, column 1, extends down to last row, and spans 1 column.
  var data = dataRange.getValues(); // values are added to a 2d array

  for (var i = 0; i < data.length; i++) { // iterating through the array
    if (data[i][0] == request.parameter.id) { // finding the row to delete based on the matching id
      sheet.deleteRow(i + 2); // index adjustment due to first row being headers and array starting from 0.
      break;
    }
  }
}

// Called when a GET request received
function doGet(request) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  var command = request.parameter.command;
  if (command === "write-data") {
    sheet.appendRow([request.parameter.id, request.parameter.value]);
  }
  else if (command === "read-averages") {
    var averages = sheet.getRange("D2:E2").getValues();
    var json = JSON.stringify([{"sensor-id": 1, "value": averages[0][0]}, {"sensor-id": 2, "value": averages[0][1]}]);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }
  else if (command === "read-all-data") {
    lastrow = sheet.getLastRow();
    var ids = sheet.getRange("A2:A"+lastrow).getValues();
    var values = sheet.getRange("B2:B"+lastrow).getValues();
    var json = [];
    for (var i in ids) {
      json.push({"sensor-id": ids[i][0], "value": values[i][0]});
    }
    return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
  }
  else if (command === "delete-data") {
    return doDelete(request);
  }
  else if (command === "update-data") {
    return doUpdate(request);
  }
}
