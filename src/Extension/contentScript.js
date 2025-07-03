async function contentScriptRunner() {
  //Load all dependencies from modules
  async function loadModule(file) {
    let module = await import(file);

    Object.keys(module).forEach((exportName) => {
      window[exportName] = module[exportName];
    });
  }

  await loadModule("./GDPRConfig.js");
  await loadModule("./Tools.js");
  await loadModule("./Language.js");
  await loadModule("./Action.js");
  await loadModule("./Matcher.js");
  await loadModule("./Detector.js");
  await loadModule("./Consent.js");
  await loadModule("./CMP.js");
  await loadModule("./ConsentEngine.js");

  let url = location.href;

  let insideIframe = window !== window.parent;

  if (insideIframe) {
    //We are inside an iframe, request the actual tab url to check if we are active
    url = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage("GetTabUrl", (response) => {
        resolve(response);
      });
    });
  }

  url = url.substring(url.indexOf("://") + 3, url.indexOf("/", 8));

  GDPRConfig.isActive(url).then(async (active) => {
    if (active) {
      chrome.runtime.sendMessage("GetRuleList", (fetchedRules) => {
        GDPRConfig.getCustomRuleLists().then((customRules) => {
          fetchedRules.forEach((ruleObj) => {
            delete ruleObj["$schema"];
          });
          delete customRules["$schema"];

          // Concat rule-lists to engine config in order
          let config = Object.assign({}, ...fetchedRules, customRules);

          GDPRConfig.getConsentValues().then((consentTypes) => {
            GDPRConfig.getDebugValues().then((debugValues) => {
              GDPRConfig.getGeneralSettings().then((generalSettings) => {
                if (debugValues.debugLog) {
                  console.log("FetchedRules:", fetchedRules);
                  console.log("CustomRules:", customRules);
                }

                ConsentEngine.debugValues = debugValues;
                ConsentEngine.generalSettings = generalSettings;
                ConsentEngine.topFrameUrl = url;

                let engine = new ConsentEngine(config, consentTypes, (evt) => {
                  let result = {
                    handled: evt.handled,
                  };

                  if (evt.handled) {
                    result.cmp = evt.cmpName;
                    result.clicks = evt.clicks;
                    result.url = url;

                    chrome.runtime.sendMessage(
                      "HandledCMP|" + JSON.stringify(result)
                    );
                  }

                  if (debugValues.scrapingMode) {
                    // Set debug data for scraper to use
                    try {
                      document
                        .querySelector("html")
                        .setAttribute(
                          "data-consentOMatic",
                          JSON.stringify(result)
                        );
                    } catch (e) {
                      console.error("Unable to set 'data-consentOMatic':", e);
                    }
                  }
                });

                ConsentEngine.singleton = engine;

                if (debugValues.debugLog) {
                  console.log(
                    "ConsentEngine loaded " +
                      engine.cmps.length +
                      " of " +
                      Object.keys(config).length +
                      " rules"
                  );
                }

                extractPolicyText();
              });
            });
          });
        });
      });
    }
  });
}


function getPolicyText() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 10; 
    const interval = 500; 

    const checkPolicyText = () => {
      const policyElement = document.getElementById('onetrust-policy-text');
      if (policyElement) {
        resolve(policyElement.textContent.trim());
        return;
      }

      const policyElements = document.getElementById('ot-pc-desc');
      if (policyElements) {
        resolve(policyElements.textContent.trim());
        return;
      }

      if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkPolicyText, interval);
      } else {
        resolve("No policy text found");
      }
    };

    checkPolicyText();
  });
}

async function extractPolicyText() {

  const cookies =  document.getElementsByClassName('ot-sdk-container').length >= 1
  console.log(cookies,"cookiesssss");


  const delayInMilliseconds = 200;

  setTimeout(() => 
  {

  GDPRConfig.getConsentReceipt().then(async (entries) => 
    {
      for (const website in entries) {
        console.log(entries[website]["@id"].split("/")[0],"url")
        console.log(window.location.hostname,"domainName")
       
        const websiteUrl = entries[website]["@id"].split("/")[0];
        console.log(entries[website]["dpv:hasConsentStatus"][0]["@type"], "consentStatus");
        const domainName = window.location.hostname;
        if(domainName==websiteUrl)
        {
          consentStatus = entries[website]["dpv:hasConsentStatus"][0]["@type"]
          const status =
          entries[website]["dpv:hasConsentStatus"][0]["@type"] ==
          "dpv:ConsentGiven"
            ? "Accepted"
            : "Rejected";

            if(cookies)
              {
                console.log(cookies,"cookies")
            
                try {
                
                  const policyText = await getPolicyText();
                  const dataToSend = {
                    url: domainName,
                    context: policyText
                  };
              
                  const cookieData = [{
                    number: 1,
                    url: domainName,
                    question: policyText,
                    answer: status
                  }];
              
              
                  if (policyText !== "No policy text found") {
                    try {
                      const submitConsentResponse = await fetch('http://localhost:5000/submit-consent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cookieData)
                      });
              
                      const submitConsentData = await submitConsentResponse.json();
                      console.log('Response from server:', submitConsentData);
              
                      // Only proceed to predict-cookies if submit-consent was successful
                      const predictCookiesResponse = await fetch('http://localhost:5000/predict-cookies', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ data: dataToSend })
                      });
              
                      if (!predictCookiesResponse.ok) {
                        throw new Error('Network response was not ok');
                      }
              
                      const predictCookiesData = await predictCookiesResponse.json();
                      console.log('Response from server:', predictCookiesData);
              
                      if (predictCookiesData.status === 'success' && (predictCookiesData.prediction === 'accept' || predictCookiesData.prediction === 'reject')) {
                        const notification = document.createElement('div');
                        notification.textContent = `Based on our analysis, we advise you should ${predictCookiesData.prediction} these cookies !!`;
                        notification.style.position = 'fixed';
                        notification.style.top = '10px';
                        notification.style.left = '50%';
                        notification.style.transform = 'translateX(-50%)';
                        notification.style.padding = '10px 20px';
                        notification.style.background = 'black';
                        notification.style.fontFamily = "Times New Roman, Times, serif";
                        notification.style.fontSize = 'x-large';
                        notification.style.color = 'white';
                        notification.style.borderRadius = '10px';
                        notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                        notification.style.zIndex = '10000';
                        document.body.appendChild(notification);
              
                        setTimeout(() => {
                          document.body.removeChild(notification);
                        }, 8000);
                      }
                    } catch (error) {
                      console.error('Error in submitting consent or predicting cookies:', error);
                    }
                  } else {
                    console.log("Error fetching the cookies policy");
                  }
                } catch (error) {
                  console.error('Error in extractPolicyText:', error);
                }
              }
        }
      }
    });
    }, delayInMilliseconds);
  }
  
  






window.consentScrollBehaviours = {};
function getCalculatedStyles() {
  ["html", "html body"].forEach((element) => {
    let node = document.querySelector(element);
    if (node) {
      let styles = window.getComputedStyle(node);
      window.consentScrollBehaviours[
        element + ".consent-scrollbehaviour-override"
      ] = ["position", "overflow", "overflow-y"].map((property) => {
        return { property: property, value: styles[property] };
      });
    }
  });
}

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.matches != null && node.matches("body")) {
        getCalculatedStyles();
        observer.disconnect();
      }
    });
  });
});

observer.observe(document.querySelector("html"), {
  childList: true,
});

window.addEventListener("message", (event) => {
  try {
    if (event.data.enforceScrollBehaviours != null) {
      ConsentEngine.enforceScrollBehaviours(event.data.enforceScrollBehaviours);
    }
  } catch (e) {
    console.error("Error inside message listener:", e);
  }
});

function displayPopup(data) {
  // Create the popup container
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "10%";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.backgroundColor = "white";
  popup.style.border = "1px solid black";
  popup.style.padding = "20px";
  popup.style.zIndex = "9999";
  popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
  popup.style.width = "300px";

  // Create and append the heading
  const heading = document.createElement("h1");
  heading.textContent = data.title;
  popup.appendChild(heading);

  // Create and append the ordered list
  const list = document.createElement("ol");
  data.listItems.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.appendChild(listItem);
  });
  popup.appendChild(list);

  // Create and append the link
  const link = document.createElement("a");
  link.href = data.link;
  link.textContent = "Click here";
  link.target = "_blank";
  popup.appendChild(link);

  // Append the popup to the body
  document.body.appendChild(popup);
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "getURL") {
//     sendResponse({ url: window.location.href });
//   }
// });

contentScriptRunner().catch((e) => {
  console.error(e);
});
