  /* =================== Prizes: coins, crates and the looks inside them =================== */
  /* Prizes only change how the site looks: no lesson or question is ever locked, and coins are never sold.
     store.s.pz keeps the record in a shape two devices can join without losing or doubling anything (pzMerge, from bkMerge):
       e  coins earned, one key per event: 'qotd.m.2026-11-15' 10, 'plan.2026-11-15' 20, 'rev.2026-11-15' 15, 'dupe.<crate>' 20
       x  coins spent, one key per purchase: 'crate.<crate>' 50, 'freeze.<id>' 30
       o  crates opened: <crate> -> [time, series, prize, tier, duplicate 0/1, sticker]
       g  free crates: <key> -> [time, series or '' for any, lowest tier, why]   ('welcome', 'ms7.<day>', 'ms30.<day>', 'ms100.<day>', 'page.<series>', 'test.<date>')
       fz days a streak freeze covered: '2026-11-14' 1
       st stickers found: <sticker> 1
       eq what this device has on: { fx, aura, paper, streak, title }   (the theme is the Appearance setting; the skin is the
          character's, kept with the room in store.s.room.av, so every device and the study buddy wear the same one)
     Keys use only letters, digits, '.', '-' and '_', the names a backup file may hold (BK_KEY in data.js).
     e, x and st join by the larger value; o, g and fz by union; eq keeps this device's. The balance is e minus x, never stored.
     Signed in to an account in the clubhouse (club.js), the server keeps e, x, o, g, fz and st instead, in the same shape:
     pz() returns its record, and coins, crates and freezes are asked of the server rather than changed here. */
  var PZ_TIERS = ['c', 'r', 'e', 'l', 'm', 'z'];
  var PZ_TIER = { c: 'Common', r: 'Rare', e: 'Epic', l: 'Legendary', m: 'Mythic', z: 'Radiant' };
  /* Radiant's 0.1% comes out of Common's share, so every other tier keeps the odds it had before Radiant was added */
  var PZ_ODDS = { c: 59.9, r: 27, e: 10, l: 2.5, m: 0.5, z: 0.1 };
  var PZ_PRICE = 50, PZ_FREEZE = 30, PZ_FREEZE_MAX = 2, PZ_DUPE = 20, PZ_PITY = 10, PZ_HOME = 3;
  var PZ_EARN = { qotd: 10, plan: 20, rev: 5, revMax: 4 };
  var PZ_KIND = { theme: 'Theme', fx: 'Right-answer effect', aura: 'Aura', paper: 'Paper', streak: 'Streak style', skin: 'Character skin' };
  var PZ_SLOTS = [['skin', 'Character skins'], ['theme', 'Themes'], ['fx', 'Right-answer effects'], ['aura', 'Auras'], ['paper', 'Paper'], ['streak', 'Streak styles']];
  var PZ_SERIES = [
    ['pencil', 'Pencil Case', 'Always in stock. Stationery basics.'],
    ['varsity', 'Varsity Locker', 'School spirit, classrooms and math on the board.'],
    ['night', 'Night Shift', 'Dark themes, stars and the black hole.'],
    ['arcade', 'Arcade', 'Neon, sunsets and electricity.'],
    ['seasons', 'Seasons', 'Changes with the school year: what is in season is twice as likely, and every prize comes back next year.'],
    ['deep', 'Deep Sea', 'Glowing life from the bottom of the ocean: bubbles, koi, jellyfish and the leviathan.'],
    ['myth', 'Myth & Magic', 'Runes, crystals, a dragon, the phoenix and an enchanted wood.'],
    ['tech', 'Tech Lab', 'Pixels, circuits, glitches, a warp drive and a machine that stops time.'],
    ['haunt', 'Haunted', 'Friendly frights: ghosts, bats, cobwebs and eyes that open in the dark.'],
    ['unknown', 'The Unknown', 'Things from far away: portals, visitors, slime, and something that watches.'],
    ['dream', 'Dreamscape', 'Color and wonder: butterflies, paper cranes, a fox spirit and a whale made of stars.'],
    ['zenith', 'Zenith', 'Whole scenes: wings, an eclipse, a galaxy, a rocket launch, a dragon, mountains before dawn.'],
    ['paradox', 'Paradox', 'Scenes of black and white, clocks and gears, a theater, a city at night and a machine that is not quite working.'],
    ['gems', 'Rocks & Gems', 'Rocks and gems: a stone that cracks open, opal fire, birthstones and a cavern of giant crystals.'],
    ['forecast', 'Forecast', 'Every kind of weather: drizzle and gusts, a sun shower, a twister and a towering storm cloud.'],
    ['wilds', 'Wildlands', 'Wild places: a campfire, a volcano, a murmuration of starlings, a summer meadow and balloons, a lily pond, dunes at night and a frozen lake.'],
    ['curio', 'Curiosities', 'Strange and wonderful things: a fortune teller’s crystal ball, a chest with teeth, a slot machine, an anglerfish, a sealed door, giants on the horizon and two dying stars.'],
    ['dress', 'Dress-Up', 'Skins for your character and your study buddy: cozy pajamas, a frog hood, a knight, a ninja, a wizard, a dragon and some that glow.'],
    ['bit', '8-Bit', 'An old game, drawn in chunky pixels: a save point, a boss fight, a side-scroller, a dogfight in space, a dungeon, a world map and the last castle in a storm.'],
    ['court', 'Royal Court', 'Kings, queens and knights: a game of chess, a great bell, banners and trumpets, a castle on a hill, a cathedral at evening, a sword in a stone and an empty throne.'],
    ['cipher', 'Cipher', 'Codes, locks and secret rooms, and every look hides something real to decode: Morse, a cipher wheel, invisible ink, a vault that opens on the date and a word of the day.'],
    ['popup', 'Pop-Up', 'A pop-up book: scenes cut from layers of paper that fold up off the page, with flaps, tabs and wheels, and someone new behind a flap each time.'],
    ['test', 'Test Day', 'Opens in the last week before the test date in your plan. Epic or better.']
  ];
  /* [id, name, tier, kind, series, what it does]; a theme's id is its Appearance value. The Radiant prizes are in no series
     ('any'): no crate is their own, so every crate holds each of them at the same chance. */
  var PZ_ITEMS = [
    ['prize-graphite', 'Graphite', 'c', 'theme', 'pencil', 'Warm gray paper and charcoal, like a pencil sketch.'],
    ['prize-highlighter', 'Highlighter', 'c', 'theme', 'pencil', 'Bright yellow buttons and highlights on cream.'],
    ['prize-sunrise', 'Sunrise', 'c', 'theme', 'seasons', 'Peach paper with coral and orange.'],
    ['prize-ocean', 'Ocean', 'c', 'theme', 'seasons', 'Pale aqua with deep teal.'],
    ['prize-library', 'Library', 'r', 'theme', 'varsity', 'Ivory pages and oxblood, like an old reading room.'],
    ['prize-varsity', 'Varsity', 'r', 'theme', 'varsity', 'Navy and gold, in school colors.'],
    ['prize-chalkboard', 'Chalkboard', 'r', 'theme', 'night', 'A dark green board with chalk-yellow accents.'],
    ['prize-blueprint', 'Blueprint', 'r', 'theme', 'night', 'Deep blue drafting paper with white lines.'],
    ['prize-lamplight', 'Lamplight', 'e', 'theme', 'night', 'Midnight navy with a warm desk-lamp glow.'],
    ['prize-arcade', 'Arcade', 'e', 'theme', 'arcade', 'Neon pink and cyan on near-black.'],
    ['prize-aurora', 'Aurora', 'e', 'theme', 'seasons', 'Dark teal with a green-to-violet glow.'],
    ['prize-synthwave', 'Synthwave', 'e', 'theme', 'arcade', 'A living theme: a striped sunset and a neon grid that rolls toward you.'],
    ['prize-inferno', 'Inferno', 'e', 'theme', 'seasons', 'A living theme: embers rise behind the page and the buttons glow like coals.'],
    ['prize-gold', 'Perfect 1600', 'l', 'theme', 'test', 'Black and gold.'],
    ['prize-nebula', 'Nebula', 'l', 'theme', 'night', 'A living theme: violet and blue clouds drift behind the page among the stars.'],
    ['prize-holo', 'Holographic', 'm', 'theme', 'test', 'A living theme: rainbow foil that shifts as it moves, on bright white.'],
    ['lined', 'Lined notebook', 'c', 'paper', 'pencil', 'Blue rules and a red margin behind the page.'],
    ['dots', 'Dot grid', 'c', 'paper', 'pencil', 'A light grid of dots behind the page.'],
    ['graph', 'Graph paper', 'r', 'paper', 'varsity', 'Squares behind the page.'],
    ['plot', 'Plotting', 'r', 'paper', 'varsity', 'Moving: a curve draws itself across graph paper.'],
    ['bpgrid', 'Blueprint grid', 'e', 'paper', 'night', 'Fine and bold grid lines behind the page.'],
    ['stars', 'Starfield', 'e', 'paper', 'night', 'Moving: drifting stars, with a shooting star now and then.'],
    ['eqrain', 'Equation rain', 'e', 'paper', 'varsity', 'Moving: math symbols fall softly down the page.'],
    ['const', 'Constellation', 'l', 'paper', 'night', 'Moving: stars drift and link up whenever two come close.'],
    ['sky', 'Aurora sky', 'l', 'paper', 'seasons', 'Moving: curtains of green and violet light ripple across the page.'],
    ['leaves', 'Falling leaves', 'r', 'paper', 'seasons', 'Moving: red, orange and gold leaves tumble down the page.'],
    ['snow', 'Snowfall', 'r', 'paper', 'seasons', 'Moving: snow drifts down, the near flakes faster than the far ones.'],
    ['blossoms', 'Blossoms', 'e', 'paper', 'seasons', 'Moving: pink petals flutter across the page on a breeze.'],
    ['check', 'Pencil check', 'c', 'fx', 'pencil', 'A check mark draws itself beside your answer.'],
    ['swipe', 'Highlighter swipe', 'c', 'fx', 'pencil', 'A highlighter stroke runs across the right answer.'],
    ['star', 'Gold star', 'r', 'fx', 'varsity', 'A gold star sticker slaps onto your answer.'],
    ['stamp', 'Teacher’s stamp', 'r', 'fx', 'varsity', 'A “Nice!” stamp lands at an angle.'],
    ['sparkle', 'Sparkles', 'r', 'fx', 'pencil', 'A few sparkles pop around your answer.'],
    ['confetti', 'Confetti', 'e', 'fx', 'arcade', 'A short burst of confetti.'],
    ['neon', 'Neon trace', 'e', 'fx', 'arcade', 'A rainbow neon tube races around your answer.'],
    ['lightning', 'Lightning strike', 'e', 'fx', 'arcade', 'The page goes dark and three bolts hit your answer.'],
    ['storm', 'Equation storm', 'e', 'fx', 'varsity', 'Math symbols spiral into your answer, then burst out.'],
    ['fireworks', 'Fireworks', 'l', 'fx', 'test', 'Two fireworks over your answer.'],
    ['golden', 'Golden hour', 'l', 'fx', 'varsity', 'Gold rays turn behind your answer as glitter rises.'],
    ['comet', 'Comet', 'l', 'fx', 'night', 'A comet streaks across the dark and slams into your answer.'],
    ['supernova', 'Supernova', 'm', 'fx', 'test', 'Darkness, a heartbeat, then shockwaves and a rainbow ring.'],
    ['shatter', 'Shatter', 'm', 'fx', 'test', 'Your answer bursts into glowing shards that snap back together.'],
    ['candle', 'Candle', 'c', 'streak', 'pencil', 'A candle burns beside your streak.'],
    ['coffee', 'Coffee cups', 'c', 'streak', 'pencil', 'One cup for every week in a row.'],
    ['books', 'Book stack', 'r', 'streak', 'varsity', 'A book added to the pile every week.'],
    ['rocket', 'Rocket', 'r', 'streak', 'arcade', 'A rocket that climbs as the streak grows.'],
    ['plant', 'Growing plant', 'e', 'streak', 'test', 'A seed that sprouts at 7 days, leafs out at 30 and flowers at 100.'],
    ['glow', 'Soft glow', 'c', 'aura', 'pencil', 'A slow, breathing glow in violet and pink.'],
    ['twinkle', 'Twinkle', 'c', 'aura', 'pencil', 'Stars wink on and off around your streak.'],
    ['orbit', 'Orbit', 'r', 'aura', 'night', 'Three small planets circle your streak.'],
    ['sine', 'Sine ring', 'r', 'aura', 'varsity', 'A ring of light that ripples like a wave.'],
    ['static', 'Static charge', 'e', 'aura', 'arcade', 'Electric arcs crackle and jump around your streak.'],
    ['ember', 'Ember crown', 'e', 'aura', 'seasons', 'Sparks and embers rise like a campfire.'],
    ['spiral', 'Golden spiral', 'e', 'aura', 'night', 'Two arms of the golden-ratio spiral turn, lit from inside.'],
    ['equation', 'Equation orbit', 'l', 'aura', 'varsity', 'Math symbols circle in two rings, glowing as they pass in front.'],
    ['unit', 'Unit circle', 'l', 'aura', 'varsity', 'A radius sweeps the circle while sine and cosine waves stream out.'],
    ['prism', 'Prism', 'l', 'aura', 'arcade', 'A rainbow ring with beams of colored light.'],
    ['infinity', 'Infinity', 'm', 'aura', 'test', 'Two comets trace an endless ∞ with rainbow tails.'],
    ['horizon', 'Event horizon', 'm', 'aura', 'night', 'A black hole: a disk of fire, bent light, stars pulled in.'],
    /* Deep Sea */
    ['prize-abyss', 'Abyss', 'l', 'theme', 'deep', 'A living theme: glowing plankton drifts through dark water under slow beams of light, and now and then a jellyfish rises.'],
    ['bubbles', 'Bubbles', 'c', 'paper', 'deep', 'Moving: bubbles wobble up the page and pop near the top.'],
    ['kelp', 'Kelp forest', 'e', 'paper', 'deep', 'Moving: kelp sways at the edges of the page while sunbeams slant down.'],
    ['splash', 'Splash', 'c', 'fx', 'deep', 'Water drops leap from your answer and fall back.'],
    ['koi', 'Koi', 'e', 'fx', 'deep', 'Two koi circle your answer, then leap out in a splash.'],
    ['jelly', 'Jellyfish', 'r', 'aura', 'deep', 'Two glowing jellyfish pulse and drift around your streak.'],
    ['leviathan', 'Leviathan', 'm', 'aura', 'deep', 'A sea serpent of light circles your streak in the deep; a pulse runs down its back and its call rings out.'],
    /* Myth & Magic */
    ['prize-enchanted', 'Enchanted', 'm', 'theme', 'myth', 'A living theme: a wood at night, with fireflies, rolling mist, runes that glow and fade, and a wisp that streaks past.'],
    ['fireflies', 'Fireflies', 'r', 'paper', 'myth', 'Moving: fireflies wander the page, blinking on and off.'],
    ['spell', 'Spell circle', 'r', 'fx', 'myth', 'A magic circle draws itself around your answer and flashes.'],
    ['phoenix', 'Phoenix', 'l', 'fx', 'myth', 'A phoenix of flame rises from your answer, spreads its wings and bursts into embers.'],
    ['runes', 'Rune ring', 'c', 'aura', 'myth', 'A ring of glowing runes turns slowly around your streak.'],
    ['crystal', 'Crystal bloom', 'e', 'aura', 'myth', 'Crystals grow around your streak and catch the light.'],
    ['dragon', 'Dragon coil', 'l', 'aura', 'myth', 'A dragon coils around your streak and breathes fire.'],
    ['egg', 'Dragon egg', 'e', 'streak', 'myth', 'Cracks as your streak grows; at 30 days it hatches, and at 100 the dragon has wings.'],
    /* Tech Lab */
    ['prize-terminal', 'Terminal', 'e', 'theme', 'tech', 'A living theme: green letters on an old screen, with scanlines, a flicker and ones and zeros at the edges.'],
    ['circuit', 'Circuit board', 'r', 'paper', 'tech', 'Moving: pulses of light race along circuit traces.'],
    ['warp', 'Warp speed', 'l', 'paper', 'tech', 'Moving: stars stretch into streaks as you jump to light speed, then drop back.'],
    ['pixel', 'Pixel pop', 'c', 'fx', 'tech', 'Pixels burst out of your answer in 8-bit steps.'],
    ['glitch', 'Glitch', 'e', 'fx', 'tech', 'Your answer splits into color-shifted slices, then snaps back clean.'],
    ['freeze', 'Time freeze', 'm', 'fx', 'tech', 'Time stops: frost creeps in, a clock races backward around your answer, then the ice cracks and color floods back.'],
    ['radar', 'Radar', 'r', 'aura', 'tech', 'A radar sweep circles your streak and picks up blips.'],
    ['battery', 'Battery', 'c', 'streak', 'tech', 'Charges one bar for each week of your streak.'],
    /* Haunted */
    ['boo', 'Boo', 'c', 'fx', 'haunt', 'A little ghost pops up from your answer.'],
    ['cobweb', 'Cobwebs', 'c', 'paper', 'haunt', 'Moving: webs in the corners, and a spider that lowers itself and climbs back.'],
    ['ghosts', 'Little ghosts', 'r', 'aura', 'haunt', 'Three small ghosts float around your streak.'],
    ['pumpkin', 'Jack-o’-lantern', 'r', 'streak', 'haunt', 'Carved after a week of your streak; at 30 days the candle is lit.'],
    ['bats', 'Bat swarm', 'e', 'fx', 'haunt', 'A swarm of bats bursts out of your answer.'],
    ['eyes', 'Watching eyes', 'e', 'aura', 'haunt', 'Eyes open in the dark around your streak, look about, and blink.'],
    ['prize-haunted', 'Haunted', 'l', 'theme', 'haunt', 'A living theme: a full moon, drifting fog, bats crossing, and eyes in the shadows at the edges.'],
    ['nightmare', 'Nightmare', 'm', 'fx', 'haunt', 'The lights go out and eyes open everywhere, all staring at your answer; one giant eye opens, then claws tear the dark away.'],
    /* The Unknown */
    ['slime', 'Slime', 'c', 'aura', 'unknown', 'Green slime oozes down from above your streak and drips.'],
    ['meteors', 'Meteor shower', 'r', 'paper', 'unknown', 'Moving: meteors streak down the page in gold, cyan and pink.'],
    ['wormhole', 'Wormhole', 'r', 'fx', 'unknown', 'Rings spin around your answer and pull stardust in.'],
    ['portal', 'Portal', 'e', 'aura', 'unknown', 'A spinning gateway opens behind your streak and pulls light into it.'],
    ['prize-eldritch', 'Eldritch', 'e', 'theme', 'unknown', 'A living theme: tentacles sway up from below while glowing spores drift past.'],
    ['ufo', 'Flyby', 'l', 'paper', 'unknown', 'Moving: a flying saucer drifts across the page, sweeping a beam of light under it.'],
    ['abduct', 'Abduction', 'l', 'fx', 'unknown', 'A saucer swoops in, beams sparkles up from your answer, and zips away.'],
    ['watcher', 'The Watcher', 'm', 'aura', 'unknown', 'Your streak sits in the pupil of a giant eye. Its iris burns, it looks around and blinks, and tentacles reach in from the corners.'],
    /* Dreamscape */
    ['paint', 'Paint splat', 'c', 'fx', 'dream', 'Bright paint splats land around your answer.'],
    ['moon', 'Moon phase', 'c', 'streak', 'dream', 'A moon that fills a little each day and is full at 30.'],
    ['lava', 'Lava lamp', 'r', 'paper', 'dream', 'Moving: big soft blobs of color rise and sink.'],
    ['butterflies', 'Butterflies', 'r', 'aura', 'dream', 'Six bright butterflies flutter around your streak.'],
    ['kaleido', 'Kaleidoscope', 'e', 'paper', 'dream', 'Moving: a mirrored pattern of shapes turns and changes color.'],
    ['cranes', 'Paper cranes', 'e', 'fx', 'dream', 'Folded paper cranes take off from your answer.'],
    ['kitsune', 'Kitsune', 'l', 'aura', 'dream', 'A fox spirit: nine tails of flame fan out behind your streak under a fox mask, with blue foxfire circling.'],
    ['prize-lanterns', 'Lantern festival', 'l', 'theme', 'dream', 'A living theme: glowing paper lanterns rise into a starry dusk.'],
    ['whale', 'Star whale', 'm', 'paper', 'dream', 'Moving: a whale drawn in stars swims slowly across the page, trailing stardust.'],
    /* stage auras: a scene drawn above the streak (FX_STG in fx.js) */
    ['veil', 'Polar veil', 'r', 'aura', 'zenith', 'A stage aura: curtains of pink and teal light, with stars hanging from them on threads over a ring of mist.'],
    ['galaxy', 'Spiral arm', 'e', 'aura', 'zenith', 'A stage aura: a spiral galaxy turns under your streak, a halo floats above, and constellations draw themselves and fade.'],
    ['totality', 'Totality', 'e', 'aura', 'zenith', 'A stage aura: a total eclipse with a living corona hangs over a dark gate that throws sparks upward.'],
    ['crescendo', 'Crescendo', 'e', 'aura', 'zenith', 'A stage aura: a ring of sound bars beats under a crown of blue shards while notes ride five flowing lines.'],
    ['hearthwood', 'Hearthwood', 'l', 'aura', 'zenith', 'A stage aura: a tree on a floating island with a heart of green light, a little house, string lights, falling leaves and fireflies.'],
    ['seraph', 'Seraph', 'm', 'aura', 'zenith', 'A stage aura: six wings of light covered in eyes that blink, a halo above, runes circling below, and blades of light falling around it.'],
    ['segfault', 'Segfault', 'e', 'aura', 'paradox', 'A stage aura: a warning sign that will not hold still, numbers that flicker, and a picture that keeps slipping.'],
    ['overtime', 'Overtime', 'l', 'aura', 'paradox', 'A stage aura: three clocks running at different speeds over turning rings of Roman numerals, with bits of math drifting past.'],
    ['tesseract', 'Tesseract', 'l', 'aura', 'paradox', 'A stage aura: a cube from the fourth dimension turns itself inside out over a glowing grid, and bursts every few seconds.'],
    ['equilibrium', 'Equilibrium', 'l', 'aura', 'paradox', 'A stage aura: a black sphere and a white sphere circle each other, and every few seconds black and white trade places.'],
    ['monolith', 'Monolith', 'm', 'aura', 'paradox', 'A stage aura: five broken standing stones, the tallest split by a line of light, glass rising from the ground, quiet words, and a moment when everything turns to white.'],
    /* scenes in the other kinds of look */
    ['spotlight', 'Spotlight', 'c', 'fx', 'paradox', 'A stage light swings across the dark and settles on your answer.'],
    ['constellation', 'Starlit check', 'r', 'fx', 'zenith', 'Stars come out around your answer and join up into a check mark.'],
    ['curtain', 'Curtain call', 'e', 'fx', 'paradox', 'Red curtains sweep shut, then open on your answer in the spotlight while roses land around it.'],
    ['liftoff', 'Liftoff', 'l', 'fx', 'zenith', 'Three, two, one: a rocket launches from your answer through smoke and streaking stars.'],
    ['hightide', 'High tide', 'l', 'fx', 'zenith', 'The sea rises over the page, fish swim past your answer, and the water drains away.'],
    ['epiphany', 'Epiphany', 'm', 'fx', 'paradox', 'The screen goes black and three words type themselves out. Stones rise behind your answer, everything turns white for a moment, and glass drifts up.'],
    ['dragonflight', 'Dragonflight', 'm', 'fx', 'zenith', 'A dragon the width of the screen flies behind your answer and breathes fire over it.'],
    ['planes', 'Paper planes', 'c', 'paper', 'zenith', 'Moving: paper planes glide across the page on dotted trails.'],
    ['rain', 'Rainy window', 'r', 'paper', 'paradox', 'Moving: rain runs down the glass in front of soft city lights.'],
    ['gears', 'Clockwork', 'l', 'paper', 'paradox', 'Moving: great gears turn against each other behind the page while a pendulum swings.'],
    ['orbit-view', 'Low orbit', 'l', 'paper', 'zenith', 'Moving: the curve of a planet glows along the bottom of the page under a ringed world, while satellites cross.'],
    ['prize-metropolis', 'Metropolis', 'e', 'theme', 'paradox', 'A living theme: a city skyline at night, windows switching on and off, a moon and a plane crossing.'],
    ['prize-summit', 'Summit', 'l', 'theme', 'zenith', 'A living theme: mountain ridges before dawn, mist drifting between them, birds crossing a rose sky.'],
    ['hourglass', 'Hourglass', 'r', 'streak', 'paradox', 'Sand runs through as your streak grows, and it is all through at 30 days.'],
    ['crown', 'Crown', 'e', 'streak', 'zenith', 'A crown that gains a jewel for each week of your streak, up to five.'],
    ['comet-tail', 'Comet tail', 'l', 'streak', 'zenith', 'A comet whose tail grows a little longer every day.'],
    /* Rocks & Gems and Forecast (gems-weather.js) */
    ['prize-sandstone', 'Sandstone', 'c', 'theme', 'gems', 'Warm sand and red rock, with turquoise buttons.'],
    ['prize-overcast', 'Overcast', 'c', 'theme', 'forecast', 'A soft gray sky with slate-blue buttons.'],
    ['prize-lapis', 'Lapis', 'r', 'theme', 'gems', 'Deep blue stone with flecks of gold.'],
    ['prize-snowday', 'Snow day', 'r', 'theme', 'forecast', 'Bright, icy white with winter blues.'],
    ['prize-opal', 'Black opal', 'e', 'theme', 'gems', 'A living theme: a dark stone full of fire. Patches of color flash and fade behind the page and shift as you scroll, the way an opal changes when you tilt it.'],
    ['prize-thunderhead', 'Thunderhead', 'l', 'theme', 'forecast', 'A living theme: storm clouds roll along the top of the page, lightning flickers inside them and now and then strikes down the edge, and soft rain falls.'],
    ['prize-cavern', 'Crystal cavern', 'm', 'theme', 'gems', 'A living theme: a cave lined with giant glowing crystals. Light falls from an opening above, water drips from the crystal tips, and every so often a chime runs through the cave and lights each crystal as it passes.'],
    ['terrazzo', 'Terrazzo', 'c', 'paper', 'gems', 'Chips of colored stone scattered behind the page, like a terrazzo floor.'],
    ['cumulus', 'Cumulus', 'c', 'paper', 'forecast', 'Moving: fair-weather clouds drift slowly across the page.'],
    ['agate', 'Agate', 'r', 'paper', 'gems', 'Moving: banded agate fills two corners of the page, and now and then a gleam of light slides across it.'],
    ['kites', 'Kites', 'r', 'paper', 'forecast', 'Moving: three kites ride the breeze across the page, tugging at their strings.'],
    ['wxmap', 'Weather map', 'e', 'paper', 'forecast', 'Moving: a high and a low drift across a weather map while fronts slide out and rain passes along them.'],
    ['cgarden', 'Crystal garden', 'l', 'paper', 'gems', 'Moving: crystals grow from the corners of the page, light runs up them one at a time, and sparkles drift up.'],
    ['cloudsea', 'Sea of clouds', 'm', 'paper', 'forecast', 'Moving: the page floats above a sea of clouds at sunrise. The sun climbs out of them and turns them gold and pink, and now and then birds glide across.'],
    ['glint', 'Glint', 'c', 'fx', 'gems', 'A sheen sweeps across your answer and a gem flashes at its corner.'],
    ['raindrop', 'Raindrop', 'c', 'fx', 'forecast', 'One fat raindrop lands on your answer and sends rings across it.'],
    ['geode', 'Geode', 'r', 'fx', 'gems', 'A plain stone drops onto your answer, cracks, and falls open to show the crystals inside.'],
    ['gust', 'Gust', 'r', 'fx', 'forecast', 'A gust of wind loops around your answer and carries three leaves away.'],
    ['sunshower', 'Sun shower', 'e', 'fx', 'forecast', 'Rain falls, the sun breaks through over your answer, the drops turn gold, and a rainbow arches over it.'],
    ['twister', 'Twister', 'l', 'fx', 'forecast', 'The sky turns green-gray and a twister drops from the clouds, crosses your answer picking up sparks, then lifts away and lets them fall.'],
    ['motherlode', 'Motherlode', 'm', 'fx', 'gems', 'The page goes dark as a cave. Gold seams crack out from your answer, crystals burst up around it, cut gems fly up and rain down, and “a rare find.” types itself above it.'],
    ['gemdust', 'Gem dust', 'c', 'aura', 'gems', 'Flakes of colored stone rise around your streak, flashing as they turn.'],
    ['drizzle', 'Drizzle', 'c', 'aura', 'forecast', 'A small cloud rains softly over your streak, and the drops ring where they land.'],
    ['birthstones', 'Birthstones', 'r', 'aura', 'gems', 'The twelve stones of the months circle your streak on a gold chain, and this month’s stone shines brightest.'],
    ['snowglobe', 'Snow globe', 'r', 'aura', 'forecast', 'Your streak sits in a snow globe. Every few seconds it is shaken and the snow swirls, then settles.'],
    ['choir', 'Crystal choir', 'e', 'aura', 'gems', 'Crystals on either side of your streak glow one after another like the notes of a chord, and every few seconds they all sing together.'],
    ['sundog', 'Sundog', 'l', 'aura', 'forecast', 'Your streak is a low winter sun in a halo of ice light, with a bright mock sun on each side and diamond dust glittering in the cold air.'],
    ['supercell', 'Supercell', 'm', 'aura', 'forecast', 'A stage aura: a giant storm at sunset. Its anvil streams across the sky, lightning flickers inside and strikes the ground, and a rainbow shows in the rain while a windmill turns on the farm below.'],
    ['cairn', 'Cairn', 'c', 'streak', 'gems', 'A stack of balanced stones that gains one each week, up to six; at 100 days a gem sits on top.'],
    ['thermo', 'Thermometer', 'c', 'streak', 'forecast', 'The red line climbs with your streak and reaches the top at 30 days; at 100 the heat shimmers off it.'],
    ['chest', 'Treasure chest', 'r', 'streak', 'gems', 'The lid lifts at 7 days; at 30 the chest opens on gold and gems, and at 100 it overflows.'],
    ['skies', 'Skies', 'r', 'streak', 'forecast', 'The weather clears as your streak grows, from rain to sunshine, with a rainbow at 100 days.'],
    ['rainbow', 'Rainbow', 'e', 'streak', 'forecast', 'A rainbow that gains a band each week until all seven shine; at 100 days it shimmers.'],
    ['hiddengem', 'Hidden gem', 'l', 'streak', 'gems', 'A plain rock that cracks at 7 days and glows inside at 14; at 30 days it opens on crystals, and at 100 a gem rises out of it.'],
    ['bottle', 'Lightning in a bottle', 'm', 'streak', 'forecast', 'A storm in a corked bottle: a spark at first, a cloud and a bolt at 7 days, a full storm at 30, and at 100 the glass glows.'],
    /* Radiant (radiant.js): one look or more of every kind, each with its own arrival when it is won */
    ['prize-beacon', 'Beacon', 'z', 'theme', 'any', 'A living theme: a lighthouse keeps watch over a dark sea. Its beam turns slowly, the rain and fog shine only where the light passes, and now and then the beam swings toward you in a great flash.'],
    ['diamond', 'Diamond ring', 'z', 'fx', 'any', 'The page darkens as the moon’s shadow slides across your answer. A crown of light opens around it, stars come out, and the sun returns in one brilliant flash.'],
    ['fortissimo', 'Fortissimo', 'z', 'fx', 'any', 'Five beats, each one quicker and brighter, with light bars jumping on every beat. Then the drop: a burst of color, rainbow rings and PERFECT! in pixel letters.'],
    ['starforge', 'Starforge', 'z', 'fx', 'any', 'The page goes dark like a forge. A hammer of light strikes your answer three times, sparks fly with every blow, and the answer cools into gold.'],
    ['kintsugi', 'Kintsugi', 'z', 'aura', 'any', 'Cracks spread across dark glaze and fill with molten gold, the way broken pottery is mended in Japan. A new crack opens every few seconds while an old one heals.'],
    ['orrery', 'Orrery', 'z', 'aura', 'any', 'A brass model of the planets. Gears turn in the corners, a dial ticks, and the planets swing around a glowing sun, one with a ring and one with a moon.'],
    ['rose', 'Rose Window', 'z', 'aura', 'any', 'A round stained-glass window. Sunlight moves around it, lighting each pane in turn, and colored beams fall from it through glittering dust.'],
    ['gyre', 'Gyre', 'z', 'paper', 'any', 'Moving: a slow spiral current of tiny glowing sea life turns behind the page, and now and then a school of fish swims through it.'],
    ['tree', 'Learning tree', 'z', 'streak', 'any', 'A glowing seed that sprouts at 7 days, becomes a tree with a golden heart at 30, and at 100 days a great tree with lanterns in its branches.'],
    /* Wildlands (looks.js) */
    ['campfire', 'Campfire', 'c', 'aura', 'wilds', 'A stage aura: a fire under the Milky Way. Logs glow and pop, throwing up sparks, a marshmallow toasts on a stick, a lantern glows in the tent and an owl blinks in the pines.'],
    ['caldera', 'Caldera', 'l', 'aura', 'wilds', 'A stage aura: a volcano with a churning lava lake, rivers of fire and lightning in its ash. It rumbles, then erupts in full: a flash, a ring of pressure, a fountain of fire and lava bombs.'],
    ['murmuration', 'Murmuration', 'e', 'fx', 'wilds', 'The page turns to a dusk sky over a reed bed. A ribbon of starlings pours in and swirls into one great rippling cloud, wheels round your answer in a ring, then dives into the reeds.'],
    ['honeycomb', 'Honeycomb', 'c', 'paper', 'wilds', 'Moving: a honeycomb filling with honey, wax caps and drips. Bees land, crawl about and take off, one does its waggle dance, and a sunbeam drifts across with pollen in it.'],
    ['meadow', 'Meadow', 'r', 'paper', 'wilds', 'Moving: a summer meadow along the bottom of the page. Gusts roll through the grass, poppies and lupins nod, butterflies and bees visit the flowers and dandelion seeds float away. At night, moths and glow-worms.'],
    ['balloons', 'Hot-air balloons', 'e', 'paper', 'wilds', 'Moving: striped balloons of every pattern rise past far mountains and clouds. Burners roar with blue and orange flames and people wave from the baskets. Dawn on a light page, night on a dark one.'],
    ['inkwash', 'Ink wash', 'l', 'paper', 'wilds', 'Moving: an ink painting that paints itself. Mountains, a waterfall and a pagoda; mist, a boat and a line of cranes; plum blossom opening, drops of ink blooming, and a red seal pressed into the corner.'],
    ['prize-clouds', 'Halcyon', 'c', 'theme', 'wilds', 'A living theme: a warm sun with turning rays and a flare, soft clouds at three depths, dandelion seeds, a flock of birds, a plane’s trail spreading, and sometimes a faint rainbow.'],
    ['prize-pond', 'Lily pond', 'r', 'theme', 'wilds', 'A living theme: koi glide under lily pads and lotus flowers, a frog leaps from pad to pad, water striders skate, a dragonfly darts, and now and then a shower sets rings spreading everywhere.'],
    ['prize-dunes', 'Dunes', 'l', 'theme', 'wilds', 'A living theme: dunes under a huge moon and the Milky Way. Sand streams off the crests, a caravan with a swinging lantern crosses the far ridge, a fennec fox watches, and stars fall in showers.'],
    ['prize-thinice', 'Thin ice', 'm', 'theme', 'wilds', 'A living theme: the black ice of a frozen lake at night. Bubbles hang frozen in it, cracks sing across it, frost flowers grow, an unseen skater carves curves, and far below something vast swims past and looks up.'],
    ['lotus', 'Lotus', 'l', 'streak', 'wilds', 'A bud on the water that opens a pair of petals each week, rings spreading round it; in full bloom at 30 days with a beating golden heart, and glowing with rising light at 100.'],
    /* Curiosities (looks.js) */
    ['fortune', 'Fortune teller', 'r', 'aura', 'curio', 'A stage aura: a crystal ball between candles on a velvet table, a black cat beside it. Visions rise in the mist, a moon, an eye, a key and a star, and a tarot card turns over to match each one.'],
    ['mimic', 'Mimic', 'e', 'aura', 'curio', 'A stage aura: a chest on a hoard of gold in a torch-lit vault. It breathes, its keyhole becomes an eye, the lid creaks up on eyes in the dark, then gapes on teeth and a lashing tongue, and snaps shut.'],
    ['kilonova', 'Kilonova', 'm', 'aura', 'curio', 'A stage aura: two dead stars spiral together over bent space, beams sweeping, faster and faster, and merge in a flash: jets, a shell of color, gold raining down, and a black hole where they were.'],
    ['dominoes', 'Dominoes', 'c', 'fx', 'curio', 'Dominoes in every color stand in a ring around your answer and fall one after another, faster and faster, each with a click of light, until a wave of light runs round the ring.'],
    ['jackpot', 'Jackpot', 'r', 'fx', 'curio', 'A slot machine pops up. A coin drops in, the lever comes down, the reels stop on 7, 7, 7, the siren spins, JACKPOT lights letter by letter, and confetti and coins burst out.'],
    ['angler', 'Anglerfish', 'l', 'fx', 'curio', 'The page sinks into the deep. A small light bobs toward your answer with little fish round it, then two pale eyes open and the anglerfish shows itself, your answer in its jaws, before it sinks away.'],
    ['threshold', 'Threshold', 'm', 'fx', 'curio', 'Carved doors slam shut around your answer. The seal’s runes light and arc, cracks of light spread, the chains snap, and the doors swing open on a hall of light with feathers drifting down.'],
    ['wanderers', 'Wanderers', 'm', 'paper', 'curio', 'Moving: giants walk the far horizon under a huge moon, lanterns swinging from their necks and markings glowing, dust rising at each step. One calls and the others answer, and a small traveller walks below.'],
    ['prize-mycelium', 'Mycelium', 'e', 'theme', 'curio', 'A living theme: glowing mushrooms and shelf fungi with a wave of light passing through them, roots dripping light from above, moths, a glowing snail, and clouds of spores.'],
    ['tally', 'Tally marks', 'c', 'streak', 'curio', 'One chalk mark a day in bundles of five, the newest drawing itself in; past 20 days they turn gold and shimmer, and at 100 a gold star joins them.'],
    ['chain', 'Paper chain', 'r', 'streak', 'curio', 'A folded paper link for every week, up to eight, swinging in a wave; it glitters at 30 days and is edged in gold at 100.'],
    ['marquee', 'Marquee', 'e', 'streak', 'curio', 'A little theater sign with a flickering flame, ringed by bulbs, one lit each day; when all are lit they chase, gold at 30 days, every color at 100.'],
    ['ouroboros', 'Ouroboros', 'm', 'streak', 'curio', 'A serpent that curls further round each day, slithering, tongue flicking; it holds its own tail and glows at 30 days, and at 100 turns, shining in every color.'],
    /* Dress-Up: skins for the student's character in My room and for the study buddy (buddy.js draws them, pal.js walks along) */
    ['pjs', 'Sleepyhead', 'c', 'skin', 'dress', 'Starry pajamas, a long nightcap and slippers, in a glow of moonlight with sleepy Zs floating up. Dozes off when things get quiet, then wakes with a start.'],
    ['doodle', 'Doodle', 'c', 'skin', 'dress', 'A notebook-paper hoodie, a folded paper hat and a big pencil, with doodles that draw themselves and a paper plane looping overhead. Silly, and always drawing.'],
    ['rain', 'Raincoat', 'c', 'skin', 'dress', 'A shiny raincoat, a rain hat and rubber boots, under a little cloud that drizzles, with a rainbow behind and a puddle that ripples. Sunny in any weather.'],
    ['sprout', 'Sprout', 'c', 'skin', 'dress', 'A leafy hood with a sprout on top that sways, flowers at your feet and leaves drifting down in warm sunlight. Gentle, and grows a little every day.'],
    ['ghost', 'Ghostie', 'r', 'skin', 'dress', 'A hooded spirit cloak that floats instead of walking, with little ghost flames for friends. Fades away when you tap it, then pops back with a giggle.'],
    ['bits', 'Pixel Pal', 'r', 'skin', 'dress', 'Pixel headphones and shades, a pixel heart, a glowing grid to stand on, and hearts, coins and +1s floating up. Competitive and goofy.'],
    ['frog', 'Froggy', 'r', 'skin', 'dress', 'A frog hood with big eyes that blink and webbed feet, on a lily pad with a lotus, bubbles and a fly buzzing round. Bouncy and easily excited.'],
    ['knight', 'Knight', 'r', 'skin', 'dress', 'Shining armor, a helmet with a plume, a shield, a cape and a banner that waves. Brave, loyal and here to guard your streak.'],
    ['robo', 'Robo', 'e', 'skin', 'dress', 'A robot suit with a visor helmet, a glowing core and jet boots, inside a turning hologram. Scans you, beeps hello and does the robot dance.'],
    ['gloop', 'Gloop', 'e', 'skin', 'dress', 'A suit of shiny jelly with bubbles rising inside, a drippy hood with a little slime friend on top, and two more slimes bouncing in a puddle. Wobbles all over when you tap it.'],
    ['ninja', 'Ninja', 'e', 'skin', 'dress', 'A dark outfit with a scarf, sash and headband in your color, a sword on the back, bamboo, a full moon and leaves whirling round. Vanishes in a puff of smoke.'],
    ['dragon', 'Dragon', 'l', 'skin', 'dress', 'A dragon-head hood, scale armor, wings and a tail, standing in a fire that never goes out. Breathes a blast of fire and keeps trying to fly.'],
    ['wizard', 'Wizard', 'l', 'skin', 'dress', 'A tall hat with a floppy tip, a starry robe, a staff with a glowing orb and a spellbook that turns its own pages, between two magic circles. Casts a spell when you tap it.'],
    ['cosmo', 'Starborn', 'm', 'skin', 'dress', 'Hair like a galaxy, a robe and cape of night sky, star rings, constellations that draw themselves and a little planet in orbit. Spins up a galaxy when it is happy.'],
    ['frost', 'Frostfall', 'm', 'skin', 'dress', 'Snow-white hair and a crown of ice, a crystal breastplate and a fur-trimmed cape, under northern lights, with a giant snowflake turning behind and ice circling round. Freezes the air when it is proud of you.'],
    ['dawn', 'Daybreak', 'z', 'skin', 'any', 'White-gold armor with a sun on the chest, a winged crown and wings of light, in turning rays and rings of gold. Its light bursts out when it is proud of you.'],
    /* 8-Bit (pixel-court.js) */
    ['savepoint', 'Save point', 'c', 'aura', 'bit', 'A stage aura: a crystal turns over a pedestal in a torch-lit pixel dungeon. Every few seconds the game saves: sparks are drawn in, the runes on the floor light, the hearts refill, and it flashes GAME SAVED.'],
    ['bossfight', 'Boss fight', 'l', 'aura', 'bit', 'A stage aura: a pixel knight fights a pixel dragon over lava. Fire, shield, sword, numbers flying and bars draining; then the knight charges up, strikes for 999, the dragon breaks apart and coins rain down under VICTORY.'],
    ['levelup', 'Level up', 'c', 'fx', 'bit', 'A pixel bar under your answer fills with experience and flashes, LEVEL UP! bounces in above it in every color, pillars of pixels rise and three stats tick up.'],
    ['crit', 'Critical hit', 'e', 'fx', 'bit', 'Speed lines race in, three pixel cuts cross behind your answer, the screen flashes, 9999 jumps out in gold, CRITICAL! shakes, and shards of light fly off the frame.'],
    ['scroller', 'Side-scroller', 'r', 'paper', 'bit', 'Moving: a pixel level scrolls along the foot of the page, with mountains, hills, a path of blocks, coins and flags. A little runner jumps the gaps and takes the coins.'],
    ['dogfight', 'Dogfight', 'e', 'paper', 'bit', 'Moving: pixel stars fall past a ringed planet. A fighter weaves and fires, raiders sway down and burst into pixels when hit, a saucer crosses, and the score counts up.'],
    ['overworld', 'Overworld', 'm', 'paper', 'bit', 'Moving: the map of a pixel world slides under the page: seas, beaches, forest and snowy mountains. Waves glint, towns blink, cloud shadows cross, an airship flies over and a sea serpent surfaces.'],
    ['prize-pocket', 'Pocket', 'r', 'theme', 'bit', 'A living theme: the green screen of an old handheld. Pixel hills and a brick path scroll along the foot, a blob hops along it, clouds drift, and now and then the screen refreshes in a band of light.'],
    ['prize-dungeon', 'Dungeon', 'e', 'theme', 'bit', 'A living theme: pixel brick walls with torches burning, chains swaying, water dripping, eyes blinking in the dark, bats, a spider on its thread, a bouncing slime, and a chest that opens and throws out coins.'],
    ['prize-stormkeep', 'Storm keep', 'm', 'theme', 'bit', 'A living theme: the last level. A pixel fortress over a moat of lava in driving rain, windows blinking; lightning stairs down and whitens the screen, bats wheel, and a dragon crosses the sky breathing fire.'],
    ['hearts', 'Hearts', 'c', 'streak', 'bit', 'Pixel hearts that beat. One fills for each week, with a half heart on the way; they turn gold at 30 days and every color at 100.'],
    ['xp', 'XP bar', 'e', 'streak', 'bit', 'A pixel badge with your level, one for each week, over a bar that fills a seventh a day. It grows wings at 30 days and wears a crown at 100.'],
    /* Royal Court (pixel-court.js) */
    ['checkmate', 'Checkmate', 'r', 'aura', 'court', 'A stage aura: a chessboard in a moonlit hall. The white queen runs the length of the board on a trail of gold, the black king shakes and falls, a beam finds the queen and her side hops for joy.'],
    ['belfry', 'Belfry', 'e', 'aura', 'court', 'A stage aura: a great bronze bell swings in a stone arch in front of the moon. Each toll sends out rings of sound, shakes down dust and lights a numeral; doves scatter; at the twelfth the bell blazes gold.'],
    ['throne', 'Empty throne', 'm', 'aura', 'court', 'A stage aura: a black throne on a cracked floor leaking violet light, six swords before it and a crown hanging above. Dark lightning walks the swords; then a king of shadow sits, the crown comes down, and every crack blazes.'],
    ['seal', 'Royal seal', 'r', 'fx', 'court', 'Red wax drips and pools under the corner of your answer, a brass seal presses it and lifts to show a crown, ribbons unroll, and a gold rule draws itself above.'],
    ['coronation', 'Coronation', 'l', 'fx', 'court', 'Two banners drop above your answer, heralds’ trumpets slide in from both sides and sound, and a crown comes down a beam of light to rest on it while gold leaf falls.'],
    ['kingmaker', 'Kingmaker', 'm', 'fx', 'court', 'Storm cloud gathers and a sword of light plants itself in your answer as if in a stone. Cracks of light run round the frame, lightning comes down to the pommel, and the blade becomes a pillar of light as gold feathers fall.'],
    ['heraldry', 'Heraldry', 'c', 'paper', 'court', 'Moving: a field of small shields. A sheen crosses it, and every so often a ripple runs out from the middle and each shield turns over. Strings of pennants sway along the top.'],
    ['castle', 'Castle on the hill', 'l', 'paper', 'court', 'Moving: a castle on a crag at the foot of the page, windows lit and flags flying under a big moon. Birds circle the tower, a rider with a torch crosses the bridge, and fireworks go up over the keep.'],
    ['prize-vellum', 'Illuminated', 'c', 'theme', 'court', 'A living theme: the margins of an old manuscript. Vines climb both edges putting out leaves, flowers and gold dots, a painted capital sits in the corner, and along the foot a small knight forever chases a snail.'],
    ['prize-vespers', 'Vespers', 'l', 'theme', 'court', 'A living theme: a cathedral at evening. Arches recede down both sides, three shafts of colored light drift, a wheel of glass glows, candles burn along the foot, incense curls up, and the whole place brightens when a bell tolls.'],
    ['banner', 'Banner', 'r', 'streak', 'court', 'A pennant on a pole that flies longer each week and gains a stripe. At 30 days it carries a gold crown, and at 100 it has two tails and a shining finial.'],
    ['tower', 'Tower', 'l', 'streak', 'court', 'A stone tower that gains a storey each week, each with a lit window. A flag flies from the top at 30 days, and at 100 a beacon burns there.'],
    ['sword', 'Sword in the stone', 'm', 'streak', 'court', 'A sword sunk in a rock, a little further out every day. At 30 days it comes free and hangs in a ring of light, and at 100 rays turn behind it.'],
    /* five more Radiant looks (pixel-court.js), one of each kind, each with its own arrival */
    ['carousel', 'Carousel', 'z', 'aura', 'any', 'A stage aura: a golden carousel at a night fair. Eight horses rise and fall round a mirrored column under a turning striped canopy; then the lights go down, every bulb fires, the ride spins up throwing sparks, and fireworks open overhead.'],
    ['bloom', 'In full bloom', 'z', 'fx', 'any', 'The page turns to a garden at night. Two vines climb round your answer putting out leaves, buds open one after another into flowers, butterflies lift off, and a warm dawn rises underneath and gilds the frame.'],
    ['shadowplay', 'Shadow play', 'z', 'paper', 'any', 'Moving: the page becomes the lit screen of a shadow-puppet theater. Paper figures on rods act three scenes in turn: a deer in a forest, a ship on sliding waves, and a town where a cat walks the roofs and lanterns float up.'],
    ['prize-stacks', 'Midnight library', 'z', 'theme', 'any', 'A living theme: shelves of old books down both sides, lamps swaying, a moonbeam full of dust. Books fly through like birds, a globe turns on the desk, and now and then a book opens and a spiral of glowing letters climbs out.'],
    ['owl', 'Star owl', 'z', 'streak', 'any', 'An owl drawn in stars, one more every few days. At 30 days the figure is whole and its eyes burn gold and blink; at 100 its wings beat and a star falls past.'],
    /* Cipher (cipher-pop.js): every look hides something real to decode */
    ['decoder', 'Decoder', 'c', 'fx', 'cipher', 'A split-flap board drops in above your answer and its tiles clatter through letters while scrambled letters stream up into it; one by one they stop on a message, a different one each time.'],
    ['prize-crossword', 'Crossword', 'c', 'theme', 'cipher', 'A living theme: newsprint, with a crossword down each margin that a pencil fills in (now and then rubbing a letter out). The circled squares spell the SAT word of the day, the clue along the foot says what it means, and they light red when it is in.'],
    ['sleuth', 'Detective', 'c', 'skin', 'cipher', 'A trench coat with a belt and a scarf in your color, a checked deerstalker cap and a magnifying glass that sweeps, in a spotlight, with footprints appearing and question marks drifting up. Sharp-eyed and curious.'],
    ['cryptex', 'Cryptex', 'r', 'aura', 'cipher', 'A stage aura: a brass cryptex on a desk by candlelight. Its five rings click into line to spell the SAT word of the day (a new one each day), then the cap slides off and a scroll unrolls with what it means.'],
    ['signals', 'Signals', 'r', 'paper', 'cipher', 'Moving: ships far out at sea talk to each other in real Morse code, one asking and another answering, with lamps on a dark page and flashing mirrors on a light one. The code is written over the water and each letter appears under it, so you can read along.'],
    ['padlock', 'Padlock', 'r', 'streak', 'cipher', 'A padlock whose dial shows your streak, with a notch filed on top for each week. At 30 days it springs open and its key hangs beside it; at 100 it is gold.'],
    ['uvink', 'Invisible ink', 'e', 'fx', 'cipher', 'The page goes dark and a black-light torch sweeps across your answer. Hidden notes glow where the beam passes (an arrow and THIS ONE, a check, stars, a smile, a different set each time), then the torch opens wide and lights them all.'],
    ['prize-darkroom', 'Darkroom', 'e', 'theme', 'cipher', 'A living theme: a darkroom under a red safelight. Prints hang on a line, dripping into a tray, and slowly develop into pictures: a key, a map, a cat, a moon, an open door, an owl. Now and then a print shows something it should not.'],
    ['spy', 'Spy', 'e', 'skin', 'cipher', 'A black suit with a tie in your color, dark glasses, an earpiece, a briefcase and a glowing watch, with red lasers behind, a sweeping searchlight, radar rings and a tiny drone. Cool, quiet and always on a mission.'],
    ['vault', 'Vault', 'l', 'aura', 'cipher', 'A stage aura: a vault door in a marble hall behind red lasers. The dial turns to today’s date while an x-ray window shows the wheels inside lining up; the lasers go out, twelve bolts slide back and the door swings open. What is inside changes, and once in a while it is a sleeping cat.'],
    ['map', 'Treasure map', 'l', 'paper', 'cipher', 'Moving: an old map drifts under the page, with islands named for study (the Isle of Commas, Mount Algebra, the Bay of Syntax), a trail that draws itself to an X and a chest that opens. A magnifying glass wanders over it, and through the lens you can read the secret ink under the map.'],
    ['cipherwheel', 'Cipher wheel', 'l', 'streak', 'cipher', 'Two rings of letters, the inner one turned a letter further each day, and a window that shows one letter of a secret word, a new one each week. At 30 days the wheel is gold, and once all eleven are found the word is written under it.'],
    ['enigma', 'Enigma', 'm', 'fx', 'cipher', 'A cipher machine builds itself round your answer: rotors above, letter lamps below. Scrambled letters fly into the rotors, a lamp lights for each letter it comes out as and a tape prints the message; then the rotors spin and stop on Y, E and S.'],
    ['prize-puzzlebox', 'Puzzle box', 'm', 'theme', 'cipher', 'A living theme: the page sits in a puzzle box of inlaid wood with brass gears turning behind its walls. Once a minute, by your own clock, it solves itself: the panels slide one after another, channels of light run, and a secret drawer slides out holding a glowing key.'],
    ['keymaster', 'Keymaster', 'm', 'skin', 'cipher', 'A midnight robe and hood edged in gold, glowing letters, a padlock pendant and a giant key for a staff, with two rings of letters turning behind your head (the inner one three letters on, like a real cipher) and keys of light circling. Mysterious and kind.'],
    /* Pop-Up (cipher-pop.js): scenes in cut paper that fold up off the page */
    ['pgarden', 'Paper garden', 'c', 'aura', 'popup', 'A stage aura: a pop-up page. Paper hills, a cottage and flowers fold up, a tab pulls the sun up its arc and a bee bounces on its spring; then the cottage door opens and someone comes out to wave, a different visitor each time.'],
    ['boats', 'Paper boats', 'c', 'paper', 'popup', 'Moving: folded paper boats ride four rows of cut-paper waves along the foot of the page, with a paper sun or moon in the corner and gulls bobbing on wires. Now and then a whale’s tail flips up between the waves.'],
    ['folds', 'Paper folds', 'c', 'streak', 'popup', 'A square of paper folded into something new each week: a boat, a paper plane, a fox. At 30 days it is a crane that flaps its wings, and at 100 the crane is gold.'],
    ['popout', 'Pop-out', 'r', 'fx', 'popup', 'Paper folds up off the page around your answer: a flower at each end opens, paper stars bounce on springs, a ribbon banner unfolds with a cheer and folded confetti bursts out.'],
    ['prize-cutpaper', 'Cut paper', 'r', 'theme', 'popup', 'A living theme in construction paper: vines up both sides, three rows of hills with flowers that fold up in a wave, clouds in their slots and a ladybug. The sun rides a paper tab that keeps your own time, and after dark a paper moon takes its place.'],
    ['origami', 'Origami', 'r', 'skin', 'popup', 'An outfit folded from paper in your color, every facet its own shade, a folded crane on your headband that flaps, a paper fan behind, two more cranes circling and paper confetti rising. Neat, nimble and full of surprises.'],
    ['jungle', 'Jungle', 'e', 'aura', 'popup', 'A stage aura: a pop-up jungle at sundown, with a waterfall, a swinging monkey and a toucan. Two great leaves slide apart on their tabs to show a lost temple whose glyphs light up, and then a tiger folds up out of the ferns and roars. Now and then the idol inside wakes.'],
    ['forest', 'Paper forest', 'e', 'paper', 'popup', 'Moving: five rows of cut-paper trees along the foot of the page with mist between them, in your own time of day: gold morning, green afternoon, violet dusk or blue night. Different animals live between the rows at different hours.'],
    ['moonwheel', 'Moon wheel', 'e', 'streak', 'popup', 'A paper wheel of the moon’s phases behind a card with a window. It turns a notch a day, from a new moon to a full one and back each week, with a dot for each week. Gold at 30 days, and at 100 a sun sits at its hub.'],
    ['pulltab', 'Pull the tab', 'l', 'fx', 'popup', 'A paper tab marked PULL slides out from under your answer and pulls itself. Two paper doors above the answer swing open on a pop-up scene that folds up in layers, and what is behind them changes: fireworks, balloons or a whale.'],
    ['prize-bigtop', 'Big top', 'l', 'theme', 'popup', 'A living theme: inside a paper circus tent at night, with a striped canopy, chasing bulbs, sweeping spotlights, an acrobat on the tightrope and a seal with a ball. Once in a while the cannon fires someone clean across the tent.'],
    ['tale', 'Storyteller', 'l', 'skin', 'popup', 'A tunic in your color, a cape and a tall hat folded from book pages with a quill, and a pop-up book in your hands where a little castle keeps folding up, on a paper stage with stars on strings and letters floating up. Warm, wise and full of stories.'],
    ['storybook', 'Once upon a time', 'm', 'aura', 'popup', 'A stage aura: an open pop-up book whose pages turn by themselves. At each turn a new scene folds up while a line of the story is written above: a ship at sea, snowy mountains, a forest at night, a city of lights. On the last page paper birds fly out, and it is to be continued.'],
    ['tunnel', 'Tunnel book', 'm', 'paper', 'popup', 'Moving: the page becomes a tunnel book of seven cut-paper sheets, each opening smaller than the last. Your view drifts so the tunnel has depth, a paper bird flies out toward you, and the light at the far end is something different each time.'],
    ['peacock', 'Paper peacock', 'm', 'streak', 'popup', 'A paper peacock that opens a fan of pleated feathers, one more every few days. At 30 days the fan is full and the eyes on its feathers shimmer; at 100 they run through every color and its crest shines.'],
    /* six more Radiant looks (cipher-pop.js), one of each kind, each with its own arrival */
    ['shipbottle', 'Ship in a bottle', 'z', 'aura', 'any', 'A stage aura: a tall ship sails a whole small sea inside a glass bottle: an easy afternoon, then a storm breaks inside the glass, it clears to a rainbow, and night comes with the lantern lit. A tiny message in a bottle bobs on the waves inside.'],
    ['hidden', 'Hidden world', 'z', 'fx', 'any', 'Sparks gather into a key of light, a keyhole glows above your answer, and the key turns: the keyhole opens on a whole cut-paper world folding up round you under the sky you have now (sunrise, day, sunset or night). Paper birds fly out past you.'],
    ['maze', 'Labyrinth', 'z', 'paper', 'any', 'Moving: a round maze of six rings, each turning its own way, behind the page. A spark works its way in, waiting for each gap to come round, and when it reaches the middle the maze blooms and something different appears there each time.'],
    ['prize-astro', 'Astronomical clock', 'z', 'theme', 'any', 'A living theme: a great astronomical clock that keeps your real time, with the sun on the hour, tonight’s real moon phase and a star on the minutes, over a sky disc of day and night. Every five minutes on your clock its doors open, figures parade past, the bell rings and the rooster crows.'],
    ['dolls', 'Nesting dolls', 'z', 'streak', 'any', 'A painted doll steps out of the last one each week, smaller each time, up to five in a row. At 30 days the smallest holds a gold egg; at 100 they have all gone back inside one gold doll.'],
    ['moonrise', 'Moonrise', 'z', 'skin', 'any', 'Silver armor with a crescent on the chest, a crescent circlet, a cloak of night and a white rabbit at your feet. The moon over your shoulder shows tonight’s real phase, and a ring of every phase turns round you. Calm, bright and full of wonder.']
  ].map(function (r) { return { id: r[3] + ':' + r[0], key: r[0], name: r[1], tier: r[2], kind: r[3], series: r[4], what: r[5] }; });
  var PZ_BY = {}, PZ_SER = {};
  PZ_ITEMS.forEach(function (it) { PZ_BY[it.id] = it; });
  PZ_SERIES.forEach(function (s) { PZ_SER[s[0]] = { id: s[0], name: s[1], what: s[2] }; });
  /* the Seasons crate follows the school year: [id, name, months (0 = January), the prizes in season]. In season, a prize is
     twice as likely in that crate as the series' other prizes; out of season it can still turn up, and it comes back next year. */
  var PZ_SEASONS = [
    ['fall', 'Fall', [8, 9, 10], ['paper:leaves', 'aura:ember']],
    ['winter', 'Winter', [11, 0, 1], ['paper:snow', 'paper:sky', 'theme:prize-aurora']],
    ['spring', 'Spring', [2, 3, 4], ['paper:blossoms', 'theme:prize-sunrise']],
    ['summer', 'Summer', [5, 6, 7], ['theme:prize-ocean', 'theme:prize-inferno']]
  ];
  function pzSeason() { var m = new Date().getMonth(); return PZ_SEASONS.filter(function (s) { return s[2].indexOf(m) >= 0; })[0]; }
  function pzInSeason(id) { return pzSeason()[3].indexOf(id) >= 0; }
  /* eight stickers to a series page; finishing a page earns a free crate from that series */
  var PZ_STK = {
    pencil: ['Sharp Pencil', 'Eraser Pro', 'Highlighter Hero', 'Margin Notes', 'Sticky Note', 'Paper Clip', 'Coffee Break', 'Early Bird'],
    varsity: ['Comma Commander', 'Slope Hero', 'Word Nerd', 'Sentence Surgeon', 'Evidence Hunter', 'Main Idea Machine', 'Transition Tamer', 'Honor Roll'],
    night: ['Star Student', 'Moonshot', 'Desk Lamp', 'Deep Focus', 'Quiet Hours', 'North Star', 'Night Sky', 'Constellation Mapper'],
    arcade: ['Back-Solver', 'Plug-In Pro', 'Graphing Wizard', 'Combo Streak', 'Level Up', 'High Score', 'Speed Run', 'Extra Life'],
    seasons: ['First Frost', 'Snow Day Study', 'Spring Bloom', 'Summer Reader', 'Fresh Start', 'Falling Leaves', 'Heatwave Hustle', 'Rainy Day Reps'],
    deep: ['Deep Diver', 'Pearl of Wisdom', 'Calm Waters', 'Sea Legs', 'Bubble Brain', 'Tide Turner', 'Lighthouse Keeper', 'Kraken Tamer'],
    myth: ['Spell Checker', 'Rune Reader', 'Potion of Focus', 'Crystal Clear', 'Dragon Scholar', 'Phoenix Rising', 'Wizard of Words', 'Quest Complete'],
    tech: ['Press Start', 'Save Point', 'Bit by Bit', 'Debug Mode', 'Pixel Perfect', 'Power Up', 'Boot Sequence', 'Time Traveler'],
    haunt: ['Night Owl', 'Ghost Writer', 'Bat Signal', 'Fearless', 'Midnight Oil', 'Boo-k Worm', 'No Tricks', 'Monster Score'],
    unknown: ['First Contact', 'Unknown Variable', 'Signal Found', 'Deep Thinker', 'Out of This World', 'Portal Hopper', 'Mind Reader', 'The Watcher Blinked'],
    dream: ['Daydreamer', 'Paper Crane', 'Color Theory', 'Lantern Lighter', 'Fox Wisdom', 'Whale Song', 'Butterfly Effect', 'Sweet Dreams'],
    zenith: ['Rising Star', 'First Light', 'Orbit Keeper', 'Deep Roots', 'Perfect Pitch', 'Wings of Focus', 'Clear Skies', 'High Noon'],
    paradox: ['Both Sides', 'Clock Watcher', 'Fourth Dimension', 'Bug Fixer', 'Standing Stone', 'Black and White', 'Extra Time', 'Unsolved'],
    gems: ['Rock Solid', 'Diamond in the Rough', 'Polished Essay', 'Gem of a Proof', 'Facet Finder', 'Dig Deeper', 'Under Pressure', 'Bedrock Basics'],
    forecast: ['Brainstorm', 'Rain or Shine', 'Silver Lining', 'Weather the Storm', 'Cloud Nine', 'Hot Streak', 'Sunny Outlook', 'Eye of the Storm'],
    wilds: ['Trailblazer', 'Campfire Scholar', 'Storm Chaser', 'Head in the Clouds', 'Still Waters', 'Lava Brain', 'Ice Cold Focus', 'Desert Bloom'],
    curio: ['Lucky Seven', 'Chain Reaction', 'Odd One Out', 'Treasure Hunter', 'Curious Mind', 'Plot Twist', 'Open Sesame', 'Tally Ho'],
    dress: ['Suit Up', 'Quick Change', 'Best Dressed', 'Style Points', 'Mirror Check', 'New Look', 'Costume Party', 'Dress Rehearsal'],
    bit: ['Press Any Key', 'One More Try', 'High Roller', 'Boss Beater', 'Secret Level', 'Full Hearts', 'No Continues', 'Final Form'],
    court: ['Knight Move', 'Queen’s Gambit', 'Checkmate', 'Bell Ringer', 'Round Table', 'Crown Jewel', 'Royal Decree', 'Worthy'],
    cipher: ['Code Breaker', 'Secret Agent', 'Lock Picker', 'Word of the Day', 'Hidden Message', 'Master Key', 'Case Closed', 'Read Between the Lines'],
    popup: ['Fold Here', 'Tab Puller', 'Page Turner', 'Plot Twist Ahead', 'Lift the Flap', 'Paper Trail', 'Pop Quiz', 'The End?'],
    test: ['Test Day Ready', 'Pencils Down', 'Calm Breath', 'Full Tank', 'Perfect Score', 'Poem Decoder', 'Trap Spotter', 'Unit Circle Survivor']
  };
  var PZ_TITLES = [
    ['week', 'Week Strong', 'Practice 7 days in a row.', function (c) { return c.best >= 7; }],
    ['planner', 'Plan Keeper', 'Finish every task on your study plan on 7 days.', function (c) { return c.plans >= 7; }],
    ['traps', 'Trap Spotter', 'Say why you missed 50 questions.', function (c) { return c.reasons >= 50; }],
    ['module', 'Full Module', 'Finish a timed module in both subjects.', function (c) { return c.mods; }],
    ['collector', 'Collector', 'Win 25 different prizes.', function (c) { return c.owned >= 25; }],
    ['mythic', 'Mythic Finder', 'Win a Mythic or Radiant prize.', function (c) { return c.mythic; }],
    ['century', 'Century', 'Practice 100 days in a row.', function (c) { return c.best >= 100; }]
  ];

  /* signed in to an account in the clubhouse (club.js), the record is the server's, and only eq is this device's */
  function pz() {
    if (clubShow()) { return clubPz(); }
    var p = store.s.pz;
    if (!isObj(p)) { p = store.s.pz = {}; }
    ['e', 'x', 'o', 'g', 'fz', 'st', 'eq'].forEach(function (k) { if (!isObj(p[k])) { p[k] = {}; } });
    return p;
  }
  function pzSum(o) { var n = 0; Object.keys(o).forEach(function (k) { if (typeof o[k] === 'number' && o[k] > 0) { n += o[k]; } }); return n; }
  function pzBalance() { var P = pz(); return pzSum(P.e) - pzSum(P.x); }
  function pzNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function pzId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pzOpened() { var P = pz(); return Object.keys(P.o).map(function (id) { var r = P.o[id]; return Array.isArray(r) && PZ_BY[r[2]] ? { id: id, t: r[0] || 0, series: r[1], item: PZ_BY[r[2]], dupe: !!r[4], sticker: r[5] || '' } : null; }).filter(Boolean).sort(function (a, b) { return a.t - b.t; }); }
  function pzOwned() { var own = {}; pzOpened().forEach(function (o) { own[o.item.id] = 1; }); return own; }
  function pzOwns(id) { return !!pzOwned()[id]; }

  /* two devices' records joined: the larger value for coins and stickers, everything opened or granted from both */
  function pzMerge(a, b) {
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    var out = {};
    ['e', 'x', 'st'].forEach(function (k) {
      var m = {}, A = isObj(a[k]) ? a[k] : {}, B = isObj(b[k]) ? b[k] : {};
      Object.keys(A).concat(Object.keys(B)).forEach(function (id) { var v = Math.max(typeof A[id] === 'number' ? A[id] : 0, typeof B[id] === 'number' ? B[id] : 0); if (v > 0) { m[id] = v; } });
      out[k] = m;
    });
    ['o', 'g', 'fz'].forEach(function (k) { out[k] = bkUnion(isObj(b[k]) ? b[k] : {}, isObj(a[k]) ? a[k] : {}); });
    out.eq = isObj(a.eq) ? a.eq : isObj(b.eq) ? b.eq : {};
    return out;
  }

  /* ---------- odds: each series' own prizes are 3 times as likely in its crate; luck lifts Legendary, Mythic and Radiant ---------- */
  function pzLuck() { var n = 0; try { n = habitStreak().n; } catch (e) { n = 0; } return n >= 30 ? 2 : n >= 7 ? 1.5 : 1; }
  /* the tiers from minTier up to maxTier (the top one when left out), as percentages that add up to 100 */
  function pzOdds(minTier, luck, maxTier) {
    var L = luck || 1, lo = PZ_TIERS.indexOf(minTier || 'c'), hi = maxTier ? PZ_TIERS.indexOf(maxTier) : PZ_TIERS.length - 1, o = {}, tot = 0;
    PZ_TIERS.forEach(function (t, i) { var v = i < lo || i > hi ? 0 : PZ_ODDS[t] * (t === 'l' || t === 'm' || t === 'z' ? L : 1); o[t] = v; tot += v; });
    PZ_TIERS.forEach(function (t) { o[t] = tot ? o[t] / tot * 100 : 0; });
    return o;
  }
  function pzWeight(it, series) { return it.series !== series ? 1 : series === 'seasons' && pzInSeason(it.id) ? 6 : 3; }
  function pzChance(it, series, minTier, luck) {
    var o = pzOdds(minTier, luck), pool = PZ_ITEMS.filter(function (x) { return x.tier === it.tier; }), w = 0;
    pool.forEach(function (x) { w += pzWeight(x, series); });
    return o[it.tier] / 100 * pzWeight(it, series) / w;
  }
  /* "1 in N" for a prize, in its own series' crate at plain luck */
  function pzOneIn(it) { var p = pzChance(it, it.series, it.series === 'test' ? 'e' : 'c', 1); return p > 0 ? Math.max(1, Math.round(1 / p)) : 0; }
  function pzDraw(series, minTier, luck, maxTier) {
    var o = pzOdds(minTier, luck, maxTier), r = Math.random() * 100, acc = 0, tier = '';
    for (var i = 0; i < PZ_TIERS.length; i++) { acc += o[PZ_TIERS[i]]; if (r < acc && o[PZ_TIERS[i]] > 0) { tier = PZ_TIERS[i]; break; } }
    /* a draw that rounding leaves past the last sum takes the top tier allowed */
    if (!tier) { tier = PZ_TIERS.filter(function (t) { return o[t] > 0; }).pop(); }
    var pool = PZ_ITEMS.filter(function (x) { return x.tier === tier; }), w = 0;
    pool.forEach(function (x) { w += pzWeight(x, series); });
    var q = Math.random() * w;
    for (var j = 0; j < pool.length; j++) { q -= pzWeight(pool[j], series); if (q < 0) { return pool[j]; } }
    return pool[pool.length - 1];
  }
  /* an Epic or better at least once in every 10 crates; the promise itself never brings a Radiant, so a Radiant is always pure luck */
  function pzPityLeft() {
    var list = pzOpened(), n = 0;
    for (var i = list.length - 1; i >= 0; i--) { if (PZ_TIERS.indexOf(list[i].item.tier) >= 2) { break; } n += 1; }
    return Math.max(1, PZ_PITY - n);
  }

  /* ---------- the Test Day crate: the last week before the test date in the plan ---------- */
  function pzTestDays() { try { var P = planGet(); if (!P || !P.date) { return -1; } var d = parseDay(P.date); return isNaN(d) ? -1 : Math.round((dayStart(d) - dayStart(Date.now())) / 864e5); } catch (e) { return -1; } }
  function pzTestOpen() { var n = pzTestDays(); return n >= 0 && n <= 7; }

  /* ---------- opening ---------- */
  /* a free crate from a series no longer in the catalog stays in the saved record, unlisted, so it cannot break the Crates page */
  function pzGrants() { var P = pz(); return Object.keys(P.g).filter(function (k) { return Array.isArray(P.g[k]) && !P.o['g.' + k] && (!P.g[k][1] || !!PZ_SER[P.g[k][1]]); }).map(function (k) { var g = P.g[k]; return { key: k, t: g[0] || 0, series: g[1] || '', min: g[2] || 'c', why: g[3] || '' }; }).sort(function (a, b) { return a.t - b.t; }); }
  function pzCanBuy(series) { return !!PZ_SER[series] && pzBalance() >= PZ_PRICE && (series !== 'test' || pzTestOpen()); }
  function pzOpen(series, grantKey) {
    if (clubKeeps()) { return null; }
    var P = pz(), id, minTier = series === 'test' ? 'e' : 'c';
    if (grantKey) {
      var g = P.g[grantKey];
      if (!Array.isArray(g) || P.o['g.' + grantKey]) { return null; }
      series = g[1] || series; minTier = PZ_TIERS[Math.max(PZ_TIERS.indexOf(minTier), PZ_TIERS.indexOf(g[2] || 'c'))]; id = 'g.' + grantKey;
    } else {
      if (!pzCanBuy(series)) { return null; }
      id = pzId(); P.x['crate.' + id] = PZ_PRICE;
    }
    if (!PZ_SER[series]) { return null; }
    var maxTier = '';
    if (pzPityLeft() <= 1 && PZ_TIERS.indexOf(minTier) < 2) { minTier = 'e'; maxTier = 'm'; }
    var it = pzDraw(series, minTier, pzLuck(), maxTier), dupe = pzOwns(it.id) ? 1 : 0, page = PZ_STK[series] || [], stk = page.length ? series + '-' + Math.floor(Math.random() * page.length) : '';
    P.o[id] = [Date.now(), series, it.id, it.tier, dupe, stk];
    if (dupe) { P.e['dupe.' + id] = PZ_DUPE; }
    if (stk) { P.st[stk] = 1; pzPageCheck(series); }
    save(); pzChip();
    return { id: id, item: it, dupe: dupe, sticker: stk, series: series };
  }
  function pzStickerName(id) { var m = /^([a-z]+)-(\d+)$/.exec(id || ''); return m && PZ_STK[m[1]] ? PZ_STK[m[1]][+m[2]] : ''; }
  function pzPage(series) { var P = pz(); return (PZ_STK[series] || []).map(function (n, i) { return { id: series + '-' + i, name: n, have: !!P.st[series + '-' + i] }; }); }
  function pzPageCheck(series) { var P = pz(), page = pzPage(series); if (page.length && page.every(function (s) { return s.have; }) && !P.g['page.' + series]) { P.g['page.' + series] = [Date.now(), series, 'c', 'You finished the ' + PZ_SER[series].name + ' sticker page.']; } }

  /* ---------- streak freezes: bought ahead, used on their own when a missed day would end a streak ---------- */
  function pzFreezes() { var P = pz(), bought = Object.keys(P.x).filter(function (k) { return k.indexOf('freeze.') === 0; }).length; return Math.max(0, bought - Object.keys(P.fz).length); }
  function pzBuyFreeze() { var P = pz(); if (clubKeeps() || pzBalance() < PZ_FREEZE || pzFreezes() >= PZ_FREEZE_MAX) { return false; } P.x['freeze.' + pzId()] = PZ_FREEZE; save(); pzChip(); return true; }
  function pzFrozen(t) { var P = clubShow() ? CLUB.P : store.s.pz; return isObj(P) && isObj(P.fz) && !!P.fz[dayKey(t)]; }
  function pzFrozenKeys() { var P = clubShow() ? CLUB.P : store.s.pz; return isObj(P) && isObj(P.fz) ? Object.keys(P.fz) : []; }
  function pzApplyFreeze() {
    var did = function (t) { var c = dayCount(t); return c[0] + c[1] > 0 || pzFrozen(t); }, today = dayStart(Date.now()), t = dayBefore(today), gap = [];
    if (did(t)) { return false; }
    while (!did(t) && gap.length <= PZ_FREEZE_MAX) { gap.push(t); t = dayBefore(t); }
    if (gap.length > pzFreezes() || !did(t)) { return false; }
    gap.forEach(function (d) { pz().fz[dayKey(d)] = 1; });
    return true;
  }

  /* ---------- free crates for long streaks and the test-day week (the 100-day crate is Mythic or better, about 1 in 6 Radiant) ---------- */
  function pzMilestones() {
    var P = pz(), changed = false, s = habitStreak();
    if (!P.g.welcome && s.days > 0) { P.g.welcome = [Date.now(), 'pencil', 'c', 'Welcome: your first crate is free.']; changed = true; }
    if (!s.n) { return changed; }
    var end = s.today ? dayStart(Date.now()) : dayBefore(dayStart(Date.now())), start = end;
    for (var i = 1; i < s.n; i++) { start = dayBefore(start); }
    [[7, 'r', 'A 7-day streak.'], [30, 'e', 'A 30-day streak.'], [100, 'm', 'A 100-day streak.']].forEach(function (m) {
      var k = 'ms' + m[0] + '.' + dayKey(start);
      if (s.n >= m[0] && !P.g[k]) { P.g[k] = [Date.now(), '', m[1], m[2]]; changed = true; }
    });
    if (pzTestOpen()) { var pl = planGet(), tk = 'test.' + pl.date; if (!P.g[tk]) { P.g[tk] = [Date.now(), 'test', 'e', 'Your test is this week.']; changed = true; } }
    return changed;
  }

  /* ---------- coins: counted after every save from what the student did today ---------- */
  function pzReasonsSince(t0) {
    var n = 0;
    Object.keys(isObj(store.x) ? store.x : {}).forEach(function (id) { var r = store.x[id]; if (Array.isArray(r) && r[0] && (r[1] || 0) >= t0) { n += 1; } });
    ['t', 'r', 'b'].forEach(function (b) { Object.keys(isObj(store[b]) ? store[b] : {}).forEach(function (id) { var x = store[b][id]; if (isObj(x) && x.cause && (x.at || 0) >= t0) { n += 1; } }); });
    return n;
  }
  function pzToday() {
    var P = pz(), k = dayKey(Date.now());
    return { qm: !!P.e['qotd.m.' + k], qr: !!P.e['qotd.rw.' + k], plan: !!P.e['plan.' + k], rev: Math.round((P.e['rev.' + k] || 0) / PZ_EARN.rev) };
  }
  var pzBusy = false, pzTimer = 0;
  function pzSoon() { if (pzBusy) { return; } clearTimeout(pzTimer); pzTimer = setTimeout(pzTick, 60); }
  function pzTick() {
    if (pzBusy) { return; }
    /* in the clubhouse the server counts the coins; until its record arrives, nothing is counted here */
    if (clubKeeps()) { clubTick(); pzChip(); return; }
    pzBusy = true;
    try {
      var P = pz(), today = dayKey(Date.now()), changed = false, got = 0, why = '', g0 = Object.keys(P.g).length;
      var earn = function (k, v) { var was = P.e[k] || 0; if (!(was >= v)) { P.e[k] = v; changed = true; got += v - was; why = PZ_WHY[k.split('.')[0]] || why; } };
      try { if (qotdDone('m', qotd('m'))) { earn('qotd.m.' + today, PZ_EARN.qotd); } } catch (e) { /* no question of the day */ }
      try { if (qotdDone('rw', qotd('rw'))) { earn('qotd.rw.' + today, PZ_EARN.qotd); } } catch (e) { /* no question of the day */ }
      try { var pl = planGet(); if (pl) { var pr = planProgress(pl); if (pr.of && pr.done >= pr.of) { earn('plan.' + today, PZ_EARN.plan); } } } catch (e) { /* no plan */ }
      var rv = Math.min(PZ_EARN.revMax, pzReasonsSince(dayStart(Date.now())));
      if (rv) { earn('rev.' + today, rv * PZ_EARN.rev); }
      if (pzApplyFreeze()) { changed = true; }
      if (pzMilestones()) { changed = true; }
      if (changed) { save(); }
      var fresh = Object.keys(P.g).length > g0;
      if (got > 0) { pzToast('+' + got + ' coins', why + (fresh ? ' · and a free crate' : '')); } else if (fresh) { pzToast('A free crate', 'is waiting for you'); }
      pzChip();
    } finally { pzBusy = false; }
  }

  /* ---------- titles, earned on purpose and never in crates ---------- */
  function pzTitleCounts() {
    var s = habitStreak(), P = pz(), own = pzOwned(), mythic = false;
    Object.keys(own).forEach(function (id) { if (PZ_BY[id].tier === 'm' || PZ_BY[id].tier === 'z') { mythic = true; } });
    var rw = 0; ['t', 'r', 'b'].forEach(function (b) { Object.keys(isObj(store[b]) ? store[b] : {}).forEach(function (id) { var x = store[b][id]; if (isObj(x) && x.cause) { rw += 1; } }); });
    var mx = Object.keys(isObj(store.x) ? store.x : {}).filter(function (id) { return Array.isArray(store.x[id]) && store.x[id][0]; }).length;
    return {
      best: s.best, plans: Object.keys(P.e).filter(function (k) { return k.indexOf('plan.') === 0; }).length, reasons: rw + mx,
      mods: Array.isArray(store.s.modules) && store.s.modules.length > 0 && Array.isArray(store.s.rwmodules) && store.s.rwmodules.length > 0,
      owned: Object.keys(own).length, mythic: mythic, gift: !!P.o['gift.all']
    };
  }
  function pzTitles() { var c = pzTitleCounts(); return PZ_TITLES.map(function (t) { return { id: t[0], name: t[1], how: t[2], have: !!t[3](c) || c.gift }; }); }
  function pzShownTitle() { var id = pz().eq.title, t = pzTitles().filter(function (x) { return x.id === id && x.have; })[0]; return t ? t.name : ''; }

  /* ---------- the owner's link (#gift-<code>, crates.js): every prize, sticker and title, and coins to open crates for fun ----------
     Only the SHA-256 of the code is in the page; the code itself is kept by the site's owner. What it gives is saved like a
     crate's prizes (records under gift.*, joined by pzMerge), so it reaches every device signed in to the same account. */
  var PZ_GIFT = 'b1c461100aa6812c8cae2b37a2e3da01083e6f2a862e8b022fd1ee53890b6e3a', PZ_GIFT_COINS = 10000;
  function pzGiftAll() {
    if (clubKeeps()) { return; }
    var P = pz(), t = Date.now();
    /* lowest tier first, so the last record is a Radiant and the promise of an Epic starts again at 10 */
    PZ_ITEMS.slice().sort(function (a, b) { return PZ_TIERS.indexOf(a.tier) - PZ_TIERS.indexOf(b.tier); }).forEach(function (it, i) {
      var k = 'gift.' + it.id.replace(':', '.');
      if (!P.o[k]) { P.o[k] = [t + i, it.series, it.id, it.tier, 0, '']; }
    });
    Object.keys(PZ_STK).forEach(function (s) { PZ_STK[s].forEach(function (x, i) { P.st[s + '-' + i] = Math.max(P.st[s + '-' + i] || 0, 1); }); pzPageCheck(s); });
    if (!P.o['gift.all']) { P.o['gift.all'] = [t, '', '', '', 0, '']; }
    P.e['gift.coins'] = Math.max(P.e['gift.coins'] || 0, PZ_GIFT_COINS);
    save(); pzChip();
  }

  /* ---------- wearing prizes ---------- */
  function pzEquip(slot, id) {
    var P = pz();
    if (id && slot !== 'title' && !pzOwns(id)) { return; }
    /* a skin is the character's, so it goes on in the room's record (room.js), which the study buddy wears too */
    if (slot === 'skin') { roomWear(id || ''); return; }
    if (slot === 'theme') { setTheme(id ? PZ_BY[id].key : 'auto'); }
    else { if (id) { P.eq[slot] = id; } else { delete P.eq[slot]; } save(); }
    fxApply();
  }
  function pzWorn(slot) {
    if (slot === 'theme') { var t = getTheme(), it = PZ_BY['theme:' + t]; return it ? it.id : ''; }
    if (slot === 'skin') { return roomGet().av[2]; }
    var id = pz().eq[slot]; return id && pzOwns(id) ? id : '';
  }
  /* owned prize themes, for the Appearance menu (home.js) */
  function pzThemeRows() { var own = pzOwned(); return PZ_ITEMS.filter(function (it) { return it.kind === 'theme' && own[it.id]; }).map(function (it) { var p = fxThemeSwatch(it.key); return [it.key, it.name, PZ_TIER[it.tier] + ' prize', p]; }); }
  /* the right answer was just shown: play the effect the student has on, and the study buddy cheers (pal.js) */
  function pzRight(el) { if (!el) { return; } var id = pzWorn('fx'); if (id) { fxRight(PZ_BY[id].key, el); } palSaw(true); }
  /* Home's streak number, on its aura plate, with the streak style and the title on show */
  function pzStreakNum(html, s) {
    var aura = pzWorn('aura'), st = pzWorn('streak'), title = pzShownTitle(), icon = st ? fxStreakIcon(PZ_BY[st].key, s.n) : '';
    if (icon) { html = html.replace('<p class="hstreak-n">', '<p class="hstreak-n pz-styled">' + icon); }
    if (title) { html += '<p class="pz-title">' + esc(title) + '</p>'; }
    var n = Math.max(0, pzBalance()), free = pzGrants().length;
    html += '<a class="pz-homecoins" href="#crates">' + PZ_COIN + '<span><b>' + pzNum(n) + '</b> ' + (n === 1 ? 'coin' : 'coins') + (free ? ' · ' + plural(free, 'free crate') : '') + ' · Open crates</span></a>';
    return aura ? '<div class="pz-plate' + fxStageCls(PZ_BY[aura].key) + '"><canvas class="pz-aura" data-pz-aura="' + PZ_BY[aura].key + '" aria-hidden="true"></canvas>' + html + '</div>' : '<div class="pz-snum">' + html + '</div>';
  }

  /* ---------- the coin count in the top bar ---------- */
  var PZ_FLAME = '<svg class="pz-flame" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FB923C" d="M12 2c2.5 3.5 6.5 6 6.5 11a6.5 6.5 0 0 1-13 0c0-2.6 1.4-4.7 3-6.4.1 2 1 3.4 2.4 3.9C10.6 7.6 10.6 4.6 12 2z"/></svg>';
  var PZ_COIN = '<svg class="pz-coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7" class="pz-coin-in"/><path d="M8.6 12.3l2.3 2.3 4.6-4.9" class="pz-coin-ck"/></svg>';
  /* beside the Text size control, and only where it fits on the same line: a top bar that wraps to a second line would
     push the page down and move the buttons under the boxes they open. On a phone the coins show on Home instead. */
  function pzChip() {
    var tb = document.getElementById('theme-btn'), top = document.getElementById('top');
    if (!tb || !top) { return; }
    var wrap = tb.closest('.theme') || tb, a = document.getElementById('pz-chip'), n = Math.max(0, pzBalance());
    if (!wrap.parentNode) { return; }
    if (!a) { a = document.createElement('a'); a.id = 'pz-chip'; a.className = 'tool pz-chip'; a.href = '#crates'; wrap.parentNode.insertBefore(a, wrap); }
    a.innerHTML = PZ_COIN + '<span class="pz-n">' + pzNum(n) + '</span>';
    /* the streak sits beside the coins once there is one */
    var sk = document.getElementById('st-chip'), sn = 0;
    try { sn = habitStreak().n; } catch (e) { sn = 0; }
    if (!sk) { sk = document.createElement('a'); sk.id = 'st-chip'; sk.className = 'tool st-chip'; sk.href = '#home'; wrap.parentNode.insertBefore(sk, a); }
    sk.innerHTML = '<svg class="st-flame" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.6 3.2 4.6 5 4.6 9.6A4.6 4.6 0 0 1 12 17.2a4.6 4.6 0 0 1-4.6-4.6c0-1.7.8-2.9 1.7-3.8.3 1.2.9 1.9 1.7 2.2C10.400 8.200 11 5.200 12 3z"/></svg><span class="pz-n">' + sn + '</span>';
    sk.setAttribute('aria-label', sn ? 'You have practiced ' + plural(sn, 'day') + ' in a row. Open Today.' : 'No streak yet. Open Today.');
    sk.hidden = !sn;
    a.setAttribute('aria-label', plural(n, 'coin') + '. Open crates.');
    a.hidden = true; var h0 = top.offsetHeight; a.hidden = false;
    if (top.offsetHeight > h0 + 2) { a.hidden = true; }
  }
  /* whatever changes the width of the bar's buttons asks again: the window, the fonts arriving, the text size */
  var pzChipT = 0;
  window.addEventListener('resize', function () { clearTimeout(pzChipT); pzChipT = setTimeout(pzChip, 200); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { pzChip(); }); }
  if ('MutationObserver' in window) { new MutationObserver(function () { pzChip(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-size'] }); }

  /* a short note at the bottom when coins come in or a free crate arrives; never during a timed module. It never takes a
     tap, so a button under it still works while it shows. */
  var pzToastT = 0;
  /* icon: a picture to show instead of the coin (crews have their own) */
  function pzToast(head, why, ms, icon) {
    if (document.querySelector('.view:not([hidden]) .mmwrap')) { return; }
    var el = document.getElementById('pz-toast');
    if (!el) { el = document.createElement('div'); el.id = 'pz-toast'; el.className = 'pz-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = '<p class="pz-toast-in">' + (icon || PZ_COIN) + '<b>' + esc(head) + '</b>' + (why ? ' <span>' + esc(why) + '</span>' : '') + '</p>';
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(pzToastT); pzToastT = setTimeout(function () { el.classList.remove('show'); }, ms || 3500);
  }
  var PZ_WHY = { qotd: 'Question of the day', plan: 'Today’s plan is done', rev: 'For saying why you missed it' };
