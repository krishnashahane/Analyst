from flask import Flask, render_template, request, jsonify
from predictor import Predictor

app = Flask(__name__)
predictor = Predictor()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    domain = data.get("domain", "")
    inputs = data.get("inputs", {})

    if not domain or not inputs:
        return jsonify({"error": "Missing domain or inputs"}), 400

    result = predictor.predict(domain, inputs)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
