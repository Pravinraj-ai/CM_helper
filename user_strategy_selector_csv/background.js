/**

* Internal Automation Script for TRIANZ

* Author: Pravin Raj

* Email : perumalpravinraj@gmail.com

* Year: 2025

* License: Internal use only - see LICENSE.txt for details.

*/


let strategyMap = null;

async function loadStrategyMap() {
  if (strategyMap !== null) return strategyMap;

  try {
    const response = await fetch(chrome.runtime.getURL("strategies.csv"));
    const text = await response.text();
    strategyMap = {};

    text.split("\n").forEach(line => {
      const [id, strategy] = line.trim().split(",");
      if (id && strategy) {
        strategyMap[id.trim()] = strategy.trim();
      }
    });

    console.log("Strategy map loaded:", strategyMap);
    return strategyMap;
  } catch (error) {
    console.error("Error loading strategy map:", error);
    return {};
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  const strategyMap = await loadStrategyMap();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: autoFillFirstInput,
    args: [strategyMap]
  });
});

function autoFillFirstInput(strategyMap) {
  document.querySelectorAll('tbody tr').forEach((row, index) => {
    setTimeout(() => {
      let editButton = row.querySelector('td:last-child img');
      if (editButton) {
        editButton.click();
        console.log(`Clicked edit button for row ${index + 1}`);
      } else {
        console.log(`Edit button not found for row ${index + 1}`);
        return;
      }

      setTimeout(() => {

        let previousStrategyCell = row.querySelector('td:nth-child(4)');
        let strategyText = previousStrategyCell ? previousStrategyCell.innerText.trim() : null;
        strategyText = strategyMap[strategyText];
        if (strategyText === "Replatform") {
              strategyText = "Re-Platform";
        }

        let selectElement = row.querySelector('td:nth-child(9) select');

        if (selectElement && strategyText) {
          selectElement.removeAttribute('disabled'); 
          selectElement.value = strategyText;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`Selected "${strategyText}" in row ${index + 1}`);
        } else {
          console.log(`Dropdown or strategy text not found for row ${index + 1}`);
          return;
        }
        
        let commentBox = row.querySelector('td:nth-child(10) textarea');
        if (commentBox) {
          commentBox.removeAttribute('disabled'); 
          let nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          nativeTextAreaValueSetter.call(commentBox, " "); 
          commentBox.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(`Entered empty comment in row ${index + 1}`);
        } else {
          console.log(`Comment box not found for row ${index + 1}`);
          return;
        }

        setTimeout(() => {

          let tickButton = row.querySelector('td:last-child img[src*="check-circle-regular"]');
          if (tickButton) {
            tickButton.click();
            console.log(`Clicked Save button for row ${index + 1}`);
          } else {
            console.log(`Save button not found for row ${index + 1}`);
          }
        }, 1000); 
      }, 1000); 
    }, index * 3000); 
    console.log("எல்லா புகழும் தமிழிற்கே");
  });
}
