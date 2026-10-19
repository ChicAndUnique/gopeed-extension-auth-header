// Gopeed extension: add an Authorization (or custom) header to HTTP downloads.
// Compatible with Gopeed v1.x (direct field assignment) and v2.x (req.putHeader API).

function trim(s) {
  return s == null ? '' : String(s).replace(/^\s+|\s+$/g, '');
}

function getConfig() {
  var s = gopeed.settings || {};
  return {
    value: trim(s.authorization),
    name: trim(s.headerName) || 'Authorization',
    hosts: trim(s.hosts)
      .split(',')
      .map(function (h) { return trim(h).toLowerCase(); })
      .filter(function (h) { return h.length > 0; }),
    overwrite: s.overwrite === true,
  };
}

function hostOf(url) {
  var m = /^https?:\/\/([^\/?#]+)/i.exec(url || '');
  if (!m) return null;
  var authority = m[1];
  var at = authority.lastIndexOf('@');
  if (at >= 0) authority = authority.substring(at + 1);
  if (authority.charAt(0) === '[') {
    // IPv6 literal: [::1]:8080
    var end = authority.indexOf(']');
    return authority.substring(0, end + 1).toLowerCase();
  }
  return authority.split(':')[0].toLowerCase();
}

function hostAllowed(host, patterns) {
  if (patterns.length === 0) return true;
  for (var i = 0; i < patterns.length; i++) {
    var p = patterns[i];
    if (p.indexOf('*.') === 0) {
      var base = p.substring(2);
      if (host === base || host.slice(-(base.length + 1)) === '.' + base) return true;
    } else if (host === p) {
      return true;
    }
  }
  return false;
}

// Read the existing header map (works for Go-wrapped structs/maps and plain JS objects).
function readHeaders(extra) {
  var out = {};
  var h = extra && extra.header;
  if (!h) return out;
  var keys = Object.keys(h);
  for (var i = 0; i < keys.length; i++) out[keys[i]] = String(h[keys[i]]);
  return out;
}

function findKey(headers, name) {
  var lower = name.toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === lower) return keys[i];
  }
  return null;
}

// Returns true if the request was changed.
function applyHeader(req, cfg) {
  if (!req || !cfg.value) return false;
  var host = hostOf(req.url);
  if (!host || !hostAllowed(host, cfg.hosts)) return false;

  var extra = req.extra;
  var headers = readHeaders(extra);
  var existing = findKey(headers, cfg.name);
  if (existing !== null && !cfg.overwrite) return false;
  if (existing !== null && headers[existing] === cfg.value) return false;

  // Gopeed v2+: the task request exposes mutation methods.
  if (typeof req.putHeader === 'function') {
    req.putHeader(cfg.name, cfg.value);
    return true;
  }

  // Gopeed v1.x / onResolve request: rebuild extra as a plain object.
  if (existing !== null) delete headers[existing];
  headers[cfg.name] = cfg.value;
  var next = { header: headers };
  if (extra && extra.method) next.method = String(extra.method);
  if (extra && extra.body) next.body = String(extra.body);
  req.extra = next;
  return true;
}

function mask(v) {
  return v.length <= 12 ? '***' : v.substring(0, 8) + '...';
}

gopeed.events.onResolve(function (ctx) {
  var cfg = getConfig();
  if (applyHeader(ctx.req, cfg)) {
    gopeed.logger.info('[onResolve] added ' + cfg.name + ' (' + mask(cfg.value) + ') for ' + ctx.req.url);
  }
});

gopeed.events.onStart(function (ctx) {
  var cfg = getConfig();
  var req = ctx.task && ctx.task.meta && ctx.task.meta.req;
  if (applyHeader(req, cfg)) {
    gopeed.logger.info('[onStart] added ' + cfg.name + ' (' + mask(cfg.value) + ') for ' + req.url);
  }
});
