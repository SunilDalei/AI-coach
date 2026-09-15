// GET HTML ELEMENTS
const navItems = document.querySelectorAll(".nav-item");
const pageSections = document.querySelectorAll(".page-section");
const startInterviewButton = document.getElementById("start-interview-btn");
const endInterviewButton = document.getElementById("end-interview-btn");
const answerInput = document.getElementById("answer");
const characterCount = document.getElementById("character-count");
const topicSelect = document.getElementById("topic");
const difficultySelect = document.getElementById("difficulty");
const modeSelect = document.getElementById("interview-mode");
const selectedTopicText = document.getElementById("selected-topic");
const selectedDifficultyText = document.getElementById("selected-difficulty");
const selectedModeText = document.getElementById("selected-mode");
const questionText = document.getElementById("question-text");

// INTERVIEW STATE
let interviewStarted = false;
let selectedTopic = "";
let selectedDifficulty = "";
let selectedMode = "";
const interviewQuestions = {
  DSA: "What is the difference between an array and a linked list?",
  DBMS: "What is database normalization and why is it important?",
  OS: "What is the difference between a process and a thread?",
  CN: "What is the difference between TCP and UDP?",
  OOP: "What are the four main principles of object-oriented programming?",
};

// SIDEBAR NAVIGATION
navItems.forEach(function (item) {
  item.addEventListener("click", function () {
    const sectionName = item.dataset.section;
    showSection(sectionName);
  });
});

// SHOW SECTION
function showSection(sectionName) {
  pageSections.forEach(function (section) {
    section.classList.remove("active-section");
  });

  navItems.forEach(function (item) {
    item.classList.remove("active");
  });

  const selectedSection = document.getElementById(sectionName + "-section");
  selectedSection.classList.add("active-section");

  const selectedNavItem = document.querySelector(
    `.nav-item[data-section="${sectionName}"]`,
  );
  selectedNavItem.classList.add("active");
}

// START INTERVIEW
startInterviewButton.addEventListener("click", function () {
  selectedTopic = topicSelect.value;
  selectedDifficulty = difficultySelect.value;
  selectedMode = modeSelect.value;
  selectedTopicText.textContent = selectedTopic;
  selectedDifficultyText.textContent = selectedDifficulty;
  selectedModeText.textContent = selectedMode;
  const question = interviewQuestions[selectedTopic];
  questionText.textContent = question;

  interviewStarted = true;
  console.log("Interview started");
  console.log("Topic:", selectedTopic);
  console.log("Difficulty:", selectedDifficulty);
  console.log("Mode:", selectedMode);

  showSection("interview");
});

// END INTERVIEW
endInterviewButton.addEventListener("click", function () {
  interviewStarted = false;
  console.log("Interview ended");
  showSection("home");
});

// CHARACTER COUNTER
answerInput.addEventListener("input", function () {
  const numberOfCharacters = answerInput.value.length;
  characterCount.textContent = numberOfCharacters + " characters";
});
