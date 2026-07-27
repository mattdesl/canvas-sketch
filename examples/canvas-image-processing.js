/**
 * A Canvas2D example of async loading and image processing.
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');
const load = require('load-asset');

canvasSketch(async ({ update, render }) => {
  let image = await load('assets/baboon.jpg');
  let currentImage = image;

  // Update our sketch with new settings
  update({
    dimensions: [ currentImage.width, currentImage.height ]
  });

  // Helper to scale large images down to maximum 1200px dimension
  // This keeps processing time fast and UI responsive while preserving visual quality
  function getScaledImage(img, maxDim = 1200) {
    if (img.width <= maxDim && img.height <= maxDim) {
      return img;
    }
    const canvas = document.createElement('canvas');
    let w = img.width;
    let h = img.height;
    if (w > h) {
      if (w > maxDim) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      }
    } else {
      if (h > maxDim) {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }

  // Setup DOM UI elements for the drag & drop uploading experience
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    // Check if UI is already created (e.g. during hot reloads)
    if (!document.getElementById('gen-art-style')) {
      const style = document.createElement('style');
      style.id = 'gen-art-style';
      style.textContent = `
        .gen-art-btn {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #1f1c2c 0%, #928dab 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 16px 32px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 16px;
          font-weight: 600;
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10000;
          letter-spacing: 0.5px;
          user-select: none;
        }

        .gen-art-btn:hover {
          transform: translateX(-50%) scale(1.05);
          background: linear-gradient(135deg, #2c1f3c 0%, #ab9dcd 100%);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.1);
        }

        .gen-art-btn:active {
          transform: translateX(-50%) scale(0.98);
        }

        .gen-art-btn-icon {
          font-size: 20px;
        }

        .gen-art-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 20000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #fff;
        }

        .gen-art-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }

        .gen-art-overlay-box {
          border: 3px dashed rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 80%;
          max-width: 500px;
          text-align: center;
          background: rgba(255, 255, 255, 0.03);
          transition: all 0.3s ease;
        }

        .gen-art-overlay.active .gen-art-overlay-box {
          border-color: #4cc9f0;
          box-shadow: 0 0 30px rgba(76, 201, 240, 0.2);
        }

        .gen-art-overlay-icon {
          font-size: 60px;
          margin-bottom: 20px;
          animation: gen-art-bounce 2s infinite;
        }

        .gen-art-overlay-text {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
          background: linear-gradient(45deg, #ff007f, #4cc9f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gen-art-overlay-subtext {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        @keyframes gen-art-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }

    // Create Drag & Drop / Upload button
    const btn = document.createElement('button');
    btn.className = 'gen-art-btn';
    btn.innerHTML = '<span class="gen-art-btn-icon">✨</span> Drag & Drop Photo Here or Click';
    document.body.appendChild(btn);

    // Create File Input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Create Fullscreen Drag Overlay
    const overlay = document.createElement('div');
    overlay.className = 'gen-art-overlay';
    overlay.innerHTML = `
      <div class="gen-art-overlay-box">
        <div class="gen-art-overlay-icon">🖼️</div>
        <div class="gen-art-overlay-text">Drop to Generate Art!</div>
        <div class="gen-art-overlay-subtext">Instantly converts your photo into a generative masterpiece</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Handle File processing
    const handleFile = (file) => {
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const scaled = getScaledImage(img, 1200);
          currentImage = scaled;
          update({
            dimensions: [ scaled.width, scaled.height ]
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    // Click handler for button
    btn.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change handler
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    // Handle Drag and Drop events
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) {
        overlay.classList.add('active');
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        overlay.classList.remove('active');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      overlay.classList.remove('active');

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Render our sketch
  return ({ context, width, height }) => {
    // Render to canvas
    context.drawImage(currentImage, 0, 0, width, height);

    // Extract bitmap pixel data
    const pixels = context.getImageData(0, 0, width, height);

    // Manipulate pixels
    const data = pixels.data;
    let len = width;
    while (len) {
      const newX = Math.floor(Math.random() * len--);
      const oldX = len;

      // Sometimes leave row in tact
      if (Math.random() > 0.85) continue;

      for (let y = 0; y < height; y++) {
        // Sometimes leave column in tact
        if (Math.random() > 0.925) continue;

        // Copy new random column into old column
        const newIndex = newX + y * width;
        const oldIndex = oldX + y * width;

        // Make 'grayscale' by just copying blue channel
        data[oldIndex * 4 + 0] = data[newIndex * 4 + 2];
        data[oldIndex * 4 + 1] = data[newIndex * 4 + 2];
        data[oldIndex * 4 + 2] = data[newIndex * 4 + 2];
      }
    }

    // Put new pixels back into canvas
    context.putImageData(pixels, 0, 0);
  };
});
