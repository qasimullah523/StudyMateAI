const PDFDocument = require('pdfkit');
const fs = require('fs');

function createSamplePdf(dest) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(dest);
    doc.pipe(stream);
    doc.fontSize(20).text('StudyMate AI - Sample PDF', { align: 'left' });
    doc.moveDown();
    doc.fontSize(12).text('This is a short sample PDF used to test audiobook generation.');
    doc.moveDown();
    doc.text('It includes a few sentences. The goal is to ensure text extraction works.');
    doc.end();
    stream.on('finish', () => resolve(dest));
    stream.on('error', reject);
  });
}

if (require.main === module) {
  const out = process.argv[2] || 'test-sample-valid.pdf';
  createSamplePdf(out)
    .then((p) => console.log('Created', p))
    .catch((err) => console.error(err));
}

module.exports = { createSamplePdf };