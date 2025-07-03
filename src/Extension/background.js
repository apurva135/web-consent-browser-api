import { GDPRConfig } from "./GDPRConfig.js";

const consentReceiptSkeleton = {
  "@context": "",
  "@id": "",
  "@type": "dpv:ConsentRecord",
  "dct:conformsTo": "https://w3id.org/dpv/schema/iso-27560",
  "dct:identifier": "a6f58318-72e6-46a2-bfd7-f36d795e30cd",
  "dpv:hasDataSubject": {
    "@id": "",
    "@type": "dpv:UserSubject",
    "dct:identifier": "",
  },
  "dct:created": "2023-05-01",
  "dct:modified": "2023-05-02",
  "dct:creator": "",
  "dct:publisher": "",
  "dct:accessRights": "Internal use only",
  "dct:contributor": "DPO",
  "dct:hasVersion": "1.0",
  "dct:replaces": "",
  "dct:valid": "2024-05-01",
  "dpv:hasNotice": [
    {
      "@id": "",
      "@type": "dpv:ConsentNotice",
      "dct:language": "EN",
    },
  ],
  "dpv:hasProcess": [
    {
      "@type": "dpv:PersonalDataHandling",
      "dpv:hasPurpose": {},
      "dpv:hasPersonalData": [
        {
          "@type": "",
          "dct:description": "",
        },
      ],
      "dpv:hasRecipient": [
        {
          "@type": "dpv:Recipient",
          "@id": "",
          "dpv:hasLocation": "loc:EU",
        },
      ],
      "dpv:hasConsentManagement": [
        {
          "@type": "dpv:WithdrawConsent",
          "dpv:isExercisedAt": "",
        },
      ],
      "dpv:hasJurisdiction": "loc:EU",
      "dpv:hasRight": [
        {
          "@type": "dpv:DataSubjectRight",
          "dct:title": "Right to Withdraw Consent",
          "dpv:isExercisedAt": "",
          "dpv:hasApplicableLaw": "dpv-gdpr:GDPR",
          "dpv:hasJurisdiction": "loc:EU",
        },
      ],
      "dpv:hasAssessment": {
        "@type": "dpv:DPIA",
        "schema:url": "",
      },
    },
  ],
  "dpv:hasEntity": [
    {
      "@id": "",
      "@type": "dpv:DataController",
      "dpv:hasName": "",
      "schema:contactPoint": {
        "@type": "schema:ContactPoint",
        "schema:contactType": "Customer Service",
        "schema:email": "contact@",
        "schema:telephone": "",
        url: "",
        "schema:address": {
          "@type": "",
          "schema:streetAddress": "",
        },
      },
      "schema:url": "",
    },
  ],
  "dpv:hasConsentStatus": [
    {
      "@type": "dpv:ConsentGiven",
      "dpv:isIndicatedBy": "dpv:DataSubject",
      "dpv:isIndicatedAtTime": "2023-11-05T16:08:50",
      "dpv:hasDuration": {
        "@type": "dpv:TemporalDuration",
        "rdf:value": "P12M",
      },
      "dpv:hasIndicationMethod": "Agree button in dialogue",
    },
  ],
};

const purposesList = [
  "Essential Cookies",
  "Performance Cookies",
  "Functional Cookies",
  "Targeting Cookies",
  "Social Media Cookies",
  "Analytics",
  "Marketing",
  "Advertising",
  "User Preferences",
  "Security",
  "Fraud Prevention",
  "Customer Interaction",
  "Personalization",
  "Content Customization",
  "Survey Participation",
  "Transaction Processing",
  "Service Improvement",
  "Legal Compliance",
  "Data Retention",
  "Third-Party Sharing",
  "Research and Development",
  "Customer Profiling",
  "A/B Testing",
  "User Authentication",
  "Account Management",
  "Geolocation",
  "Device Information",
  "Session Management",
  "Content Delivery Networks (CDN)",
  "Data Analytics",
];

let URL_PAGE = "";

function getPurposes(purposes) {
  let purposesStatus = {};
  if (purposes && Array.isArray(purposes)) {
    purposes.forEach((purpose, index) => {
      const purposeName = purposesList[index] || `Purpose ${index + 1}`;
      if (
        purpose.TransactionType === "CONFIRMED" ||
        purpose.TransactionType === "NO_CHOICE"
      ) {
        purposesStatus[purposeName] = true;
      } else {
        purposesStatus[purposeName] = false;
      }
    });
  } else {
    console.log("Purposes array not found or is not in expected format");
  }
  return purposesStatus;
}

function areAllOptionsTrue(inputOptions) {
  const options = getCookieOptions(inputOptions);

  for (const key in options) {
    if (options[key]) {
      return true;
    }
  }

  return false;
}
function generateUniqueId(baseId, receiptDPV) {
  let counter = 1;
  let newId = `${baseId}/${counter}`;
  while (receiptDPV.some((receipt) => receipt["@id"] === newId)) {
    counter++;
    newId = `${baseId}/${counter}`;
  }
  return newId;
}

function generateUUID() {
  let d = new Date().getTime();
  d += performance.now(); // Use high-precision timer if available
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function storeConsentReceipt(consentReceipt, json = {}) {
  // const newReceipt = consentReceiptSkeleton;
  await chrome.storage.local.get(["receipt_DPV"], async function (result) {
    let receiptDPV = result.receipt_DPV || [];
    // const currentUrl = window.location.hostname;
    const baseId = URL_PAGE;

    const now = new Date().getTime();
    let existingReceiptIndex = receiptDPV.findIndex((receipt) => {
      // const creationTime = new Date(receipt["dct:created"]).getTime();&& now - creationTime <= 60000
      return receipt["@id"].startsWith(baseId); // 60 seconds
    });

    if (existingReceiptIndex !== -1) {
      // Update existing receipt
      receiptDPV[existingReceiptIndex] = {
        ...consentReceipt,
        ...receiptDPV[existingReceiptIndex],
      };
      receiptDPV[existingReceiptIndex]["dct:modified"] =
        new Date().toISOString();
      let anyConfirmed = false;
      if (json.purposes && Array.isArray(json.purposes)) {
        anyConfirmed = json.purposes.some(
          (purpose) => purpose.TransactionType === "CONFIRMED"
        );
      }
      // if (areAllOptionsTrue(param)) {
      //   newReceipt["dpv:hasConsentStatus"][0]["@type"] = "dpv:ConsentGiven";
      // } else {
      //   newReceipt["dpv:hasConsentStatus"][0]["@type"] = "dpv:ConsentNotGiven";
      // }
      if (anyConfirmed) {
        console.log("Given", receiptDPV);
        receiptDPV[existingReceiptIndex]["dpv:hasConsentStatus"][0]["@type"] =
          "dpv:ConsentGiven";
      } else {
        console.log("not Given", receiptDPV);
        receiptDPV[existingReceiptIndex]["dpv:hasConsentStatus"][0]["@type"] =
          "dpv:ConsentNotGiven";
      }
    } else {
      // Create new receipt
      const newReceipt = JSON.parse(JSON.stringify(consentReceipt)); // Deep clone
      newReceipt["@id"] = generateUniqueId(baseId, receiptDPV);
      newReceipt["dct:created"] = new Date().toISOString();
      newReceipt["dct:modified"] = new Date().toISOString();
      newReceipt["dct:identifier"] = generateUUID();
      // newReceipt["dpv:hasProcess"][0]["dpv:hasPurpose"] = getCookieOptions(param);
      const choices = getPurposes(json.purposes);
      newReceipt["dpv:hasProcess"][0]["dpv:hasPurpose"] = choices;
      newReceipt["dpv:hasNotice"][0]["@id"] = URL_PAGE;
      let anyConfirmed = false;
      if (json.purposes && Array.isArray(json.purposes)) {
        anyConfirmed = json.purposes.some(
          (purpose) => purpose.TransactionType === "CONFIRMED"
        );
      }
      if (anyConfirmed) {
        newReceipt["dpv:hasConsentStatus"][0]["@type"] = "dpv:ConsentGiven";
      } else {
        newReceipt["dpv:hasConsentStatus"][0]["@type"] = "dpv:ConsentNotGiven";
      }
      // if (areAllOptionsTrue(param)) {
      //   newReceipt["dpv:hasConsentStatus"][0]["@type"] = "dpv:ConsentGiven";
      // } else {
      //   newReceipt["dpv:hasConsentStatus"][0]["@type"] = "dpv:ConsentNotGiven";
      // }
      let currentDate = new Date();
      // Add one year to the current date
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      // Convert the new date to ISO format
      let newDateISO = currentDate.toISOString();
      newReceipt["dct:valid"] = newDateISO;
      receiptDPV.push(newReceipt);
    }

    await chrome.storage.local.set({ receipt_DPV: receiptDPV }, function () {
      console.log("Consent receipt stored successfully.");
    });
  });
}
// storeConsentReceipt(consentReceiptSkeleton);





chrome.webNavigation.onCompleted.addListener(function(details) {
  if (details.frameId === 0) { // Only run for the main frame
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ['contentScript.js']
    });
  }
}, { url: [{ urlMatches: 'http(s)?://.*' }] });




chrome.runtime.onMessage.addListener(function (message, sender, reply) {
  switch (message.split("|")[0]) {
    case "GetTabUrl": {
      reply(sender.tab.url);
      URL_PAGE = sender.tab.url
        .substring(0, sender.tab.url.indexOf("/", 8))
        .split("//")[1];
      // console.log("URL new", URL_PAGE);
      return Promise.resolve("Response already sent...");
    }

    case "GetRuleList": {
      GDPRConfig.getDebugValues().then((debugValues) => {
        fetchRules(debugValues.alwaysForceRulesUpdate).then((rules) => {
          reply(rules);
        });
      });
      //Return true to keep reply working after method has ended, async response
      return true;
    }

    case "GetCustomRuleList": {
      GDPRConfig.getCustomRuleLists().then((customRules) => {
        reply(customRules);
      });
      //Return true to keep reply working after method has ended, async response
      return true;
    }

    case "AddCustomRule": {
      let newRule = JSON.parse(message.substring(message.indexOf("|") + 1));

      GDPRConfig.getCustomRuleLists().then((customRules) => {
        let combinedCustomRules = Object.assign({}, customRules, newRule);

        GDPRConfig.setCustomRuleLists(combinedCustomRules);
      });

      return false;
    }

    case "DeleteCustomRule": {
      let deleteRule = message.split("|")[1];

      GDPRConfig.getCustomRuleLists().then((customRules) => {
        delete customRules[deleteRule];

        GDPRConfig.setCustomRuleLists(customRules).then(() => {
          reply();
        });
      });

      return true;
    }

    case "HandledCMP": {
      let json = JSON.parse(message.split("|")[1]);

      setBadgeCheckmark(true, sender.tab.id);
      GDPRConfig.getStatistics().then((entries) => {
        entries.clicks += json.clicks;
        // entries.website = window.location.host;
        if (!entries.cmps.hasOwnProperty(json.cmp)) {
          entries.cmps[json.cmp] = {
            filledForms: 0,
            clicks: 0,
          };
        }
        entries.cmps[json.cmp].filledForms++;
        entries.cmps[json.cmp].clicks += json.clicks;
        entries.cmps[json.cmp].website = sender.tab.url;
        GDPRConfig.setStatistics(entries);
      });

      return false;
    }

    default:
      console.warn("Unhandled message:", message);
  }
});

function setBadgeCheckmark(enabled, id) {
  let text = "";

  if (enabled) {
    text = "\u2714";
  }

  chrome.action.setBadgeText({
    text: text,
    tabId: id,
  });

  chrome.action.setBadgeBackgroundColor({
    color: "white",
    tabId: id,
  });
}

function fetchRules(forceUpdate) {
  // Make sure the cached rule-lists are up-to-date, fetch updates if needed
  let maxStaleness = 22 * 3600 + Math.random() * 26 * 3600; // Fetch frequency in seconds
  let rulePromise = new Promise((resolve, reject) => {
    GDPRConfig.getRuleLists().then((ruleLists) => {
      let oldDefaultListIndex = ruleLists.indexOf(
        "https://raw.githubusercontent.com/cavi-au/Consent-O-Matic/master/Rules.json"
      );

      if (oldDefaultListIndex !== -1) {
        console.log(
          "Cleaning old rule list, and replacing with new reference based list..."
        );
        ruleLists[oldDefaultListIndex] =
          "https://raw.githubusercontent.com/cavi-au/Consent-O-Matic/master/rules-list.json";
        GDPRConfig.setRuleLists(ruleLists);
      }

      chrome.storage.local.get(
        { cachedEntries: {} },
        async function ({ cachedEntries: cachedEntries }) {
          let rules = [];
          for (let ruleList of ruleLists) {
            let entry = cachedEntries[ruleList];

            // Check for cache
            if (
              !forceUpdate &&
              entry != null &&
              "timestamp" in entry &&
              Date.now() / 1000 - entry.timestamp < maxStaleness &&
              "rules" in entry
            ) {
              rules.push(entry.rules);
            } else {
              // No cache, or to old, try to fetch
              let theList = await fetchRulesList(ruleList);

              if (theList != null) {
                let storedEntry = {};
                rules.push(theList);
                cachedEntries[ruleList] = {
                  timestamp: Date.now() / 1000,
                  rules: theList,
                };
              } else {
                //Reuse cached entry even though its out of date at this point
                if (entry != null) {
                  rules.push(entry.rules);
                }
              }
            }
          }

          chrome.storage.local.set(
            {
              cachedEntries: cachedEntries,
            },
            () => {
              resolve(rules);
            }
          );
        }
      );
    });
  });

  return rulePromise;
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status != null && info.status === "Loading") {
    setBadgeCheckmark(false, tabId);
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.includes("consentreceipts")) {
      console.log("Request URL:", details.url);
      if (details.requestBody) {
        if (details.requestBody.formData) {
          console.log(
            "Request Payload (Form Data):",
            details.requestBody.formData
          );
        } else if (details.requestBody.raw) {
          const decoder = new TextDecoder("utf-8");
          const body = details.requestBody.raw
            .map((entry) => decoder.decode(entry.bytes))
            .join("");
          try {
            const jsonPayload = JSON.parse(body);
            console.log("jsonPayload", jsonPayload);
            storeConsentReceipt(consentReceiptSkeleton, jsonPayload);
            console.log("href", location.href);
            // const purposes = jsonPayload.purposes;
            // console.log("Purposes Status:", purposesStatus);
          } catch (error) {
            console.error("Failed to parse JSON:", error, "Raw Body:", body);
          }
        }
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    if (details.url.includes("consentreceipts")) {
      console.log("Request Headers:", details.requestHeaders);
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

async function fetchRulesList(ruleList) {
  try {
    let response = await fetch(ruleList, { cache: "no-store" });
    let theList = await response.json();

    let theMergedList = Object.assign({}, theList);
    delete theMergedList.references;

    //If references is present, fetch those and merge into big json object
    if (theList.references != null) {
      let promises = [];
      for (let ref of theList.references) {
        promises.push(fetchRulesList(ref));
      }

      let lists = await Promise.all(promises);

      lists.forEach((list) => {
        Object.assign(theMergedList, list);
      });
    }

    return theMergedList;
  } catch (e) {
    console.warn("Error fetching rulelist: ", ruleList, e.message);
  }

  return null;
}
