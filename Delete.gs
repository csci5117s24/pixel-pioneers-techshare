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


function doDelete(request) {
  var ss = SpreadsheetApp.openById(""); // TODO: Fill this in
  var sheet = ss.getSheetByName(); // TODO: Fill this in
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
