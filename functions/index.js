"use strict";

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to set up triggers and logging.
const {onConfigUpdated} = require("firebase-functions/v2/remoteConfig");
const logger = require("firebase-functions/logger");
// The Firebase Admin SDK to obtain access tokens.
const admin = require("firebase-admin");
const app = admin.initializeApp();
const fetch = require("node-fetch");
const jsonDiff = require("json-diff");

const {IncomingWebhook} = require("@slack/webhook");
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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";
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);
// [END import]

// [START showconfigdiff]
exports.remoteConfigUpdate = onConfigUpdated(async (event) => {
  try {
    // Obtain the access token from the Admin SDK
    const accessTokenObj = await admin.credential.applicationDefault()
        .getAccessToken();
    const accessToken = accessTokenObj.access_token;

    // Get the version number from the event object
    const remoteConfigApi = "https://firebaseremoteconfig.googleapis.com/v1/" +
        `projects/${app.options.projectId}/remoteConfig`;
    const currentVersion = event.data.versionNumber;
    const prevVersion = currentVersion - 1;
    const templatePromises = [];
    templatePromises.push(fetch(
        remoteConfigApi,
        {
          method: "POST",
          body: new URLSearchParams([["versionNumber", currentVersion + ""]]),
          headers: {Authorization: "Bearer " + accessToken},
        },
    ));
    templatePromises.push(fetch(
        remoteConfigApi,
        {
          method: "POST",
          body: new URLSearchParams([["versionNumber", prevVersion + ""]]),
          headers: {Authorization: "Bearer " + accessToken},
        },
    ));

    // Get the templates
    const responses = await Promise.all(templatePromises);
    const results = responses.map((r) => r.json());
    const currentTemplate = results[0];
    const previousTemplate = results[1];
    // Figure out the differences of the templates
    const diff = jsonDiff.diffString(previousTemplate, currentTemplate);
    // Log the difference
    logger.log(diff);

    const message = {
      text: `:rocket: Firebase Remote Config updated ${diff}`,
    };
    webhook.send(message);
  } catch (error) {
    logger.error(error);
  }
});

