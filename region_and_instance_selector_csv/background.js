/**

* Internal Automation Script for TRIANZ

* Author: Pravin Raj

* Email : perumalpravinraj@gmail.com

* Year: 2025

* License: Internal use only - see LICENSE.txt for details.

*/

let strategyMap = {};

fetch(chrome.runtime.getURL("strategies.csv"))
  .then(response => response.text())
  .then(text => {
    text.split("\n").forEach(line => {
      let [id, strategy] = line.trim().split(",");
      if (id && strategy) {
        strategyMap[id.trim()] = strategy.trim();
      }
    });
    console.log("Loaded strategy map:", strategyMap);
});

chrome.action.onClicked.addListener(async(tab) => {

  const config = await fetch(chrome.runtime.getURL("config.json")).then(res => res.json());
  const region = config.region;
  const cost = config.cost;

  if (region){
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: autoFillFirstInput,
      args:[region]
    });
  }

  if (series){
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: autoFillInstanceTypes,
      args:[cost,strategyMap]
    });
  }

});

function autoFillFirstInput(region) {
  document.querySelectorAll('tr').forEach(row => {
    let firstInput = row.querySelector('.review_assessment__input-container input');
    
    if (firstInput) {
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(firstInput, region); 
        let event = new Event('input', { bubbles: true });
        firstInput.dispatchEvent(event); 
        firstInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); 
        firstInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    }
  });
}
 
function autoFillInstanceTypes(cost,strategyMap) {
  (async function () {
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const waitForElement = async (parent, selector, timeout = 5000) => {
      const interval = 100;
      let elapsed = 0;
      while (elapsed < timeout) {
        const element = parent.querySelector(selector);
        if (element) return element;
        await wait(interval);
        elapsed += interval;
      }
      return null;
    };

    let rows = document.querySelectorAll(".infra_table tbody tr");

    for (let row of rows) {
      let cells = row.querySelectorAll("td");
      if (cells.length < 8) {
        console.debug("Skipping row: less than 8 cells");
        continue;
      }
      let hostname = cells[0].innerText.trim();
      let instanceCell = cells[7];
      if (!instanceCell) {
        console.warn("Instance cell not found, skipping row");
        continue;
      }
      if (!hostname) {
        console.debug(`Skipping row due to no hostname`);
        continue;
      }
      try {

        if (strategyMap[hostname]) {
          console.log(`Instance found: ${strategyMap[hostname]} for Hostname=${hostname}`);
          const dropdown = await waitForElement(instanceCell, ".review_assessment__control", 3000);

          if (!dropdown) {
            console.warn("Dropdown not found in row");
            continue;
          }
          dropdown.click();
          const inputBox = await waitForElement(instanceCell, ".review_assessment__input", 3000);

          if (!inputBox) {
            console.warn("Input box not found in row");
            continue;
          }
          
          const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeInputSetter.call(inputBox, strategyMap[hostname]);
          inputBox.dispatchEvent(new Event("input", { bubbles: true }));
          inputBox.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
          console.log("Entered and confirmed instance type");
          console.log("எல்லா புகழும் தமிழிற்கே");

        } else {
          console.log(`No matching Hostname found`);
        }

      } catch (error) {
        console.error(`Error:`, error);
      }

      await wait(500); 
    }
    await wait(2000); 
    if (cost) {
      document.querySelectorAll('tr').forEach(row => {
        let radioButtons = row.querySelectorAll('input[type="radio"][id="pricingRadio"]');
        if (radioButtons.length > 1) {
          if (cost == "reserved_1year"){radioButtons[0].click();}
          if (cost == "reserved_3year"){radioButtons[1].click();}
          if (cost == "ondemand_plan"){radioButtons[2].click();}
        }
      });
    }
  })();
}

 