"""
AI Predictor Analyst Engine
Uses weighted rule-based scoring with probabilistic modeling
to predict outcomes across healthcare, academics, and daily life.
"""

import random
import math


class Predictor:

    def predict(self, domain: str, inputs: dict) -> dict:
        handlers = {
            "healthcare": self._predict_healthcare,
            "academics": self._predict_academics,
            "daily_life": self._predict_daily_life,
        }
        handler = handlers.get(domain)
        if not handler:
            return {"error": f"Unknown domain: {domain}"}
        return handler(inputs)

    # ── Healthcare Diagnosis Predictor ──────────────────────────────

    def _predict_healthcare(self, inputs: dict) -> dict:
        symptoms = [s.strip().lower() for s in inputs.get("symptoms", "").split(",") if s.strip()]
        age = int(inputs.get("age", 30))
        lifestyle = inputs.get("lifestyle", "moderate").lower()

        if not symptoms:
            return {"error": "Please provide at least one symptom."}

        conditions = self._match_conditions(symptoms)
        risk_modifier = self._lifestyle_risk(lifestyle, age)

        scored = []
        for condition in conditions:
            base = condition["base_probability"]
            matched = len(set(condition["triggers"]) & set(symptoms))
            total = len(condition["triggers"])
            match_ratio = matched / total
            probability = min(base * match_ratio * risk_modifier, 0.95)
            probability = round(probability, 2)
            if probability > 0.05:
                scored.append({
                    "condition": condition["name"],
                    "probability": probability,
                    "severity": condition["severity"],
                    "matched_symptoms": list(set(condition["triggers"]) & set(symptoms)),
                })

        scored.sort(key=lambda x: x["probability"], reverse=True)
        top = scored[:3] if scored else [{"condition": "No strong match found", "probability": 0, "severity": "low", "matched_symptoms": []}]

        recommendations = self._health_recommendations(top, age, lifestyle)

        return {
            "domain": "Healthcare Diagnosis",
            "predictions": top,
            "recommendations": recommendations,
            "disclaimer": "This is an AI-based prediction for educational purposes only. Always consult a qualified healthcare professional.",
        }

    def _match_conditions(self, symptoms):
        condition_db = [
            {"name": "Common Cold / Flu", "triggers": ["fever", "cough", "headache", "sore throat", "runny nose", "body ache", "fatigue"], "base_probability": 0.85, "severity": "low"},
            {"name": "Migraine", "triggers": ["headache", "nausea", "sensitivity to light", "dizziness", "blurred vision"], "base_probability": 0.80, "severity": "moderate"},
            {"name": "Gastritis", "triggers": ["stomach pain", "nausea", "bloating", "vomiting", "loss of appetite", "acid reflux"], "base_probability": 0.78, "severity": "moderate"},
            {"name": "Hypertension Risk", "triggers": ["headache", "dizziness", "chest pain", "shortness of breath", "fatigue", "blurred vision"], "base_probability": 0.72, "severity": "high"},
            {"name": "Type 2 Diabetes Indicator", "triggers": ["frequent urination", "excessive thirst", "fatigue", "blurred vision", "slow healing", "weight loss"], "base_probability": 0.70, "severity": "high"},
            {"name": "Anxiety / Stress Disorder", "triggers": ["insomnia", "fatigue", "headache", "chest pain", "rapid heartbeat", "irritability", "difficulty concentrating"], "base_probability": 0.75, "severity": "moderate"},
            {"name": "Allergic Reaction", "triggers": ["sneezing", "runny nose", "itchy eyes", "rash", "swelling", "cough"], "base_probability": 0.82, "severity": "low"},
            {"name": "Respiratory Infection", "triggers": ["cough", "shortness of breath", "fever", "chest pain", "fatigue", "wheezing"], "base_probability": 0.76, "severity": "high"},
            {"name": "Iron Deficiency Anemia", "triggers": ["fatigue", "dizziness", "pale skin", "shortness of breath", "cold hands", "headache"], "base_probability": 0.68, "severity": "moderate"},
            {"name": "Vitamin D Deficiency", "triggers": ["fatigue", "bone pain", "muscle weakness", "mood changes", "hair loss"], "base_probability": 0.72, "severity": "low"},
        ]
        matched = []
        for cond in condition_db:
            overlap = set(cond["triggers"]) & set(symptoms)
            if overlap:
                matched.append(cond)
        return matched

    def _lifestyle_risk(self, lifestyle, age):
        base = 1.0
        if lifestyle == "sedentary":
            base = 1.3
        elif lifestyle == "active":
            base = 0.8
        if age > 60:
            base *= 1.25
        elif age > 40:
            base *= 1.1
        elif age < 18:
            base *= 0.85
        return base

    def _health_recommendations(self, predictions, age, lifestyle):
        recs = []
        severities = [p.get("severity", "low") for p in predictions]
        if "high" in severities:
            recs.append("Consult a doctor immediately for a detailed examination.")
            recs.append("Get blood work and vitals checked within the next 48 hours.")
        if "moderate" in severities:
            recs.append("Schedule a check-up with your physician within a week.")
            recs.append("Monitor your symptoms and maintain a symptom diary.")
        if lifestyle == "sedentary":
            recs.append("Incorporate at least 30 minutes of physical activity daily.")
        if age > 40:
            recs.append("Consider annual comprehensive health screenings.")
        recs.append("Stay hydrated and ensure 7-8 hours of sleep.")
        return recs

    # ── Academics Predictor ─────────────────────────────────────────

    def _predict_academics(self, inputs: dict) -> dict:
        current_grade = float(inputs.get("current_grade", 70))
        study_hours = float(inputs.get("study_hours", 2))
        attendance = float(inputs.get("attendance", 75))
        difficulty = inputs.get("difficulty", "medium").lower()
        extracurriculars = inputs.get("extracurriculars", "no").lower() == "yes"

        difficulty_map = {"easy": 1.1, "medium": 1.0, "hard": 0.85, "very hard": 0.7}
        diff_factor = difficulty_map.get(difficulty, 1.0)

        study_impact = min(study_hours / 6.0, 1.0) * 15
        attendance_impact = (attendance / 100.0) * 10
        extra_bonus = 3 if extracurriculars else 0

        predicted_grade = current_grade + (study_impact + attendance_impact + extra_bonus - 10) * diff_factor
        predicted_grade = max(0, min(100, round(predicted_grade, 1)))

        if predicted_grade >= 90:
            outcome = "Excellent Performance"
            pass_likelihood = 0.98
        elif predicted_grade >= 75:
            outcome = "Good Performance"
            pass_likelihood = 0.92
        elif predicted_grade >= 60:
            outcome = "Average Performance"
            pass_likelihood = 0.80
        elif predicted_grade >= 45:
            outcome = "Below Average - At Risk"
            pass_likelihood = 0.55
        else:
            outcome = "Failing - Immediate Action Needed"
            pass_likelihood = 0.25

        recommendations = []
        if study_hours < 3:
            recommendations.append(f"Increase study hours from {study_hours}h to at least 3-4 hours daily.")
        if attendance < 80:
            recommendations.append(f"Improve attendance from {attendance}% to above 85%.")
        if difficulty in ("hard", "very hard"):
            recommendations.append("Consider joining a study group or getting a tutor for difficult subjects.")
        if not extracurriculars:
            recommendations.append("Balanced extracurriculars can boost focus and overall performance.")
        if predicted_grade < 60:
            recommendations.append("Meet with your academic advisor to create a recovery plan.")
        recommendations.append("Use active recall and spaced repetition for better retention.")

        return {
            "domain": "Academic Performance",
            "predictions": [{
                "predicted_grade": predicted_grade,
                "outcome": outcome,
                "pass_likelihood": round(pass_likelihood, 2),
                "grade_trend": "improving" if study_hours >= 3 and attendance >= 80 else "declining",
            }],
            "analysis": {
                "study_impact": f"+{round(study_impact, 1)} points",
                "attendance_impact": f"+{round(attendance_impact, 1)} points",
                "difficulty_modifier": f"x{diff_factor}",
            },
            "recommendations": recommendations,
        }

    # ── Daily Life Decision Predictor ───────────────────────────────

    def _predict_daily_life(self, inputs: dict) -> dict:
        decision = inputs.get("decision", "").strip()
        energy_level = inputs.get("energy_level", "medium").lower()
        time_available = float(inputs.get("time_available", 2))
        priority = inputs.get("priority", "medium").lower()
        mood = inputs.get("mood", "neutral").lower()

        if not decision:
            return {"error": "Please describe the decision you're facing."}

        decision_lower = decision.lower()
        categories = self._categorize_decision(decision_lower)

        energy_map = {"low": 0.6, "medium": 1.0, "high": 1.3}
        mood_map = {"stressed": 0.7, "sad": 0.75, "neutral": 1.0, "happy": 1.15, "motivated": 1.3}
        priority_map = {"low": 0.8, "medium": 1.0, "high": 1.2, "urgent": 1.4}

        e_factor = energy_map.get(energy_level, 1.0)
        m_factor = mood_map.get(mood, 1.0)
        p_factor = priority_map.get(priority, 1.0)
        time_factor = min(time_available / 4.0, 1.2)

        success_score = 0.5 * e_factor * m_factor * p_factor * time_factor
        success_score = max(0.1, min(0.95, round(success_score, 2)))

        if success_score >= 0.75:
            verdict = "Go for it! Conditions are favorable."
            action = "proceed"
        elif success_score >= 0.5:
            verdict = "Proceed with some planning. Conditions are moderate."
            action = "proceed_with_caution"
        elif success_score >= 0.3:
            verdict = "Consider postponing or adjusting your approach."
            action = "reconsider"
        else:
            verdict = "Not the best time. Rest and revisit this later."
            action = "postpone"

        tips = self._daily_tips(categories, energy_level, mood, time_available)

        optimal_time = "morning" if energy_level == "high" else "afternoon" if energy_level == "medium" else "after rest"

        return {
            "domain": "Daily Life Decision",
            "predictions": [{
                "decision": decision,
                "success_likelihood": success_score,
                "verdict": verdict,
                "recommended_action": action,
                "optimal_time": optimal_time,
                "categories": categories,
            }],
            "factors": {
                "energy_contribution": e_factor,
                "mood_contribution": m_factor,
                "priority_weight": p_factor,
                "time_adequacy": round(time_factor, 2),
            },
            "tips": tips,
        }

    def _categorize_decision(self, decision):
        categories = []
        fitness_words = ["gym", "exercise", "run", "workout", "walk", "yoga", "sport"]
        food_words = ["eat", "cook", "meal", "diet", "food", "restaurant", "lunch", "dinner", "breakfast"]
        work_words = ["work", "project", "deadline", "meeting", "presentation", "task", "office"]
        social_words = ["friend", "party", "meet", "hangout", "call", "visit", "date", "social"]
        finance_words = ["buy", "invest", "save", "spend", "purchase", "money", "budget", "shopping"]
        learning_words = ["learn", "study", "course", "read", "book", "skill", "tutorial", "practice"]
        travel_words = ["travel", "trip", "vacation", "commute", "drive", "flight"]

        for word_list, cat in [
            (fitness_words, "Fitness & Health"),
            (food_words, "Food & Nutrition"),
            (work_words, "Work & Productivity"),
            (social_words, "Social & Relationships"),
            (finance_words, "Finance & Spending"),
            (learning_words, "Learning & Growth"),
            (travel_words, "Travel & Commute"),
        ]:
            if any(w in decision for w in word_list):
                categories.append(cat)
        return categories or ["General Decision"]

    def _daily_tips(self, categories, energy, mood, time):
        tips = []
        if energy == "low":
            tips.append("Start with a 5-minute energizer: stretch, splash cold water, or take a short walk.")
        if mood in ("stressed", "sad"):
            tips.append("Take 3 deep breaths before starting. A calm mind makes better decisions.")
        if time < 1:
            tips.append("You're short on time. Focus on the single most impactful action.")
        if "Fitness & Health" in categories:
            tips.append("Even 15 minutes of movement counts. Don't skip it entirely.")
        if "Work & Productivity" in categories:
            tips.append("Use the Pomodoro technique: 25 min focused work, 5 min break.")
        if "Finance & Spending" in categories:
            tips.append("Apply the 24-hour rule: wait a day before any non-essential purchase.")
        if "Learning & Growth" in categories:
            tips.append("Teach what you learn to someone else - it doubles your retention.")
        if "Social & Relationships" in categories:
            tips.append("Quality over quantity: a meaningful 30-min conversation beats hours of small talk.")
        tips.append("Write down your decision and revisit it tomorrow for clarity.")
        return tips
