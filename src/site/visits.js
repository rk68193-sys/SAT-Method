  /* =================== Visit counts: how often each page is shown, per day, and nothing about who =================== */
  /* No cookie, no ID and nothing kept on the device: each page shown adds one to that day's count for its name in the visits
     table (public.count_visit in src/account/extras.sql), and each page load also adds one to "visit". Only on satsprint.org,
     never in a copy of the page or in a check, and never when the browser asks not to be tracked (Do Not Track or Global
     Privacy Control). A question's own address counts under its kind (rq, mq), not its number. Until the SQL has been run the
     requests fail, quietly. Called by go() in boot.js. */
  var VISIT_HOST = 'satsprint.org', visitLoad = true, visitLast = '', visitAt = 0;
  function visitOn() {
    try {
      if (!acctOn || location.hostname !== VISIT_HOST) { return false; }
      return !(navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1');
    } catch (e) { return false; }
  }
  function visitName(token) {
    return String(token || 'home').toLowerCase().replace(/^#/, '').replace(/-[0-9a-f]{6,}$/, '').replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'home';
  }
  function visitCount(token) {
    if (!visitOn()) { return; }
    var page = visitName(token), now = Date.now();
    /* the same page twice in a moment (a hash change and a history step for one move) counts once */
    if (page === visitLast && now - visitAt < 3000) { return; }
    visitLast = page; visitAt = now;
    if (visitLoad) { visitLoad = false; acctReq('POST', '/rest/v1/rpc/count_visit', { p: 'visit' }); }
    acctReq('POST', '/rest/v1/rpc/count_visit', { p: page });
  }
