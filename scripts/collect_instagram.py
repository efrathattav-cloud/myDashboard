"""Collect recent Instagram posts, and the comments on the most discussed ones,
through Apify's official Instagram scraper (apify/instagram-scraper).

    python scripts/collect_instagram.py          the coaches: posts and comments
    python scripts/collect_instagram.py --own    my own account: posts only

Reads APIFY_TOKEN from .env. The token stays in this script: it is never
written to the site, the browser or the repository.

Writes the raw results to data-raw/ (ignored by git, because comments carry
people's usernames). The screen does not read these files; it reads
data/content-insights.json, which is the analysed summary.

Cost: the scraper charges per result. Every run is capped with
maxTotalChargeUsd, and the script refuses to start if the month's free
credit cannot cover it. On the free plan Apify blocks usage rather than
charging once the credit is gone.

Standard library only, like dev-server.py.
"""

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / 'data-raw'

ACTOR = 'apify~instagram-scraper'
API = 'https://api.apify.com/v2'

# Coaches who speak to women struggling with people-pleasing, guilt and
# choosing themselves. A nail technician and a business coach were taken off
# after the first run: they were measuring a different audience.
ACCOUNTS = [
    'tzofnatrosenthal',
    'oriya_nir_coach',
    'tipul.shelly',
    'coralfigaro',
    'hilla_healing',
    'shany_barda',
    'hadaserez_imalevia',
    'veronika_psychodrama',
]
# Compared with the coaches on the content screen, never mixed into their figures.
OWN_ACCOUNT = 'efrat_yaara_hattav_coaching'

POSTS_PER_ACCOUNT = 20
POSTS_WITH_COMMENTS = 10
COMMENTS_PER_POST = 15  # The free plan returns about 15 per post anyway.

PRICE_PER_RESULT_USD = 0.0027  # Free tier price, from the Actor's pricing.
MAX_CHARGE_PER_RUN_USD = 1.0
MAX_CHARGE_OWN_RUN_USD = 0.2  # 20 posts cost about $0.05.


def read_token():
    env = ROOT / '.env'
    if not env.exists():
        sys.exit('Missing .env. Copy .env.example to .env and put the token after APIFY_TOKEN=')
    for line in env.read_text(encoding='utf-8-sig').splitlines():
        key, _, value = line.partition('=')
        if key.strip() == 'APIFY_TOKEN' and value.strip():
            return value.strip().strip('"\'')
    sys.exit('APIFY_TOKEN is empty in .env')


def call(token, method, path, body=None):
    request = urllib.request.Request(
        f'{API}{path}',
        method=method,
        data=json.dumps(body).encode('utf-8') if body is not None else None,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as error:
        detail = error.read().decode('utf-8', 'replace')[:300]
        sys.exit(f'Apify answered {error.code} for {method} {path}: {detail}')


def credit_left(token):
    data = call(token, 'GET', '/users/me/limits')['data']
    return data['limits']['maxMonthlyUsageUsd'] - data['current']['monthlyUsageUsd']


def run_actor(token, actor_input, expected_results, label, max_charge=MAX_CHARGE_PER_RUN_USD):
    estimate = expected_results * PRICE_PER_RESULT_USD
    left = credit_left(token)
    print(f'{label}: about {expected_results} results, about ${estimate:.2f}. Credit left this month: ${left:.2f}.')
    if left < max_charge:
        sys.exit('Not enough free credit left for a capped run. Nothing was started.')

    run = call(token, 'POST', f'/acts/{ACTOR}/runs?maxTotalChargeUsd={max_charge}', actor_input)['data']
    # Polling instead of the synchronous endpoint, which gives up after 300 seconds.
    while run['status'] in ('READY', 'RUNNING'):
        time.sleep(10)
        run = call(token, 'GET', f"/actor-runs/{run['id']}")['data']
        print(f"  {run['status']}...")
    if run['status'] != 'SUCCEEDED':
        sys.exit(f"{label} ended with status {run['status']}.")

    return call(token, 'GET', f"/datasets/{run['defaultDatasetId']}/items?clean=true&format=json")


def collect_own(token):
    """My own posts, without comments: only the figures are needed to compare."""
    posts = run_actor(
        token,
        {
            'resultsType': 'posts',
            'directUrls': [f'https://www.instagram.com/{OWN_ACCOUNT}/'],
            'resultsLimit': POSTS_PER_ACCOUNT,
        },
        POSTS_PER_ACCOUNT,
        'My posts',
        max_charge=MAX_CHARGE_OWN_RUN_USD,
    )
    posts = [post for post in posts if post.get('url') and not post.get('error')]
    if not posts:
        sys.exit('No posts came back. Is the account public?')

    collected_at = datetime.now(timezone.utc).isoformat(timespec='seconds')
    (RAW_DIR / 'own-posts.json').write_text(json.dumps(posts, ensure_ascii=False, indent=1), encoding='utf-8')
    (RAW_DIR / 'own-meta.json').write_text(json.dumps({'collectedAt': collected_at, 'account': OWN_ACCOUNT}), encoding='utf-8')
    print(f'Got {len(posts)} of my posts. Saved to {RAW_DIR}. Next: ask Claude to label them.')


def main():
    token = read_token()
    RAW_DIR.mkdir(exist_ok=True)

    if '--own' in sys.argv[1:]:
        collect_own(token)
        return

    posts = run_actor(
        token,
        {
            'resultsType': 'posts',
            'directUrls': [f'https://www.instagram.com/{name}/' for name in ACCOUNTS],
            'resultsLimit': POSTS_PER_ACCOUNT,
        },
        len(ACCOUNTS) * POSTS_PER_ACCOUNT,
        'Posts',
    )
    posts = [post for post in posts if post.get('url') and not post.get('error')]
    print(f'Got {len(posts)} posts.')

    most_discussed = sorted(posts, key=lambda post: post.get('commentsCount') or 0, reverse=True)
    most_discussed = [post['url'] for post in most_discussed[:POSTS_WITH_COMMENTS] if post.get('commentsCount')]

    comments = []
    if most_discussed:
        comments = run_actor(
            token,
            {
                'resultsType': 'comments',
                'directUrls': most_discussed,
                'resultsLimit': COMMENTS_PER_POST,
            },
            len(most_discussed) * COMMENTS_PER_POST,
            'Comments',
        )
        comments = [comment for comment in comments if comment.get('text')]
    print(f'Got {len(comments)} comments.')

    collected_at = datetime.now(timezone.utc).isoformat(timespec='seconds')
    (RAW_DIR / 'posts.json').write_text(json.dumps(posts, ensure_ascii=False, indent=1), encoding='utf-8')
    (RAW_DIR / 'comments.json').write_text(json.dumps(comments, ensure_ascii=False, indent=1), encoding='utf-8')
    (RAW_DIR / 'meta.json').write_text(json.dumps({'collectedAt': collected_at, 'accounts': ACCOUNTS}), encoding='utf-8')
    print(f'Saved to {RAW_DIR}. Next: ask Claude to analyse it into data/content-insights.json.')


if __name__ == '__main__':
    main()
