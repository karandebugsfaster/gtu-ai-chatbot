import fitz  # PyMuPDF
import re
import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List
import uvicorn

# ══════════════════════════════════════════════════════════════════════
# Initialize FastAPI App
# ══════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="GTU AI Backend Services",
    description="Combined diagram extraction and embedding generation service",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════════════════════════════════════════════════
# Load Embedding Model at Startup (Takes ~5 seconds)
# ══════════════════════════════════════════════════════════════════════

print("🔄 Loading embedding model (all-MiniLM-L6-v2)...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Embedding model loaded successfully!")

# ══════════════════════════════════════════════════════════════════════
# Health Check Endpoint
# ══════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "service": "GTU AI Backend",
        "status": "running",
        "endpoints": {
            "diagram_extraction": "/extract-diagrams",
            "embeddings": "/embed"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}

# ══════════════════════════════════════════════════════════════════════
# DIAGRAM EXTRACTION SERVICE
# ══════════════════════════════════════════════════════════════════════

def extract_named_diagrams(pdf_bytes):
    """Extract diagrams from PDF bytes"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    diagrams = []

    FIGURE_PATTERN = re.compile(r"(Figure|Fig\.?)\s*\d+[\.\-]?\d*", re.IGNORECASE)

    for page_num in range(len(doc)):
        page = doc[page_num]
        text_dict = page.get_text("dict")

        for block in text_dict["blocks"]:
            if block["type"] != 0:
                continue

            block_text = ""
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    block_text += span["text"] + " "

            block_text = block_text.strip()

            # Detect figure caption
            if FIGURE_PATTERN.search(block_text):
                caption_rect = fitz.Rect(block["bbox"])

                # Assume diagram is ABOVE caption
                diagram_rect = fitz.Rect(
                    0,
                    max(0, caption_rect.y0 - 600),
                    page.rect.width,
                    caption_rect.y0
                )

                pix = page.get_pixmap(clip=diagram_rect, dpi=200)
                image_bytes = pix.tobytes("png")

                diagrams.append({
                    "pageNumber": page_num + 1,
                    "imageIndex": len(diagrams),
                    "imageBuffer": image_bytes,
                    "imageFormat": "png",
                    "dimensions": {
                        "width": pix.width,
                        "height": pix.height
                    },
                    "captionText": block_text,
                    "contextText": block_text,
                    "figureNumber": block_text,
                })

    doc.close()
    return diagrams

@app.post("/extract-diagrams")
async def extract_diagrams_endpoint(file: UploadFile = File(...)):
    """Extract diagrams from uploaded PDF"""
    try:
        pdf_bytes = await file.read()
        diagrams = extract_named_diagrams(pdf_bytes)

        # Convert image bytes to base64 for JSON transport
        for diagram in diagrams:
            diagram["imageBuffer"] = base64.b64encode(
                diagram["imageBuffer"]
            ).decode("utf-8")

        return {
            "success": True,
            "diagrams": diagrams,
            "count": len(diagrams)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ══════════════════════════════════════════════════════════════════════
# EMBEDDING GENERATION SERVICE
# ══════════════════════════════════════════════════════════════════════

class TextRequest(BaseModel):
    texts: List[str]

@app.post("/embed")
def generate_embeddings(request: TextRequest):
    """Generate embeddings for text array"""
    try:
        embeddings = embedding_model.encode(request.texts).tolist()
        return {
            "success": True,
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimensions": len(embeddings[0]) if embeddings else 0
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ══════════════════════════════════════════════════════════════════════
# Run Server
# ══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)