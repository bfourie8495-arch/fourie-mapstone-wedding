/**
 * Fourie × Mapstone wedding backend: RSVPs, players, squads, results and the leaderboard,
 * stored in the Google Sheet this script is attached to.
 *
 * Setup (see README.md for the click-by-click version):
 *  1. Create a Google Sheet, then Extensions > Apps Script, and paste this file in.
 *  2. Run setup() once. It creates the tabs and seeds the events and the guest list.
 *  3. Project Settings > Script properties: set COUPLE_PIN and CAPTAIN_PIN.
 *  4. Deploy > New deployment > Web app, execute as Me, access Anyone. Copy the URL into assets/config.js.
 */

const TABS = {
  Players: ["id", "name", "team", "role", "number"],
  Events: ["id", "name", "day", "points"],
  Squads: ["eventId", "playerId"],
  Results: ["eventId", "fouriePts", "mapstonePts", "joker", "note", "public", "updatedAt"],
  Bonuses: ["id", "playerId", "points", "reason", "createdAt"],
  Settings: ["key", "value"],
  RSVPs: ["submitted", "name", "email", "phone", "side", "attending", "days", "stay", "size", "diet", "kids", "run", "shuttle", "song", "note"],
};

const SEED_EVENTS = [
  ["election", "General Election", "Fri", 15], ["quiz", "Pub Quiz", "Fri", 15],
  ["fri-games", "Friday Drinking Games", "Fri", 10], ["run", "5 km Run", "Sat", 10],
  ["rugby", "Touch Rugby", "Sat", 15], ["tug", "Tug of War", "Sat", 10],
  ["ctf", "Capture the Flag", "Sat", 20], ["side", "Side Games", "Sat", 10],
  ["sat-games", "Saturday Evening Games", "Sat", 10], ["egg", "Golden Egg", "Sun", 20],
  ["spirit", "Spirit Award", "Sun", 10],
];

// Guest list from Jess's sheet, loaded into Players by setup() when that tab is empty.
// Team is blank for friends until the draft; the couple sets it on the Captains page.
const SEED_PLAYERS = [
  ["Jean 1 (Mapstone family)", "Mapstone"],
  ["Tracey", "Mapstone"],
  ["John 1 (Mapstone family)", "Mapstone"],
  ["Judy", "Mapstone"],
  ["Jean 2 (Mapstone family)", "Mapstone"],
  ["Paul", "Mapstone"],
  ["Ant (Mapstone family)", "Mapstone"],
  ["Robs", "Mapstone"],
  ["Rich", "Mapstone"],
  ["Bridget (Mapstone family)", "Mapstone"],
  ["Anne", "Mapstone"],
  ["Catherine 1 (Mapstone family)", "Mapstone"],
  ["Partner", "Mapstone"],
  ["Wendy", "Mapstone"],
  ["Peggy", "Mapstone"],
  ["Hugh", "Mapstone"],
  ["Rob (Mapstone family)", "Mapstone"],
  ["Mary-Jane", "Mapstone"],
  ["Nicola", "Mapstone"],
  ["Riaan", "Mapstone"],
  ["Les", "Mapstone"],
  ["Stuart", "Mapstone"],
  ["Nicky", "Mapstone"],
  ["Robyn", "Mapstone"],
  ["Sean", "Mapstone"],
  ["Claire", "Mapstone"],
  ["Clavin", "Mapstone"],
  ["Teresa", "Mapstone"],
  ["John 2 (Mapstone family)", "Mapstone"],
  ["Megan", "Mapstone"],
  ["Simon", "Mapstone"],
  ["Chris", "Mapstone"],
  ["Barbara", "Mapstone"],
  ["Jason", "Mapstone"],
  ["Diane (Mapstone family)", "Mapstone"],
  ["Michael", "Mapstone"],
  ["Steph", "Mapstone"],
  ["Catherine 2 (Mapstone family)", "Mapstone"],
  ["Tony", "Mapstone"],
  ["Laura", "Mapstone"],
  ["David (Mapstone family)", "Mapstone"],
  ["Alexis", "Mapstone"],
  ["James (Mapstone family)", "Mapstone"],
  ["Derek", "Fourie"],
  ["Chantal", "Fourie"],
  ["Diane (Fourie family)", "Fourie"],
  ["Bart", "Fourie"],
  ["Gran", "Fourie"],
  ["Adrian", "Fourie"],
  ["Nancy", "Fourie"],
  ["Taylor", "Fourie"],
  ["Bridget 1 (Fourie family)", "Fourie"],
  ["Sandra", "Fourie"],
  ["Husband", "Fourie"],
  ["Krissy", "Fourie"],
  ["Sonja", "Fourie"],
  ["Neil", "Fourie"],
  ["Nev", "Fourie"],
  ["Liam (Fourie family)", "Fourie"],
  ["Bridget 2 (Fourie family)", "Fourie"],
  ["Cindy", ""],
  ["Eric", ""],
  ["Ross", ""],
  ["Anya", ""],
  ["Tom (Mapstone family friends)", ""],
  ["Julie-anne", ""],
  ["Pete (Mapstone family friends)", ""],
  ["Mariaan", ""],
  ["David (Mapstone family friends)", ""],
  ["Bex", ""],
  ["Jack", ""],
  ["Clive", ""],
  ["Valina", ""],
  ["Kerryn", ""],
  ["Miles", ""],
  ["Brad 1 (Mapstone family friends)", ""],
  ["Candace", ""],
  ["Alfie", ""],
  ["Mel (Mapstone family friends)", ""],
  ["Evan", ""],
  ["Bruce 1 (Mapstone family friends)", ""],
  ["Winsome", ""],
  ["Robert", ""],
  ["James (Mapstone family friends)", ""],
  ["George", ""],
  ["Jenny", ""],
  ["Brad 2 (Mapstone family friends)", ""],
  ["Girlfriend", ""],
  ["Cambell", ""],
  ["Karen", ""],
  ["Bruce 2 (Mapstone family friends)", ""],
  ["Janet", ""],
  ["Alan", ""],
  ["Kate (Mapstone family friends)", ""],
  ["Ant (Mapstone family friends)", ""],
  ["Bruce 3 (Mapstone family friends)", ""],
  ["Christine", ""],
  ["Tim", ""],
  ["Jacque", ""],
  ["Zoff", ""],
  ["Gerry", ""],
  ["Nigel", ""],
  ["Mike (Mapstone family friends)", ""],
  ["Gordon", ""],
  ["Michelle (Fourie family friends)", ""],
  ["Sharith", ""],
  ["Pete (Fourie family friends)", ""],
  ["Alexi", ""],
  ["Kate (Brendon's friends)", ""],
  ["Mike (Brendon's friends)", ""],
  ["Jess", ""],
  ["Tason", ""],
  ["Resh", ""],
  ["Sims", ""],
  ["Grant", ""],
  ["Katy", ""],
  ["Connor", ""],
  ["Jono", ""],
  ["Michaela", ""],
  ["Brendon", ""],
  ["Jonelle", ""],
  ["Jayne", ""],
  ["Drogs", ""],
  ["Julie", ""],
  ["Racheal", ""],
  ["Liz", ""],
  ["Jeff", ""],
  ["Miranda", ""],
  ["Ella", ""],
  ["Matt", ""],
  ["Carmen (Jess's friends)", ""],
  ["Ash", ""],
  ["Danica", ""],
  ["Shiv", ""],
  ["Emile", ""],
  ["Lauren", ""],
  ["Kyle", ""],
  ["K-lee", ""],
  ["Steve", ""],
  ["Jaimie", ""],
  ["James (Jess's friends)", ""],
  ["Lisa", ""],
  ["Luke", ""],
  ["Bronnie", ""],
  ["Ollie", ""],
  ["Liam (Joint friends)", ""],
  ["Vicky", ""],
  ["Michelle (Joint friends)", ""],
  ["John (Joint friends)", ""],
  ["Kate (Joint friends)", ""],
  ["Partner (John)", ""],
  ["Rob (Joint friends)", ""],
  ["Mel (Joint friends)", ""],
  ["Dale", ""],
  ["Lizzy", ""],
  ["Jes", ""],
  ["Armin", ""],
  ["Carmen (Joint friends)", ""],
  ["Tom (Joint friends)", ""],
  ["Shane", ""],
  ["Kelly", ""]
];

// Which actions each role may run. "public" needs no PIN.
const ACCESS = {
  state: "public", rsvp: "public", login: "public",
  saveSquad: "captain", saveResult: "captain", addBonus: "captain", deleteBonus: "captain",
  addPlayers: "couple", updatePlayer: "couple", deletePlayer: "couple",
  setBlackout: "couple", revealAll: "couple",
};

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(name => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(TABS[name]);
  });
  const ev = ss.getSheetByName("Events");
  if (ev.getLastRow() === 1) SEED_EVENTS.forEach(r => ev.appendRow(r));
  const pl = ss.getSheetByName("Players");
  if (pl.getLastRow() === 1) SEED_PLAYERS.forEach((r, i) => pl.appendRow(["g" + (i + 1), r[0], r[1], "player", ""]));
  const st = ss.getSheetByName("Settings");
  if (st.getLastRow() === 1) st.appendRow(["blackout", "false"]);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("COUPLE_PIN")) props.setProperty("COUPLE_PIN", "change-me-couple");
  if (!props.getProperty("CAPTAIN_PIN")) props.setProperty("CAPTAIN_PIN", "change-me-captain");
}

function doGet() {
  return json({ ok: true, data: readState(false) });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: "Bad request" }); }
  const action = body.action;
  const need = ACCESS[action];
  if (!need) return json({ ok: false, error: "Unknown action" });
  const role = roleFor(body.pin);
  if (need === "captain" && !role) return json({ ok: false, error: "Wrong PIN" });
  if (need === "couple" && role !== "couple") return json({ ok: false, error: "Only the couple can do that" });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return json({ ok: true, data: run(action, body, role) });
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function run(action, p, role) {
  const now = new Date().toISOString();
  switch (action) {
    case "state": return readState(!!role);
    case "login": return { role: role };
    case "rsvp": {
      const row = TABS.RSVPs.map(h => clean(h === "submitted" ? now : p[h]));
      sheet("RSVPs").appendRow(row);
      return true;
    }
    case "addPlayers": {
      const rows = read("Players");
      (p.players || []).forEach(pl => rows.push({ id: "p" + Utilities.getUuid().slice(0, 8), name: clean(pl.name), team: team(pl.team), role: clean(pl.role || "player"), number: clean(pl.number) }));
      write("Players", rows);
      return true;
    }
    case "updatePlayer": {
      const rows = read("Players");
      const r = rows.find(x => x.id === p.player.id);
      if (!r) throw new Error("Player not found");
      ["name", "role", "number"].forEach(k => { if (k in p.player) r[k] = clean(p.player[k]); });
      if ("team" in p.player) r.team = team(p.player.team);
      write("Players", rows);
      return true;
    }
    case "deletePlayer": {
      write("Players", read("Players").filter(x => x.id !== p.id));
      write("Squads", read("Squads").filter(x => x.playerId !== p.id));
      write("Bonuses", read("Bonuses").filter(x => x.playerId !== p.id));
      return true;
    }
    case "saveSquad": {
      const rows = read("Squads").filter(x => x.eventId !== p.eventId);
      (p.playerIds || []).forEach(id => rows.push({ eventId: clean(p.eventId), playerId: clean(id) }));
      write("Squads", rows);
      return true;
    }
    case "saveResult": {
      const blackout = setting("blackout") === "true";
      const rows = read("Results").filter(x => x.eventId !== p.eventId);
      if (!p.clear) rows.push({ eventId: clean(p.eventId), fouriePts: num(p.fouriePts), mapstonePts: num(p.mapstonePts), joker: p.joker === "Fourie" || p.joker === "Mapstone" ? p.joker : "", note: clean(p.note), public: blackout ? "false" : "true", updatedAt: now });
      write("Results", rows);
      return true;
    }
    case "addBonus": {
      const rows = read("Bonuses");
      rows.push({ id: "b" + Utilities.getUuid().slice(0, 8), playerId: clean(p.playerId), points: num(p.points), reason: clean(p.reason), createdAt: now });
      write("Bonuses", rows);
      return true;
    }
    case "deleteBonus": write("Bonuses", read("Bonuses").filter(x => x.id !== p.id)); return true;
    case "setBlackout": setSetting("blackout", p.on ? "true" : "false"); return true;
    case "revealAll": {
      write("Results", read("Results").map(r => Object.assign(r, { public: "true" })));
      setSetting("blackout", "false");
      return true;
    }
  }
}

function readState(isStaff) {
  const blackout = setting("blackout") === "true";
  let results = read("Results").map(r => ({ eventId: r.eventId, fouriePts: num(r.fouriePts), mapstonePts: num(r.mapstonePts), joker: r.joker, note: r.note, public: String(r.public) !== "false" }));
  let bonuses = read("Bonuses").map(b => ({ id: b.id, playerId: b.playerId, points: num(b.points), reason: b.reason }));
  if (blackout && !isStaff) {
    results = results.filter(r => r.public);
    bonuses = []; // individual points would give the game away during the blackout
  }
  return {
    players: read("Players"),
    events: read("Events").map(e => ({ id: e.id, name: e.name, day: e.day, points: num(e.points) })),
    squads: read("Squads"),
    results: results,
    bonuses: bonuses,
    settings: { blackout: blackout },
  };
}

// ---------- helpers ----------
function roleFor(pin) {
  if (!pin) return null;
  const props = PropertiesService.getScriptProperties();
  if (pin === props.getProperty("COUPLE_PIN")) return "couple";
  if (pin === props.getProperty("CAPTAIN_PIN")) return "captain";
  return null;
}
function sheet(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }
function read(name) {
  const values = sheet(name).getDataRange().getValues();
  const head = values.shift();
  return values.filter(r => r.join("") !== "").map(r => Object.fromEntries(head.map((h, i) => [h, typeof r[i] === "string" ? r[i] : String(r[i])])));
}
function write(name, rows) {
  const sh = sheet(name);
  const head = TABS[name];
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, head.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows.map(r => head.map(h => r[h] === undefined ? "" : r[h])));
}
function setting(key) { const r = read("Settings").find(x => x.key === key); return r ? String(r.value) : ""; }
function setSetting(key, value) {
  const rows = read("Settings").filter(x => x.key !== key);
  rows.push({ key: key, value: value });
  write("Settings", rows);
}
// Leading = + - @ would make the Sheet treat guest text as a formula, so prefix it.
function clean(v) { const s = String(v == null ? "" : v).slice(0, 500); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function team(v) { return v === "Fourie" || v === "Mapstone" ? v : ""; }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
