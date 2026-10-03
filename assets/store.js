// Data layer shared by the leaderboard and captains' pages.
// Live mode talks to the Google Apps Script web app in config.js; demo mode keeps
// example data in this browser so the pages can be tried before the Sheet exists.
(function () {
  const TEAMS = ["Fourie", "Mapstone"];

  const DEFAULT_EVENTS = [
    { id: "election", name: "General Election", day: "Fri", points: 15 },
    { id: "quiz", name: "Pub Quiz", day: "Fri", points: 15 },
    { id: "fri-games", name: "Friday Drinking Games", day: "Fri", points: 10 },
    { id: "run", name: "5 km Run", day: "Sat", points: 10 },
    { id: "rugby", name: "Touch Rugby", day: "Sat", points: 15 },
    { id: "tug", name: "Tug of War", day: "Sat", points: 10 },
    { id: "ctf", name: "Capture the Flag", day: "Sat", points: 20 },
    { id: "side", name: "Side Games", day: "Sat", points: 10 },
    { id: "sat-games", name: "Saturday Evening Games", day: "Sat", points: 10 },
    { id: "egg", name: "Golden Egg", day: "Sun", points: 20 },
    { id: "spirit", name: "Spirit Award", day: "Sun", points: 10 },
  ];

  const api = () => (window.WEDDING_API || "").trim();
  const isDemo = () => !api();

  // ---------- live mode ----------
  async function liveCall(action, payload) {
    const res = await fetch(api(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ action }, payload || {})),
    });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || "Something went wrong");
    return out.data;
  }

  // ---------- demo mode ----------
  const DEMO_KEY = "fm-demo-v1";
  const DEMO_PIN = "2028";
  function demoSeed() {
    const names = [
      ["Example Player 1", "Fourie", "captain"], ["Example Player 2", "Fourie", "player"],
      ["Example Player 3", "Fourie", "player"], ["Example Player 4", "Fourie", "player"],
      ["Example Player 5", "Mapstone", "captain"], ["Example Player 6", "Mapstone", "player"],
      ["Example Player 7", "Mapstone", "player"], ["Example Player 8", "Mapstone", "player"],
      ["Example Referee", "", "official"],
    ];
    const players = names.map((n, i) => ({ id: "p" + (i + 1), name: n[0], team: n[1], role: n[2], number: String(i + 1) }));
    return {
      players,
      events: DEFAULT_EVENTS.map(e => Object.assign({}, e)),
      squads: [
        { eventId: "quiz", playerId: "p1" }, { eventId: "quiz", playerId: "p2" },
        { eventId: "quiz", playerId: "p5" }, { eventId: "quiz", playerId: "p6" },
        { eventId: "election", playerId: "p1" }, { eventId: "election", playerId: "p5" },
      ],
      results: [
        { eventId: "election", fouriePts: 0, mapstonePts: 15, joker: "", note: "Example result", public: true },
        { eventId: "quiz", fouriePts: 15, mapstonePts: 0, joker: "", note: "Example result", public: true },
      ],
      bonuses: [{ id: "b1", playerId: "p6", points: 3, reason: "Example: stole 3 golden eggs" }],
      settings: { blackout: false },
    };
  }
  function demoLoad() {
    try { const s = localStorage.getItem(DEMO_KEY); if (s) return JSON.parse(s); } catch (_) {}
    return demoSeed();
  }
  function demoSave(db) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); } catch (_) {} }

  function demoCall(action, p) {
    const db = demoLoad();
    const uid = pre => pre + Math.random().toString(36).slice(2, 8);
    switch (action) {
      case "state": {
        if (!db.settings.blackout || p.pin === DEMO_PIN) return db;
        return Object.assign({}, db, { results: db.results.filter(r => r.public), bonuses: [] });
      }
      case "login": return { role: p.pin === DEMO_PIN ? "couple" : null };
      case "addPlayers":
        p.players.forEach(pl => db.players.push(Object.assign({ id: uid("p") }, pl)));
        break;
      case "updatePlayer": {
        const pl = db.players.find(x => x.id === p.player.id);
        if (pl) Object.assign(pl, p.player);
        break;
      }
      case "deletePlayer":
        db.players = db.players.filter(x => x.id !== p.id);
        db.squads = db.squads.filter(s => s.playerId !== p.id);
        db.bonuses = db.bonuses.filter(b => b.playerId !== p.id);
        break;
      case "saveSquad":
        db.squads = db.squads.filter(s => s.eventId !== p.eventId)
          .concat(p.playerIds.map(id => ({ eventId: p.eventId, playerId: id })));
        break;
      case "saveResult": {
        db.results = db.results.filter(r => r.eventId !== p.eventId);
        if (!p.clear) db.results.push({ eventId: p.eventId, fouriePts: +p.fouriePts || 0, mapstonePts: +p.mapstonePts || 0, joker: p.joker || "", note: p.note || "", public: !db.settings.blackout });
        break;
      }
      case "addBonus": db.bonuses.push({ id: uid("b"), playerId: p.playerId, points: +p.points || 0, reason: p.reason || "" }); break;
      case "deleteBonus": db.bonuses = db.bonuses.filter(b => b.id !== p.id); break;
      case "setBlackout": db.settings.blackout = !!p.on; break;
      case "revealAll": db.results.forEach(r => (r.public = true)); db.settings.blackout = false; break;
      case "resetDemo": demoSave(demoSeed()); return true;
      default: throw new Error("Unknown action " + action);
    }
    demoSave(db);
    return true;
  }

  async function call(action, payload) {
    if (isDemo()) return demoCall(action, payload || {});
    return liveCall(action, payload);
  }

  // ---------- scoring ----------
  // A team's event score is the points recorded for it, doubled if it played its Joker there.
  // A player's score is their team's event score for every event they were in the squad for,
  // plus any individual bonus points. Bonuses count for players only, never the team total.
  function compute(db) {
    const byEvent = {};
    db.results.forEach(r => {
      const f = (+r.fouriePts || 0) * (r.joker === "Fourie" ? 2 : 1);
      const m = (+r.mapstonePts || 0) * (r.joker === "Mapstone" ? 2 : 1);
      byEvent[r.eventId] = { Fourie: f, Mapstone: m, raw: r };
    });
    const totals = { Fourie: 0, Mapstone: 0 };
    Object.values(byEvent).forEach(e => { totals.Fourie += e.Fourie; totals.Mapstone += e.Mapstone; });
    const maxPoints = db.events.reduce((s, e) => s + (+e.points || 0), 0);

    const players = {};
    db.players.forEach(p => (players[p.id] = { player: p, points: 0, events: 0, bonus: 0 }));
    db.squads.forEach(s => {
      const row = players[s.playerId];
      if (!row) return;
      row.events += 1;
      const ev = byEvent[s.eventId];
      if (ev && TEAMS.includes(row.player.team)) row.points += ev[row.player.team];
    });
    db.bonuses.forEach(b => {
      const row = players[b.playerId];
      if (row) { row.bonus += +b.points || 0; row.points += +b.points || 0; }
    });
    const playerRows = Object.values(players)
      .filter(r => TEAMS.includes(r.player.team))
      .sort((a, b) => b.points - a.points || a.player.name.localeCompare(b.player.name));
    return { byEvent, totals, maxPoints, playerRows };
  }

  window.Wedding = { TEAMS, DEFAULT_EVENTS, call, compute, isDemo };
})();
