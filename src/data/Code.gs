function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Archive Export')
    .addItem('Export to archive.js', 'exportArchive')
    .addToUi();
}

function exportArchive() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('Need at least a header row and one data row.');
    return;
  }

  var headers = data[0].map(function (h) {
    return String(h || '').toLowerCase().trim();
  });

  function col(name) {
    var i = headers.indexOf(name);
    return i >= 0 ? i : -1;
  }

  var items = [];

  for (var r = 1; r < data.length; r++) {
    var row = data[r];

    function get(name) {
      var i = col(name);
      return i >= 0 && row[i] !== undefined ? String(row[i]).trim() : '';
    }

    var lat = parseFloat(get('lat'));
    var lng = parseFloat(get('lng'));
    var year = parseInt(get('year'), 10) || 2024;
    var month = parseInt(get('dt_month'), 10) || 1;
    var day = parseInt(get('dt_day'), 10) || 1;
    var hour = parseInt(get('dt_hour'), 10) || 0;
    var minute = parseInt(get('dt_minute'), 10) || 0;
    var second = parseInt(get('dt_second'), 10) || 0;

    var catRaw = get('category');
    var category = catRaw
      ? catRaw.split('|').map(function (c) { return c.trim(); }).filter(Boolean)
      : [];

    var imgRaw = get('images');
    var images = imgRaw
      ? imgRaw.split('|').map(function (u) { return u.trim(); }).filter(Boolean)
      : [];

    // Export audioRecording as plain relative path (no JS expression inside the string)
    var audioPath = get('audiorecording');
    var audioRecording = audioPath || null;

    var item = {
      id: String(get('id') || r),
      title: get('title'),
      date: get('date'),
      year: isNaN(year) ? new Date().getFullYear() : year,
      datetime: {
        year: parseInt(get('dt_year'), 10) || year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second
      },
      coordinates: (!isNaN(lat) && !isNaN(lng)) ? { lat: lat, lng: lng } : null,
      gpsCoordinates: get('gpscoordinates') || null,
      category: category,
      description: get('description'),
      images: images,
      video: get('video') || null,
      audioRecording: audioRecording,
      others: { status: get('status') || 'Completed' }
    };

    items.push(item);
  }

  var json = JSON.stringify(items, null, 2);

  var content =
    '/**\n' +
    ' * Archive items - generated from Google Sheets\n' +
    ' */\n\n' +
    'export const archive = ' + json + '\n';

  var blob = Utilities.newBlob(content, 'application/javascript', 'archive.js');

  // Create the file in the same Drive folder as the spreadsheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ssFile = DriveApp.getFileById(ss.getId());
  var parents = ssFile.getParents();
  var targetFolder;

  if (parents.hasNext()) {
    targetFolder = parents.next();
  } else {
    targetFolder = DriveApp.getRootFolder();
  }

  var outFile = targetFolder.createFile(blob);

  var msg =
    'archive.js created successfully.\n\n' +
    'Folder: ' + targetFolder.getName() + '\n' +
    'File name: ' + outFile.getName() + '\n\n' +
    'URL:\n' + outFile.getUrl();

  Logger.log(msg);
  SpreadsheetApp.getUi().alert(msg);
}
