"""One-off: move #hashtags typed into a track's Info / Hover info into its tags.

Older tracks (and some new ones) have hashtags in the text fields, where they show
as plain text instead of as tags. For every track this adds any hashtag not already
in `tags`, and strips the hashtags from the text field.

Dry run (default) only prints what would change:
    cd backend && python scripts/migrate_hashtags.py
    python scripts/migrate_hashtags.py --from-json locations.json   # offline, from GET /locations/
Apply:
    python scripts/migrate_hashtags.py --apply
"""
import argparse, asyncio, json, os, re, sys

HASHTAG = re.compile(r"#([\w-]+)", re.UNICODE)
FIELDS = ("info", "hover_info")


def plan_track(t):
    """Return {field: new_value} for this track, or {} if nothing to do."""
    tags = list(t.get("tags") or [])
    seen = {x.lower() for x in tags}
    changes = {}
    for f in FIELDS:
        text = t.get(f) or ""
        found = HASHTAG.findall(text)
        if not found:
            continue
        for tag in found:
            if tag.lower() not in seen:
                seen.add(tag.lower())
                tags.append(tag[:50])
        changes[f] = re.sub(r"\s{2,}", " ", HASHTAG.sub("", text)).strip()
    if changes and tags != list(t.get("tags") or []):
        changes["tags"] = tags
    return changes


def plan(locations):
    out = []
    for loc in locations:
        for t in loc.get("tracks") or []:
            ch = plan_track(t)
            if ch:
                out.append((loc, t, ch))
    return out


def show(items):
    if not items:
        print("Nothing to change.")
    for loc, t, ch in items:
        print(f"- {loc['name']} / {t.get('title')} ({t['track_id']})")
        if "tags" in ch:
            added = [x for x in ch["tags"] if x not in (t.get("tags") or [])]
            print(f"    tags  += {added}")
        for f in FIELDS:
            if f in ch:
                print(f"    {f}: {t.get(f)!r}\n      ->  {ch[f]!r}")
    print(f"\n{len(items)} track(s) affected.")


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write the changes")
    ap.add_argument("--from-json", help="dry run from a GET /locations/ dump instead of Mongo")
    args = ap.parse_args()

    if args.from_json:
        show(plan(json.load(open(args.from_json))))
        return

    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from dotenv import load_dotenv
    load_dotenv()
    from db import db

    locations = [l async for l in db.locations.find({})]
    items = plan(locations)
    show(items)
    if not args.apply:
        print("Dry run only. Re-run with --apply to write.")
        return
    for loc, t, ch in items:
        await db.locations.update_one(
            {"_id": loc["_id"], "tracks.track_id": t["track_id"]},
            {"$set": {f"tracks.$.{k}": v for k, v in ch.items()}},
        )
    print("Applied.")


if __name__ == "__main__":
    asyncio.run(main())
