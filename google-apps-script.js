/**
 * Google Apps script for processing student registration data
 * Script identifier: AKfycbwI19aOfnb83Gn2eFTVL_QGSuCszIZgd7-4GKCBfpdUYn9n7JZk5v4OriyzHjZu3sruhg
 */

/**
 * Processes POST requests with student data
 */
function doPost(e) {
  try {
    // Parsing the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    Logger.log("Received data: " + JSON.stringify(data));
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(data.sheetId);
    Logger.log("Spreadsheet opened: " + spreadsheet.getName());
    
    // Attempting to get an existing sheet or create a new one
    let sheet = spreadsheet.getSheetByName(data.sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(data.sheetName);
      setupSheet(sheet); // Set up the headers for the new sheet
      Logger.log("New sheet created: " + data.sheetName);
    }

    // Create row data
    const rowData = [
      new Date(), // Timestamp
      data.lastName, // Last name
      data.firstName, // First name
      data.patronymic, // Patronymic
      data.dob, // Date of birth
      data.region || '', // Region
      data.city, // City/Town/Village
      data.street, // Street
      data.house, // House
      data.apartment || '', // Apartment
      data.idCode, // Identification code
      data.phone, // Phone number
      data.email, // Email
    ];

    Logger.log("Row data prepared: " + JSON.stringify(rowData));

    // Adding data to the sheet
    sheet.appendRow(rowData);
    Logger.log('Data added to the sheet');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data successfully saved'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Google Apps Script is running correctly'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates a new sheet with headers and formatting
 */
function setupSheet(sheet) {
  const headers = [
    'Date of registration',
    'Last name',
    'First name',
    'Patronymic',
    'Date of birth',
    'Region',
    'City/Town/Village',
    'Street',
    'House',
    'Apartment',
    'Identification code',
    'Phone',
    'Email'
  ];
  
  // Add headers to the first row
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Freeze the row of headers
  sheet.setFrozenRows(1);
  
  // Format the timestamp column
  sheet.getRange('A:A').setNumberFormat('dd.mm.yyyy hh:mm:ss');
  
  // Automatically resize columns according to the content
  sheet.autoResizeColumns(1, headers.length);
  
  // Add a basic style to the header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
}

/**
 * Test function to check the functionality of the script
 */
function testDoPost() {
  const testData = {
    sheetId: '1T-z_wf1Vdo_oYyII5ywUR1mM0P69nvRIz8Ry98TupeE',
    sheetName: 'Test',
    lastName: 'Test',
    firstName: 'Student',
    patronymic: 'Testovic',
    dob: '2000-01-01',
    region: 'Kyiv Oblast',
    city: 'Kyiv',
    street: 'Testova',
    house: '123',
    apartment: '45',
    idCode: '1234567890',
    phone: '+380991234567',
    email: 'test@example.com'
  };
  
  // Create a mock event object
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  // Call doPost with a mock event
  const result = doPost(mockEvent);
  Logger.log("Test result: " + result.getContent());
}
