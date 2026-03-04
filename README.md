# A/B Tester Web Service

This project is a web-based A/B tester for QA, allowing you to compare multiple sites in real-time using FastAPI and websockets.

## Features
- Compare pairs (or more) of sites using iframes
- Real-time sync between manager and site views
- Record results (OK/Fail) for each comparison
- Results saved to a JSON file

## Requirements
- Python 3.8 or newer

## Installation
1. Clone the repository or copy the project files.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage
1. Prepare your `config.json` file with entries to compare. Example:

```json
{
  "data": [
    ["https://siteA.com/page1", "https://siteB.com/page1"],
    ["https://siteA.com/page2", "https://siteB.com/page2"]
  ]
}
```

2. Start the server:

```bash
uvicorn main:app --reload
```

3. Open three browser tabs:
- Manager: [http://localhost:8000/](http://localhost:8000/)

4. Use the manager to select entries and record results. Site A and Site B will update in real-time.

5. Results are saved in `results.json`.

## Notes
- You can compare more than two sites by extending the config and frontend logic.
- For production, consider using `uvicorn main:app --host 0.0.0.0 --port 80` and a process manager.

## License
MIT

