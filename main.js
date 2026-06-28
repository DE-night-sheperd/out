const responses = {};
let currentStep = 1;
let flatpickrInstance;

// Clock state
let selectedHour = 7;
let selectedMinute = 0;
let isDraggingHour = false;
let isDraggingMinute = false;

// Star state
let stars = [];
let mouseX = 0;
let mouseY = 0;
let hearts = [];

function goToStep(stepNumber) {
    document.getElementById(`step${currentStep}`).classList.add('hidden');
    currentStep = stepNumber;
    const nextStep = document.getElementById(`step${currentStep}`);
    nextStep.classList.remove('hidden');
    
    // Re-trigger animation
    nextStep.style.animation = 'none';
    nextStep.offsetHeight; // Trigger reflow
    nextStep.style.animation = 'modalIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    if (currentStep === 2) {
        setTimeout(() => {
            if (flatpickrInstance) {
                flatpickrInstance.open();
            }
        }, 300);
    } else if (currentStep === 6) {
        updateSummary();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initNoButton();
    initDatePicker();
    initAnalogClock();
    initStarsCanvas();
    animateStars();
    
    // Music setup
    const bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    let isMusicPlaying = false;
    
    musicToggle.addEventListener('click', () => {
        if (isMusicPlaying) {
            bgMusic.pause();
            musicToggle.textContent = '🔇';
        } else {
            bgMusic.play().catch(err => console.log('Audio play failed:', err));
            musicToggle.textContent = '🔊';
        }
        isMusicPlaying = !isMusicPlaying;
    });
    
    // Play music when user clicks Yes (goes to step 2)
    // We'll override goToStep or add a listener to step change
    // Let's modify goToStep
    const originalGoToStep = goToStep;
    goToStep = function(stepNumber) {
        if (stepNumber === 2 && !isMusicPlaying) {
            bgMusic.play().then(() => {
                isMusicPlaying = true;
                musicToggle.textContent = '🔊';
            }).catch(err => console.log('Audio play failed:', err));
        }
        originalGoToStep(stepNumber);
    };
});

function initNoButton() {
    const noButton = document.getElementById('noButton');
    const buttonsContainer = document.querySelector('.buttons-container');

    function moveNoButton() {
        const containerRect = buttonsContainer.getBoundingClientRect();
        const buttonRect = noButton.getBoundingClientRect();
        
        const maxX = containerRect.width - buttonRect.width - 30;
        const maxY = containerRect.height - buttonRect.height - 30;
        
        const randomX = Math.random() * maxX + 15;
        const randomY = Math.random() * maxY + 15;
        
        noButton.style.left = `${randomX}px`;
        noButton.style.top = `${randomY}px`;
    }

    noButton.addEventListener('mouseenter', moveNoButton);
    noButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveNoButton();
    });
}

function initDatePicker() {
    const today = new Date();
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

    flatpickrInstance = flatpickr('#datePicker', {
        minDate: today,
        maxDate: twoMonthsLater,
        dateFormat: 'Y-m-d',
        disableMobile: true,
        onChange: (selectedDates, dateStr) => {
            if (dateStr) {
                responses.date = dateStr;
                goToStep(3);
            }
        }
    });
}

function initAnalogClock() {
    const clock = document.getElementById('clock');
    const hourHand = document.getElementById('hourHand');
    const minuteHand = document.getElementById('minuteHand');

    function updateClock() {
        const hourDeg = (selectedHour % 12) * 30 + (selectedMinute / 60) * 30;
        const minuteDeg = selectedMinute * 6;
        
        hourHand.style.transform = `rotate(${hourDeg}deg)`;
        minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
        
        updateSelectedTimeDisplay();
    }

    function updateSelectedTimeDisplay() {
        const displayHour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
        const period = selectedHour < 12 ? 'AM' : 'PM';
        const displayMinute = selectedMinute.toString().padStart(2, '0');
        document.getElementById('selectedTime').textContent = `${displayHour}:${displayMinute} ${period}`;
    }

    function getAngleFromCenter(clientX, clientY) {
        const clockRect = clock.getBoundingClientRect();
        const centerX = clockRect.left + clockRect.width / 2;
        const centerY = clockRect.top + clockRect.height / 2;
        return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    }

    function handleClockMove(e) {
        if (!isDraggingHour && !isDraggingMinute) return;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        let angle = getAngleFromCenter(clientX, clientY);
        angle = (angle + 90 + 360) % 360;
        
        if (isDraggingMinute) {
            // Snap to nearest minute
            selectedMinute = Math.round(angle / 6);
            if (selectedMinute === 60) selectedMinute = 0;
        } else if (isDraggingHour) {
            selectedHour = Math.round(angle / 30);
            if (selectedHour === 0) selectedHour = 12;
            // Add 12 to make it PM by default
            if (selectedHour < 12) selectedHour += 12;
        }
        
        updateClock();
    }

    function handleClockStart(e, type) {
        e.preventDefault();
        // Remove transition while dragging for instant movement
        hourHand.style.transition = 'none';
        minuteHand.style.transition = 'none';
        
        if (type === 'hour') {
            isDraggingHour = true;
        } else {
            isDraggingMinute = true;
        }
        handleClockMove(e);
    }

    function handleClockEnd() {
        if (!isDraggingHour && !isDraggingMinute) return;
        
        // Restore transitions after dragging ends
        hourHand.style.transition = 'transform 0.1s ease';
        minuteHand.style.transition = 'transform 0.1s ease';
        
        isDraggingHour = false;
        isDraggingMinute = false;
    }

    // Hand event listeners
    hourHand.addEventListener('mousedown', (e) => handleClockStart(e, 'hour'));
    minuteHand.addEventListener('mousedown', (e) => handleClockStart(e, 'minute'));
    hourHand.addEventListener('touchstart', (e) => handleClockStart(e, 'hour'));
    minuteHand.addEventListener('touchstart', (e) => handleClockStart(e, 'minute'));

    // Global move/end listeners
    document.addEventListener('mousemove', handleClockMove);
    document.addEventListener('mouseup', handleClockEnd);
    document.addEventListener('touchmove', handleClockMove);
    document.addEventListener('touchend', handleClockEnd);

    // Initialize clock to default time (7:00 PM)
    updateClock();
}

function confirmTime() {
    responses.time = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    goToStep(4);
}

function selectTheme(theme) {
    responses.theme = theme;
    goToStep(5);
}

function buildSummaryHTML() {
    const cuisineCheckboxes = document.querySelectorAll('#step5 .checkbox-group input:checked');
    responses.cuisines = Array.from(cuisineCheckboxes).map(cb => cb.value);
    
    const snackCheckboxes = document.querySelectorAll('#step6 .checkbox-group input:checked');
    responses.snacks = Array.from(snackCheckboxes).map(cb => cb.value);
    
    responses.restrictions = document.getElementById('dietaryRestrictions').value;
    
    const themeNames = {
        'campus_coffee': '☕ Campus Coffee',
        'movie_night': '🎬 Movie Night',
        'food_run': '🍔 Food Run',
        'late_night_walk': '🌙 Late Night Walk'
    };
    
    const cuisineLabels = {
        'italian': 'Italian',
        'sushi': 'Sushi',
        'skopo': 'Skopo',
        'pizza': 'Pizza',
        'grapes': 'Grapes',
        'fruits': 'Fruits',
        'braai': 'Braai',
        'kota': 'Kota',
        'chips': 'Chips'
    };
    
    const snackLabels = {
        'zimbas': 'Zimbas',
        'sweets': 'Sweets',
        'gummies': 'Gummies',
        'fruits_snacks': 'Fruits',
        'biscuits': 'Biscuits',
        'chocolate': 'Chocolate'
    };
    
    const cuisinesDisplay = responses.cuisines.length > 0 
        ? responses.cuisines.map(c => cuisineLabels[c] || c).join(', ') 
        : 'Any';
        
    const snacksDisplay = responses.snacks.length > 0 
        ? responses.snacks.map(s => snackLabels[s] || s).join(', ') 
        : 'Any';
    
    return `
        <p><strong>Date:</strong> ${responses.date}</p>
        <p><strong>Time:</strong> ${responses.time}</p>
        <p><strong>Theme:</strong> ${themeNames[responses.theme] || responses.theme}</p>
        <p><strong>Cuisines:</strong> ${cuisinesDisplay}</p>
        <p><strong>Snacks:</strong> ${snacksDisplay}</p>
        <p><strong>Restrictions:</strong> ${responses.restrictions || 'None'}</p>
    `;
}

function updateSummary() {
    const summaryDiv = document.getElementById('summary');
    summaryDiv.innerHTML = buildSummaryHTML();
}

function confirmAndSave() {
    // Populate final plan details
    const finalPlanDetails = document.getElementById('finalPlanDetails');
    finalPlanDetails.innerHTML = buildSummaryHTML();
    
    // Go to step 8
    goToStep(8);
    
    // Add download button listener
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = downloadDatePlan;
}

function downloadDatePlan() {
    const card = document.getElementById('datePlanCard');
    html2canvas(card, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#fff5f5',
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'perfect-date-plan.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error('Failed to generate image:', err);
        alert('Failed to download, please take a screenshot!');
    });
}

function displayQRCode(url) {
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';
    new QRCode(qrCodeDiv, {
        text: url,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    document.getElementById('url-display').textContent = url;
}

function copyLink() {
    const url = document.getElementById('url-display').textContent;
    navigator.clipboard.writeText(url).then(() => {
        const status = document.getElementById('copy-status');
        status.classList.remove('hidden');
        setTimeout(() => {
            status.classList.add('hidden');
        }, 2000);
    });
}

// =====================================
// STAR/HEART ANIMATION FUNCTIONS
// =====================================
function initStarsCanvas() {
    const canvas = document.getElementById('starsCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Generate initial stars with roots
    for (let i = 0; i < 300; i++) {
        stars.push(createStar());
    }
    
    // Define heart positions
    hearts = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3 },
        { x: canvas.width * 0.8, y: canvas.height * 0.3 },
        { x: canvas.width * 0.5, y: canvas.height * 0.7 }
    ];
    
    // Mouse move event
    canvas.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Touch event
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    });
    
    // Resize event
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        hearts = [
            { x: canvas.width * 0.2, y: canvas.height * 0.3 },
            { x: canvas.width * 0.8, y: canvas.height * 0.3 },
            { x: canvas.width * 0.5, y: canvas.height * 0.7 }
        ];
    });
}

function createStar() {
    return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 3 + 1,
        targetX: Math.random() * window.innerWidth,
        targetY: Math.random() * window.innerHeight,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        color: getRandomPinkColor(),
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        roots: [], // Store root points
        rootLength: 15 + Math.random() * 30,
        rootSegments: 3 + Math.floor(Math.random() * 4),
        morphLevel: 0, // 0 = star, 1 = heart
        morphSpeed: 0.02 + Math.random() * 0.03
    };
}

function getRandomPinkColor() {
    const colors = [
        '#ff477e',
        '#ff6b9d',
        '#ff8fa3',
        '#ffb3c1',
        '#ffccd5',
        '#fff0f3',
        '#ff2d6b'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getHeartPosition(scale, t) {
    // Parametric heart equation
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * scale, y: y * scale };
}

function animateStars() {
    const canvas = document.getElementById('starsCanvas');
    const ctx = canvas.getContext('2d');
    let time = 0;
    
    function draw() {
        time += 0.005;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw each star
        stars.forEach((star, index) => {
            // Find nearest heart
            let nearestHeart = hearts[0];
            let minDist = Infinity;
            hearts.forEach(h => {
                const dist = Math.hypot(star.x - h.x, star.y - h.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearestHeart = h;
                }
            });
            
            // Assign target position on nearest heart
            const starIndex = index % 100;
            const t = (starIndex / 100) * Math.PI * 2 + time;
            const heartPos = getHeartPosition(20, t);
            star.targetX = nearestHeart.x + heartPos.x;
            star.targetY = nearestHeart.y + heartPos.y;
            
            // Mouse attraction and morph
            const mouseDist = Math.hypot(star.x - mouseX, star.y - mouseY);
            if (mouseDist < 200) {
                star.targetX = mouseX + (Math.random() - 0.5) * 120;
                star.targetY = mouseY + (Math.random() - 0.5) * 120;
                star.morphLevel = Math.min(1, star.morphLevel + 0.05);
            } else {
                star.morphLevel = Math.max(0, star.morphLevel - 0.02);
            }
            
            // Move towards target
            star.x += (star.targetX - star.x) * 0.05;
            star.y += (star.targetY - star.y) * 0.05;
            
            // Update rotation
            star.rotation += star.rotationSpeed;
            
            // Pulse effect
            const pulse = Math.sin(time * 10 + star.pulsePhase) * 0.3 + 0.7;
            const currentSize = star.size * pulse;
            
            // Draw roots
            drawRoots(ctx, star, time);
            
            // Draw star/heart
            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate(star.rotation);
            if (star.morphLevel > 0.01) {
                drawMorphingHeartStar(ctx, 0, 0, 5, currentSize, currentSize * 0.5, star.color, star.morphLevel);
            } else {
                drawStarShape(ctx, 0, 0, 5, currentSize, currentSize * 0.5, star.color);
            }
            ctx.restore();
        });
        
        requestAnimationFrame(draw);
    }
    
    draw();
}

function drawRoots(ctx, star, time) {
    ctx.save();
    ctx.strokeStyle = star.color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    
    let prevX = star.x;
    let prevY = star.y;
    
    for (let i = 0; i < star.rootSegments; i++) {
        const angle = (i / star.rootSegments) * Math.PI * 2 + time * 0.5;
        const length = (star.rootLength / star.rootSegments) * (i + 1);
        const x = prevX + Math.cos(angle) * length * 0.3;
        const y = prevY + Math.sin(angle) * length * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        prevX = x;
        prevY = y;
    }
    
    ctx.restore();
}

function drawMorphingHeartStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color, t) {
    // Morph between star and heart
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    
    // First point
    let starX = cx;
    let starY = cy - outerRadius;
    let heartParam = Math.PI / 2;
    let heartX = cx + 16 * Math.pow(Math.sin(heartParam), 3) * (outerRadius / 40);
    let heartY = cy - (13 * Math.cos(heartParam) - 5 * Math.cos(2 * heartParam) - 2 * Math.cos(3 * heartParam) - Math.cos(4 * heartParam)) * (outerRadius / 40);
    let finalX = starX + (heartX - starX) * t;
    let finalY = starY + (heartY - starY) * t;
    ctx.moveTo(finalX, finalY);
    
    for (let i = 0; i < spikes; i++) {
        // Outer point (star)
        starX = cx + Math.cos(rot) * outerRadius;
        starY = cy + Math.sin(rot) * outerRadius;
        
        // Heart equivalent
        heartParam = Math.PI / 2 + (i / spikes) * Math.PI * 2;
        heartX = cx + 16 * Math.pow(Math.sin(heartParam), 3) * (outerRadius / 40);
        heartY = cy - (13 * Math.cos(heartParam) - 5 * Math.cos(2 * heartParam) - 2 * Math.cos(3 * heartParam) - Math.cos(4 * heartParam)) * (outerRadius / 40);
        finalX = starX + (heartX - starX) * t;
        finalY = starY + (heartY - starY) * t;
        ctx.lineTo(finalX, finalY);
        
        rot += step;
        
        // Inner point (star)
        starX = cx + Math.cos(rot) * innerRadius;
        starY = cy + Math.sin(rot) * innerRadius;
        
        // Heart equivalent (slightly different)
        heartParam = Math.PI / 2 + (i / spikes) * Math.PI * 2 + Math.PI / spikes;
        heartX = cx + 16 * Math.pow(Math.sin(heartParam), 3) * (innerRadius / 20);
        heartY = cy - (13 * Math.cos(heartParam) - 5 * Math.cos(2 * heartParam) - 2 * Math.cos(3 * heartParam) - Math.cos(4 * heartParam)) * (innerRadius / 20);
        finalX = starX + (heartX - starX) * t;
        finalY = starY + (heartY - starY) * t;
        ctx.lineTo(finalX, finalY);
        
        rot += step;
    }
    
    // Close the shape
    starX = cx;
    starY = cy - outerRadius;
    heartParam = Math.PI / 2;
    heartX = cx + 16 * Math.pow(Math.sin(heartParam), 3) * (outerRadius / 40);
    heartY = cy - (13 * Math.cos(heartParam) - 5 * Math.cos(2 * heartParam) - 2 * Math.cos(3 * heartParam) - Math.cos(4 * heartParam)) * (outerRadius / 40);
    finalX = starX + (heartX - starX) * t;
    finalY = starY + (heartY - starY) * t;
    ctx.lineTo(finalX, finalY);
    
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
}

function drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
}
