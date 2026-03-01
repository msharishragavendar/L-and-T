"""
DESA — Dynamic Engineering & Site Automation System
Flask Application
"""
from flask import Flask, render_template, jsonify, request
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from data.mock_data import (
    generate_all_sensors,
    generate_sensor_history,
    generate_design_variants,
    generate_recalibration,
    get_audit_log,
    add_audit_entry,
    generate_risk_data,
    generate_integrations,
    SENSOR_CONFIG
)
from data.gemini_design import generate_with_gemini

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/sensors")
def api_sensors():
    readings = generate_all_sensors()
    history = {}
    for sid in SENSOR_CONFIG:
        history[sid] = generate_sensor_history(sid)
    return jsonify({"readings": readings, "history": history})


@app.route("/api/generate-design", methods=["POST"])
def api_generate_design():
    params = request.get_json() or {}
    user_prompt = params.pop("user_prompt", "")
    api_key = params.pop("api_key", "")

    # Try Gemini first, fall back to mock
    variants = generate_with_gemini(params, user_prompt, api_key)
    source = "gemini"

    if variants is None:
        variants = generate_design_variants(params)
        # Add placeholder ai_reasoning for mock data
        for v in variants:
            v["ai_reasoning"] = "Generated from simulation engine."
        source = "mock"

    return jsonify({"variants": variants, "source": source})


@app.route("/api/recalibrations")
def api_recalibrations():
    alert = generate_recalibration()
    log = get_audit_log()
    return jsonify({"alert": alert, "audit_log": log})


@app.route("/api/recalibrations/action", methods=["POST"])
def api_recalibration_action():
    data = request.get_json() or {}
    add_audit_entry(data)
    return jsonify({"status": "ok", "audit_log": get_audit_log()})


@app.route("/api/risks")
def api_risks():
    return jsonify(generate_risk_data())


@app.route("/api/integrations")
def api_integrations():
    return jsonify({"sources": generate_integrations()})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
