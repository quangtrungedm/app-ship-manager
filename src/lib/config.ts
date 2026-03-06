// ── Google Sheets API Configuration ──
// After deploying your Apps Script, paste the Web App URL below.
// To deploy: Google Sheets → Extensions → Apps Script → Deploy → Web App
// Set "Execute as: Me" and "Who has access: Anyone"

export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbK-it9XCmQhE1SbeDBYJlPgxdylV5LnCeuaNNJjxnzakAAzB8PDC_ZyQ-FgkxVypqXw/exec';
// Example: 'https://script.google.com/macros/s/AKfycbx.../exec'

export const isConfigured = () => !!APPS_SCRIPT_URL;
