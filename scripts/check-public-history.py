#!/usr/bin/env python3
"""Reject pushes whose reachable history reintroduces excluded private paths.

Run with commit/branch arguments, or without arguments as a pre-push hook.
This is a path guard, not a complete secret or license scanner.
"""
import re
import subprocess
import sys

EXCLUDED = re.compile(
    r"(^|/)\.env(?!\.example$)(\..*)?$|(^|/)uploads(/|$)|"
    r"(^|/)(venv|\.venv|node_modules)(/|$)|(^|/)\.DS_Store$|\.pt$"
)


def main():
    revisions = sys.argv[1:]
    if not revisions:
        revisions = []
        for line in sys.stdin:
            _, local_sha, _, _ = line.split()
            if set(local_sha) != {"0"}:
                revisions.append(local_sha)
    if not revisions:
        return 0
    revisions = list(dict.fromkeys(revisions))
    resolved = []
    for rev in revisions:
        resolved.append(subprocess.check_output(
            ["git", "rev-parse", "--verify", "--end-of-options", rev + "^{commit}"],
            text=True,
        ).strip())
    changed_paths = subprocess.check_output(
        ["git", "log", "--format=", "--name-only", *resolved, "--"], text=True
    ).splitlines()
    blocked = sorted({p for p in changed_paths if EXCLUDED.search(p)})
    if blocked:
        print("Push blocked: this history contains excluded private files.", file=sys.stderr)
        for path in blocked[:10]:
            print(" - " + path, file=sys.stderr)
        print("Use the cleaned history. Keep old work in a private backup and reapply only reviewed source changes.", file=sys.stderr)
        return 1
    print("Private-path history check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
