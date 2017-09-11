<?php

function getAuthToken($client_id, $client_redirect){
	if(isset($_GET['code'])) {
		return $_GET['code'];
	}
	else{
		
		$url = 'https://accounts.google.com/o/oauth2/auth';
		$scope = "https://www.googleapis.com/auth/fitness.activity.read+https://www.googleapis.com/auth/fitness.activity.write+https://www.googleapis.com/auth/fitness.body.read+https://www.googleapis.com/auth/fitness.body.write+https://www.googleapis.com/auth/fitness.location.read+https://www.googleapis.com/auth/fitness.location.write";
		$params = array(
			"scope" => stripslashes($scope),
			"client_id" => $client_id,
			"redirect_uri" => $client_redirect,
			"response_type" => "code",
			"approval_prompt" => "force",
			"access_type" => "offline"
		);

		$request_to = $url . '?' . urldecode(http_build_query($params));
		header("Location: " . $request_to);
	}
}

function getAccessToken($auth_token, $client_id, $client_secret,$client_redirect){
    $url = 'https://accounts.google.com/o/oauth2/token';
	$params = array(
			"client_id" => $client_id,
			"client_secret" => $client_secret,
	);

	$params["code"] = $auth_token;
	$params["redirect_uri"] = $client_redirect;
	$params["grant_type"] = "authorization_code";
	
	$ch = curl_init($url);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS,  urldecode(http_build_query($params)));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($ch);
	$responseObj = json_decode($response);
	if($responseObj->error != null){
		echo "<b> Error in getting Access Token: </b>";
		echo $responseObj->error.' - ';
		echo $responseObj->error_description."<br /><br />";
		return null;
	}
	else{
		return $responseObj;
	}
}

function getRefreshToken($auth_token, $client_id, $client_secret,$client_redirect){
    $url = 'https://accounts.google.com/o/oauth2/token';
	$params = array(
			"client_id" => $client_id,
			"client_secret" => $client_secret,
	);

	$params["grant_type"] = "refresh_token";
	$params["refresh_token"] = $refresh_token;

	$ch = curl_init($url);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS,  urldecode(http_build_query($params)));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($ch);
	$responseObj = json_decode($response);
	if($responseObj->error != null){
		echo "<b> Error in getting Refresh Token: </b>";
		echo $responseObj->error.' - ';
		echo $responseObj->error_description."<br /><br />";
		return null;
	}
	else{
		return $responseObj;
	}
}

function getAggregatedData($dataTypeName, $startDateMillis, $endDateMillis, $bucketMillis, $accessToken){
    $url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";
    

    $data_string = "{\"aggregateBy\": 
        [
            {\"dataTypeName\": \"" . $dataTypeName . "\"}
        ],
        \"endTimeMillis\": \"" . $endDateMillis . "\",
        \"startTimeMillis\": \"" . $startDateMillis . "\",
        \"bucketByTime\": {
            \"durationMillis\": " . $bucketMillis . "
        }
    }";
                                                                                  
    $ch = curl_init($url);                                                                      
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");                                                                     
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);                                                                  
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);                                                                      
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
        'Content-Type: application/json',                                                                                
        'Content-Length: ' . strlen($data_string),
        'Authorization: Bearer ' . $accessToken)                                                                       
    );                
       var_dump($data_string);                                                                                                                                                                                                        
    $result = curl_exec($ch);
    var_dump($result);
}

?>