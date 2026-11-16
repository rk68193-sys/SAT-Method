  /* =================== Prizes: coins, crates and the looks inside them =================== */
  /* Prizes only change how the site looks: no lesson or question is ever locked, and coins are never sold.
     store.s.pz keeps the record in a shape two devices can join without losing or doubling anything (pzMerge, from bkMerge):
       e  coins earned, one key per event: 'qotd.m.2026-11-15' 10, 'plan.2026-11-15' 20, 'rev.2026-11-15' 15, 'dupe.<crate>' 20
       x  coins spent, one key per purchase: 'crate.<crate>' 50, 'freeze.<id>' 30
       o  crates opened: <crate> -> [time, series, prize, tier, duplicate 0/1, sticker]
       g  free crates: <key> -> [time, series or '' for any, lowest tier, why]   ('welcome', 'ms7.<day>', 'ms30.<day>', 'ms100.<day>', 'page.<series>', 'test.<date>')
       fz days a streak freeze covered: '2026-11-14' 1
       st stickers found: <sticker> 1
       eq what this device has on: { fx, aura, paper, streak, title }   (the theme is the Appearance setting)
     Keys use only letters, digits, '.', '-' and '_', the names a backup file may hold (BK_KEY in data.js).
     e, x and st join by the larger value; o, g and fz by union; eq keeps this device's. The balance is e minus x, never stored. */
  var PZ_TIERS = ['c', 'r', 'e', 'l', 'm', 'z'];
  var PZ_TIER = { c: 'Common', r: 'Rare', e: 'Epic', l: 'Legendary', m: 'Mythic', z: 'Radiant' };
  /* Radiant's 0.1% comes out of Common's share, so every other tier keeps the odds it had before Radiant was added */
  var PZ_ODDS = { c: 59.9, r: 27, e: 10, l: 2.5, m: 0.5, z: 0.1 };
  var PZ_PRICE = 50, PZ_FREEZE = 30, PZ_FREEZE_MAX = 2, PZ_DUPE = 20, PZ_PITY = 10, PZ_HOME = 3;
  var PZ_EARN = { qotd: 10, plan: 20, rev: 5, revMax: 4 };
  var PZ_KIND = { theme: 'Theme', fx: 'Right-answer effect', aura: 'Aura', paper: 'Paper', streak: 'Streak style' };
  var PZ_SLOTS = [['theme', 'Themes'], ['fx', 'Right-answer effects'], ['aura', 'Auras'], ['paper', 'Paper'], ['streak', 'Streak styles']];
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
    ['tree', 'Learning tree', 'z', 'streak', 'any', 'A glowing seed that sprouts at 7 days, becomes a tree with a golden heart at 30, and at 100 days a great tree with lanterns in its branches.']
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

  function pz() {
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
  function pzBuyFreeze() { var P = pz(); if (pzBalance() < PZ_FREEZE || pzFreezes() >= PZ_FREEZE_MAX) { return false; } P.x['freeze.' + pzId()] = PZ_FREEZE; save(); pzChip(); return true; }
  function pzFrozen(t) { var P = store.s.pz; return isObj(P) && isObj(P.fz) && !!P.fz[dayKey(t)]; }
  function pzFrozenKeys() { var P = store.s.pz; return isObj(P) && isObj(P.fz) ? Object.keys(P.fz) : []; }
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
    if (slot === 'theme') { setTheme(id ? PZ_BY[id].key : 'auto'); }
    else { if (id) { P.eq[slot] = id; } else { delete P.eq[slot]; } save(); }
    fxApply();
  }
  function pzWorn(slot) { if (slot === 'theme') { var t = getTheme(), it = PZ_BY['theme:' + t]; return it ? it.id : ''; } var id = pz().eq[slot]; return id && pzOwns(id) ? id : ''; }
  /* owned prize themes, for the Appearance menu (home.js) */
  function pzThemeRows() { var own = pzOwned(); return PZ_ITEMS.filter(function (it) { return it.kind === 'theme' && own[it.id]; }).map(function (it) { var p = fxThemeSwatch(it.key); return [it.key, it.name, PZ_TIER[it.tier] + ' prize', p]; }); }
  /* the right answer was just shown: play the effect the student has on */
  function pzRight(el) { if (!el) { return; } var id = pzWorn('fx'); if (id) { fxRight(PZ_BY[id].key, el); } }
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
  function pzToast(head, why, ms) {
    if (document.querySelector('.view:not([hidden]) .mmwrap')) { return; }
    var el = document.getElementById('pz-toast');
    if (!el) { el = document.createElement('div'); el.id = 'pz-toast'; el.className = 'pz-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = '<p class="pz-toast-in">' + PZ_COIN + '<b>' + esc(head) + '</b>' + (why ? ' <span>' + esc(why) + '</span>' : '') + '</p>';
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(pzToastT); pzToastT = setTimeout(function () { el.classList.remove('show'); }, ms || 3500);
  }
  var PZ_WHY = { qotd: 'Question of the day', plan: 'Today’s plan is done', rev: 'For saying why you missed it' };
