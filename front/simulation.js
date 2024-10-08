/**
 * Retrieves system parameters from specified sheets in the active spreadsheet, 
 * mapping column headers to attributes based on saved task configuration.
 *
 * This function iterates through each provided sheet, retrieves the data, 
 * and uses a saved task mapping configuration to map spreadsheet columns 
 * to the corresponding attributes. The function constructs an object for
 * each row, using the correct header mappings, and then returns an object
 * containing all records formatted as specified by the configuration.
 *
 * @param {string[]} sheetsToSend - An array of sheet names from which to retrieve data.
 * @return {Object} An object with a 'specs' property containing mapped records for each sheet.
 */
function getSystemParamsFromSpreadsheet(sheetsToSend) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var system_params = { specs: {} };
  var taskMapping = getTaskConfig(); // Load the saved mapping config
  console.log(taskMapping)
  // Loop through the specified sheets
  sheetsToSend.forEach(function(sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (sheet) {
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var headers = values.shift(); // Retrieve and remove headers
      var headerIndexMap = headers.reduce(function(map, header, index) {
        map[header] = index; // Map header names to their respective indices
        return map;
      }, {});

      // Map the data rows to objects using the correct header, based on configuration
      var records = values.map(function(row) {
        var record = {};
        // Loop over each attribute in taskMapping to create the record
        Object.keys(taskMapping).forEach(function(attribute) {
          // Use the header to find the correct index for each attribute
          var header = taskMapping[attribute];
          var index = headerIndexMap[header];
          // Set the attribute on the record using the correct index
          record[attribute] = row[index];
        });
        return record;
      });

      // Add the list of records to the dictionary, using the sheet name as a key
      system_params.specs[sheetName] = records;
    }
  });

  console.log(system_params)
  return system_params;
}


function getSimuParamsFromSpreadsheet() {
  var simulationSheet = getSheet("simulation", false);
  var parametersRange = simulationSheet.getRange("A1:B4");
  var parameterValues = parametersRange.getValues();

  // Construct simulation parameters object
  var simu_params = {
    "nb_runs": Number(parameterValues[0][1]),
    "schedule": [
      {
        "start": Number(parameterValues[1][1]),
        "end": Number(parameterValues[2][1]),
        "nvalues": Number(parameterValues[3][1])
      }
    ],
    "session_id": "test"  // Remove this if the session_id should be generated by the API
  };

  return simu_params;
}


function runStatelessSimulation() {


  var isValid = checkSubscriptionStatus();

  if (!isValid) {
    this.buyCancelLicence();
     return;
  }
  var simulationEndpoint = SERVER_URL + '/simulation/run_stateless/';
  var indicatorsEndpoint = SERVER_URL + '/simulation/indicators/';

  var system_params = getSystemParamsFromSpreadsheet(["tasks"]);
  var simu_params = getSimuParamsFromSpreadsheet();

  Logger.log(system_params)
  Logger.log(simu_params)

  var requestBody = {
    "project": {
        "system_params": system_params
      },
    "simu_params": simu_params
  };
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(requestBody),
    'muteHttpExceptions': true,
    'headers': {
      'ngrok-skip-browser-warning': '0'
    }
  };

  Logger.log(options)

  // Start the stateless simulation
  var simulationResponse = UrlFetchApp.fetch(simulationEndpoint, options);
  var simulationTimestamp = new Date(); // Capture the timestamp

  Logger.log(simulationResponse)

  if (simulationResponse.getResponseCode() === 200) {
    var jsonResponse = JSON.parse(simulationResponse.getContentText());
    var session_id = jsonResponse.session_id;  // Ensure session_id is returned by /run_stateless endpoint

    // Retrieve the simulation indicators
    var indicatorsFullUrl = indicatorsEndpoint + '?session_id=' + encodeURIComponent(session_id);
    var indicatorsOptions = {
      'method': 'get',
      'muteHttpExceptions': true,
      'headers': {
        'ngrok-skip-browser-warning': '0'
      }
    };
    var indicatorsResponse = UrlFetchApp.fetch(indicatorsFullUrl, indicatorsOptions);
    var simulationResults = getResultAsJson(indicatorsResponse);
    
    // Now write the results to the spreadsheet
    writeSimulationResults(simulationResults, simulationTimestamp);
  } else {
    throw new Error('Non-200 response for simulation: ' + simulationResponse.getResponseCode() +
                    ' - ' + simulationResponse.getContentText());
  }
}
