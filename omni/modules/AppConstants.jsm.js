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
//@line 22 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 24 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  RELEASE_OR_BETA:
//@line 27 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 31 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  EARLY_BETA_OR_EARLIER:
//@line 36 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 38 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  ACCESSIBILITY:
//@line 41 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 45 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  // Official corresponds, roughly, to whether this build is performed
  // on Mozilla's continuous integration infrastructure. You should
  // disable developer-only functionality when this flag is set.
  MOZILLA_OFFICIAL:
//@line 51 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 55 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_OFFICIAL_BRANDING:
//@line 58 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 62 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_DEV_EDITION:
//@line 67 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 69 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SERVICES_SYNC:
//@line 74 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 76 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SERVICES_HEALTHREPORT:
//@line 79 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 83 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_DATA_REPORTING:
//@line 86 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 90 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SANDBOX:
//@line 93 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 97 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_CONTENT_SANDBOX:
//@line 100 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 104 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_TELEMETRY_REPORTING:
//@line 107 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 111 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_TELEMETRY_ON_BY_DEFAULT:
//@line 116 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
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

//@line 156 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  platform:
//@line 158 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  "linux",
//@line 170 "$SRCDIR/toolkit/modules/AppConstants.jsm"

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
//@line 185 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 189 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_MAINTENANCE_SERVICE:
//@line 194 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 196 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  DEBUG:
//@line 201 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 203 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  ASAN:
//@line 208 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 210 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  ASAN_REPORTER:
//@line 215 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 217 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_GRAPHENE:
//@line 222 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 224 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_SYSTEM_NSS:
//@line 229 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 231 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_PLACES:
//@line 234 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 238 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_REQUIRE_SIGNING:
//@line 241 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 245 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  get MOZ_UNSIGNED_SCOPES() {
    let result = 0;
//@line 254 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    return result;
  },

  MOZ_ALLOW_LEGACY_EXTENSIONS:
//@line 261 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 263 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MENUBAR_CAN_AUTOHIDE:
//@line 266 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 270 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_ANDROID_HISTORY:
//@line 275 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 277 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_TOOLKIT_SEARCH:
//@line 280 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 284 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_GECKO_PROFILER:
//@line 287 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  true,
//@line 291 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_ANDROID_ACTIVITY_STREAM:
//@line 296 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 298 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_ANDROID_MOZILLA_ONLINE:
//@line 303 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  false,
//@line 305 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  DLL_PREFIX: "lib",
  DLL_SUFFIX: ".so",

  MOZ_APP_NAME: "firefox",
  MOZ_APP_VERSION: "67.0.2",
  MOZ_APP_VERSION_DISPLAY: "67.0.2",
  MOZ_BUILD_APP: "browser",
  MOZ_MACBUNDLE_NAME: "Firefox.app",
  MOZ_UPDATE_CHANNEL: "release",
  INSTALL_LOCALE: "en-US",
  MOZ_WIDGET_TOOLKIT: "gtk3",
  ANDROID_PACKAGE_NAME: "org.mozilla.firefox",

  DEBUG_JS_MODULES: "",

  MOZ_BING_API_CLIENTID: "no-bing-api-clientid",
  MOZ_BING_API_KEY: "no-bing-api-key",
  MOZ_GOOGLE_LOCATION_SERVICE_API_KEY: "AIzaSyB2h2OuRcUgy5N-5hsZqiPW6sH3n_rptiQ",
  MOZ_GOOGLE_SAFEBROWSING_API_KEY: "AIzaSyC7jsptDS3am4tPx4r3nxis7IMjBc5Dovo",
  MOZ_MOZILLA_API_KEY: "7e40f68c-7938-4c5d-9f95-e61647c213eb",

  BROWSER_CHROME_URL: "chrome://browser/content/browser.xul",

  // URL to the hg revision this was built from (e.g.
  // "https://hg.mozilla.org/mozilla-central/rev/6256ec9113c1")
  // On unofficial builds, this is an empty string.
//@line 335 "$SRCDIR/toolkit/modules/AppConstants.jsm"
  SOURCE_REVISION_URL: "https://hg.mozilla.org/releases/mozilla-release/rev/1a95e4b8b2d28e76ef63335f96f2b4cc151497f9",

  HAVE_USR_LIB64_DIR:
//@line 341 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    false,
//@line 343 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  HAVE_SHELL_SERVICE:
//@line 346 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    true,
//@line 350 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  MOZ_CODE_COVERAGE:
//@line 355 "$SRCDIR/toolkit/modules/AppConstants.jsm"
    false,
//@line 357 "$SRCDIR/toolkit/modules/AppConstants.jsm"

  TELEMETRY_PING_FORMAT_VERSION: 4,
});