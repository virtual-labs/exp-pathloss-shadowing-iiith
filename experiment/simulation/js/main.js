function openPart(evt, name){
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(name).style.display = "block";
    evt.currentTarget.className += " active";
}

function startup() {
    document.getElementById("default").click();
}

window.onload = startup;
initializeTask3Simulation();
initializeTask1Simulation();

//______________________________________________________________________________________________________________________________

function initializeTask1Simulation() {
    const slider = document.getElementById('distance-slider');
    const transmitter = document.getElementById('transmitter');
    const receiver = document.getElementById('receiver');
    const txHeightInput = document.getElementById('tx-height');
    const rxHeightInput = document.getElementById('rx-height');
    const fcInput = document.getElementById('fc'); // Added reference
    const gInput = document.getElementById('G');   // Added reference
    const distanceDisplay = document.getElementById('distance');
    const pathLossDisplay = document.getElementById('path-loss');
    const registerBtn = document.getElementById('register-btn');
    const plotBtn = document.getElementById('plot-btn');
    const resetBtn = document.getElementById('resetBtn');
    const chartCanvas = document.getElementById('pathloss-chart');
    const valuesTableBody = document.querySelector('#values-table tbody');

    // CHANGE: maxDistance is now in km
    const maxDistance = 100;
    slider.min = 1;
    slider.max = maxDistance;
    let curves = [];

    // --- NEW: Instruction Highlight Logic ---
    function setActiveStep(stepNumber) {
        // 1. Remove active class from all steps
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`t1-step-${i}`);
            if (el) el.classList.remove('active-step');
        }
        // 2. Add active class to the current step
        const activeEl = document.getElementById(`t1-step-${stepNumber}`);
        if (activeEl) activeEl.classList.add('active-step');
    }

    // Event listeners to trigger step changes
    const inputs = [txHeightInput, rxHeightInput, fcInput, gInput];
    inputs.forEach(input => {
        if(input) {
            input.addEventListener('focus', () => setActiveStep(1)); // Focus on inputs -> Step 1
            input.addEventListener('change', () => setActiveStep(2)); // Changed input -> Go to Step 2
        }
    });

    // Slider interaction -> Go to Step 3
    slider.addEventListener('mousedown', () => setActiveStep(3));
    slider.addEventListener('input', () => setActiveStep(3));

    // ----------------------------------------

    resetBtn.addEventListener('click', () => {
        curves = [];
        valuesTableBody.innerHTML = '';
        if (Chart.getChart(chartCanvas)) {
            Chart.getChart(chartCanvas).destroy();
        }

        slider.value = slider.min;
        updateAntennaHeights();
        showNotification("All curves and data have been reset!");
        setActiveStep(1); // Reset instructions to Step 1
    });

    // Okumura Model path loss calculation
    function calculatePathLoss(G, distance_m, frequency_hz, ht, hr) {
        const c = 3 * 1e8; // Speed of light
        const lambda = c / frequency_hz;

        // Free-Space Path Loss
        const L_fcd = 20 * Math.log10((4 * Math.PI * distance_m) / lambda);
        const G_ht = 20 * Math.log10(ht / 200);

        let G_hr;
        if (hr <= 3) {
            G_hr = 10 * Math.log10(hr / 3);
        } else { // 3 < hr < 10
            G_hr = 20 * Math.log10(hr / 3);
        }

        const path_loss = L_fcd - G_ht - G_hr;
        return path_loss;
    }

    function updateTxAntennaImage(height, imgElement) {
        if (!imgElement) return;
        if (height <= 150) {
            imgElement.src = './images/antenna-small.svg';
            imgElement.style.width = '60px';
        } else if (height <= 500) {
            imgElement.src = './images/antenna-medium.svg';
            imgElement.style.width = '80px';
        } else { // height > 500
            imgElement.src = './images/antenna-large.svg';
            imgElement.style.width = '100px';
        }
        imgElement.style.height = 'auto';
    }

    function updateRxAntennaImage(height, imgElement) {
        if (!imgElement) return;
        imgElement.src = './images/antenna-small.svg';
        const baseWidth = 28;
        const scaleFactor = 1.2;
        imgElement.style.width = `${baseWidth + (height * scaleFactor)}px`;
        imgElement.style.height = 'auto';
    }


    function updateAntennaHeights() {
        const txHeight = parseInt(txHeightInput.value) || 30;
        const rxHeight = parseInt(rxHeightInput.value) || 1;

        updateTxAntennaImage(txHeight, transmitter.querySelector('img'));
        updateRxAntennaImage(rxHeight, receiver.querySelector('img'));
        updatePathLoss();
    }

    function updateReceiverPosition() {
        const distance_km = parseInt(slider.value);
        const experimentWidth = document.getElementById('experiment-area').offsetWidth;
        const receiverWidth = receiver.offsetWidth;
        const experimentPadding = 40;
        
        const transmitterRightEdge = experimentWidth * 0.2; 
        
        const availableWidth = experimentWidth - transmitterRightEdge - (2 * experimentPadding);
        const receiverPosition = transmitterRightEdge + experimentPadding + 
                            ((distance_km - 1) / (maxDistance - 1)) * availableWidth;
        
        receiver.style.left = `${receiverPosition - (receiverWidth / 2)}px`;
    }

    function updatePathLoss() {
        const distance_km = parseInt(slider.value);
        const G = parseFloat(document.getElementById("G").value) || 0;
        const txHeight = parseInt(txHeightInput.value) || 30;
        const rxHeight = parseInt(rxHeightInput.value) || 1;
        const fc_mhz = parseFloat(document.getElementById("fc").value) || 150;

        const distance_m = distance_km * 1000;
        const fc_hz = fc_mhz * 1e6;

        distanceDisplay.textContent = `${distance_km} km`;
        const pathLoss = calculatePathLoss(G, distance_m, fc_hz, txHeight, rxHeight);
        pathLossDisplay.textContent = (-pathLoss).toFixed(2);
        updateReceiverPosition();
    }

    function showNotification(message, isError = false) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = isError ? 'notification error' : 'notification';
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    function registerValues() {
        // --- NEW: Highlight Step 4 (Observation) when button is clicked ---
        setActiveStep(4);
        // ------------------------------------------------------------------

        const distance = parseInt(slider.value); 
        const txHeight = parseInt(txHeightInput.value) || 1;
        const rxHeight = parseInt(rxHeightInput.value) || 1;
        const pathLossNegative = parseFloat(pathLossDisplay.textContent); 

        let curveIndex = curves.findIndex(curve =>
            curve.txHeight === txHeight && curve.rxHeight === rxHeight
        );

        if (curveIndex === -1) {
            if (curves.length >= 5) {
                showNotification("Maximum of 5 different height configurations reached!", true);
                return;
            }
            curves.push({
                txHeight,
                rxHeight,
                dataPoints: [],
                color: `hsl(${curves.length * 60}, 70%, 50%)`
            });
            curveIndex = curves.length - 1;
        }

        let curve = curves[curveIndex];
        const existingPointIndex = curve.dataPoints.findIndex(point => point.distance === distance);
        if (existingPointIndex !== -1) {
            showNotification("A measurement at this distance already exists for these heights!", true);
            return;
        }

        curve.dataPoints.push({ distance, pathLoss: pathLossNegative });
        curve.dataPoints.sort((a, b) => a.distance - b.distance);

        updateTable();
        showNotification(`Registered: Distance=${distance}km, Path Loss=${pathLossNegative}dB`);
        plotGraph();
    }

    function updateTable() {
        valuesTableBody.innerHTML = '';
        curves.forEach((curve, index) => {
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <td colspan="3" style="background-color: ${curve.color}20">
                    Tx Height: ${curve.txHeight}m, Rx Height: ${curve.rxHeight}m
                </td>
            `;
            valuesTableBody.appendChild(headerRow);
            curve.dataPoints.forEach(point => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${point.distance}</td>
                    <td>${point.pathLoss}</td>
                `;
                valuesTableBody.appendChild(row);
            });
        });
    }

    function plotGraph() {
        if (curves.length === 0) {
            showNotification("No data to plot. Please register values first!", true);
            return;
        }
        const ctx = chartCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);

        if (Chart.getChart(chartCanvas)) {
            Chart.getChart(chartCanvas).destroy();
        }

        chartCanvas.style.backgroundColor = 'white';
        const datasets = curves.map(curve => ({
            label: `Tx=${curve.txHeight}m, Rx=${curve.rxHeight}m`,
            data: curve.dataPoints.map(point => ({
                x: point.distance,
                y: point.pathLoss
            })),
            borderColor: curve.color,
            backgroundColor: 'rgba(118, 223, 237, 0.25)', 
            borderWidth: 2,
            fill: true
        }));

        new Chart(chartCanvas, {
            type: 'line',
            data: {
                datasets,
                backgroundColor: 'white'
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Distance (km)', color: '#333' },
                        grid: { color: 'rgba(0, 0, 0, 0.1)', drawBackground: true },
                        ticks: { color: '#333' }
                    },
                    y: {
                        title: { display: true, text: 'Path Loss (dB)', color: '#333' },
                        grid: { color: 'rgba(0, 0, 0, 0.1)', drawBackground: true },
                        ticks: { color: '#333' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#333', usePointStyle: true, padding: 20 },
                        backgroundColor: 'white'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        borderColor: '#ddd',
                        borderWidth: 1
                    }
                },
                layout: { padding: { top: 10, right: 20, bottom: 10, left: 10 } }
            },
            plugins: [{
                id: 'customCanvasBackgroundColor',
                beforeDraw: (chart, args, options) => {
                    const {ctx} = chart;
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                }
            }]
        });
    }

    slider.addEventListener('input', updatePathLoss);
    txHeightInput.addEventListener('input', updateAntennaHeights);
    rxHeightInput.addEventListener('input', updateAntennaHeights);
    registerBtn.addEventListener('click', registerValues);

    if (plotBtn) plotBtn.addEventListener('click', plotGraph);

    updateAntennaHeights();
    updatePathLoss();
    // Initialize step 1 active
    setActiveStep(1); 
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~task_3~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function initializeTask3Simulation() {
    const kInput = document.getElementById('k_val');
    const gammaInput = document.getElementById('gamma_val');
    const d0Input = document.getElementById('d0_val');
    const densityInput = document.getElementById('obstacle_density_val');
    const distanceSlider = document.getElementById('current_distance_slider');
    const distanceDisplay = document.getElementById('current_distance_val');
    const angleSlider = document.getElementById('receiver_angle_slider');
    const angleDisplay = document.getElementById('receiver_angle_val');
    const randomizeBtn = document.getElementById('randomize_obstacles_btn');
    const recordBtn = document.getElementById('record_data_btn');
    const resetBtn = document.getElementById('reset_session_btn');
    const autoGenerateBtn = document.getElementById('auto_generate_btn');
    const recordCountDisplay = document.getElementById('record_count_display');

    const simCanvas = document.getElementById('simulationCanvas');
    const simCtx = simCanvas.getContext('2d');
    const graphCanvas = document.getElementById('pathlossGraph');
    const graphPlaceholder = document.getElementById('graph_placeholder');

    const outStatus = document.getElementById('out_status');
    const statusIndicator = document.getElementById('status_indicator');
    const outTotalPl = document.getElementById('out_total_pl_val');
    const outPrPt = document.getElementById('out_pr_pt_val');

    let pathlossChart;
    let obstacles = [];
    let currentK, currentGamma, currentD0, currentRxDistance_km, currentRxAngleRad;
    let recordedData = [];
    const MAX_RECORDINGS = 50;

    // Simulation Constants
    const canvasWidth = simCanvas.width;
    const canvasHeight = simCanvas.height;
    const txPos_px = { x: canvasWidth / 2, y: canvasHeight / 2 };
    const maxCanvasDisplayRadius_px = Math.min(canvasWidth, canvasHeight) / 2 * 0.85;

    let worldScale_pxPerKm;

    const TX_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY2N2VlYSI+PHBhdGggZD0iTTEyIDNsNCA0aC0zdjEwaC0yVjdIOFs0LTR6TTQgOWgzdjJINGMtMnptMCA0aDN2Mkg0di0yem0xNi00aC0zdjJoM3YtMnptMCA0aC0zdjJoM3YtMnoiLz48L3N2Zz4=';
    const RX_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY2N2VlYSI+PHBhdGggZD0iTTE2IDFIOEM2LjM0IDEgNSAyLjM0IDUgNHYxNmMwIDEuNjYgMS4zNCAzIDMgM2g4YzEuNjYgMCAzLTEuMzQgMy0zVjRjMC0xLjY2LTEuMzQtMy0zLTN6TTE0IDIxaC00di0xaDR2MXptMS4yNS0zSDguNzVWNGg2LjV2MTR6Ii8+PC9zdmc+';

    let txImage, rxImage;

    const TX_IMG_SIZE = 48;
    const RX_IMG_SIZE = 28;

    function loadImages() {
        return new Promise((resolve) => {
            txImage = new Image();
            rxImage = new Image();
            let loadedCount = 0;
            const onImageLoad = () => {
                loadedCount++;
                if (loadedCount === 2) resolve();
            };

            txImage.onload = onImageLoad;
            rxImage.onload = onImageLoad;
            txImage.onerror = onImageLoad;
            rxImage.onerror = onImageLoad;
            txImage.src = TX_ICON;
            rxImage.src = RX_ICON;
        });
    }

    async function init() {
        await loadImages();
        setupEventListeners();
        initializeChart();
        readAllInputs();
        calculateWorldScale();
        placeObstacles();
        updateIdealCurve(); // Generate ideal curve on load
        updateSimulation();
        updateUIState();
    }

    function setupEventListeners() {
        [kInput, gammaInput, d0Input].forEach(el => {
            el.addEventListener('input', () => {
                readAllInputs();
                updateSimulation();
                updateIdealCurve(); // Update ideal curve when params change
            });
        });

        [distanceSlider, angleSlider].forEach(el => {
            el.addEventListener('input', () => {
                readAllInputs();
                updateSimulation();
            });
        });

        densityInput.addEventListener('input', () => {
            readAllInputs();
            placeObstacles();
            updateSimulation();
        });

        randomizeBtn.addEventListener('click', () => {
            placeObstacles();
            updateSimulation();
        });

        recordBtn.addEventListener('click', recordDataPoint);
        resetBtn.addEventListener('click', resetSession);
        autoGenerateBtn.addEventListener('click', autoGenerateData);
    }

    function readAllInputs() {
        currentK = parseFloat(kInput.value);
        currentGamma = parseFloat(gammaInput.value);
        currentD0 = parseFloat(d0Input.value);
        currentRxDistance_km = parseFloat(distanceSlider.value);
        distanceDisplay.textContent = currentRxDistance_km.toFixed(2);
        currentRxAngleRad = parseFloat(angleSlider.value) * Math.PI / 180;
        angleDisplay.textContent = (currentRxAngleRad * 180 / Math.PI).toFixed(0);
    }

    function updateUIState() {
        recordCountDisplay.textContent = `${recordedData.length} / ${MAX_RECORDINGS}`;
        recordBtn.disabled = recordedData.length >= MAX_RECORDINGS;
        autoGenerateBtn.disabled = recordedData.length >= MAX_RECORDINGS;
    }

    function recordDataPoint() {
        if (recordedData.length >= MAX_RECORDINGS) return;
        readAllInputs();
        const { prPtDb } = calculateCurrentSignal();
        recordedData.push({ x: currentRxDistance_km, y: prPtDb });
        updateUIState();
        generateGraph(); // Immediately plot the new point
    }

    function autoGenerateData() {
        const NUM_AUTO_POINTS = 50;
        const min_dist = parseFloat(distanceSlider.min);
        const max_dist = parseFloat(distanceSlider.max);
        recordedData = [];
        for (let i = 0; i < NUM_AUTO_POINTS; i++) {
            if (recordedData.length >= MAX_RECORDINGS) break;
            const randomDist_km = Math.random() * (max_dist - min_dist) + min_dist;
            const randomAngle_rad = Math.random() * 2 * Math.PI;
            const { prPtDb } = calculateSignalAtPoint(randomDist_km, randomAngle_rad);
            recordedData.push({ x: randomDist_km, y: prPtDb });
        }
        updateUIState();
        generateGraph();
    }

    function updateIdealCurve() {
        if (!pathlossChart) return;
        readAllInputs();
        const meanPrPtData = [];
        const minD = parseFloat(distanceSlider.min);
        const maxD = parseFloat(distanceSlider.max);
        for (let dist = minD; dist <= maxD; dist += 0.1) {
            if (dist === 0) continue;
            const meanPl = calculateMeanPathloss(dist, currentK, currentGamma, currentD0);
            meanPrPtData.push({ x: dist, y: -meanPl });
        }
        pathlossChart.data.datasets[0].data = meanPrPtData;
        pathlossChart.update();
    }

    function generateGraph() {
        if (recordedData.length === 0) {
            graphPlaceholder.style.display = 'flex';
            graphCanvas.style.display = 'none';
            return;
        }

        graphPlaceholder.style.display = 'none';
        graphCanvas.style.display = 'block';

        const minPrPt = Math.min(...recordedData.map(p => p.y));
        const yAxisFloor = isFinite(minPrPt) ? Math.floor(minPrPt / 20) * 20 : -180;

        pathlossChart.data.datasets[1].data = recordedData;
        pathlossChart.options.scales.y.min = yAxisFloor;
        pathlossChart.update();
    }

    function resetSession() {
        recordedData = [];
        if (pathlossChart) {
            pathlossChart.data.datasets[1].data = [];
            pathlossChart.options.scales.y.min = -180;
            pathlossChart.update();
        }

        updateIdealCurve();

        graphPlaceholder.style.display = 'flex';
        graphCanvas.style.display = 'none';
        updateUIState();
        placeObstacles();
        updateSimulation();
    }

    function calculateSignalAtPoint(distance_km, angle_rad) {
        const rxRadius_px = distance_km * worldScale_pxPerKm;
        const rxPos_px = {
            x: txPos_px.x + rxRadius_px * Math.cos(angle_rad),
            y: txPos_px.y + rxRadius_px * Math.sin(angle_rad)
        };
        const meanPlDb = calculateMeanPathloss(distance_km, currentK, currentGamma, currentD0);
        const { shadowingDb, isOccluded } = calculateShadowingAtPosition(rxPos_px);
        const totalPlDb = meanPlDb + shadowingDb;
        const prPtDb = -totalPlDb;
        return { totalPlDb, prPtDb, isOccluded };
    }

    function calculateCurrentSignal() {
        return calculateSignalAtPoint(currentRxDistance_km, currentRxAngleRad);
    }

    function updateSimulation() {
        const { totalPlDb, prPtDb, isOccluded } = calculateCurrentSignal();
        outTotalPl.textContent = totalPlDb.toFixed(2);
        outPrPt.textContent = prPtDb.toFixed(2);
        outStatus.textContent = isOccluded ? "Occluded" : "Line of Sight";
        statusIndicator.className = `status-indicator ${isOccluded ? 'status-occluded' : 'status-los'}`;
        const currentRxRadius_px = currentRxDistance_km * worldScale_pxPerKm;
        const rxPos_px = {
            x: txPos_px.x + currentRxRadius_px * Math.cos(currentRxAngleRad),
            y: txPos_px.y + currentRxRadius_px * Math.sin(currentRxAngleRad)
        };
        drawSimulationCanvas(rxPos_px, currentRxRadius_px, isOccluded);
    }

    function initializeChart() {
        pathlossChart = new Chart(graphCanvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Ideal Pathloss (No Fading)',
                    data: [],
                    borderColor: '#3498db',
                    borderDash: [8, 4],
                    type: 'line',
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 3,
                }, {
                    label: 'Recorded Pr/Pt (with Fading)',
                    data: [],
                    borderColor: '#e74c3c',
                    backgroundColor: '#e74c3c',
                    pointRadius: 4,
                    borderWidth: 2,
                    showLine: false,
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 20 },
                plugins: { legend: { labels: { usePointStyle: true, font: { size: 12 } } } },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Distance (km)', font: { size: 16, weight: '600' } },
                        min: 0,
                        max: 5
                    },
                    y: {
                        title: { display: true, text: 'Pr/Pt (dB)', font: { size: 16, weight: '600' } },
                        max: -40,
                        min: -180,
                    }
                }
            }
        });
    }

    function poissonRandom(lambda) {
        let L = Math.exp(-lambda), k = 0, p = 1;
        do { k++; p *= Math.random(); } while (p > L);
        return k - 1;
    }

    let spareRandom = null;

    function gaussianRandom(mean, stdDev) {
        let val, u, v, s;
        if (spareRandom !== null) {
            val = spareRandom;
            spareRandom = null;
        } else {
            do {
                u = Math.random() * 2 - 1;
                v = Math.random() * 2 - 1;
                s = u * u + v * v;
            } while (s >= 1 || s === 0);
            s = Math.sqrt(-2.0 * Math.log(s) / s);
            val = u * s;
            spareRandom = v * s;
        }
        return mean + stdDev * val;
    }

    function calculateWorldScale() {
        worldScale_pxPerKm = maxCanvasDisplayRadius_px / parseFloat(distanceSlider.max);
    }

    function placeObstacles() {
        obstacles = [];
        const densityPerKm2 = parseFloat(densityInput.value);
        const maxSimDistance_km = parseFloat(distanceSlider.max);
        const areaKm2 = Math.PI * Math.pow(maxSimDistance_km, 2);
        const lambda = densityPerKm2 * areaKm2;
        const numObs = poissonRandom(lambda);
        for (let i = 0; i < numObs; i++) {
            const obsDistFromTx_km = Math.sqrt(Math.random()) * maxSimDistance_km;
            const obsAngleRad = Math.random() * 2 * Math.PI;
            const obsRadius_km = (Math.random() * 8 * 0.6 + 8 * 0.2) / 1000;
            const obsX_km = obsDistFromTx_km * Math.cos(obsAngleRad);
            const obsY_km = obsDistFromTx_km * Math.sin(obsAngleRad);
            const attenuation = Math.max(0.5, 8 + (Math.random() - 0.5) * 2 * 5);

            obstacles.push({
                x_km: obsX_km, y_km: obsY_km, radius_km: obsRadius_km, attenuationDb: attenuation,
                x_px: txPos_px.x + obsX_km * worldScale_pxPerKm, y_px: txPos_px.y + obsY_km * worldScale_pxPerKm,
                radius_px: Math.max(2, obsRadius_km * worldScale_pxPerKm),
                color: `hsl(${30 + (attenuation / 20) * 30}, 70%, ${60 - (attenuation / 20) * 20}%)`
            });
        }
    }

    function calculateShadowingAtPosition(rxPos_px) {
        let fadingEffectDb = 0;
        let occluded = false;
        const FADING_VARIANCE = 15;
        const FADING_STD_DEV = Math.sqrt(FADING_VARIANCE);
        fadingEffectDb += gaussianRandom(0, 2);
        for (const obs of obstacles) {
            const obsCenter_px = { x: obs.x_px, y: obs.y_px };
            if (isLineSegmentIntersectingCircle(txPos_px, rxPos_px, obsCenter_px, obs.radius_px ** 2)) {
                occluded = true;
                fadingEffectDb += gaussianRandom(0, FADING_STD_DEV);
            }
        }
        return { shadowingDb: fadingEffectDb, isOccluded: occluded };
    }

    function calculateMeanPathloss(distance, K, gamma, d0) {
        if (distance <= 0) distance = 0.0001; if (d0 <= 0) d0 = 0.0001;
        return (distance < d0) ? K : K + 10 * gamma * Math.log10(distance / d0);
    }

    function isLineSegmentIntersectingCircle(P1, P2, C, R_sq) {
        let dX = P2.x - P1.x; let dY = P2.y - P1.y; if ((dX === 0) && (dY === 0)) return false;
        let t = ((C.x - P1.x) * dX + (C.y - P1.y) * dY) / (dX * dX + dY * dY); t = Math.max(0, Math.min(1, t));
        let closestX = P1.x + t * dX; let closestY = P1.y + t * dY;
        return ((C.x - closestX) ** 2 + (C.y - closestY) ** 2) <= R_sq;
    }

    function drawSimulationCanvas(rxPos_px, currentRxRadius_px, isOccluded) {
        simCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        simCtx.strokeStyle = 'rgba(74, 105, 189, 0.3)'; simCtx.lineWidth = 1; simCtx.setLineDash([3, 3]);
        for (let i = 1; i <= 5; i += 1) {
            const r = i * worldScale_pxPerKm;
            simCtx.beginPath();
            simCtx.arc(txPos_px.x, txPos_px.y, r, 0, 2 * Math.PI);
            simCtx.stroke();
        }

        simCtx.setLineDash([]); simCtx.beginPath(); simCtx.arc(txPos_px.x, txPos_px.y, currentRxRadius_px, 0, 2 * Math.PI);
        simCtx.strokeStyle = isOccluded ? 'rgba(255, 87, 34, 0.8)' : 'rgba(76, 175, 80, 0.8)'; simCtx.lineWidth = 2; simCtx.setLineDash([5, 5]); simCtx.stroke(); simCtx.setLineDash([]);
        obstacles.forEach(obs => {
            simCtx.fillStyle = obs.color; simCtx.fillRect(obs.x_px - obs.radius_px, obs.y_px - obs.radius_px, obs.radius_px * 2, obs.radius_px * 2);
        });

        if (txImage && txImage.complete) {
            simCtx.drawImage(txImage, txPos_px.x - TX_IMG_SIZE / 2, txPos_px.y - TX_IMG_SIZE / 2, TX_IMG_SIZE, TX_IMG_SIZE);
        }

        if (rxImage && rxImage.complete) {
            simCtx.drawImage(rxImage, rxPos_px.x - RX_IMG_SIZE / 2, rxPos_px.y - RX_IMG_SIZE / 2, RX_IMG_SIZE, RX_IMG_SIZE);
        }

        simCtx.beginPath();
        simCtx.moveTo(txPos_px.x, txPos_px.y);
        simCtx.lineTo(rxPos_px.x, rxPos_px.y);
        simCtx.strokeStyle = isOccluded ? '#ff5722' : '#4caf50';
        simCtx.lineWidth = 3;
        simCtx.stroke();
    }

    document.addEventListener('DOMContentLoaded', init);
}