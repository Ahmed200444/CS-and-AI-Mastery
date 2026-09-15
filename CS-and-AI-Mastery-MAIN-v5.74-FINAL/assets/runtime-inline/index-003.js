
// Disable the browser's native scroll restoration on reload/back-forward navigation.
// Without this, reloading (or navigating back) while scrolled deep into a long track
// page (e.g. far down the Python lessons) restores that SAME deep scroll position,
// landing the user mid-lesson with no visible heading nearby -- looking like a blank
// screen even though real content exists just above and below. showTrack() already
// explicitly scrolls to the top on every navigation; this stops the browser's own
// restoration from fighting that and winning on reload specifically.
if('scrollRestoration' in history){ history.scrollRestoration = 'manual'; }
