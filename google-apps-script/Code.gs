// ====================================================
// Google Apps Script - Ship Manager API
// Deploy: Extensions > Apps Script > Deploy as Web App
// ====================================================

// ── CONFIG ──
const SHEET_ID = '16M9IIpzIRei3H-X8bmeC80ZnmS60cftPkTzWWrulND8';
const DRIVE_FOLDER_ID = '14X50UtWECuw_K8xYzidwksYWQS0hs64u';
const SHEET_NAME = 'ships';

// ── CORS + Response helpers ──
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET: Đọc danh sách tàu ──
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return createResponse({ success: true, ships: [] });

    const headers = data[0];
    const ships = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h === 'documents') {
          try { obj[h] = JSON.parse(row[i] || '[]'); } catch { obj[h] = []; }
        } else {
          obj[h] = row[i];
        }
      });
      return obj;
    }).filter(s => s.id); // skip empty rows

    return createResponse({ success: true, ships });
  } catch (err) {
    return createResponse({ success: false, error: err.message });
  }
}

// ── POST: Thêm/Sửa/Xóa tàu ──
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'add') return addShip(body.ship);
    if (action === 'update') return updateShip(body.ship);
    if (action === 'delete') return deleteShip(body.id);
    if (action === 'upload') return uploadFile(body);

    return createResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return createResponse({ success: false, error: err.message });
  }
}

// ── Thêm tàu mới ──
function addShip(ship) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const id = Utilities.getUuid();
  const now = new Date().toISOString();

  sheet.appendRow([
    id,
    ship.name,
    ship.arrivalDate,
    ship.completionDate || '',
    ship.weight,
    ship.division || '',
    JSON.stringify(ship.documents || []),
    now,
    ship.status || 'waiting',
    ship.isPaid === true ? 'true' : 'false',
    ship.port || '',
    ship.client || ''
  ]);

  return createResponse({ success: true, id, createdAt: now });
}

// ── Cập nhật tàu ──
function updateShip(ship) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ship.id) {
      sheet.getRange(i + 1, 2).setValue(ship.name);
      sheet.getRange(i + 1, 3).setValue(ship.arrivalDate);
      sheet.getRange(i + 1, 4).setValue(ship.completionDate || '');
      sheet.getRange(i + 1, 5).setValue(ship.weight);
      sheet.getRange(i + 1, 6).setValue(ship.division || '');
      sheet.getRange(i + 1, 7).setValue(JSON.stringify(ship.documents || []));
      sheet.getRange(i + 1, 9).setValue(ship.status || 'waiting');
      sheet.getRange(i + 1, 10).setValue(ship.isPaid === true ? 'true' : 'false');
      sheet.getRange(i + 1, 11).setValue(ship.port || '');
      sheet.getRange(i + 1, 12).setValue(ship.client || '');
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: 'Ship not found' });
}

// ── Xóa tàu ──
function deleteShip(id) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: 'Ship not found' });
}

// ── Upload file lên Drive ──
function uploadFile(body) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(body.fileData),
    body.mimeType,
    body.fileName
  );
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return createResponse({
    success: true,
    fileId: file.getId(),
    fileUrl: file.getUrl(),
    fileName: body.fileName,
  });
}
