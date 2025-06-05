"use strict";

// [START import]
// The Cloud Functions for Firebase SDK to set up triggers and logging.
const {onConfigUpdated} = require("firebase-functions/v2/remoteConfig");
const logger = require("firebase-functions/logger");
// The Firebase Admin SDK to obtain access tokens.
const admin = require("firebase-admin");
const app = admin.initializeApp();
const jsonDiff = require("json-diff");
const {getRemoteConfig} = require("firebase-admin/remote-config");
// Slack webhook
const {IncomingWebhook} = require("@slack/webhook");
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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";
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);
// [END import]

exports.remoteConfigUpdate = onConfigUpdated(async (event) => {
  try {
    const rc = getRemoteConfig(app);
    const current = await rc.getTemplateAtVersion(event.data.versionNumber);
    const previous = await rc.getTemplateAtVersion((event.data.versionNumber - 1));

    // Delete `etagInternal` and `version` properties to avoid polluting the final diff
    [previous, current].forEach((template) => {
      delete template.etagInternal;
      delete template.version;
    });

    // Diff Remote Config templates
    const diff = jsonDiff.diffString(previous, current, {maxElisions: 0});
    logger.log("diff", diff);

    // Format message
    const message = {
      text: `:rocket: Firebase Remote Config updated\n`+
      `*Project*: <https://console.firebase.google.com/project/${event.project}/config|${event.project}>\n`+
      `*Author*: ${event.data.updateUser?.name || event.data.updateUser?.email || "unknown"}\n`+
      `${diff}`,
    };
    webhook.send(message);
  } catch (error) {
    logger.error(error);
  }
});

