#!/usr/bin/env python3
"""Publish ONLY original one-owner's already-public Soul.Markets A2A card.

An A2A *discovery* document on the owned static site points clients at
the real Soul.Markets payable JSONRPC endpoint.  Never emulate or proxy
a payment, touch wallets, publish secrets or invent completed jobs.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

BASE=Path(__file__).resolve().parents[1]
SOURCE=BASE/"machine-discovery"/"official-soul-a2a-source.json"
OUTPUT=BASE/".well-known"/"agent.json"
SLUG="vm3-usdc-receipt-qa"
CANONICAL=f"https://api.soul.mds.markets/v1/soul/{SLUG}/agent.json"
EXPECTED={
    "solidity-snippet-triage",
    "usdc-evidence-triage",
    "x402-browser-cors-remedy",
    "x402-payment-challenge-preflight",
    "x402-quote-mismatch-preflight",
}
TOP_KEYS={"name","description","version","url","provider","capabilities",
          "defaultInputModes","defaultOutputModes","skills"}
SKILL_KEYS={"id","name","description","tags"}
FORBIDDEN_MARKERS=("-----BEGIN", "Bearer ", "sk_live_", "soul_live_", "private_key",
                   "secret=", "seed phrase:", "payment-signature: 0x",
                   "Bearer%20", "api_key=", "token=")

def validate(card:dict) -> dict:
    if type(card) is not dict or set(card)!=TOP_KEYS:
        raise ValueError("Unexpected A2A card fields; fail closed")
    if card["url"]!=CANONICAL or card["version"]!="1.0.0":
        raise ValueError("Unexpected canonical external A2A URL/version")
    if any(not isinstance(card.get(k),str) or len(card[k])<10
           for k in ("name","description")):
        raise ValueError("Invalid public owner description")
    if card["name"]!="VM3 Public USDC Receipt Evidence QA":
        raise ValueError("Wrong original economic owner")
    if card["provider"]!={"organization":"OneShot","url":"https://api.soul.mds.markets"}:
        raise ValueError("Cannot impersonate provider")
    if card["capabilities"]!={"streaming":False,"pushNotifications":False,
                              "stateTransitionHistory":False}:
        raise ValueError("Cannot invent callback, stream or push functionality")
    if (card["defaultInputModes"]!=["application/json"] or
        card["defaultOutputModes"]!=["application/json"]):
        raise ValueError("Unexpected media types")
    if type(card.get("skills")) is not list or len(card["skills"])!=5:
        raise ValueError("Exactly five original live public skills expected")
    if {s.get("id") for s in card["skills"] if type(s) is dict}!=EXPECTED:
        raise ValueError("Unexpected original paid service skill set")
    for skill in card["skills"]:
        if set(skill)!=SKILL_KEYS or skill["tags"]!=["soul-service"]:
            raise ValueError("Unexpected A2A skill fields")
        if any(not isinstance(skill.get(k),str) or not skill[k]
               for k in ("name","description")):
            raise ValueError("Invalid public skill description")
    encoded=json.dumps(card,sort_keys=True,ensure_ascii=False)
    if len(encoded)>20000:
        raise ValueError("Public card exceeds bounded size")
    if any(marker.lower() in encoded.lower() for marker in FORBIDDEN_MARKERS):
        raise ValueError("Reject any accidental secret-looking public field")
    # For discovery, canonical URL is HTTPS and exactly known, never an opaque
    # self-authored payment receiver or fronting service.
    parts=urlsplit(card["url"])
    if parts.hostname!="api.soul.mds.markets" or parts.scheme!="https":
        raise ValueError("Unexpected third-party target")
    return card

def build() -> str:
    card=json.loads(SOURCE.read_text(encoding="utf-8"))
    validate(card)
    return json.dumps(card,indent=2,ensure_ascii=False)+"\n"

def main() -> None:
    p=argparse.ArgumentParser()
    p.add_argument("--check",action="store_true")
    args=p.parse_args()
    result=build()
    if args.check:
        if OUTPUT.read_text(encoding="utf8")!=result:
            raise ValueError("Published card differs from official first-party source snapshot")
        print("Original owner A2A public card reproducible, one economic owner, five real skills")
    else:
        OUTPUT.parent.mkdir(exist_ok=True)
        OUTPUT.write_text(result,encoding="utf8")
        print("Wrote .well-known/agent.json with five genuine independently hosted active skills")

if __name__=="__main__":
    main()
