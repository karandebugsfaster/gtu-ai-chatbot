import FormData from 'form-data'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'

const DIAGRAM_EXTRACTOR_URL =
  process.env.DIAGRAM_EXTRACTOR_URL || 'http://localhost:8001'

export async function extractDiagramsFromPDF(pdfBuffer, documentMetadata) {
  const formData = new FormData()
  formData.append('file', pdfBuffer, { filename: 'document.pdf' })

  const response = await fetch(
    `${DIAGRAM_EXTRACTOR_URL}/extract-diagrams`,
    {
      method: 'POST',
      body: formData,
    }
  )

  const data = await response.json()

  if (!data.success) {
    throw new Error('Diagram extraction failed')
  }

  const processedDiagrams = []

  for (const diagram of data.diagrams) {
    try {
      const imageBuffer = Buffer.from(diagram.imageBuffer, 'base64')

      const optimizedBuffer = await sharp(imageBuffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()

      const uploadResult = await uploadImageToCloudinary(
        optimizedBuffer,
        `diagram_${documentMetadata.documentId}_page${diagram.pageNumber}_${diagram.imageIndex}`
      )

      processedDiagrams.push({
        pageNumber: diagram.pageNumber,
        figureNumber: diagram.figureNumber,
        captionText: diagram.captionText,
        contextText: diagram.contextText,
        imageUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        dimensions: diagram.dimensions,
      })
    } catch (err) {
      console.error('Diagram process error:', err)
    }
  }

  return processedDiagrams
}

async function uploadImageToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: 'diagrams',
        resource_type: 'image',
        format: 'jpg',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )

    uploadStream.end(buffer)
  })
}