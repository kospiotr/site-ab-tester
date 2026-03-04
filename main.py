from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import json
import os
import datetime
from typing import List, Dict

app = FastAPI()

CONFIG_PATH = "config.json"
RESULTS_PATH = "results.json"

# Load config
with open(CONFIG_PATH) as f:
    config = json.load(f)
    entries = config["data"]

# Store results in memory and persist to file
def load_results():
    if os.path.exists(RESULTS_PATH):
        with open(RESULTS_PATH) as f:
            return json.load(f)
    return []

def save_results(results):
    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)

results = load_results()

# Websocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast navigation and result events
            if data["type"] == "navigate":
                await manager.broadcast({"type": "navigate", "index": data["index"]})
            elif data["type"] == "result":
                entry = entries[data["index"]]
                result_entry = {
                    "index": data["index"],
                    "sites": entry,
                    "result": data["result"],
                    "timestamp": datetime.datetime.now().isoformat()
                }
                results.append(result_entry)
                save_results(results)
                await manager.broadcast({"type": "result", "index": data["index"], "result": data["result"]})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/entries")
def get_entries():
    return {"entries": entries}

@app.get("/api/results")
def get_results():
    if not os.path.exists(RESULTS_PATH):
        return {"results": []}
    return {"results": results}

@app.post("/api/clear_results")
def clear_results():
    if os.path.exists(RESULTS_PATH):
        os.remove(RESULTS_PATH)
    global results
    results = []
    return JSONResponse({"status": "cleared"})

app.mount("/assets", StaticFiles(directory="assets"), name="assets")

@app.get("/")
def root():
    return HTMLResponse(open("assets/manager.html").read())

@app.get("/site.html")
def root():
    return HTMLResponse(open("assets/site.html").read())

