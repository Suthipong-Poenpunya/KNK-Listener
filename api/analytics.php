<?php
require_once 'db_connect.php'; // Include the database connection file

try {
    // In a real application, add authentication/authorization here

    // Select students_class without any WHERE clause for filtering
    $sql = "SELECT assessment_date, score, stress_level, students_class FROM assessments ORDER BY assessment_date ASC";

    $stmt = $conn->prepare($sql);

    // No parameters to bind since no filtering is applied

    $stmt->execute();
    $result = $stmt->get_result();

    $analyticsData = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $analyticsData[] = $row;
        }
    }

    http_response_code(200); // OK
    echo json_encode($analyticsData);

} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Failed to fetch analytics data", "error" => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>