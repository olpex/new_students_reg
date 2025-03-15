/**
 * Google Apps script for processing student registration data
 * Script identifier: AKfycbyg5dOON-ngo3hIz9s50VskOEhZY8pTPMd-7X7X-AfGMN38DG1GhoDlyj7dTs9z3x1nPA
 */

/**
 * Processes POST requests with student data
 */
function doPost(e) {
  try {
    // Check if data is coming from form or direct JSON
    let data;
    if (e.parameter && e.parameter.data) {
      // Data is coming from form submission
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      // Data is coming from direct JSON
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data received');
    }
    
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

    // Return HTML response for form submissions
    const htmlResponse = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Registration Successful</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .success { color: green; font-size: 24px; margin-bottom: 20px; }
            .info { color: #333; margin-bottom: 10px; }
            .button { 
              background-color: #4285F4; 
              color: white; 
              padding: 10px 20px; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer; 
              font-size: 16px; 
            }
          </style>
        </head>
        <body>
          <div class="success">✓ Реєстрація успішна!</div>
          <div class="info">Ваші дані були успішно збережені в групі: <strong>${data.sheetName}</strong></div>
          <div class="info">Ім'я: ${data.firstName} ${data.lastName}</div>
          <div class="info">Email: ${data.email}</div>
          <div class="info">Телефон: ${data.phone}</div>
          <br>
          <button class="button" onclick="window.close()">Закрити вікно</button>
        </body>
      </html>
    `);
    
    return htmlResponse;

  } catch (error) {
    Logger.log("Error: " + error.toString());
    
    // Return HTML error response
    const htmlErrorResponse = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Registration Error</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .error { color: red; font-size: 24px; margin-bottom: 20px; }
            .message { color: #333; margin-bottom: 20px; }
            .button { 
              background-color: #4285F4; 
              color: white; 
              padding: 10px 20px; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer; 
              font-size: 16px; 
            }
          </style>
        </head>
        <body>
          <div class="error">❌ Помилка реєстрації</div>
          <div class="message">${error.toString()}</div>
          <button class="button" onclick="window.close()">Закрити вікно</button>
        </body>
      </html>
    `);
    
    return htmlErrorResponse;
  }
}

/**
 * Handles GET requests (for testing)
 */
function doGet(e) {
  // Check if this is a data submission via GET (not recommended but supported)
  if (e.parameter && e.parameter.data) {
    return doPost(e);
  }
  
  // Return a status page
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Apps Script Status</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .success { color: green; font-size: 24px; margin-bottom: 20px; }
          .info { color: #333; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="success">✓ Google Apps Script is running correctly</div>
        <div class="info">This script is configured to receive student registration data.</div>
        <div class="info">Please submit data using the registration form.</div>
      </body>
    </html>
  `);
}

/**
 * Creates a new sheet with headers and formatting
 */
function setupSheet(sheet) {
  const headers = [
    'Дата реєстрації',
    'Прізвище',
    "Ім'я",
    'По батькові',
    'Дата народження',
    'Область',
    'Місто/селище/село',
    'Вулиця',
    'Будинок',
    'Квартира',
    'Ідентифікаційний код',
    'Телефон',
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
    parameter: {
      data: JSON.stringify(testData)
    }
  };
  
  // Call doPost with a mock event
  const result = doPost(mockEvent);
  Logger.log("Test result: " + result.getContent());
}
