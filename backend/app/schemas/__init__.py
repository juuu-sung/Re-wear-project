# app/schemas/__init__.py

# 🧍 사용자 관련
from .user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserOut,
    RegisterIn,
)

# 👕 옷 관련
from .clothes import (
    ClothesBase,
    ClothesCreate,
    ClothesOut,
)

# 📅 이벤트 관련
from .event import (
    EventBase,
    EventCreate,
    EventUpdate,   #  추가
    EventResponse,
)
