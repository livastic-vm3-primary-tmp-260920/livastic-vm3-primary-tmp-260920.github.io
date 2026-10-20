#!/usr/bin/env python3
"""Generate honest Google Forms *display-only* prefilled product labels.

No POST, no credentials, no real customer data or willingness-to-pay values.
The buyer must supply a real problem and explicit reply address on Google's page.
"""
from __future__ import annotations
from html import escape
from urllib.parse import urlencode

BASE = "https://docs.google.com/forms/d/e/1FAIpQLSe_N8anCGUDmWdNZLnGwFRfhYaaCsB18BKdYd_VsFZp1xWm3g/viewform"
DESCRIPTION_FIELD = "entry.1765055758"
# This form has separate contact-email (967471981) and optional budget (326068836)
# fields. NEVER fill those on behalf of a buyer.
CONTACT_FIELD = "entry.967471981"
BUDGET_FIELD = "entry.326068836"

DESCRIPTIONS = {
    "crypto": (
        "Crypto CSV Rescue / 49-USDC sample pilot — TEMPLATE PRODUCT CATEGORY ONLY. "
        "PLEASE REPLACE THIS TEMPLATE with YOUR actual import problem, software/source names "
        "(no account IDs), desired row-level exception result and acceptance criteria. "
        "Do NOT submit this unchanged: it is not a purchase, buyer review or evidence of demand. "
        "Do NOT paste private transactions, wallet addresses or sensitive CSV rows."
    ),
    "merchant": (
        "USDC Invoice Match / 49-USDC pilot — TEMPLATE PRODUCT CATEGORY ONLY. "
        "PLEASE REPLACE THIS TEMPLATE with YOUR real invoice/payment matching problem, "
        "chain and asset type (public names only), how an exception report would help "
        "and YOUR own acceptance criteria. Do NOT submit this unchanged: "
        "it is not a purchase, buyer review or evidence of demand. "
        "Do NOT paste private customer invoices, wallet addresses or chain transaction IDs."
    ),
}


def prefilled_url(kind: str) -> str:
    assert kind in DESCRIPTIONS
    # Keep email, budget/timing EMPTY so nothing looks consented or paid.
    return BASE + "?" + urlencode({"usp": "pp_url", DESCRIPTION_FIELD: DESCRIPTIONS[kind]})


def html_href(kind: str) -> str:
    return escape(prefilled_url(kind), quote=True)


if __name__ == "__main__":
    for key in sorted(DESCRIPTIONS):
        print(key, prefilled_url(key))
