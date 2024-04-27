function Test(request) {
  var command = request.parameter.command;
  switch (command) {
    case "update-data":
      return doPut(request);
    case "delete-data":
      return doDelete(request);
    default:
      return ContentService.createTextOutput("Command not recognized.");
  }
}

function doPut(request) {
    var ss = SpreadsheetApp.openById(); // TODO: Fill this in
    var sheet = ss.getSheetByName(); // TODO: Fill this in
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