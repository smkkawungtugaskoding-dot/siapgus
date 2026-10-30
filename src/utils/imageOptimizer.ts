/**
 * Utility untuk mengompresi dan mengubah ukuran logo sekolah sebelum disimpan
 * ke database dan Google Spreadsheet.
 *
 * Batas sel Google Spreadsheet adalah 50.000 karakter.
 * Fungsi ini memastikan gambar diubah ukurannya ke dimensi proporsional (maks 160x160 px)
 * dan dikompresi sehingga menghasilkan base64 string sekitar 3 KB - 9 KB
 * (hanya sekitar 4.000 - 12.000 karakter), aman 100% tersimpan di Google Spreadsheet.
 */

export function optimizeLogoImage(file: File, maxWidth: number = 160, maxHeight: number = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Hitung rasio dimensi gambar
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal mendapatkan konteks canvas 2D.'));
          return;
        }

        // Gambar ulang dengan kualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor sebagai JPEG atau PNG yang teroptimasi
        let compressedDataUrl = '';
        if (file.type === 'image/png') {
          // Coba PNG dulu, jika di bawah 45.000 karakter gunakan PNG untuk transparansi
          const pngUrl = canvas.toDataURL('image/png');
          if (pngUrl.length <= 45000) {
            compressedDataUrl = pngUrl;
          } else {
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          }
        } else {
          compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        }

        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Gagal memproses gambar logo.'));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('FileReader tidak menghasilkan data.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar.'));
    };

    reader.readAsDataURL(file);
  });
}
