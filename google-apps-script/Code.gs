// ====================================================
// Google Apps Script - Ship Manager API
// Deploy: Extensions > Apps Script > Deploy as Web App
// ====================================================

// ── CONFIG ──
const SHEET_ID = '16M9IIpzIRei3H-X8bmeC80ZnmS60cftPkTzWWrulND8';
const DRIVE_FOLDER_ID = '14X50UtWECuw_K8xYzidwksYWQS0hs64u';
const SHEET_NAME = 'ships';

// ── Danh sách các cột đầy đủ (Gộp chung trên cùng Sheet 'ships') ──
const REQUIRED_HEADERS = [
  'id', 'name', 'arrivalDate', 'completionDate', 'weight',
  'division', 'documents', 'createdAt', 'status', 'isPaid',
  'port', 'client', 'hasBarge', 'bargeCount', 'employee',
  'rating', 'ratingComment', 'hasCafeFee', 'cafeFee', 'cafeNote',
  'hasTally', 'tallyFee', 'tallyNote'
];

// ── CORS + Response helpers ──
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Tự động bổ sung tiêu đề cột nếu sheet chưa có ──
function ensureHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
    return;
  }
  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const missing = REQUIRED_HEADERS.filter(h => !currentHeaders.includes(h));
  if (missing.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
}

// ── Lấy map vị trí cột động theo tên cột ──
function getHeaderMap(sheet) {
  ensureHeaders(sheet);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const map = {};
  headers.forEach((h, idx) => {
    if (h) map[h] = idx;
  });
  return { headers, map };
}

// ── GET: Đọc danh sách tàu ──
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return createResponse({ success: false, error: 'Sheet not found: ' + SHEET_NAME });

    const { map } = getHeaderMap(sheet);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse({ success: true, ships: [] });

    const idIdx = map['id'] !== undefined ? map['id'] : 0;
    const ships = data.slice(1).map(row => {
      const id = row[idIdx];
      if (!id) return null;

      const getVal = (col) => {
        const idx = map[col];
        return (idx !== undefined && idx < row.length) ? row[idx] : undefined;
      };

      const obj = {
        id: String(id),
        name: String(getVal('name') || ''),
        arrivalDate: getVal('arrivalDate') || '',
        completionDate: getVal('completionDate') || '',
        weight: Number(getVal('weight')) || 0,
        division: getVal('division') || 'SAT_THEP',
        status: getVal('status') || 'waiting',
        isPaid: getVal('isPaid') === true || String(getVal('isPaid')).toLowerCase() === 'true',
        port: getVal('port') || '',
        client: getVal('client') || '',
        hasBarge: getVal('hasBarge') === true || String(getVal('hasBarge')).toLowerCase() === 'true',
        bargeCount: Number(getVal('bargeCount')) || 0,
        employee: getVal('employee') ? String(getVal('employee')) : undefined,
        rating: getVal('rating') ? Number(getVal('rating')) : undefined,
        ratingComment: getVal('ratingComment') ? String(getVal('ratingComment')) : undefined,
        hasCafeFee: getVal('hasCafeFee') === true || String(getVal('hasCafeFee')).toLowerCase() === 'true',
        cafeFee: getVal('cafeFee') ? Number(getVal('cafeFee')) : 0,
        cafeNote: getVal('cafeNote') ? String(getVal('cafeNote')) : undefined,
        hasTally: getVal('hasTally') === true || String(getVal('hasTally')).toLowerCase() === 'true',
        tallyFee: getVal('tallyFee') ? Number(getVal('tallyFee')) : 0,
        tallyNote: getVal('tallyNote') ? String(getVal('tallyNote')) : undefined,
      };

      try {
        const docs = getVal('documents');
        obj.documents = docs ? JSON.parse(docs) : [];
      } catch {
        obj.documents = [];
      }

      return obj;
    }).filter(Boolean);

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
    if (action === 'batchUpdate') return batchUpdateShips(body.ships);
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
  const { headers, map } = getHeaderMap(sheet);
  const id = Utilities.getUuid();
  const now = new Date().toISOString();

  const newRow = new Array(headers.length).fill('');
  const setVal = (col, val) => {
    if (map[col] !== undefined) newRow[map[col]] = val;
  };

  setVal('id', id);
  setVal('name', ship.name);
  setVal('arrivalDate', ship.arrivalDate);
  setVal('completionDate', ship.completionDate || '');
  setVal('weight', ship.weight);
  setVal('division', ship.division || 'SAT_THEP');
  setVal('documents', JSON.stringify(ship.documents || []));
  setVal('createdAt', now);
  setVal('status', ship.status || 'waiting');
  setVal('isPaid', ship.isPaid === true ? 'true' : 'false');
  setVal('port', ship.port || '');
  setVal('client', ship.client || '');
  setVal('hasBarge', ship.hasBarge === true ? 'true' : 'false');
  setVal('bargeCount', ship.bargeCount || 0);
  setVal('employee', ship.employee || '');
  setVal('rating', ship.rating || '');
  setVal('ratingComment', ship.ratingComment || '');
  setVal('hasCafeFee', ship.hasCafeFee === true ? 'true' : 'false');
  setVal('cafeFee', ship.cafeFee || 0);
  setVal('cafeNote', ship.cafeNote || '');
  setVal('hasTally', ship.hasTally === true ? 'true' : 'false');
  setVal('tallyFee', ship.tallyFee || 0);
  setVal('tallyNote', ship.tallyNote || '');

  sheet.appendRow(newRow);
  return createResponse({ success: true, id, createdAt: now });
}

// ── Cập nhật tàu ──
function updateShip(ship) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const { headers, map } = getHeaderMap(sheet);
  const data = sheet.getDataRange().getValues();
  const idCol = map['id'] !== undefined ? map['id'] : 0;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(ship.id)) {
      const row = [...data[i]];
      while (row.length < headers.length) row.push('');

      const setVal = (col, val) => {
        if (map[col] !== undefined) row[map[col]] = val;
      };

      setVal('name', ship.name);
      setVal('arrivalDate', ship.arrivalDate);
      setVal('completionDate', ship.completionDate || '');
      setVal('weight', ship.weight);
      setVal('division', ship.division || 'SAT_THEP');
      setVal('documents', JSON.stringify(ship.documents || []));
      setVal('status', ship.status || 'waiting');
      setVal('isPaid', ship.isPaid === true ? 'true' : 'false');
      setVal('port', ship.port || '');
      setVal('client', ship.client || '');
      setVal('hasBarge', ship.hasBarge === true ? 'true' : 'false');
      setVal('bargeCount', ship.bargeCount || 0);
      setVal('employee', ship.employee || '');
      setVal('rating', ship.rating || '');
      setVal('ratingComment', ship.ratingComment || '');
      setVal('hasCafeFee', ship.hasCafeFee === true ? 'true' : 'false');
      setVal('cafeFee', ship.cafeFee || 0);
      setVal('cafeNote', ship.cafeNote || '');
      setVal('hasTally', ship.hasTally === true ? 'true' : 'false');
      setVal('tallyFee', ship.tallyFee || 0);
      setVal('tallyNote', ship.tallyNote || '');

      // Ghi nguyên 1 dòng trong 1 RPC call duy nhất
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: 'Ship not found' });
}

// ── Cập nhật nhiều tàu hàng loạt ──
function batchUpdateShips(shipsList) {
  if (!shipsList || !shipsList.length) return createResponse({ success: true, count: 0 });
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const { headers, map } = getHeaderMap(sheet);
  const data = sheet.getDataRange().getValues();
  const idCol = map['id'] !== undefined ? map['id'] : 0;

  const shipMap = {};
  for (var k = 0; k < shipsList.length; k++) {
    shipMap[String(shipsList[k].id)] = shipsList[k];
  }

  var updatedCount = 0;
  for (var i = 1; i < data.length; i++) {
    var rowId = String(data[i][idCol]);
    if (shipMap[rowId]) {
      var ship = shipMap[rowId];
      var row = data[i].slice(0);
      while (row.length < headers.length) row.push('');

      var setVal = function(col, val) {
        if (map[col] !== undefined) row[map[col]] = val;
      };

      if (ship.name !== undefined) setVal('name', ship.name);
      if (ship.arrivalDate !== undefined) setVal('arrivalDate', ship.arrivalDate);
      if (ship.completionDate !== undefined) setVal('completionDate', ship.completionDate || '');
      if (ship.weight !== undefined) setVal('weight', ship.weight);
      if (ship.division !== undefined) setVal('division', ship.division || 'SAT_THEP');
      if (ship.documents !== undefined) setVal('documents', JSON.stringify(ship.documents || []));
      if (ship.status !== undefined) setVal('status', ship.status || 'completed');
      if (ship.isPaid !== undefined) setVal('isPaid', ship.isPaid === true ? 'true' : 'false');
      if (ship.port !== undefined) setVal('port', ship.port || '');
      if (ship.client !== undefined) setVal('client', ship.client || '');
      if (ship.hasBarge !== undefined) setVal('hasBarge', ship.hasBarge === true ? 'true' : 'false');
      if (ship.bargeCount !== undefined) setVal('bargeCount', ship.bargeCount || 0);
      if (ship.employee !== undefined) setVal('employee', ship.employee || '');
      if (ship.rating !== undefined) setVal('rating', ship.rating || '');
      if (ship.ratingComment !== undefined) setVal('ratingComment', ship.ratingComment || '');
      if (ship.hasCafeFee !== undefined) setVal('hasCafeFee', ship.hasCafeFee === true ? 'true' : 'false');
      if (ship.cafeFee !== undefined) setVal('cafeFee', ship.cafeFee || 0);
      if (ship.cafeNote !== undefined) setVal('cafeNote', ship.cafeNote || '');
      if (ship.hasTally !== undefined) setVal('hasTally', ship.hasTally === true ? 'true' : 'false');
      if (ship.tallyFee !== undefined) setVal('tallyFee', ship.tallyFee || 0);
      if (ship.tallyNote !== undefined) setVal('tallyNote', ship.tallyNote || '');

      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      updatedCount++;
    }
  }
  return createResponse({ success: true, count: updatedCount });
}

// ── Xóa tàu ──
function deleteShip(id) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const { map } = getHeaderMap(sheet);
  const data = sheet.getDataRange().getValues();
  const idCol = map['id'] !== undefined ? map['id'] : 0;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
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
