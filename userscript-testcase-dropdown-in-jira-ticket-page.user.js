// ==UserScript==
// @name         TestCase dropdowns for jira-tickets
// @namespace    http://tampermonkey.net/
// @version      2024-05-30
// @description  try to take over the world!
// @author       ChihYu Chen
// @match        https://umami-me.atlassian.net/browse/*
// @downloadURL  https://raw.githubusercontent.com/umami-dev/userscript-testcase-dropdown/main/userscript-testcase-dropdown-in-jira-ticket-page.user.js
// @updateURL    https://raw.githubusercontent.com/umami-dev/userscript-testcase-dropdown/main/userscript-testcase-dropdown-in-jira-ticket-page.user.js
// @grant        none
// ==/UserScript==

const COLORS = {
  GREEN: 'green',
  RED: 'red',
  BLUE: 'blue',
  YELLOW: 'yellow',
  PURPLE: 'purple',
};

const labels = [
  { title: 'DEV CHECKED', type: COLORS.GREEN },
  { title: 'QA CHECKED', type: COLORS.GREEN },
  { title: 'QA & DEV CHECKED', type: COLORS.GREEN },
  { title: "QA CHECKED DEV'S RESULT", type: COLORS.GREEN },
  { title: 'DEV NEED TO CHECK', type: COLORS.YELLOW },
  { title: 'SPEC CHANGED', type: COLORS.YELLOW },
  { title: 'SKIP', type: COLORS.YELLOW },
  { title: 'BUG', type: COLORS.RED },
  { title: 'CONFIRM WITH DEV', type: COLORS.BLUE },
  { title: 'CONFIRM WITH PM', type: COLORS.BLUE },
  { title: 'QA WILL CHECK', type: COLORS.PURPLE },
  { title: 'QA AUTO CHECK', type: COLORS.PURPLE },
  // { title: 'TC REVIEWED', type: COLORS.GREEN },
  // { title: 'TC SUGGESTED', type: COLORS.BLUE },
  // { title: 'TC REWRITE', type: COLORS.RED },
];

// background-color
const backgroundClass = {
  [COLORS.GREEN]: 'css-1nlc156',
  [COLORS.RED]: 'css-2ud35r',
  [COLORS.BLUE]: 'css-1j3eiiz',
  [COLORS.YELLOW]: 'css-5b1snf',
  [COLORS.PURPLE]: 'css-tojbwx',
};
// text-color
const textClass = {
  [COLORS.GREEN]: 'css-1et8jlg',
  [COLORS.RED]: 'css-1i1uhdn',
  [COLORS.BLUE]: 'css-5ok1f9',
  [COLORS.YELLOW]: 'css-15u8od2',
  [COLORS.PURPLE]: 'css-1u0x9tu',
};

function updateInput(input, statusNode) {
  input.textContent = statusNode.innerText;

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;

  nativeInputValueSetter.call(input, statusNode.innerText);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function activateColors(colorButtons) {
  const originalClickedButton = colorButtons.find((button) =>
    button.className.includes('selected')
  );

  for (const button of colorButtons) {
    button.click();
  }

  if (originalClickedButton === colorButtons[colorButtons.length - 1]) return;

  originalClickedButton.click();
}

function appendCandidateLabels(targetUl) {
  const popoverParentElement = document.querySelector(
    'div[aria-label="Popup"][data-testid="popup-wrapper"][data-editor-popup="true"]'
  );
  const input = popoverParentElement.querySelector('input');
  const colorButtons = Array.from(
    popoverParentElement.querySelectorAll('button')
  );

  activateColors(colorButtons);

  for (const { title, type } of labels) {
    const li = document.createElement('li');
    const parentSpan = document.createElement('span');
    const childSpan = document.createElement('span');

    childSpan.className = textClass[type];
    childSpan.style.maxWidth = 'calc(200px - var(--ds-space-100, 8px))';
    childSpan.innerText = title;
    childSpan.addEventListener('click', (el) => {
      setTimeout(() => {
        updateInput(input, el.target);
        clickColorButton(colorButtons, type);
      });
    });

    parentSpan.className = backgroundClass[type];
    parentSpan.style.padding = '4px';
    parentSpan.style.borderRadius = '4px';
    parentSpan.appendChild(childSpan);

    li.appendChild(parentSpan);
    li.style.cursor = 'pointer';
    li.style.width = '100%';

    targetUl.style.listStyleType = 'none';
    targetUl.dataset.isCandidateLabelsAppended = 'true';
    targetUl.appendChild(li);
  }
}

// Click a color button that matches a given color
function clickColorButton(colorButtons, color) {
  const colorButton = colorButtons.find(
    ({ title }) => title.toLowerCase() === color
  );

  if (colorButton) {
    colorButton.click();
  }
}

function init() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type !== 'childList') return;

      const targetUl = document.querySelector('ul.css-5vty0s');

      if (targetUl && targetUl.dataset?.isCandidateLabelsAppended !== 'true') {
        appendCandidateLabels(targetUl);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

window.addEventListener('load', () => init());
