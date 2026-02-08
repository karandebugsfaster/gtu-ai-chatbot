export function chunkText(text, options = {}) {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators = ['\n\n', '\n', '. ', ' ']
  } = options;

  const chunks = [];
  let currentChunk = '';
  let currentSize = 0;

  const sentences = splitBySeparators(text, separators);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceLength = sentence.length;

    if (currentSize + sentenceLength > chunkSize && currentChunk) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        startIndex: chunks.length > 0 
          ? chunks[chunks.length - 1].endIndex - chunkOverlap 
          : 0,
        endIndex: currentSize
      });

      // Start new chunk with overlap
      if (chunkOverlap > 0 && currentChunk.length > chunkOverlap) {
        currentChunk = currentChunk.slice(-chunkOverlap) + ' ' + sentence;
        currentSize = chunkOverlap + sentenceLength;
      } else {
        currentChunk = sentence;
        currentSize = sentenceLength;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentSize += sentenceLength;
    }
  }

  // Add last chunk
  if (currentChunk) {
    chunks.push({
      content: currentChunk.trim(),
      startIndex: chunks.length > 0 
        ? chunks[chunks.length - 1].endIndex - chunkOverlap 
        : 0,
      endIndex: currentSize
    });
  }

  return chunks;
}

function splitBySeparators(text, separators) {
  let result = [text];

  for (const separator of separators) {
    const newResult = [];
    for (const chunk of result) {
      const splits = chunk.split(separator);
      for (let i = 0; i < splits.length; i++) {
        if (splits[i]) {
          newResult.push(splits[i]);
        }
        if (i < splits.length - 1) {
          newResult.push(separator);
        }
      }
    }
    result = newResult;
  }

  return result.filter(s => s.trim());
}

export function chunkByPage(pageTexts, chunkSize = 1000) {
  const allChunks = [];

  pageTexts.forEach(({ pageNumber, text }) => {
    const pageChunks = chunkText(text, { chunkSize });
    
    pageChunks.forEach((chunk, index) => {
      allChunks.push({
        ...chunk,
        pageNumber,
        chunkIndex: index
      });
    });
  });

  return allChunks;
}