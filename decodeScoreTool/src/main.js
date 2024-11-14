import ExcelJS from "exceljs";
import CryptoJS from "crypto-js";

const COLUMNNAME = "dynamictext-score";

const decodeValue = (value) => {
  const cleanString = decodeURIComponent(value);
  const decryption = CryptoJS.AES.decrypt(cleanString, "Vqh8avxksB");
  const decryptedScore = parseInt(decryption.toString(CryptoJS.enc.Utf - 8));
  return decryptedScore;
};

document.querySelector("#convert").addEventListener("click", (event) => {
  const file = document.querySelector("#fileInput").files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const workbook = new ExcelJS.Workbook();
    const buffer = event.target.result;

    workbook.xlsx.load(buffer).then((workbook) => {
      const worksheet = workbook.worksheets[0];

      const column = worksheet.columns.find((col) => col.header === COLUMNNAME);

      if (column) {
        column.eachCell((cell, rowNumber) => {
          // Skip the header row
          if (rowNumber > 1) {
            cell.value = decodeValue(cell.value);
          }
        });

        // Save the changes
        workbook.xlsx.writeBuffer().then((buffer) => {
          // Create a Blob from the buffer
          const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

          // Create a download link and trigger the download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "decoded.xlsx";
          a.click();
          window.URL.revokeObjectURL(url);
        });
      } else {
        console.log(`Column "${COLUMNNAME}" not found.`);
      }
    });
  };

  if (file) {
    reader.readAsArrayBuffer(file);
  }
});
