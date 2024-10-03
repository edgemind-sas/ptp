
function getSheet(sheetName, create) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet && create) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  return sheet;

}

function getTaskSheetHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tasks');
  var headers = sheet.getRange("A1:1").getValues()[0];
  return headers;
}

function saveTaskConfig(config) {
  // Save the configuration settings
  var properties = PropertiesService.getDocumentProperties();
  properties.setProperties(config);
  // Log the configuration
  Logger.log('Configuration saved:', config);
}

function getTaskConfig() {
  // Gets the document properties where the task configuration is saved
  var properties = PropertiesService.getDocumentProperties();
  return properties.getProperties();
}


function getColumnIndexByName(sheet, columnName) {
  var headers = sheet.getDataRange().getValues()[0]; // Get the first row (headers)
  var index = headers.indexOf(columnName); // Find the index of the column name
  return index + 1;
}