"""Build data/content-insights.json, the file the "What works in content"
screen reads.

    python scripts/build_content_insights.py

Inputs:
  data-raw/posts.json, data-raw/comments.json, data-raw/meta.json
                              from collect_instagram.py (not in git)
  data-raw/own-posts.json, data-raw/own-meta.json
                              my own account, from collect_instagram.py --own
  data/content-labels.json    topic and opening of each post, by post code
  data/content-notes.json     summaries, the women's phrases, insights, post ideas,
                              and the opening lines picked for each kind of opening

The labels and notes are written by Claude reading the raw posts and comments,
not by a model call, so a fresh collection needs them updated before this
script will run: it stops and lists the posts that have no label.

Only figures, labels and Claude's own wording reach the output. No commenter's
name, and no post's full text.

## How a post is measured

Not by its raw likes and comments. Those mostly measure how many followers an
account has, so a big account's ordinary post would beat a small account's
best one. Each post is measured against its own account instead: its likes
plus comments divided by that account's median post. 1 is an ordinary post
for that account, 2 is twice its usual response. Groups are then compared by
the median of that ratio, so one viral post cannot carry a whole topic.
"""

import json
import sys
from collections import defaultdict
from pathlib import Path
from statistics import median

from collect_instagram import ACCOUNTS, OWN_ACCOUNT

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'data-raw'
DATA = ROOT / 'data'

FORMATS = {'clips': 'רילס', 'carousel_container': 'קרוסלה', 'feed': 'תמונה'}
OFF_TOPIC = 'אחר / אישי'
TOP_POSTS = 10
# Below this many posts a group is shown, but flagged as too thin to act on.
ENOUGH_POSTS = 5
# My own account has only 20 posts, so its groups are judged on fewer.
ENOUGH_OWN_POSTS = 3
OWN_TOP_POSTS = 3


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def post_code(url):
    return url.rstrip('/').split('/')[-1]


def post_format(post):
    if post.get('productType') in FORMATS:
        return FORMATS[post['productType']]
    return {'Sidecar': 'קרוסלה', 'Video': 'רילס'}.get(post.get('type'), 'תמונה')


def engagement(post):
    """Likes plus comments, or None when the account hides its like counts (-1)."""
    likes = post.get('likesCount')
    if likes is None or likes < 0:
        return None
    return likes + (post.get('commentsCount') or 0)


def measure(raw_posts, labels):
    """The posts with their labels, and their lift against their own account."""
    posts = [
        {
            'code': post['shortCode'],
            'url': post['url'],
            # The profile the post was collected from. A collaboration post can
            # be owned by someone else but still sits on this profile.
            'account': post_code(post['inputUrl']),
            'format': post_format(post),
            'engagement': engagement(post),
            **labels[post['shortCode']],
        }
        for post in raw_posts
    ]
    usual = {}
    for account in {p['account'] for p in posts}:
        values = [p['engagement'] for p in posts if p['account'] == account and p['engagement'] is not None]
        usual[account] = median(values) if values else None
    for post in posts:
        base = usual[post['account']]
        post['lift'] = post['engagement'] / base if post['engagement'] is not None and base else None
    return posts, usual


def compare_by(posts, key, enough_posts=ENOUGH_POSTS):
    groups = defaultdict(list)
    for post in posts:
        if post['lift'] is not None:
            groups[post[key]].append(post['lift'])
    rows = [
        {
            'label': label,
            'lift': round(median(values), 2),
            'posts': len(values),
            'enough': len(values) >= enough_posts,
        }
        for label, values in groups.items()
    ]
    # Thin groups go last whatever their figure, so the top of each chart is
    # always something solid enough to act on.
    return sorted(rows, key=lambda row: (row['enough'], row['lift']), reverse=True)


def side_by_side(mine, theirs):
    """One row per group, my figure next to theirs. A group only one side has
    is kept, because "they write about it and I never have" is the point."""
    their_rows = {row['label']: row for row in theirs}
    my_rows = {row['label']: row for row in mine}
    order = [row['label'] for row in theirs] + [label for label in my_rows if label not in their_rows]
    return [{'label': label, 'mine': my_rows.get(label), 'theirs': their_rows.get(label)} for label in order]


def build_own(labels, notes, by_topic, by_opening, by_format):
    """My account against the coaches, or None when it was never collected."""
    if not (RAW / 'own-posts.json').exists():
        return None

    raw = load(RAW / 'own-posts.json')
    meta = load(RAW / 'own-meta.json')
    unlabelled = [post['shortCode'] for post in raw if post['shortCode'] not in labels]
    if unlabelled:
        sys.exit(f'{len(unlabelled)} of my posts have no label in data/content-labels.json: {unlabelled[:10]}')

    posts, usual = measure(raw, labels)
    on_topic = [p for p in posts if p['topic'] != OFF_TOPIC]
    measured = [p for p in on_topic if p['lift'] is not None]

    my_topics = compare_by(on_topic, 'topic', ENOUGH_OWN_POSTS)
    written = {row['label'] for row in my_topics}
    # Topics that work for them, on enough posts, that I have never written about.
    gaps = [
        {'label': row['label'], 'lift': row['lift'], 'posts': row['posts']}
        for row in by_topic
        if row['enough'] and row['lift'] >= 1 and row['label'] not in written
    ]

    top = sorted(measured, key=lambda post: post['lift'], reverse=True)[:OWN_TOP_POSTS]
    missing = [post['code'] for post in top if post['code'] not in notes['summaries']]
    if missing:
        sys.exit(f'My top posts with no summary in data/content-notes.json: {missing}')

    return {
        'account': OWN_ACCOUNT,
        'collectedAt': meta['collectedAt'],
        'posts': len(posts),
        'usualEngagement': usual[OWN_ACCOUNT],
        'byTopic': side_by_side(my_topics, by_topic),
        'byOpening': side_by_side(compare_by(posts, 'opening', ENOUGH_OWN_POSTS), by_opening),
        'byFormat': side_by_side(compare_by(posts, 'format', ENOUGH_OWN_POSTS), by_format),
        'gaps': gaps,
        'topPosts': [
            {
                'topic': post['topic'],
                'format': post['format'],
                'lift': round(post['lift'], 1),
                'engagement': post['engagement'],
                'summary': notes['summaries'][post['code']],
                'url': post['url'],
            }
            for post in top
        ],
        'takeaways': notes['ownTakeaways'],
    }


def main():
    meta = load(RAW / 'meta.json')
    labels = load(DATA / 'content-labels.json')
    notes = load(DATA / 'content-notes.json')

    accounts = set(ACCOUNTS)
    raw_posts = [p for p in load(RAW / 'posts.json') if post_code(p['inputUrl']) in accounts]
    kept_codes = {p['shortCode'] for p in raw_posts}
    comments = [c for c in load(RAW / 'comments.json') if post_code(c['postUrl']) in kept_codes]

    unlabelled = [post['shortCode'] for post in raw_posts if post['shortCode'] not in labels]
    if unlabelled:
        sys.exit(f'{len(unlabelled)} posts have no label in data/content-labels.json: {unlabelled[:10]}')

    posts, _ = measure(raw_posts, labels)

    measured = [p for p in posts if p['lift'] is not None]
    on_topic = [p for p in posts if p['topic'] != OFF_TOPIC]

    by_topic = compare_by(on_topic, 'topic')
    by_format = compare_by(posts, 'format')
    by_opening = compare_by(posts, 'opening')

    top = sorted(
        (p for p in measured if p['topic'] != OFF_TOPIC),
        key=lambda post: post['lift'],
        reverse=True,
    )[:TOP_POSTS]
    missing = [post['code'] for post in top if post['code'] not in notes['summaries']]
    if missing:
        sys.exit(f'Top posts with no summary in data/content-notes.json: {missing}')

    by_code = {post['code']: post for post in posts}
    opening_lift = {row['label']: row for row in by_opening}
    hook_patterns = []
    for group in notes['hookPatterns']:
        hooks = []
        for hook in group['hooks']:
            post = by_code.get(hook['code'])
            if post is None or post['lift'] is None:
                sys.exit(f"Hook {hook['code']} is not a measurable post from the current accounts.")
            hooks.append({
                'text': hook['text'],
                'lift': round(post['lift'], 1),
                'account': post['account'],
                'topic': post['topic'],
                'url': post['url'],
            })
        hook_patterns.append({
            'opening': group['opening'],
            'pattern': group['pattern'],
            'lift': opening_lift[group['opening']]['lift'],
            'posts': opening_lift[group['opening']]['posts'],
            'hooks': sorted(hooks, key=lambda hook: hook['lift'], reverse=True),
        })
    hook_patterns.sort(key=lambda group: group['lift'], reverse=True)

    own = build_own(labels, notes, by_topic, by_opening, by_format)

    output = {
        'collectedAt': meta['collectedAt'],
        'totals': {
            'posts': len(posts),
            'accounts': len(accounts),
            'withHiddenLikes': len(posts) - len(measured),
            'comments': len(comments),
        },
        'leadingTopic': by_topic[0],
        'leadingFormat': by_format[0],
        'leadingOpening': by_opening[0],
        'byTopic': by_topic,
        'byFormat': by_format,
        'byOpening': by_opening,
        'topPosts': [
            {
                'account': post['account'],
                'topic': post['topic'],
                'format': post['format'],
                'lift': round(post['lift'], 1),
                'engagement': post['engagement'],
                'summary': notes['summaries'][post['code']],
                'url': post['url'],
            }
            for post in top
        ],
        'own': own,
        'ideas': notes['ideas'],
        'hookPatterns': hook_patterns,
        'phrases': notes['phrases'],
        'insights': notes['insights'],
    }

    target = DATA / 'content-insights.json'
    target.write_text(json.dumps(output, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(
        f'Wrote {target.relative_to(ROOT)}: {len(posts)} posts from {len(accounts)} accounts, '
        f'{len(measured)} measurable, {len(comments)} comments.'
    )


if __name__ == '__main__':
    main()
