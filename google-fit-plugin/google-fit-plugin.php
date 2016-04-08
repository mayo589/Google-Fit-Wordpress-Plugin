<?php
/**
 * Plugin Name: Google Fit Wordpress Plugin
 * Plugin URI: http://mihalech.com
 * Description: TODO
 * Version: 1.0.0
 * Author: Marek Mihalech
 * Author URI: http://mihalech.com
 * License: MIT
 */


add_action( 'admin_init' , 'register_settings' );
//wp_enqueue_script('google-oAuth', plugin_dir_url(__FILE__) . 'js/scripts.js');
add_action('admin_menu', 'plugin_menu');

function register_settings() {
    register_setting( 'google-fit-group', 'google-fit-settings' );

    add_settings_section('googlefitsettingssection', 'Google Fit Settings', 'settings_section_callback', 'google-fit-settings');

	add_settings_field( 'google_app_client_id', 'Google Fit App Client ID', 'settings_field', 'google-fit-settings', 'googlefitsettingssection', array('setting' => 'google-fit-settings', 'field' => 'google_app_client_id', 'label' => '', 'class' => 'regular-text') );
    add_settings_field( 'google_app_client_secret', 'Google Fit App Client Secret','settings_field', 'google-fit-settings', 'googlefitsettingssection', array('setting' => 'google-fit-settings', 'field' => 'google_app_client_secret', 'label' => '', 'class' => 'regular-text') );
    add_settings_field( 'google_app_redirect_uri', 'Google Fit App Redirect URI', 'settings_field', 'google-fit-settings', 'googlefitsettingssection', array('setting' => 'google-fit-settings', 'field' => 'google_app_redirect_uri', 'label' => '', 'class' => 'regular-text') );
}

function plugin_menu()
{
	add_options_page( 'Google Fit Settings' , 'Google Fit Settings' , 'manage_options' , 'google-fit-settings' ,  'settings_page'  );
} 

function settings_field( $args ) {
    
	$settingname = esc_attr( $args['setting'] );
    $setting = get_option($settingname);
    $field = esc_attr( $args['field'] );
    $label = esc_attr( $args['label'] );
    $class = esc_attr( $args['class'] );
    $default = ($args['default'] ? esc_attr( $args['default'] ) : '' );
    $value = (($setting[$field] && strlen(trim($setting[$field]))) ? $setting[$field] : $default);
    echo '<input type="text" name="' . $settingname . '[' . $field . ']" id="' . $settingname . '[' . $field . ']" class="' . $class . '" value="' . $value . '" /><p class="description">' . $label . '</p>';
  }

function settings_section_callback() {
	echo ' You need to enter your Google App informations to be able get data from Google Fit API.';
}

function settings_page() {
	if (!current_user_can('manage_options')) {
      wp_die( __('You do not have permissions to access this page.') );
    }
	?>
	<div class="wrap">
		<h2>Google Fit Plugin Settings</h2>
		<p>
			Please, go to 
			<a href="https://console.developers.google.com">Google Developer Console</a>
			to setup your new app for Google Fit REST API 
			(Click <a href="#">here</a>, if you need help)
		</p>
		<form action="options.php" method="POST">
			<?php settings_fields( 'google-fit-group' ); ?>
			<?php do_settings_sections( 'google-fit-settings' ); ?>
			<?php submit_button(); ?>
		</form>
		<br />
		<?php
		setAllTokens();
		?>

		Auth token: <?php echo get_option('google_app_auth_token', "") ?><br />
		Access token: <?php echo get_option('google_app_access_token', "") ?><br />
		Access token expiration: <?php echo get_option('google_app_access_token_exp', "") ?><br />
		Refresh token: <?php echo get_option('google_app_refresh_token', "") ?><br />
		<input type=button
        value="Reset Tokens"
        onclick="self.location = 'options-general.php?page=google-fit-settings&resetTokens=true'" />

	</div>
	<?php
}

function setAllTokens(){
	date_default_timezone_set(get_option('timezone_string'));
	if (isset($_GET['resetTokens'])) {
		resetTokens();
	    $url = strtok($_SERVER["REQUEST_URI"],'?') . "?page=google-fit-settings";
		header("Location: ".$url);
		die();
	}
	$settings = get_option('google-fit-settings', "");
	$auth_token = get_option('google_app_auth_token', "");
	$access_token = get_option('google_app_access_token', "");
	$access_token_exp = get_option('google_app_access_token_exp', "");
	$refresh_token = get_option('google_app_refresh_token', "");

	if($settings["google_app_client_id"] != "" && $settings["google_app_redirect_uri"] != "" && $settings["google_app_client_secret"] != ""){
		if($auth_token === ""){
			//First, need to obtain and store Authorization Token
			$auth_token = getAuthToken($settings["google_app_client_id"] , $settings["google_app_redirect_uri"]);
			update_option("google_app_auth_token", $auth_token);
		}
		$now = strtotime( date('d/m/Y h:i:s', time()) );

		//We now have auth token
		if($access_token !== "" && $access_token_exp !== "" && strtotime($access_token_exp) > $now){
			//Access Token is saved and still valid

		}
		else if($access_token !== "" && $access_token_exp !== "" && strtotime($access_token_exp) <= $now && $refresh_token !== ""){
			echo "now is ".date('d/m/Y h:i:s', time()). "exp is ". $access_token_exp;
			//Access Token is saved, but expired, obtaining new with Refresh Token
			$response = getAccessRefreshTokens($auth_token, $settings["google_app_client_id"], $settings["google_app_client_secret"], $settings["google_app_redirect_uri"], $refresh_token);
			update_option("google_app_access_token", $response->access_token);
			$expDateTime = date('d/m/Y h:i:s', time() + (intval($response->expires_in) - 100));
			update_option("google_app_access_token_exp", $expDateTime);
		}
		else{
			//Access Token is not saved yet
			$response = getAccessRefreshTokens($auth_token, $settings["google_app_client_id"], $settings["google_app_client_secret"], $settings["google_app_redirect_uri"], null);
			update_option("google_app_access_token", $response->access_token);
			update_option("google_app_refresh_token", $response->refresh_token);
			$expDateTime = date('d/m/Y h:i:s', time() + (intval($response->expires_in) - 100));
			update_option("google_app_access_token_exp", $expDateTime);
		}
	}
	date_default_timezone_set('UTC'); //Need to set back to UTC - wordpress Default
}

function resetTokens(){
	update_option("google_app_auth_token", "");
	update_option("google_app_access_token", "");
	update_option("google_app_access_token_exp", "");
	update_option("google_app_refresh_token", "");
}

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

function getAccessRefreshTokens($auth_token, $client_id, $client_secret,$client_redirect, $refresh_token){
    $url = 'https://accounts.google.com/o/oauth2/token';
	$params = array(
			"client_id" => $client_id,
			"client_secret" => $client_secret,
	);

	if($refresh_token == null || $refresh_token == ""){
		$params["code"] = $auth_token;
		$params["redirect_uri"] = $client_redirect;
		$params["grant_type"] = "authorization_code";
	}
	else{
		$params["grant_type"] = "refresh_token";
		$params["refresh_token"] = $refresh_token;
	}

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

?>