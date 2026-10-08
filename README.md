# Analyst

A small Flask web application for heuristic analysis across health-risk signals, academic performance, and daily-life decisions.

> **Important:** The healthcare module is an educational risk-signal demo, not a diagnostic system or medical device. Its scores are heuristic and are not clinically calibrated probabilities.

## Features

- **Healthcare:** symptom matching against a small built-in rule set.
- **Academics:** grade/trend estimation from academic inputs.
- **Daily Life:** decision scoring from time, energy, mood, and priority.
- Responsive browser UI with no frontend dependency bundle.
- JSON API at `POST /predict`.

## Requirements

- Python 3.9+
- pip

## Run locally

```bash
git clone https://github.com/krishnashahane/Analyst.git
cd Analyst
python -m venv .venv
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

Install and run:
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000/`.

The app binds to loopback and runs with Flask debug mode disabled.

## API

### POST /predict

Example:
```json
{
  "domain": "academics",
  "inputs": {
    "current_grade": 78,
    "study_hours": 3,
    "attendance": 88,
    "difficulty": "medium",
    "extracurriculars": "yes"
  }
}
```

Supported domains: `healthcare`, `academics`, `daily_life`.

The API rejects malformed JSON, unknown domains, invalid numeric ranges, and oversized request bodies.

## Security

The application includes request-size limiting, input validation, security response headers, disabled debug mode, and HTML escaping for API-derived content rendered by the browser.

Generated Python bytecode, virtual environments, logs, local environment files, and OS metadata are excluded through `.gitignore`.

Do not commit credentials, API keys, passwords, or other secrets.

## Limitations

This project uses a deterministic heuristic/rule engine. It does not contain a trained ML model, persistent database, external medical dataset, or clinical validation.

Healthcare output must not be used to diagnose or treat a medical condition. Consult a qualified healthcare professional for medical concerns.

## Development

Syntax check:
```bash
python -m compileall -q app.py predictor.py
```

Smoke test:
```bash
python -c "from app import app; c=app.test_client(); assert c.get('/').status_code == 200; assert c.post('/predict', json={'domain':'academics','inputs':{'current_grade':78,'study_hours':3,'attendance':88,'difficulty':'medium','extracurriculars':'yes'}}).status_code == 200; print('ok')"
```

## License

Apache License 2.0. See [LICENSE](LICENSE).
