"""
DESA — Mock Data Module
Generates simulated sensor readings, design variants, risk data, and integration statuses.
"""
import random
import time
from datetime import datetime, timedelta

# ─── Sensor Thresholds ───────────────────────────────────────────────
SENSOR_CONFIG = {
    "soil_pressure": {
        "label": "Soil Pressure",
        "unit": "kPa",
        "min": 80, "max": 250,
        "normal": (100, 180),
        "warning": (180, 220),
        "icon": "⏚"
    },
    "temperature": {
        "label": "Temperature",
        "unit": "°C",
        "min": 15, "max": 55,
        "normal": (20, 38),
        "warning": (38, 48),
        "icon": "🌡"
    },
    "structural_load": {
        "label": "Structural Load",
        "unit": "kN",
        "min": 200, "max": 900,
        "normal": (250, 600),
        "warning": (600, 780),
        "icon": "⚖"
    },
    "moisture": {
        "label": "Moisture",
        "unit": "%",
        "min": 10, "max": 95,
        "normal": (20, 55),
        "warning": (55, 78),
        "icon": "💧"
    }
}


def get_sensor_status(sensor_id, value):
    """Return status string based on value thresholds."""
    cfg = SENSOR_CONFIG[sensor_id]
    lo_n, hi_n = cfg["normal"]
    lo_w, hi_w = cfg["warning"]
    if lo_n <= value <= hi_n:
        return "normal"
    elif lo_w < value <= hi_w or (value < lo_n and value >= cfg["min"]):
        return "warning"
    else:
        return "critical"


def generate_sensor_reading(sensor_id):
    """Generate a single randomized sensor reading."""
    cfg = SENSOR_CONFIG[sensor_id]
    # 70% normal, 20% warning, 10% critical
    roll = random.random()
    if roll < 0.70:
        lo, hi = cfg["normal"]
    elif roll < 0.90:
        lo, hi = cfg["warning"]
    else:
        lo = cfg["warning"][1]
        hi = cfg["max"]
    value = round(random.uniform(lo, hi), 1)
    return {
        "id": sensor_id,
        "label": cfg["label"],
        "unit": cfg["unit"],
        "icon": cfg["icon"],
        "value": value,
        "status": get_sensor_status(sensor_id, value),
        "timestamp": datetime.now().isoformat()
    }


def generate_all_sensors():
    """Return readings for all 4 sensors."""
    return [generate_sensor_reading(sid) for sid in SENSOR_CONFIG]


def generate_sensor_history(sensor_id, hours=24, points=48):
    """Generate historical sensor data for charting."""
    cfg = SENSOR_CONFIG[sensor_id]
    now = datetime.now()
    data = []
    base = random.uniform(cfg["normal"][0], cfg["normal"][1])
    for i in range(points):
        t = now - timedelta(hours=hours) + timedelta(hours=(hours / points) * i)
        drift = random.uniform(-15, 15)
        val = round(max(cfg["min"], min(cfg["max"], base + drift)), 1)
        base = val
        data.append({
            "time": t.strftime("%H:%M"),
            "value": val
        })
    return data


# ─── Generative Design ──────────────────────────────────────────────
VARIANT_NAMES = [
    "Cantilever Optimized", "Deep Foundation Pro", "Hybrid Frame Alpha",
    "Tensile Mesh Beta", "Arch Rib Gamma", "Box Girder Delta",
    "Modular Truss Epsilon", "Shell Structure Zeta"
]

MATERIALS = ["Reinforced Concrete", "Steel Frame", "Composite", "Pre-stressed Concrete", "Timber Hybrid"]


def generate_design_variants(params):
    """Generate 3-5 design variant cards based on input params."""
    # Extract parameters with defaults
    soil_type = str(params.get('soil_type', 'rocky')).lower()
    budget = float(params.get('budget', 45))
    floors = int(params.get('floors', 12))
    max_load = float(params.get('max_load', 500))
    length = float(params.get('length', 120))
    width = float(params.get('width', 80))

    # ── Select variants suited to the parameters ──
    # Build a weighted pool: some designs are more suitable for certain conditions
    weighted_pool = []

    for name in VARIANT_NAMES:
        weight = 10  # base weight

        nl = name.lower()
        # Soil type influence
        if soil_type in ('rocky', 'rock'):
            if 'deep foundation' in nl or 'arch rib' in nl:
                weight += 20
            if 'tensile mesh' in nl:
                weight -= 5
        elif soil_type in ('clay', 'soft', 'loose'):
            if 'deep foundation' in nl or 'cantilever' in nl:
                weight += 15
            if 'shell' in nl:
                weight -= 5
        elif soil_type in ('sandy', 'sand'):
            if 'modular truss' in nl or 'hybrid frame' in nl:
                weight += 15

        # High floors → frame and truss designs
        if floors > 15:
            if 'hybrid frame' in nl or 'box girder' in nl or 'modular truss' in nl:
                weight += 15
            if 'arch rib' in nl or 'shell' in nl:
                weight -= 10
        elif floors <= 5:
            if 'shell' in nl or 'arch rib' in nl or 'cantilever' in nl:
                weight += 10

        # High load → stronger structural types
        if max_load > 700:
            if 'deep foundation' in nl or 'box girder' in nl or 'hybrid frame' in nl:
                weight += 15
        elif max_load < 300:
            if 'tensile mesh' in nl or 'shell' in nl:
                weight += 10

        # Tight budget → simpler designs
        if budget < 25:
            if 'modular truss' in nl or 'hybrid frame' in nl:
                weight += 10
            if 'tensile mesh' in nl or 'shell' in nl:
                weight -= 5

        weighted_pool.append((name, max(weight, 1)))

    # Weighted sampling without replacement
    count = random.randint(3, 5)
    selected = []
    pool = list(weighted_pool)
    for _ in range(count):
        total = sum(w for _, w in pool)
        r = random.uniform(0, total)
        cumulative = 0
        for idx, (n, w) in enumerate(pool):
            cumulative += w
            if r <= cumulative:
                selected.append(n)
                pool.pop(idx)
                break

    # ── Choose materials based on parameters ──
    def pick_material(variant_name):
        nl = variant_name.lower()
        if max_load > 700 or floors > 20:
            choices = ["Steel Frame", "Pre-stressed Concrete", "Reinforced Concrete"]
        elif budget < 25:
            choices = ["Reinforced Concrete", "Composite"]
        elif 'tensile' in nl or 'shell' in nl:
            choices = ["Composite", "Steel Frame", "Timber Hybrid"]
        elif 'deep foundation' in nl:
            choices = ["Reinforced Concrete", "Pre-stressed Concrete"]
        else:
            choices = MATERIALS
        return random.choice(choices)

    # ── Generate scores influenced by parameters ──
    site_area = length * width
    variants = []
    best_score = -1
    best_idx = 0

    for i, name in enumerate(selected):
        # Base scores with parameter influence
        # Cost score: higher budget → higher cost efficiency
        budget_factor = min(budget / 50, 1.5)
        cost_score = int(min(98, max(45, random.randint(45, 75) + budget_factor * 15)))

        # Time score: fewer floors → faster build
        floor_penalty = max(0, (floors - 10) * 1.5)
        time_score = int(min(95, max(40, random.randint(50, 85) - floor_penalty)))

        # Material efficiency: depends on load vs structure type
        load_bonus = 10 if max_load < 500 else -5
        material_eff = int(min(99, max(50, random.randint(55, 85) + load_bonus)))

        # Sustainability: smaller sites and lower floors tend to be greener
        size_bonus = 10 if site_area < 10000 else -5
        sustainability = int(min(95, max(30, random.randint(40, 80) + size_bonus)))

        overall = round((cost_score + time_score + material_eff + sustainability) / 4, 1)

        if overall > best_score:
            best_score = overall
            best_idx = i

        # Estimated cost proportional to budget input
        cost_range_lo = max(10, int(budget * 0.5))
        cost_range_hi = max(cost_range_lo + 5, int(budget * 1.3))
        est_cost = random.randint(cost_range_lo, cost_range_hi)

        # Estimated days proportional to floors
        base_days = max(90, floors * 15 + random.randint(-30, 60))
        est_days = min(365, base_days)

        variants.append({
            "name": name,
            "material": pick_material(name),
            "cost_score": cost_score,
            "time_score": time_score,
            "material_efficiency": material_eff,
            "sustainability": sustainability,
            "overall_score": overall,
            "estimated_cost": f"₹{est_cost}.{random.randint(0, 9)}Cr",
            "estimated_days": est_days,
            "co2_reduction": f"{random.randint(5, 35)}%",
            "ai_recommended": False
        })

    variants[best_idx]["ai_recommended"] = True
    return variants


# ─── Recalibration Engine ────────────────────────────────────────────
RECALIBRATION_ACTIONS = [
    {"trigger": "Soil Pressure exceeded 200 kPa", "original": "Standard footing depth: 1.8m", "adjusted": "AI recommends: Increase to 2.4m with geo-grid reinforcement", "impact": "Prevents foundation settlement risk"},
    {"trigger": "Temperature spike above 45°C", "original": "Standard curing period: 7 days", "adjusted": "AI recommends: Extend to 10 days with mist curing", "impact": "Ensures concrete strength integrity"},
    {"trigger": "Structural Load near 750 kN", "original": "Column size: 450mm × 450mm", "adjusted": "AI recommends: Increase to 500mm × 500mm with additional rebars", "impact": "Prevents structural overload"},
    {"trigger": "Moisture level above 70%", "original": "Excavation slope: 1:1.5", "adjusted": "AI recommends: Flatten to 1:2 with dewatering wells", "impact": "Prevents slope failure and waterlogging"},
    {"trigger": "Wind speed exceeding 60 km/h", "original": "Crane operation: Normal mode", "adjusted": "AI recommends: Suspend crane ops, switch to ground-level assembly", "impact": "Worker safety assurance"},
    {"trigger": "Vibration levels elevated", "original": "Pile driving: Continuous operation", "adjusted": "AI recommends: Switch to intermittent driving with 30min cooldown", "impact": "Reduces structural fatigue risk"},
]

audit_log = []


def generate_recalibration():
    """Generate a recalibration alert."""
    action = random.choice(RECALIBRATION_ACTIONS)
    return {
        "id": f"RCL-{random.randint(1000, 9999)}",
        "timestamp": datetime.now().isoformat(),
        "trigger": action["trigger"],
        "original_design": action["original"],
        "ai_adjustment": action["adjusted"],
        "impact": action["impact"],
        "status": "pending"
    }


def get_audit_log():
    """Return recent audit log entries."""
    return audit_log[-20:]


def add_audit_entry(entry):
    """Add an entry to the audit log."""
    audit_log.append({
        "id": entry.get("id", f"RCL-{random.randint(1000, 9999)}"),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "trigger": entry.get("trigger", "Unknown"),
        "action": entry.get("action", "accepted"),
        "result": entry.get("result", "Design updated")
    })


# ─── Risk Predictor ─────────────────────────────────────────────────
def generate_risk_data():
    """Generate risk prediction data."""
    predicted_progress = random.randint(60, 80)
    actual_progress = predicted_progress - random.randint(2, 15)
    return {
        "predicted_progress": predicted_progress,
        "actual_progress": max(20, actual_progress),
        "schedule_variance": f"{predicted_progress - actual_progress} days behind",
        "risks": [
            {
                "type": "Delay Risk",
                "icon": "⏱",
                "severity": random.choice(["low", "medium", "high"]),
                "probability": random.randint(15, 75),
                "description": "Weather delays may extend foundation work by 3-5 days",
                "mitigation": "Pre-cast components ready as backup"
            },
            {
                "type": "Cost Overrun",
                "icon": "💰",
                "severity": random.choice(["low", "medium", "high"]),
                "probability": random.randint(10, 60),
                "description": "Material price fluctuation in steel (+8%)",
                "mitigation": "Locked procurement contracts for Q2"
            },
            {
                "type": "Material Shortage",
                "icon": "📦",
                "severity": random.choice(["low", "medium", "high"]),
                "probability": random.randint(5, 45),
                "description": "Cement supply chain disruption predicted",
                "mitigation": "Alternative supplier pre-qualified"
            }
        ],
        "savings": {
            "cost_saved": f"₹{random.randint(2, 12)}.{random.randint(1, 9)}Cr",
            "time_saved": f"{random.randint(8, 35)} days",
            "rework_avoided": f"{random.randint(3, 15)} incidents",
            "efficiency_gain": f"{random.randint(12, 28)}%"
        }
    }


# ─── Integration Hub ────────────────────────────────────────────────
def generate_integrations():
    """Generate integration source statuses."""
    sources = [
        {"name": "BIM Model Server", "icon": "🏗", "type": "Autodesk BIM 360", "description": "3D Building Information Model synced from design team"},
        {"name": "IoT Sensor Network", "icon": "📡", "type": "LoRaWAN Gateway", "description": "128 field sensors across 4 zones streaming live data"},
        {"name": "Weather API", "icon": "🌤", "type": "OpenWeather Pro", "description": "72-hour forecast with wind, rain, and temperature alerts"},
        {"name": "Material Database", "icon": "🗄", "type": "SAP S/4HANA", "description": "Real-time inventory and procurement tracking system"},
    ]
    statuses = ["connected", "connected", "connected", "syncing", "disconnected"]
    result = []
    for src in sources:
        status = random.choice(statuses)
        minutes_ago = random.randint(0, 120) if status != "disconnected" else random.randint(300, 1440)
        last_sync = (datetime.now() - timedelta(minutes=minutes_ago)).strftime("%H:%M:%S")
        result.append({
            **src,
            "status": status,
            "last_sync": last_sync,
            "data_points": f"{random.randint(1, 50)}K" if status == "connected" else "—",
            "latency": f"{random.randint(12, 250)}ms" if status != "disconnected" else "—"
        })
    return result
