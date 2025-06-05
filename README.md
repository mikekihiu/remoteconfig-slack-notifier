### Description
Firebase function that notifies a slack channel when remote config is updated

### Webhook
Replace `your/service/url` at `functions/index.js` with an actual webhook

### Deployment
```
cd functions
firebase use --add
firebase deploy --only functions:remoteConfigUpdate
