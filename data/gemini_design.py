"""
DESA — Gemini AI Design Generator
Uses Google Gemini API to generate structural design variants from site parameters + user prompt.
Falls back to mock data if API key is missing or the call fails.
"""
import os
import json
import random
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDQniW43gyAJIutXExh3N7B9CYEUaE2WQs")


def generate_with_gemini(params, user_prompt="", api_key=""):
    """
    Call Gemini to generate intelligent structural design variants.
    params: dict with keys like length, width, soil_type, max_load, floors, budget
    user_prompt: optional free-text prompt from the user for additional design direction
    api_key: optional API key from the frontend, overrides env var
    Returns: list of variant dicts or None if the call fails.
    """
    key = api_key or GEMINI_API_KEY
    if not key:
        return None

    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        system_prompt = f"""You are an expert structural engineer and AI generative design system for construction projects.

Given these site parameters:
- Site Dimensions: {params.get('length', 120)}m × {params.get('width', 80)}m
- Soil Type: {params.get('soil_type', 'rocky')}
- Max Load Capacity: {params.get('max_load', 500)} kN
- Number of Floors: {params.get('floors', 12)}
- Budget: ₹{params.get('budget', 45)} Crores

{f'Additional Design Requirements from Engineer: {user_prompt}' if user_prompt else ''}

Generate exactly 4 unique structural design variants optimized for these conditions.
Each variant MUST use one of these exact names (pick 4):
- Cantilever Optimized
- Deep Foundation Pro
- Hybrid Frame Alpha
- Tensile Mesh Beta
- Arch Rib Gamma
- Box Girder Delta
- Modular Truss Epsilon
- Shell Structure Zeta

For each variant, provide:
1. name: one of the exact names above
2. material: the primary structural material (e.g., "Reinforced Concrete", "Steel Frame", "Composite", "Pre-stressed Concrete", "Timber Hybrid")
3. cost_score: integer 40-98 (cost efficiency rating)
4. time_score: integer 40-95 (time efficiency rating)
5. material_efficiency: integer 50-99
6. sustainability: integer 30-95
7. overall_score: float — average of the 4 scores, rounded to 1 decimal
8. estimated_cost: string like "₹42.3Cr"
9. estimated_days: integer 90-365
10. co2_reduction: string like "22%"
11. ai_recommended: boolean — true for ONLY the best variant
12. ai_reasoning: string — 1-2 sentence explanation of why this variant suits the given parameters

IMPORTANT: Your reasoning should reflect the actual site parameters. For example:
- Rocky soil → Deep foundations or Arch structures
- High load → Stronger materials like steel or pre-stressed concrete
- Tight budget → Cost-efficient materials like reinforced concrete
- Many floors → Frame-based designs
- If the user asks for sustainability → prioritize green materials

Return ONLY valid JSON — an array of 4 objects. No markdown, no explanation outside the JSON."""

        response = model.generate_content(system_prompt)
        text = response.text.strip()

        # Clean markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        variants = json.loads(text)

        # Validate and sanitize
        valid_names = [
            "Cantilever Optimized", "Deep Foundation Pro", "Hybrid Frame Alpha",
            "Tensile Mesh Beta", "Arch Rib Gamma", "Box Girder Delta",
            "Modular Truss Epsilon", "Shell Structure Zeta"
        ]

        sanitized = []
        for v in variants:
            name = v.get("name", "")
            # Find closest valid name
            if name not in valid_names:
                name = random.choice(valid_names)

            sanitized.append({
                "name": name,
                "material": v.get("material", "Composite"),
                "cost_score": int(v.get("cost_score", 70)),
                "time_score": int(v.get("time_score", 65)),
                "material_efficiency": int(v.get("material_efficiency", 72)),
                "sustainability": int(v.get("sustainability", 55)),
                "overall_score": float(v.get("overall_score", 65.5)),
                "estimated_cost": v.get("estimated_cost", "₹40Cr"),
                "estimated_days": int(v.get("estimated_days", 200)),
                "co2_reduction": v.get("co2_reduction", "15%"),
                "ai_recommended": bool(v.get("ai_recommended", False)),
                "ai_reasoning": v.get("ai_reasoning", "AI-optimized for given site conditions.")
            })

        # Ensure exactly one recommended
        recs = [i for i, s in enumerate(sanitized) if s["ai_recommended"]]
        if len(recs) == 0:
            best = max(range(len(sanitized)), key=lambda i: sanitized[i]["overall_score"])
            sanitized[best]["ai_recommended"] = True
        elif len(recs) > 1:
            for i in recs[1:]:
                sanitized[i]["ai_recommended"] = False

        return sanitized

    except Exception as e:
        print(f"[DESA] Gemini API error: {e}")
        return None
