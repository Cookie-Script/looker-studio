# CookieScript Looker Studio Connector

A **Google Looker Studio (Data Studio) Community Connector** for retrieving **CookieScript analytics data** directly into Looker Studio dashboards.

This connector fetches cookie consent statistics and interaction data from the CookieScript API and exposes it as dimensions and metrics for reporting.

---

## Features

* Connect **CookieScript analytics** directly to Looker Studio
* Supports **date range filtering**
* Provides detailed metrics including:

  * Banner impressions
  * Accept / Reject actions
  * Category consent statistics
  * User interaction events
  * Acceptance and rejection rates
* Works with the **CookieScript Open API**

---

## Requirements

Before using the connector you need:

* A **CookieScript account**
* A valid **API Token**
* The **Item ID (hash)** of the CookieScript banner configuration

You can obtain these from your CookieScript dashboard or API settings.

---

## Connector Configuration

When adding the connector to Looker Studio you will be asked to provide:

| Field                  | Description                               |
| ---------------------- | ----------------------------------------- |
| **API Token (Bearer)** | Your CookieScript API token               |
| **Item ID (Hash)**     | The unique ID of your CookieScript banner |

The connector also requires a **date range** which will be used when requesting analytics data.

---

## Available Fields

### Dimension

| Field | Description                |
| ----- | -------------------------- |
| `day` | Date of recorded analytics |

---

### Consent Metrics

| Field      | Description                                 |
| ---------- | ------------------------------------------- |
| `shown`    | Number of times the cookie banner was shown |
| `accepted` | Number of users who accepted cookies        |
| `declined` | Number of users who declined cookies        |

---

### User Actions

| Field             | Description               |
| ----------------- | ------------------------- |
| `action_accept`   | Users clicking Accept     |
| `action_reject`   | Users clicking Reject     |
| `action_readmore` | Users clicking Read More  |
| `action_close`    | Users closing the banner  |
| `action_manage`   | Users opening preferences |
| `action_total`    | Total actions performed   |

---

### Cookie Category Consent

| Field               | Description                    |
| ------------------- | ------------------------------ |
| `cat_functionality` | Functionality cookies accepted |
| `cat_targeting`     | Targeting cookies accepted     |
| `cat_performance`   | Performance cookies accepted   |
| `cat_unclassified`  | Unclassified cookies accepted  |

---

### Overall Rates

| Field               | Description             |
| ------------------- | ----------------------- |
| `total_accept_rate` | Overall acceptance rate |
| `total_reject_rate` | Overall rejection rate  |
| `total_ignore_rate` | Ignore rate             |

---

### Overall Totals

| Field                | Description              |
| -------------------- | ------------------------ |
| `total_accept_count` | Total number of accepts  |
| `total_reject_count` | Total number of rejects  |
| `total_shown_count`  | Total banner impressions |

---

## API Endpoint Used

The connector retrieves data from:

```
https://cookie-script.com/api/open/v1/analytics/looker-studio
```

Parameters:

| Parameter  | Description |
| ---------- | ----------- |
| `id`       | Item ID     |
| `dateFrom` | Start date  |
| `dateTo`   | End date    |

Authentication is performed using a **Bearer API Token**.

---

## How It Works

1. Looker Studio requests configuration parameters.
2. The connector collects:

   * API Token
   * Item ID
3. Looker Studio passes a date range.
4. The connector calls the CookieScript API.
5. The API response is transformed into Looker Studio rows and fields.

---

## Deployment

1. Open **Google Apps Script**
2. Create a new project
3. Paste the connector code into `Code.gs`
4. Configure `appsscript.json`
5. Deploy as a **Looker Studio Community Connector**

---

## Security

* API tokens are passed via the **Authorization Bearer header**
* Tokens are not stored by the connector
* All requests are made using HTTPS

---

## License

MIT License

---

## About CookieScript

CookieScript is a **Consent Management Platform (CMP)** that helps websites comply with privacy regulations such as **GDPR**, **CCPA**, and **ePrivacy Directive** by managing cookie consent banners and tracking user consent preferences.

Learn more:
https://cookie-script.com
