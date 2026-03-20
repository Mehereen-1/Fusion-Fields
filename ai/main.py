from fastapi import FastAPI
import random

app = FastAPI()

@app.get("/ai-move")
def ai_move():
    return {
        "row": random.randint(0,4),
        "col": random.randint(0,4)
    }