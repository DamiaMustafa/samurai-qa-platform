## Unreleased

- **fix:** use text-based selector for upload progress, increase timeout to 60min

The progress percentage (e.g. '34%') is in a generic DOM element with no
stable ID, not in #dataset-upload-file-progress. Switched to getByText
with /^\d+%$/ regex. Also increased timeout from 15min to 60min since
614MB ZIP uploads can take 30+ minutes on staging. (2026-07-01, b233245)
- **fix:** use text-based selector for upload progress, increase timeout to 60min

The progress percentage (e.g. '34%') is in a generic DOM element with no
stable ID, not in #dataset-upload-file-progress. Switched to getByText
with /^\d+%$/ regex. Also increased timeout from 15min to 60min since
614MB ZIP uploads can take 30+ minutes on staging. (2026-07-01, b233245)
