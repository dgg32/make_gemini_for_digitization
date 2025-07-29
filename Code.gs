// Replace this with the API key you got from Google AI Studio.
const GEMINI_API_KEY = "";

/**
 * Runs when the add-on is installed.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Runs when the sheet is opened. Adds the custom menu.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('Gemini Categorizer')
    .addItem('Categorize Items', 'categorizeItems')
    .addToUi();
}

/**
 * This is the main function that categorizes items.
 * Reads from column D, writes to column G.
 */
function categorizeItems() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  const values = range.getValues();

let itemsProcessed = 0;
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const itemName = row[3]; // Column D
    const categoryCell = sheet.getRange(i + 2, 7); // Column G

    if (itemName && categoryCell.getValue() === '') {
      try {
        const category = getCategoryFromGemini(itemName);
        categoryCell.setValue(category);
        itemsProcessed++;
        Utilities.sleep(1000); // Wait 1 second between API calls.
      } catch (e) {
        Logger.log(`Error processing "${itemName}": ${e.message}`);
        categoryCell.setValue("Error");
      }
    }
  }
  ui.alert(`Finished! Processed ${itemsProcessed} new items.`);
}

/**
 * This function calls the Gemini API to get the category.
 */
function getCategoryFromGemini(itemName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `Please categorize the following Japanese grocery item. Use a simple category like "ice cream", "snack", "beverage", "seasoning", "seafood", "vegetable", "meat", "staple food", "milk", "ramen", "fruit", "sushi", "discount" etc. For other items that you are not sure, categorize it as "others". For non-food item, categorize it as "non food". Provide only the category name in English in all lower case, no explanation text. Item: "${itemName}"`;

  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { 'method': 'post', 'contentType': 'application/json', 'payload': JSON.stringify(payload) };
  
  const response = UrlFetchApp.fetch(url, options);
  const jsonResponse = JSON.parse(response.getContentText());
  const category = jsonResponse.candidates[0].content.parts[0].text.trim();
  
  Logger.log(`Item: ${itemName}, Category: ${category}`);
  return category;
}