"""One-off POST /api/support to verify LLM + HeyGen video pipeline."""
import json
import sys
import urllib.error
import urllib.request

BOUNDARY = "----SupportE2EBoundary"
BODY = (
    f"--{BOUNDARY}\r\n"
    'Content-Disposition: form-data; name="text_input"\r\n\r\n'
    "How do I track my order? I placed it last week.\r\n"
    f"--{BOUNDARY}\r\n"
    'Content-Disposition: form-data; name="language"\r\n\r\n'
    "en\r\n"
    f"--{BOUNDARY}\r\n"
    'Content-Disposition: form-data; name="avatar_id"\r\n\r\n'
    "489723ce0be64cd1a41a1f390ef5c1ea\r\n"
    f"--{BOUNDARY}--\r\n"
).encode("utf-8")


def main() -> None:
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/support",
        data=BODY,
        headers={
            "Content-Type": f"multipart/form-data; boundary={BOUNDARY}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=1200) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, file=sys.stderr)
        print(e.read().decode("utf-8", errors="replace"), file=sys.stderr)
        raise SystemExit(1) from e

    data = json.loads(raw)
    print("status:", data.get("status"))
    print("language:", data.get("language"))
    print("intent:", data.get("intent"))
    print("avatar_id:", data.get("avatar_id"))
    text = data.get("response_text") or ""
    print("response_text (first 240 chars):", text[:240])
    vu = data.get("video_url") or ""
    print("video_url present:", bool(vu))
    print("video_url (first 100 chars):", vu[:100] + ("..." if len(vu) > 100 else ""))


if __name__ == "__main__":
    main()
