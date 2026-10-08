from flask import Flask, jsonify, render_template, request
from predictor import Predictor

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
predictor = Predictor()
VALID_DOMAINS = {"healthcare", "academics", "daily_life"}

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; style-src 'self'; script-src 'self'; "
        "img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
    )
    return response

@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"error": "Request payload is too large."}), 413

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    domain = data.get("domain")
    inputs = data.get("inputs")
    if not isinstance(domain, str) or domain not in VALID_DOMAINS:
        return jsonify({"error": "Invalid domain."}), 400
    if not isinstance(inputs, dict) or not inputs:
        return jsonify({"error": "Missing or invalid inputs."}), 400

    try:
        result = predictor.predict(domain, inputs)
    except (TypeError, ValueError, OverflowError):
        return jsonify({"error": "Invalid input values."}), 400

    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

@app.errorhandler(500)
def internal_error(_error):
    return jsonify({"error": "Internal server error."}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
