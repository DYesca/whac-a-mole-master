let currMoleTile;
let currPlantTiles = [];
let score = 0;
let gameOver = false;
let timeLeft = 120;
let timerInterval;
let isPaused = false;
let playedHurriedSound = false;
const backgroundMusic = document.getElementById("background-music");
const victorySound = document.getElementById("victory-sound");
const gameOverSound = document.getElementById("game-over-sound");
const timehurriedSound = document.getElementById("time-hurried");

// Cargar json y asignar variables
let questions = [];
let currentQuestion = null;

async function loadQuestions() {
    const response = await fetch("/images/questions/questions.json");
    questions = await response.json();
}
// Llama a esta función al iniciar el juego (en `startGame()`).


window.onload = function () {
    document.getElementById("start-game").addEventListener("click", startGame);
};

async function startGame() {
    await loadQuestions(); // Cargar preguntas al iniciar el juego
    document.getElementById("start-modal").style.display = "none";
    document.getElementById("win-modal").style.display = "none";
    document.getElementById("game-over-modal").style.display = "none";
    document.getElementById("correct-modal").style.display = "none";
    setGame();
    startTimer();
     

    // Cargar música de fondo y reproducirla
    backgroundMusic.volume = 0.3; // el volumen de la música de fondo
    backgroundMusic.play();
    checkTimeLeft(); // Comprobar el tiempo restante cada segundo
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            checkEndGame();
            return;
        }
        timeLeft--;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    document.getElementById("timer").innerText = `Tiempo: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function setGame() {
    for (let i = 0; i < 9; i++) {
        let tile = document.createElement("div");
        tile.id = i.toString();
        tile.addEventListener("click", selectTile);
        document.getElementById("board").appendChild(tile);
    }
    setInterval(setMole, 1000);
    setInterval(setPlant, 1000);
}

function getRandomTile() {
    let num = Math.floor(Math.random() * 9);
    return num.toString();
}

function setMole() {
    if (gameOver) return;

    // Quitar solo el topo anterior
    if (currMoleTile) {
        const moleImg = currMoleTile.querySelector("img.mole");
        if (moleImg) currMoleTile.removeChild(moleImg);
    }

    let mole = document.createElement("img");
    mole.src = "/img/monty-mole.png";
    mole.classList.add("mole"); // 👈 importante para diferenciarlo
    currMoleTile = document.getElementById(getRandomTile());

    // Asegurarse de que no ponga topo donde hay planta
    if (currPlantTiles.includes(currMoleTile)) return;

    currMoleTile.appendChild(mole);
}


function setPlant() {
    if (gameOver) return;

    // Limpiar solo plantas anteriores
    currPlantTiles.forEach(tile => {
        const plantImg = tile.querySelector("img.plant");
        if (plantImg) tile.removeChild(plantImg);
    });
    currPlantTiles = [];

    let numPlants = 3;
    let usedIndices = new Set();

    while (currPlantTiles.length < numPlants) {
        let num = getRandomTile();

        if (
            usedIndices.has(num) ||
            (currMoleTile && currMoleTile.id === num)
        )  {
            continue; // Correctamente encerrado
        }

        usedIndices.add(num);
        let tile = document.getElementById(num);
        let plant = document.createElement("img");
        plant.src = "/img/piranha-plant.png";
        plant.classList.add("plant"); // 👈 importante para diferenciarlo
        tile.appendChild(plant);
        currPlantTiles.push(tile);
    }
}


//Función para verificar si se ha hecho clic en el topo o en una planta
function selectTile() {
    if (gameOver) return;
    if (this == currMoleTile) {
        // Evitar múltiples clics
        currMoleTile = null;
        this.innerHTML = ""; // Borra el topo después de la animación
        score += 10;
        document.getElementById("score").innerText = score.toString();
        if (score >= 700) {
            showWinModal();
        }
    } else if (currPlantTiles.includes(this)) {
        showRandomQuestion(); // 🚨 Nuevo comportamiento aquí
    }
}

//Función para verificar si el juego ha terminado
function checkEndGame() {
    if (timeLeft <= 0 && score < 700) {
        showRandomQuestion(); // 🎯 Reemplaza math-modal2
    }
}

//Función para verificar si el tiempo se ha agotado y reproducir sonido
function checkTimeLeft() {
    if (timeLeft <= 60 && !playedHurriedSound) {
        backgroundMusic.pause();
        timehurriedSound.play();
        playedHurriedSound = true;
    }
}

function showWinModal() {
    clearInterval(timerInterval);
    gameOver = true;
    backgroundMusic.pause();
    victorySound.play();
    document.getElementById("win-modal").style.display = "flex";
}

function showGameOver() {
    backgroundMusic.pause();
    gameOverSound.play();
    document.getElementById("final-score").innerText = score.toString(); // ⬅️ Mostrar puntaje final
    document.getElementById("game-over-modal").style.display = "flex";
}

function showRandomQuestion() {
    if (questions.length === 0) return; // Si no hay preguntas

    currentQuestion = questions[Math.floor(Math.random() * questions.length)];
    const modal = document.getElementById("math-question-modal");

    // Mostrar pregunta y opciones
    document.getElementById("math-question-image").src = currentQuestion.questionImage;
    const optionsContainer = document.getElementById("math-options");
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.innerHTML = `<img src="${option.image}" alt="Opción ${index + 1}" />`;
        button.onclick = () => checkAnswer(index);
        optionsContainer.appendChild(button);
    });

    modal.style.display = "flex";
    clearInterval(timerInterval); // Pausar el juego

}

function checkAnswer(selectedIndex) {
    const modal = document.getElementById("math-question-modal");
    const isCorrect = currentQuestion.options[selectedIndex].isCorrect;

    saveAnsweredQuestion(currentQuestion, isCorrect); // Guardar pregunta respondida

    if (isCorrect) {
        // Respuesta correcta: mostrar modal de respuesta correcta
        const correctModal = document.getElementById("correct-modal");
        correctModal.style.display = "flex";
        setTimeout(() => {
            correctModal.style.display = "none";
        }, 2000); // Cierra el modal después de 2 segundos

        // Respuesta correcta: dar tiempo extra o continuar
        if (timeLeft <= 0) {
            timeLeft += 60; // Minuto extra
        }
        score += 20;
        document.getElementById("score").innerText = score;
        modal.style.display = "none";
        startTimer(); // Reanudar juego
    } else {
        // Respuesta incorrecta: game over
        showGameOver();
    }
}

// Función para guardar la pregunta respondida
function saveAnsweredQuestion(question, wasCorrect) {
    // Obtener preguntas guardadas anteriormente o inicializar array vacío
    let answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions')) || [];
    
    // Agregar la nueva pregunta
    answeredQuestions.push({
        questionImage: question.questionImage,
        procedureImage: question.procedureImage,
        options: question.options,
        wasCorrect: wasCorrect,
        timestamp: new Date().toISOString()
    });
    
    // Guardar en localStorage
    localStorage.setItem('answeredQuestions', JSON.stringify(answeredQuestions));
}

//Funcion para modal de pausa
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !gameOver) {
        if (!isPaused) {
            pauseGame();
        } else {
            resumeGame();
        }
    }
});

function pauseGame() {
    isPaused = true;
    clearInterval(timerInterval); // Pausar el temporizador
    backgroundMusic.pause();      // Pausar música
    document.getElementById("pause-modal").style.display = "flex";
}

function resumeGame() {
    isPaused = false;
    document.getElementById("pause-modal").style.display = "none";
    if (timeLeft > 0) {
        startTimer();              // Reanudar temporizador
        backgroundMusic.play();   // Reanudar música
    }
}
