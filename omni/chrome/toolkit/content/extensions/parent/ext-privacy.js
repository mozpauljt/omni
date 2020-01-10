/* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set sts=2 sw=2 et tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

ChromeUtils.defineModuleGetter(
  this,
  "Preferences",
  "resource://gre/modules/Preferences.jsm"
);

var { ExtensionPreferencesManager } = ChromeUtils.import(
  "resource://gre/modules/ExtensionPreferencesManager.jsm"
);
var { ExtensionError } = ExtensionUtils;
var { getSettingsAPI } = ExtensionPreferencesManager;

const cookieSvc = Ci.nsICookieService;

const cookieBehaviorValues = new Map([
  ["allow_all", cookieSvc.BEHAVIOR_ACCEPT],
  ["reject_third_party", cookieSvc.BEHAVIOR_REJECT_FOREIGN],
  ["reject_all", cookieSvc.BEHAVIOR_REJECT],
  ["allow_visited", cookieSvc.BEHAVIOR_LIMIT_FOREIGN],
  ["reject_trackers", cookieSvc.BEHAVIOR_REJECT_TRACKER],
]);

const TLS_VERSIONS = [
  [1, "TLSv1"],
  [2, "TLSv1.1"],
  [3, "TLSv1.2"],
  [4, "TLSv1.3"],
];

// Add settings objects for supported APIs to the preferences manager.
ExtensionPreferencesManager.addSetting("network.networkPredictionEnabled", {
  prefNames: [
    "network.predictor.enabled",
    "network.prefetch-next",
    "network.http.speculative-parallel-limit",
    "network.dns.disablePrefetch",
  ],

  setCallback(value) {
    return {
      "network.http.speculative-parallel-limit": value ? undefined : 0,
      "network.dns.disablePrefetch": !value,
      "network.predictor.enabled": value,
      "network.prefetch-next": value,
    };
  },
});

ExtensionPreferencesManager.addSetting("network.peerConnectionEnabled", {
  prefNames: ["media.peerconnection.enabled"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("network.webRTCIPHandlingPolicy", {
  prefNames: [
    "media.peerconnection.ice.default_address_only",
    "media.peerconnection.ice.no_host",
    "media.peerconnection.ice.proxy_only_if_behind_proxy",
    "media.peerconnection.ice.proxy_only",
  ],

  setCallback(value) {
    let prefs = {};
    switch (value) {
      case "default":
        // All prefs are already set to be reset.
        break;

      case "default_public_and_private_interfaces":
        prefs["media.peerconnection.ice.default_address_only"] = true;
        break;

      case "default_public_interface_only":
        prefs["media.peerconnection.ice.default_address_only"] = true;
        prefs["media.peerconnection.ice.no_host"] = true;
        break;

      case "disable_non_proxied_udp":
        prefs["media.peerconnection.ice.default_address_only"] = true;
        prefs["media.peerconnection.ice.no_host"] = true;
        prefs["media.peerconnection.ice.proxy_only_if_behind_proxy"] = true;
        break;

      case "proxy_only":
        prefs["media.peerconnection.ice.proxy_only"] = true;
        break;
    }
    return prefs;
  },
});

ExtensionPreferencesManager.addSetting("services.passwordSavingEnabled", {
  prefNames: ["signon.rememberSignons"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("websites.cookieConfig", {
  prefNames: ["network.cookie.cookieBehavior", "network.cookie.lifetimePolicy"],

  setCallback(value) {
    return {
      "network.cookie.cookieBehavior": cookieBehaviorValues.get(value.behavior),
      "network.cookie.lifetimePolicy": value.nonPersistentCookies
        ? cookieSvc.ACCEPT_SESSION
        : cookieSvc.ACCEPT_NORMALLY,
    };
  },
});

ExtensionPreferencesManager.addSetting("websites.firstPartyIsolate", {
  prefNames: ["privacy.firstparty.isolate"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("websites.hyperlinkAuditingEnabled", {
  prefNames: ["browser.send_pings"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("websites.referrersEnabled", {
  prefNames: ["network.http.sendRefererHeader"],

  // Values for network.http.sendRefererHeader:
  // 0=don't send any, 1=send only on clicks, 2=send on image requests as well
  // http://searchfox.org/mozilla-central/rev/61054508641ee76f9c49bcf7303ef3cfb6b410d2/modules/libpref/init/all.js#1585
  setCallback(value) {
    return { [this.prefNames[0]]: value ? 2 : 0 };
  },
});

ExtensionPreferencesManager.addSetting("websites.resistFingerprinting", {
  prefNames: ["privacy.resistFingerprinting"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("websites.trackingProtectionMode", {
  prefNames: [
    "privacy.trackingprotection.enabled",
    "privacy.trackingprotection.pbmode.enabled",
  ],

  setCallback(value) {
    // Default to private browsing.
    let prefs = {
      "privacy.trackingprotection.enabled": false,
      "privacy.trackingprotection.pbmode.enabled": true,
    };

    switch (value) {
      case "private_browsing":
        break;

      case "always":
        prefs["privacy.trackingprotection.enabled"] = true;
        break;

      case "never":
        prefs["privacy.trackingprotection.pbmode.enabled"] = false;
        break;
    }

    return prefs;
  },
});

ExtensionPreferencesManager.addSetting("network.tlsVersionRestriction", {
  prefNames: ["security.tls.version.min", "security.tls.version.max"],

  setCallback(value) {
    function tlsStringToVersion(string) {
      const version = TLS_VERSIONS.find(a => a[1] === string);
      if (version) {
        return version[0];
      }
      return 0;
    }

    const prefs = [];

    const minimum = tlsStringToVersion(value.minimum);
    if (minimum) {
      prefs["security.tls.version.min"] = minimum;
    }

    const maximum = tlsStringToVersion(value.maximum);
    if (maximum) {
      prefs["security.tls.version.max"] = maximum;
    }

    return prefs;
  },
});

this.privacy = class extends ExtensionAPI {
  getAPI(context) {
    return {
      privacy: {
        network: {
          networkPredictionEnabled: getSettingsAPI({
            context,
            name: "network.networkPredictionEnabled",
            callback() {
              return (
                Preferences.get("network.predictor.enabled") &&
                Preferences.get("network.prefetch-next") &&
                Preferences.get("network.http.speculative-parallel-limit") >
                  0 &&
                !Preferences.get("network.dns.disablePrefetch")
              );
            },
          }),
          peerConnectionEnabled: getSettingsAPI({
            context,
            name: "network.peerConnectionEnabled",
            callback() {
              return Preferences.get("media.peerconnection.enabled");
            },
          }),
          webRTCIPHandlingPolicy: getSettingsAPI({
            context,
            name: "network.webRTCIPHandlingPolicy",
            callback() {
              if (Preferences.get("media.peerconnection.ice.proxy_only")) {
                return "proxy_only";
              }

              let default_address_only = Preferences.get(
                "media.peerconnection.ice.default_address_only"
              );
              if (default_address_only) {
                let no_host = Preferences.get(
                  "media.peerconnection.ice.no_host"
                );
                if (no_host) {
                  if (
                    Preferences.get(
                      "media.peerconnection.ice.proxy_only_if_behind_proxy"
                    )
                  ) {
                    return "disable_non_proxied_udp";
                  }
                  return "default_public_interface_only";
                }
                return "default_public_and_private_interfaces";
              }

              return "default";
            },
          }),
          tlsVersionRestriction: getSettingsAPI({
            context,
            name: "network.tlsVersionRestriction",
            callback() {
              function tlsVersionToString(pref) {
                const value = Services.prefs.getIntPref(pref);
                const version = TLS_VERSIONS.find(a => a[0] === value);
                if (version) {
                  return version[1];
                }
                return "unknown";
              }

              return {
                minimum: tlsVersionToString("security.tls.version.min"),
                maximum: tlsVersionToString("security.tls.version.max"),
              };
            },
            validate() {
              if (!context.extension.isPrivileged) {
                throw new ExtensionError(
                  "tlsVersionRestriction can be set by privileged extensions only."
                );
              }
            },
          }),
        },

        services: {
          passwordSavingEnabled: getSettingsAPI({
            context,
            name: "services.passwordSavingEnabled",
            callback() {
              return Preferences.get("signon.rememberSignons");
            },
          }),
        },

        websites: {
          cookieConfig: getSettingsAPI({
            context,
            name: "websites.cookieConfig",
            callback() {
              let prefValue = Preferences.get("network.cookie.cookieBehavior");
              return {
                behavior: Array.from(cookieBehaviorValues.entries()).find(
                  entry => entry[1] === prefValue
                )[0],
                nonPersistentCookies:
                  Preferences.get("network.cookie.lifetimePolicy") ===
                  cookieSvc.ACCEPT_SESSION,
              };
            },
          }),
          firstPartyIsolate: getSettingsAPI({
            context,
            name: "websites.firstPartyIsolate",
            callback() {
              return Preferences.get("privacy.firstparty.isolate");
            },
          }),
          hyperlinkAuditingEnabled: getSettingsAPI({
            context,
            name: "websites.hyperlinkAuditingEnabled",
            callback() {
              return Preferences.get("browser.send_pings");
            },
          }),
          referrersEnabled: getSettingsAPI({
            context,
            name: "websites.referrersEnabled",
            callback() {
              return Preferences.get("network.http.sendRefererHeader") !== 0;
            },
          }),
          resistFingerprinting: getSettingsAPI({
            context,
            name: "websites.resistFingerprinting",
            callback() {
              return Preferences.get("privacy.resistFingerprinting");
            },
          }),
          trackingProtectionMode: getSettingsAPI({
            context,
            name: "websites.trackingProtectionMode",
            callback() {
              if (Preferences.get("privacy.trackingprotection.enabled")) {
                return "always";
              } else if (
                Preferences.get("privacy.trackingprotection.pbmode.enabled")
              ) {
                return "private_browsing";
              }
              return "never";
            },
          }),
        },
      },
    };
  }
};
