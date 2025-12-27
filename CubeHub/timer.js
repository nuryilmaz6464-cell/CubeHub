let startTime;
let interval;
let isRunning = false;
let solves = [];

const display = document.getElementById('timer-display');
const btn = document.getElementById('timer-btn');
const popup = document.getElementById('stats-popup');
const popupTime = document.getElementById('popup-time');
const popupAo5 = document.getElementById('popup-ao5');

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    display.textContent = formatTime(elapsedTime);
}

function startTimer() {
    startTime = Date.now();
    interval = setInterval(updateTimer, 10);
    isRunning = true;
    btn.textContent = 'DURDUR';
    btn.style.backgroundColor = '#a21212ff'; // Red color for stop
}

function stopTimer() {
    clearInterval(interval);
    isRunning = false;
    btn.textContent = 'BAŞLAT';
    btn.style.backgroundColor = ''; // Reset color

    // Calculate final time
    const finalTime = Date.now() - startTime;
    solves.push(finalTime);

    // Show popup
    showStats(finalTime);
}

function showStats(time) {
    popupTime.textContent = formatTime(time);

    // Calculate Ao5
    if (solves.length >= 5) {
        const last5 = solves.slice(-5);
        // Ao5 usually removes best and worst, then averages remaining 3
        const sorted = [...last5].sort((a, b) => a - b);
        const center3 = sorted.slice(1, 4);
        const sum = center3.reduce((a, b) => a + b, 0);
        const avg = sum / 3;
        popupAo5.textContent = formatTime(avg);
    } else {
        popupAo5.textContent = '-';
    }

    popup.style.display = 'block';
}

function closePopup() {
    popup.style.display = 'none';
    display.textContent = '00:00.00';
}

// -- Falling Cubes Animation --
const bgContainer = document.getElementById('falling-bg');

function createFallingCube() {
    const cube = document.createElement('div');
    cube.className = 'falling-cube';

    // Random size
    const size = Math.random() * 30 + 20; // 20px to 50px
    cube.style.width = `${size}px`;
    cube.style.height = `${size}px`;

    // Random position
    const left = Math.random() * 100;
    cube.style.left = `${left}%`;

    // Random Faces colors (simplified)
    const colors = ['#ffffff', '#ffd500', '#b90000', '#ff5900', '#0045ad', '#009b48'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Create faces
    for (let i = 0; i < 6; i++) {
        const face = document.createElement('div');
        face.className = 'f-face';
        face.style.background = randomColor;
        face.style.opacity = '0.3';
        face.style.border = '1px solid #333';

        // Transform faces to form cube
        const half = size / 2;
        if (i === 0) face.style.transform = `rotateY(0deg) translateZ(${half}px)`;
        if (i === 1) face.style.transform = `rotateY(180deg) translateZ(${half}px)`;
        if (i === 2) face.style.transform = `rotateY(90deg) translateZ(${half}px)`;
        if (i === 3) face.style.transform = `rotateY(-90deg) translateZ(${half}px)`;
        if (i === 4) face.style.transform = `rotateX(90deg) translateZ(${half}px)`;
        if (i === 5) face.style.transform = `rotateX(-90deg) translateZ(${half}px)`;

        cube.appendChild(face);
    }

    // Random duration
    const duration = Math.random() * 5 + 5; // 5-10s
    cube.style.animationDuration = `${duration}s`;

    bgContainer.appendChild(cube);

    // Remove after animation
    setTimeout(() => {
        cube.remove();
    }, duration * 1000);
}

// Spawn rate
setInterval(createFallingCube, 500);


// Event Listeners
btn.addEventListener('click', () => {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        if (!isRunning && popup.style.display !== 'block') {
            startTimer();
        } else if (isRunning) {
            stopTimer();
        } else if (popup.style.display === 'block') {
            closePopup();
        }
    }
});
