from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
js = (root / "app.js").read_text(encoding="utf-8")

checks = {
    "HTML document is in Brazilian Portuguese": '<html lang="pt-BR">' in html,
    "Dashboard references stylesheet": 'href="./styles.css"' in html,
    "Dashboard references JavaScript": 'src="./app.js"' in html,
    "Main dashboard landmarks exist": all(token in html for token in ('id="page-content"', 'aria-label="Indicadores principais"', 'id="period-select"')),
    "Demo data disclaimer is visible": "Ambiente de demonstração" in html and "fictícios" in html,
    "Navigation routes have matching module definitions": all(("data-route=\"" + route + "\"") in html and (route + ":{") in js for route in ("dashboard", "programas", "calculadoras", "passagens", "historico")),
    "Every JavaScript DOM ID is present in HTML or created dynamically": all(
        identifier in html or identifier in js
        for identifier in re.findall(r"getElementById\\('([^']+)'\\)", js)
    ),
    "Responsive breakpoints exist": all(token in css for token in ("max-width:760px", "max-width:390px")),
    "Reduced-motion preference is respected": "prefers-reduced-motion:reduce" in css,
    "Focus-visible styles are defined": ":focus-visible" in css,
    "No external data API is called": not re.search(r"fetch\\(|XMLHttpRequest|WebSocket\\(", js),
}

failed = [name for name, passed in checks.items() if not passed]
for name, passed in checks.items():
    print(("PASS" if passed else "FAIL") + " - " + name)

if failed:
    print(f"\\n{len(failed)} smoke check(s) failed.", file=sys.stderr)
    sys.exit(1)
print(f"\\nAll {len(checks)} smoke checks passed.")
