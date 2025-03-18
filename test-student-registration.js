// Script to test the student registration endpoint
require('dotenv').config();
const fetch = require('node-fetch');

async function testStudentRegistration() {
  try {
    console.log('Testing student registration endpoint...');
    
    // Test data
    const testStudent = {
      firstName: 'Test',
      lastName: 'Student',
      patronymic: 'Testovich',
      birthDate: '2000-01-01',
      region: 'Test Region',
      city: 'Test City',
      street: 'Test Street',
      house: '1',
      apartment: '1',
      idCode: '1234567890',
      phone: '+380123456789',
      email: 'test@example.com',
      group: 'Група 101' // Using an existing group
    };
    
    // Local endpoint for testing
    const endpoint = 'http://localhost:3001/api/students';
    
    console.log('Sending test data:', testStudent);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testStudent)
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('Test successful! Student registration worked.');
    } else {
      console.error('Test failed. Student registration returned an error.');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testStudentRegistration();
