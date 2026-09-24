const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
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
let interviewHistory = [];

const savedHistory = localStorage.getItem("interviewHistory");

if (savedHistory) {
  interviewHistory = JSON.parse(savedHistory);
}

// const interviewQuestions = {
//   DSA: "What is the difference between an array and a linked list?",
//   DBMS: "What is database normalization and why is it important?",
//   OS: "What is the difference between a process and a thread?",
//   CN: "What is the difference between TCP and UDP?",
//   OOP: "What are the four main principles of object-oriented programming?",
// };

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
async function evaluateAnswer(userAnswer, retryCount = 0) {
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

  // RETRY IF GEMINI IS TEMPORARILY UNAVAILABLE
  if (response.status === 503 && retryCount < 3) {
    console.log(`Gemini is busy. Retrying... Attempt ${retryCount + 1}`);
    const delay = (retryCount + 1) * 2000;
    await new Promise(function (resolve) {
      setTimeout(resolve, delay);
    });

    return evaluateAnswer(userAnswer, retryCount + 1);
  }

  // HANDLE OTHER API ERRORS
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API Error:", errorText);
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("Gemini Evaluation Response:", data);
  const evaluationText = data.candidates[0].content.parts[0].text;
  console.log("Evaluation JSON:", evaluationText);
  const evaluation = JSON.parse(evaluationText);
  return evaluation;
}

// SIDEBAR NAVIGATION
navItems.forEach(function (item) {
  item.addEventListener("click", function () {
    const sectionName = item.dataset.section;
    showSection(sectionName);

     if (sectionName === "history") {
      displayInterviewHistory();
    
    if (sectionName === "dashboard") {
      displayDashboardStats();
      displayTopicPerformance();
    }
  }});
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

// DISPLAY INTERVIEW HISTORY
function displayInterviewHistory() {
  const historyTableBody = document.getElementById("history-table-body");

  if (interviewHistory.length === 0) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="4">No interviews completed yet.</td>
      </tr>
    `;
    return;
  }

  historyTableBody.innerHTML = "";
  interviewHistory.forEach(function (interview) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${interview.topic}</td>
      <td>${interview.difficulty}</td>
      <td>${interview.score}/10</td>
      <td>${interview.date}</td>
    `;

    historyTableBody.appendChild(row);
  });
}

// DISPLAY DASHBOARD STATISTICS
function displayDashboardStats() {
  const totalInterviews = interviewHistory.length;
  const dashboardInterviews = document.getElementById("dashboard-interviews");
  const dashboardAverage = document.getElementById("dashboard-average");
  const dashboardBestTopic = document.getElementById("dashboard-best-topic");
  const dashboardWeakTopic = document.getElementById("dashboard-weak-topic");

  // No interviews yet
  if (totalInterviews === 0) {
    dashboardInterviews.textContent = "0";
    dashboardAverage.textContent = "0/10";
    dashboardBestTopic.textContent = "-";
    dashboardWeakTopic.textContent = "-";
    return;
  }

  // Total interviews
  dashboardInterviews.textContent = totalInterviews;
  // Calculate average score
  let totalScore = 0;
  interviewHistory.forEach(function (interview) {
    totalScore += Number(interview.score);
  });

  const averageScore = totalScore / totalInterviews;
  dashboardAverage.textContent =
    averageScore.toFixed(1) + "/10";

  // Calculate topic performance
  const topicScores = {};
  interviewHistory.forEach(function (interview) {
    if (!topicScores[interview.topic]) {
      topicScores[interview.topic] = [];
    }

    topicScores[interview.topic].push(
      Number(interview.score)
    );
  });

  let bestTopic = "";
  let weakTopic = "";
  let bestAverage = -1;
  let weakAverage = 11;

  for (const topic in topicScores) {
    const scores = topicScores[topic];
    const topicTotal = scores.reduce(function (sum, score) {
      return sum + score;
    }, 0);

    const topicAverage = topicTotal / scores.length;
    if (topicAverage > bestAverage) {
      bestAverage = topicAverage;
      bestTopic = topic;
    }
    if (topicAverage < weakAverage) {
      weakAverage = topicAverage;
      weakTopic = topic;
    }
  }

  dashboardBestTopic.textContent = bestTopic;
  dashboardWeakTopic.textContent = weakTopic;
}

// DISPLAY TOPIC PERFORMANCE
function displayTopicPerformance() {
  const topicPerformanceList = document.getElementById("topic-performance-list");

  if (interviewHistory.length === 0) {
    topicPerformanceList.innerHTML = "<p>Complete interviews to see your topic performance.</p>";
    return;
  }
  const topicScores = {};
  // Group scores by topic
  interviewHistory.forEach(function (interview) {
    if (!topicScores[interview.topic]) {
      topicScores[interview.topic] = [];
    }
    topicScores[interview.topic].push(Number(interview.score));
  });

  topicPerformanceList.innerHTML = "";
  // Create performance for each topic
  for (const topic in topicScores) {
    const scores = topicScores[topic];
    const totalScore = scores.reduce(function (sum, score) {
      return sum + score;
    }, 0);

    const averageScore = totalScore / scores.length;
    const topicItem = document.createElement("div");
    topicItem.className = "topic-performance-item";
    topicItem.innerHTML = `
      <div class="topic-performance-header">
        <strong>${topic}</strong>
        <span>${averageScore.toFixed(1)}/10</span>
      </div>
      <div class="topic-progress-bar">
        <div
          class="topic-progress-fill"
          style="width: ${averageScore * 10}%"
        ></div>
      </div>
      <small>${scores.length} interview${scores.length > 1 ? "s" : ""}</small>
    `;

    topicPerformanceList.appendChild(topicItem);
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
submitAnswerButton.addEventListener("click", async function () {
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

    const interviewResult = {
      topic: selectedTopic,
      difficulty: selectedDifficulty,
      mode: selectedMode,
      score: evaluation.score,
      date: new Date().toLocaleDateString(),
    };
    interviewHistory.push(interviewResult);

    localStorage.setItem("interviewHistory", JSON.stringify(interviewHistory));

    scoreMessage.textContent = "Your answer has been evaluated.";
  } catch (error) {
    console.error(error);
    scoreMessage.textContent =
      "Unable to evaluate your answer. Please try again.";
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
