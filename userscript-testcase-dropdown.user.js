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

// background-color
const backgroundClass = {
  [COLORS.NEUTRAL]: isJiraTicketPage ? 'css-8wztwn' : 'cc-1mququ6',
  [COLORS.GREEN]: isJiraTicketPage ? 'css-1nlc156' : 'cc-vklyj9',
  [COLORS.RED]: isJiraTicketPage ? 'css-2ud35r' : 'cc-13x1l8e',
  [COLORS.BLUE]: isJiraTicketPage ? 'css-1j3eiiz' : 'cc-1b1zhv0',
  [COLORS.YELLOW]: isJiraTicketPage ? 'css-5b1snf' : 'cc-12rj1a3',
  [COLORS.PURPLE]: isJiraTicketPage ? 'css-tojbwx' : 'cc-duzunl',
};

// text-color
const textClass = {
  [COLORS.NEUTRAL]: isJiraTicketPage ? 'css-18kwa17' : 'cc-rs4fa3',
  [COLORS.GREEN]: isJiraTicketPage ? 'css-1et8jlg' : 'cc-hd6gza',
  [COLORS.RED]: isJiraTicketPage ? 'css-1i1uhdn' : 'cc-1weev9x',
  [COLORS.BLUE]: isJiraTicketPage ? 'css-5ok1f9' : 'cc-lt5xxh',
  [COLORS.YELLOW]: isJiraTicketPage ? 'css-15u8od2' : 'cc-1pigi8r',
  [COLORS.PURPLE]: isJiraTicketPage ? 'css-1u0x9tu' : 'cc-1l1f8fe',
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
  const activeButton = colorButtons.find((button) =>
    button.className.includes('selected')
  );

  for (const button of colorButtons) {
    button.click();
  }

  if (activeButton !== colorButtons[colorButtons.length - 1]) {
    activeButton.click();
  }
}

function appendCandidateLabels(targetUnorderedList) {
  const popoverSelector =
    'div[aria-label="Popup"][data-testid="popup-wrapper"][data-editor-popup="true"]';
  const popoverElement = document.querySelector(popoverSelector);
  const input = popoverElement.querySelector('input');
  const colorButtons = Array.from(popoverElement.querySelectorAll('button'));

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
        updateColor(colorButtons, type);
      });
    });

    parentSpan.className = backgroundClass[type];
    parentSpan.style.padding = '4px';
    parentSpan.style.borderRadius = '4px';
    parentSpan.appendChild(childSpan);

    li.appendChild(parentSpan);
    li.style.cursor = 'pointer';
    li.style.width = '100%';

    targetUnorderedList.style.listStyleType = 'none';
    targetUnorderedList.dataset.isCandidateLabelsAppended = 'true';
    targetUnorderedList.appendChild(li);
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

      const targetUnorderedSelector = isJiraTicketPage
        ? 'ul.css-5vty0s'
        : 'ul.cc-5vty0s';
      const targetUnorderedList = document.querySelector(
        targetUnorderedSelector
      );

      if (
        targetUnorderedList &&
        targetUnorderedList.dataset?.isCandidateLabelsAppended !== 'true'
      ) {
        appendCandidateLabels(targetUnorderedList);
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
