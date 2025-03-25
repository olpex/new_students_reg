/**
 * Google Apps script for processing student registration data
 * Script identifier: AKfycbyg5dOON-ngo3hIz9s50VskOEhZY8pTPMd-7X7X-AfGMN38DG1GhoDlyj7dTs9z3x1nPA
 */

/**
 * Processes POST requests with student data
 */
function doPost(e) {
  Logger.log("doPost called with: " + JSON.stringify(e));
  
  try {
    // Parse the request data
    let data;
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      // Data is coming from form submission
      data = e.parameter;
      Logger.log("Form data received: " + JSON.stringify(data));
    } else if (e.postData && e.postData.contents) {
      // Data is coming from direct JSON
      data = JSON.parse(e.postData.contents);
      Logger.log("JSON data received: " + JSON.stringify(data));
    } else {
      throw new Error('No data received');
    }
    
    // Get the sheet ID from the request
    const sheetId = data.sheetId;
    if (!sheetId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No sheet ID provided"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the sheet name from the request
    const sheetName = data.sheetName;
    if (!sheetName) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No sheet name provided"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    
    // Check if the sheet exists, create it if it doesn't
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      Logger.log("Sheet created: " + sheetName);
    }
    
    // Ensure Ukrainian headers are set
    ensureUkrainianHeaders(sheet);
    
    // Format the address if it's not already provided
    let address = data.address;
    if (!address && (data.cityType || data.city || data.street || data.house || data.apartment || data.region)) {
      address = formatAddress(data.cityType, data.city, data.street, data.house, data.apartment, data.region);
      Logger.log("Address formatted: " + address);
    }
    
    // Get the full name or construct it from individual fields
    let fullName = data.fullName;
    if (!fullName && (data.lastName || data.firstName || data.patronymic)) {
      fullName = `${data.lastName || ''} ${data.firstName || ''} ${data.patronymic || ''}`.trim();
      Logger.log("Full name constructed: " + fullName);
    }
    
    // Get sequential number (either from request or calculate next number)
    let sequentialNumber = data.sequentialNumber;
    if (!sequentialNumber) {
      // Calculate the next sequential number
      const lastRow = sheet.getLastRow();
      sequentialNumber = lastRow > 1 ? lastRow : 1;
      Logger.log("Sequential number calculated: " + sequentialNumber);
    }
    
    // Create row data
    const rowData = [
      sequentialNumber, // Номер (sequential number)
      fullName, // Прізвище, ім'я та по батькові
      data.dob || data.birthDate, // Дата народження
      address, // Місце реєстрації
      data.idCode, // Ідентифікаційний код
      data.phone, // Телефон
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
  ensureUkrainianHeaders(sheet);
}

/**
 * Ensures that the headers in the sheet are in Ukrainian
 */
function ensureUkrainianHeaders(sheet) {
  const headers = [
    'Номер',
    'Прізвище, ім\'я\nта по батькові',
    'Дата народження',
    'Місце реєстрації',
    'Ідентифікаційний\nкод',
    'Телефон',
    'Email'
  ];
  
  // Always set the headers to Ukrainian, regardless of what's currently there
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Freeze the row of headers
  sheet.setFrozenRows(1);
  
  // Format the sequential number column
  sheet.getRange('A:A').setNumberFormat('0');
  
  // Set all columns to width 142
  for (let i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 142);
  }
  
  // Add a basic style to the header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  
  // Set row height to 50 points
  sheet.setRowHeight(1, 50);
  
  // Center text horizontally and vertically
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  
  // Enable text wrapping for headers
  headerRange.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  
  Logger.log("Headers set to Ukrainian and column widths set to 142");
}

/**
 * Formats the address in the requested format
 */
function formatAddress(cityType, city, street, house, apartment, region) {
  // Add prefixes based on city type
  let formattedCity = '';
  switch(cityType) {
    case 'місто':
      formattedCity = `м. ${city}`;
      break;
    case 'селище':
      formattedCity = `смт ${city}`;
      break;
    case 'село':
      formattedCity = `с. ${city}`;
      break;
    default:
      formattedCity = city;
  }

  // Build address components
  const components = [
    formattedCity,
    street ? `вул. ${street}` : '',
    house ? (apartment ? `буд. ${house}, кв. ${apartment}` : `буд. ${house}`) : '',
    region ? `${region} область` : ''
  ];

  // Filter out empty components and join with commas
  return components.filter(c => c).join(', ');
}

/**
 * Formats a date in the format dd.mm.yyyy
 */
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Test function to check the functionality of the script
 */
function testDoPost() {
  // Create a mock event object
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        sheetId: "1T-z_wf1Vdo_oYyII5ywUR1mM0P69nvRIz8Ry98TupeE",
        sheetName: "Test Group",
        fullName: "Тестовий Студент Тестович",
        birthDate: "01.01.2000",
        address: "м. Київ, вул. Тестова, 1, кв. 1, Київська область",
        idCode: "1234567890",
        phone: "+380991234567",
        email: "test@example.com",
        sequentialNumber: 999 // Test sequential number
      })
    }
  };
  
  // Call the doPost function with the mock event
  const result = doPost(mockEvent);
  
  // Log the result
  Logger.log(result.getContent());
}
