async function loadModule(file) {
  let module = await import(file);

  Object.keys(module).forEach((exportName) => {
    window[exportName] = module[exportName];
  });
}

async function runMethod() {
  await loadModule("./GDPRConfig.js");
  await loadModule("./Language.js");

  let optionsUL = document.querySelector(".configurator ul.categorylist");
  let ruleUL = document.querySelector(".configurator .tab_rl .rulelist");
  let debugUL = document.querySelector(".configurator .tab_dbg ul.flags");
  let aboutTable = document.querySelector(
    ".configurator .tab_about table.logList"
  );

  let consentCards = document.querySelector(
    ".configurator .tab_consent div.cards"
  );

  let consentTbody = document.querySelector(
    ".configurator .table_consent div.consent-table table tbody"
  );

  optionsUL.innerHTML = "";

  let menuTabs = document.querySelectorAll(".header .menuitem");

  menuTabs.forEach((menuTab) => {
    menuTab.addEventListener("click", (evt) => {
      tabChanged(menuTab);
    });

    menuTab.addEventListener("keydown", (evt) => {
      console.log(evt.code);

      let newTab = null;

      if (evt.code === "ArrowRight") {
        newTab = menuTab.nextElementSibling;
        if (newTab == null) {
          newTab = menuTabs[0];
        }
      } else if (evt.code === "ArrowLeft") {
        newTab = menuTab.previousElementSibling;
        if (newTab == null) {
          newTab = menuTabs[menuTabs.length - 1];
        }
      }
      if (newTab != null) {
        tabChanged(newTab);
      }
    });
  });

  GDPRConfig.getGeneralSettings().then((generalSettings) => {
    let hideOrPipForm = document.querySelector("#generalTab #hideOrPip");
    let hideOrPipRadioGroup = hideOrPipForm.elements["hideOrPip"];
    if (generalSettings.hideInsteadOfPIP) {
      hideOrPipRadioGroup.value = "hide";
    } else {
      hideOrPipRadioGroup.value = "pip";
    }

    function saveGeneralSettings() {
      const newGeneralSettings = {
        hideInsteadOfPIP: hideOrPipRadioGroup.value === "hide",
      };

      GDPRConfig.setGeneralSettings(newGeneralSettings);
    }

    hideOrPipForm.addEventListener("input", () => {
      saveGeneralSettings();
    });
  });

  GDPRConfig.getConsentTypes().then((consentTypes) => {
    consentTypes.forEach((consentType) => {
      addToggleItem(
        optionsUL,
        consentType.type,
        consentType.name,
        consentType.description,
        consentType.value
      );
    });
  });

  GDPRConfig.getDebugFlags().then((debugFlags) => {
    debugFlags.forEach((debugFlag) => {
      let optionLi = addToggleItem(
        debugUL,
        debugFlag.name,
        debugFlag.name,
        debugFlag.description,
        debugFlag.value
      );
      let input = optionLi.querySelector("input");
      input.addEventListener("input", function (evt) {
        if (this.checked) {
          this.parentNode.parentNode.classList.add("active");
        } else {
          this.parentNode.parentNode.classList.remove("active");
        }
        saveSettings();
      });

      if (input.checked) {
        optionLi.classList.add("active");
      }
    });
  });

  document.querySelector("#clearDebugFlags").addEventListener("click", () => {
    GDPRConfig.setDebugFlags({}).then(() => {
      GDPRConfig.getDebugFlags().then((debugFlags) => {
        debugFlags.forEach((debugFlag) => {
          let optionLi = document.querySelector(
            "ul.flags li[data-name='" + debugFlag.name + "']"
          );
          let input = optionLi.querySelector("input");
          input.checked = debugFlag.value;
          if (!debugFlag.value) {
            optionLi.classList.remove("active");
          }
        });
      });
    });
  });

  function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  }
  function addToggleItem(parent, type, name, description, isChecked) {
    let optionLI = document.createElement("li");
    optionLI.setAttribute("data-name", name);

    let uuid = uuidv4();

    const optionHtml = `
            <label class="slider" for="${type}">
                    <input type="checkbox" id="${type}" ${
      isChecked ? "checked" : ""
    }>
                    <div class="knob" role="checkbox" aria-checked="${
                      isChecked ? "true" : "false"
                    }" tabindex="0" aria-labelledby="${uuid}"></div>
            </label>
            <h2 id=${uuid}>${name}</h2>
            <div class="category_description">
    ${description}
            </div>`;

    let parser = new DOMParser();
    let parsed = parser.parseFromString(optionHtml, "text/html");
    let children = parsed.querySelector("body");

    for (let child of children.childNodes) {
      optionLI.appendChild(child);
    }

    function toggleInput() {
      let input = optionLI.querySelector("input");
      input.checked = !input.checked;
      optionLI
        .querySelector(".knob")
        .setAttribute("aria-checked", "" + input.checked);
      if (input.checked) {
        optionLI.classList.add("active");
      } else {
        optionLI.classList.remove("active");
      }
      saveSettings();
    }

    parent.appendChild(optionLI);
    optionLI.addEventListener("click", function (evt) {
      toggleInput();
      evt.stopPropagation();
    });
    optionLI.addEventListener("keydown", function (evt) {
      if (evt.code === "Space") {
        toggleInput();
        evt.stopPropagation();
      }
    });
    return optionLI;
  }

  function updateRuleList() {
    GDPRConfig.getRuleLists().then((ruleLists) => {
      ruleUL.innerHTML = "";
      ruleLists.forEach((ruleList) => {
        let optionLI = document.createElement("li");
        let button = document.createElement("button");
        let link = document.createElement("span");
        link.innerText = ruleList;
        button.innerText = "X";
        optionLI.appendChild(button);
        optionLI.appendChild(link);
        ruleUL.appendChild(optionLI);

        button.addEventListener("click", function () {
          GDPRConfig.removeRuleList(ruleList).then(() => {
            updateRuleList();
          });
        });
      });
    });
  }

  updateRuleList();

  document.querySelector("#urladd").addEventListener("click", function (evt) {
    let ruleList = document.querySelector("#newurl").value;
    document.querySelector("#newurl").value = "";
    GDPRConfig.addRuleList(ruleList).then(() => {
      updateRuleList();
    });
  });

  document.querySelector("#forceupdate").addEventListener("click", () => {
    GDPRConfig.clearRuleCache();
  });

  function tabChanged(target) {
    let oldTab = document.querySelector(".header .menuitem[tabindex='0']");
    if (oldTab != null) {
      oldTab.setAttribute("tabindex", -1);
    }

    menuTabs.forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", false);
    });
    document.querySelectorAll(".tab").forEach((item) => {
      item.style.display = "none";
    });
    target.classList.add("active");
    target.setAttribute("aria-selected", true);
    target.setAttribute("tabindex", 0);

    document.querySelectorAll(".configurator .tab").forEach((tab) => {
      tab.style.display = "none";
    });

    document.getElementById(
      target.getAttribute("aria-controls")
    ).style.display = "block";

    target.focus();

    updateLog();
  }

  function saveSettings() {
    let consentValues = {};
    optionsUL.querySelectorAll("li input").forEach((input) => {
      consentValues[input.id] = input.checked;
    });
    GDPRConfig.setConsentValues(consentValues);

    let debugFlags = {};
    debugUL.querySelectorAll("li input").forEach((input) => {
      debugFlags[input.id] = input.checked;
    });
    GDPRConfig.setDebugFlags(debugFlags);
  }

  function updateLog() {
    aboutTable.querySelectorAll("tr:not(:first-child)").forEach((el) => {
      el.remove();
    });
    GDPRConfig.getStatistics().then((entries) => {
      document.querySelector("#clicks").innerText = entries.clicks;

      for (const [cmp, stats] of Object.entries(entries.cmps)) {
        let tr = document.createElement("tr");
        let cell = document.createElement("td");
        cell.innerText = stats.website;
        tr.appendChild(cell);
        cell = document.createElement("th");
        cell.innerText = cmp;
        tr.appendChild(cell);
        // cell = document.createElement("td");
        // cell.innerText = stats.filledForms;
        // tr.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = stats.filledForms;
        tr.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = stats.clicks;
        tr.appendChild(cell);
        aboutTable.append(tr);
      }
    });
  }
  function convertToObjectArray(obj) {
    return Object.entries(obj).map(([website, { cookies }]) => ({
      website,
      cookies: Object.entries(cookies).map(([cookie, accepted]) => ({
        name: cookie,
        accepted,
      })),
    }));
  }
  function updateConsent() {
    // consentCards.querySelectorAll("tr:not(:first-child)").forEach((el) => {
    //   el.remove();
    // });
    let data;
    GDPRConfig.getReceipt().then(async (entries) => {
      data = convertToObjectArray(entries);
      console.log("recipts", data);
      for (const website in data) {
        const card = document.createElement("div");
        card.classList.add("card");

        const websiteElement = document.createElement("div");
        websiteElement.classList.add("website");
        websiteElement.textContent = data[website].website;

        const cookiesList = document.createElement("ul");

        data[website].cookies.forEach((cookie) => {
          if (cookie.accepted) {
            const cookieItem = document.createElement("li");
            cookieItem.classList.add("cookie");
            cookieItem.textContent = cookie.name;
            cookiesList.appendChild(cookieItem);
          }
        });

        card.appendChild(websiteElement);
        card.appendChild(cookiesList);
        consentCards.appendChild(card);
      }
    });
    // const cardsContainer = document.querySelector(".cards");
  }


  function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);

    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  }

  function updateConsentTable() {
    let data;
    GDPRConfig.getConsentReceipt().then(async (entries) => {
      for (const website in entries) {
        console.log(entries[website], "web");
        let tr = document.createElement("tr");
        let cell = document.createElement("td");
        cell.innerText = +website + 1;
        tr.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = entries[website]["@id"].split("/")[0];
        tr.appendChild(cell);
        cell = document.createElement("td");
        const choice =
          entries[website]["dpv:hasConsentStatus"][0]["@type"] ==
          "dpv:ConsentGiven"
            ? "Accepted some optional cookies"
            : "Rejected optional cookies";
        cell.innerText = choice;
        tr.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = formatDate(entries[website]["dct:created"]);
        tr.appendChild(cell);
        cell = document.createElement("td");
        const button = document.createElement("button");
        button.className = "download-btn";
        button.innerText = "Download Receipt";
        button.addEventListener("click", function () {
          downloadJSON(entries[website], "dpvConsentReceipt.json");
        });
        cell.appendChild(button);
        tr.appendChild(cell);
        cell = document.createElement("td");
        const revokeBtn = document.createElement("button");
        revokeBtn.className = "revoke-btn";
        revokeBtn.innerText = "Revoke Receipt";
        revokeBtn.addEventListener("click", function () {
          // downloadJSON(entries[website], "dpvConsentReceipt.json");
          const jsonData = {
            title: "Steps to revoke a consent",
            listItems: [
              "Go to the link mentioned at the end of the dialog.",
              "When clicked, search for the 'Cookie' or 'Privacy Policy' or 'Privacy' tab at the end of the website, click on the same",
              "Use Ctrl + F (Windows) or Cmd + F (Mac) to search for 'cookie' and click on 'Cookie Settings'",
              "Turn off all the unwanted consents and save the preference",
              "Your consent is now rejected",
            ],
            link: entries[website]["@id"].split("/")[0],
          };
          showModal(jsonData);
        });
        cell.appendChild(revokeBtn);
        tr.appendChild(cell);
        consentTbody.appendChild(tr);
      }
    });
    
    // const cardsContainer = document.querySelector(".cards");
  }

  function showModal(jsonData) {
    const modal = document.getElementById("customModal");
    const modalHeading = document.getElementById("modalHeading");
    const modalList = document.getElementById("modalList");
    const modalLink = document.getElementById("modalLink");

    modalHeading.innerText = jsonData.title;
    modalList.innerHTML = jsonData.listItems
      .map((item) => `<li>${item}</li>`)
      .join("");
    // const link = new URL();
    let link = jsonData.link;
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      link = "https://" + link; // Add the protocol if it's missing
    }
    modalLink.href = link;
    modalLink.innerText = link;
    const newModalLink = modalLink.cloneNode(true);
    modalLink.parentNode.replaceChild(newModalLink, modalLink);
    newModalLink.addEventListener("click", function (event) {
      event.preventDefault();
      window.open(link, "_blank");
    });
    modal.style.display = "flex";
    // Close the modal when the close button is clicked
    document.querySelector(".close-button").onclick = function () {
      modal.style.display = "none";
    };

    // Close the modal when the user clicks anywhere outside of the modal content
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }

  document.querySelector("#clearLog").addEventListener("click", () => {
    GDPRConfig.setStatistics({
      clicks: 0,
      cmps: {},
    }).then(() => {
      updateLog();
    });
  });

  document.querySelector("#rulesEditor").addEventListener("click", () => {
    location.href = "/editor/index.html";
  });

  Language.doLanguage();
  // updateConsent();
  updateConsentTable();



  
  function handleRadioClick(event) {
    if (event.target.value === "enable" && event.target.checked) {
      document.getElementById('consentModal').style.display = 'block';
    }
  }

  let radios = document.querySelectorAll("input[type=radio][value=enable]");
  radios.forEach(function (radio) {
    radio.addEventListener("click", handleRadioClick);
  });

  document.getElementById('submitConsentForm').addEventListener('click', function() {
    const form = document.getElementById('consentForm');
    const data = [];
    const questions = document.querySelectorAll('.consent-form div');
    let allAnswered = true;

    const questionTexts = [
      "While browsing a news website that tailors content to your interests, would you consent to the site using your personal data to personalize articles and advertisements?",
      "While shopping online, if the website offers to show recommendations based on items you viewed, would you agree to share your browsing history on their site?",
      "If an online store offers discounts in exchange for permission to sell your personal information to third parties, would you accept the offer or choose to opt out?",
      "An e-commerce app proposes to store your past purchases and browsing data to speed up future transactions and offer relevant deals. Would you consent to this data usage for a faster and more personalized shopping experience?",
      "A health app offers to track your physical activity and dietary habits to provide tailored health advice and fitness challenges. Would you permit the app to use this sensitive health data for these personalized services?",
      "During setup, a fitness tracker app asks if it can use your location and workout intensity data to suggest nearby fitness events and track your progress over time. Would you agree to share this information for enhanced functionality?",
      "A collaboration tool used at your workplace asks if it can analyze your usage patterns to suggest more efficient ways of working and customizing your user interface. Would you be comfortable with this analysis to enhance your productivity?",
      "When signing up for a new social media platform that integrates with other services, would you permit it to use your email or social profiles for seamless integration across platforms?",
      "If a mapping app offers to provide real-time traffic updates and route suggestions, do you agree to let it use your location data to deliver these services?",
      "When you visit a multimedia content platform, would you agree to share your browsing data to receive personalized content and ad recommendations across their network?",
      "Imagine you are using a professional networking site. Would you agree to share your professional data with potential employers listed on the platform for job opportunities?",
      "On a gaming platform that offers enhanced social features like live streaming and friend suggestions, do you permit it to share your gameplay activity with social media sites?",
      "If a financial management app offers to provide personalized budgeting advice based on your spending habits, would you consent to it using your transaction data for this purpose?",
      "If a consumer survey company offers you a free monthly subscription to a premium service in exchange for sharing your shopping data to analyze consumer trends, would you agree?",
      "When using a video streaming service, if it offers to use your activity data to tailor advertisements across other websites you visit, would you allow this?",
      "For a website that deals with sensitive content, would you prefer to provide your consent each time you access different categories of content?",
      "If a CRM system needs to access your data to enhance customer support services, are you willing to allow third-party service providers access to your personal data?",
      "Would you allow a research firm to use your usage data if it helps them improve user experience and develop new features for the app you frequently use?",
      "If an online marketplace uses data from your previous purchases to offer personalized deals through its affiliates, would you agree to share your purchase history?",
      "In the event of a legal investigation, would you consent to disclose your personal data to authorities if it was necessary for your safety?",
      "If a loyalty program offers exclusive deals from partner brands, would you agree to share your contact details with these selected marketing partners?",
      "If an online tool offers to synchronize your preferences across all its platforms to streamline your usage experience, would you be comfortable sharing your data across these platforms?",
      "Would you be comfortable if a cloud storage provider stores your personal data for processing and service enhancement, knowing it could improve file access speeds and reliability?"
    ];

    questions.forEach((question, index) => {
        const radios = question.querySelectorAll('input[type="radio"]');
        let answered = false;
        radios.forEach((radio) => {
            if (radio.checked) {
                data.push({ number: index + 1, question: questionTexts[index], answer: radio.value });
                answered = true;
            }
        });
        if (!answered) {
            allAnswered = false;
            alert(`Please answer question ${index + 1}`);
        }
    });

    if (allAnswered) {
        fetch('http://localhost:5000/submit-consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(response => response.json())
          .then(result => {
              if (result.status === 'success') {
                  alert('Data submitted successfully!');
                  form.reset();
                  document.getElementById('status').innerText = 'Data saved.';
              } else {
                  alert('Error submitting data.');
              }
          });
    }
});


  const modal = document.getElementById("consentModal");
  const span = document.getElementsByClassName("close")[0];

  span.onclick = function() {
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }


}

runMethod().catch((e) => {
  console.log("Error loading options");
});
