
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp or FormApp.
  ui.createMenu('PTP')
      .addItem('Create Task Tables', 'createTables')
      .addItem('Run PTP Simulation', 'runStatelessSimulation')
      .addItem('Configuration', 'showTaskConfigurationDialog')
      .addItem('Print My infos', 'obtenirInformationsUtilisateur')
      .addItem('Check Licence', 'checkLicence')
      .addItem('Buy / Cancel Licence', 'buyCancelLicence')
      .addToUi();

  setupKPITaskCompletion();
}


function createTables() {
  createTaskTable();
  createSimulationTable();
}

function checkLicence() {
  var isValid = checkSubscriptionStatus();

  var content;
  if (isValid) {
    content = '<div style="color: green;">Your PTP Licence is valid.</div>';
  }
  else {
    content = '<div style="color: red;">Your PTP Licence is currently not valid.</div>';
  }
  showInfo("Licence Status", content);
}


function checkSubscriptionStatus() {

  var email = getUserMail();
  var data = {
    'email' : email,
  	'product' : productId
  }

  var options = {
    'method': 'POST',
    'contentType': 'application/json',
    'payload': JSON.stringify(data)
  };


  var url = "https://apps.edgemind.net/stripe/validate-licence";

  var response = UrlFetchApp.fetch(url, options);
  var result = getResultAsJson(response);

  Logger.log("is valid response : " + JSON.stringify(result));
  return result.valid
}

function buyCancelLicence( ) {
  var isValid = checkSubscriptionStatus();

  var content;
  

  if (isValid) {
    content =  '<div style="color: green;">You have already a valid PTP licence.</div>';

    var utilisateur = Session.getEffectiveUser();
    var username = utilisateur.getUsername();
    var email = utilisateur.getEmail();
    content= 
     '<div style="color: green;">You have already a valid PTP licence.</div>' +
     '<br><br><div ><button onclick="openNewWindow()">Cancel PTP Licence</button></div>' +
  '<script>'+
    'function openNewWindow() {'+
           " window.open('https://apps.edgemind.net/stripe/cancel-licence.html?email=" + email + "&product="+productId + "', '_blank');"+
       '}</script>'
  }
  else {
    var utilisateur = Session.getEffectiveUser();
    var username = utilisateur.getUsername();
    var email = utilisateur.getEmail();
    content= 
    '<div style="color: red;">You have currently no valid licence. </div>' +
     '<br><br><div ><button onclick="openNewWindow()">Buy PTP Licence</button></div>' +
  '<script>'+
    'function openNewWindow() {'+
           " window.open('https://apps.edgemind.net/stripe/checkout.html?email=" + email + "&price="+priceId + "&username=" + username +"', '_blank');"+
       '}</script>'
}
  

  var htmlOutput = HtmlService.createHtmlOutput(content)
      .setWidth(300)
      .setHeight(200);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "PTP Licence");
}

function obtenirInformationsUtilisateur() {
  var utilisateur = Session.getEffectiveUser();
  var nomUtilisateur = utilisateur.getUsername();
  var emailUtilisateur = utilisateur.getEmail();
  
  Logger.log("Nom d'utilisateur : " + nomUtilisateur);
  Logger.log("Adresse e-mail : " + emailUtilisateur);

  showInfo("Info", "Name: " + nomUtilisateur + "\nMail: " + emailUtilisateur);
}


function getUserMail() {
  var utilisateur = Session.getEffectiveUser();
  return utilisateur.getEmail();
}


function showInfo(title, msg) {
  var htmlOutput = HtmlService.createHtmlOutput('<p> ' + msg + '</p>')
      .setWidth(300)
      .setHeight(200);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
}


function createTaskTable() {
  
  var sheet = getSheet("tasks", true);
  var headers = ["ID", "Label", "Dependencies", "duration_min", "duration_max", "cost_rate (EUR)"]; // Add your column headers here

  // Check if the table already exists
  var tableRange = sheet.getRange("A1:F1"); // Adjust the range based on your table size
  var existingTable = tableRange.getValues()[0];

  // Check if the existing table headers match the desired headers
  var headerOk = existingTable.every(function (header, index) {
    return header === headers[index];
  });

  // If the table doesn't exist, create it
  if (!headerOk) {
    // Clear existing data in the range
    tableRange.clear();

    // Write the headers to the range
    tableRange.setValues([headers]);

    Logger.log("Table created with headers:", headers);
  } else {
    Logger.log("Table already exists with headers:");
  }
}

function createSimulationTable() {

  var sheet = getSheet("simulation", true);
  var headers = ["nb_run", "date_start", "date_end", "nb_points"]; // Add your column headers here

  // Check if the table already exists
  var firstColValues = sheet.getRange("A1:A4").getValues(); // Adjust the range based on your table size

  var match = true;
  for (var i = 0; i < headers.length; i++) {
    if (firstColValues[i][0] !== headers[i]) {
      match = false;
      break;
    }
  }

  // If the table doesn't exist, create it
  if (!match) {

    var tableRange = sheet.getRange("A1:B4");
    tableRange.clear();
    tableRange.setValues([["nb_run", 10000], ["date_start", 0], ["date_end", 240], ["nb_points", 200]]);

    Logger.log("Table created with headers:", headers);
  } else {
    Logger.log("Table already exists with headers:");
  }
}

function showTaskConfigurationDialog() {
  // Create a new HTML file for the configuration dialog
  var html = HtmlService.createTemplateFromFile('TaskConfigurationDialog')
    .evaluate()
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Task Configuration');
}



function createRunButton() {
  // Get the active sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Create a drawing
  var drawing = sheet.createDrawing();
  drawing.setAnchorRow(1); // Set the anchor row
  drawing.setAnchorColumn(1); // Set the anchor column

  // Create a button as a drawing shape
  var button = drawing.appendShape(SpreadsheetApp.Drawing.ShapeType.RECTANGLE, 0, 0);
  button.setWidth(100); // Set button width
  button.setHeight(30); // Set button height
  button.getText().setText('Run PTP'); // Set button text

  // Assign a script to the button (change 'myFunction' to your function name)
  var scriptUrl = ScriptApp.getService().getUrl() + '?run=runStatelessSimulation';
  button.getOnAction().setFunctionName('openUrl').setParameters([scriptUrl]);

  // Save the drawing
  drawing.saveAndClose();
}

