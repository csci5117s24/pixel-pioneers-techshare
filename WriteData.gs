// Replace these strings with your sheet id and name
var SHEET_ID = "102Uopcnh9OglNFaU6QDm5jTjh_55ObMFVlqyMFdlse4";
var SHEET_NAME = "Sheet1";

// Called when a GET request received
function doGet(request) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  sheet.appendRow([request.parameter.id, request.parameter.value])
}
