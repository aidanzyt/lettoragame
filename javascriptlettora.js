// Game state variables
let letters = getDailyLetters();  // Use daily letters instead of random ones
let timeLeft = 90;
let score = 0;
let words = [];
let gameRunning = false;
let timerInterval;

// Wait for DOM to be fully loaded
window.onload = function() {
    updateHighScoreDisplay();

    window.startGame = function() {
        resetGame();
        document.getElementById("introScreen").style.display = "none";
        document.getElementById("homeLogo").style.display = "none";
        document.getElementById("game").style.display = "flex";
        gameRunning = true;

        // Display daily letters
        const lettersElement = document.getElementById("letters");
        lettersElement.innerHTML = letters.map(letter => 
            `<span class="letter">${letter}</span>`
        ).join(' ');

        document.getElementById("wordInput").focus();
        startTimer();
        setInterval(createParticles, 2000);
    };

    window.submitWord = async function() {
        if (!gameRunning) return;
    
        let input = document.getElementById("wordInput");
        let word = input.value.toLowerCase().trim();
    
        // Check if word has already been used
        if (words.includes(word)) {
            showError("You've already used that word!");
            input.value = "";
            input.focus();
            return;
        }
    
        // Validate word with Datamuse API
        if (await isValidWord(word)) {
            score += calculateWordScore(word); // Changed from score++
            words.push(word);
            displayWord(word);
            input.value = "";
            input.classList.remove("invalid");
        } else {
            input.classList.add("invalid");
            showError("Word not found in dictionary");
        }
    
        input.focus();
    };

    window.closeEndScreen = function() {
        document.getElementById("endScreen").style.display = "none";
        document.getElementById("game").style.display = "none";
        document.getElementById("introScreen").style.display = "flex";
        document.getElementById("homeLogo").style.display = "block";
    };

    document.getElementById("wordInput").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            submitWord();
        }
    });
};

// Validate the word using the Datamuse API and additional rules
async function isValidWord(word) {
    // Check if the word includes both required letters
    if (!word.includes(letters[0].toLowerCase()) || !word.includes(letters[1].toLowerCase())) {
        showPopupMessage("Word does not contain the 2 letters");  // New popup message
        return false;
    }

    // Check minimum word length
    if (word.length < 3) {
        showError("Word must be at least 3 letters long");
        return false;
    }

    // Check if word has already been used
    if (words.includes(word)) {
        showError("Word already used");
        return false;
    }

    // Check if word is in the common dictionary set
    if (!commonWords.has(word)) {
        showError("Word not found in dictionary");
        return false;
    }

    // Check with the Datamuse API for word validity
    try {
        const response = await fetch(`https://api.datamuse.com/words?sp=${word}&max=1`);
        const data = await response.json();

        if (data.length > 0 && data[0].word === word) {
            return true;
        } else {
            showError("Word not found in dictionary");
            return false;
        }
    } catch (error) {
        console.error("API Error:", error);
        showError("Error checking word. Please try again.");
        return false;
    }
}

// Function to show a popup message
function showPopupMessage(message) {
    let popup = document.createElement("div");
    popup.className = "popupMessage";
    popup.textContent = message;

    // Style the popup message
    popup.style.position = "fixed";
    popup.style.top = "20px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    popup.style.color = "white";
    popup.style.padding = "10px 20px";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "1000";
    document.body.appendChild(popup);

    // Remove the popup after 2 seconds
    setTimeout(() => {
        popup.remove();
    }, 2000);
}

// Generate consistent daily letters
function getDailyLetters() {
    const now = new Date();
    const pstOffset = -8; // PST is UTC-8
    const utcDate = new Date(now.getTime() + pstOffset * 60 * 60 * 1000); // Adjust to PST
    const dateSeed = utcDate.toISOString().split("T")[0]; // Use the date in PST as the seed

    let hash = 0;
    for (let i = 0; i < dateSeed.length; i++) {
        hash = dateSeed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const letters = [
        String.fromCharCode(65 + (Math.abs(hash) % 26)),
        String.fromCharCode(65 + (Math.abs(hash * 2) % 26))
    ];

    return letters;
}

// Calculate word score based on length
function calculateWordScore(word) {
    return Math.max(1, Math.floor(word.length * 1.5));
}

// Show success flash animation
function showSuccessFlash() {
    const flash = document.querySelector('.success-flash');
    if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => flash.style.opacity = '0', 300);
    }
}

// Timer functions
function startTimer() {
    clearInterval(timerInterval);
    updateProgressBar(90);
    timerInterval = setInterval(function() {
        if (timeLeft > 0 && gameRunning) {
            timeLeft--;
            document.getElementById("timer").textContent = `Time left: ${timeLeft}`;
            updateProgressBar(timeLeft);
            if (timeLeft <= 10) {
                document.getElementById("timer").classList.add("timer-warning");
            }
        } else {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function updateProgressBar(timeRemaining) {
    const progress = (timeRemaining / 90) * 100;
    document.getElementById('timeProgress').style.transform = `scaleX(${progress / 100})`;
}

function showError(message) {
    let errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    setTimeout(() => errorDiv.textContent = "", 2000);
}

function displayWord(word) {
    const wordElement = document.createElement("p");
    wordElement.textContent = word;

    // Calculate and display the score for the word
    const scoreSpan = document.createElement("span");
    const wordScore = calculateWordScore(word);
    scoreSpan.textContent = ` +${wordScore}`;
    scoreSpan.classList.add("score-popup"); // Add class for animation

    // Add the score next to the word and apply animation
    wordElement.appendChild(scoreSpan);
    document.getElementById("wordsList").appendChild(wordElement);

    // Increase the total score
    score += wordScore;

    // Optional success flash animation
    showSuccessFlash();
}

function updateHighScoreDisplay() {
    const highScore = localStorage.getItem("lettoraHighScore") || 0;
    document.getElementById('highScoreDisplay').textContent = highScore;
}

function endGame() {
    gameRunning = false;
    document.getElementById("finalScore").textContent = score;
    document.getElementById("endScreen").style.display = "flex";

    const highScore = localStorage.getItem("lettoraHighScore") || 0;
    if (score > highScore) {
        localStorage.setItem("lettoraHighScore", score);
        document.getElementById("finalScore").textContent += " (New High Score!)";
        createConfetti();
    }
}

function resetGame() {
    timeLeft = 90;
    score = 0;
    words = [];
    document.getElementById("wordsList").innerHTML = "";
    document.getElementById("timer").textContent = "Time left: 90";
    document.getElementById("timer").style.color = "#34495e";
    document.getElementById("timer").classList.remove("timer-warning");
    document.getElementById("wordInput").value = "";
    document.getElementById("wordInput").classList.remove("invalid");
    document.getElementById("errorMessage").textContent = "";
    updateHighScoreDisplay();
}

// Particle and Confetti Effects
function createParticles() {
    const numParticles = 3;
    const colors = ['#4CAF50', '#45a049', '#2E7D32'];

    for (let i = 0; i < numParticles; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = Math.random() * 10 + 5 + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];

            const startX = Math.random() * window.innerWidth;
            const startY = window.innerHeight + 10;

            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';

            document.body.appendChild(particle);

            const animation = particle.animate([
                { transform: `translate(0, 0)`, opacity: 0.8 },
                { transform: `translate(${Math.random() * 200 - 100}px, ${-window.innerHeight - 10}px)`, opacity: 0 }
            ], {
                duration: Math.random() * 3000 + 2000,
                easing: 'linear'
            });

            animation.onfinish = () => particle.remove();
        }, i * 300);
    }
}

function createConfetti() {
    const colors = ['#4CAF50', '#45a049', '#2E7D32', '#A5D6A7'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';

        document.body.appendChild(confetti);

        const animation = confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${Math.random() * 300 - 150}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 2000 + 1000,
            easing: 'cubic-bezier(.25,.46,.45,.94)'
        });

        animation.onfinish = () => confetti.remove();
    }
}
