# Городской Гид AI

Build a mobile-first Russian-language AI audio tour generator.



The application is a personal prototype, not a public service.



TECH STACK:

- React and TypeScript.

- Supabase Edge Functions for secure API calls.

- Gemini API for generating tour content.

- ElevenLabs API for Russian text-to-speech.

- Responsive mobile-first interface.



LANGUAGE:

All interface elements, generated tours, errors, and controls must

be in Russian.



MAIN SCREEN:

1. Destination input.

2. Tour duration selector: 5, 15, 30, or 60 minutes.

3. Tour style selector:

   - Историческая экскурсия

   - Архитектура

   - Легенды и загадки

   - Необычные факты

   - Прогулка по городу

4. Button: "Создать экскурсию".



TOUR GENERATION:

Use Gemini API to generate a structured tour in Russian.

The result must include:

- Tour title.

- Short introduction.

- A list of stops.

- A narration script for each stop.

- Estimated duration.

- Interesting facts.

- A clear distinction between verified facts and legends.



Return structured JSON and validate it before displaying it.



AUDIO:

Use ElevenLabs API to convert each stop's narration into Russian speech.

Provide play, pause, resume, and replay controls.

Allow the user to navigate between stops.

Display a loading indicator during generation.



STORAGE:

Save generated tours and their audio files when storage is configured.

Reuse previously generated audio instead of generating it again.



SECURITY:

Never expose API keys in frontend code.

Store Gemini and ElevenLabs keys as server-side secrets.

Make all API requests through Supabase Edge Functions.

Never commit secrets to source control.



ERROR HANDLING:

Display clear Russian error messages for missing API keys,

rate limits, failed requests, and unavailable services.



IMPORTANT:

Build a working MVP, not just a visual mockup.

First implement tour generation with Gemini.

Then implement ElevenLabs audio generation.

Provide a way to test each integration independently.

Do not require payments, subscriptions, user accounts, or public sharing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bfd035b0-974c-4ab0-ac8c-8c6a96760b4c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
