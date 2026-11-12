from app.auth import issue_jwt


def test_issued_jwt_contains_user_id_and_expiry():
    from app.config import get_settings

    settings = get_settings()
    token = issue_jwt(42)
    import jwt

    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    assert payload["sub"] == "42"
    assert payload["exp"] > payload["iat"]


def test_issued_jwt_carries_password_reset_revocation_version():
    from app.config import get_settings
    import jwt

    token = issue_jwt(42, token_version=3)
    payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
    assert payload["ver"] == 3
