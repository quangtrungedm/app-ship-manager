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

// ── Tự động bổ sung tiêu đề cột nếu chưa có ──
function ensureHeaders(sheet) {
  const headers = [
    'id', 'name', 'arrivalDate', 'completionDate', 'weight',
    'division', 'documents', 'createdAt', 'status', 'isPaid',
    'port', 'client', 'hasBarge', 'bargeCount', 'employee',
    'rating', 'ratingComment', 'hasCafeFee', 'cafeFee', 'cafeNote',
    'hasTally', 'tallyFee', 'tallyNote'
  ];
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(headers.length, lastCol)).getValues()[0];
  for (let i = 0; i < headers.length; i++) {
    if (!currentHeaders[i]) {
      sheet.getRange(1, i + 1).setValue(headers[i]);
    }
  }
}

// ── GET: Đọc danh sách tàu ──
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return createResponse({ success: true, ships: [] });

    const ships = data.slice(1).map(row => {
      const obj = {};
      // Rigid column mapping:
      // 0: id, 1: name, 2: arrivalDate, 3: completionDate, 4: weight, 
      // 5: division, 6: documents, 7: createdAt, 8: status, 9: isPaid,
      // 10: port, 11: client, 12: hasBarge, 13: bargeCount, 14: employee,
      // 15: rating, 16: ratingComment, 17: hasCafeFee, 18: cafeFee, 19: cafeNote,
      // 20: hasTally, 21: tallyFee, 22: tallyNote
      obj.id = row[0];
      obj.name = row[1];
      obj.arrivalDate = row[2];
      obj.completionDate = row[3];
      obj.weight = row[4];
      obj.division = row[5];
      
      try { obj.documents = JSON.parse(row[6] || '[]'); } catch { obj.documents = []; }
      
      obj.createdAt = row[7];
      obj.status = row[8];
      obj.isPaid = row[9] === true || row[9] === 'true';
      obj.port = row[10];
      obj.client = row[11];
      obj.hasBarge = row[12] === true || row[12] === 'true';
      obj.bargeCount = row[13] ? Number(row[13]) : 0;
      obj.employee = row[14] ? String(row[14]) : undefined;
      obj.rating = row[15] ? Number(row[15]) : undefined;
      obj.ratingComment = row[16] ? String(row[16]) : undefined;
      obj.hasCafeFee = row[17] === true || row[17] === 'true';
      obj.cafeFee = row[18] ? Number(row[18]) : undefined;
      obj.cafeNote = row[19] ? String(row[19]) : undefined;
      obj.hasTally = row[20] === true || row[20] === 'true';
      obj.tallyFee = row[21] ? Number(row[21]) : undefined;
      obj.tallyNote = row[22] ? String(row[22]) : undefined;
      
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
  ensureHeaders(sheet);
  const id = Utilities.getUuid();
  const now = new Date().toISOString();

  sheet.appendRow([
    id,
    ship.name,
    ship.arrivalDate,
    ship.completionDate || '',
    ship.weight,
    ship.division || 'SAT_THEP',
    JSON.stringify(ship.documents || []),
    now,
    ship.status || 'waiting',
    ship.isPaid === true ? 'true' : 'false',
    ship.port || '',
    ship.client || '',
    ship.hasBarge === true ? 'true' : 'false',
    ship.bargeCount || 0,
    ship.employee || '',
    ship.rating || '',
    ship.ratingComment || '',
    ship.hasCafeFee === true ? 'true' : 'false',
    ship.cafeFee || 0,
    ship.cafeNote || '',
    ship.hasTally === true ? 'true' : 'false',
    ship.tallyFee || 0,
    ship.tallyNote || ''
  ]);

  return createResponse({ success: true, id, createdAt: now });
}

// ── Cập nhật tàu ──
function updateShip(ship) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  ensureHeaders(sheet);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ship.id) {
      sheet.getRange(i + 1, 2).setValue(ship.name);
      sheet.getRange(i + 1, 3).setValue(ship.arrivalDate);
      sheet.getRange(i + 1, 4).setValue(ship.completionDate || '');
      sheet.getRange(i + 1, 5).setValue(ship.weight);
      sheet.getRange(i + 1, 6).setValue(ship.division || 'SAT_THEP');
      sheet.getRange(i + 1, 7).setValue(JSON.stringify(ship.documents || []));
      sheet.getRange(i + 1, 9).setValue(ship.status || 'waiting');
      sheet.getRange(i + 1, 10).setValue(ship.isPaid === true ? 'true' : 'false');
      sheet.getRange(i + 1, 11).setValue(ship.port || '');
      sheet.getRange(i + 1, 12).setValue(ship.client || '');
      sheet.getRange(i + 1, 13).setValue(ship.hasBarge === true ? 'true' : 'false');
      sheet.getRange(i + 1, 14).setValue(ship.bargeCount || 0);
      sheet.getRange(i + 1, 15).setValue(ship.employee || '');
      sheet.getRange(i + 1, 16).setValue(ship.rating || '');
      sheet.getRange(i + 1, 17).setValue(ship.ratingComment || '');
      sheet.getRange(i + 1, 18).setValue(ship.hasCafeFee === true ? 'true' : 'false');
      sheet.getRange(i + 1, 19).setValue(ship.cafeFee || 0);
      sheet.getRange(i + 1, 20).setValue(ship.cafeNote || '');
      sheet.getRange(i + 1, 21).setValue(ship.hasTally === true ? 'true' : 'false');
      sheet.getRange(i + 1, 22).setValue(ship.tallyFee || 0);
      sheet.getRange(i + 1, 23).setValue(ship.tallyNote || '');
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
