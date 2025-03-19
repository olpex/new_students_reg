// Google Apps Script for handling student registration data
// Copy and paste this code into your Google Apps Script project

/**
 * Processes POST requests and adds data to Google Sheets.
 * @param {Object} e - The event object from the request.
 * @return {Object} JSON response with success status and message.
 */
function doPost(e) {
  try {
    console.log("Received request:", JSON.stringify(e));
    
    // Check if we received any data
    if (!e) {
      console.error("No event object received");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No event object received"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Parse the data from the request
    let data;
    
    // Log the request details for debugging
    console.log("Request parameters:", e.parameter ? JSON.stringify(e.parameter) : "None");
    console.log("Request postData:", e.postData ? (e.postData.contents ? "Has contents" : "No contents") : "No postData");
    
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      console.log("Using parameter data");
      data = e.parameter;
    } else if (e.postData && e.postData.contents) {
      console.log("Using postData contents");
      try {
        data = JSON.parse(e.postData.contents);
        console.log("Parsed JSON data:", JSON.stringify(data));
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError.toString());
        console.log("Raw contents:", e.postData.contents);
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "Error parsing JSON: " + parseError.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      console.error("No valid data found in the request");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No valid data found in the request"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate required fields
    if (!data.sheetId) {
      console.error("Missing required field: sheetId");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Missing required field: sheetId"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate required data
    if (!data.sheetId || !data.sheetName) {
      console.error("Missing required data: sheetId or sheetName");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Missing required data: sheetId or sheetName"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check if SpreadsheetApp is available
    if (!SpreadsheetApp) {
      console.error("SpreadsheetApp is not available");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "SpreadsheetApp is not available. Make sure the script has the necessary permissions."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Open the spreadsheet and get the sheet
    let spreadsheet;
    try {
      console.log("Attempting to open spreadsheet with ID:", data.sheetId);
      spreadsheet = SpreadsheetApp.openById(data.sheetId);
    } catch (error) {
      console.error("Error opening spreadsheet:", error.toString());
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Error opening spreadsheet: " + error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check if spreadsheet was opened successfully
    if (!spreadsheet) {
      console.error("Failed to open spreadsheet");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Failed to open spreadsheet. Check if the sheetId is correct and the script has access to it."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    let sheet = spreadsheet.getSheetByName(data.sheetName);
    
    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(data.sheetName);
      
      // Add headers to the new sheet
      const headers = [
        "ПІБ", 
        "Дата реєстрації", 
        "Дата народження", 
        "Адреса", 
        "Телефон", 
        "Email", 
        "Школа", 
        "Клас", 
        "Батько ПІБ", 
        "Батько телефон", 
        "Мати ПІБ", 
        "Мати телефон"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Find the last row with data
    const lastRow = Math.max(1, sheet.getLastRow());
    
    // Prepare the data for the new row
    const rowData = [
      data.fullName || "",
      data.registrationDate || "",
      data.dob || "",
      data.address || "",
      data.phone || "",
      data.email || "",
      data.school || "",
      data.grade || "",
      data.fatherName || "",
      data.fatherPhone || "",
      data.motherName || "",
      data.motherPhone || ""
    ];
    
    // Add the new row
    const newRowRange = sheet.getRange(lastRow + 1, 1, 1, rowData.length);
    newRowRange.setValues([rowData]);
    
    // If preserveRegistrationDateFormat is true, set the date cell format to text
    if (data.preserveRegistrationDateFormat === true) {
      const dateCell = sheet.getRange(lastRow + 1, 2); // Column B is the date column
      dateCell.setNumberFormat("@"); // Set as text format
      
      // Ensure the date is displayed as plain text without any automatic formatting
      if (data.registrationDate && data.registrationDate.startsWith("'")) {
        // If the date already has an apostrophe prefix, we're good
        console.log("Date already has apostrophe prefix:", data.registrationDate);
      } else {
        // If not, we need to add it and update the cell
        console.log("Adding apostrophe prefix to date:", data.registrationDate);
        dateCell.setValue("'" + data.registrationDate);
      }
    }
    
    console.log("Data added successfully to sheet:", data.sheetName);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Data added successfully"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error("Error in doPost:", error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function for doPost.
 * This function simulates a POST request to the doPost function.
 */
function testDoPost() {
  try {
    // Get the ID of the current spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetId = ss ? ss.getId() : "1RvdTrPXLrdO4KNVhYXDPnNlIhXlUxnZ_6uyXJxUzDjE"; // Replace with your actual spreadsheet ID if needed
    
    console.log("Using spreadsheet ID:", sheetId);
    
    // Create a test data object
    const testData = {
      sheetId: sheetId,
      sheetName: "Тестова група",
      fullName: "Тестовий Студент",
      registrationDate: "'" + new Date().toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      preserveRegistrationDateFormat: true,
      dob: "01.01.2000",
      address: "вул. Тестова, 123, м. Київ",
      phone: "+380991234567",
      email: "test@example.com",
      school: "Школа №1",
      grade: "11",
      fatherName: "Тестовий Батько",
      fatherPhone: "+380991234568",
      motherName: "Тестова Мати",
      motherPhone: "+380991234569"
    };
    
    // Create a mock event object with parameter data
    const mockEvent = {
      parameter: testData
    };
    
    console.log("Mock event created:", JSON.stringify(mockEvent));
    
    // Call doPost with the mock event
    const result = doPost(mockEvent);
    
    // Log the result
    console.log("Test result:", result.getContent());
    
    return "Test completed. Check the logs for details.";
  } catch (error) {
    console.error("Error in testDoPost:", error.toString());
    return "Test failed: " + error.toString();
  }
}

/**
 * Simple function to test if the script is accessible.
 * @return {Object} JSON response with success status.
 */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "Script is running"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * This function should be run manually once to ensure the script has the necessary permissions.
 * It will prompt for authorization when run.
 */
function setupPermissions() {
  try {
    // Try to access SpreadsheetApp to trigger authorization
    const spreadsheets = SpreadsheetApp.getActiveSpreadsheet();
    
    // If we get here, permissions are granted
    return "Permissions successfully set up. The script now has access to SpreadsheetApp.";
  } catch (error) {
    return "Error setting up permissions: " + error.toString();
  }
}
