<?php
// แก้ไข: เพิ่ม .php ที่ท้ายชื่อไฟล์
require_once 'db_connect.php'; // Include the database connection file

// Get the raw POST data
$data = json_decode(file_get_contents("php://input"), true);

// Validate incoming data
if (!isset($data['answers']) || !is_array($data['answers']) || empty($data['answers'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Answers array is required and cannot be empty."]);
    exit();
}

$studentId = isset($data['studentId']) ? (int)$data['studentId'] : null;
$studentsClass = isset($data['studentGrade']) ? $data['studentGrade'] : null; // Changed variable name to match column intent
$answers = $data['answers'];

// Start a transaction
$conn->begin_transaction();

try {
    // Fetch questions with their weights from the database
    $sql_questions = "SELECT question_id, weight FROM questions";
    $result_questions = $conn->query($sql_questions);

    $questionWeights = [];
    if ($result_questions->num_rows > 0) {
        while($row = $result_questions->fetch_assoc()) {
            $questionWeights[$row['question_id']] = (float)$row['weight'];
        }
    } else {
        throw new Exception("No questions found in the database.");
    }

    $rawScore = 0;
    $maxPossibleScore = 0;
    $rawAnswers = []; // To store raw answers as JSON

    // Calculate raw score and max possible score
    foreach ($answers as $answer) {
        $questionId = (int)$answer['questionId'];
        $value = (int)$answer['value'];

        if (!isset($questionWeights[$questionId])) {
            throw new Exception("Invalid question ID: " . $questionId);
        }

        $weight = $questionWeights[$questionId];
        $rawScore += $value * $weight;
        $maxPossibleScore += 4 * $weight; // Assuming 0-4 scale for options
        $rawAnswers[$questionId] = $value;
    }

    // Calculate final score out of 100
    $finalScore = round(($rawScore / $maxPossibleScore) * 100);

    // Determine stress level
    $stressLevel;
    if ($finalScore <= 25) {
        $stressLevel = 'ต่ำ';
    } else if ($finalScore <= 50) {
        $stressLevel = 'ปานกลาง';
    } else if ($finalScore <= 75) {
        $stressLevel = 'สูง';
    } else {
        $stressLevel = 'สูงมาก';
    }

    // Prepare and execute the statement to insert assessment
    // Updated INSERT query to use students_class
    // แก้ไข: เปลี่ยน "sisss" เป็น "isiss"
    // i: student_id (int)
    // s: students_class (string)
    // i: score (int)
    // s: stress_level (string)
    // s: raw_answers (string/JSON)
    $stmt = $conn->prepare("INSERT INTO assessments (student_id, students_class, score, stress_level, raw_answers) VALUES (?, ?, ?, ?, ?)");
    $rawAnswersJson = json_encode($rawAnswers);
    $stmt->bind_param("isiss", $studentId, $studentsClass, $finalScore, $stressLevel, $rawAnswersJson);

    if (!$stmt->execute()) {
        throw new Exception("Error inserting assessment: " . $stmt->error);
    }

    $conn->commit(); // Commit the transaction

    http_response_code(201); // Created
    echo json_encode([
        "message" => "Assessment submitted successfully!",
        "score" => $finalScore,
        "stressLevel" => $stressLevel
    ]);

} catch (Exception $e) {
    $conn->rollback(); // Rollback on error
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Failed to submit assessment", "error" => $e->getMessage()]);
} finally {
    // Close the statement and connection
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>