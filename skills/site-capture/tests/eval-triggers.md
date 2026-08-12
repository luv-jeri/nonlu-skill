# Trigger evals - site-capture

## Should fire

1. "Here's a site I love for the inspiration board, capture it: https://example-studio.com" - reference site shared for inspiration.
2. "Can you scan the hero section of this page and tell me how the animation works?" - section/component study.
3. "Study how this award site does its scroll story so we can do our own version" - decode for an original recreation.

## Should NOT fire

1. "Take a screenshot of my dashboard so I can check the layout" - a one-off screenshot of the user's own running app; the `screenshot` skill or browser tools cover it.
2. "Run lighthouse on my site and tell me the performance score" - performance audit, not design capture (`web-perf` territory).
