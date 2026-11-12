from pwdlib import PasswordHash

from app.schemas import EmailLogin, EmailRegistration


def test_password_hash_verifies_without_storing_plaintext():
    hasher = PasswordHash.recommended()
    password = "Correct Horse Battery Staple!"
    hashed = hasher.hash(password)

    assert password not in hashed
    assert hasher.verify(password, hashed)
    assert not hasher.verify("a different password", hashed)


def test_registration_requires_email_name_and_long_password():
    registration = EmailRegistration(
        email="Member@Example.com",
        full_name="Hub Member",
        password="a sufficiently long password",
    )
    assert str(registration.email) == "Member@example.com"

    try:
        EmailRegistration(
            email="not-an-email",
            full_name="Hub Member",
            password="too short",
        )
    except ValueError:
        pass
    else:
        raise AssertionError("Invalid registration data should be rejected.")


def test_login_requires_an_email_address():
    login = EmailLogin(email="Member@example.com", password="any password")
    assert str(login.email) == "Member@example.com"
