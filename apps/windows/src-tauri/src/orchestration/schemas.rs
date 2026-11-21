//! Lightweight schema hints for structured job-search outputs.
//! Full JSON Schema validation happens after the model responds.

pub fn expected_schema_name(workflow: &str) -> &'static str {
    match workflow {
        "rank" => "JobFitAnalysis",
        "apply" => "ResumeSuggestions",
        "interview" => "InterviewPreparation",
        "upskill" => "SkillGapReport",
        "setup" | "expand" => "ProfileInsights",
        "outcome" => "FollowUpDraft",
        _ => "JobSearchAssist",
    }
}

pub fn schema_hint(workflow: &str) -> &'static str {
    match workflow {
        "rank" => {
            r#"{
  "schema": "JobFitAnalysis",
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "fit": "high|medium|low",
      "score": 0,
      "rationale": "string",
      "gaps": ["string"],
      "risks": ["string"]
    }
  ],
  "notes": "string",
  "disclaimer": "Model output is advisory; verify against profile facts."
}"#
        }
        "apply" => {
            r#"{
  "schema": "ResumeSuggestions",
  "role": "string",
  "company": "string",
  "bullets_to_emphasize": ["string"],
  "cover_letter_outline": ["string"],
  "claims_requiring_user_confirmation": ["string"],
  "disclaimer": "Do not invent experience. Draft only."
}"#
        }
        "interview" => {
            r#"{
  "schema": "InterviewPreparation",
  "company": "string",
  "stage": "string",
  "likely_questions": ["string"],
  "stories_to_prepare": ["string"],
  "questions_to_ask": ["string"],
  "disclaimer": "Based on provided context only."
}"#
        }
        "upskill" => {
            r#"{
  "schema": "SkillGapReport",
  "priority_gaps": [{"skill":"string","evidence":"string","action":"string"}],
  "strengths": ["string"],
  "disclaimer": "Gaps are inferred from text; confirm before acting."
}"#
        }
        "setup" | "expand" => {
            r#"{
  "schema": "ProfileInsights",
  "summary": "string",
  "missing_sections": ["string"],
  "suggested_next_steps": ["string"],
  "disclaimer": "Insights only; confirm before writing profile files."
}"#
        }
        "outcome" => {
            r#"{
  "schema": "FollowUpDraft",
  "suggested_status": "string",
  "follow_up_email_draft": "string",
  "notes": "string",
  "disclaimer": "Never send email automatically. User must confirm status changes."
}"#
        }
        _ => {
            r#"{
  "schema": "JobSearchAssist",
  "answer": "string",
  "disclaimer": "Advisory only."
}"#
        }
    }
}

/// Returns true when the JSON object declares the expected schema name or has
/// the primary fields for that workflow.
pub fn validate_structured(workflow: &str, v: &serde_json::Value) -> Result<(), String> {
    let obj = v
        .as_object()
        .ok_or_else(|| "structured output must be a JSON object".to_string())?;
    let expected = expected_schema_name(workflow);
    if let Some(s) = obj.get("schema").and_then(|x| x.as_str()) {
        if s != expected && s != "JobSearchAssist" {
            return Err(format!("unexpected schema '{s}', expected '{expected}'"));
        }
    }
    let required: &[&str] = match workflow {
        "rank" => &["jobs"],
        "apply" => &["bullets_to_emphasize"],
        "interview" => &["likely_questions"],
        "upskill" => &["priority_gaps"],
        "setup" | "expand" => &["summary"],
        "outcome" => &["follow_up_email_draft"],
        _ => &["answer"],
    };
    for k in required {
        if !obj.contains_key(*k) {
            return Err(format!("missing required field '{k}' for {expected}"));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn validates_rank() {
        let v = json!({
            "schema": "JobFitAnalysis",
            "jobs": [],
            "notes": "n",
            "disclaimer": "d"
        });
        assert!(validate_structured("rank", &v).is_ok());
    }

    #[test]
    fn rejects_missing_field() {
        let v = json!({"schema": "JobFitAnalysis"});
        assert!(validate_structured("rank", &v).is_err());
    }
}
