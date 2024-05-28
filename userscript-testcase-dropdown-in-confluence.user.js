// ==UserScript==
// @name         TestCase dropdowns for confluence page
// @namespace    http://tampermonkey.net/
// @version      2024-05-
// @description  try to take over the world!
// @author       ChihYu Chen
// @match        https://umami-me.atlassian.net/wiki/spaces/TECH/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @downloadURL  https://raw.githubusercontent.com/umami-dev/userscript-testcase-dropdown/main/userscript-testcase-dropdown-in-confluence.user.js
// @updateURL    https://raw.githubusercontent.com/umami-dev/userscript-testcase-dropdown/main/userscript-testcase-dropdown-in-confluence.user.js
// @grant        none
// ==/UserScript==

// Get the status nodes that are defined on the page
function getDefinedStatusNodes() {
  const trElement = Array.from(document.querySelectorAll('tr')).find((tr) =>
    tr.innerText.includes('Status Example')
  );

  if (!trElement) return [];

  const statusElements = trElement.querySelectorAll(
    '[data-node-type="status"]'
  );

  return Array.from(statusElements);
}

// Create an option element for a status node
function createOption(statusNode) {
  const option = document.createElement('li');
  const color = statusNode.dataset.color.toLowerCase();

  option.style.cursor = 'pointer';
  option.appendChild(statusNode.cloneNode(true));

  return { option, color };
}

// Update the value of an input element
function updateInput(input, statusNode) {
  input.textContent = statusNode.innerText;

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;

  nativeInputValueSetter.call(input, statusNode.innerText);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Click a color button that matches a given color
function clickColorButton(colorButtons, color) {
  for (const colorButton of colorButtons) {
    if (colorButton.title.toLowerCase() === color) {
      colorButton.click();
      break;
    }
  }
}

// Display dropdowns for status labels
function displayDropdownsForStatusLabels() {
  const statusNodes = Array.from(
    document.querySelectorAll('[data-node-type="status"]')
  );
  const definedStatusNodes = getDefinedStatusNodes();
  const statusNodesThatCanBeUpdated = statusNodes.filter(
    (node) => !definedStatusNodes.includes(node)
  );

  for (const node of statusNodesThatCanBeUpdated) {
    node.addEventListener('click', function () {
      setTimeout(() => {
        const popoverParentElement = document.querySelector(
          'div[aria-label="Popup"][data-testid="popup-wrapper"][data-editor-popup="true"]'
        );

        const input = popoverParentElement.querySelector('input');
        const grandParentNode = input?.parentElement?.parentElement;
        const dropdown = document.createElement('ul');

        dropdown.style.width = '100%';
        dropdown.style.paddingLeft = '0';

        for (const statusNode of definedStatusNodes) {
          const { option, color } = createOption(statusNode);

          option.addEventListener('click', function () {
            updateInput(input, statusNode);

            const colorButtons = Array.from(
              popoverParentElement.querySelectorAll('button')
            );

            clickColorButton(colorButtons, color);
          });

          dropdown.appendChild(option);
        }

        const previousDropdown = grandParentNode.querySelector('ul');

        if (previousDropdown) {
          grandParentNode.removeChild(previousDropdown);
        }

        grandParentNode.appendChild(dropdown);
      }, 1000);
    });
  }
}

// Delay the display of dropdowns for status labels
function delayedDisplayDropdownForStatusLabels() {
  setTimeout(() => displayDropdownsForStatusLabels(), 10000);
}

// Check if the URL has changed
function checkURLChange() {
  const currentURL = window.location.href;
  const urlPattern =
    /https:\/\/umami-me\.atlassian\.net\/wiki\/spaces\/TECH\/pages\/edit-v2\/\d+/;

  if (lastURL !== currentURL) {
    lastURL = currentURL;
    if (urlPattern.test(currentURL)) {
      delayedDisplayDropdownForStatusLabels();
    }
  }
}

// Initialize the script
function initialize() {
  window.addEventListener('load', delayedDisplayDropdownForStatusLabels);
  window.onpopstate = checkURLChange;
  setInterval(checkURLChange, 1000); // Check every second
}

let lastURL = window.location.href;

initialize();
