"""Strip NAME/CATEGORY/SUBJECT/BODY OF EMAIL preambles from extracted bodies."""
from __future__ import annotations

import json
import re
from pathlib import Path

CONTENT = Path(
    r"c:\Users\egordon\Desktop\Cursor Projects\workflow builder\lib\emails\content"
)
MANIFEST = Path(
    r"c:\Users\egordon\Desktop\Cursor Projects\workflow builder\scripts\extracted-emails.json"
)

PREAMBLE_RE = re.compile(
    r"^(?:NAME\s*:.*\n)?(?:CATEGORY\s*:.*\n)?(?:SUBJECT\s*:.*\n)?(?:BODY OF EMAIL\s*\n+)",
    re.IGNORECASE,
)


def clean(body: str) -> tuple[str, str | None]:
    subject = None
    m = re.search(r"^SUBJECT\s*:\s*(.+)$", body, re.I | re.M)
    if m:
        subject = m.group(1).strip()
    cleaned = PREAMBLE_RE.sub("", body).strip()
    # Also drop a lone leading "BODY OF EMAIL" line
    cleaned = re.sub(r"^BODY OF EMAIL\s*\n+", "", cleaned, flags=re.I).strip()
    return cleaned, subject


def main() -> None:
    changed = 0
    for path in sorted(CONTENT.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        body = data.get("body") or ""
        new_body, subject = clean(body)
        if new_body != body:
            data["body"] = new_body
            if subject and not data.get("subjectHint"):
                data["subjectHint"] = subject
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            changed += 1

    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        for key, email in manifest.get("emails", {}).items():
            new_body, subject = clean(email.get("body") or "")
            email["body"] = new_body
            email["charCount"] = len(new_body)
            if subject and not email.get("subjectHint"):
                email["subjectHint"] = subject
        MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"cleaned {changed} files")


if __name__ == "__main__":
    main()
