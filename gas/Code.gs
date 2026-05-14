// Code.gs

/**
 * Handle GET requests to the Web App.
 * URL parameters:
 * ?action=getInitData
 * 
 * Returns JSON containing Projects and Phrases.
 */
function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'getInitData') {
    var data = getInitData();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests (Optional: For logs)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'log') {
      logAction(data.userName, data.messageContent);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Reads data from the Sheets.
 */
function getInitData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Read Projects
  var projectsSheet = ss.getSheetByName('Projects');
  var projects = [];
  if (projectsSheet) {
    var pData = projectsSheet.getDataRange().getValues();
    // Assuming row 1 is header: Project Name, Default Deadline
    for (var i = 1; i < pData.length; i++) {
      if (pData[i][0]) {
        projects.push({
          name: pData[i][0],
          deadline: pData[i][1] || ''
        });
      }
    }
  }

  // Read Phrases
  var phrasesSheet = ss.getSheetByName('Phrases');
  var phrases = [];
  if (phrasesSheet) {
    var phData = phrasesSheet.getDataRange().getValues();
    // Assuming row 1 is header: Category, Phrase
    for (var j = 1; j < phData.length; j++) {
      if (phData[j][0] && phData[j][1]) {
        phrases.push({
          category: phData[j][0],
          phrase: phData[j][1]
        });
      }
    }
  }
  
  return {
    projects: projects,
    phrases: phrases
  };
}

/**
 * Log generation action.
 */
function logAction(userName, messageContent) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logsSheet = ss.getSheetByName('Logs');
  if (!logsSheet) {
    logsSheet = ss.insertSheet('Logs');
    logsSheet.appendRow(['Timestamp', 'User', 'Message Preview']);
  }
  
  logsSheet.appendRow([new Date(), userName || 'Unknown', messageContent]);
}

/**
 * Run this function once after creating the script to set up CORS properly if deploying as Web App
 * Make sure to deploy as Web App:
 * Execute as -> Me
 * Who has access -> Anyone
 */
