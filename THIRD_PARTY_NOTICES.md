# Third-party notices

The code licence in [LICENSE](LICENSE) does not cover the files below. Each is used under its own licence.

## Word pictures

Per-file sources and licences are in `scripts/IMAGE_SOURCES.json` (title, file page, author and licence for each word
picture) and are shown on https://childrendoenglish.com/image-credits/. Pictures are resized and cropped to
512x512 WebP.

- **Wikimedia Commons photos:** each is used under the licence named on its Commons file page (for example CC BY-SA
  or CC BY in their versions and ports, GFDL 1.2, CC0, public domain, or the "Copyrighted free use" and
  "Attribution" Commons tags). The author, file page and licence of each photo are listed in
  `scripts/IMAGE_SOURCES.json` and on the credits page.
- **Pixabay photos:** Pixabay Content License, https://pixabay.com/service/license-summary/ . The photographer and
  photo page of each are listed on the credits page.
- **Twemoji:** Copyright Twitter, Inc and other contributors, CC BY 4.0, https://github.com/twitter/twemoji
- **Fluent Emoji 3D:** Copyright Microsoft Corporation, MIT License, https://github.com/microsoft/fluentui-emoji .
  Also used for the pictures in the Opposites, Feelings and Simon Says games (`public/games/*/img/`) and the
  printable worksheets made from them.
- **Own illustrations:** made for Children Do English.
- **Older photos with no recorded source:** some photos were added before sources were recorded. They are marked
  `"source": "unknown"` in `scripts/IMAGE_SOURCES.json`, are not listed on the credits page (which gives their
  number), and are being replaced with photos whose source and licence are recorded.

## Interface icons

Lucide (lucide-react 0.577.0), ISC License. Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as
part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2026.

## Audio

Spoken words and sentences are computer-generated with Piper text-to-speech (https://github.com/OHF-Voice/piper1-gpl).
They are not recordings of a person. Piper is run separately to make the audio files; it is not part of this
repository or of the site.

## Software in the site bundle

- React and React DOM 19.3.0, MIT License, Copyright (c) Meta Platforms, Inc. and affiliates.
- lucide-react 0.577.0, ISC License (see above).
- @sentry/browser 10.43.0, MIT License, Copyright (c) 2019 Functional Software, Inc. dba Sentry.
- Workbox 7.4.1 (service worker, via vite-plugin-pwa), MIT License, Copyright 2018 Google LLC.
- Tailwind CSS 4.3.3 (generated styles), MIT License, Copyright (c) Tailwind Labs, Inc.

Server: @neondatabase/serverless 1.1.0, MIT License, Copyright (c) 2022 - 2025 Neon Inc.

Build tools (not shipped to visitors) keep their own licences, in each package under `node_modules/`.
