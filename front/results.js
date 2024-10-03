function getResultAsJson(response) {
  var content = response.getContentText();
  
  if (response.getResponseCode() === 200 && content) {
    var jsonData = JSON.parse(content);
    return jsonData;
  } else {
    throw new Error('Failed to retrieve result: ' + response.getResponseCode());
  }
}

function writeSimulationResults(indicatorsData, simulationTimestamp) {
  var simulationSheet = getSheet("simulation", false);
  var rawResultsSheet = getSheet("raw_results", true);
  
  // Clear previous results
  rawResultsSheet.clearContents();

  // Assuming each element in indicatorsData is an object where keys are column headers
  var headers = Object.keys(indicatorsData[0]);
  var values = indicatorsData.map(function(ind) {
    return headers.map(function(header) {
      return ind[header];
    });
  });

  // Write headers and content to raw_results sheet
  rawResultsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (values.length > 0) {
    rawResultsSheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }

  // Update the simulation timestamp
  simulationSheet.getRange('D1').setValue(simulationTimestamp.toISOString());
}


function setupKPITaskCompletion() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rawResultsSheet = spreadsheet.getSheetByName('raw_results');
  
  // Check if raw results sheet exists; if not, return
  if (!rawResultsSheet) {
    Logger.log('raw_results sheet does not exist.');
    return;
  }
  // Get column indices by names
  var rowsGroupIndex = getColumnIndexByName(rawResultsSheet, 'instant');
  var columnsGroupIndex = getColumnIndexByName(rawResultsSheet, 'comp');
  var valuesIndex = getColumnIndexByName(rawResultsSheet, 'values');
  var valuesFunction = SpreadsheetApp.PivotTableSummarizeFunction.AVERAGE;
  // For example, let's filter for values where the filter column is equal to "SomeCondition"
  var filtersIndex = getColumnIndexByName(rawResultsSheet, 'stat');

  // Create a filter on stat
  var filtersConditions = SpreadsheetApp.newFilterCriteria()
    .whenTextEqualTo('mean')
    .build();
  
  var filtersConditions2 = SpreadsheetApp.newFilterCriteria()
    .whenTextDoesNotContain('Start')
    .build();


  // Check if KPI sheet exists; if not, create it
  var kpiSheet = spreadsheet.getSheetByName('KPITaskCompletion');
  if (!kpiSheet) {
    kpiSheet = spreadsheet.insertSheet('KPITaskCompletion');
  } else {
    // Clear the existing KPI sheet
    kpiSheet.clear();
  }
  
  // Define the range for the pivot table source data
  var dataRange = rawResultsSheet.getDataRange();
  
  // Create a pivot table in the KPI sheet
  var pivotTableRange = kpiSheet.getRange('A1');
  var pivotTable = pivotTableRange.createPivotTable(dataRange)

  // Configure the pivot table
  var rowGroup = pivotTable.addRowGroup(rowsGroupIndex);
  var columnGroup = pivotTable.addColumnGroup(columnsGroupIndex);  
  pivotTable.addPivotValue(valuesIndex, valuesFunction);
  pivotTable.addFilter(filtersIndex, filtersConditions);
  pivotTable.addFilter(columnsGroupIndex, filtersConditions2);

  rowGroup.showTotals(false)
  columnGroup.showTotals(false)

  createGraphTasksProgression()
}

function createGraphTasksProgression() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var kpiSheet = spreadsheet.getSheetByName('KPITaskCompletion');
  var dashboardSheet = spreadsheet.getSheetByName('Dashboard');
  var tasksSheet = spreadsheet.getSheetByName('tasks');

  // Calculate the number of tasks based on the non-empty rows in 'tasks' sheet
  var tasksDataRange = tasksSheet.getDataRange();
  var tasksValues = tasksDataRange.getValues();
  var numberOfTasks = tasksValues.reduce(function(count, row) {
    return row[0] ? count + 1 : count; // Assuming task names are in the first column
  }, 0) - 1; // Subtract 1 to account for the header row

  // Define the range of data for the x-axis and series
  var lastDataColumn = 3 + numberOfTasks;
  var lastDataRow = kpiSheet.getLastRow(); // The last row with data in 'KPITaskCompletion'
  var dataRange = kpiSheet.getRange(2, 1, lastDataRow - 1, lastDataColumn);

  // Check if the Dashboard sheet exists; if not, create it
  if (!dashboardSheet) {
    dashboardSheet = spreadsheet.insertSheet('Dashboard');
  } else {
    dashboardSheet.clear(); // Clear the previous chart or content
  }

  // Create a line chart in the Dashboard sheet
  var chart = dashboardSheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(dataRange)
    .setOption('title', 'Project tasks completion over time') // Set the chart title
    .setPosition(5, 2, 0, 0) // Position chart at row 5, column 2
    .setOption('useFirstColumnAsDomain', true) // Use the first column as the domain (x-axis)
    .setOption('hAxis', {title: 'Time'}) // Customize horizontal axis title
    .setOption('vAxis', {
      format: 'percent', // Set the vertical axis format as a percentage
      viewWindow: {
        max: 1.05,
        min: 0
      },
      title: 'Completion Rate' // Customize the vertical axis title
    })
    .setNumHeaders(1)
    .build();

  // Add the chart to the Dashboard sheet
  dashboardSheet.insertChart(chart);
}