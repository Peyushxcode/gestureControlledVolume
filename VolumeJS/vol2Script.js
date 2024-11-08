let volume = 0.5; // Initial volume level (50%)
const videoElement = document.getElementById("video");
videoElement.volume = volume;

// Load TensorFlow.js and the HandPose model
async function loadModel() {
    const model = await handpose.load();
    console.log("HandPose model loaded.");
    return model;
}

// Start video stream
async function setupCamera() {
    const camera = document.getElementById("camera");
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    camera.srcObject = stream; // Use the separate camera element

    return new Promise((resolve) => {
        camera.onloadedmetadata = () => {
            resolve(camera);
        };
    });
}

// Recognize hand gestures and control volume
async function recognizeGestures(model, camera) {
    const gestureResult = document.getElementById("gestureResult");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = camera.videoWidth; // Use the camera video width
    canvas.height = camera.videoHeight; // Use the camera video height

    const predictions = await model.estimateHands(camera);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        const gesture = detectGesture(landmarks);
        gestureResult.innerHTML = gesture; // Display detected gesture

        // Control volume based on detected gestures
        if (gesture === "Volume Up Gesture Detected!") {
            adjustVolume(0.01); // Increase volume by 10%
        } else if (gesture === "Volume Down Gesture Detected!") {
            adjustVolume(-0.01); // Decrease volume by 10%
        }

        // Draw lines connecting the finger landmarks
        drawHand(landmarks, ctx);
    } else {
        gestureResult.innerHTML = "No hand detected.";
    }

    requestAnimationFrame(() => recognizeGestures(model, camera));
}

// Detect specific gestures based on landmarks
function detectGesture(landmarks) {
    const thumbTip = landmarks[4];   // Thumb tip
    const indexTip = landmarks[8];    // Index finger tip
    const middleTip = landmarks[12];   // Middle finger tip

    const threshold = 15; // Adjust this threshold if needed

    // Volume Up Gesture: Index finger up and thumb down
    const isVolumeUp = indexTip[1] < thumbTip[1] - threshold && middleTip[1] > thumbTip[1];

    // Volume Down Gesture: Index finger pointing down and thumb up
    const isVolumeDown = thumbTip[1] < indexTip[1] + threshold && middleTip[1] > indexTip[1];

    if (isVolumeUp) {
        return "Volume Up Gesture Detected!";
    } else if (isVolumeDown) {
        return "Volume Down Gesture Detected!";
    } else {
        return "Unknown Gesture.";
    }
}

// Adjust the video volume
function adjustVolume(change) {
    volume = Math.min(Math.max(volume + change, 0), 1); // Clamp volume between 0 and 1
    videoElement.volume = volume;
    console.log(`Volume: ${volume}`);
}

// Draw lines connecting hand landmarks
function drawHand(landmarks, ctx) {
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
        [0, 17], [17, 18], [18, 19], [19, 20]  // Pinky
    ];

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;

    connections.forEach(connection => {
        const [start, end] = connection;
        const startX = landmarks[start][0];
        const startY = landmarks[start][1];
        const endX = landmarks[end][0];
        const endY = landmarks[end][1];

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    });

    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; // Color for points
    landmarks.forEach(landmark => {
        const x = landmark[0];
        const y = landmark[1];
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Main function to start everything
async function main() {
    const camera = await setupCamera();
    camera.play();
    const model = await loadModel();
    recognizeGestures(model, camera);
}

// Start the application
main();