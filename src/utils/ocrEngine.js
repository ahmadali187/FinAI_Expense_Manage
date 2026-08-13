import { predictCategory } from './aiEngine';

export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const validateReceiptFile = (file) => {
  if (!file) {
    return { valid: false, message: 'No file provided.' };
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];

  if (!ALLOWED_MIME_TYPES.includes(file.type) && !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      message: 'Invalid file format. Please upload a PNG, JPG, JPEG, or WEBP image.'
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      message: 'File size exceeds the 10MB limit. Please upload a smaller receipt image.'
    };
  }

  return { valid: true };
};

export const preprocessImageCanvas = (imageSrc) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Grayscale + Contrast Adjustment
        const contrastFactor = 1.2;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          let color = (avg - 128) * contrastFactor + 128;
          color = Math.min(255, Math.max(0, color));
          data[i] = color;     // Red
          data[i + 1] = color; // Green
          data[i + 2] = color; // Blue
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        resolve(imageSrc); // Fallback to original image if canvas manipulation fails
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

export const normalizeReceiptText = (text) => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[₹$]|Rs\.?|RS\.?|INR/gi, ' ₹ ')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ');
};

export const parseReceiptDetails = (rawText, existingTransactions = []) => {
  const normalized = normalizeReceiptText(rawText);
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return {
      merchant: 'Unreadable Merchant',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      confidence: { overall: 'Low', merchant: 'Low', amount: 'Low', date: 'Low' },
      isDuplicate: false,
      rawText: ''
    };
  }

  // --- MERCHANT EXTRACTION ---
  let merchant = null;
  let merchantConfidence = 'Low';
  const nonMerchantPatterns = /^(gstin|invoice|receipt|tax|phone|tel|address|date|total|cashier|welcome|thank\s*you|bill\s*no|receipt\s*#|receipt\s*no)$/i;
  const lineHasNonMerchantHeader = /(gstin|tax\s*id|invoice\s*#|tel:|phone:)/i;

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    const cleanLine = line.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
    if (cleanLine.length >= 3 && !nonMerchantPatterns.test(cleanLine) && !lineHasNonMerchantHeader.test(line)) {
      merchant = cleanLine;
      merchantConfidence = i <= 1 ? 'High' : 'Medium';
      break;
    }
  }

  if (!merchant) {
    merchant = 'Merchant could not be confidently identified';
    merchantConfidence = 'Low';
  }

  // --- AMOUNT EXTRACTION ---
  let amount = null;
  let amountConfidence = 'Low';

  // Priority 1: Final Payable Totals (Grand Total, Amount Payable, Net Total, Total Due, etc.)
  const priority1TotalRegex = /(?:grand\s*total|net\s*total|amount\s*payable|amount\s*due|balance\s*due|total\s*due|total\s*paid|paid\s*amount|total\s*amount)[\s:₹]*([0-9]+(?:[.,][0-9]{2})?)/i;
  
  for (const line of lines) {
    const match = line.match(priority1TotalRegex);
    if (match && match[1]) {
      const val = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(val) && val > 0) {
        amount = val.toFixed(2);
        amountConfidence = 'High';
        break;
      }
    }
  }

  // Priority 2: Generic Total / Subtotal
  if (!amount) {
    const priority2TotalRegex = /(?:total|subtotal|amount)[\s:₹]*([0-9]+(?:[.,][0-9]{2})?)/i;
    for (const line of lines) {
      const match = line.match(priority2TotalRegex);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val) && val > 0) {
          amount = val.toFixed(2);
          amountConfidence = 'Medium';
          break;
        }
      }
    }
  }

  // Fallback: Scan monetary numbers near the bottom of receipt
  if (!amount) {
    const monetaryNumbers = [];
    const generalPriceRegex = /(?:₹|\b)\s*([0-9]+[.,][0-9]{2})\b/g;
    let priceMatch;
    while ((priceMatch = generalPriceRegex.exec(normalized)) !== null) {
      const parsedVal = parseFloat(priceMatch[1].replace(',', '.'));
      if (!isNaN(parsedVal) && parsedVal > 0) {
        monetaryNumbers.push(parsedVal);
      }
    }

    if (monetaryNumbers.length > 0) {
      amount = monetaryNumbers[monetaryNumbers.length - 1].toFixed(2);
      amountConfidence = 'Medium';
    }
  }

  // --- DATE EXTRACTION ---
  let dateStr = new Date().toISOString().split('T')[0];
  let dateConfidence = 'Low';

  const datePatterns = [
    /(\d{4}[-/]\d{2}[-/]\d{2})/, // YYYY-MM-DD
    /(\d{2}[-/]\d{2}[-/]\d{4})/, // DD-MM-YYYY or MM-DD-YYYY
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i // Month DD, YYYY
  ];

  for (const line of lines) {
    for (const pat of datePatterns) {
      const dMatch = line.match(pat);
      if (dMatch) {
        const rawD = dMatch[1] || dMatch[0];
        const parsedDate = new Date(rawD);
        if (!isNaN(parsedDate.getTime())) {
          dateStr = parsedDate.toISOString().split('T')[0];
          dateConfidence = 'High';
          break;
        }
      }
    }
    if (dateConfidence === 'High') break;
  }

  // --- CATEGORY SUGGESTION ---
  const suggestedCategory = predictCategory(merchant + ' ' + normalized);

  // --- OVERALL CONFIDENCE ---
  let overallConfidence = 'Low';
  if (!amount) {
    overallConfidence = 'Low';
  } else if (amountConfidence === 'High' && merchantConfidence === 'High') {
    overallConfidence = 'High';
  } else if (amountConfidence !== 'Low' || merchantConfidence !== 'Low') {
    overallConfidence = 'Medium';
  }

  // --- DUPLICATE TRANSACTION DETECTION ---
  let isDuplicate = false;
  if (amount && existingTransactions && existingTransactions.length > 0) {
    const numAmt = parseFloat(amount);
    isDuplicate = existingTransactions.some(t => {
      const sameDate = t.date === dateStr;
      const sameAmount = Math.abs(parseFloat(t.amount) - numAmt) < 0.01;
      const sameMerchant = merchant && t.merchant && t.merchant.toLowerCase().includes(merchant.toLowerCase());
      return sameAmount && (sameDate || sameMerchant);
    });
  }

  return {
    merchant,
    amount: amount || '',
    date: dateStr,
    category: suggestedCategory,
    confidence: {
      overall: overallConfidence,
      merchant: merchantConfidence,
      amount: amountConfidence,
      date: dateConfidence
    },
    isDuplicate,
    rawText: normalized
  };
};
