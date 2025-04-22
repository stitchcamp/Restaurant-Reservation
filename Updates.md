# Updates

## April 7, 2023
- Fixed 404 error on POST request to /api/reservations endpoint
- Improved API route handling in server.js:
  - Restructured the middleware ordering to ensure API routes are properly matched
  - Added specific 404 handling for API routes
  - Clarified route comments
- Enhanced frontend API response handling in app.js:
  - Fixed error in the API response handling that was causing a double parsing of the JSON response
  - Improved error message extraction and display
  - Updated the success message handling to show the server's response
- Server is now running successfully at http://localhost:3000

## April 8, 2023
- Fixed 400 (Bad Request) error when submitting reservation form:
  - Added client-side validation to check required fields (name, guests, table, time) before submission
  - Added user-friendly error messages showing which fields are missing
  - Added validation for guest count to ensure it's a positive number
  - Improved response handling to prevent double parsing of JSON responses
  - Added processing notification during API calls
- Fixed table selection validation:
  - Improved validation logic to correctly detect selected tables
  - Added more robust empty field detection checking for empty strings and whitespace
  - Restructured validation to check each field independently for more reliable results 