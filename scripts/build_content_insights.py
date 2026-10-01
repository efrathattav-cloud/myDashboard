"""Build data/content-insights.json, the file the "What works in content"
screen reads.

    python scripts/build_content_insights.py

Inputs:
  data-raw/posts.json, data-raw/meta.json   from collect_instagram.py (not in git)
  data/content-labels.json                  topic and opening of each post, by post code
  data/content-notes.json                   one-line summaries, the women's phrases, insights

The labels and notes are written by Claude reading the raw posts and comments,
not by a model call, so a fresh collection needs them updated before this
script will run: it stops and lists the posts that have no label.

Only figures, labels and Claude's own wording reach the output. No commenter's
name, and no post's full text.
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'data-raw'
DATA = ROOT / 'data'

FORMATS = {'clips': 'רילס', 'carousel_container': 'קרוסלה', 'feed': 'תמונה'}
TOP_POSTS = 10


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


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


def average_by(posts, key):
    groups = defaultdict(list)
    for post in posts:
        if post['engagement'] is not None:
            groups[post[key]].append(post['engagement'])
    # The median travels with the average because one viral post can carry a
    # whole topic's average on its own.
    rows = [
        {
            'label': label,
            'average': round(sum(values) / len(values)),
            'median': round(median(values)),
            'posts': len(values),
        }
        for label, values in groups.items()
    ]
    return sorted(rows, key=lambda row: row['average'], reverse=True)


def main():
    raw_posts = load(RAW / 'posts.json')
    meta = load(RAW / 'meta.json')
    labels = load(DATA / 'content-labels.json')
    notes = load(DATA / 'content-notes.json')

    unlabelled = [post['shortCode'] for post in raw_posts if post['shortCode'] not in labels]
    if unlabelled:
        sys.exit(f'{len(unlabelled)} posts have no label in data/content-labels.json: {unlabelled[:10]}')

    posts = [
        {
            'code': post['shortCode'],
            'url': post['url'],
            # The profile the post was collected from. A collaboration post can
            # be owned by someone else but still sits on this profile.
            'account': post['inputUrl'].rstrip('/').split('/')[-1],
            'format': post_format(post),
            'engagement': engagement(post),
            **labels[post['shortCode']],
        }
        for post in raw_posts
    ]
    measured = [post for post in posts if post['engagement'] is not None]

    by_topic = average_by([p for p in posts if p['topic'] != 'אחר / אישי'], 'topic')
    by_format = average_by(posts, 'format')

    top = sorted(measured, key=lambda post: post['engagement'], reverse=True)[:TOP_POSTS]
    missing = [post['code'] for post in top if post['code'] not in notes['summaries']]
    if missing:
        sys.exit(f'Top posts with no summary in data/content-notes.json: {missing}')

    topic_counts = Counter(p['topic'] for p in posts if p['topic'] != 'אחר / אישי')
    output = {
        'collectedAt': meta['collectedAt'],
        'totals': {
            'posts': len(posts),
            'accounts': len(meta['accounts']),
            'withHiddenLikes': len(posts) - len(measured),
            'comments': notes['commentsRead'],
        },
        'mostCommonTopic': topic_counts.most_common(1)[0][0],
        'leadingTopic': by_topic[0]['label'],
        'leadingFormat': by_format[0]['label'],
        'byTopic': by_topic,
        'byFormat': by_format,
        'topPosts': [
            {
                'account': post['account'],
                'topic': post['topic'],
                'format': post['format'],
                'engagement': post['engagement'],
                'summary': notes['summaries'][post['code']],
                'url': post['url'],
            }
            for post in top
        ],
        'phrases': notes['phrases'],
        'insights': notes['insights'],
    }

    target = DATA / 'content-insights.json'
    target.write_text(json.dumps(output, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'Wrote {target.relative_to(ROOT)}: {len(posts)} posts, {len(measured)} with likes.')


if __name__ == '__main__':
    main()
