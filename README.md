# Fourie × Mapstone

Wedding website for the Surname Showdown, 5–7 May 2028 at Khotso Lodge, Underberg.

| Page | Who it's for |
|---|---|
| `index.html` | Guests: the weekend, games, travel, stay, RSVP and FAQ |
| `leaderboard.html` | Everyone: team totals, event results and the player leaderboard |
| `captains.html` | Captains and the couple, behind a PIN: squads, results, bonus points, players and the blackout |

The site is plain HTML hosted on GitHub Pages. All data (RSVPs, players, squads, results) lives in a Google Sheet, reached through a small Google Apps Script web app in `apps-script/Code.gs`.

Until `assets/config.js` has the web-app URL, the site runs in **demo mode**: RSVPs aren't sent anywhere, and the leaderboard and captains' pages use example data kept in your own browser (demo PIN `2028`).

## Connect the Google Sheet (about 10 minutes, once)

1. Create a new Google Sheet, for example "Fourie × Mapstone wedding".
2. In the Sheet, open **Extensions → Apps Script**. Delete what's there and paste in the contents of `apps-script/Code.gs`. Save.
3. In the function dropdown at the top choose **setup** and press **Run**. Approve the permissions prompt (it's your own script). This creates the tabs and the 11 events.
4. Open **Project Settings** (gear icon) → **Script properties** and set:
   - `COUPLE_PIN`: your PIN. It unlocks everything, including adding players and the blackout.
   - `CAPTAIN_PIN`: the PIN you give captains and referees. It unlocks squads, results and bonus points.
5. **Deploy → New deployment →** type **Web app**. Execute as **Me**, who has access **Anyone**. Deploy and copy the web-app URL.
6. Paste that URL into `assets/config.js` between the quotes and commit. (Or send it to Claude in the project thread.)

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## How scoring works

- Each event has a points value (Events tab). Recording a result gives each team its points; a Joker doubles that team's points for that event.
- Team total = sum of all event points. Total available is 145.
- A player's score = their team's points in every event they played in, plus individual bonus points. Bonus points never count toward the team total.
- **Blackout:** when the couple switches it on (planned for Saturday 12:30), new results are saved but hidden from the public leaderboard, along with all bonus points. **Reveal all results** on the captains' page lifts it after the ceremony.

## Security note

The PINs are a light lock suited to a wedding, not a bank. Use PINs that aren't easy to guess and change them in Script properties if one leaks.
