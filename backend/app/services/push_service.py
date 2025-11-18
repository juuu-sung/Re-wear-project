def send_push(user_id: int, title: str, body: str):
    # FCM 붙이면 여기만 바꾸면 됨
    print(f"[PUSH] User {user_id} → {title}: {body}")
