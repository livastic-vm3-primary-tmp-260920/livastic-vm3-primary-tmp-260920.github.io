#!/usr/bin/env python3
"""Deterministic no-network sitemap for one already-owned github.io root.

Only original first-party HTTPS projects owned by this GitHub user are listed;
no other company's or merchant's domain can be inserted into the sitemap.
"""
import argparse
import pathlib
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

HOST = "livastic-vm3-primary-tmp-260920.github.io"
PREFIX = f"https://{HOST}/"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", NS)
BASE = pathlib.Path(__file__).resolve().parents[1]


def parse_paths(source: str) -> list[str]:
    links = [x.strip() for x in source.splitlines() if x.strip() and not x.strip().startswith("#")]
    if not 2 <= len(links) <= 50:
        raise ValueError("Expected 2–50 curated public URLs")
    if len(set(links)) != len(links):
        raise ValueError("No duplicate links allowed")
    for link in links:
        parts = urlsplit(link)
        if (
            parts.scheme != "https"
            or parts.hostname != HOST
            or parts.netloc != HOST
            or parts.username
            or parts.password
            or parts.query
            or parts.fragment
            or not link.startswith(PREFIX)
            or "/../" in parts.path
            or "//" in parts.path
        ):
            raise ValueError("Only absolute canonical first-party HTTPS pages are allowed")
    if PREFIX not in links:
        raise ValueError("Owner site root must be listed")
    required = [
        f"{PREFIX}defi-payment-proof-qa/",
        f"{PREFIX}defi-payment-proof-qa/guides/crypto-transfer-csv-pair-auditor.html",
        f"{PREFIX}defi-payment-proof-qa/guides/x402-quote-safety.html",
        f"{PREFIX}defi-payment-proof-qa/guides/csv-browser-x402-checkout.html",
        f"{PREFIX}x402-smokecheck/",
    ]
    if not all(item in links for item in required):
        raise ValueError("Every critical buyer and free tool path must be present")
    return links


def to_xml(urls: list[str]) -> bytes:
    root = ET.Element(f"{{{NS}}}urlset")
    for url in urls:
        elem = ET.SubElement(root, f"{{{NS}}}url")
        ET.SubElement(elem, f"{{{NS}}}loc").text = url
    return ET.tostring(root, encoding="utf-8", xml_declaration=True) + b"\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    source = (BASE / "urls.txt").read_text("utf-8")
    payload = to_xml(parse_paths(source))
    dest = BASE / "sitemap.xml"
    if args.check:
        assert dest.read_bytes() == payload
        print("Original root sitemap matches its first-party curated URL list")
    else:
        dest.write_bytes(payload)
        print("Wrote", dest, len(payload), "bytes")


if __name__ == "__main__":
    main()
