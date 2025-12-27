document.addEventListener('DOMContentLoaded', () => {

    class RubiksCube {
        constructor(elementId) {
            this.container = document.getElementById(elementId);
            this.cubies = [];
            this.isAnimating = false;
            this.moveHistory = [];
            this.idleTimer = null;
            this.IDLE_TIMEOUT = 5000; // 5 seconds

            // Standard Colors
            this.colors = {
                U: 'color-white',   // Up
                D: 'color-yellow',  // Down
                F: 'color-green',   // Front
                B: 'color-blue',    // Back
                L: 'color-orange',  // Left
                R: 'color-red'      // Right
            };

            this.init();
            this.initInteraction();
            this.resetIdleTimer();
        }

        init() {
            this.container.innerHTML = ''; // Clear existing
            this.cubies = [];
            // Create 27 cubies (3x3x3)
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    for (let z = -1; z <= 1; z++) {
                        this.createCubie(x, y, z);
                    }
                }
            }
        }

        createCubie(x, y, z) {
            const el = document.createElement('div');
            el.className = 'cubie';
            const spacing = 70;
            const transform = new DOMMatrix().translate(x * spacing, -y * spacing, z * spacing);
            this.applyTransform(el, transform);

            // Add Faces
            this.addFace(el, 'face-top', y === 1 ? this.colors.U : 'color-black', 'U');
            this.addFace(el, 'face-bottom', y === -1 ? this.colors.D : 'color-black', 'D');
            this.addFace(el, 'face-front', z === 1 ? this.colors.F : 'color-black', 'F');
            this.addFace(el, 'face-back', z === -1 ? this.colors.B : 'color-black', 'B');
            this.addFace(el, 'face-left', x === -1 ? this.colors.L : 'color-black', 'L');
            this.addFace(el, 'face-right', x === 1 ? this.colors.R : 'color-black', 'R');

            this.container.appendChild(el);
            this.cubies.push({
                el,
                x, y, z,
                matrix: transform
            });
        }

        addFace(parent, className, colorClass, faceId) {
            const face = document.createElement('div');
            face.className = `cubie-face ${className}`;
            const sticker = document.createElement('div');
            sticker.className = `sticker ${colorClass}`;
            sticker.dataset.faceId = faceId;
            face.appendChild(sticker);
            parent.appendChild(face);
        }

        applyTransform(element, matrix) {
            element.style.transform = matrix.toString();
        }

        initInteraction() {
            // Rotate Layer on Click
            this.container.addEventListener('click', (e) => {
                this.resetIdleTimer();
                this.clearLogo(); // Clear logo if user interacts

                if (this.isAnimating) return;

                const sticker = e.target.closest('.sticker');
                if (!sticker) return;

                const faceId = sticker.dataset.faceId;
                if (faceId && !sticker.classList.contains('color-black')) {
                    this.rotateFace(faceId, 90, true); // Record move
                }
            });

            // Smooth Mouse Rotate logic remains...
            let targetX = -30;
            let targetY = -45;
            document.addEventListener('mousemove', (e) => {
                const x = (window.innerWidth / 2 - e.clientX) / 20;
                const y = (window.innerHeight / 2 - e.clientY) / 20;
                targetX = -30 + y;
                targetY = -45 - x;

                // Mouse movement also resets idle mainly to ensure "active" user
                // But specifically for 'solving', we care about moves.
                // However, the requirement is "5 seconds if not solved". 
                // Let's keep it simple: Reset timer on CLICK interaction (scrambling).
                // Mouse move is just viewing.
            });

            const animateLoop = () => {
                const time = Date.now() * 0.001;
                const continuousRot = Math.sin(time) * 5;
                this.container.style.transform = `rotateX(${targetX}deg) rotateY(${targetY + continuousRot}deg)`;
                requestAnimationFrame(animateLoop);
            };
            animateLoop();
        }

        resetIdleTimer() {
            clearTimeout(this.idleTimer);
            if (this.moveHistory.length > 0) {
                this.idleTimer = setTimeout(() => {
                    this.autoSolve();
                }, this.IDLE_TIMEOUT);
            }
        }

        rotateFace(faceId, angle, record = true) {
            this.isAnimating = true;
            let axis, layerVal;

            // Standard direction definition
            let direction = (faceId === 'R' || faceId === 'L' || faceId === 'F' || faceId === 'B' || faceId === 'D' || faceId === 'U') ? -90 : 90;
            // Correction for standard intuitive clicks
            if (faceId === 'L' || faceId === 'D' || faceId === 'F') direction = 90;
            if (faceId === 'R' || faceId === 'U' || faceId === 'B') direction = -90;

            // Override with passed angle if auto-solving
            if (angle) direction = angle;

            switch (faceId) {
                case 'R': axis = 'x'; layerVal = 1; break;
                case 'L': axis = 'x'; layerVal = -1; break;
                case 'U': axis = 'y'; layerVal = 1; break;
                case 'D': axis = 'y'; layerVal = -1; break;
                case 'F': axis = 'z'; layerVal = 1; break;
                case 'B': axis = 'z'; layerVal = -1; break;
            }

            const activeCubies = this.cubies.filter(c => Math.round(c[axis]) === layerVal);

            const rotMatrix = new DOMMatrix();
            if (axis === 'x') rotMatrix.rotateSelf(direction, 0, 0);
            if (axis === 'y') rotMatrix.rotateSelf(0, direction, 0);
            if (axis === 'z') rotMatrix.rotateSelf(0, 0, direction);

            activeCubies.forEach(cubie => {
                const newMatrix = rotMatrix.multiply(cubie.matrix);
                cubie.el.style.transform = newMatrix.toString();
                cubie.matrix = newMatrix;

                cubie.x = Math.round(newMatrix.m41 / 70);
                cubie.y = Math.round(-newMatrix.m42 / 70);
                cubie.z = Math.round(newMatrix.m43 / 70);
            });

            if (record) {
                this.moveHistory.push({ faceId, angle: direction });
            }

            setTimeout(() => {
                this.isAnimating = false;
                // If this was an auto-solve move, trigger next
                if (!record && this.solving) {
                    this.nextSolveMove();
                }
            }, 350);
        }

        autoSolve() {
            if (this.moveHistory.length === 0) return;
            this.solving = true;
            this.nextSolveMove();
        }

        nextSolveMove() {
            if (this.moveHistory.length === 0) {
                this.solving = false;
                this.showLogo();
                return;
            }

            const lastMove = this.moveHistory.pop();
            const reverseAngle = -lastMove.angle;
            this.rotateFace(lastMove.faceId, reverseAngle, false);
        }

        showLogo() {
            // Find Front Face Cubies (z=1) and add text
            // Sorted by Y (Top to Bottom) then X (Left to Right)
            const frontCubies = this.cubies.filter(c => c.z === 1);

            // Map text "CUBEHUB"
            // Grid:
            // (-1, 1) (0, 1) (1, 1) -> C U B
            // (-1, 0) (0, 0) (1, 0) -> E H U
            // (-1,-1) (0,-1) (1,-1) -> B . .

            const map = {
                '-1,1': 'C', '0,1': 'U', '1,1': 'B',
                '-1,0': 'E', '0,0': 'H', '1,0': 'U',
                '-1,-1': 'B'
            };

            frontCubies.forEach(c => {
                const key = `${c.x},${c.y}`;
                if (map[key]) {
                    const sticker = c.el.querySelector('.face-front .sticker');
                    if (sticker) {
                        sticker.textContent = map[key];
                        sticker.classList.add('blink');
                    }
                }
            });
        }

        clearLogo() {
            this.cubies.forEach(c => {
                const sticker = c.el.querySelector('.face-front .sticker');
                if (sticker) {
                    sticker.textContent = '';
                    sticker.classList.remove('blink');
                }
            });
        }
    }

    // Initialize
    const cube = new RubiksCube('rubiks-cube');

    // -- Onboarding Wizard Logic --
    const modal = document.getElementById('onboarding-modal');
    const startBtn = document.querySelector('.btn-primary');
    const closeBtn = document.querySelector('.close-modal');
    const stepLevel = document.getElementById('step-level');
    const stepCube = document.getElementById('step-cube');
    const levelIndicator = document.getElementById('level-indicator');

    startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
        resetWizard();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resetWizard();
    });

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
            resetWizard();
        }
    });

    let selectedLevel = '';

    window.selectLevel = (level) => {
        selectedLevel = level;
        stepLevel.style.display = 'none';
        stepCube.style.display = 'block';

        let levelText = '';
        if (level === 'beginner') levelText = 'Yeni Başlayan Seviyesi';
        if (level === 'intermediate') levelText = 'Orta Seviye';
        if (level === 'professional') levelText = 'Profesyonel Seviye';

        levelIndicator.textContent = `${levelText} için küp seçimi`;
    };

    window.selectCube = (cubeType) => {
        modal.style.display = 'none';
        if (cubeType === '3x3') {
            if (selectedLevel === 'beginner') {
                window.location.href = 'beginner.html';
            } else if (selectedLevel === 'intermediate' || selectedLevel === 'professional') {
                window.location.href = 'advanced.html';
            }
        } else {
            alert(`${cubeType} küpü için ${selectedLevel} eğitimi yakında eklenecek!`);
        }
        resetWizard();
    };

    function resetWizard() {
        stepLevel.style.display = 'block';
        stepCube.style.display = 'none';
        selectedLevel = '';
    }

});
