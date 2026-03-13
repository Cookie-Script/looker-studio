const communityConnector = DataStudioApp.createCommunityConnector();
const BASE_URL = "https://t6.cookie-script.com";

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
    .setName("API Token")
    .setPlaceholder("Enter your API Key")
    .setHelpText("Used to access your Cookie-Script analytics data.")
    .setAllowOverride(true);

  config
    .newTextInput()
    .setId("itemId")
    .setName("Item ID")
    .setPlaceholder("e.g. c0db4b49e05321b0...")
    .setHelpText("The unique hash ID for the cookie banner.")
    .setAllowOverride(true);

  config.setDateRangeRequired(true);

  return config.build();
}

function addMetric(fields, id, name, description, aggregation) {
  return fields
    .newMetric()
    .setId(id)
    .setName(name)
    .setDescription(description)
    .setType(communityConnector.FieldType.NUMBER)
    .setAggregation(aggregation);
}

function addPercentMetric(fields, id, name, description, aggregation) {
  return fields
    .newMetric()
    .setId(id)
    .setName(name)
    .setDescription(description)
    .setType(communityConnector.FieldType.PERCENT)
    .setAggregation(aggregation);
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

  addMetric(fields, "shown", "Banner Shown", "Number of times the cookie banner was displayed.", aggregations.SUM);
  addMetric(fields, "accepted", "Banner Accepted", "Number of times the banner was explicitly accepted.", aggregations.SUM);
  addMetric(fields, "declined", "Banner Declined", "Number of times the banner was explicitly declined.", aggregations.SUM);

  addMetric(fields, "action_accept", "Action: Accept", "Count of 'Accept' button clicks.", aggregations.SUM);
  addMetric(fields, "action_reject", "Action: Reject", "Count of 'Reject' button clicks.", aggregations.SUM);
  addMetric(fields, "action_readmore", "Action: Read More", "Count of 'Read More' interactions.", aggregations.SUM);
  addMetric(fields, "action_close", "Action: Close", "Count of times the banner was closed without explicit choice.", aggregations.SUM);
  addMetric(fields, "action_manage", "Action: Manage", "Count of 'Manage Settings' interactions.", aggregations.SUM);
  addMetric(fields, "action_total", "Action: Total", "Total number of tracked user actions.", aggregations.SUM);

  addMetric(fields, "cat_functionality", "Category: Functionality", "Consent count for Functionality cookies.", aggregations.SUM);
  addMetric(fields, "cat_targeting", "Category: Targeting", "Consent count for Targeting cookies.", aggregations.SUM);
  addMetric(fields, "cat_performance", "Category: Performance", "Consent count for Performance cookies.", aggregations.SUM);
  addMetric(fields, "cat_unclassified", "Category: Unclassified", "Consent count for Unclassified cookies.", aggregations.SUM);

  addPercentMetric(fields, "total_accept_rate", "Accept Rate", "Overall accept rate as a percentage.", aggregations.AVG);
  addPercentMetric(fields, "total_reject_rate", "Reject Rate", "Overall reject rate as a percentage.", aggregations.AVG);
  addPercentMetric(fields, "total_ignore_rate", "Ignore Rate", "Overall ignore rate as a percentage.", aggregations.AVG);

  return fields;
}

function getSchema() {
  return { schema: getFields().build() };
}

function buildUrl(itemId, startDate, endDate) {
  let url = BASE_URL + "/api/open/v1/analytics/looker-studio?id=" + encodeURIComponent(itemId);

  if (startDate && endDate) {
    url += "&dateFrom=" + encodeURIComponent(startDate);
    url += "&dateTo=" + encodeURIComponent(endDate);
  }

  return url;
}

function buildBearerToken(apiToken) {
  return /^bearer\s+/i.test(apiToken) ? apiToken : "Bearer " + apiToken;
}

function fetchJson(url, authHeader) {
  let response;

  try {
    response = UrlFetchApp.fetch(url, {
      method: "get",
      muteHttpExceptions: true,
      headers: {
        Accept: "application/json",
        Authorization: authHeader
      }
    });
  } catch (e) {
    communityConnector.newUserError()
      .setText("Network error while calling API.")
      .setDebugText(String(e))
      .throwException();
  }

  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  if (statusCode !== 200) {
    communityConnector.newUserError()
      .setText("API request failed. HTTP Status: " + statusCode)
      .setDebugText(body)
      .throwException();
  }

  try {
    return JSON.parse(body);
  } catch (e) {
    communityConnector.newUserError()
      .setText("Invalid response from API (expected JSON).")
      .setDebugText(body)
      .throwException();
  }
}

function safeNumber(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function getData(request) {
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

  const url = buildUrl(itemId, startDate, endDate);
  const authHeader = buildBearerToken(apiToken);

  const resp = fetchJson(url, authHeader);

  if (!resp.success) {
    communityConnector.newUserError()
      .setText(`API Error: ${resp.message || "Unknown error"}`)
      .throwException();
  }

  const data = resp.data || {};
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
    target.shown = safeNumber(entry.shown);
    target.accepted = safeNumber(entry.accepted);
    target.declined = safeNumber(entry.declined);
  });

  processArray(data.dailyActions, (entry, target) => {
    target.action_accept = safeNumber(entry.accept);
    target.action_reject = safeNumber(entry.reject);
    target.action_readmore = safeNumber(entry.readmore);
    target.action_close = safeNumber(entry.close);
    target.action_manage = safeNumber(entry.manage);
    target.action_total = safeNumber(entry.total);
  });

  processArray(data.dailyCategories, (entry, target) => {
    target.cat_functionality = safeNumber(entry.functionality);
    target.cat_targeting = safeNumber(entry.targeting);
    target.cat_performance = safeNumber(entry.performance);
    target.cat_unclassified = safeNumber(entry.unclassified);
  });

  processArray(data.dailyRates, (entry, target) => {
    target.total_accept_rate = safeNumber(entry.acceptRate) / 100;
    target.total_reject_rate = safeNumber(entry.rejectRate) / 100;
    target.total_ignore_rate = safeNumber(entry.ignoreRate) / 100;
  });

  const requestedFieldIds = (request.fields || [])
    .map((f) => f.name)
    .filter(Boolean);

  const formatYMD = (ymd) => {
    if (!ymd) return null;
    return String(ymd).replace(/-/g, "");
  };

  const rows = Object.keys(mergedData)
    .sort()
    .map(day => {
      const dayData = mergedData[day];

      return {
        values: requestedFieldIds.map(id => {
          if (id === "day") return formatYMD(day);
          return safeNumber(dayData[id]);
        })
      };
    });

  return {
    schema: getFields().forIds(requestedFieldIds).build(),
    rows: rows
  };
}

function isAdminUser() {
  return false;
}

function isAuthValid(request) {
  const apiToken = (request.configParams?.apiToken || "").trim();
  const itemId = (request.configParams?.itemId || "").trim();
  return apiToken && itemId;
}