const { IncomingWebhook } = require('@slack/webhook');

const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

exports.notifySlackOnRemoteConfigUpdate = (event, context) => {
  const data = JSON.parse(Buffer.from(event.data, 'base64').toString());
  const updateUser = data.updateUser || 'Unknown';
  const updateTime = data.updateTime || new Date().toISOString();
  const version = data.versionNumber || 'N/A';

  // Extract changed parameters
  const changedParams = data.updateMask && data.updateMask.fieldPaths
    ? data.updateMask.fieldPaths.join(', ')
    : 'Unknown';

  const message = {
    text: `:rocket: Firebase Remote Config updated by *${updateUser}* at ${updateTime}\n*Version:* ${version}\n*Changed properties:* ${changedParams}`,
  };

  return webhook.send(message);
};