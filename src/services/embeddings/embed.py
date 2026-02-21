# File: services/embeddings/embed.py
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')

class TextRequest(BaseModel):
    texts: list[str]

@app.post("/embed")
def generate_embeddings(request: TextRequest):
    embeddings = model.encode(request.texts).tolist()
    return {"embeddings": embeddings}