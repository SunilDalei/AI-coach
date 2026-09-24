const GEMINI_API_KEY =  CONFIG.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.6-flash";

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
const submitAnswerButton = document.getElementById("submit-answer-btn");
const scoreValue = document.getElementById("score-value");
const scoreMessage = document.getElementById("score-message");
const positiveFeedback = document.getElementById("positive-feedback");
const missingFeedback = document.getElementById("missing-feedback");
const improvementFeedback = document.getElementById("improvement-feedback");
const followUpQuestion = document.getElementById("follow-up-question");
const answerFollowUpButton = document.getElementById("answer-follow-up-btn");
const selectedSection = document.getElementById("evaluation-section");

// INTERVIEW STATE
let interviewStarted = false;
let selectedTopic = "";
let selectedDifficulty = "";
let selectedMode = "";
let isFollowUpQuestion = false;
let interviewhostory = [];
const interviewQuestions = {
  DSA: "What is the difference between an array and a linked list?",
  DBMS: "What is database normalization and why is it important?",
  OS: "What is the difference between a process and a thread?",
  CN: "What is the difference between TCP and UDP?",
  OOP: "What are the four main principles of object-oriented programming?",
};

//AI question generation using GEMINI API
async function generateInterviewQuestion() {
  const prompt = `
Generate one ${selectedDifficulty} technical interview question about ${selectedTopic} for a ${selectedMode}.

Return only the interview question.
Do not provide the answer.
Do not add explanations.
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Gemini API request failed.");
  }

  const data = await response.json();
  const question = data.candidates[0].content.parts[0].text;

  return question;
}

//Evaluation of answer
async function evaluateAnswer(userAnswer) {
  const prompt = `You are a technical interviewer.
Topic: ${selectedTopic}
Difficulty: ${selectedDifficulty}
Interview Mode: ${selectedMode}

Interview Question:
${questionText.textContent}

Candidate's Answer:
${userAnswer}

Evaluate the candidate's answer.

Return the evaluation as JSON with these exact fields:

{
  "score": 0,
  "strengths": "",
  "missing": "",
  "improvement": "",
  "followUp": ""
}

The score must be an integer from 0 to 10.

Be fair and evaluate based on technical correctness, completeness, and clarity.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],

        generationConfig: {
          responseMimeType: "application/json",

          responseSchema: {
            type: "OBJECT",

            properties: {
              score: {
                type: "INTEGER",
              },

              strengths: {
                type: "STRING",
              },

              missing: {
                type: "STRING",
              },

              improvement: {
                type: "STRING",
              },

              followUp: {
                type: "STRING",
              },
            },

            required: [
              "score",
              "strengths",
              "missing",
              "improvement",
              "followUp",
            ],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Gemini evaluation request failed.");
  }

const data = await response.json();
const evaluationText = data.candidates[0].content.parts[0].text;
const evaluation = JSON.parse(evaluationText);

return evaluation;
}

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
  if (selectedNavItem) {
    selectedNavItem.classList.add("active");
  }
}
// START INTERVIEW
startInterviewButton.addEventListener("click", async function () {
  selectedTopic = topicSelect.value;
  selectedDifficulty = difficultySelect.value;
  selectedMode = modeSelect.value;
  selectedTopicText.textContent = selectedTopic;
  selectedDifficultyText.textContent = selectedDifficulty;
  selectedModeText.textContent = selectedMode;
  // const question = interviewQuestions[selectedTopic];
  // questionText.textContent = question;
  interviewStarted = true;
  isFollowUpQuestion = false;
  // console.log("Interview started");
  // console.log("Topic:", selectedTopic);
  // console.log("Difficulty:", selectedDifficulty);
  // console.log("Mode:", selectedMode);

  showSection("interview");
  questionText.textContent = "Generating your interview question...";

  try {
    const question = await generateInterviewQuestion();
    questionText.textContent = question;
  } catch (error) {
    console.error(error);
    questionText.textContent =
      "Unable to generate the interview question. Please try again.";
  }
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

//Submit answer
submitAnswerButton.addEventListener("click",async function () {
  const userAnswer = answerInput.value;
  if (userAnswer.trim() === "") {
    alert("Please enter your answer before submitting.");
    return;
  }
  console.log("User Answer:", userAnswer);
  showSection("evaluation");

  scoreMessage.textContent = "AI is evaluating your answer...";

  try {
  const evaluation = await evaluateAnswer(userAnswer);
  if (isFollowUpQuestion) {
  console.log("This was a follow-up answer.");
}
  console.log("AI Evaluation:", evaluation);
  scoreValue.textContent = evaluation.score;
  positiveFeedback.textContent = evaluation.strengths;
  missingFeedback.textContent = evaluation.missing;
  improvementFeedback.textContent = evaluation.improvement;
  followUpQuestion.textContent = evaluation.followUp;

scoreMessage.textContent = "Your answer has been evaluated.";
  }
  catch (error) {
    console.error(error);
    scoreMessage.textContent = "Unable to evaluate your answer. Please try again.";
  }
});

//Follow-up button
answerFollowUpButton.addEventListener("click", function () {
  console.log("Answering follow-up question");
  questionText.textContent = followUpQuestion.textContent;
  isFollowUpQuestion = true;
  answerInput.value = "";
  characterCount.textContent = "0 characters";
  showSection("interview");
});
