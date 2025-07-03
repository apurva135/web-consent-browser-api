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

class CMP {
  constructor(name, config) {
    let self = this;

    this.name = name;

    this.detectors = [];
    config.detectors.forEach((detectorConfig) => {
      self.detectors.push(new Detector(detectorConfig));
    });

    this.methods = new Map();
    config.methods.forEach((methodConfig) => {
      if (methodConfig.action != null) {
        let action = Action.createAction(methodConfig.action, this);
        action.customMethod = methodConfig.custom;
        self.methods.set(methodConfig.name, action);
      }
    });

    this.hiddenTargets = [];
    this.observers = [];
  }

  stopObservers() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
  }

  unHideAll() {
    let ourStyles = [
      "position",
      "left",
      "top",
      "right",
      "bottom",
      "transform",
      "transform-origin",
      "transition",
      "contain",
      "border",
      "box-shadow",
      "z-index",
      "animation",
      "grid-column",
      "grid-row",
    ];

    this.hiddenTargets.forEach((target) => {
      target.classList.remove("ConsentOMatic-CMP-Hider");
      target.classList.remove("ConsentOMatic-CMP-PIP");

      //Find styles we have not set

      if (typeof target.savedStyles !== "undefined") {
        let styleAttrSplit = target
          .getAttribute("style")
          .split(";")
          .filter((style) => {
            return style.trim().length > 0;
          });

        let notOurStyles = [];

        styleAttrSplit.forEach((style) => {
          style = style.trim();
          if (style.length > 0 && style.indexOf(":") !== -1) {
            let styleSplit = style.split(":");
            let name = styleSplit[0].trim();
            let value = styleSplit[1].trim();

            if (!ourStyles.includes(name)) {
              notOurStyles.push({ name, value });
            }
          }
        });

        //Reload saved styles
        if (target.savedStyles === null) {
          target.removeAttribute("style");
        }
        target.setAttribute("style", target.savedStyles);

        //Set styles again, we did not set
        notOurStyles.forEach(({ name, value }) => {
          target.style.setProperty(name, value);
        });
      }
    });
  }

  detect() {
    if (ConsentEngine.debugValues.debugLog) {
      console.groupCollapsed("Testing:", this.name);
    }
    try {
      let detector = this.detectors.find((detector) => {
        return detector.detect();
      });

      if (detector != null && ConsentEngine.debugValues.debugLog) {
        console.log("Triggered detector: ", detector);
      }

      if (ConsentEngine.debugValues.debugLog) {
        console.groupEnd();
      }

      return detector != null;
    } catch (e) {
      if (ConsentEngine.debugValues.debugLog) {
        console.warn(e);
        console.groupEnd();
      }
    }

    return false;
  }

  isShowing() {
    let detector = this.detectors.find((detector) => {
      return detector.detect();
    });

    return detector.isShowing();
  }

  isUtility() {
    return this.methods.has("UTILITY") && this.methods.size === 1;
  }

  hasMethod(name) {
    return this.methods.has(name);
  }

  isCustomMethod(name) {
    let action = this.methods.get(name);

    if (action != null) {
      return action.customMethod === true;
    }

    return false;
  }

  async runMethod(name, param = null) {
    let action = this.methods.get(name);
    // chrome.storage.local.set({ sample: name, action: action, param: param });
    /* D: Information Storage and Access
     * A: Preferences and Functionality
     * B: Performance and Analytics
     * E: Content selection, delivery, and reporting
     * F: Ad selection, delivery, and reporting
     * X: Other Purposes*/
    function getCookieOptions(inputOptions) {
      const options = {
        "Preferences and Functionality": inputOptions["A"] || false,
        "Performance and Analytics": inputOptions["B"] || false,
        "Information Storage and Access": inputOptions["D"] || false,
        "Content selection, delivery, and reporting":
          inputOptions["E"] || false,
        "Ad selection, delivery, and reporting": inputOptions["F"] || false,
        "Other Purposes": inputOptions["X"] || false,
      };

      return options;
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
      if (window.performance && typeof window.performance.now === "function") {
        d += performance.now(); // Use high-precision timer if available
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          let r = (d + Math.random() * 16) % 16 | 0;
          d = Math.floor(d / 16);
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        }
      );
    }

    async function storeConsentReceipt(consentReceipt) {
      await chrome.storage.local.get(["receiptDPV"], async function (result) {
        let receiptDPV = result.receiptDPV || [];
        const currentUrl = window.location.hostname;
        const baseId = currentUrl;

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
          if (areAllOptionsTrue(param)) {
            newReceipt["dpv:hasConsentStatus"][0]["@type"] = "dpv:ConsentGiven";
          } else {
            newReceipt["dpv:hasConsentStatus"][0]["@type"] =
              "dpv:ConsentNotGiven";
          }
        } else {
          // Create new receipt
          const newReceipt = JSON.parse(JSON.stringify(consentReceipt)); // Deep clone
          newReceipt["@id"] = generateUniqueId(baseId, receiptDPV);
          newReceipt["dct:created"] = new Date().toISOString();
          newReceipt["dct:modified"] = new Date().toISOString();
          newReceipt["dct:identifier"] = generateUUID();
          newReceipt["dpv:hasProcess"][0]["dpv:hasPurpose"] =
            getCookieOptions(param);
          newReceipt["dpv:hasNotice"][0]["@id"] = window.location.href;
          if (areAllOptionsTrue(param)) {
            newReceipt["dpv:hasConsentStatus"][0]["@type"] = "dpv:ConsentGiven";
          } else {
            newReceipt["dpv:hasConsentStatus"][0]["@type"] =
              "dpv:ConsentNotGiven";
          }
          let currentDate = new Date();
          // Add one year to the current date
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          // Convert the new date to ISO format
          let newDateISO = currentDate.toISOString();
          newReceipt["dct:valid"] = newDateISO;
          receiptDPV.push(newReceipt);
        }

        await chrome.storage.local.set({ receiptDPV: receiptDPV }, function () {
          console.log("Consent receipt stored successfully.");
        });
      });
    }
    //storeConsentReceipt(consentReceiptSkeleton);
    // Call the function to store the consent receipt
    // console.log({ name, action, param }, "runmethod");
    // console.log(getCookieOptions(param), "returned actions");
    GDPRConfig.getReceipt().then(async (entries) => {
      console.log("recipts", entries);
      var web = window.location.host;
      entries[web] = entries[web] || {};
      entries[web]["cookies"] = getCookieOptions(param);
      await GDPRConfig.setReceipt(entries);
      console.log("Updated receipt with new labelName:", entries);
      //   if (!entries[web]['cookies']) {
      // entries[web]['cookies'] = getCookieOptions(param);
      // await GDPRConfig.setReceipt(entries);
      // console.log("Updated receipt with new labelName:", entries);
      //   } else {
      //     console.log(
      //       "LabelName already exists in the receipt and changes refelected"
      //     );
      //   }
    });
    if (action != null) {
      if (!this.isCustomMethod(name)) {
        ConsentEngine.singleton.currentMethodStepsTotal =
          this.getNumStepsForMethod(name);
      }

      if (ConsentEngine.debugValues.debugLog) {
        console.log("Triggering method: ", name);
      }
      await action.execute(param);

      if (!this.isCustomMethod(name)) {
        ConsentEngine.singleton.currentMethodDone();
      }
    } else {
      //Make no method behave as if an action was called, IE. push os back on the task stack
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 0);
      });
    }
  }

  getNumStepsForMethod(method) {
    let action = this.methods.get(method);

    if (action != null) {
      return action.getNumSteps();
    }

    return 0;
  }

  getNumSteps() {
    let totalSteps = 0;

    this.methods.forEach((action, name) => {
      if (name !== "UTILITY") {
        let steps = action.getNumSteps();

        if (name === "HIDE_CMP") {
          //Hide CMP is called twice
          totalSteps += 2 * steps;
        } else {
          totalSteps += steps;
        }
      }
    });

    return totalSteps;
  }
}

export { CMP };
