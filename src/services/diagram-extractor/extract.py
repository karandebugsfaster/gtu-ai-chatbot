# this is extract.py
import fitz
import re
import os
import base64
from fastapi import FastAPI, UploadFile, File

app = FastAPI()

# Keywords that likely indicate a diagram section
DIAGRAM_KEYWORDS = [
    "amplifier",
    "circuit",
    "configuration",
    "filter",
    "oscillator",
    "integrator",
    "differentiator",
    "adder",
    "summing",
    "inverting",
    "noninverting",
]

def looks_like_diagram_title(text):
    text_lower = text.lower()
    if len(text_lower) < 8 or len(text_lower) > 120:
        return False

    for keyword in DIAGRAM_KEYWORDS:
        if keyword in text_lower:
            return True

    return False


def extract_named_diagrams(pdf_path):
    doc = fitz.open(pdf_path)
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

            # 🔥 Detect figure caption (much stronger)
            if FIGURE_PATTERN.search(block_text):

                caption_rect = fitz.Rect(block["bbox"])

                # 🔥 Assume diagram is ABOVE caption
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
    temp_path = os.path.join(os.getcwd(), file.filename)

    with open(temp_path, "wb") as f:
        f.write(await file.read())

    diagrams = extract_named_diagrams(temp_path)

    for diagram in diagrams:
        diagram["imageBuffer"] = base64.b64encode(
            diagram["imageBuffer"]
        ).decode("utf-8")

    return {"success": True, "diagrams": diagrams}