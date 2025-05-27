/**

* Internal Automation Script for TRIANZ

* Author: Pravin Raj

* Email : perumalpravinraj@gmail.com

* Year: 2025

* License: Internal use only - see LICENSE.txt for details.

*/

chrome.action.onClicked.addListener(async(tab) => {

  const config = await fetch(chrome.runtime.getURL("config.json")).then(res => res.json());

  const series = config.series;
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
      args:[region,series,cost]
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
 
function autoFillInstanceTypes(region,series,cost) {
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

      let cpu = cells[1].innerText.trim();
      let ram = cells[2].innerText.trim();
      let instanceCell = cells[7];

      if (!instanceCell) {
        console.warn("Instance cell not found, skipping row");
        continue;
      }

      let ramValue = ram.replace(" GB", "").trim();

      if (!cpu || !ramValue || isNaN(cpu) || isNaN(ramValue)) {
        console.debug(`Skipping row due to invalid CPU/RAM: CPU=${cpu}, RAM=${ram}`);
        continue;
      }

      const apiUrl = `https://flask-app-a03v.onrender.com/owner_pravin_raj/find_instance?region=${region}&series=${series}&cpu=${cpu}&ram=${ramValue}`;

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.instance) {
          console.log(`Instance found: ${data.instance} for CPU=${cpu}, RAM=${ramValue}`);
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
          nativeInputSetter.call(inputBox, data.instance);
          inputBox.dispatchEvent(new Event("input", { bubbles: true }));
          inputBox.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
          console.log("Entered and confirmed instance type");
          console.log("எல்லா புகழும் தமிழிற்கே");

        } else {
          console.log(`No matching instance for CPU=${cpu}, RAM=${ramValue}`);
        }

      } catch (error) {
        console.error(`API request failed for CPU=${cpu}, RAM=${ram}:`, error);
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

 