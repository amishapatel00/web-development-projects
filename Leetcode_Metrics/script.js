document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const searchBtn = document.getElementById("search-btn");
  const usernameInput = document.getElementById("user-input");
  const easyCircle = document.querySelector(".easy-progress");
  const mediumCircle = document.querySelector(".medium-progress");
  const hardCircle = document.querySelector(".hard-progress");
  const easyLabel = document.getElementById("easy-label");
  const mediumLabel = document.getElementById("medium-label");
  const hardLabel = document.getElementById("hard-label");
  const statsCardDiv = document.querySelector(".stats-card");

  // Validate username
  function validateUsername(username) {
    if (!username.trim()) {
      alert("Username cannot be empty");
      return false;
    }
    if (!/^[a-zA-Z0-9_-]{1,20}$/.test(username)) {
      alert("Invalid username (only letters, numbers, _ and -)");
      return false;
    }
    return true;
  }

  // Update circular progress bar
  function updateProgress(solved, total, labelEl, circleEl) {
    if (!total || total === 0) {
      labelEl.textContent = `${solved}/${total || "?"}`;
      circleEl.style.setProperty("--progress-degree", "0%");
      return;
    }
    const percent = (solved / total) * 100;
    circleEl.style.setProperty("--progress-degree", `${percent}%`);
    labelEl.textContent = `${solved}/${total}`;
  }

  // Fetch with fallback APIs (CORS friendly)
  async function fetchUserStats(username) {
    // 1. LeetCode Stats API (most reliable)
    try {
      const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.status !== "error" && data.totalSolved !== undefined) {
          return { source: "stats-api", data };
        }
      }
    } catch (e) { console.log("Stats API failed", e); }

    // 2. Alfa LeetCode API
    try {
      const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.errors && data.totalSolved) {
          return { source: "alfa", data };
        }
      }
    } catch (e) { console.log("Alfa API failed", e); }

    // 3. GraphQL via CORS proxy
    try {
      const proxy = "https://corsproxy.io/?";
      const leetcodeUrl = "https://leetcode.com/graphql";
      const graphqlQuery = {
        query: `query userStats($username: String!) {
          allQuestionsCount { difficulty count }
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum { difficulty count submissions }
              totalSubmissionNum { difficulty count submissions }
            }
          }
        }`,
        variables: { username }
      };
      const res = await fetch(proxy + encodeURIComponent(leetcodeUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graphqlQuery)
      });
      if (res.ok) {
        const result = await res.json();
        if (result?.data?.matchedUser) {
          return { source: "graphql", data: result.data };
        }
      }
    } catch (e) { console.log("GraphQL proxy failed", e); }

    throw new Error("Unable to fetch data. User may not exist.");
  }

  // Main function to fetch and display
  async function fetchUserDetails(username) {
    try {
      searchBtn.disabled = true;
      searchBtn.textContent = "Searching...";
      statsCardDiv.innerHTML = `<div class="card" style="background:#1e293b; padding:1rem; border-radius:1rem; text-align:center">Loading stats...</div>`;
      updateProgress(0, 0, easyLabel, easyCircle);
      updateProgress(0, 0, mediumLabel, mediumCircle);
      updateProgress(0, 0, hardLabel, hardCircle);

      const { source, data } = await fetchUserStats(username);
      console.log(`Data from ${source}`, data);

      let totalEasy = 0, totalMedium = 0, totalHard = 0;
      let solvedEasy = 0, solvedMedium = 0, solvedHard = 0;
      let totalSolved = 0, totalQuestions = 0;
      let acceptanceRate = "0%", ranking = "N/A";

      if (source === "stats-api" || source === "alfa") {
        totalEasy = data.totalEasy || 0;
        totalMedium = data.totalMedium || 0;
        totalHard = data.totalHard || 0;
        solvedEasy = data.easySolved || 0;
        solvedMedium = data.mediumSolved || 0;
        solvedHard = data.hardSolved || 0;
        totalSolved = data.totalSolved || 0;
        totalQuestions = data.totalQuestions || 0;
        acceptanceRate = data.acceptanceRate || "0%";
        ranking = data.ranking || "N/A";
      } 
      else if (source === "graphql") {
        const allQ = data.allQuestionsCount;
        totalEasy = allQ.find(q => q.difficulty === "Easy")?.count || 0;
        totalMedium = allQ.find(q => q.difficulty === "Medium")?.count || 0;
        totalHard = allQ.find(q => q.difficulty === "Hard")?.count || 0;
        totalQuestions = allQ.find(q => q.difficulty === "All")?.count || 0;
        const ac = data.matchedUser.submitStats.acSubmissionNum;
        solvedEasy = ac.find(s => s.difficulty === "Easy")?.count || 0;
        solvedMedium = ac.find(s => s.difficulty === "Medium")?.count || 0;
        solvedHard = ac.find(s => s.difficulty === "Hard")?.count || 0;
        totalSolved = ac.find(s => s.difficulty === "All")?.count || 0;
        const totalSub = data.matchedUser.submitStats.totalSubmissionNum.find(s => s.difficulty === "All")?.submissions || 1;
        acceptanceRate = totalSolved ? ((totalSolved / totalSub) * 100).toFixed(1) + "%" : "0%";
        ranking = "N/A";
      }

      // Update circular progress bars
      updateProgress(solvedEasy, totalEasy, easyLabel, easyCircle);
      updateProgress(solvedMedium, totalMedium, mediumLabel, mediumCircle);
      updateProgress(solvedHard, totalHard, hardLabel, hardCircle);

      // Build stats cards
      const cards = [
        { label: "📊 Total Solved", value: `${totalSolved}/${totalQuestions}` },
        { label: "✅ Easy", value: `${solvedEasy}/${totalEasy}` },
        { label: "🌙 Medium", value: `${solvedMedium}/${totalMedium}` },
        { label: "🔥 Hard", value: `${solvedHard}/${totalHard}` },
        { label: "📈 Acceptance Rate", value: acceptanceRate },
        { label: "🏆 Global Ranking", value: ranking }
      ];

      statsCardDiv.innerHTML = cards.map(card => `
        <div class="card" style="background: #0f172a; padding: 0.8rem 1.2rem; border-radius: 1rem; margin: 0.5rem; display: inline-block; min-width: 160px; text-align: center;">
          <h4 style="color: #94a3b8; margin-bottom: 0.5rem;">${card.label}</h4>
          <p style="font-size: 1.5rem; font-weight: bold; background: linear-gradient(135deg, #facc15, #eab308); background-clip: text; -webkit-background-clip: text; color: transparent;">${card.value}</p>
        </div>
      `).join("");

    } catch (error) {
      console.error(error);
      statsCardDiv.innerHTML = `<div class="card" style="background:#2d1a1f; padding:1rem; border-radius:1rem; text-align:center; color:#f87171">⚠️ ${error.message}<br>Try: neetcode, errichto</div>`;
      updateProgress(0, 0, easyLabel, easyCircle);
      updateProgress(0, 0, mediumLabel, mediumCircle);
      updateProgress(0, 0, hardLabel, hardCircle);
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = "Search";
    }
  }

  // Event listeners
  searchBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    if (validateUsername(username)) {
      fetchUserDetails(username);
    }
  });

  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBtn.click();
  });

  // Optional: load a default user on page load
  fetchUserDetails("neetcode");
});