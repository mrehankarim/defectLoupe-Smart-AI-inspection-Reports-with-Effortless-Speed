from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    INSPECTOR = "INSPECTOR"
    CLIENT_VIEWER = "CLIENT_VIEWER"


def effective_role(role: UserRole | str | None, is_admin: bool = False) -> UserRole:
    if is_admin:
        return UserRole.ADMIN
    if role is None:
        return UserRole.INSPECTOR
    return UserRole(role)
