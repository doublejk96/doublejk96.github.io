<?php
	$host = "kmeiguitar.cafe24.com";
	$user = "kmeiguitar";
	$password = "Wjdwls32!@";
	$dbName = "kmeiguitar";
	
	$connect = mysqli_connect($host, $user,$password, $dbName);
	if (!$connect) 
		die("접속 실패 : ". mysqli_connect_error());
	

	$fetchQuery = "SELECT * FROM suika_score ORDER BY score DESC LIMIT 7";
	$result = $connect->query($fetchQuery);
	
	$data = array();

	if($result->num_rows > 0)
	{
		while($row = $result->fetch_assoc())
		{
			$ip = $row["ip"];
			$score = $row["score"];	
			$data[$ip] = $score;
		}
	}
	
	$json = json_encode($data);
    echo $json;

	if ($_SERVER["REQUEST_METHOD"] === "POST") 
	{
		$ip = $_POST["ip"];
		$score = $_POST["score"];

		$getScoreQuery = "SELECT score FROM suika_score WHERE ip = '$ip'";
		$result = $connect->query($getScoreQuery);

		if ($result && $result->num_rows > 0) 
		{
			$row = $result->fetch_assoc();
			$currentScore = (int)$row["score"];
			$newScore = (int)$score;

			if ($newScore > $currentScore) 
			{
				// 중복된 IP가 있고, 새로운 점수가 기존 점수보다 높으면 업데이트
				$deleteQuery = "DELETE FROM suika_score WHERE ip = '$ip'";
				if ($connect->query($deleteQuery) === TRUE) 
				{
					echo "기존 데이터 삭제 성공<br>";
				} 
				else 
				{
					echo "기존 데이터 삭제 실패: " . $connect->error;
				}

				$insertQuery = "INSERT INTO suika_score (ip, Score) VALUES ('$ip', '$score')";
				if ($connect->query($insertQuery) === TRUE) 
				{
					echo "데이터 추가 성공";
				} 
				else 
				{
					echo "데이터 추가 실패: " . $connect->error;
				}
			} 
			else 
			{
				echo "새로운 점수가 기존 점수보다 작거나 같습니다. 데이터를 업데이트하지 않습니다.";
			}
		} 
		else 
		{
			// 중복된 IP가 없으면 새로운 데이터 추가
			$insertQuery = "INSERT INTO suika_score (ip, Score) VALUES ('$ip', '$score')";
			if ($connect->query($insertQuery) === TRUE) 
			{
				echo "데이터 추가 성공";
			} 
			else 
			{
				echo "데이터 추가 실패: " . $connect->error;
			}
		}
	}
?>
