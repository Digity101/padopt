/*! modernizr 3.3.1 (Custom Build) | MIT *
 * http://modernizr.com/download/?-canvas-cssfilters-filereader-localstorage-requestanimationframe-todataurljpeg_todataurlpng_todataurlwebp-setclasses !*/
!(function (e, t, n) {
  function r(e, t) {
    return typeof e === t;
  }
  function a() {
    var e, t, n, a, o, s, i;
    for (var l in C)
      if (C.hasOwnProperty(l)) {
        if (
          ((e = []),
          (t = C[l]),
          t.name &&
            (e.push(t.name.toLowerCase()),
            t.options && t.options.aliases && t.options.aliases.length))
        )
          for (n = 0; n < t.options.aliases.length; n++)
            e.push(t.options.aliases[n].toLowerCase());
        for (a = r(t.fn, "function") ? t.fn() : t.fn, o = 0; o < e.length; o++)
          (s = e[o]),
            (i = s.split(".")),
            1 === i.length
              ? (Modernizr[i[0]] = a)
              : (!Modernizr[i[0]] ||
                  Modernizr[i[0]] instanceof Boolean ||
                  (Modernizr[i[0]] = new Boolean(Modernizr[i[0]])),
                (Modernizr[i[0]][i[1]] = a)),
            y.push((a ? "" : "no-") + i.join("-"));
      }
  }
  function o(e) {
    var t = S.className,
      n = Modernizr._config.classPrefix || "";
    if ((w && (t = t.baseVal), Modernizr._config.enableJSClass)) {
      var r = new RegExp("(^|\\s)" + n + "no-js(\\s|$)");
      t = t.replace(r, "$1" + n + "js$2");
    }
    Modernizr._config.enableClasses &&
      ((t += " " + n + e.join(" " + n)),
      w ? (S.className.baseVal = t) : (S.className = t));
  }
  function s() {
    return "function" != typeof t.createElement
      ? t.createElement(arguments[0])
      : w
        ? t.createElementNS.call(t, "http://www.w3.org/2000/svg", arguments[0])
        : t.createElement.apply(t, arguments);
  }
  function i(e) {
    return e
      .replace(/([a-z])-([a-z])/g, function (e, t, n) {
        return t + n.toUpperCase();
      })
      .replace(/^-/, "");
  }
  function l(e, t) {
    return !!~("" + e).indexOf(t);
  }
  function f(e, t) {
    return function () {
      return e.apply(t, arguments);
    };
  }
  function u(e, t, n) {
    var a;
    for (var o in e)
      if (e[o] in t)
        return n === !1
          ? e[o]
          : ((a = t[e[o]]), r(a, "function") ? f(a, n || t) : a);
    return !1;
  }
  function d(e) {
    return e
      .replace(/([A-Z])/g, function (e, t) {
        return "-" + t.toLowerCase();
      })
      .replace(/^ms-/, "-ms-");
  }
  function p() {
    var e = t.body;
    return e || ((e = s(w ? "svg" : "body")), (e.fake = !0)), e;
  }
  function c(e, n, r, a) {
    var o,
      i,
      l,
      f,
      u = "modernizr",
      d = s("div"),
      c = p();
    if (parseInt(r, 10))
      for (; r--; )
        (l = s("div")), (l.id = a ? a[r] : u + (r + 1)), d.appendChild(l);
    return (
      (o = s("style")),
      (o.type = "text/css"),
      (o.id = "s" + u),
      (c.fake ? c : d).appendChild(o),
      c.appendChild(d),
      o.styleSheet
        ? (o.styleSheet.cssText = e)
        : o.appendChild(t.createTextNode(e)),
      (d.id = u),
      c.fake &&
        ((c.style.background = ""),
        (c.style.overflow = "hidden"),
        (f = S.style.overflow),
        (S.style.overflow = "hidden"),
        S.appendChild(c)),
      (i = n(d, e)),
      c.fake
        ? (c.parentNode.removeChild(c), (S.style.overflow = f), S.offsetHeight)
        : d.parentNode.removeChild(d),
      !!i
    );
  }
  function m(t, r) {
    var a = t.length;
    if ("CSS" in e && "supports" in e.CSS) {
      for (; a--; ) if (e.CSS.supports(d(t[a]), r)) return !0;
      return !1;
    }
    if ("CSSSupportsRule" in e) {
      for (var o = []; a--; ) o.push("(" + d(t[a]) + ":" + r + ")");
      return (
        (o = o.join(" or ")),
        c(
          "@supports (" + o + ") { #modernizr { position: absolute; } }",
          function (e) {
            return "absolute" == getComputedStyle(e, null).position;
          },
        )
      );
    }
    return n;
  }
  function v(e, t, a, o) {
    function f() {
      d && (delete L.style, delete L.modElem);
    }
    if (((o = r(o, "undefined") ? !1 : o), !r(a, "undefined"))) {
      var u = m(e, a);
      if (!r(u, "undefined")) return u;
    }
    for (var d, p, c, v, g, h = ["modernizr", "tspan"]; !L.style; )
      (d = !0), (L.modElem = s(h.shift())), (L.style = L.modElem.style);
    for (c = e.length, p = 0; c > p; p++)
      if (
        ((v = e[p]),
        (g = L.style[v]),
        l(v, "-") && (v = i(v)),
        L.style[v] !== n)
      ) {
        if (o || r(a, "undefined")) return f(), "pfx" == t ? v : !0;
        try {
          L.style[v] = a;
        } catch (y) {}
        if (L.style[v] != g) return f(), "pfx" == t ? v : !0;
      }
    return f(), !1;
  }
  function g(e, t, n, a, o) {
    var s = e.charAt(0).toUpperCase() + e.slice(1),
      i = (e + " " + T.join(s + " ") + s).split(" ");
    return r(t, "string") || r(t, "undefined")
      ? v(i, t, a, o)
      : ((i = (e + " " + z.join(s + " ") + s).split(" ")), u(i, t, n));
  }
  function h(e, t, r) {
    return g(e, n, n, t, r);
  }
  var y = [],
    C = [],
    x = {
      _version: "3.3.1",
      _config: {
        classPrefix: "",
        enableClasses: !0,
        enableJSClass: !0,
        usePrefixes: !0,
      },
      _q: [],
      on: function (e, t) {
        var n = this;
        setTimeout(function () {
          t(n[e]);
        }, 0);
      },
      addTest: function (e, t, n) {
        C.push({ name: e, fn: t, options: n });
      },
      addAsyncTest: function (e) {
        C.push({ name: null, fn: e });
      },
    },
    Modernizr = function () {};
  (Modernizr.prototype = x),
    (Modernizr = new Modernizr()),
    Modernizr.addTest("filereader", !!(e.File && e.FileList && e.FileReader)),
    Modernizr.addTest("localstorage", function () {
      var e = "modernizr";
      try {
        return localStorage.setItem(e, e), localStorage.removeItem(e), !0;
      } catch (t) {
        return !1;
      }
    });
  var S = t.documentElement,
    w = "svg" === S.nodeName.toLowerCase();
  Modernizr.addTest("canvas", function () {
    var e = s("canvas");
    return !(!e.getContext || !e.getContext("2d"));
  });
  var _ = s("canvas");
  Modernizr.addTest("todataurljpeg", function () {
    return (
      !!Modernizr.canvas &&
      0 === _.toDataURL("image/jpeg").indexOf("data:image/jpeg")
    );
  }),
    Modernizr.addTest("todataurlpng", function () {
      return (
        !!Modernizr.canvas &&
        0 === _.toDataURL("image/png").indexOf("data:image/png")
      );
    }),
    Modernizr.addTest("todataurlwebp", function () {
      var e = !1;
      try {
        e =
          !!Modernizr.canvas &&
          0 === _.toDataURL("image/webp").indexOf("data:image/webp");
      } catch (t) {}
      return e;
    });
  var b = "Moz O ms Webkit",
    T = x._config.usePrefixes ? b.split(" ") : [];
  x._cssomPrefixes = T;
  var j = function (t) {
    var r,
      a = R.length,
      o = e.CSSRule;
    if ("undefined" == typeof o) return n;
    if (!t) return !1;
    if (
      ((t = t.replace(/^@/, "")),
      (r = t.replace(/-/g, "_").toUpperCase() + "_RULE"),
      r in o)
    )
      return "@" + t;
    for (var s = 0; a > s; s++) {
      var i = R[s],
        l = i.toUpperCase() + "_" + r;
      if (l in o) return "@-" + i.toLowerCase() + "-" + t;
    }
    return !1;
  };
  x.atRule = j;
  var z = x._config.usePrefixes ? b.toLowerCase().split(" ") : [];
  x._domPrefixes = z;
  var E = { elem: s("modernizr") };
  Modernizr._q.push(function () {
    delete E.elem;
  });
  var L = { style: E.elem.style };
  Modernizr._q.unshift(function () {
    delete L.style;
  }),
    (x.testAllProps = g);
  var P = (x.prefixed = function (e, t, n) {
    return 0 === e.indexOf("@")
      ? j(e)
      : (-1 != e.indexOf("-") && (e = i(e)), t ? g(e, t, n) : g(e, "pfx"));
  });
  Modernizr.addTest("requestanimationframe", !!P("requestAnimationFrame", e), {
    aliases: ["raf"],
  });
  var R = x._config.usePrefixes
    ? " -webkit- -moz- -o- -ms- ".split(" ")
    : ["", ""];
  (x._prefixes = R), (x.testAllProps = h);
  var N = "CSS" in e && "supports" in e.CSS,
    O = "supportsCSS" in e;
  Modernizr.addTest("supports", N || O),
    Modernizr.addTest("cssfilters", function () {
      if (Modernizr.supports) return h("filter", "blur(2px)");
      var e = s("a");
      return (
        (e.style.cssText = R.join("filter:blur(2px); ")),
        !!e.style.length && (t.documentMode === n || t.documentMode > 9)
      );
    }),
    a(),
    o(y),
    delete x.addTest,
    delete x.addAsyncTest;
  for (var U = 0; U < Modernizr._q.length; U++) Modernizr._q[U]();
  e.Modernizr = Modernizr;
})(window, document);
