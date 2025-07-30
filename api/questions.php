<?php
require_once 'db_connect.php'; // Include the database connection file

try {
    // Prepare and execute the query to fetch questions
    $sql = "SELECT question_id, question_text, question_order, weight FROM questions ORDER BY question_order ASC";
    $result = $conn->query($sql);

    $questions = [];
    if ($result->num_rows > 0) {
        // Fetch all rows and add to the questions array
        while($row = $result->fetch_assoc()) {
            $questions[] = $row;
        }
    }

    // Return questions as JSON
    http_response_code(200); // OK
    echo json_encode($questions);

} catch (Exception $e) {
    // Handle any exceptions during query execution
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Failed to fetch questions", "error" => $e->getMessage()]);
} finally {
    // Close the database connection
    $conn->close();
}
?>