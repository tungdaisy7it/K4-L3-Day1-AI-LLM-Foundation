"""
Web Chatbot — giao diện trực quan cho pipeline gọi LLM API.

Minh họa từng bước:
    Người dùng nhập câu hỏi
        -> Ứng dụng tạo danh sách messages
        -> System prompt + lịch sử hội thoại + câu hỏi mới
        -> Gửi request tới LLM API (model hiển thị trên giao diện)
        -> Model sinh phản hồi
        -> Ứng dụng hiển thị nội dung và cập nhật history
        -> Đếm token, ước tính chi phí và chờ câu hỏi tiếp theo

Chạy:
    pip install -r webchat/requirements.txt
    python webchat/app.py
    Mở http://127.0.0.1:5000
"""

import os
import time
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

MODEL = os.getenv("LAB_MODEL", "gpt-4o")
BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
MAX_HISTORY_MESSAGES = 6  # giữ 3 lượt hội thoại gần nhất (user + assistant)

PRICING_PER_1K_TOKENS = {
    "gpt-4o": {"input": 0.0025, "output": 0.010},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
}
DEFAULT_PRICING = {"input": 0.0025, "output": 0.010}

DEFAULT_PERSONA = (
    "Bạn là trợ giảng thân thiện của khóa AI, trả lời ngắn gọn bằng tiếng Việt."
)

app = Flask(__name__)


def count_tokens(text: str, model: str = MODEL) -> int:
    try:
        import tiktoken

        enc = tiktoken.encoding_for_model(model)
        return len(enc.encode(text))
    except Exception:
        return max(1, len(text) // 4)


def estimate_cost(prompt: str, response: str, model: str = MODEL) -> dict:
    input_tokens = count_tokens(prompt, model)
    output_tokens = count_tokens(response, model)
    pricing = PRICING_PER_1K_TOKENS.get(model, DEFAULT_PRICING)
    input_cost = input_tokens / 1000 * pricing["input"]
    output_cost = output_tokens / 1000 * pricing["output"]
    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "input_cost": input_cost,
        "output_cost": output_cost,
        "total_cost": input_cost + output_cost,
    }


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/info")
def info():
    """Thông tin cấu hình hiện tại — hiển thị model đang dùng trên giao diện."""
    return jsonify(
        {
            "model": MODEL,
            "base_url": BASE_URL,
            "pricing": PRICING_PER_1K_TOKENS.get(MODEL, DEFAULT_PRICING),
            "max_history_messages": MAX_HISTORY_MESSAGES,
            "default_persona": DEFAULT_PERSONA,
            "has_api_key": bool(os.getenv("OPENAI_API_KEY")),
        }
    )


@app.post("/api/chat")
def chat():
    from openai import OpenAI

    data = request.get_json(force=True) or {}
    persona = (data.get("persona") or DEFAULT_PERSONA).strip()
    history = data.get("history") or []
    user_message = (data.get("message") or "").strip()

    if not user_message:
        return jsonify({"error": "Thiếu nội dung câu hỏi (message)."}), 400
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({"error": "Chưa cấu hình OPENAI_API_KEY trong file .env."}), 500

    # Bước: system prompt + lịch sử hội thoại + câu hỏi mới
    messages = (
        [{"role": "system", "content": persona}]
        + history
        + [{"role": "user", "content": user_message}]
    )

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    start = time.perf_counter()
    try:
        response = client.chat.completions.create(
            model=MODEL, messages=messages, max_tokens=512
        )
    except Exception as exc:  # lỗi mạng / API — trả về cho frontend hiển thị
        return jsonify({"error": str(exc)}), 502
    latency = time.perf_counter() - start

    reply = response.choices[0].message.content

    # Bước: cập nhật history, cắt còn tối đa 3 lượt gần nhất
    new_history = history + [
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": reply},
    ]
    new_history = new_history[-MAX_HISTORY_MESSAGES:]

    # Bước: đếm token, ước tính chi phí
    usage = estimate_cost(user_message, reply, MODEL)

    return jsonify(
        {
            "reply": reply,
            "history": new_history,
            "messages_sent": messages,
            "model": MODEL,
            "latency": latency,
            "usage": usage,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)
