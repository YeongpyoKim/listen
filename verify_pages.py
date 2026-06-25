import json
import urllib.request


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "python-urllib"})
    return json.load(urllib.request.urlopen(req))


try:
    pages = fetch("https://api.github.com/repos/YeongpyoKim/listen/pages")
    print("PAGES_OK")
    print("URL:", pages.get("html_url"))
    print("STATUS:", pages.get("status"))
except Exception as e:
    print("PAGES_ERROR", e)

print("---")

try:
    runs = fetch(
        "https://api.github.com/repos/YeongpyoKim/listen/actions/runs?branch=main&per_page=5"
    )
    print("RUNS_OK")
    print("TOTAL:", runs.get("total_count"))
    if runs.get("workflow_runs"):
        r = runs["workflow_runs"][0]
        print("LATEST:", r["head_sha"], r["status"], r.get("conclusion"))
        print("URL:", r["html_url"])
except Exception as e:
    print("RUNS_ERROR", e)
