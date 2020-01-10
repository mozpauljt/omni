/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

ChromeUtils.defineModuleGetter(this, "Services", "resource://gre/modules/Services.jsm");
ChromeUtils.defineModuleGetter(this, "AddonManager", "resource://gre/modules/AddonManager.jsm");

this.EXPORTED_SYMBOLS = ["AppConstants"];

// Immutable for export.
this.AppConstants = Object.freeze({
  // See this wiki page for more details about channel specific build
  // defines: https://wiki.mozilla.org/Platform/Channel-specific_build_defines
  NIGHTLY_BUILD:
//@line 20 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 24 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  FENNEC_NIGHTLY:
//@line 29 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 31 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  RELEASE_OR_BETA:
//@line 36 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 38 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  EARLY_BETA_OR_EARLIER:
//@line 41 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 45 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  ACCESSIBILITY:
//@line 48 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 52 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  // Official corresponds, roughly, to whether this build is performed
  // on Mozilla's continuous integration infrastructure. You should
  // disable developer-only functionality when this flag is set.
  MOZILLA_OFFICIAL:
//@line 58 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 62 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_OFFICIAL_BRANDING:
//@line 67 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 69 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_DEV_EDITION:
//@line 74 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 76 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SERVICES_SYNC:
//@line 81 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 83 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SERVICES_HEALTHREPORT:
//@line 86 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 90 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_DATA_REPORTING:
//@line 93 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 97 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SANDBOX:
//@line 100 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 104 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_TELEMETRY_REPORTING:
//@line 107 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 111 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_TELEMETRY_ON_BY_DEFAULT:
//@line 114 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 118 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_UPDATER:
//@line 121 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 125 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SWITCHBOARD:
//@line 130 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 132 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_WEBRTC:
//@line 135 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 139 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_WIDGET_GTK:
//@line 142 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 146 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  XP_UNIX:
//@line 149 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 153 "$SRCDIR/toolkit/modules/AppConstants.jsm"

// NOTE! XP_LINUX has to go after MOZ_WIDGET_ANDROID otherwise Android
// builds will be misidentified as linux.
  platform:
//@line 158 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  "linux",
//@line 170 "$SRCDIR/toolkit/modules/AppConstants.jsm"

// Most of our frontend code assumes that any desktop Unix platform
// is "linux". Add the distinction for code that needs it.
  unixstyle:
//@line 175 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    "linux",
//@line 187 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  isPlatformAndVersionAtLeast(platform, version) {
    let platformVersion = Services.sysinfo.getProperty("version");
    return platform == this.platform &&
           Services.vc.compare(platformVersion, version) >= 0;
  },

  isPlatformAndVersionAtMost(platform, version) {
    let platformVersion = Services.sysinfo.getProperty("version");
    return platform == this.platform &&
           Services.vc.compare(platformVersion, version) <= 0;
  },

  MOZ_CRASHREPORTER:
//@line 202 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 206 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_NORMANDY:
//@line 209 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 213 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_MAINTENANCE_SERVICE:
//@line 218 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 220 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_BITS_DOWNLOAD:
//@line 225 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 227 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  DEBUG:
//@line 232 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 234 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  ASAN:
//@line 239 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 241 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  ASAN_REPORTER:
//@line 246 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 248 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SYSTEM_NSS:
//@line 253 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 255 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_PLACES:
//@line 258 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 262 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_REQUIRE_SIGNING:
//@line 267 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 269 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  get MOZ_UNSIGNED_SCOPES() {
    let result = 0;
//@line 278 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    return result;
  },

  MOZ_ALLOW_LEGACY_EXTENSIONS:
//@line 283 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 287 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MENUBAR_CAN_AUTOHIDE:
//@line 290 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 294 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_ANDROID_HISTORY:
//@line 299 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 301 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_GECKO_PROFILER:
//@line 304 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 308 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  DLL_PREFIX: "lib",
  DLL_SUFFIX: ".so",

  MOZ_APP_NAME: "firefox",
  MOZ_APP_VERSION: "74.0a1",
  MOZ_APP_VERSION_DISPLAY: "74.0a1",
  MOZ_BUILD_APP: "browser",
  MOZ_MACBUNDLE_NAME: "Firefox Nightly.app",
  MOZ_UPDATE_CHANNEL: "nightly",
  MOZ_WIDGET_TOOLKIT: "gtk",
  ANDROID_PACKAGE_NAME: "org.mozilla.firefox",

  DEBUG_JS_MODULES: "",

  MOZ_BING_API_CLIENTID: "no-bing-api-clientid",
  MOZ_BING_API_KEY: "no-bing-api-key",
  MOZ_GOOGLE_LOCATION_SERVICE_API_KEY: "AIzaSyB2h2OuRcUgy5N-5hsZqiPW6sH3n_rptiQ",
  MOZ_GOOGLE_SAFEBROWSING_API_KEY: "AIzaSyC7jsptDS3am4tPx4r3nxis7IMjBc5Dovo",
  MOZ_MOZILLA_API_KEY: "7e40f68c-7938-4c5d-9f95-e61647c213eb",

  BROWSER_CHROME_URL: "chrome://browser/content/browser.xhtml",

  OMNIJAR_NAME: "omni.ja",

  // URL to the hg revision this was built from (e.g.
  // "https://hg.mozilla.org/mozilla-central/rev/6256ec9113c1")
  // On unofficial builds, this is an empty string.
//@line 339 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  SOURCE_REVISION_URL: "https://hg.mozilla.org/mozilla-central/rev/feb7d997f96164b028c9cf57a74878095cdad0d3",

  HAVE_USR_LIB64_DIR:
//@line 345 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    false,
//@line 347 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  HAVE_SHELL_SERVICE:
//@line 350 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    true,
//@line 354 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_CODE_COVERAGE:
//@line 359 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    false,
//@line 361 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  TELEMETRY_PING_FORMAT_VERSION: 4,

  MOZ_NEW_XULSTORE:
//@line 366 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    true,
//@line 370 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_NEW_NOTIFICATION_STORE:
//@line 373 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    true,
//@line 377 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_NEW_CERT_STORAGE:
//@line 380 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    true,
//@line 384 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  ENABLE_REMOTE_AGENT:
//@line 387 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    true,
//@line 391 "$SRCDIR/toolkit/modules/AppConstants.jsm"
});
