import * as XLSX from "xlsx";
import CryptoJS from "crypto-js";

const decodeValue = (value) => {
  const cleanString = decodeURIComponent(value);
  const decryption = CryptoJS.AES.decrypt(cleanString, "Vqh8avxksB");
  const decryptedScore = parseInt(decryption.toString(CryptoJS.enc.Utf8));
  return decryptedScore;
};

document.querySelector("#convert").addEventListener("click", (event) => {
  const file = document.querySelector("#fileInput")?.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // get first worksheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // find "dynamictext-score" column index
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      let targetColumnIndex = -1;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const headerCellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: c });
        if (worksheet[headerCellAddress] && worksheet[headerCellAddress].v === "dynamictext-score") {
          targetColumnIndex = c;
          break;
        }
      }

      if (targetColumnIndex === -1) {
        alert('Column "dynamictext-score" not found!');
        return;
      }

      // start from row after header
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: targetColumnIndex });
        if (worksheet[cellAddress]) {
          const encodedValue = worksheet[cellAddress].v;
          worksheet[cellAddress].v = decodeValue(encodedValue);
        }
      }

      // generate new file
      const modifiedWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(modifiedWorkbook, worksheet, "decoded sheet");
      const decodedXLSX = XLSX.write(modifiedWorkbook, { bookType: "xlsx", type: "array" });

      // make blob and download
      const blob = new Blob([decodedXLSX], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "decodedScores.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    };
    reader.readAsArrayBuffer(file);
  }
});
