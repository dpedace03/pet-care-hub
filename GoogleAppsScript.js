function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    function getOrCreateSheet(sheetName, headers) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(headers);
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setBackground("#4f46e5");
        headerRange.setFontColor("#ffffff");
        headerRange.setFontWeight("bold");
      }
      return sheet;
    }

    if (data.pets && data.pets.length > 0) {
      var petsSheet = getOrCreateSheet("Mascotas", ["ID", "Nombre", "Especie", "Raza", "Edad", "Peso (kg)", "Microchip", "Foto URL", "Vet Clínica", "Vet Dr", "Vet Teléfono", "Vet Urgencias", "Vet Dirección"]);
      if (petsSheet.getLastRow() > 1) {
        petsSheet.getRange(2, 1, petsSheet.getLastRow() - 1, petsSheet.getLastColumn()).clearContent();
      }
      data.pets.forEach(function(pet) {
        var vet = pet.vet || {};
        petsSheet.appendRow([
          pet.id || '', pet.name || '', pet.species || '', pet.breed || '',
          pet.age || '', pet.weight || '', pet.chip || '', pet.photo || '',
          vet.clinic || '', vet.doctor || '', vet.phone || '', vet.emergency || '', vet.address || ''
        ]);
      });
    }

    if (data.appointments && data.appointments.length > 0) {
      var appSheet = getOrCreateSheet("Citas", ["ID Cita", "ID Mascota", "Mascota", "Título", "Tipo", "Fecha", "Hora", "Costo ($)", "Estado", "Observaciones"]);
      if (appSheet.getLastRow() > 1) {
        appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).clearContent();
      }
      data.appointments.forEach(function(a) {
        var pet = (data.pets || []).find(function(p) { return p.id === a.petId; });
        appSheet.appendRow([
          a.id || '', a.petId || '', pet ? pet.name : a.petId,
          a.title || '', a.type || '', a.date || '', a.time || '', a.cost || 0,
          a.status || 'Nuevo', a.notes || ''
        ]);
      });
    }

    if (data.expenses && data.expenses.length > 0) {
      var expSheet = getOrCreateSheet("Gastos", ["ID Gasto", "ID Mascota", "Mascota", "Concepto", "Categoría", "Monto ($)", "Fecha"]);
      if (expSheet.getLastRow() > 1) {
        expSheet.getRange(2, 1, expSheet.getLastRow() - 1, expSheet.getLastColumn()).clearContent();
      }
      data.expenses.forEach(function(ex) {
        var pet = (data.pets || []).find(function(p) { return p.id === ex.petId; });
        expSheet.appendRow([
          ex.id || '', ex.petId || '', pet ? pet.name : ex.petId,
          ex.concept || '', ex.category || '', ex.amount || 0, ex.date || ''
        ]);
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "¡Sincronización completa!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
