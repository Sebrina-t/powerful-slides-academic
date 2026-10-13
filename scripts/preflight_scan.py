#!/usr/bin/env python3
"""Read-only triage for hidden instructions and active content in research inputs."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tif", ".tiff"}
TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".tsv", ".tex", ".json", ".yaml", ".yml", ".xml", ".html", ".htm", ".rtf"}
PROMPT_PATTERNS = {
    "ignore_prior_instructions": re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions?", re.I),
    "system_prompt_reference": re.compile(r"system\s+prompt|developer\s+message", re.I),
    "concealment_request": re.compile(r"do\s+not\s+(tell|inform)\s+(the\s+)?user", re.I),
    "command_execution_request": re.compile(r"(run|execute)\s+(this\s+)?(command|script|code)", re.I),
    "chinese_ignore_prior": re.compile(r"忽略.{0,12}(之前|先前|以上).{0,8}(指令|要求|提示)"),
    "chinese_concealment": re.compile(r"不要.{0,8}(告诉|告知).{0,8}用户"),
    "chinese_command_execution": re.compile(r"执行.{0,8}(命令|脚本|代码)"),
}
PDF_MARKERS = {
    b"/JavaScript": "pdf_javascript",
    b"/JS": "pdf_js_action",
    b"/OpenAction": "pdf_open_action",
    b"/AA": "pdf_additional_action",
    b"/Launch": "pdf_launch_action",
    b"/EmbeddedFile": "pdf_embedded_file",
}


def is_raster_image(data: bytes, suffix: str) -> bool:
    """Require a recognized raster signature before applying the image exemption."""
    signatures = {
        ".png": data.startswith(b"\x89PNG\r\n\x1a\n"),
        ".jpg": data.startswith(b"\xff\xd8\xff"),
        ".jpeg": data.startswith(b"\xff\xd8\xff"),
        ".gif": data.startswith((b"GIF87a", b"GIF89a")),
        ".bmp": data.startswith(b"BM"),
        ".webp": data.startswith(b"RIFF") and data[8:12] == b"WEBP",
        ".tif": data.startswith((b"II*\x00", b"MM\x00*")),
        ".tiff": data.startswith((b"II*\x00", b"MM\x00*")),
    }
    return bool(signatures.get(suffix, False))


def finding(severity: str, kind: str, detail: str) -> dict[str, str]:
    return {"severity": severity, "kind": kind, "detail": detail}


def scan_prompt_text(text: str, origin: str) -> list[dict[str, str]]:
    results = []
    for name, pattern in PROMPT_PATTERNS.items():
        match = pattern.search(text)
        if match:
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 80)
            snippet = " ".join(text[start:end].split())
            results.append(finding("medium", name, f"{origin}: {snippet[:240]}"))
    return results


def decode_text(data: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "utf-16-le", "gb18030", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return ""


def scan_zip(path: Path) -> list[dict[str, str]]:
    results = []
    try:
        with zipfile.ZipFile(path) as archive:
            names = archive.namelist()
            lower_names = [name.lower() for name in names]
            for name, lower in zip(names, lower_names):
                if lower.endswith("vbaproject.bin") or "/macros/" in lower:
                    results.append(finding("high", "macro_payload", name))
                if any(token in lower for token in ("embeddings/", "oleobject", "activex/")):
                    results.append(finding("high", "embedded_active_object", name))
                if "externallinks/" in lower:
                    results.append(finding("medium", "external_link_part", name))
                if lower.endswith((".rels", ".xml", ".txt")):
                    try:
                        data = archive.read(name)
                    except (KeyError, RuntimeError):
                        continue
                    text = decode_text(data[:2_000_000])
                    if 'TargetMode="External"' in text or "TargetMode='External'" in text:
                        results.append(finding("medium", "external_relationship", name))
                    results.extend(scan_prompt_text(text, name))
    except (zipfile.BadZipFile, OSError) as exc:
        results.append(finding("medium", "package_parse_error", str(exc)))
    return results


def scan_file(path: Path) -> dict[str, object]:
    result: dict[str, object] = {
        "path": str(path.resolve()),
        "exists": path.is_file(),
        "size_bytes": None,
        "sha256": None,
        "scan_status": "not_scanned",
        "findings": [],
    }
    if not path.is_file():
        result["findings"] = [finding("high", "missing_or_not_file", str(path))]
        return result

    data = path.read_bytes()
    result["size_bytes"] = len(data)
    result["sha256"] = hashlib.sha256(data).hexdigest()
    suffix = path.suffix.lower()

    if suffix in IMAGE_EXTENSIONS and is_raster_image(data, suffix):
        result["scan_status"] = "skipped_image_by_policy"
        return result
    if suffix in IMAGE_EXTENSIONS:
        findings = [finding("high", "image_signature_mismatch", "Extension does not match a recognized raster signature")]
    else:
        findings = []

    if data.startswith(b"PK\x03\x04"):
        findings.extend(scan_zip(path))
    if suffix == ".pdf" or data.startswith(b"%PDF-"):
        for marker, name in PDF_MARKERS.items():
            if marker in data:
                findings.append(finding("high", name, marker.decode("ascii")))
        findings.extend(scan_prompt_text(decode_text(data[:4_000_000]), "pdf_raw_text"))
    elif suffix in TEXT_EXTENSIONS or b"\x00" not in data[:4096]:
        findings.extend(scan_prompt_text(decode_text(data[:4_000_000]), "file_text"))

    result["scan_status"] = "triaged"
    result["findings"] = findings
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path, help="Files to inspect without executing")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON")
    args = parser.parse_args()
    report = {
        "notice": "Triage only. Findings require review; absence of findings is not proof of safety.",
        "files": [scan_file(path) for path in args.paths],
    }
    json.dump(report, sys.stdout, ensure_ascii=False, indent=2 if args.pretty else None)
    sys.stdout.write("\n")
    return 0 if all(item["exists"] for item in report["files"]) else 2


if __name__ == "__main__":
    raise SystemExit(main())
