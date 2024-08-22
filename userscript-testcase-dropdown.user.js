// ==UserScript==
// @name         TestCase dropdown
// @namespace    http://tampermonkey.net/
// @version      2024-06-02
// @description  TestCase dropdown
// @author       ChihYu Chen
// @match        https://umami-me.atlassian.net/wiki/spaces/TECH/*
// @match        https://umami-me.atlassian.net/*
// @downloadURL  https://raw.githubusercontent.com/umami-dev/userscript-testcase-dropdown/main/userscript-testcase-dropdown.js
// @updateURL    https://raw.githubusercontent.com/umami-dev/userscript-testcase-dropdown/main/userscript-testcase-dropdown.js
// @grant        none
// ==/UserScript==
const regex = /https:\/\/umami-me\.atlassian\.net\/(jira|browse)/;
const isJiraTicketPage = regex.test(window.location.href);

const COLORS = {
  NEUTRAL: 'neutral',
  GREEN: 'green',
  RED: 'red',
  BLUE: 'blue',
  YELLOW: 'yellow',
  PURPLE: 'purple',
};

const fontColorMap = {
  [COLORS.NEUTRAL]: '#9fadbc',
  [COLORS.GREEN]: '#7ee2b8',
  [COLORS.YELLOW]: '#f5cd47',
  [COLORS.RED]: '#fd9891',
  [COLORS.BLUE]: '#85b8ff',
  [COLORS.PURPLE]: '#b8acf6',
};

const labels = [
  { title: 'DEV CHECKED', type: COLORS.GREEN },
  { title: 'QA CHECKED', type: COLORS.GREEN },
  { title: 'QA & DEV CHECKED', type: COLORS.GREEN },
  { title: "QA CHECKED DEV'S RESULT", type: COLORS.GREEN },
  { title: 'TC REVIEWED', type: COLORS.GREEN },
  { title: 'DEV NEED TO CHECK', type: COLORS.YELLOW },
  { title: 'SPEC CHANGED', type: COLORS.YELLOW },
  { title: 'SKIP', type: COLORS.YELLOW },
  { title: 'TC REWRITE', type: COLORS.RED },
  { title: 'BUG', type: COLORS.RED },
  { title: 'CONFIRM WITH DEV', type: COLORS.BLUE },
  { title: 'CONFIRM WITH PM', type: COLORS.BLUE },
  { title: 'TC SUGGESTED', type: COLORS.BLUE },
  { title: 'QA WILL CHECK', type: COLORS.PURPLE },
  { title: 'QA AUTO CHECK', type: COLORS.PURPLE },
];

const buttonStyles = {};

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
  const activeButton = colorButtons.find(
    (button) =>
      button.className.includes('selected') ||
      button.getAttribute('aria-pressed') === 'true'
  );

  for (const button of colorButtons) {
    button.click();
  }

  if (activeButton !== colorButtons[colorButtons.length - 1]) {
    activeButton?.click();
  }
}

function setButtonStyles(colorButtons) {
  for (const { title, style } of colorButtons) {
    const { backgroundColor, borderColor } = style;

    buttonStyles[title.toLowerCase()] = { backgroundColor, borderColor };
  }
}

function appendCandidateLabels(popupElement) {
  const targetUnorderedList = popupElement.querySelector('ul');
  const input = popupElement.querySelector('input');
  const colorButtons = Array.from(popupElement.querySelectorAll('button'));

  if (!targetUnorderedList || colorButtons.length === 0) return;

  if (Object.entries(buttonStyles).length === 0) {
    setButtonStyles(colorButtons);
  }

  activateColors(colorButtons);

  for (const { title, type } of labels) {
    const li = document.createElement('li');
    const parentSpan = document.createElement('span');
    const childSpan = document.createElement('span');

    childSpan.style.maxWidth = 'calc(200px - var(--ds-space-100, 8px))';
    childSpan.innerText = title;
    childSpan.addEventListener('click', (el) => {
      setTimeout(() => {
        updateInput(input, el.target);
        updateColor(colorButtons, type);
      });
    });

    parentSpan.style.backgroundColor = buttonStyles?.[type]?.backgroundColor;
    parentSpan.style.border = `${buttonStyles?.[type]?.borderColor} 1px solid`;
    parentSpan.style.color = fontColorMap[type];
    parentSpan.style.opacity = '0.7';
    parentSpan.style.padding = '4px';
    parentSpan.style.borderRadius = '4px';
    parentSpan.addEventListener(
      'mouseenter',
      () => (parentSpan.style.opacity = '1')
    );
    parentSpan.addEventListener(
      'mouseleave',
      () => (parentSpan.style.opacity = '0.7')
    );
    parentSpan.appendChild(childSpan);

    li.appendChild(parentSpan);
    li.style.cursor = 'pointer';
    li.style.width = '100%';
    li.style.marginTop = '12px';

    targetUnorderedList.style.listStyleType = 'none';
    targetUnorderedList.appendChild(li);

    popupElement.dataset.isCandidateLabelsAppended = 'true';
  }
}

function updateColor(colorButtons, color) {
  const colorButton = colorButtons.find(
    ({ title }) => title.toLowerCase() === color
  );
  const activeButton = colorButtons.find((button) =>
    button.className.includes('selected')
  );
  const activeColor = activeButton?.title.toLowerCase();

  if (!colorButton || activeColor === color) return;

  colorButton.click();
}

function initObserver() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type !== 'childList') return;

      const targetPopupElement = document.querySelector(
        'div[aria-label="Popup"][data-testid="popup-wrapper"][data-editor-popup="true"]'
      );

      if (
        targetPopupElement &&
        targetPopupElement.dataset?.isCandidateLabelsAppended !== 'true'
      ) {
        appendCandidateLabels(targetPopupElement);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

let lastURL = window.location.href;

function checkURLChange() {
  const currentURL = window.location.href;
  const confluenceUpdateURLRegex =
    /https:\/\/umami-me\.atlassian\.net\/wiki\/spaces\/TECH\/pages\/edit-v2\/\d+/;

  if (lastURL === currentURL) return;

  lastURL = currentURL;

  if (!confluenceUpdateURLRegex.test(currentURL)) return;

  initObserver();
}

// Initialize the script
function initialize() {
  window.addEventListener('load', () => initObserver());
  window.addEventListener('popstate', () => checkURLChange());
  window.addEventListener('hashchange', () => checkURLChange());
}

initialize();
