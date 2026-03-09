const communityConnector = DataStudioApp.createCommunityConnector();

function getAuthType() {
  return communityConnector
    .newAuthTypeResponse()
    .setAuthType(communityConnector.AuthType.NONE)
    .build();
}

function getConfig() {
  const config = communityConnector.getConfig();

  config
    .newTextInput()
    .setId("apiToken")
    .setName("API Token (Bearer)")
    .setPlaceholder("Enter your API Key")
    .setHelpText("Find this in your Cookie-Script account settings.")
    .setAllowOverride(true);

  config
    .newTextInput()
    .setId("itemId")
    .setName("Item ID (Hash)")
    .setPlaceholder("e.g. c0db4b49e05321b0...")
    .setHelpText("The unique hash ID for the cookie banner.")
    .setAllowOverride(true);

  config.setDateRangeRequired(true);

  return config.build();
}

function getFields() {
  const fields = communityConnector.getFields();
  const types = communityConnector.FieldType;
  const aggregations = communityConnector.AggregationType;

  fields
    .newDimension()
    .setId("day")
    .setName("Date")
    .setDescription("The date of the tracked actions.")
    .setType(types.YEAR_MONTH_DAY);

  fields
    .newMetric()
    .setId("shown")
    .setName("Banner Shown")
    .setDescription("Number of times the cookie banner was displayed.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("accepted")
    .setName("Banner Accepted")
    .setDescription("Number of times the banner was explicitly accepted.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("declined")
    .setName("Banner Declined")
    .setDescription("Number of times the banner was explicitly declined.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("action_accept")
    .setName("Action: Accept")
    .setDescription("Count of 'Accept' button clicks.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("action_reject")
    .setName("Action: Reject")
    .setDescription("Count of 'Reject' button clicks.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("action_readmore")
    .setName("Action: Read More")
    .setDescription("Count of 'Read More' interactions.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("action_close")
    .setName("Action: Close")
    .setDescription("Count of times the banner was closed without explicit choice.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("action_manage")
    .setName("Action: Manage")
    .setDescription("Count of 'Manage Settings' interactions.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("action_total")
    .setName("Action: Total")
    .setDescription("Total number of tracked user actions.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("cat_functionality")
    .setName("Category: Functionality")
    .setDescription("Consent count for Functionality cookies.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("cat_targeting")
    .setName("Category: Targeting")
    .setDescription("Consent count for Targeting cookies.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("cat_performance")
    .setName("Category: Performance")
    .setDescription("Consent count for Performance cookies.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("cat_unclassified")
    .setName("Category: Unclassified")
    .setDescription("Consent count for Unclassified cookies.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields
    .newMetric()
    .setId("total_accept_rate")
    .setName("Accept Rate")
    .setDescription("Overall accept rate as a percentage.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.MAX);

  fields
    .newMetric()
    .setId("total_reject_rate")
    .setName("Reject Rate")
    .setDescription("Overall reject rate as a percentage.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.MAX);

  fields
    .newMetric()
    .setId("total_ignore_rate")
    .setName("Ignore Rate")
    .setDescription("Overall ignore rate as a percentage.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.MAX);

  fields
    .newMetric()
    .setId("total_accept_count")
    .setName("Accept Count")
    .setDescription("Overall total accept count.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.MAX);

  fields
    .newMetric()
    .setId("total_reject_count")
    .setName("Reject Count")
    .setDescription("Overall total reject count.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.MAX);

  fields
    .newMetric()
    .setId("total_shown_count")
    .setName("Shown Count")
    .setDescription("Overall total banner shown count.")
    .setType(types.NUMBER)
    .setAggregation(aggregations.MAX);

  return fields;
}

function getSchema() {
  return { schema: getFields().build() };
}

function getData(request) {
  const baseUrl = "https://cookie-script.com";

  const apiToken = (request.configParams?.apiToken || "").trim();
  const itemId = (request.configParams?.itemId || "").trim();

  if (!apiToken) communityConnector.newUserError().setText("Missing API Token").throwException();
  if (!itemId) communityConnector.newUserError().setText("Missing Item ID").throwException();

  const dateRange = request.dateRange || {};
  let startDate = dateRange.startDate || "";
  let endDate = dateRange.endDate || "";

  if (startDate && startDate.length === 8) {
    startDate = `${startDate.substring(0,4)}-${startDate.substring(4,6)}-${startDate.substring(6,8)}`;
  }
  if (endDate && endDate.length === 8) {
    endDate = `${endDate.substring(0,4)}-${endDate.substring(4,6)}-${endDate.substring(6,8)}`;
  }

  let url =
    `${baseUrl}/api/open/v1/analytics/looker-studio` +
    `?id=${encodeURIComponent(itemId)}`;

  if (startDate && endDate) {
    url += `&dateFrom=${startDate}&dateTo=${endDate}`;
  }

  let token = apiToken;

  if (!token.toLowerCase().startsWith("bearer ")) {
    token = "Bearer " + token;
  }

  const resp = UrlFetchApp.fetch(url, {
    method: "get",
    muteHttpExceptions: true,
    headers: {
      Accept: "application/json",
      Authorization: token,
    },
  });

  const code = resp.getResponseCode();
  const body = resp.getContentText();

  if (code !== 200) {
    communityConnector.newUserError()
      .setText(`API request failed. HTTP Status: ${code}`)
      .setDebugText(body)
      .throwException();
  }

  let payload;

  try {
    payload = JSON.parse(body);
  } catch (e) {
    communityConnector.newUserError()
      .setText("Invalid response from API (expected JSON).")
      .setDebugText(`Body: ${body}`)
      .throwException();
  }

  if (!payload.success) {
    communityConnector.newUserError()
      .setText(`API Error: ${payload.message || "Unknown error"}`)
      .throwException();
  }

  const data = payload.data || {};

  const mergedData = {};

  const processArray = (arr, mapper) => {
    if (!Array.isArray(arr)) return;
    arr.forEach(entry => {
      const day = entry.day;
      if (!day) return;
      if (!mergedData[day]) mergedData[day] = {};
      mapper(entry, mergedData[day]);
    });
  };

  processArray(data.dailyConsent, (entry, target) => {
    target.shown = entry.shown;
    target.accepted = entry.accepted;
    target.declined = entry.declined;
  });

  processArray(data.dailyActions, (entry, target) => {
    target.action_accept = entry.accept;
    target.action_reject = entry.reject;
    target.action_readmore = entry.readmore;
    target.action_close = entry.close;
    target.action_manage = entry.manage;
    target.action_total = entry.total;
  });

  processArray(data.dailyCategories, (entry, target) => {
    target.cat_functionality = entry.functionality;
    target.cat_targeting = entry.targeting;
    target.cat_performance = entry.performance;
    target.cat_unclassified = entry.unclassified;
  });

  const requestedFieldIds = (request.fields || [])
    .map((f) => f.name)
    .filter(Boolean);

  const formatYMD = (ymd) => {
    if (!ymd) return null;
    return String(ymd).replace(/-/g, "");
  };

  const rows = Object.keys(mergedData).map(day => {
    const dayData = mergedData[day];
    const rates = data.totalRates || {};
    return {
      values: requestedFieldIds.map(id => {
        if (id === "day") return formatYMD(day);
        
        if (id === "total_accept_rate") return Number(rates.percentage?.acceptRate || 0);
        if (id === "total_reject_rate") return Number(rates.percentage?.rejectRate || 0);
        if (id === "total_ignore_rate") return Number(rates.percentage?.ignoreRate || 0);
        if (id === "total_accept_count") return Number(rates.total?.accept || 0);
        if (id === "total_reject_count") return Number(rates.total?.reject || 0);
        if (id === "total_shown_count") return Number(rates.total?.firstShown || 0);

        const val = dayData[id];

        return val !== undefined ? Number(val) : 0;
      })
    };
  });

  return {
    schema: getFields().forIds(requestedFieldIds).build(),
    rows: rows,
  };
}

function isAdminUser() {
  return false;
}
