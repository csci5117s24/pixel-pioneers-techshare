// Replace these strings with your sheet id and name
var SHEET_ID = "102Uopcnh9OglNFaU6QDm5jTjh_55ObMFVlqyMFdlse4";
var SHEET_NAME = "Sheet1";

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
}
