use jsonwebtoken::{decode, errors::Error as JwtError, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Claims carried by the short-lived JWT issued by the Next.js app and used to
/// authenticate browser WebSocket upgrades. Mirrors `RealtimeJwtClaims` in
/// `packages/shared-protocol`.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RealtimeClaims {
    pub sub: String,
    #[serde(rename = "interviewId")]
    pub interview_id: Uuid,
    pub role: Role,
    pub iat: i64,
    pub exp: i64,
    #[serde(default)]
    pub iss: Option<String>,
    #[serde(default)]
    pub aud: Option<serde_json::Value>,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Candidate,
    Interviewer,
}

pub fn decode_token(token: &str, secret: &str) -> Result<RealtimeClaims, JwtError> {
    let key = DecodingKey::from_secret(secret.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_audience(&["leucent-realtime"]);
    validation.set_issuer(&["leucent-web"]);
    let data = decode::<RealtimeClaims>(token, &key, &validation)?;
    Ok(data.claims)
}

#[cfg(test)]
mod tests {
    use super::*;
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde_json::json;
    use std::time::{SystemTime, UNIX_EPOCH};

    const SECRET: &str = "test-secret-very-long-enough-please";

    fn now() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64
    }

    fn mint(claims: serde_json::Value, secret: &str) -> String {
        let header = Header::new(Algorithm::HS256);
        let key = EncodingKey::from_secret(secret.as_bytes());
        encode(&header, &claims, &key).unwrap()
    }

    fn valid_claims() -> serde_json::Value {
        let iat = now();
        json!({
            "sub": "user_123",
            "interviewId": "11111111-2222-4333-8444-555555555555",
            "role": "candidate",
            "iat": iat,
            "exp": iat + 3600,
            "iss": "leucent-web",
            "aud": "leucent-realtime",
        })
    }

    #[test]
    fn role_serializes_lowercase() {
        let json = serde_json::to_string(&Role::Candidate).unwrap();
        assert_eq!(json, "\"candidate\"");
        let role: Role = serde_json::from_str("\"interviewer\"").unwrap();
        assert_eq!(role, Role::Interviewer);
    }

    #[test]
    fn decode_token_accepts_well_formed_jwt() {
        let token = mint(valid_claims(), SECRET);
        let claims = decode_token(&token, SECRET).expect("decode should succeed");
        assert_eq!(claims.sub, "user_123");
        assert_eq!(claims.role, Role::Candidate);
        assert_eq!(claims.iss.as_deref(), Some("leucent-web"));
    }

    #[test]
    fn decode_token_rejects_wrong_secret() {
        let token = mint(valid_claims(), SECRET);
        let err = decode_token(&token, "a-totally-different-secret").unwrap_err();
        assert!(matches!(
            err.kind(),
            jsonwebtoken::errors::ErrorKind::InvalidSignature
        ));
    }

    #[test]
    fn decode_token_rejects_wrong_audience() {
        let mut claims = valid_claims();
        claims["aud"] = json!("not-leucent-realtime");
        let token = mint(claims, SECRET);
        let err = decode_token(&token, SECRET).unwrap_err();
        assert!(matches!(
            err.kind(),
            jsonwebtoken::errors::ErrorKind::InvalidAudience
        ));
    }

    #[test]
    fn decode_token_rejects_wrong_issuer() {
        let mut claims = valid_claims();
        claims["iss"] = json!("someone-else");
        let token = mint(claims, SECRET);
        let err = decode_token(&token, SECRET).unwrap_err();
        assert!(matches!(
            err.kind(),
            jsonwebtoken::errors::ErrorKind::InvalidIssuer
        ));
    }

    #[test]
    fn decode_token_rejects_expired() {
        let mut claims = valid_claims();
        let past = now() - 7200;
        claims["iat"] = json!(past - 3600);
        claims["exp"] = json!(past);
        let token = mint(claims, SECRET);
        let err = decode_token(&token, SECRET).unwrap_err();
        assert!(matches!(
            err.kind(),
            jsonwebtoken::errors::ErrorKind::ExpiredSignature
        ));
    }

    #[test]
    fn decode_token_rejects_non_uuid_interview_id() {
        let mut claims = valid_claims();
        claims["interviewId"] = json!("not-a-uuid");
        let token = mint(claims, SECRET);
        let result = decode_token(&token, SECRET);
        assert!(result.is_err(), "non-UUID interviewId must not parse");
    }

    #[test]
    fn decode_token_rejects_unknown_role() {
        let mut claims = valid_claims();
        claims["role"] = json!("admin");
        let token = mint(claims, SECRET);
        let result = decode_token(&token, SECRET);
        assert!(result.is_err(), "unknown role must not parse");
    }
}
