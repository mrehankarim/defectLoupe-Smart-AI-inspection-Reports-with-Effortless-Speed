"""Case-insensitive SQLAlchemy Enum type.

PostgreSQL enum columns may store values in a different case than the
Python ``enum.Enum`` definitions (e.g. the DB has ``'DRAFT'`` while
Python defines ``DRAFT = "draft"``).  This type decorator normalises
the value to lower-case when reading from the database so that the
Python enum can resolve it correctly.
"""
import enum as _enum

from sqlalchemy import Enum as SAEnum, TypeDecorator


class CaseInsensitiveEnum(TypeDecorator):
    """Drop-in replacement for ``sqlalchemy.Enum`` that lower-cases
    values coming from the database before matching them against the
    Python enum members.
    """

    impl = SAEnum
    cache_ok = True

    def __init__(self, enum_class: type[_enum.Enum], **kw):
        self.enum_class = enum_class
        self.impl = SAEnum(enum_class, **kw)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, _enum.Enum):
            return value.value
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, _enum.Enum):
            return value
        # Try exact match first
        try:
            return self.enum_class(value)
        except ValueError:
            pass
        # Fall back to case-insensitive match
        if isinstance(value, str):
            lower = value.lower()
            for member in self.enum_class:
                if member.value.lower() == lower:
                    return member
        return value
