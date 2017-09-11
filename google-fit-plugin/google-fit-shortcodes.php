<?php
    wp_enqueue_style('jqueryDateTimePickerCss', plugin_dir_url(__FILE__) . 'css/jquery.datetimepicker.css');

    wp_enqueue_script('charts-js', plugin_dir_url(__FILE__) . 'js/chart.js');
    wp_enqueue_script('randomColor', plugin_dir_url(__FILE__) . 'js/randomColor.js');
    wp_enqueue_script('jqueryDateTimePickerJs', plugin_dir_url(__FILE__) . 'js/jquery.datetimepicker.js', array('jquery'));
    wp_enqueue_script('utilities', plugin_dir_url(__FILE__) . 'js/utilities.js');
    wp_enqueue_script('google-oAuth-Rest-Client', plugin_dir_url(__FILE__) . 'js/GoogleFitRest.js');
    wp_enqueue_script('gfitRest', plugin_dir_url(__FILE__) . 'js/gFitRest.js');
    
    //TODO ensure or refresh access token... need to create separate google-fit-api.php

    // [google-fit foo="foo-value"]
    function google_fit_shotcode( $atts ) {
        $a = shortcode_atts( array(
            'foo' => 'default foo',
            'test' => 'default test',
        ), $atts );

?>
        <script type="text/javascript">
            var today = new Date();
            var startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10, 0, 0, 0, 0);
            var endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 0);
            window.google_app_access_token = <? echo "'".get_option('google_app_access_token', "")."'";  ?>;
            //alert(new GoogleFitRest( <?  echo "'".get_option('google_app_access_token', "")."'"; ?>  ).getTotalDistance(startDate, endDate, [58]));
        </script>
<?php
        //return "foo = {$a['foo']}". "test = {$a['test']}" . get_option('google_app_refresh_token', "");
        return '<div id="stats">
        <hr>
        <canvas id="chart-calories" width="400" height="250" style="display: inline-block;"></canvas>
        <canvas id="chart-distance" width="400" height="250" style="display: inline-block;"></canvas>
        <canvas id="chart-steps" width="400" height="250" style="display: inline-block;"></canvas>
        <br>
        <canvas id="chart-activities" width="1200" height="400" style="display: inline-block;"></canvas>
        <canvas id="chart-month-pie" width="400" height="400" style="display: inline-block;"></canvas>
        <br><br>
        <input id="stats-calendar" type="text">
        <table id="stats-calendar-day">
          <tr class="day-header">
            <td>Date</td>
            <td></td>
          </tr>
          <tr class="day-steps">
            <td>Steps</td>
            <td></td>
          </tr>
          <tr class="day-cals">
            <td>Calories</td>
            <td></td>
          </tr>
          <tr class="day-distance">
            <td>Distance</td>
            <td></td>
          </tr>
          <tr class="day-activities">
            <td colspan="2"><b>Sport Activities</b></td>
          </tr>
        </table>
      </div>';
    }

?>
