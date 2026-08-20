/**
 * Compress an image file using canvas before uploading.
 * @param {File} file - The original file selected by user
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width of the image (default: 1200)
 * @param {number} options.maxHeight - Maximum height of the image (default: 1200)
 * @param {number} options.quality - Image quality from 0 to 1 (default: 0.9 for maximum quality)
 * @returns {Promise<File>} Compressed file
 */
export function compressImage(file, options = { maxWidth: 1200, maxHeight: 1200, quality: 0.9 }) {
  return new Promise((resolve) => {
    // If not an image, return original file
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize if it exceeds limits
        if (width > options.maxWidth || height > options.maxHeight) {
          if (width > height) {
            height = Math.round((height * options.maxWidth) / width);
            width = options.maxWidth;
          } else {
            width = Math.round((width * options.maxHeight) / height);
            height = options.maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Clear background for png transparency
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Create a new File with the same name, but compressed as JPEG
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          options.quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
