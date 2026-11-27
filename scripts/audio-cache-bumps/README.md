# SW audio cache bumps

One `.txt` file per audio change (a re-render batch, new clips that replace old ones). `sw-audio-cache.js` derives the
service worker's audio cache name from the set of `.txt` names, so adding a file busts every device's audio cache on the
next deploy, and two audio branches never conflict over one version line. Name the file after the branch or batch
(`voice-ship-3.txt`); one line inside saying what changed. Never delete or rename a file here.
