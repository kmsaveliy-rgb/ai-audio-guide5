<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Groq (text) and ElevenLabs (speech) are called only from server functions in src/lib/*.functions.ts using server env keys; keys never reach the browser.
- Saved tours and stop audio are cached in browser IndexedDB (src/lib/storage.ts), keyed by hash of voice ID + narration, so audio is never regenerated.
- Maps use a shared browser-only Google Maps loader and LocationMap with user-triggered GPS and session-only manual pins; tour text is never treated as verified coordinates.
- The home-page video introduction is a separate presentation component; its primary action scrolls to the existing tour form so generation logic stays independent of presentation.
